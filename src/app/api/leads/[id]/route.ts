import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CARGOS_AUTORIZADOS = new Set(['admin_master', 'admin', 'gerente']);

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const leadId = Number(params.id);
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return NextResponse.json({ error: 'Lead inválido.' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile || !CARGOS_AUTORIZADOS.has(profile.cargo)) {
    return NextResponse.json({ error: 'Sem permissão para excluir leads.' }, { status: 403 });
  }

  const { data: registroExcluido, error } = await supabase
    .from('BASE_DE_LEADS')
    .delete()
    .eq('id', leadId)
    .eq('id_empresa', 1)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Não foi possível excluir o lead.' }, { status: 500 });
  }

  if (!registroExcluido || registroExcluido.id !== leadId) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ id: registroExcluido.id });
}
