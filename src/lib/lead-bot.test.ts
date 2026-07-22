import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { estaComBotAtivo } from './lead-bot.ts';

test('normaliza o estado persistido da IA', () => {
  assert.equal(estaComBotAtivo(true), true);
  assert.equal(estaComBotAtivo('true'), true);
  assert.equal(estaComBotAtivo(false), false);
  assert.equal(estaComBotAtivo(null), false);
});

test('a rota altera a IA no banco e não envia webhook', () => {
  const source = readFileSync('src/app/api/leads/bot/route.ts', 'utf8');

  assert.doesNotMatch(source, /webhook|criarAcionamentoBot|fetch\s*\(/i);
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /\.update\(\{\s*bot_ativo:\s*ativo\s*\}\)/);
  assert.match(source, /\.eq\('id',\s*leadId\)/);
  assert.match(source, /\.eq\('id_empresa',\s*1\)/);
  assert.match(source, /\.eq\('bot_ativo',\s*!ativo\)/);
  assert.match(source, /\.select\('id, bot_ativo, bot_ativo_alterado_em'\)/);
  assert.match(source, /leadAtualizado\.id !== leadId/);
  assert.match(source, /estaComBotAtivo\(leadAtualizado\.bot_ativo\) !== ativo/);
});

test('o banco registra a hora apenas quando o estado da IA muda', () => {
  const sql = readFileSync('supabase/migrations/0013_bot_ativo_ultima_alteracao.sql', 'utf8');

  assert.match(sql, /add column if not exists bot_ativo_alterado_em timestamptz/i);
  assert.match(sql, /alter column bot_ativo set default false/i);
  assert.match(sql, /alter column bot_ativo set not null/i);
  assert.match(sql, /before update of bot_ativo, bot_ativo_alterado_em on public\."BASE_DE_LEADS"/i);
  assert.match(sql, /new\.bot_ativo is distinct from old\.bot_ativo/i);
  assert.match(sql, /new\.bot_ativo_alterado_em := now\(\)/i);
  assert.match(sql, /else\s+new\.bot_ativo_alterado_em := old\.bot_ativo_alterado_em/i);
});

test('o painel mostra estado, data e só aplica uma resposta confirmada', () => {
  const source = readFileSync('src/components/LeadDrawer.tsx', 'utf8');

  assert.match(source, /IA ativa/);
  assert.match(source, /IA inativa/);
  assert.match(source, /Última alteração:/);
  assert.match(source, /não registrada/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /aria-pressed=\{botAtivo\}/);
  assert.match(source, /resultado\?\.id !== lead\.id/);
  assert.match(source, /estaComBotAtivo\(resultado\?\.bot_ativo\) !== novoEstado/);
  assert.match(source, /resultado\?\.bot_ativo_alterado_em/);
  assert.match(source, /Não foi possível alterar o status da IA\. Tente novamente\./);
});

test('as consultas que alimentam leads incluem a última alteração da IA', () => {
  const files = [
    'src/app/(app)/leads/page.tsx',
    'src/app/(app)/pipeline/page.tsx',
    'src/app/(app)/dashboard/page.tsx',
    'src/components/NegociacaoTimerWatcher.tsx',
  ];

  for (const file of files) {
    assert.match(readFileSync(file, 'utf8'), /bot_ativo, bot_ativo_alterado_em/);
  }
});
