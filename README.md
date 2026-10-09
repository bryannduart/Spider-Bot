# 🕷️ Spider Bot

**Projeto de robótica quadrúpede com ESP8266, servomotores, interface web responsiva e aplicativo PWA para controle.**

O **Spider Bot** é um projeto acadêmico de robótica e desenvolvimento de software que combina hardware, programação embarcada e tecnologias web. A proposta é documentar e desenvolver uma plataforma para um robô de quatro patas, utilizando um microcontrolador ESP8266 e oito servomotores para executar movimentos coordenados.

O repositório reúne a documentação técnica do projeto, o site público, a estrutura do aplicativo de controle e os recursos necessários para evoluir a solução até a integração com o hardware real.

> **Status do projeto:** em desenvolvimento. A documentação web e a estrutura inicial da interface estão sendo organizadas. A integração efetiva com o robô depende da análise e validação do firmware e do hardware do kit.

---

## Sumário

* [Sobre o projeto](#-sobre-o-projeto)
* [Objetivos](#-objetivos)
* [Características do robô](#-características-do-robô)
* [Tecnologias utilizadas](#-tecnologias-utilizadas)
* [Arquitetura do repositório](#-arquitetura-do-repositório)
* [Funcionalidades](#-funcionalidades)
* [Requisitos funcionais](#-requisitos-funcionais)
* [Requisitos não funcionais](#-requisitos-não-funcionais)
* [Hardware e componentes](#-hardware-e-componentes)
* [Montagem do robô](#-montagem-do-robô)
* [Firmware e programação embarcada](#-firmware-e-programação-embarcada)
* [Aplicativo de controle PWA](#-aplicativo-de-controle-pwa)
* [Banco de dados e backend](#-banco-de-dados-e-backend)
* [Executando o projeto](#-executando-o-projeto)
* [Documentação de referência](#-documentação-de-referência)
* [Próximas etapas](#-próximas-etapas)
* [Contribuição](#-contribuição)
* [Licença](#-licença)

---

## 🔎 Sobre o projeto

O Spider Bot tem como propósito integrar conhecimentos de Engenharia de Software, robótica, sistemas embarcados, interfaces digitais e documentação técnica.

O projeto está organizado em duas frentes principais:

**1. Site público de documentação**

Interface web responsável por apresentar o projeto, seus componentes, as etapas de montagem, os recursos de hardware, as referências técnicas e a documentação do firmware.

**2. Aplicativo PWA de controle**

Aplicativo web progressivo planejado para dispositivos móveis, com interface voltada ao controle do robô e à apresentação de informações de funcionamento, conforme os recursos suportados pelo firmware.

A arquitetura também prevê a possibilidade de incorporar um backend e um banco de dados PostgreSQL para persistir informações definidas durante o desenvolvimento.

O desenvolvimento é incremental: cada funcionalidade deve ser validada de acordo com o hardware disponível, a documentação do fabricante e os testes realizados.

## 🎯 Objetivos

* Documentar a construção e o funcionamento de um robô quadrúpede.
* Estudar o controle de servomotores por meio de um microcontrolador ESP8266.
* Organizar e explicar as funções do firmware Arduino.
* Desenvolver uma interface web responsiva e acessível.
* Criar uma aplicação PWA dedicada ao controle do robô.
* Investigar a comunicação entre a interface e o dispositivo físico.
* Planejar indicadores digitais para informações realmente disponíveis.
* Avaliar a utilização de PostgreSQL para persistência de dados.
* Aplicar boas práticas de organização, documentação e manutenção de software.

## 🤖 Características do robô

O projeto utiliza como referência um kit de robótica quadrúpede com os seguintes elementos:

| Componente          | Finalidade                                           |
| ------------------- | ---------------------------------------------------- |
| ESP8266 / NodeMCU   | Microcontrolador e recursos de conectividade sem fio |
| 8 servomotores SG90 | Acionamento das articulações do robô                 |
| Placa de expansão   | Organização das conexões, conforme a versão do kit   |
| Estrutura mecânica  | Corpo e articulações das quatro patas                |
| Bateria e cabos     | Alimentação e conexão dos componentes                |

As especificações devem ser confirmadas com o kit recebido, pois podem existir diferenças entre versões do hardware e do firmware.

## 🧰 Tecnologias utilizadas

### Frontend

* **HTML5** — estrutura das páginas.
* **CSS3** — identidade visual, layouts e responsividade.
* **JavaScript** — comportamento da interface e preparação das integrações.
* **Progressive Web App (PWA)** — instalação e recursos de aplicação web progressiva.

### Hardware e sistemas embarcados

* **ESP8266 / NodeMCU** — microcontrolador de referência.
* **Arduino C/C++** — linguagem utilizada no desenvolvimento de firmware compatível com a plataforma.
* **Servomotores SG90** — movimentação das articulações.
* **Wi-Fi** — comunicação sem fio, conforme a configuração efetiva do firmware.

### Backend e persistência planejados

* **Node.js** — possível ambiente de execução do backend.
* **API HTTP** — possível interface de comunicação entre serviços.
* **PostgreSQL** — banco de dados previsto para persistência de informações.

> As tecnologias de backend e banco de dados fazem parte do escopo planejado e não devem ser consideradas implementadas até que existam código, configuração e testes correspondentes no repositório.

## 📁 Arquitetura do repositório

A organização atual separa o site público, o aplicativo de controle e o espaço destinado ao backend.

```text
spider-bot/
├── app/
│   ├── assets/
│   │   └── images/
│   │       ├── icon-app-192.png
│   │       └── icon-app-512.png
│   ├── app.js
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   └── style.css
│
├── backend/
│   └── [estrutura a desenvolver]
│
├── frontend/
│   ├── assets/
│   │   └── images/
│   │       └── spiderbot icon.png
│   ├── js/
│   │   └── main.js
│   ├── style/
│   │   └── style.css
│   └── index.html
│
├── .gitignore
└── README.md
```

**Responsabilidades das pastas:**

* `frontend/`: site público e documentação do projeto.
* `app/`: aplicativo PWA dedicado ao controle do robô.
* `backend/`: espaço reservado para serviços de backend e integração com o banco de dados.

A estrutura pode evoluir conforme novas funcionalidades forem implementadas.

## ⚙️ Funcionalidades

### Site público

| Funcionalidade                                 | Situação                                    |
| ---------------------------------------------- | ------------------------------------------- |
| Estrutura HTML da página                       | Implementada inicialmente                   |
| Identidade visual e tema escuro                | Implementados inicialmente                  |
| Navegação entre seções                         | Implementada por links internos             |
| Layout responsivo                              | Implementado inicialmente; sujeito a testes |
| Documentação introdutória do projeto           | Estruturada                                 |
| Seção de componentes do kit                    | Estruturada                                 |
| Seção de montagem                              | Estruturada inicialmente                    |
| Seção de controle e comandos                   | Estruturada para documentação               |
| Seção de código Arduino                        | Estruturada para documentação               |
| Galeria de fotografias reais                   | Pendente de desenvolvimento                 |
| Documentação detalhada das funções do firmware | Pendente de análise do código original      |

### Aplicativo e integração

| Funcionalidade                       | Situação                                |
| ------------------------------------ | --------------------------------------- |
| Estrutura inicial do PWA             | Presente no projeto; requer validação   |
| Manifesto e ícones do aplicativo     | Configurados inicialmente               |
| Cache por service worker             | Configurado inicialmente; requer testes |
| Comunicação real com o ESP8266       | Pendente                                |
| Controles de movimentação integrados | Pendente de análise do firmware         |
| Indicador Gauge com dados reais      | Pendente de definição da fonte de dados |
| Backend e API                        | A desenvolver ou validar                |
| Persistência em PostgreSQL           | Pendente de implementação e testes      |

A classificação acima descreve o estado de desenvolvimento pretendido nesta etapa. A presença de arquivos de interface não comprova, por si só, a conclusão de uma funcionalidade.

## 📋 Requisitos funcionais

Os requisitos funcionais descrevem os comportamentos que o sistema deverá oferecer.

| ID   | Requisito                                                 | Situação               |
| ---- | --------------------------------------------------------- | ---------------------- |
| RF01 | Apresentar informações gerais do Spider Bot               | Estruturado            |
| RF02 | Documentar os componentes e as etapas de montagem         | Em desenvolvimento     |
| RF03 | Disponibilizar referências e documentação do firmware     | Em desenvolvimento     |
| RF04 | Oferecer uma interface PWA dedicada ao controle do robô   | Planejado              |
| RF05 | Apresentar o estado real da comunicação com o dispositivo | Pendente de integração |
| RF06 | Exibir um indicador Gauge com dados válidos               | Pendente de definição  |
| RF07 | Persistir informações selecionadas no PostgreSQL          | Planejado              |
| RF08 | Informar erros e indisponibilidade de comunicação         | Pendente de integração |

Os requisitos devem ser refinados de acordo com o escopo acadêmico, o hardware e os testes.

## 🛡️ Requisitos não funcionais

Os requisitos não funcionais definem características de qualidade e restrições técnicas.

* **RNF01 — Responsividade:** adaptar a interface a computadores, tablets e celulares.
* **RNF02 — Usabilidade:** manter a navegação clara e os controles compreensíveis.
* **RNF03 — Acessibilidade:** oferecer contraste adequado, foco visível e navegação por teclado.
* **RNF04 — Manutenibilidade:** organizar HTML, CSS e JavaScript de forma compreensível.
* **RNF05 — Confiabilidade:** informar estados indisponíveis sem apresentar dados fictícios.
* **RNF06 — Segurança:** proteger credenciais, configurações e eventuais dados persistidos.
* **RNF07 — Compatibilidade:** testar a aplicação nos navegadores e dispositivos definidos para o projeto.
* **RNF08 — Documentação:** registrar procedimentos de montagem, configuração e execução.

Esses requisitos deverão ser verificados durante a validação do sistema.

## 🔩 Hardware e componentes

O hardware de referência é um robô quadrúpede com ESP8266 e oito servomotores.

Antes de ligar ou montar o dispositivo:

1. Confira os componentes recebidos e a versão do kit.
2. Leia o manual de montagem.
3. Identifique a orientação correta dos servomotores.
4. Verifique a alimentação e a polaridade das conexões.
5. Organize a fiação para evitar interferências nas articulações.
6. Execute os testes iniciais conforme as instruções do fabricante.

A montagem definitiva e os detalhes de conexão devem seguir a documentação específica do hardware recebido.

## 🏗️ Montagem do robô

A documentação de montagem será ampliada conforme o desenvolvimento físico do projeto.

O registro deverá incluir:

1. Conferência dos componentes.
2. Preparação e inicialização dos servomotores.
3. Montagem do corpo e das articulações.
4. Instalação das patas.
5. Organização da fiação.
6. Verificação das conexões e da alimentação.
7. Testes iniciais de movimento.
8. Fotografias e observações da montagem real.

As etapas e as imagens serão atualizadas de acordo com o manual e com a execução efetiva do projeto.

## 💻 Firmware e programação embarcada

O firmware é responsável por executar a lógica embarcada e controlar os componentes conectados ao microcontrolador.

A documentação técnica deverá identificar:

* Inicialização do microcontrolador.
* Bibliotecas utilizadas.
* Configuração dos pinos.
* Inicialização dos servomotores.
* Funções de movimentação.
* Recebimento e interpretação dos comandos.
* Comunicação Wi-Fi.
* Tratamento de erros e condições de segurança.

O código original do fabricante deve ser analisado antes de implementar alterações. Os nomes das funções, os pinos, os comandos e o protocolo deverão corresponder ao firmware efetivamente utilizado.

## 📱 Aplicativo de controle PWA

O aplicativo de controle está separado do site público e utiliza uma estrutura própria.

A proposta é permitir o acesso por dispositivos móveis e, após a implementação e validação da integração, disponibilizar comandos de movimentação e informações de estado.

O desenvolvimento deverá contemplar:

* Interface adaptada a telas sensíveis ao toque.
* Manifesto PWA e ícones.
* Estratégia de cache e atualização.
* Estados de conexão e desconexão.
* Comunicação compatível com o firmware.
* Tratamento de falhas.
* Indicadores alimentados por dados reais.

O comportamento offline do PWA não implica que o robô possa ser controlado sem a conectividade necessária. Isso depende da arquitetura e do protocolo implementados.

## 🗄️ Banco de dados e backend

O projeto prevê avaliar o uso de PostgreSQL para armazenar informações que precisem ser persistidas.

Os dados candidatos incluem configurações da interface, registros de eventos, histórico de comandos e informações de execução, desde que sejam necessários e efetivamente produzidos pelo sistema.

Antes da implementação, deverão ser definidos:

* Modelo de dados.
* Estrutura das tabelas.
* API responsável pela persistência.
* Validação das entradas.
* Tratamento de erros.
* Gerenciamento de credenciais.
* Regras de retenção dos registros.

O backend hospedado na internet não terá necessariamente acesso direto ao ESP8266. Essa possibilidade depende de como o robô se conecta à rede e de como a comunicação será arquitetada.

## 🚀 Executando o projeto

### Pré-requisitos

* Git.
* Visual Studio Code ou editor equivalente.
* Navegador web moderno.
* Servidor HTTP local para testar os arquivos do frontend.
* Arduino IDE ou ambiente equivalente, quando começar o trabalho com o firmware.

### Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd spider-bot
```

Substitua `<URL_DO_REPOSITORIO>` pelo endereço real do repositório.

### Abrir o projeto

Abra a pasta `spider-bot/` no VS Code.

Para testar o site público, utilize um servidor HTTP local apontando para a pasta `frontend/`. Uma extensão como Live Server pode ser utilizada para essa finalidade.

O site público estático não exige backend para exibir seu conteúdo documental atual.

### Testar o PWA

O PWA deverá ser servido em um ambiente compatível com os requisitos de instalação e service worker do navegador. Verifique o manifesto, os caminhos dos ícones e o registro do service worker nas ferramentas de desenvolvedor.

A execução do site público não significa que o aplicativo de controle já esteja conectado ao robô.

### Executar o firmware

A execução do firmware depende da identificação da placa, das bibliotecas, das conexões e da versão do código fornecido com o kit. Consulte a documentação do fabricante antes de carregar qualquer programa no dispositivo.

## 📚 Documentação de referência

A documentação a seguir foi utilizada como referência inicial para compreender o kit e suas possibilidades.

* **Manual de montagem:** [How to assemble a spider robot](https://data.stemedu.cc/zzv20or21.htm)
* [Arquivo de instruções de montagem](https://drive.google.com/file/d/1H8VnYow-E-yR0YHpdDrjSRG-L_OqinDvZ/view?usp=sharing)
* [Código-fonte de referência](https://drive.google.com/file/d/1mJpzkrFjT5Ykf3K9TATh7FCRjT-tHTvJ/view?usp=sharing)
* [Código alternativo de alta velocidade sem LED](https://drive.google.com/file/d/1wgJF0tE8qB57Qblvy6lUvdtnBuktMMi-/view?usp=sharing)
* [Arquivos de referência do robô](https://drive.google.com/file/d/1RUR8PPGyxwwySmHFg7AEg8Us52umAKPN/view?usp=sharing)
* [Código-fonte V2.0](https://drive.google.com/file/d/1rm_43HZVcIB1BjmPO8DloVymBM9K2gza/view?usp=sharing)
* [Esquema elétrico V2.0](https://drive.google.com/file/d/12euE4HX-JxXfj6-QNwSl7xX1uT0yXiKu/view?usp=sharing)

Os arquivos externos são referências do fabricante ou do kit. A versão correta para utilização deve ser identificada comparando o firmware com o hardware efetivamente recebido.

## 🧭 Próximas etapas

* [ ] Revisar a estrutura e a responsividade do site público.
* [ ] Completar a documentação dos componentes.
* [ ] Registrar a montagem com fotografias reais.
* [ ] Analisar o firmware original.
* [ ] Documentar as funções reais do código Arduino.
* [ ] Confirmar o protocolo de comunicação do ESP8266.
* [ ] Validar o manifesto e o service worker do PWA.
* [ ] Implementar e testar os controles do aplicativo.
* [ ] Definir e implementar o indicador Gauge.
* [ ] Especificar o modelo de dados PostgreSQL.
* [ ] Implementar o backend necessário.
* [ ] Testar a integração com o robô físico.
* [ ] Publicar e validar as versões hospedadas.

## 📄 Licença

A licença deste projeto deverá ser definida e registrada no repositório.

Até que exista um arquivo `LICENSE` com os termos escolhidos, não presuma que o projeto possui licença MIT ou outra licença específica.

---

**Spider Bot** — integração entre robótica, programação embarcada e desenvolvimento web.

Projeto acadêmico em desenvolvimento.
