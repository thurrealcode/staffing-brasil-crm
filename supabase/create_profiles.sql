-- =============================================================
-- Staffing Brasil CRM — Tabela: profiles (sistema de permissões)
-- Execute uma vez no SQL Editor do painel Supabase
-- =============================================================

-- 1. Tabela principal
create table if not exists public.profiles (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null unique,
  nome       text        not null default '',
  email      text        not null default '',
  role       text        not null default 'comercial'
               check (role in ('admin', 'comercial', 'recrutamento')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Índice para performance
create index if not exists profiles_user_id_idx on public.profiles(user_id);

-- 3. Row Level Security — cada usuário só acessa o próprio perfil
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id);

-- 4. Trigger: atualiza updated_at automaticamente
create or replace function public.update_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.update_profiles_updated_at();

-- 5. Trigger: cria perfil automaticamente ao registrar novo usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, nome, email, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    'comercial'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Retroativo: cria perfil para usuários já cadastrados
insert into public.profiles (user_id, nome, email, role)
select
  id,
  coalesce(
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1)
  ),
  email,
  'comercial'
from auth.users
on conflict (user_id) do nothing;

-- 7. Para promover um usuário a admin, execute:
-- update public.profiles set role = 'admin' where email = 'arthur.agra1234567@email.com';
