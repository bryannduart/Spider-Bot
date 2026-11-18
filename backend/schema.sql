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

-- Movimentos: cada linha é um movimento, do clique em "Iniciar" ao
-- clique em "Finalizar". Os dois horários vêm do servidor.
-- finalizado_em fica nulo enquanto o movimento está em andamento.
CREATE TABLE IF NOT EXISTS movimentos (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome          VARCHAR(60) NOT NULL,
  iniciado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  CHECK (finalizado_em IS NULL OR finalizado_em >= iniciado_em)
);

CREATE INDEX IF NOT EXISTS idx_movimentos_iniciado_em
  ON movimentos (iniciado_em DESC);

-- Ângulo de cada servo no início e no fim de um movimento.
-- São 8 linhas por movimento (servos 0 a 7). angulo_fim fica nulo até
-- o movimento ser finalizado.
CREATE TABLE IF NOT EXISTS movimento_angulos (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  movimento_id  INTEGER  NOT NULL REFERENCES movimentos (id) ON DELETE CASCADE,
  servo         SMALLINT NOT NULL CHECK (servo BETWEEN 0 AND 7),
  angulo_inicio SMALLINT NOT NULL CHECK (angulo_inicio BETWEEN 1 AND 180),
  angulo_fim    SMALLINT CHECK (angulo_fim BETWEEN 1 AND 180),
  UNIQUE (movimento_id, servo)
);
