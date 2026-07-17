import assert from 'node:assert/strict';
import test from 'node:test';

import { criarAtualizacaoObservacao, MENSAGEM_OBSERVACAO_SALVA } from './observacao.ts';

test('reinicia o ciclo de notificação para 30 minutos após salvar a observação', () => {
  const atualizacao = criarAtualizacaoObservacao('Cliente pediu simulação', new Date('2026-07-17T15:00:00.000Z'));

  assert.deepEqual(atualizacao, {
    observacao_vendedor: 'Cliente pediu simulação',
    negociacao_expira_em: '2026-07-17T15:30:00.000Z',
    negociacao_notificado_em: null,
    negociacao_notificacao_status: null,
    negociacao_notificacao_tentativas: 0,
    negociacao_notificacao_erro: null,
    negociacao_notificacao_reivindicada_em: null,
  });
});

test('expõe a mensagem de confirmação exigida pelo card', () => {
  assert.equal(MENSAGEM_OBSERVACAO_SALVA, 'Observação salva com sucesso');
});
