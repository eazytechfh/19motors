# Follow-up Manual Completo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicar no CRM-19-MOTORS o follow-up manual do ALES-CAR com primeiro e segundo contatos via n8n, etapas `follow_up`, `respondeu_follow_up` e `resgate`, e movimentação nativa por resposta do cliente.

**Architecture:** O Postgres será a fonte de verdade para etapas, sincronização de `follow_manual`, etiquetas e movimentos automáticos. O Next.js renderizará as etapas configuradas pelo banco e continuará registrando movimentos manuais; o workflow duplicado da Ale's Car no n8n continuará responsável pelos contatos de saída e seus estados operacionais. Uma camada de compatibilidade traduz os códigos legados de etiqueta sem exigir outro workflow. A regra antiga baseada em mensagem “bom dia” fica expressamente excluída.

**Tech Stack:** Next.js 14, React 18, TypeScript, Supabase/PostgreSQL, Node test runner, n8n e UAZAPI.

## Global Constraints

- Não implementar qualquer regra baseada no conteúdo `bom dia` ou `Bom dia`.
- Usar `dezenovemotors_chat_histories`, nunca tabelas `alescar*`.
- Não copiar IDs de etiquetas nem credenciais do ALES-CAR.
- Somente `estagio_lead = 'follow_up'` pode manter `follow_manual = 'ativo'`.
- A resposta do cliente move `follow_up` para `respondeu_follow_up`; falha definitiva ou fim da cadência move para `resgate`.
- Preservar as funcionalidades atuais de negociação, fechamento e estoque do CRM-19-MOTORS.

---

### Task 1: Contrato de banco do follow-up

**Files:**
- Create: `tests/follow-up-manual.test.js`
- Create: `supabase/migrations/0017_follow_up_manual_completo.sql`

**Interfaces:**
- Consumes: `BASE_DE_LEADS`, `etiquetas`, `lead_etiquetas`, `lead_historico_estagio`, `dezenovemotors_chat_histories`.
- Produces: colunas `ja_recebeu_msg`, `erro_follow_manual`; tabela `pipeline_etapas`; função `sync_follow_manual_from_estagio()`; função `mover_resposta_para_respondeu_follow_up()`.

- [ ] **Step 1: Escrever os testes de contrato que falham**

```js
test('cria as três etapas e sincroniza o marcador manual', () => {
  assert.match(sql, /'follow_up'[\s\S]*'respondeu_follow_up'[\s\S]*'resgate'/);
  assert.match(sql, /new\.follow_manual := case[\s\S]*new\.estagio_lead = 'follow_up'/);
});

test('resposta do cliente move somente lead elegível', () => {
  assert.match(sql, /on public\.dezenovemotors_chat_histories/);
  assert.match(sql, /estagio_lead = 'respondeu_follow_up'/);
  assert.doesNotMatch(sql, /bom dia/i);
});
```

- [ ] **Step 2: Executar o teste e observar falha por migration ausente**

Run: `node --test tests/follow-up-manual.test.js`
Expected: FAIL com `ENOENT` para `0017_follow_up_manual_completo.sql`.

- [ ] **Step 3: Criar a migration idempotente**

```sql
alter table public."BASE_DE_LEADS"
  add column if not exists ja_recebeu_msg text,
  add column if not exists erro_follow_manual text;

insert into public.pipeline_etapas (slug, nome, cor, ordem, is_inicial)
values ('follow_up','Follow-up','#a855f7',3,false),
       ('respondeu_follow_up','Respondeu Follow Up','#990bda',4,false),
       ('resgate','Resgate','#f6dd3c',8,false)
on conflict (slug) do update set nome=excluded.nome, cor=excluded.cor;
```

Completar no mesmo arquivo a tabela de etapas, RLS, sincronização de etiquetas por nome, trigger de `follow_manual` e trigger de resposta baseado em `message->>'type' <> 'system'`, telefone normalizado e lead ainda em `follow_up`.

- [ ] **Step 4: Executar o teste até passar**

Run: `node --test tests/follow-up-manual.test.js`
Expected: PASS.

### Task 2: Pipeline orientado pelas etapas do banco

