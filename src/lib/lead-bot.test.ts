import assert from 'node:assert/strict';
import test from 'node:test';

import { criarAcionamentoBot } from './lead-bot.ts';

test('envia nome e telefone do lead no webhook de ativação', () => {
  assert.deepEqual(criarAcionamentoBot(42, true, 'Fernanda', '5541992114275'), {
    url: 'https://n8n.eazy.tec.br/webhook/270dc2bb-e82c-4698-9ca7-34d0f85b14b4',
    payload: {
      id: 42,
      id_lead: 42,
      bot_ativo: true,
      nome_lead: 'Fernanda',
      telefone: '5541992114275',
    },
  });
});

test('envia nome e telefone do lead no webhook de desativação', () => {
  assert.deepEqual(criarAcionamentoBot(9, false, 'Fernando', '5541992114275'), {
    url: 'https://n8n.eazy.tec.br/webhook/bdc2aa7b-85ad-4df4-86a3-f49f954f6f38',
    payload: {
      id: 9,
      id_lead: 9,
      bot_ativo: false,
      nome_lead: 'Fernando',
      telefone: '5541992114275',
    },
  });
});

test('recusa identificador de lead inválido', () => {
  assert.throws(() => criarAcionamentoBot(0, true), /Lead inválido/);
});
