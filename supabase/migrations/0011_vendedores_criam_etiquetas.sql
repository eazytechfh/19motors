-- Todos os usuários autenticados, inclusive vendedores, podem criar etiquetas.
-- Edição e exclusão continuam protegidas pelas policies existentes.
drop policy if exists "etiquetas_insert_admin_gerente" on public.etiquetas;
drop policy if exists "etiquetas_insert_authenticated" on public.etiquetas;

create policy "etiquetas_insert_authenticated"
  on public.etiquetas for insert
  to authenticated
  with check (true);