**Files:**
- Create: `src/lib/pipeline-etapas.ts`
- Create: `src/hooks/usePipelineEtapas.ts`
- Modify: `src/types/database.ts`
- Modify: `src/components/StatusBadge.tsx`
- Modify: `src/components/NovoLeadModal.tsx`
- Modify: `src/app/(app)/pipeline/page.tsx`
- Modify: `src/app/(app)/leads/page.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/components/NegociacaoTimerWatcher.tsx`

**Interfaces:**
- Consumes: registros `PipelineEtapa` ordenados por `ordem`.
- Produces: `ETAPAS_FALLBACK`, `etapaDe()` e `usePipelineEtapas()` usados por badges, formulários e pipeline.

- [ ] **Step 1: Acrescentar testes de interface ao contrato**

```js
test('pipeline carrega etapas configuradas e contém o trio do follow-up', () => {
  assert.match(pipeline, /usePipelineEtapas/);
  assert.match(fallback, /respondeu_follow_up/);
  assert.match(fallback, /resgate/);
});
```

- [ ] **Step 2: Executar e observar falha pelos módulos ausentes**

Run: `node --test tests/follow-up-manual.test.js`
Expected: FAIL em `usePipelineEtapas`/`respondeu_follow_up`.

- [ ] **Step 3: Implementar o carregamento e preservar movimentos existentes**

```ts
export function etapaDe(slug: string | null | undefined, etapas: PipelineEtapa[]) {
  const key = (slug ?? '').trim().toLowerCase();
  return etapas.find((etapa) => etapa.slug === key) ?? ETAPA_DESCONHECIDA;
}
```

Substituir as colunas estáticas apenas nos pontos de leitura/renderização; manter integralmente cronômetro, fechamento vinculado ao estoque, atualização otimista e histórico manual.

- [ ] **Step 4: Executar testes e type-check**

Run: `node --test tests/follow-up-manual.test.js && npx tsc --noEmit`
Expected: PASS e saída sem erros TypeScript.

### Task 3: Compatibilidade com o workflow n8n duplicado

**Files:**
- Modify: `supabase/migrations/0017_follow_up_manual_completo.sql`
- Test: `tests/follow-up-manual.test.js`

**Interfaces:**
- Consumes: atualizações diretas do workflow legado em `BASE_DE_LEADS`, inclusive `etiquetas={27|28|29}` e `ja_recebeu_msg='2º msg'`.
- Produces: vínculos normalizados em `lead_etiquetas`, preservando a cadência e a estrutura visual do cenário duplicado.

- [ ] **Step 1: Testar o contrato legado antes da compatibilidade**

```js
test('migration aceita os códigos de etiquetas do workflow duplicado', () => {
  assert.match(sql, /add column if not exists etiquetas bigint\[\]/);
  assert.match(sql, /compatibilizar_etiquetas_workflow_ales/);
  assert.match(sql, /ja_recebeu_msg in \('segundo_follow', '2º msg'\)/);
});
```

- [ ] **Step 2: Executar e observar falha por contrato ausente**

Run: `node --test tests/follow-up-manual.test.js`
Expected: FAIL porque a coluna e o trigger de compatibilidade ainda não existem.

- [ ] **Step 3: Implementar a camada de compatibilidade no banco**

O banco deve aceitar as escritas originais do cenário duplicado e traduzi-las para as etiquetas locais por nome, sem pressupor que os IDs reais sejam 27, 28 e 29.

- [ ] **Step 4: Executar o contrato completo**

Run: `node --test tests/follow-up-manual.test.js`
Expected: PASS.

### Task 4: Verificação integrada e documentação

**Files:**
- Modify: `docs/CHANGELOG.md`

**Interfaces:**
- Consumes: migration 0017 e workflow final.
- Produces: instalação reproduzível pelo `scripts/setup-sql.js` existente e registro de operação.

- [ ] **Step 1: Testar que o changelog documenta a operação e exclui “bom dia”**

```js
assert.match(changelog, /Follow-up Manual Completo/);
assert.doesNotMatch(changelog, /mover_follow_up_bom_dia|follow_up_bom_dia/i);
```

- [ ] **Step 2: Documentar horários, estados, variáveis e ativação do n8n**

- [ ] **Step 3: Executar toda a validação**

Run: `node --test "src/**/*.test.ts" tests/*.test.js`
Expected: todos os testes passam.

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm run build`
Expected: build de produção concluído.
