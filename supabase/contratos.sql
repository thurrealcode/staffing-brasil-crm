-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contratos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa     text        NOT NULL,
  vaga        text        NOT NULL,
  valor       numeric     DEFAULT 0,
  status      text        NOT NULL DEFAULT 'Rascunho',
  responsavel text,
  data        date,
  prioridade  text        DEFAULT 'Normal',
  pdf_url     text,
  pdf_path    text,
  observacoes text,
  timeline    jsonb       DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contratos_all" ON contratos;
CREATE POLICY "contratos_all" ON contratos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage bucket (executar separadamente se necessário)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('contratos', 'contratos', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies
-- CREATE POLICY "contratos_storage_all" ON storage.objects
--   FOR ALL TO authenticated USING (bucket_id = 'contratos') WITH CHECK (bucket_id = 'contratos');
