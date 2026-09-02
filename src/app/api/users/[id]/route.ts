import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  distribuirIgualmente,
  destinoRedistribuicao,
  REDISTRIBUIR_IGUALMENTE,
} from '@/lib/vendedores/desativacao';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', userData.user.id)
    .single();
  const requesterCargo = (requesterProfile as { cargo: string } | null)?.cargo;
  if (!['admin_master', 'admin', 'gerente'].includes(requesterCargo ?? '')) {
    return NextResponse.json({ error: 'Permissão insuficiente.' }, { status: 403 });
  }
  if (params.id === userData.user.id) {
    return NextResponse.json({ error: 'Você não pode excluir a própria conta.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Assim como na desativação (ban/route.ts), a tabela VENDEDORES não tem FK para profiles —
  // é vinculada só pelo nome — e não possui coluna de "ativo/inativo": um vendedor só existe
  // nessa tabela enquanto está disponível para receber leads na fila de atendimento.
  const recalcularContagens = async (): Promise<string | null> => {
    const { data: vendedores, error: vendedoresError } = await admin.from('VENDEDORES').select('id,vendedor');
    if (vendedoresError) return vendedoresError.message;

    for (const vendedor of vendedores ?? []) {
      const row = vendedor as { id: number; vendedor: string | null };
      if (!row.vendedor) continue;
      const { count, error: countError } = await admin
        .from('BASE_DE_LEADS')
        .select('id', { count: 'exact', head: true })
        .eq('vendedor', row.vendedor);
      if (countError) return countError.message;
      const { error: updateError } = await admin
        .from('VENDEDORES')
        .update({ quantos_lead: count ?? 0 })
        .eq('id', row.id);
      if (updateError) return updateError.message;
    }
    return null;
  };

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('cargo, nome')
    .eq('id', params.id)
    .maybeSingle();
  const target = targetProfile as { cargo: string; nome: string | null } | null;
  if (!target || target.cargo !== 'vendedor' || !target.nome) {
    return NextResponse.json({ error: 'Vendedor não encontrado.' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  let redistribuirPara: string | null;
  try {
    redistribuirPara = destinoRedistribuicao(body.redistribuirPara, target.nome);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  if (redistribuirPara && redistribuirPara !== REDISTRIBUIR_IGUALMENTE) {
    const { data: destinoAtivo } = await admin
      .from('VENDEDORES')
      .select('id')
      .eq('vendedor', redistribuirPara)
      .maybeSingle();
    if (!destinoAtivo) {
      return NextResponse.json({ error: 'O vendedor escolhido não está ativo.' }, { status: 400 });
    }
  }

  const { data: vendedorRow } = await admin
    .from('VENDEDORES')
    .select('*')
    .eq('vendedor', target.nome)
    .maybeSingle();
  let leadIds: number[] = [];

  if (redistribuirPara === REDISTRIBUIR_IGUALMENTE) {
    const [{ data: leads, error: leadsError }, { data: vendedoresAtivos, error: vendedoresError }] = await Promise.all([
      admin.from('BASE_DE_LEADS').select('id').eq('vendedor', target.nome).order('id'),
      admin.from('VENDEDORES').select('vendedor').neq('vendedor', target.nome).order('id'),
    ]);
    if (leadsError || vendedoresError) {
      return NextResponse.json({ error: 'Não foi possível preparar a redistribuição dos leads.' }, { status: 400 });
    }

    leadIds = (leads ?? []).map((lead) => (lead as { id: number }).id);
    let grupos: ReturnType<typeof distribuirIgualmente<number>>;
    try {
      grupos = distribuirIgualmente(
        leadIds,
        (vendedoresAtivos ?? []).flatMap((row) => {
          const nome = (row as { vendedor: string | null }).vendedor;
          return nome ? [nome] : [];
        }),
      );
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    for (const grupo of grupos) {
      if (!grupo.itens.length) continue;
      const { error } = await admin.from('BASE_DE_LEADS').update({ vendedor: grupo.vendedor }).in('id', grupo.itens);
      if (error) {
        if (leadIds.length) await admin.from('BASE_DE_LEADS').update({ vendedor: target.nome }).in('id', leadIds);
        return NextResponse.json({ error: `Não foi possível redistribuir os leads: ${error.message}` }, { status: 400 });
      }
    }
  } else {
    const { data: leadsAlterados, error: leadsError } = await admin
      .from('BASE_DE_LEADS')
      .update({ vendedor: redistribuirPara })
      .eq('vendedor', target.nome)
      .select('id');
    if (leadsError) {
      return NextResponse.json({ error: `Não foi possível redistribuir os leads: ${leadsError.message}` }, { status: 400 });
    }
    leadIds = (leadsAlterados ?? []).map((lead) => (lead as { id: number }).id);
  }

  const restaurarLeads = async () => {
    if (leadIds.length) await admin.from('BASE_DE_LEADS').update({ vendedor: target.nome }).in('id', leadIds);
    await recalcularContagens();
  };

  const contagemError = await recalcularContagens();
  if (contagemError) {
    await restaurarLeads();
    return NextResponse.json({ error: `Não foi possível atualizar a contagem dos vendedores: ${contagemError}` }, { status: 400 });
  }

  const { error: vendedorError } = await admin.from('VENDEDORES').delete().eq('vendedor', target.nome);
  if (vendedorError) {
    await restaurarLeads();
    return NextResponse.json({ error: `Não foi possível excluir o vendedor: ${vendedorError.message}` }, { status: 400 });
  }

  const { error: authError } = await admin.auth.admin.deleteUser(params.id);
  if (authError) {
    if (vendedorRow) await admin.from('VENDEDORES').insert(vendedorRow);
    await restaurarLeads();
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, leadsRedistribuidos: leadIds.length });
}
