-- Corrige o contrato real do workflow duplicado da Ale's Car:
-- 49 = follow 1, 50 = follow 2 e 51 = Número Inválido.

create or replace function public.compatibilizar_etiquetas_workflow_ales()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  etiqueta_legada bigint;
  etiqueta_nome text;
  etiqueta_real_id bigint;
begin
  if tg_op = 'UPDATE' then
    delete from public.lead_etiquetas le
    where le.id_lead = new.id
      and le.id_etiqueta = any(coalesce(old.etiquetas, '{}'::bigint[]))
      and not (le.id_etiqueta = any(coalesce(new.etiquetas, '{}'::bigint[])))
      and le.id_etiqueta not in (49, 50, 51);
  end if;

  delete from public.lead_etiquetas le
  using public.etiquetas e
  where le.id_lead = new.id
    and le.id_etiqueta = e.id
    and lower(btrim(e.nome)) in ('número inválido', 'follow 1', 'follow 2');

  foreach etiqueta_legada in array coalesce(new.etiquetas, '{}'::bigint[]) loop
    etiqueta_real_id := null;
    etiqueta_nome := case etiqueta_legada
      when 49 then 'follow 1'
      when 50 then 'follow 2'
      when 51 then 'Número Inválido'
      else null
    end;

    if etiqueta_nome is not null then
      select id into etiqueta_real_id
      from public.etiquetas
      where lower(btrim(nome)) = lower(btrim(etiqueta_nome))
      order by id
      limit 1;
    else
      select id into etiqueta_real_id
      from public.etiquetas
      where id = etiqueta_legada;
    end if;

    if etiqueta_real_id is not null then
      insert into public.lead_etiquetas (id_lead, id_etiqueta)
      values (new.id, etiqueta_real_id)
      on conflict do nothing;
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function public.compatibilizar_etiquetas_workflow_ales() from public;

-- Repara relações produzidas pelo mapa anterior e aplica o mapa correto.
with leads_para_reconciliar as (
  select id, coalesce(etiquetas, '{}'::bigint[]) as etiquetas
  from public."BASE_DE_LEADS"
  where coalesce(etiquetas, '{}'::bigint[])
    && array[27, 28, 29, 49, 50, 51]::bigint[]
)
delete from public.lead_etiquetas le
using public.etiquetas e, leads_para_reconciliar l
where le.id_lead = l.id
  and le.id_etiqueta = e.id
  and lower(btrim(e.nome)) in ('número inválido', 'follow 1', 'follow 2')
  and not (
    (lower(btrim(e.nome)) = 'follow 1' and 49 = any(l.etiquetas))
    or (lower(btrim(e.nome)) = 'follow 2' and 50 = any(l.etiquetas))
    or (lower(btrim(e.nome)) = 'número inválido' and 51 = any(l.etiquetas))
  );

with codigos(codigo, nome) as (
  values
    (49::bigint, 'follow 1'::text),
    (50::bigint, 'follow 2'::text),
    (51::bigint, 'Número Inválido'::text)
)
insert into public.lead_etiquetas (id_lead, id_etiqueta)
select l.id, e.id
from public."BASE_DE_LEADS" l
cross join codigos c
join public.etiquetas e
  on lower(btrim(e.nome)) = lower(btrim(c.nome))
where c.codigo = any(coalesce(l.etiquetas, '{}'::bigint[]))
on conflict do nothing;

-- 27, 28 e 29 voltam a ser tratados como possíveis IDs locais comuns.
insert into public.lead_etiquetas (id_lead, id_etiqueta)
select l.id, e.id
from public."BASE_DE_LEADS" l
cross join lateral unnest(l.etiquetas) as ids(codigo)
join public.etiquetas e on e.id = ids.codigo
where ids.codigo not in (49, 50, 51)
on conflict do nothing;
