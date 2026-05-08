-- =============================================================
-- Staffing Brasil CRM — Tabela: messages (chat interno)
-- Execute uma vez no SQL Editor do painel Supabase
-- =============================================================

-- 1. Tabela principal
create table if not exists public.messages (
  id           uuid        default gen_random_uuid() primary key,
  sender_id    uuid        references auth.users(id) on delete cascade not null,
  sender_nome  text        not null default '',
  recipient_id uuid        references auth.users(id) on delete cascade, -- null = grupo geral
  content      text        not null default '',
  created_at   timestamptz not null default now()
);

-- 2. Índices
create index if not exists messages_sender_idx      on public.messages(sender_id);
create index if not exists messages_recipient_idx   on public.messages(recipient_id);
create index if not exists messages_created_at_idx  on public.messages(created_at asc);

-- 3. RLS
alter table public.messages enable row level security;

-- Grupo geral (recipient_id IS NULL): todos podem ler e enviar
drop policy if exists "messages_group_select" on public.messages;
create policy "messages_group_select" on public.messages
  for select to authenticated
  using (recipient_id is null);

drop policy if exists "messages_group_insert" on public.messages;
create policy "messages_group_insert" on public.messages
  for insert to authenticated
  with check (recipient_id is null and auth.uid() = sender_id);

-- Mensagens diretas: apenas remetente e destinatário podem ler/enviar
drop policy if exists "messages_dm_select" on public.messages;
create policy "messages_dm_select" on public.messages
  for select to authenticated
  using (
    recipient_id is not null and (
      auth.uid() = sender_id or auth.uid() = recipient_id
    )
  );

drop policy if exists "messages_dm_insert" on public.messages;
create policy "messages_dm_insert" on public.messages
  for insert to authenticated
  with check (
    recipient_id is not null and auth.uid() = sender_id
  );

-- 4. Realtime: habilita para a tabela messages
alter publication supabase_realtime add table public.messages;

-- 5. Atualiza RLS de profiles: permite que todos os usuários vejam
--    os demais (necessário para montar a lista de DM)
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated
  using (true);
