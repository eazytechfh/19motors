# Auditoria, Fechamento, Estoque e Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auditar toda ação em leads, identificar alterações de observação, validar vendas fechadas, controlar a disponibilidade do estoque e melhorar feedbacks de carregamento/transferência.

**Architecture:** Regras críticas ficam no PostgreSQL por migrations idempotentes e funções puras testáveis modelam os contratos usados pela interface. Componentes reutilizáveis concentram loading e som; o Pipeline abre um modal antes de fechar dados incompletos e o drawer lê a trilha de auditoria gerada no banco.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Supabase/PostgreSQL RLS, `node:test`.

## Global Constraints

- O estágio persistido de venda fechada é exatamente `fechado`.
- Nome não vazio e valor numérico maior que zero são obrigatórios ao fechar.
- Veículos visíveis por padrão no estoque devem ter status normalizado `disponivel`.
- Os estados de estoque editáveis são `disponivel`, `indisponivel` e `vendido`.
- Logs devem registrar data, hora, responsável e detalhes sem depender de cada tela lembrar de inseri-los.
- Áudio só pode ser tocado após interação do usuário e falhas de autoplay não podem quebrar a operação.

---

### Task 1: Contratos testáveis e auditoria no banco

**Files:**
- Create: `src/lib/leads/fechamento.ts`
- Create: `src/lib/leads/fechamento.test.ts`
- Create: `src/lib/estoque/status.ts`
- Create: `src/lib/estoque/status.test.ts`
- Create: `src/lib/feedback/transferencia.test.ts`
- Create: `supabase/migrations/0015_auditoria_leads_e_validacao_fechado.sql`
- Modify: `src/types/database.ts`

**Interfaces:**
- Produces: `validarDadosParaFechamento`, `normalizarStatusEstoque`, `filtrarEstoque`, tabela `lead_logs` e trigger de auditoria/validação.

- [ ] **Step 1: Write failing tests** cobrindo nome em branco, valor ausente/zero, aliases acentuados de status, filtro padrão e contratos SQL de trigger/RLS.
- [ ] **Step 2: Run tests to verify they fail** com `node --test --experimental-strip-types` nos testes novos; esperado: módulos/migration ausentes.
- [ ] **Step 3: Implement minimal pure functions and migration** com trigger `before update` para bloquear fechamento inválido e trigger `after insert/update` para registrar criação, campos alterados, estágio, transferência e observação.
- [ ] **Step 4: Run focused tests to verify they pass** com o mesmo comando.

### Task 2: Logs e autoria da observação no drawer

**Files:**
- Modify: `src/components/LeadDrawer.tsx`
- Modify: `src/types/database.ts`

**Interfaces:**
- Consumes: tabela `lead_logs`, responsável resolvido pelo trigger e detalhes JSON.
- Produces: autoria/data sob a observação e seção “Logs Gerais” sob movimentações.

- [ ] **Step 1: Extend the contract test** para exigir consulta ordenada e renderização de autor/data/tipo.
- [ ] **Step 2: Run it to verify it fails**; esperado: elementos ausentes.
- [ ] **Step 3: Fetch and render logs**, atualizando a lista imediatamente após saves bem-sucedidos sem inventar autoria no cliente.
- [ ] **Step 4: Run tests and type-check**; esperado: sucesso.

### Task 3: Modal obrigatório de venda fechada

**Files:**
- Modify: `src/app/(app)/pipeline/page.tsx`
- Create: `src/components/FechamentoLeadModal.tsx`

**Interfaces:**
- Consumes: `validarDadosParaFechamento`.
- Produces: modal acessível que edita nome/valor e só então persiste os dados junto do estágio.

- [ ] **Step 1: Extend tests** para o modal, mensagens e ausência de update otimista antes da confirmação.
- [ ] **Step 2: Run tests to verify failure**.
- [ ] **Step 3: Implement pending move + modal**, tratando erro do banco e só concluindo o movimento após update confirmado.
- [ ] **Step 4: Run focused tests and type-check**.

### Task 4: Estoque disponível por padrão e edição de status

**Files:**
- Modify: `src/app/(app)/estoque/page.tsx`
- Modify: `src/lib/estoque/status.ts`

**Interfaces:**
- Consumes: status canônicos.
- Produces: filtro inicial `disponivel`, opção explícita “Todos” e seletor persistente no modal.

- [ ] **Step 1: Extend tests** para update confirmado, rollback visual e mensagens de erro.
- [ ] **Step 2: Run tests to verify failure**.
- [ ] **Step 3: Implement filter/status editor** usando o nome real da coluna `status`.
- [ ] **Step 4: Run tests and type-check**.

### Task 5: Feedback automotivo e prompt reutilizável

**Files:**
- Create: `src/components/CarLoading.tsx`
- Create: `src/lib/feedback/transferencia.ts`
- Modify: `src/app/(app)/pipeline/page.tsx`
- Modify: `src/app/(app)/leads/page.tsx`
- Modify: `src/app/(app)/estoque/page.tsx`
- Modify: `src/components/LeadDrawer.tsx`
- Create: `docs/PROMPT-UNIVERSAL-CRM-AUTOMOTIVO-GPT-5.6-SOL.md`

**Interfaces:**
- Produces: loading animado reutilizável, confirmação sonora segura e prompt portável com checklist de prevenção.

- [ ] **Step 1: Write failing contracts** para componente, preferência de movimento reduzido e áudio pós-transferência.
- [ ] **Step 2: Run tests to verify failure**.
- [ ] **Step 3: Implement feedback components and replace loading text** nas três telas de dados.
- [ ] **Step 4: Complete the universal prompt** com descoberta de schema, TDD, migrations, RLS, concorrência, rollback, áudio/autoplay e critérios de aceite.
- [ ] **Step 5: Run all tests, `tsc --noEmit`, build and `git diff --check`**; esperado: tudo verde.

