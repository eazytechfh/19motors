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
  assert.match(sql, /when 49 then 'follow 1'/);
  assert.match(sql, /when 50 then 'follow 2'/);
  assert.match(sql, /when 51 then 'número inválido'/i);
  assert.doesNotMatch(sql, /when (?:27|28|29) then/);
  assert.match(sql, /else[\s\S]*from public\.etiquetas[\s\S]*where id = etiqueta_legada/);
  assert.match(sql, /tg_op = 'update'[\s\S]*old\.etiquetas[\s\S]*new\.etiquetas/);
  assert.match(sql, /foreach etiqueta_legada in array coalesce\(new\.etiquetas, '\{\}'::bigint\[\]\) loop/);
  assert.doesNotMatch(sql, /if new\.etiquetas is null then[\s\S]*return new/);
  assert.match(sql, /create trigger trg_compatibilizar_etiquetas_workflow_ales/);
  assert.match(sql, /insert into public\.lead_etiquetas/);
  assert.doesNotMatch(
    sql,
    /insert into public\.etiquetas\s*\([^)]*\)\s*values\s*\(\s*(?:49|50|51)\b/
  );
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

test('pipeline acompanha movimentações externas de estagio_lead em tempo real', () => {
  const pipeline = read('src/app/(app)/pipeline/page.tsx');
  const migration = read('supabase/migrations/0018_pipeline_leads_realtime.sql').toLowerCase();

  assert.match(pipeline, /\.channel\('pipeline-leads-realtime'\)/);
  assert.match(pipeline, /event:\s*'UPDATE'[\s\S]*table:\s*'BASE_DE_LEADS'/);
  assert.match(pipeline, /payload\.new/);
  assert.match(pipeline, /atualizacoesPendentes/);
  assert.match(pipeline, /if \(carregandoLeads\)[\s\S]*atualizacoesPendentes\.set/);
  assert.match(pipeline, /\.subscribe\(\(status\)[\s\S]*status === 'SUBSCRIBED'[\s\S]*fetchLeads/);
  assert.match(pipeline, /supabase\.removeChannel\(channel\)/);
  assert.match(migration, /alter publication supabase_realtime add table public\."base_de_leads"/);
  assert.match(migration, /duplicate_object/);
});

test('cards exibem etiquetas e vínculos externos atualizam em tempo real', () => {
  const pipeline = read('src/app/(app)/pipeline/page.tsx');
  const filters = read('src/hooks/useLeadFilters.ts');
  const migration = read('supabase/migrations/0019_etiquetas_cards_realtime.sql').toLowerCase();

  assert.match(pipeline, /etiquetas:\s*Etiqueta\[\]/);
  assert.match(pipeline, /etiquetas\.map\(\(etiqueta\)/);
  assert.match(pipeline, /backgroundColor:\s*`\$\{etiqueta\.cor\}1a`/);
  assert.match(pipeline, /etiquetasPorLeadVisiveis/);
  assert.match(filters, /\.channel\('lead-etiquetas-realtime'\)/);
  assert.match(filters, /table:\s*'lead_etiquetas'/);
  assert.match(filters, /refreshEtiquetas\(\)/);
  assert.match(filters, /refreshRequestId/);
  assert.match(filters, /\.subscribe\(\(status\)[\s\S]*status === 'SUBSCRIBED'[\s\S]*refreshEtiquetas/);
  assert.match(filters, /supabase\.removeChannel\(channel\)/);
  assert.match(migration, /alter publication supabase_realtime add table public\.lead_etiquetas/);
  assert.match(migration, /create or replace function public\.compatibilizar_etiquetas_workflow_ales/);
  assert.match(migration, /where id = etiqueta_legada/);
  assert.match(migration, /tg_op = 'update'[\s\S]*old\.etiquetas[\s\S]*new\.etiquetas/);
  assert.match(migration, /foreach etiqueta_legada in array coalesce\(new\.etiquetas, '\{\}'::bigint\[\]\) loop/);
  assert.doesNotMatch(migration, /if new\.etiquetas is null then[\s\S]*return new/);
  assert.match(migration, /insert into public\.lead_etiquetas/);
  assert.match(migration, /array\[49, 50, 51\]::bigint\[\]/);
  assert.match(migration, /unnest\(l\.etiquetas\)[\s\S]*codigo not in \(49, 50, 51\)/);
  assert.doesNotMatch(migration, /array\[27, 28, 29\]|codigo not in \(27, 28, 29\)/);
  assert.doesNotMatch(migration, /set etiquetas = etiquetas/);
});

test('migration corretiva atualiza instalações que receberam o mapa antigo', () => {
  const migrationPath = 'supabase/migrations/0020_corrigir_codigos_etiquetas_workflow.sql';
  assert.equal(fs.existsSync(path.join(root, migrationPath)), true);

  const migration = read(migrationPath).toLowerCase();
  assert.match(migration, /create or replace function public\.compatibilizar_etiquetas_workflow_ales/);
  assert.match(migration, /when 49 then 'follow 1'/);
  assert.match(migration, /when 50 then 'follow 2'/);
  assert.match(migration, /when 51 then 'número inválido'/i);
  assert.match(migration, /array\[27, 28, 29, 49, 50, 51\]::bigint\[\]/);
  assert.match(migration, /unnest\(l\.etiquetas\)[\s\S]*codigo not in \(49, 50, 51\)/);
});

test('changelog documenta ativação e variáveis do workflow', () => {
  const changelog = read('docs/CHANGELOG.md');

  assert.match(changelog, /Follow-up Manual Completo/);
  assert.match(changelog, /workflow duplicado da Ale's Car/);
  assert.match(changelog, /credencial do Supabase/);
  assert.match(changelog, /token e a URL da UAZAPI/);
  assert.match(changelog, /Respondeu Follow Up/);
  assert.match(changelog, /tempo real/);
  assert.doesNotMatch(changelog, /mover_follow_up_bom_dia|follow_up_bom_dia/i);
});
