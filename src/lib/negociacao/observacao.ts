const TRINTA_MINUTOS_MS = 30 * 60 * 1000;

export const MENSAGEM_OBSERVACAO_SALVA = 'Observação salva com sucesso';

export function criarAtualizacaoObservacao(observacao: string, agora = new Date()) {
  return {
    observacao_vendedor: observacao,
    negociacao_expira_em: new Date(agora.getTime() + TRINTA_MINUTOS_MS).toISOString(),
    negociacao_notificado_em: null,
    negociacao_notificacao_status: null,
    negociacao_notificacao_tentativas: 0,
    negociacao_notificacao_erro: null,
    negociacao_notificacao_reivindicada_em: null,
  };
}
