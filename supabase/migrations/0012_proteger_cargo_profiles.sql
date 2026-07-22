-- Impede autoelevação de privilégios. A policy de profiles permite que o usuário atualize
-- os próprios dados, portanto a coluna cargo precisa de uma proteção adicional no banco.
create or replace function public.proteger_alteracao_cargo_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.cargo is distinct from old.cargo
     and public.get_my_cargo() not in ('admin_master', 'admin', 'gerente') then
    raise exception 'Sem permissão para alterar cargo.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_alteracao_cargo_profile on public.profiles;
create trigger trg_proteger_alteracao_cargo_profile
  before update of cargo on public.profiles
  for each row execute function public.proteger_alteracao_cargo_profile();
