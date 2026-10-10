# Spider Bot

Robô aranha de quatro patas com ESP8266 e 8 servomotores, acompanhado de um site de documentação, um backend em Node.js com PostgreSQL e um aplicativo PWA de controle. Projeto acadêmico de Engenharia de Software (UNIVASSOURAS).

> **Status:** em desenvolvimento. O site e o backend funcionam localmente. O kit físico ainda não chegou, então **nada foi testado com o robô real**. Site e backend ainda não foram publicados.

## Sobre o projeto

O professor pediu um site com front-end e back-end que documente o projeto Arduino da aranha robótica (kit com ESP8266). O repositório está dividido em três partes:

| Pasta | O que é |
| --- | --- |
| `frontend/` | Site público de documentação: componentes, montagem, comandos, código Arduino e requisitos. Inclui um Gauge de demonstração ligado ao banco de dados. |
| `app/` | Aplicativo PWA de controle, instalável, com acesso ao painel do robô. |
| `backend/` | API em Node.js/Express que grava e lista os registros do Gauge no PostgreSQL (Neon). |

## Por que o site não controla o robô

- O robô cria a própria rede Wi-Fi, sem internet, e responde por HTTP em `192.168.4.1`.
- Pelas regras dos navegadores, uma página em HTTPS (como o site publicado) não pode chamar um endereço HTTP, e o celular conectado ao robô fica sem internet.
- Por isso o site só documenta e tem um botão que abre o painel original do robô. O app segue o mesmo caminho, e os botões próprios dele são um experimento.
- Se for preciso controlar o robô com layout próprio, a alternativa é empacotar o app (por exemplo, com Capacitor para Android). Isso só será decidido depois dos testes com o kit real.

O Gauge do site é uma **demonstração** do ângulo definido na interface (servo de 0 a 7, ângulo de 1 a 180). O firmware não envia telemetria, então ele não mede nada do robô.

## Situação das funcionalidades

| Funcionalidade | Situação |
| --- | --- |
| API do backend (`health`, gravar e listar registros) com o banco no Neon | Implementada e testada localmente |
| Site: seções Sobre, Kit, Montagem, Controle, Código, Requisitos e Aplicativo | Implementado (a Montagem será ajustada com o kit real) |
| Site: Gauge, formulário e histórico dos 10 últimos registros | Implementado; depende do backend em execução |
| Site: botão "Abrir painel do robô" (`192.168.4.1`) | Implementado, não testado com o robô |
| App: botão "Instalar" e funcionamento como PWA | Implementado; falta testar publicado em HTTPS |
| App: controle experimental com os 15 movimentos | Implementado, não testado com o robô |
| Diagramas de ligação no Fritzing | Planejado (aguardando orientação do professor) |
| Montagem com fotos reais e testes dos comandos | Planejado (depende da chegada do kit) |
| Publicação do site e do backend | Planejado |

Os requisitos funcionais e não funcionais, com a situação de cada um, estão na seção **Requisitos** do site.

## Estrutura do repositório

```text
spider-bot/
├── app/
│   ├── assets/
│   │   ├── favicon/
│   │   └── images/            # ícones do PWA (192 e 512)
│   ├── app.js
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   └── style.css
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── schema.sql
│   └── server.js
├── frontend/
│   ├── assets/images/         # fotos do robô e ícones
│   ├── js/main.js
│   ├── style/style.css
│   ├── favicon.ico
│   └── index.html
├── .gitignore
└── README.md
```

## Como executar

Pré-requisitos: Node.js, uma conta no [Neon](https://neon.tech) (PostgreSQL) e a extensão Live Server do VS Code.

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
| `DATABASE_URL` | String de conexão do Neon |
| `PORT` | Porta da API (padrão `3000`) |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula (padrão: `http://127.0.0.1:5500,http://localhost:5500`) |

Ao iniciar, o servidor cria a tabela automaticamente executando o `schema.sql`.

### Site

Com a pasta `spider-bot/` aberta no VS Code, clique com o botão direito em `frontend/index.html` e escolha **Open with Live Server**.

O endereço do backend fica em `API_BASE`, no início de `frontend/js/main.js` (hoje `http://localhost:3000`). Troque pela URL publicada quando o backend estiver online.

### App

Abra `app/index.html` com o Live Server. O service worker guarda os arquivos em cache: sempre que alterar algo em `app/`, aumente o `CACHE_NAME` em `service-worker.js` (por exemplo, `v3` para `v4`), senão o navegador continua mostrando a versão antiga.

## API

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica se a API e o banco estão respondendo |
| `POST` | `/api/registros` | Grava um registro (`servo` de 0 a 7, `angulo` de 1 a 180) |
| `GET` | `/api/registros` | Lista os 10 registros mais recentes |

Tabela `registros_interface`: `id`, `servo` (0 a 7), `angulo` (1 a 180) e `criado_em` (data e hora). A validação é feita no servidor e no banco, e as consultas são parametrizadas.

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
- [Manual de montagem](https://drive.google.com/file/d/1H8VnYow-E-yR0YHpdDrjSRG-L_OqinDvZ/view?usp=sharing)
- [Código-fonte](https://drive.google.com/file/d/1mJpzkrFjT5Ykf3K9TATh7FCRjT-tHTvJ/view?usp=sharing)
- [Código V2.0](https://drive.google.com/file/d/1rm_43HZVcIB1BjmPO8DloVymBM9K2gza/view?usp=sharing)
- [Código de alta velocidade, sem LED](https://drive.google.com/file/d/1wgJF0tE8qB57Qblvy6lUvdtnBuktMMi-/view?usp=sharing)
- [Esquema elétrico V2.0](https://drive.google.com/file/d/12euE4HX-JxXfj6-QNwSl7xX1uT0yXiKu/view?usp=sharing)
- [Arquivos de referência do robô](https://drive.google.com/file/d/1RUR8PPGyxwwySmHFg7AEg8Us52umAKPN/view?usp=sharing)

## Próximas etapas

- [ ] Fritzing: diagramas de ligação no site, quando o professor definir o que exige
- [ ] Publicar o site (Vercel) e o backend, trocando o `API_BASE`
- [ ] Quando o kit chegar: conferir peças, versão e firmware gravado
- [ ] Fotografar a montagem e atualizar a seção Montagem com fotos e problemas reais
- [ ] Testar os 15 comandos e o painel `192.168.4.1`
- [ ] Atualizar os avisos de "não testado" e a situação dos requisitos
- [ ] Decidir se o controle com layout próprio exige empacotar o app (Capacitor)

## Autor

Bryan Duarte de Araujo Pereira — Engenharia de Software, Universidade de Vassouras (UNIVASSOURAS).

## Licença

Ainda não definida. Enquanto não existir um arquivo `LICENSE`, o projeto não tem licença de uso declarada.
