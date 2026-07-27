-- Vincula obrigatoriamente a venda ao estoque e conclui ambos atomicamente.
-- Aplicar uma única vez após a migration 0015.

alter table public."BASE_DE_LEADS"
  add column if not exists estoque_veiculo_id text;

create or replace function public.validar_lead_fechado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if lower(trim(coalesce(new.estagio_lead, ''))) = 'fechado'
     and (tg_op = 'INSERT' or old.estagio_lead is distinct from new.estagio_lead)
  then
    if nullif(trim(coalesce(new.nome_lead, '')), '') is null then
      raise exception using errcode = '23514',
        message = 'Nome do lead é obrigatório para fechar a venda.';
    end if;
    if new.valor is null or new.valor <= 0 then
      raise exception using errcode = '23514',
        message = 'Valor maior que zero é obrigatório para fechar a venda.';
    end if;
    if nullif(trim(coalesce(new.estoque_veiculo_id, '')), '') is null then
      raise exception using errcode = '23514',
        message = 'Veículo do estoque é obrigatório para fechar a venda.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validar_lead_fechado_trigger on public."BASE_DE_LEADS";
create trigger validar_lead_fechado_trigger
  before insert or update on public."BASE_DE_LEADS"
  for each row execute function public.validar_lead_fechado();

create or replace function public.fechar_venda_com_veiculo(
  p_id_lead int4,
  p_nome text,
  p_valor numeric,
  p_estoque_id text
)
returns public."BASE_DE_LEADS"
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public."BASE_DE_LEADS"%rowtype;
  v_resultado public."BASE_DE_LEADS"%rowtype;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;
  if nullif(trim(coalesce(p_nome, '')), '') is null
     or p_valor is null or p_valor <= 0
     or nullif(trim(coalesce(p_estoque_id, '')), '') is null
  then
    raise exception 'Nome, valor e veículo são obrigatórios.' using errcode = '22023';
  end if;

  select *
    into v_lead
    from public."BASE_DE_LEADS" lead
    where lead.id = p_id_lead
    for update;
  if not found then
    raise exception 'Lead não encontrado.' using errcode = 'P0002';
  end if;

  if coalesce(public.get_my_cargo(), '') not in ('admin_master', 'admin', 'gerente')
     and coalesce(lower(trim(v_lead.vendedor)), '')
       <> coalesce(lower(trim(public.get_my_nome())), '')
  then
    raise exception 'Sem permissão para fechar esta venda.' using errcode = '42501';
  end if;

  select status
    into v_status
    from public."ESTOQUE" estoque
    where estoque.id::text = p_estoque_id
    for update;
  if not found then
    raise exception 'Veículo não encontrado.' using errcode = 'P0002';
  end if;

  if translate(lower(trim(coalesce(v_status, ''))),
      'áàâãéêíóôõúç', 'aaaaeeiooouc') <> 'disponivel'
  then
    raise exception 'O veículo selecionado não está disponível.' using errcode = '23514';
  end if;

  update public."ESTOQUE"
     set status = 'vendido', updated_at = now()
   where id::text = p_estoque_id;

  update public."BASE_DE_LEADS"
     set nome_lead = trim(p_nome),
         valor = p_valor,
         estagio_lead = 'fechado',
         follow_manual = 'inativo',
         estoque_veiculo_id = p_estoque_id
   where id = p_id_lead
   returning * into v_resultado;

  return v_resultado;
end;
$$;

revoke all on function public.fechar_venda_com_veiculo(int4, text, numeric, text)
  from public, anon;
grant execute on function public.fechar_venda_com_veiculo(int4, text, numeric, text)
  to authenticated;

notify pgrst, 'reload schema';
