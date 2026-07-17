# Observação, Cronômetro e Etiquetas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reiniciar em 30 minutos a notificação de negociação ao salvar uma observação, confirmar visualmente o salvamento e permitir que vendedores criem etiquetas persistentes.

**Architecture:** O salvamento da observação continuará no `LeadDrawer`, mas passará a atualizar atomicamente os campos do ciclo de notificação e o estado local do lead. A autorização de etiquetas será corrigida por uma nova migration RLS, enquanto a tela exibirá erros do Supabase para não aparentar sucesso quando a gravação falhar.

**Tech Stack:** Next.js 14, React 18, TypeScript, Supabase/PostgreSQL RLS, Node test runner.

## Global Constraints

- O novo prazo é calculado como o instante do clique/salvamento mais 30 minutos.
- O reinício limpa todo estado de notificação anterior para permitir um novo disparo.
- A confirmação deve ser exatamente `Observação salva com sucesso` e aparecer à direita do botão.
- Usuários com cargo `vendedor` podem criar etiquetas e a falha de persistência deve ser visível.

---

### Task 1: Contrato do reinício da notificação

**Files:**
- Create: `src/lib/negociacao/observacao.ts`
- Create: `src/lib/negociacao/observacao.test.ts`
- Modify: `src/components/LeadDrawer.tsx`

**Interfaces:**
- Produces: `criarAtualizacaoObservacao(observacao: string, agora?: Date)` com os campos enviados ao Supabase.

- [ ] **Step 1: Write the failing test** verificando prazo de +30 minutos e limpeza dos campos de notificação.
- [ ] **Step 2: Run test to verify it fails** com `node --test --experimental-strip-types src/lib/negociacao/observacao.test.ts`.
- [ ] **Step 3: Write minimal implementation** do payload e integrá-lo ao update do drawer.
- [ ] **Step 4: Run test to verify it passes** com o mesmo comando.
- [ ] **Step 5: Commit** os arquivos da tarefa quando solicitado pelo usuário.

### Task 2: Confirmação visual da observação

**Files:**
- Modify: `src/components/LeadDrawer.tsx`

**Interfaces:**
- Consumes: resultado sem erro do update da Task 1.
- Produces: estado de mensagem de sucesso/erro apresentado ao lado direito do botão.

- [ ] **Step 1: Write the failing test** cobrindo a mensagem exata no contrato do fluxo.
- [ ] **Step 2: Run test to verify it fails** no teste focalizado.
- [ ] **Step 3: Write minimal implementation** para limpar a mensagem antes do request e mostrar sucesso somente após persistência.
- [ ] **Step 4: Run test to verify it passes** e executar o type-check.
- [ ] **Step 5: Commit** quando solicitado pelo usuário.

### Task 3: Criação persistente de etiquetas por vendedor

**Files:**
- Create: `supabase/migrations/0011_vendedores_criam_etiquetas.sql`
- Create: `src/lib/negociacao/etiquetas-permissoes.test.ts`
- Modify: `src/app/(app)/configuracoes/page.tsx`

**Interfaces:**
- Produces: policy de `INSERT` para todos os cargos autenticados, mantendo alteração/remoção restritas; feedback explícito do insert.

- [ ] **Step 1: Write the failing test** que valida a policy destinada a `authenticated` com `with check (true)`.
- [ ] **Step 2: Run test to verify it fails** antes de criar a migration.
- [ ] **Step 3: Write minimal implementation** da migration e do tratamento de sucesso/erro no formulário.
- [ ] **Step 4: Run test to verify it passes** e executar type-check/build.
- [ ] **Step 5: Commit** quando solicitado pelo usuário.

### Task 4: Verificação integrada

**Files:**
- Modify: somente os arquivos que apresentarem falhas causadas por estas mudanças.

**Interfaces:**
- Consumes: Tasks 1–3 completas.
- Produces: aplicação compilável e diff revisado.

- [ ] **Step 1: Run focused tests** para os contratos novos.
- [ ] **Step 2: Run type-check** com `npx tsc --noEmit`.
- [ ] **Step 3: Run production build** com `npm run build`.
- [ ] **Step 4: Review diff** confirmando que nenhuma alteração alheia entrou no escopo.

