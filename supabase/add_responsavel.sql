-- Adiciona colunas de responsável em todos os módulos principais
-- Execute no editor SQL do Supabase

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS responsavel_nome  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_email TEXT NOT NULL DEFAULT '';

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS responsavel_nome  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_email TEXT NOT NULL DEFAULT '';

ALTER TABLE candidatos
  ADD COLUMN IF NOT EXISTS responsavel_nome  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_email TEXT NOT NULL DEFAULT '';

ALTER TABLE agenda
  ADD COLUMN IF NOT EXISTS responsavel_nome  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_email TEXT NOT NULL DEFAULT '';

ALTER TABLE prospeccao
  ADD COLUMN IF NOT EXISTS responsavel_nome  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_email TEXT NOT NULL DEFAULT '';
