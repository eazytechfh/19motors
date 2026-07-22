# Status da IA Persistido no Banco Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os webhooks de ativação da IA por uma atualização confirmada no Supabase, exibindo o estado e o horário da última alteração no painel do lead.

**Architecture:** A rota `POST /api/leads/bot` valida entrada e sessão, atualiza o lead `id_empresa = 1` usando o cliente autenticado sujeito à RLS e retorna a linha alterada. Uma migration adiciona `bot_ativo_alterado_em` e um trigger grava `now()` somente quando `bot_ativo` muda; o drawer atualiza seu estado apenas após validar ID, estado e timestamp retornados.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Supabase/PostgreSQL, `node:test`.

## Global Constraints

- Não enviar webhook ao ativar ou desativar a IA.
- Não atualizar a interface antes da confirmação do banco.
- Em erro, preservar o estado e a data anteriores.
- Respeitar autenticação, empresa e RLS existentes.
- Não recarregar a página.

---

### Task 1: Persistência e API

**Files:**
- Modify: `src/lib/lead-bot.test.ts`
- Modify: `src/lib/lead-bot.ts`
- Modify: `src/app/api/leads/bot/route.ts`
- Create: `supabase/migrations/0013_bot_ativo_ultima_alteracao.sql`
- Modify: `src/types/database.ts`

**Interfaces:**
- Consumes: `{ leadId: number, ativo: boolean }` e sessão Supabase.
- Produces: `{ id, bot_ativo, bot_ativo_alterado_em }` confirmado pelo banco.

- [ ] **Step 1: Write the failing test**

Substituir testes de webhook por contratos que exijam ausência de `fetch`/URLs de webhook, update de `bot_ativo` filtrado por ID e empresa, retorno dos três campos e trigger PostgreSQL com `now()`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/lead-bot.test.ts`
Expected: FAIL porque a rota ainda usa webhook e a migration não existe.

- [ ] **Step 3: Write minimal implementation**

Adicionar coluna/trigger, remover construtor de webhook e alterar a rota para `.update({ bot_ativo: ativo }).eq('id', leadId).eq('id_empresa', 1).select('id, bot_ativo, bot_ativo_alterado_em').maybeSingle()`, rejeitando retorno divergente.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/lead-bot.test.ts`
Expected: PASS.

### Task 2: Estado e interface do painel

**Files:**
- Modify: `src/components/LeadDrawer.tsx`
- Modify: `src/app/(app)/leads/page.tsx`
- Modify: `src/app/(app)/pipeline/page.tsx`
- Modify: `src/components/NegociacaoTimerWatcher.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Test: `src/lib/lead-bot.test.ts`

**Interfaces:**
- Consumes: resposta confirmada da rota e `bot_ativo_alterado_em` nos selects.
- Produces: status “IA ativa/inativa”, data pt-BR, loading e mensagem de erro sem modificar o lead em falha.

- [ ] **Step 1: Write the failing test**

Exigir os textos, `aria-pressed`, retorno validado por ID/estado/timestamp, erro especificado e inclusão da nova coluna nos selects que alimentam o drawer.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/lead-bot.test.ts`
Expected: FAIL nos contratos ainda ausentes.

- [ ] **Step 3: Write minimal implementation**

Atualizar `BaseDeLeads`, selects e drawer; somente chamar `onUpdated` com os valores retornados depois de validar a resposta.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/lead-bot.test.ts`
Expected: PASS.

### Task 3: Verificação

**Files:**
- Verify: todos os arquivos modificados.

**Interfaces:**
- Consumes: Tasks 1 e 2 concluídas.
- Produces: suíte, tipos, build e revisão de segurança aprovados.

- [ ] **Step 1: Run all tests**

Run: `$testFiles = rg --files src | Where-Object { $_ -match '\.test\.ts$' }; node --test $testFiles`
Expected: todos passam.

- [ ] **Step 2: Run types and build**

Run: `.\node_modules\.bin\tsc.cmd --noEmit` e `npm.cmd run build`
Expected: ambos terminam com exit 0.

- [ ] **Step 3: Review scope**

Run: `git diff --check` e revisão do diff.
Expected: nenhum erro e nenhuma chamada de webhook restante no fluxo.
