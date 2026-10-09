'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Crie o arquivo backend/.env (veja .env.example).');
  process.exit(1);
}

const origensPermitidas = (
  process.env.CORS_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500'
)
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();

app.use(cors({ origin: origensPermitidas }));
app.use(express.json({ limit: '10kb' }));

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
 * Cria a tabela, caso ainda não exista, executando o schema.sql.
 */
async function criarTabelas() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

async function iniciar() {
  try {
    await criarTabelas();
    console.info('Banco pronto: tabela registros_interface verificada.');

    app.listen(PORT, () => {
      console.info(`API em execução: http://localhost:${PORT}`);
    });
  } catch (erro) {
    console.error('Não foi possível preparar o banco:', erro.message);
    process.exit(1);
  }
}

iniciar();