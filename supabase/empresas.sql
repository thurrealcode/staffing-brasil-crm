-- =============================================================
-- Staffing Brasil CRM — Tabela: empresas
-- Execute uma vez no SQL Editor do painel Supabase
-- =============================================================

-- 1. Tabela principal
create table if not exists public.empresas (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        references auth.users(id) on delete cascade not null,
  nome                text        not null default '',
  cnpj                text        not null default '',
  segmento            text        not null default '',
  cidade              text        not null default '',
  estado              text        not null default '',
  status              text        not null default 'Em Negociação',
  contato_nome        text        not null default '',
  contato_email       text        not null default '',
  contato_telefone    text        not null default '',
  contato_whatsapp    text        not null default '',
  vagas_abertas       integer     not null default 0,
  total_contratacoes  integer     not null default 0,
  observacoes         text        not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 2. Índices para performance
create index if not exists empresas_user_id_idx    on public.empresas(user_id);
create index if not exists empresas_status_idx     on public.empresas(status);
create index if not exists empresas_created_at_idx on public.empresas(created_at desc);

-- 3. Row Level Security
alter table public.empresas enable row level security;

drop policy if exists "empresas_owner_policy" on public.empresas;
create policy "empresas_owner_policy"
  on public.empresas
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Trigger updated_at (reutiliza a função já criada pelo leads.sql)
--    Se ainda não existe a função, cria agora
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists empresas_set_updated_at on public.empresas;
create trigger empresas_set_updated_at
  before update on public.empresas
  for each row execute function public.set_updated_at();
