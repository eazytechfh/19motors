import { NextResponse } from 'next/server';
import { criarAcionamentoBot } from '@/lib/lead-bot';
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

  const { data: lead } = await supabase
    .from('BASE_DE_LEADS')
    .select('id, nome_lead, telefone')
    .eq('id', leadId)
    .maybeSingle();

  if (!lead) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  }

  const acionamento = criarAcionamentoBot(leadId, ativo, lead.nome_lead, lead.telefone);

  try {
    const response = await fetch(acionamento.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acionamento.payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'A automação não aceitou a alteração.' }, { status: 502 });
    }

    return NextResponse.json({ bot_ativo: ativo });
  } catch {
    return NextResponse.json({ error: 'Não foi possível contatar a automação.' }, { status: 502 });
  }
}
