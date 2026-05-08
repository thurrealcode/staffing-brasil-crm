-- ── Tabela principal ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospeccao (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa             text NOT NULL DEFAULT '',
  segmento            text DEFAULT '',
  telefone            text DEFAULT '',
  cidade              text DEFAULT '',
  nome_decisor        text DEFAULT '',
  cargo_decisor       text DEFAULT '',
  contato_secretaria  text DEFAULT '',
  status              text DEFAULT 'Não ligado',
  ultima_ligacao      date,
  proxima_acao        text DEFAULT '',
  data_proximo_contato date,
  observacoes         text DEFAULT '',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── Tabela de atividades / histórico de chamadas ──────────────
CREATE TABLE IF NOT EXISTS prospeccao_atividades (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prospeccao_id   uuid REFERENCES prospeccao(id) ON DELETE CASCADE NOT NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  descricao       text NOT NULL DEFAULT '',
  novo_status     text,
  created_at      timestamptz DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE prospeccao ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospeccao_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospeccao_all" ON prospeccao
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prospeccao_atividades_all" ON prospeccao_atividades
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Trigger updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prospeccao_updated_at ON prospeccao;
CREATE TRIGGER prospeccao_updated_at
  BEFORE UPDATE ON prospeccao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
