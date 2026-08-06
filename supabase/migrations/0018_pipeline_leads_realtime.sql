-- Mantém o Pipeline sincronizado com movimentações feitas pelo n8n e por
-- triggers do banco, sem exigir recarregamento manual da página.
do $$
begin
  begin
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'BASE_DE_LEADS'
    ) then
      alter publication supabase_realtime add table public."BASE_DE_LEADS";
    end if;
  exception
    when duplicate_object then null;
    when undefined_object then
      raise notice 'Publicação supabase_realtime não existe neste ambiente.';
  end;
end;
$$;
