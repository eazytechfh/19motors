import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const drawer = () => readFileSync('src/components/LeadDrawer.tsx', 'utf8');
const route = () => readFileSync('src/app/api/leads/[id]/route.ts', 'utf8');

test('a rota valida autenticação, cargo, empresa e confirma o registro excluído', () => {
  const source = route();

  assert.match(source, /export async function DELETE/);
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /admin_master[\s\S]*admin[\s\S]*gerente/);
  assert.match(source, /\.eq\('id_empresa',\s*1\)/);
  assert.match(source, /\.delete\(\)[\s\S]*\.select\('id'\)[\s\S]*\.maybeSingle\(\)/);
  assert.match(source, /registroExcluido\.id !== leadId/);
});

test('a autorização no banco impede que um usuário comum promova o próprio cargo', () => {
  const sql = readFileSync('supabase/migrations/0012_proteger_cargo_profiles.sql', 'utf8');

  assert.match(sql, /before update of cargo on public\.profiles/i);
  assert.match(sql, /new\.cargo is distinct from old\.cargo/i);
  assert.match(sql, /get_my_cargo\(\) not in \('admin_master', 'admin', 'gerente'\)/i);
  assert.match(sql, /raise exception 'Sem permissão para alterar cargo\.'/i);
});

test('o painel exige confirmação acessível e mantém estados de carregamento e erro', () => {
  const source = drawer();

  assert.match(source, /Excluir lead/);
  assert.match(source, /Esta ação é permanente e não poderá ser desfeita\./);
  assert.match(source, /Confirmar exclusão/);
  assert.match(source, /Tem certeza de que deseja excluir o lead \{lead\.nome_lead\}\?/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby="confirmar-exclusao-titulo"/);
  assert.match(source, /Excluindo\.\.\./);
  assert.match(source, /Não foi possível excluir o lead\. Verifique se você tem permissão para esta ação\./);
  assert.match(source, /disabled=\{excluindo\}/);
  assert.match(source, /border-t border-gray-200 pt-5/);
});

test('todos os consumidores removem o lead localmente e fecham o painel', () => {
  const consumers = [
    'src/app/(app)/leads/page.tsx',
    'src/app/(app)/pipeline/page.tsx',
    'src/components/NegociacaoTimerWatcher.tsx',
  ];

  for (const file of consumers) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /onDeleted=\{\(leadId\) =>/);
    assert.match(source, /\.filter\(\(.*\) => .*\.id !== leadId\)/);
    assert.match(source, /setLeadSelecionado\(null\)/);
  }
});
