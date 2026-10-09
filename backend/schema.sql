-- Tabela que guarda os dados da interface (Gauge).
-- Faixa do ângulo igual à usada pelo firmware (1 a 180).
CREATE TABLE IF NOT EXISTS registros_interface (
  id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  servo     SMALLINT    NOT NULL CHECK (servo BETWEEN 0 AND 7),
  angulo    SMALLINT    NOT NULL CHECK (angulo BETWEEN 1 AND 180),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registros_criado_em
  ON registros_interface (criado_em DESC);