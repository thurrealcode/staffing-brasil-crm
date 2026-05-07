-- =============================================================
-- Staffing Brasil CRM — Tabela: leads
-- Execute uma vez no SQL Editor do painel Supabase
-- =============================================================

-- 1. Tabela principal
create table if not exists public.leads (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  empresa      text        not null default '',
  contato      text        not null default '',
  whatsapp     text        not null default '',
  email        text        not null default '',
  cidade       text        not null default '',
  segmento     text        not null default '',
  status       text        not null default 'Novo Lead',
  ultimo_contato date,
  observacoes  text        not null default '',
  tags         text[]      not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. Índices para performance
create index if not exists leads_user_id_idx   on public.leads(user_id);
create index if not exists leads_status_idx    on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);

-- 3. Row Level Security — cada usuário só acessa seus próprios leads
alter table public.leads enable row level security;

drop policy if exists "leads_owner_policy" on public.leads;
create policy "leads_owner_policy"
  on public.leads
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Trigger para atualizar updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();
