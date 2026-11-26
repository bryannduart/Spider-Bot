'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');

const PORT = process.env.PORT || 3000;
const TOTAL_SERVOS = 8;
const ID_MAXIMO = 2147483647;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Crie o arquivo backend/.env (veja .env.example).');
  process.exit(1);
}

const origensPermitidas = (
  process.env.CORS_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500'
)
  .split(',')
  .map((origem) => origem.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Poucas conexões por instância: na Vercel várias instâncias podem rodar ao mesmo tempo.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
pool.on('error', (erro) => {
  console.error('Erro em conexão ociosa do banco:', erro.message);
});

const app = express();

// Em hospedagens como o Render, a API fica atrás de um proxy.
// Sem isso, o limite de requisições enxergaria o IP do proxy, e não o do visitante.
app.set('trust proxy', 1);

app.use(cors({ origin: origensPermitidas }));
app.use(express.json({ limit: '10kb' }));

/**
 * Valida a lista de ângulos de um movimento: 8 inteiros, de 1 a 180,
 * na ordem dos servos (posição 0 = servo 0).
 */
function angulosValidos(angulos) {
  return (
    Array.isArray(angulos) &&
    angulos.length === TOTAL_SERVOS &&
    angulos.every((angulo) => Number.isInteger(angulo) && angulo >= 1 && angulo <= 180)
  );
}

/**
 * Verifica se a API e o banco estão respondendo.
 */
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', banco: 'conectado' });
  } catch (erro) {
    console.error('Falha ao consultar o banco:', erro.message);
    res.status(503).json({ status: 'erro', banco: 'indisponível' });
  }
});

/**
 * Limite de requisições por IP, para a API aberta na internet não ser
 * usada para encher o banco. A rota /api/health fica fora do limite.
 */
const mensagemLimite = { erro: 'Muitas requisições. Tente novamente em alguns minutos.' };

const limitarLeituras = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensagemLimite
});

const limitarGravacoes = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensagemLimite
});

app.use('/api', (req, res, next) => {
  const limitador = req.method === 'GET' ? limitarLeituras : limitarGravacoes;

  return limitador(req, res, next);
});

/**
 * Garante que as tabelas existam antes de atender qualquer rota da API.
 */
app.use('/api', async (_req, res, next) => {
  try {
    await garantirTabelas();
    next();
  } catch (erro) {
    console.error('Não foi possível preparar o banco:', erro.message);
    res.status(503).json({ erro: 'Banco de dados indisponível' });
  }
});

/**
 * Grava um registro do Gauge (servo, ângulo e data/hora).
 */
app.post('/api/registros', async (req, res) => {
  const { servo, angulo } = req.body ?? {};

  if (!Number.isInteger(servo) || servo < 0 || servo > 7) {
    return res.status(400).json({ erro: 'servo deve ser um inteiro de 0 a 7' });
  }

  if (!Number.isInteger(angulo) || angulo < 1 || angulo > 180) {
    return res.status(400).json({ erro: 'angulo deve ser um inteiro de 1 a 180' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO registros_interface (servo, angulo)
       VALUES ($1, $2)
       RETURNING id, servo, angulo, criado_em`,
      [servo, angulo]
    );

    return res.status(201).json(rows[0]);
  } catch (erro) {
    console.error('Falha ao gravar o registro:', erro.message);
    return res.status(500).json({ erro: 'Não foi possível gravar o registro' });
  }
});

/**
 * Lista os 10 registros mais recentes.
 */
app.get('/api/registros', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, servo, angulo, criado_em
       FROM registros_interface
       ORDER BY id DESC
       LIMIT 10`
    );

    res.json(rows);
  } catch (erro) {
    console.error('Falha ao consultar os registros:', erro.message);
    res.status(500).json({ erro: 'Não foi possível consultar os registros' });
  }
});

/**
 * Inicia um movimento: grava o nome, o horário de início e o ângulo
 * inicial dos 8 servos.
 *
 * Corpo: { nome: "Andar para frente", angulos: [90, 90, ... 8 valores] }
 */
app.post('/api/movimentos', async (req, res) => {
  const { nome, angulos } = req.body ?? {};
  const nomeLimpo = typeof nome === 'string' ? nome.trim() : '';

  if (nomeLimpo.length < 1 || nomeLimpo.length > 60) {
    return res.status(400).json({ erro: 'nome deve ter de 1 a 60 caracteres' });
  }

  if (!angulosValidos(angulos)) {
    return res.status(400).json({ erro: 'angulos deve ter 8 inteiros, de 1 a 180' });
  }

  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const { rows } = await cliente.query(
      `INSERT INTO movimentos (nome)
       VALUES ($1)
       RETURNING id, nome, iniciado_em`,
      [nomeLimpo]
    );

    await cliente.query(
      `INSERT INTO movimento_angulos (movimento_id, servo, angulo_inicio)
       SELECT $1::int, (t.posicao - 1)::smallint, t.valor::smallint
       FROM unnest($2::int[]) WITH ORDINALITY AS t(valor, posicao)`,
      [rows[0].id, angulos]
    );

    await cliente.query('COMMIT');
    return res.status(201).json(rows[0]);
  } catch (erro) {
    await cliente.query('ROLLBACK');
    console.error('Falha ao iniciar o movimento:', erro.message);
    return res.status(500).json({ erro: 'Não foi possível iniciar o movimento' });
  } finally {
    cliente.release();
  }
});

