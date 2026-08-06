# Changelog

## 2026-08-06 - Follow-up Manual Completo

- Adicionadas as etapas `Follow-up`, `Respondeu Follow Up` e `Resgate` ao pipeline configurável.
- Respostas humanas registradas em `dezenovemotors_chat_histories` movem leads elegíveis para `Respondeu Follow Up`.
- A cadência existente no workflow duplicado da Ale's Car continua enviando o primeiro contato às 10h e o segundo às 19h.
- Números com falha definitiva também vão para `Resgate` e recebem a etiqueta `Número Inválido`.
- A coluna legada `BASE_DE_LEADS.etiquetas` aceita os códigos `27`, `28` e `29` do workflow duplicado e os converte para as etiquetas reais do CRM-19-MOTORS.
- Antes de ativá-lo no n8n, troque a credencial do Supabase e o token e a URL da UAZAPI nos nós já existentes.
- A migration `0017_follow_up_manual_completo.sql` deve ser aplicada antes da ativação do workflow.

## 2026-07-03 - Ajuste de scroll do Pipeline

### Contexto

A tela de Pipeline estava permitindo que a página inteira rolasse verticalmente. Com isso, a barra lateral esquerda acompanhava o scroll visual da área principal, quando o comportamento esperado era manter a navegação fixa e permitir scroll apenas nas etapas do funil.

### Alterações realizadas

- Ajustado o layout autenticado em `src/app/(app)/layout.tsx` para ocupar exatamente a altura da viewport com `h-screen` e impedir overflow externo com `overflow-hidden`.
- Adicionados `min-h-0` e `min-w-0` ao `<main>` para que o conteúdo interno possa controlar o próprio scroll sem empurrar a sidebar.
- Ajustada a tela `src/app/(app)/pipeline/page.tsx` para usar layout flex de altura cheia.
- Ajustado o container das etapas do Pipeline para ter scroll horizontal próprio.
- Ajustadas as colunas do Pipeline para terem altura limitada pelo viewport e scroll vertical interno na lista de cards.

### Resultado esperado

- A sidebar esquerda permanece estática.
- As etapas do Pipeline rolam horizontalmente quando não couberem na largura da tela.
- Os cards dentro de cada etapa rolam verticalmente dentro da própria coluna.
- O layout evita scroll global desnecessário na tela de Pipeline.

### Validação

- Executado `npm run build` com sucesso.
- Servidor local testado em `http://127.0.0.1:3000/login`, retornando `200 OK`.
