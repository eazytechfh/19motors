# Venda Vinculada ao Estoque Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exigir um veículo disponível na conclusão da venda e atualizar lead e estoque atomicamente, com um seletor pesquisável que abre para baixo.

**Architecture:** `FechamentoLeadModal` carregará `ESTOQUE`, filtrará status `disponivel` e entregará o ID selecionado ao pipeline. A migration `0016` adicionará `estoque_veiculo_id` e uma RPC `SECURITY DEFINER` com autorização e locks, fazendo os dois updates na mesma transação.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind, Supabase/PostgreSQL e Node Test.

## Global Constraints

- Não executar migration no banco.
- Preservar migrations já aplicadas e criar `0016`.
- Usar a tabela real `public."ESTOQUE"` e status canônico `disponivel`/`vendido`.
- Manter sons e celebração somente depois da confirmação do banco.

---

### Task 1: Teste de regressão

**Files:**
- Modify: `src/lib/leads/fechamento.test.ts`

**Interfaces:**
- Consumes: modal, pipeline e migration `0016`.
- Produces: contrato do combobox e da transação.

- [x] Exigir pesquisa, `top-full`, `max-h-60` e ausência de `<select>` nativo para o veículo.
- [x] Exigir RPC, vínculo, `FOR UPDATE` e status `vendido`.
- [x] Executar o teste e observar a falha esperada.

### Task 2: Interface e transação

**Files:**
- Modify: `src/components/FechamentoLeadModal.tsx`
- Modify: `src/app/(app)/pipeline/page.tsx`
- Create: `supabase/migrations/0016_venda_vinculada_estoque.sql`

**Interfaces:**
- Consumes: nome, valor, lead, usuário autenticado e estoque.
- Produces: `fechar_venda_com_veiculo(int4,text,numeric,text)`.

- [x] Implementar consulta e filtro dos veículos disponíveis.
- [x] Implementar combobox pesquisável com lista abaixo e scroll.
- [x] Substituir o update comum pela RPC no fechamento.
- [x] Implementar validação, autorização e locks no banco.
- [x] Confirmar o teste aprovado.

### Task 3: Prompt e validação

**Files:**
- Modify: `docs/PROMPT-UNIVERSAL-CRM-AUTOMOTIVO-GPT-5.6-SOL.md`

**Interfaces:**
- Consumes: solução implementada.
- Produces: instruções reutilizáveis com erros conhecidos.

- [x] Documentar seleção obrigatória e combobox.
- [x] Documentar transação, concorrência e nova migration.
- [x] Executar testes, TypeScript, build e `git diff --check`.
