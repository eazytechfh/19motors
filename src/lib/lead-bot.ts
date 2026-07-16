const WEBHOOK_ATIVAR =
  'https://n8n.eazy.tec.br/webhook/270dc2bb-e82c-4698-9ca7-34d0f85b14b4';
const WEBHOOK_DESATIVAR =
  'https://n8n.eazy.tec.br/webhook/bdc2aa7b-85ad-4df4-86a3-f49f954f6f38';

export function criarAcionamentoBot(
  leadId: number,
  ativo: boolean,
  nomeLead?: string,
  telefone?: string,
) {
  if (!Number.isInteger(leadId) || leadId <= 0) {
    throw new Error('Lead inválido.');
  }

  return {
    url: ativo ? WEBHOOK_ATIVAR : WEBHOOK_DESATIVAR,
    payload: {
      id: leadId,
      id_lead: leadId,
      bot_ativo: ativo,
      nome_lead: nomeLead ?? '',
      telefone: telefone ?? '',
    },
  };
}

export function estaComBotAtivo(valor: boolean | string | null | undefined) {
  return valor === true || valor === 'true';
}
