-- Auditoria imutável de leads e proteção da regra de venda fechada.

create table if not exists public.lead_logs (
  id bigserial primary key,
  -- Sem FK/cascade de propósito: a auditoria deve sobreviver à exclusão do lead.
  id_lead int4 not null,
  acao text not null,
  responsavel_id uuid,
  responsavel_nome text not null default 'Sistema',
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lead_logs_id_lead_created_at_idx
  on public.lead_logs (id_lead, created_at desc);

alter table public.lead_logs enable row level security;

drop policy if exists "lead_logs_select_authenticated" on public.lead_logs;
create policy "lead_logs_select_authenticated"
  on public.lead_logs for select to authenticated
  using (
    exists (
      select 1
      from public."BASE_DE_LEADS" lead
      where lead.id = lead_logs.id_lead
    )
    or public.get_my_cargo() in ('admin_master', 'admin', 'gerente')
  );

-- Inserts são exclusivos do trigger SECURITY DEFINER; clientes não podem forjar auditoria.
revoke insert, update, delete on public.lead_logs from authenticated;

create or replace function public.validar_lead_fechado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if lower(trim(coalesce(new.estagio_lead, ''))) = 'fechado' then
    if nullif(trim(coalesce(new.nome_lead, '')), '') is null then
      raise exception using errcode = '23514', message = 'Nome do lead é obrigatório para fechar a venda.';
    end if;
    if new.valor is null or new.valor <= 0 then
      raise exception using errcode = '23514', message = 'Valor maior que zero é obrigatório para fechar a venda.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validar_lead_fechado_trigger on public."BASE_DE_LEADS";
create trigger validar_lead_fechado_trigger
  before insert or update on public."BASE_DE_LEADS"
  for each row execute function public.validar_lead_fechado();

create or replace function public.registrar_log_geral_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text;
  v_acao text;
  v_detalhes jsonb := '{}'::jsonb;
  v_old jsonb;
  v_new jsonb;
  v_lead_id int4;
begin
  if tg_op = 'DELETE' then v_lead_id := old.id; else v_lead_id := new.id; end if;
  select coalesce(nullif(trim(nome), ''), nullif(trim(email), ''))
    into v_nome from public.profiles where id = v_uid;
  v_nome := coalesce(v_nome, case when v_uid is null then 'Sistema' else 'Usuário desconhecido' end);

  if tg_op = 'DELETE' then
    v_acao := 'lead_excluido';
    v_detalhes := jsonb_build_object('nome_lead', old.nome_lead);
  elsif tg_op = 'INSERT' then
    v_acao := 'lead_criado';
    v_detalhes := jsonb_build_object('nome_lead', new.nome_lead);
  else
    v_old := to_jsonb(old) - array['updated_at'];
    v_new := to_jsonb(new) - array['updated_at'];
    v_detalhes := (
      select jsonb_build_object(
        'campos_alterados', coalesce(jsonb_agg(chave), '[]'::jsonb),
        'antes', coalesce(jsonb_object_agg(chave, v_old -> chave), '{}'::jsonb),
        'depois', coalesce(jsonb_object_agg(chave, v_new -> chave), '{}'::jsonb)
      )
      from jsonb_object_keys(v_new) chave
      where v_old -> chave is distinct from v_new -> chave
    );
    if old.observacao_vendedor is distinct from new.observacao_vendedor then
      v_acao := case when old.observacao_vendedor is null then 'observacao_adicionada' else 'observacao_alterada' end;
    elsif old.vendedor is distinct from new.vendedor then
      v_acao := 'lead_transferido';
    elsif old.estagio_lead is distinct from new.estagio_lead then
      v_acao := 'estagio_alterado';
    else
      v_acao := 'lead_atualizado';
    end if;
  end if;

  insert into public.lead_logs (id_lead, acao, responsavel_id, responsavel_nome, detalhes)
  values (v_lead_id, v_acao, v_uid, v_nome, v_detalhes);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists registrar_log_geral_lead_trigger on public."BASE_DE_LEADS";
create trigger registrar_log_geral_lead_trigger
  after insert or update or delete on public."BASE_DE_LEADS"
  for each row execute function public.registrar_log_geral_lead();

create or replace function public.registrar_log_etiqueta_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text;
  v_lead_id int4 := coalesce(new.id_lead, old.id_lead);
  v_etiqueta_id bigint := coalesce(new.id_etiqueta, old.id_etiqueta);
begin
  select coalesce(nullif(trim(nome), ''), nullif(trim(email), ''))
    into v_nome from public.profiles where id = v_uid;
  insert into public.lead_logs (id_lead, acao, responsavel_id, responsavel_nome, detalhes)
  values (
    v_lead_id,
    case when tg_op = 'INSERT' then 'etiqueta_adicionada' else 'etiqueta_removida' end,
    v_uid,
    coalesce(v_nome, case when v_uid is null then 'Sistema' else 'Usuário desconhecido' end),
    jsonb_build_object('id_etiqueta', v_etiqueta_id)
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists registrar_log_etiqueta_lead_trigger on public.lead_etiquetas;
create trigger registrar_log_etiqueta_lead_trigger
  after insert or delete on public.lead_etiquetas
  for each row execute function public.registrar_log_etiqueta_lead();
