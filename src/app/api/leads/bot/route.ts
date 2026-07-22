import { NextResponse } from 'next/server';
import { estaComBotAtivo } from '@/lib/lead-bot';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const leadId = body?.leadId;
  const ativo = body?.ativo;

  if (!Number.isInteger(leadId) || leadId <= 0 || typeof ativo !== 'boolean') {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data: leadAtualizado, error } = await supabase
    .from('BASE_DE_LEADS')
    .update({ bot_ativo: ativo })
    .eq('id', leadId)
    .eq('id_empresa', 1)
    .eq('bot_ativo', !ativo)
    .select('id, bot_ativo, bot_ativo_alterado_em')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Não foi possível alterar o status da IA.' }, { status: 500 });
  }

  if (!leadAtualizado) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  }

  if (
    leadAtualizado.id !== leadId ||
    estaComBotAtivo(leadAtualizado.bot_ativo) !== ativo ||
    !leadAtualizado.bot_ativo_alterado_em
  ) {
    return NextResponse.json({ error: 'O banco não confirmou a alteração da IA.' }, { status: 409 });
  }

  return NextResponse.json(leadAtualizado);
}
