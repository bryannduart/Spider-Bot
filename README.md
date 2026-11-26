# Spider Bot

Robô aranha de quatro patas com ESP8266 e 8 servomotores, acompanhado de um site de documentação, uma API em Node.js com PostgreSQL e um aplicativo PWA de controle. Projeto acadêmico de Engenharia de Software (UNIVASSOURAS).

- [Acessar o site](https://spider--bot.vercel.app)
- [Acessar o app](https://spider--bot.vercel.app/app/)
- [Acessar a API](https://spider-bot-api.vercel.app/api/health)

> **Status:** site, app e backend publicados no Vercel e conectados ao banco (Neon). O kit físico ainda não chegou, então **nada foi testado com o robô real**.

## Sobre o projeto

O professor pediu um site com front-end e back-end que documente o projeto Arduino da aranha robótica (kit com ESP8266). O repositório está dividido em três partes:

| Pasta | O que é |
| --- | --- |
| `frontend/` | Site público de documentação: componentes, montagem, comandos, código Arduino e requisitos. Inclui um Gauge de demonstração ligado ao banco de dados. |
| `frontend/app/` | Aplicativo PWA de controle, instalável, com acesso ao painel do robô. Fica dentro do `frontend/` e é publicado junto com o site, em `/app/`. |
| `backend/` | API em Node.js/Express que grava e lista registros e movimentos no PostgreSQL (Neon). |

## Tecnologias

- **Front-end:** HTML, CSS e JavaScript puro
- **App:** PWA (manifest e service worker)
- **Back-end:** Node.js 22, Express 5, `pg`, `cors`, `dotenv` e `express-rate-limit`
- **Banco de dados:** PostgreSQL no Neon (conexão com pooling)
- **Hospedagem:** Vercel (site com o app e API em projetos separados)
- **Robô:** ESP8266, 8 servomotores, firmware v2.0

## Por que o site não controla o robô

- O robô cria a própria rede Wi-Fi, sem internet, e responde por HTTP em `192.168.4.1`.
- Pelas regras dos navegadores, uma página em HTTPS (como o site publicado) não pode chamar um endereço HTTP, e o celular conectado ao robô fica sem internet.
- Por isso o site só documenta e tem um botão que abre o painel original do robô. O app segue o mesmo caminho, e os botões próprios dele são um experimento.
- Se for preciso controlar o robô com layout próprio, a alternativa é empacotar o app (por exemplo, com Capacitor para Android). Isso só será decidido depois dos testes com o kit real.

O Gauge do site é uma **demonstração** do ângulo definido na interface (servo de 0 a 7, ângulo de 1 a 180). O firmware não envia telemetria, então ele não mede nada do robô.

## Situação das funcionalidades

| Funcionalidade | Situação |
| --- | --- |
| API do backend (`health`, registros e movimentos) com o banco no Neon | Implementada, testada e publicada |
| Site: seções Sobre, Kit, Montagem, Controle, Código, Requisitos e Aplicativo | Implementado e publicado (a Montagem será ajustada com o kit real) |
| Site: Gauge, formulário e histórico dos 10 últimos registros | Implementado e publicado, conectado à API |
| Site: botão "Abrir painel do robô" (`192.168.4.1`) | Implementado, não testado com o robô |
| App: botão "Instalar" e funcionamento como PWA | Implementado e publicado em `/app/`; falta testar a instalação no celular |
| App: controle experimental com os 15 movimentos | Implementado, não testado com o robô |
| Diagramas de ligação no Fritzing | Planejado (aguardando orientação do professor) |
| Montagem com fotos reais e testes dos comandos | Planejado (depende da chegada do kit) |

Os requisitos funcionais e não funcionais, com a situação de cada um, estão na seção **Requisitos** do site.

## Estrutura do repositório

```text
spider-bot/
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── schema.sql
│   └── server.js
├── frontend/
│   ├── app/                   # PWA de controle (publicado em /app/)
│   │   ├── assets/
│   │   │   ├── favicon/
│   │   │   └── images/        # ícones do PWA (192 e 512)
│   │   ├── app.js
│   │   ├── index.html
│   │   ├── manifest.json
│   │   ├── service-worker.js
│   │   └── style.css
│   ├── assets/images/         # fotos do robô e ícones
│   ├── js/main.js
│   ├── style/style.css
│   ├── favicon.ico
│   └── index.html
├── .gitignore
└── README.md
```

## Como executar localmente

Pré-requisitos: Node.js 22, uma conta no [Neon](https://neon.tech) (PostgreSQL) e a extensão Live Server do VS Code.

### Backend

```bash
cd backend
npm install
cp .env.example .env    # no Windows: copy .env.example .env
npm run dev
```

Preencha o `.env` com as variáveis abaixo. **Nunca envie esse arquivo ao Git** (ele já está no `.gitignore`).

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do Neon (obrigatória; use a versão com `-pooler`) |
| `PORT` | Porta da API (padrão `3000`) |
| `CORS_ORIGINS` | Endereços do site permitidos, separados por vírgula e sem barra no final (padrão: `http://127.0.0.1:5500,http://localhost:5500`) |

Na primeira requisição, o servidor cria as tabelas automaticamente executando o `schema.sql`.

### Site

Com a pasta `spider-bot/` aberta no VS Code, clique com o botão direito em `frontend/index.html` e escolha **Open with Live Server**.

No `frontend/js/main.js`, o endereço da API muda sozinho: em `localhost` usa `http://localhost:3000`, e em produção usa a constante `API_PRODUCAO` (hoje `https://spider-bot-api.vercel.app`).

### App

Abra `frontend/app/index.html` com o Live Server. O service worker guarda os arquivos em cache: sempre que alterar algo em `frontend/app/`, aumente o `CACHE_NAME` em `service-worker.js` (por exemplo, `v3` para `v4`), senão o navegador continua mostrando a versão antiga.

## API

Base: `https://spider-bot-api.vercel.app`

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica se a API e o banco estão respondendo |
| `POST` | `/api/registros` | Grava um registro (`servo` de 0 a 7, `angulo` de 1 a 180) |
| `GET` | `/api/registros` | Lista os 10 registros mais recentes |
| `POST` | `/api/movimentos` | Inicia um movimento (`nome` e `angulos` com 8 valores de 1 a 180) |
| `POST` | `/api/movimentos/:id/finalizar` | Finaliza o movimento e grava os 8 ângulos finais |
| `GET` | `/api/movimentos` | Lista os 10 movimentos mais recentes, com ângulo inicial e final de cada servo |

Exemplo de resposta do `/api/health`:

```json
{ "status": "ok", "banco": "conectado" }
```

### Banco de dados

| Tabela | Campos principais |
| --- | --- |
| `registros_interface` | `id`, `servo` (0 a 7), `angulo` (1 a 180), `criado_em` |
| `movimentos` | `id`, `nome`, `iniciado_em`, `finalizado_em` |
| `movimento_angulos` | `id`, `movimento_id`, `servo` (0 a 7), `angulo_inicio`, `angulo_fim` |

### Segurança

- Validação dos dados no servidor e no banco (`CHECK` nas tabelas).
- Consultas parametrizadas, sem concatenar texto no SQL.
- Limite de requisições por IP a cada 15 minutos: 200 leituras e 60 gravações.
- CORS restrito aos endereços definidos em `CORS_ORIGINS`.
- A string do banco fica só nas variáveis de ambiente, nunca no código.

## Publicação (deploy)

O site (com o app) e a API são dois projetos separados no Vercel.

### API (projeto `spider-bot-api`)

- Importada do GitHub (`bryannduart/Spider-Bot`, branch `main`).
- **Root Directory:** `backend`
- **Application Preset:** Express, sem Build Command nem Output Directory.
- **Variáveis de ambiente:** `DATABASE_URL` e `CORS_ORIGINS` (com o endereço do site, sem barra no final).
- A cada `git push` na `main`, a API é publicada de novo sozinha.
- Para mudar uma variável de ambiente, é preciso fazer um novo deploy (Deployments, Redeploy).

### Site e app (projeto `spider--bot`)

- Esse projeto **não está ligado ao Git**: o push no GitHub não atualiza o site.
- O app (PWA) está dentro de `frontend/app/`, então é publicado junto com o site e abre em `https://spider--bot.vercel.app/app/`.
- Para publicar uma mudança do site ou do app, rode na pasta `frontend`:

```bash
npx vercel --prod
```

- Em "Which project?", escolha `spider--bot`. Em "Pull development environment variables", responda `n`.

### Observação

No plano gratuito, a primeira chamada depois de um tempo parado pode demorar um pouco. Antes de apresentar, vale abrir o `/api/health` para deixar tudo aquecido.

## O robô (firmware v2.0)

Os dados abaixo vêm da leitura do código do firmware v2.0. **Não foram testados com o robô físico** e precisam ser conferidos no kit recebido (o tutorial do kit menciona outro nome de rede).

| Item | Valor |
| --- | --- |
| Rede Wi-Fi | `Spider Robot` (senha `12345678`) |
| Endereço do painel | `http://192.168.4.1` |
| Movimento pronto | `GET /controller?pm=N` (N de 1 a 15) |
| Servo individual | `GET /controller?servo=ID&value=ANGULO` |

Os 15 movimentos, as rotas do servidor e as funções principais do código estão documentados no site.

## Documentação oficial do kit

- [Tutorial](https://data.stemedu.cc/zzv20or21.htm)
- [Código-fonte](https://drive.google.com/file/d/1mJpzkrFjT5Ykf3K9TATh7FCRjT-tHTvJ/view?usp=sharing)
- [Código V2.0](https://drive.google.com/file/d/1rm_43HZVcIB1BjmPO8DloVymBM9K2gza/view?usp=sharing)
- [Código de alta velocidade, sem LED](https://drive.google.com/file/d/1wgJF0tE8qB57Qblvy6lUvdtnBuktMMi-/view?usp=sharing)
- [Esquema elétrico V2.0](https://drive.google.com/file/d/12euE4HX-JxXfj6-QNwSl7xX1uT0yXiKu/view?usp=sharing)
- [Arquivos de referência do robô](https://drive.google.com/file/d/1RUR8PPGyxwwySmHFg7AEg8Us52umAKPN/view?usp=sharing)

## Autor

Bryan Duarte de Araujo Pereira — Engenharia de Software, Universidade de Vassouras (UNIVASSOURAS).
