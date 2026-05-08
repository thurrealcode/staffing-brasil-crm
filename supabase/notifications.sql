-- =============================================================
-- Staffing Brasil CRM — Tabela: notifications
-- Execute uma vez no SQL Editor do painel Supabase
-- =============================================================

-- 1. Tabela principal
create table if not exists public.notifications (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  type       text        not null default 'info',
  content    text        not null default '',
  link       text        not null default '',
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

-- 2. Índices
create index if not exists notifications_user_id_idx  on public.notifications(user_id);
create index if not exists notifications_read_idx     on public.notifications(read);
create index if not exists notifications_created_idx  on public.notifications(created_at desc);

-- 3. RLS
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated
  using (auth.uid() = user_id);

-- permite que triggers com security definer insiram para qualquer usuário
drop policy if exists "notifications_insert_system" on public.notifications;
create policy "notifications_insert_system" on public.notifications
  for insert to authenticated
  with check (true);

-- 4. Trigger: cria notificação quando uma DM é enviada
create or replace function public.handle_dm_notification()
returns trigger language plpgsql security definer as $$
begin
  if new.recipient_id is not null then
    insert into public.notifications (user_id, type, content, link)
    values (
      new.recipient_id,
      'message',
      'Nova mensagem de ' || new.sender_nome,
      '/mensagens'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_dm_notification on public.messages;
create trigger on_dm_notification
  after insert on public.messages
  for each row execute function public.handle_dm_notification();

-- 5. Realtime
alter publication supabase_realtime add table public.notifications;