/**
 * Finaliza um movimento: grava o horário de término e o ângulo final
 * dos 8 servos.
 *
 * Corpo: { angulos: [135, 90, ... 8 valores] }
 */
app.post('/api/movimentos/:id/finalizar', async (req, res) => {
  const id = Number(req.params.id);
  const { angulos } = req.body ?? {};

  if (!Number.isInteger(id) || id < 1 || id > ID_MAXIMO) {
    return res.status(400).json({ erro: 'id de movimento inválido' });
  }

  if (!angulosValidos(angulos)) {
    return res.status(400).json({ erro: 'angulos deve ter 8 inteiros, de 1 a 180' });
  }

  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const { rows } = await cliente.query(
      `UPDATE movimentos
       SET finalizado_em = now()
       WHERE id = $1 AND finalizado_em IS NULL
       RETURNING id, nome, iniciado_em, finalizado_em`,
      [id]
    );

    if (rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res
        .status(404)
        .json({ erro: 'Movimento não encontrado ou já finalizado' });
    }

    await cliente.query(
      `UPDATE movimento_angulos AS ma
       SET angulo_fim = t.valor::smallint
       FROM unnest($2::int[]) WITH ORDINALITY AS t(valor, posicao)
       WHERE ma.movimento_id = $1::int AND ma.servo = (t.posicao - 1)`,
      [id, angulos]
    );

    await cliente.query('COMMIT');
    return res.json(rows[0]);
  } catch (erro) {
    await cliente.query('ROLLBACK');
    console.error('Falha ao finalizar o movimento:', erro.message);
    return res.status(500).json({ erro: 'Não foi possível finalizar o movimento' });
  } finally {
    cliente.release();
  }
});

/**
 * Lista os 10 movimentos mais recentes, com o ângulo inicial e o final
 * de cada servo. Se o movimento não foi finalizado, "fim" vem nulo.
 */
app.get('/api/movimentos', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.nome, m.iniciado_em, m.finalizado_em,
              json_agg(
                json_build_object(
                  'servo', a.servo,
                  'inicio', a.angulo_inicio,
                  'fim', a.angulo_fim
                )
                ORDER BY a.servo
              ) AS servos
       FROM (
         SELECT id, nome, iniciado_em, finalizado_em
         FROM movimentos
         ORDER BY id DESC
         LIMIT 10
       ) AS m
       JOIN movimento_angulos AS a ON a.movimento_id = m.id
       GROUP BY m.id, m.nome, m.iniciado_em, m.finalizado_em
       ORDER BY m.id DESC`
    );

    res.json(rows);
  } catch (erro) {
    console.error('Falha ao consultar os movimentos:', erro.message);
    res.status(500).json({ erro: 'Não foi possível consultar os movimentos' });
  }
});

/**
 * Tratamento de erros (por exemplo, JSON inválido no corpo da requisição).
 */
app.use((erro, _req, res, _next) => {
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido' });
  }

  console.error('Erro inesperado:', erro.message);
  return res.status(500).json({ erro: 'Erro interno' });
});

/**
 * Cria as tabelas, caso ainda não existam, executando o schema.sql.
 * Roda uma vez por instância. Se o schema.sql não estiver no pacote
 * publicado, assume que as tabelas já foram criadas no banco.
 */
let bancoPronto = null;

function garantirTabelas() {
  if (!bancoPronto) {
    bancoPronto = (async () => {
      let sql;

      try {
        sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      } catch (erro) {
        if (erro.code === 'ENOENT') {
          console.warn('schema.sql não encontrado: assumindo que as tabelas já existem.');
          return;
        }

        throw erro;
      }

      await pool.query(sql);
    })().catch((erro) => {
      bancoPronto = null; // tenta de novo na próxima requisição
      throw erro;
    });
  }

  return bancoPronto;
}

/**
 * Rodando direto (npm run dev), sobe o servidor na porta configurada.
 * Na Vercel, o app é apenas exportado e a plataforma cuida do servidor.
 */
if (require.main === module) {
  garantirTabelas()
    .then(() => {
      console.info('Banco pronto: tabelas verificadas (registros_interface, movimentos, movimento_angulos).');

      app.listen(PORT, () => {
        console.info(`API em execução: http://localhost:${PORT}`);
      });
    })
    .catch((erro) => {
      console.error('Não foi possível preparar o banco:', erro.message);
      process.exit(1);
    });
}

module.exports = app;

