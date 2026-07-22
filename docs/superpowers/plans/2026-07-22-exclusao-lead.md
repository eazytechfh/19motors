# Exclusão de Lead Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao painel de detalhes uma exclusão confirmada, acessível, segura e refletida imediatamente nas listagens locais.

**Architecture:** O `LeadDrawer` abre e mantém o modal de confirmação, chama uma rota autenticada e só emite `onDeleted(id)` quando a API confirmar o ID removido. A rota valida entrada, sessão, cargo autorizado e `id_empresa = 1`, executando a exclusão com o cliente Supabase do usuário para preservar a RLS existente. Cada consumidor do drawer remove o ID de seu próprio estado sem recarregar a página.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Supabase SSR/PostgREST, `node:test`.

## Global Constraints

- Não alterar outras funcionalidades do painel.
- A ação destrutiva sempre exige confirmação.
- Durante a requisição, manter o modal aberto e desabilitar ambos os botões.
- Em falha, manter painel e lead intactos e mostrar a mensagem especificada.
- Em sucesso, remover o lead do estado local e fechar o painel sem recarregar a página.
- Validar autorização no servidor e preservar a RLS do banco.

---

### Task 1: Contratos de exclusão e segurança

**Files:**
- Create: `src/lib/leads/exclusao.test.ts`
- Create: `src/app/api/leads/[id]/route.ts`
- Modify: `src/components/LeadDrawer.tsx`

**Interfaces:**
- Consumes: sessão Supabase e policies de `BASE_DE_LEADS`.
- Produces: `DELETE /api/leads/:id` com `{ id: number }` em sucesso e resposta de erro sem detalhes sensíveis.

- [ ] **Step 1: Write the failing test**

Criar testes de contrato que exijam validação de ID, autenticação, roles `admin_master/admin/gerente`, filtro `id_empresa = 1`, exclusão com `.select('id').maybeSingle()` e os textos/atributos/estados do modal.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx --no-install tsx --test src/lib/leads/exclusao.test.ts`
Expected: FAIL porque a rota e a interface de exclusão ainda não existem.

- [ ] **Step 3: Write minimal implementation**

Implementar `DELETE`, retornando 400 para ID inválido, 401 sem sessão, 403 para cargo não autorizado, 404 quando a linha não pertence à empresa/escopo RLS e 200 apenas quando a linha excluída retornar o mesmo ID. No drawer, adicionar `onDeleted(leadId: number)`, seção destrutiva, modal acessível e estados `confirmandoExclusao`, `excluindo` e `erroExclusao`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx --no-install tsx --test src/lib/leads/exclusao.test.ts`
Expected: PASS.

### Task 2: Atualização das listagens locais

**Files:**
- Modify: `src/app/(app)/leads/page.tsx`
- Modify: `src/app/(app)/pipeline/page.tsx`
- Modify: `src/components/NegociacaoTimerWatcher.tsx`
- Test: `src/lib/leads/exclusao.test.ts`

**Interfaces:**
- Consumes: callback `onDeleted(leadId: number)` do drawer.
- Produces: remoção imutável do ID em `leads`/`negociacoes` e limpeza de `leadSelecionado`.

- [ ] **Step 1: Write the failing test**

Estender o teste de contrato para exigir `onDeleted` nos três consumidores e filtros locais por ID.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx --no-install tsx --test src/lib/leads/exclusao.test.ts`
Expected: FAIL apontando os consumidores ainda sem o callback.

- [ ] **Step 3: Write minimal implementation**

Em cada consumidor, passar `onDeleted={(leadId) => { ... }}`, filtrar o estado apropriado e definir `setLeadSelecionado(null)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx --no-install tsx --test src/lib/leads/exclusao.test.ts`
Expected: PASS.

### Task 3: Verificação integrada

**Files:**
- Verify: all modified files.

**Interfaces:**
- Consumes: implementação completa das Tasks 1 e 2.
- Produces: evidência de testes, tipos e build válidos.

- [ ] **Step 1: Run focused and existing tests**

Run: `npx --no-install tsx --test src/**/*.test.ts`
Expected: todos os testes passam.

- [ ] **Step 2: Run TypeScript verification**

Run: `npx --no-install tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: build concluído sem erros.

- [ ] **Step 4: Review scope and security**

Run: `git diff --check` e `git diff -- src/components/LeadDrawer.tsx src/app/api/leads/[id]/route.ts src/app/(app)/leads/page.tsx src/app/(app)/pipeline/page.tsx src/components/NegociacaoTimerWatcher.tsx src/lib/leads/exclusao.test.ts`
Expected: nenhum whitespace error; somente exclusão de lead e integrações necessárias.
