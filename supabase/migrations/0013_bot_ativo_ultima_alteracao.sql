alter table public."BASE_DE_LEADS"
  add column if not exists bot_ativo_alterado_em timestamptz;

update public."BASE_DE_LEADS"
set bot_ativo = false
where bot_ativo is null;

alter table public."BASE_DE_LEADS"
  alter column bot_ativo set default false,
  alter column bot_ativo set not null;

create or replace function public.registrar_alteracao_bot_ativo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.bot_ativo is distinct from old.bot_ativo then
    new.bot_ativo_alterado_em := now();
  else
    new.bot_ativo_alterado_em := old.bot_ativo_alterado_em;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_registrar_alteracao_bot_ativo on public."BASE_DE_LEADS";
create trigger trg_registrar_alteracao_bot_ativo
  before update of bot_ativo, bot_ativo_alterado_em on public."BASE_DE_LEADS"
  for each row execute function public.registrar_alteracao_bot_ativo();
