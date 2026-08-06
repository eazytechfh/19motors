const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('migration instala o contrato completo do follow-up manual', () => {
  const sql = read('supabase/migrations/0017_follow_up_manual_completo.sql').toLowerCase();

  assert.match(sql, /add column if not exists ja_recebeu_msg text/);
  assert.match(sql, /add column if not exists erro_follow_manual text/);
  assert.match(sql, /create table if not exists public\.pipeline_etapas/);
  assert.match(sql, /'follow_up'[\s\S]*'respondeu_follow_up'[\s\S]*'resgate'/);
  assert.match(sql, /create or replace function public\.sync_follow_manual_from_estagio/);
  assert.match(sql, /new\.follow_manual := case[\s\S]*new\.estagio_lead[\s\S]*= 'follow_up'/);
  assert.match(sql, /create trigger trg_sync_follow_manual_from_estagio/);
  assert.match(sql, /before insert or update of estagio_lead, follow_manual/);
  assert.match(sql, /create trigger trg_impedir_exclusao_etapa_protegida/);
  assert.match(sql, /c\.conname in \([\s\S]*'base_de_leads_estagio_lead_check'/);
  assert.doesNotMatch(sql, /position\('estagio_lead' in lower\(pg_get_constraintdef/);
});

test('resposta humana move apenas lead elegível para Respondeu Follow Up', () => {
  const sql = read('supabase/migrations/0017_follow_up_manual_completo.sql').toLowerCase();

  assert.match(sql, /create or replace function public\.mover_resposta_para_respondeu_follow_up/);
  assert.match(sql, /new\.message\s*->>\s*'type'[\s\S]*in \('human', 'user'\)/);
  assert.match(sql, /regexp_replace\(l\.telefone[\s\S]*regexp_replace\(new\.session_id::text/);
  assert.match(sql, /set estagio_lead = 'respondeu_follow_up'/);
  assert.match(sql, /l\.estagio_lead = 'follow_up'/);
  assert.match(sql, /on public\.dezenovemotors_chat_histories/);
  assert.match(sql, /insert into public\.lead_historico_estagio/);
  assert.doesNotMatch(sql, /nullif\(btrim\(coalesce\(l\.ja_recebeu_msg/);
  assert.doesNotMatch(sql, /bom dia/i);
});

test('contrato legado do workflow duplicado sincroniza etiquetas para a relação normalizada', () => {
  const sql = read('supabase/migrations/0017_follow_up_manual_completo.sql').toLowerCase();

  assert.match(sql, /'número inválido'/i);
  assert.match(sql, /'follow 1'/);
  assert.match(sql, /'follow 2'/);
  assert.match(sql, /add column if not exists etiquetas bigint\[\] not null default '\{\}'::bigint\[\]/);
  assert.match(sql, /create or replace function public\.compatibilizar_etiquetas_workflow_ales/);
  assert.match(sql, /27[\s\S]*'número inválido'/i);
  assert.match(sql, /28[\s\S]*'follow 1'/);
  assert.match(sql, /29[\s\S]*'follow 2'/);
  assert.match(sql, /create trigger trg_compatibilizar_etiquetas_workflow_ales/);
  assert.match(sql, /insert into public\.lead_etiquetas/);
  assert.doesNotMatch(sql, /insert into public\.etiquetas[\s\S]*\(27,|\(28,|\(29,/);
});

test('workflow legado pode manter o valor literal da segunda mensagem', () => {
  const sql = read('supabase/migrations/0017_follow_up_manual_completo.sql').toLowerCase();
  const types = read('src/types/database.ts');

  assert.match(sql, /ja_recebeu_msg in \('segundo_follow', '2º msg'\)/);
  assert.match(types, /etiquetas: number\[\]/);
});

test('fim da cadência move para Resgate sem marcar número inválido', () => {
  const sql = read('supabase/migrations/0017_follow_up_manual_completo.sql').toLowerCase();

  assert.match(sql, /create or replace function public\.encerrar_follow_up_sem_resposta/);
  assert.match(sql, /ja_recebeu_msg in \('segundo_follow', '2º msg'\)/);
  assert.match(sql, /set estagio_lead = 'resgate'/);
  assert.match(sql, /cadência encerrada sem resposta/);
});

test('erro transitório permanece no Follow-up e somente número inválido vai para Resgate', () => {
  const sql = read('supabase/migrations/0017_follow_up_manual_completo.sql').toLowerCase();

  assert.match(sql, /if v_numero_invalido then[\s\S]*set[\s\S]*estagio_lead = 'resgate'/);
  assert.match(sql, /else[\s\S]*set erro_follow_manual[\s\S]*where id = p_id_lead/);
  assert.match(sql, /is not on whatsapp|not registered|invalid number/);
});

test('pipeline usa etapas configuradas e mantém fallback para o trio de follow-up', () => {
  const pipeline = read('src/app/(app)/pipeline/page.tsx');
  const stages = read('src/lib/pipeline-etapas.ts');
  const hook = read('src/hooks/usePipelineEtapas.ts');

  assert.match(pipeline, /usePipelineEtapas/);
  assert.match(pipeline, /const \{ etapas, erroEtapas \} = usePipelineEtapas\(\)/);
  assert.match(stages, /respondeu_follow_up/);
  assert.match(stages, /resgate/);
  assert.match(hook, /\.from\('pipeline_etapas'\)/);
});

test('changelog documenta ativação e variáveis do workflow', () => {
  const changelog = read('docs/CHANGELOG.md');

  assert.match(changelog, /Follow-up Manual Completo/);
  assert.match(changelog, /workflow duplicado da Ale's Car/);
  assert.match(changelog, /credencial do Supabase/);
  assert.match(changelog, /token e a URL da UAZAPI/);
  assert.match(changelog, /Respondeu Follow Up/);
  assert.doesNotMatch(changelog, /mover_follow_up_bom_dia|follow_up_bom_dia/i);
});
