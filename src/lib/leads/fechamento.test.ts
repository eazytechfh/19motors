import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { validarDadosParaFechamento } from './fechamento.ts';

test('exige nome e valor positivo para fechar um lead', () => {
  assert.deepEqual(validarDadosParaFechamento({ nome_lead: ' ', valor: null }), {
    valido: false,
    erros: ['Informe o nome do lead.', 'Informe um valor de venda maior que zero.'],
  });
  assert.deepEqual(validarDadosParaFechamento({ nome_lead: 'Ana', valor: 0 }), {
    valido: false,
    erros: ['Informe um valor de venda maior que zero.'],
  });
  assert.deepEqual(validarDadosParaFechamento({ nome_lead: ' Ana ', valor: 85000 }), {
    valido: true,
    erros: [],
  });
});

test('migration impede fechamento inválido e cria auditoria geral com RLS', () => {
  const sql = readFileSync('supabase/migrations/0015_auditoria_leads_e_validacao_fechado.sql', 'utf8');
  assert.match(sql, /create table if not exists public\.lead_logs/i);
  assert.match(sql, /before insert or update[\s\S]*"BASE_DE_LEADS"/i);
  assert.match(sql, /estagio_lead[\s\S]*fechado/i);
  assert.match(sql, /valor[\s\S]*<= 0/i);
  assert.match(sql, /after insert or update[\s\S]*"BASE_DE_LEADS"/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /lead_logs_select_authenticated/i);
  assert.match(sql, /observacao_vendedor/i);
  assert.match(sql, /vendedor/i);
  assert.doesNotMatch(sql, /lead_logs[\s\S]{0,200}on delete cascade/i);
  assert.match(sql, /after insert or update or delete/i);
  assert.match(sql, /lead_excluido/i);
});

test('fechamento exige veículo em combobox pesquisável e usa transação atômica', () => {
  const modal = readFileSync('src/components/FechamentoLeadModal.tsx', 'utf8');
  const pipeline = readFileSync('src/app/(app)/pipeline/page.tsx', 'utf8');
  const sql = readFileSync('supabase/migrations/0016_venda_vinculada_estoque.sql', 'utf8').toLowerCase();

  assert.match(modal, /\.from\('ESTOQUE'\)/);
  assert.match(modal, /placeholder="Digite marca, modelo, ano ou placa"/);
  assert.match(modal, /filteredVehicles/);
  assert.match(modal, /top-full/);
  assert.match(modal, /max-h-60/);
  assert.doesNotMatch(modal, /<select[^>]+value=\{veiculoId\}/);
  assert.match(pipeline, /\.rpc\('fechar_venda_com_veiculo'/);
  assert.match(sql, /estoque_veiculo_id/);
  assert.match(sql, /from public\."estoque"[\s\S]*for update/);
  assert.match(sql, /set status = 'vendido'/);
  assert.match(sql, /coalesce\(public\.get_my_cargo\(\), ''\) not in/);
});
