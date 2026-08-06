-- Atualiza os cards quando vínculos de etiquetas são alterados pelo CRM,
-- pelo n8n ou pelos triggers de compatibilidade.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lead_etiquetas'
  ) then
    alter publication supabase_realtime add table public.lead_etiquetas;
  end if;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'Publicação supabase_realtime não existe neste ambiente.';
end;
$$;

-- Reconcilia códigos que o workflow tenha gravado antes da instalação do
-- trigger de compatibilidade da migration 0017, sem atualizar artificialmente
-- a linha do lead nem disparar seus demais triggers.
with leads_legados as (
  select id, etiquetas
  from public."BASE_DE_LEADS"
  where etiquetas && array[27, 28, 29]::bigint[]
)
delete from public.lead_etiquetas le
using public.etiquetas e, leads_legados l
where le.id_lead = l.id
  and le.id_etiqueta = e.id
  and lower(btrim(e.nome)) in ('número inválido', 'follow 1', 'follow 2')
  and not (
    (lower(btrim(e.nome)) = 'número inválido' and 27 = any(l.etiquetas))
    or (lower(btrim(e.nome)) = 'follow 1' and 28 = any(l.etiquetas))
    or (lower(btrim(e.nome)) = 'follow 2' and 29 = any(l.etiquetas))
  );

with leads_legados as (
  select id, etiquetas
  from public."BASE_DE_LEADS"
  where etiquetas && array[27, 28, 29]::bigint[]
), codigos(codigo, nome) as (
  values
    (27::bigint, 'Número Inválido'::text),
    (28::bigint, 'follow 1'::text),
    (29::bigint, 'follow 2'::text)
)
insert into public.lead_etiquetas (id_lead, id_etiqueta)
select l.id, e.id
from leads_legados l
cross join codigos c
join public.etiquetas e
  on lower(btrim(e.nome)) = lower(btrim(c.nome))
where c.codigo = any(l.etiquetas)
on conflict do nothing;
