-- =============================================================
-- Staffing Brasil CRM — Tabela: candidatos
-- Execute uma vez no SQL Editor do painel Supabase
-- =============================================================

-- 1. Tabela principal
create table if not exists public.candidatos (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        references auth.users(id) on delete cascade not null,
  nome                text        not null default '',
  vaga                text        not null default '',
  empresa             text        not null default '',
  experiencia         text        not null default '',
  cidade              text        not null default '',
  nivel               text        not null default 'Pleno',
  status              text        not null default 'Triagem',
  score               integer     not null default 0,
  observacoes         text        not null default '',
  habilidades         text[]      not null default '{}',
  curriculo           text        not null default '',
  data                date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 2. Índices para performance
create index if not exists candidatos_user_id_idx    on public.candidatos(user_id);
create index if not exists candidatos_status_idx     on public.candidatos(status);
create index if not exists candidatos_created_at_idx on public.candidatos(created_at desc);

-- 3. Row Level Security
alter table public.candidatos enable row level security;

drop policy if exists "candidatos_owner_policy" on public.candidatos;
create policy "candidatos_owner_policy"
  on public.candidatos
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Trigger updated_at (reutiliza a função já criada pelo leads.sql)
drop trigger if exists candidatos_set_updated_at on public.candidatos;
create trigger candidatos_set_updated_at
  before update on public.candidatos
  for each row execute function public.set_updated_at();
