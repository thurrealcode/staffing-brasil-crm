-- =============================================================
-- Staffing Brasil CRM — Tabela: agenda
-- Execute uma vez no SQL Editor do painel Supabase
-- =============================================================

-- 1. Tabela principal
create table if not exists public.agenda (
  id            uuid        default gen_random_uuid() primary key,
  user_id       uuid        references auth.users(id) on delete cascade not null,
  titulo        text        not null default '',
  tipo          text        not null default 'Reunião',
  data          date        not null,
  horario       text        not null default '',
  empresa       text        not null default '',
  contato       text        not null default '',
  local         text        not null default '',
  status        text        not null default 'Agendado',
  observacoes   text        not null default '',
  empresa_id    uuid        references public.empresas(id)   on delete set null,
  candidato_id  uuid        references public.candidatos(id) on delete set null,
  lead_id       uuid        references public.leads(id)      on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Índices para performance
create index if not exists agenda_user_id_idx    on public.agenda(user_id);
create index if not exists agenda_data_idx       on public.agenda(data);
create index if not exists agenda_created_at_idx on public.agenda(created_at desc);

-- 3. Row Level Security
alter table public.agenda enable row level security;

drop policy if exists "agenda_owner_policy" on public.agenda;
create policy "agenda_owner_policy"
  on public.agenda
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Trigger updated_at (reutiliza a função criada pelo leads.sql)
drop trigger if exists agenda_set_updated_at on public.agenda;
create trigger agenda_set_updated_at
  before update on public.agenda
  for each row execute function public.set_updated_at();
