-- ================================================================
-- Staffing Brasil CRM — Google Calendar Integration
-- Execute no SQL Editor do Supabase
-- ================================================================

-- 1. Tabela de integrações Google por usuário
CREATE TABLE IF NOT EXISTS public.google_integrations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  google_email  text        NOT NULL DEFAULT '',
  calendar_type text        NOT NULL DEFAULT 'primary',
  access_token  text        NOT NULL DEFAULT '',
  refresh_token text,
  expires_at    timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS google_integrations_user_id_idx ON public.google_integrations(user_id);

ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

-- Cada usuário vê/gerencia apenas a própria integração
DROP POLICY IF EXISTS "google_integrations_own" ON public.google_integrations;
CREATE POLICY "google_integrations_own" ON public.google_integrations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Colunas extras na tabela agenda (sync com Google Calendar)
ALTER TABLE public.agenda
  ADD COLUMN IF NOT EXISTS responsavel_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_event_id   text,
  ADD COLUMN IF NOT EXISTS meet_link         text,
  ADD COLUMN IF NOT EXISTS sync_status       text DEFAULT 'pending';
