'use strict';

/**
 * Spider Bot — funcionalidades da interface pública.
 *
 * Funcionalidades atuais:
 * - Inicialização da interface.
 * - Preparação do indicador de conexão.
 * - Indicador digital (Gauge) do ângulo definido na interface.
 * - Registro dos ângulos no banco de dados, por meio do backend.
 * - Um Gauge para cada servo (8 no total).
 * - Registro de movimentos: ângulo de cada servo no início e no fim.
 *
 * O site público não envia comandos ao robô. O controle do robô é feito
 * pelo painel do próprio ESP8266 (192.168.4.1) ou pelo aplicativo.
 */

// URL base do backend. No computador (localhost) usa o backend local.
// No site publicado, usa a URL do backend em produção.
const API_PRODUCAO = 'https://COLOQUE-AQUI-A-URL-DO-BACKEND';
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : API_PRODUCAO;
const API_REGISTROS = `${API_BASE}/api/registros`;
const API_MOVIMENTOS = `${API_BASE}/api/movimentos`;

// Faixa de ângulos usada pelo firmware e quantidade de servos do robô.
const TOTAL_SERVOS = 8;
const ANGULO_MIN = 1;
const ANGULO_MAX = 180;
const ANGULO_INICIAL = 90;

document.addEventListener('DOMContentLoaded', () => {
  inicializarInterface();

  console.info('Spider Bot: interface inicializada.');
});

/**
 * Prepara os elementos da interface.
 *
 * Nenhum estado de conexão ou valor de sensor é inventado.
 */
function inicializarInterface() {
  inicializarStatusRobo();
  inicializarIndicadores();
  inicializarGauge();
  inicializarMovimentos();
}

/**
 * Inicializa o indicador de conexão, caso exista no HTML.
 *
 * O elemento precisa possuir o atributo data-robot-status.
 */
function inicializarStatusRobo() {
  const status = document.querySelector('[data-robot-status]');

  if (!status) {
    return;
  }

  status.textContent = 'Não conectado';
  status.dataset.state = 'disconnected';

  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
}

/**
 * Prepara os indicadores digitais.
 *
 * Cada elemento pode possuir o atributo data-gauge.
 * O valor real é definido quando houver uma fonte de dados.
 */
function inicializarIndicadores() {
  const indicadores = document.querySelectorAll('[data-gauge]');

  indicadores.forEach((indicador) => {
    indicador.dataset.state = 'unavailable';

    indicador.setAttribute(
      'aria-label',
      'Dados ainda indisponíveis'
    );

    const valor = indicador.querySelector('[data-gauge-value]');

    if (valor) {
      valor.textContent = '--';
    }
  });
}

/**
 * Gauge do ângulo definido na interface.
 *
 * O valor vem do controle deslizante, que é uma entrada real do usuário.
 * Não é uma medição feita pelo robô.
 */
function inicializarGauge() {
  const gauge = document.querySelector('[data-gauge]');
  const seletorServo = document.getElementById('gaugeServo');
  const controleAngulo = document.getElementById('gaugeAngulo');
  const botao = document.getElementById('gaugeRegistrar');
  const status = document.getElementById('gaugeStatus');

  if (!gauge || !seletorServo || !controleAngulo || !botao || !status) {
    return;
  }

  const arco = gauge.querySelector('.gauge-fill');
  const ponteiro = gauge.querySelector('.gauge-needle');
  const valor = gauge.querySelector('[data-gauge-value]');
  const minimo = Number(gauge.dataset.min);
  const maximo = Number(gauge.dataset.max);
  const comprimento = arco.getTotalLength();

  arco.style.strokeDasharray = String(comprimento);

  function atualizarGauge(angulo) {
    const proporcao = (angulo - minimo) / (maximo - minimo);

    arco.style.strokeDashoffset = String(comprimento * (1 - proporcao));
    ponteiro.setAttribute('transform', `rotate(${-90 + proporcao * 180} 100 100)`);
    valor.textContent = String(angulo);

    gauge.dataset.state = 'ready';
    gauge.setAttribute('aria-label', `Ângulo definido: ${angulo} graus`);
  }

  function mostrarStatus(texto, estado) {
    status.textContent = texto;
    status.dataset.state = estado;
  }

  controleAngulo.addEventListener('input', () => {
    atualizarGauge(Number(controleAngulo.value));
  });

  botao.addEventListener('click', async () => {
    const servo = Number(seletorServo.value);
    const angulo = Number(controleAngulo.value);

    botao.disabled = true;
    mostrarStatus('Salvando registro...', 'info');

    try {
      await enviarRegistro(servo, angulo);
      mostrarStatus('Registro salvo no banco de dados.', 'ok');
      await carregarHistorico();
    } catch (erro) {
      console.error('Spider Bot: falha ao salvar o registro.', erro);
      mostrarStatus(
        'Não foi possível salvar. Verifique se o backend está em execução.',
        'error'
      );
    } finally {
      botao.disabled = false;
    }
  });

  atualizarGauge(Number(controleAngulo.value));
  carregarHistorico();
}

/**
 * Envia um registro (servo e ângulo) para o backend.
 */
async function enviarRegistro(servo, angulo) {
  return enviarJson(API_REGISTROS, { servo, angulo });
}

/**
 * Envia um corpo JSON por POST e devolve a resposta em JSON.
 * Lança um erro se o servidor não responder com sucesso.
 */
async function enviarJson(url, corpo) {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  });

  if (!resposta.ok) {
    throw new Error(`Resposta inesperada do servidor: ${resposta.status}`);
  }

  return resposta.json();
}

/**
 * Busca os últimos registros e atualiza a tabela.
 */
async function carregarHistorico() {
  const corpo = document.getElementById('gaugeHistorico');

  if (!corpo) {
    return;
  }

  try {
    const resposta = await fetch(API_REGISTROS);

    if (!resposta.ok) {
      throw new Error(`Resposta inesperada do servidor: ${resposta.status}`);
    }

    renderizarHistorico(corpo, await resposta.json());
  } catch (erro) {
    console.warn('Spider Bot: histórico indisponível.', erro);
    renderizarMensagem(corpo, 'Histórico indisponível: backend não conectado.');
  }
}

function renderizarMensagem(corpo, texto) {
  const linha = document.createElement('tr');
  const celula = document.createElement('td');

  celula.colSpan = 4;
  celula.textContent = texto;
  linha.appendChild(celula);

  corpo.replaceChildren(linha);
}

function renderizarHistorico(corpo, registros) {
  if (!Array.isArray(registros) || registros.length === 0) {
    renderizarMensagem(corpo, 'Nenhum registro salvo ainda.');
    return;
  }

  const linhas = registros.map((registro) => {
    const linha = document.createElement('tr');

    [
      registro.id,
      registro.servo,
      `${registro.angulo}°`,
      new Date(registro.criado_em).toLocaleString('pt-BR')
    ].forEach((conteudo) => {
      const celula = document.createElement('td');
      celula.textContent = String(conteudo);
      linha.appendChild(celula);
    });

    return linha;
  });

  corpo.replaceChildren(...linhas);
}

/* ========================================
   GAUGES POR SERVO E REGISTRO DE MOVIMENTOS
   ======================================== */

/**
 * Cria os 8 Gauges (um por servo) e controla o registro de movimentos.
 *
 * Fluxo:
 * 1. "Iniciar movimento" grava no banco o ângulo inicial dos 8 servos.
 * 2. O usuário ajusta os ângulos nos controles de cada servo.
 * 3. "Finalizar movimento" grava no banco o ângulo final dos 8 servos.
 *
 * Os valores vêm dos controles da interface. O firmware não envia dados,
 * então não são medições feitas pelo robô.
 */
function inicializarMovimentos() {
  const area = document.getElementById('servoGauges');
  const seletorNome = document.getElementById('movimentoNome');
  const botaoIniciar = document.getElementById('movimentoIniciar');
  const botaoFinalizar = document.getElementById('movimentoFinalizar');
  const status = document.getElementById('movimentoStatus');

  if (!area || !seletorNome || !botaoIniciar || !botaoFinalizar || !status) {
    return;
  }

  // Ângulo atual de cada servo. O final de um movimento vira o início do próximo.
  const angulos = Array(TOTAL_SERVOS).fill(ANGULO_INICIAL);

  // Movimento em andamento: { id, inicio: [8 ângulos] } ou null.
  let movimentoAtual = null;

  area.innerHTML = Array.from({ length: TOTAL_SERVOS }, (_, indice) =>
    criarCartaoServo(indice)
  ).join('');

  const cartoes = Array.from(area.querySelectorAll('.servo-gauge')).map((raiz, indice) => {
    const arco = raiz.querySelector('.gauge-fill');
    const comprimento = arco.getTotalLength();

    arco.style.strokeDasharray = String(comprimento);

    return {
      raiz,
      arco,
      comprimento,
      svg: raiz.querySelector('svg'),
      ponteiro: raiz.querySelector('.gauge-needle'),
      marca: raiz.querySelector('.gauge-start'),
      valor: raiz.querySelector('[data-servo-valor]'),
      faixa: raiz.querySelector('[data-servo-faixa]'),
      controle: raiz.querySelector('input[type="range"]'),
      indice
    };
  });

  function mostrarStatus(texto, estado) {
    status.textContent = texto;
    status.dataset.state = estado;
  }

  function desenharServo(cartao) {
    const angulo = angulos[cartao.indice];
    const proporcao = proporcaoDoAngulo(angulo);

    cartao.arco.style.strokeDashoffset = String(cartao.comprimento * (1 - proporcao));
    cartao.ponteiro.setAttribute('transform', `rotate(${-90 + proporcao * 180} 100 100)`);
    cartao.valor.textContent = String(angulo);
    cartao.svg.setAttribute('aria-label', `Servo ${cartao.indice}: ${angulo} graus`);

    if (movimentoAtual) {
      cartao.faixa.textContent = `Início ${movimentoAtual.inicio[cartao.indice]}° · agora ${angulo}°`;
    }
  }

  function marcarInicio(cartao, angulo) {
    const proporcao = proporcaoDoAngulo(angulo);

    cartao.marca.setAttribute('transform', `rotate(${-90 + proporcao * 180} 100 100)`);
    cartao.raiz.dataset.iniciado = 'true';
  }

  function limparInicio(cartao) {
    cartao.marca.removeAttribute('transform');
    cartao.raiz.dataset.iniciado = 'false';
    cartao.faixa.textContent = '';
  }

  function atualizarBotoes() {
    const emAndamento = movimentoAtual !== null;

    botaoIniciar.disabled = emAndamento;
    botaoFinalizar.disabled = !emAndamento;
    seletorNome.disabled = emAndamento;
  }

  cartoes.forEach((cartao) => {
    cartao.controle.addEventListener('input', () => {
      angulos[cartao.indice] = Number(cartao.controle.value);
      desenharServo(cartao);
    });

    desenharServo(cartao);
  });

  botaoIniciar.addEventListener('click', async () => {
    const inicio = [...angulos];
    const nome = seletorNome.value;

    botaoIniciar.disabled = true;
    mostrarStatus('Gravando o ângulo inicial...', 'info');

    try {
      const movimento = await enviarJson(API_MOVIMENTOS, { nome, angulos: inicio });

      movimentoAtual = { id: movimento.id, inicio };
      cartoes.forEach((cartao) => {
        marcarInicio(cartao, inicio[cartao.indice]);
        desenharServo(cartao);
      });

      mostrarStatus(
        `Movimento #${movimento.id} iniciado. Ajuste os servos e clique em Finalizar movimento.`,
        'ok'
      );
    } catch (erro) {
      console.error('Spider Bot: falha ao iniciar o movimento.', erro);
      mostrarStatus(
        'Não foi possível iniciar. Verifique se o backend está em execução.',
        'error'
      );
    } finally {
      atualizarBotoes();
    }
  });

  botaoFinalizar.addEventListener('click', async () => {
    if (!movimentoAtual) {
      return;
    }

    const fim = [...angulos];
    const { id } = movimentoAtual;

    botaoFinalizar.disabled = true;
    mostrarStatus('Gravando o ângulo final...', 'info');

    try {
      await enviarJson(`${API_MOVIMENTOS}/${id}/finalizar`, { angulos: fim });

      movimentoAtual = null;
      cartoes.forEach(limparInicio);

      mostrarStatus(`Movimento #${id} salvo no banco de dados.`, 'ok');
      await carregarMovimentos();
    } catch (erro) {
      console.error('Spider Bot: falha ao finalizar o movimento.', erro);
      mostrarStatus(
        'Não foi possível finalizar. Verifique se o backend está em execução.',
        'error'
      );
    } finally {
      atualizarBotoes();
    }
  });

  atualizarBotoes();
  carregarMovimentos();
}

/**
 * Converte um ângulo (1 a 180) em proporção (0 a 1) para desenhar o Gauge.
 */
function proporcaoDoAngulo(angulo) {
  return (angulo - ANGULO_MIN) / (ANGULO_MAX - ANGULO_MIN);
}

/**
 * HTML do Gauge de um servo. O índice é um número fixo (0 a 7),
 * não vem de entrada do usuário.
 */
function criarCartaoServo(indice) {
  return `
    <article class="servo-gauge" data-servo="${indice}" data-iniciado="false">
      <h4>Servo ${indice}</h4>
      <div class="gauge">
        <svg viewBox="0 0 200 120" role="img" aria-label="Servo ${indice}: ${ANGULO_INICIAL} graus">
          <path class="gauge-track" d="M20 100 A80 80 0 0 1 180 100" />
          <path class="gauge-fill" d="M20 100 A80 80 0 0 1 180 100" />
          <line class="gauge-start" x1="100" y1="8" x2="100" y2="32" />
          <line class="gauge-needle" x1="100" y1="100" x2="100" y2="34" />
          <circle class="gauge-hub" cx="100" cy="100" r="6" />
        </svg>
        <div class="gauge-readout">
          <span data-servo-valor>${ANGULO_INICIAL}</span>
          <small>graus</small>
        </div>
      </div>
      <label class="sr-only" for="servoAngulo${indice}">Ângulo do servo ${indice}</label>
      <input type="range" id="servoAngulo${indice}" min="${ANGULO_MIN}" max="${ANGULO_MAX}" value="${ANGULO_INICIAL}">
      <p class="servo-faixa" data-servo-faixa></p>
    </article>`;
}

/**
 * Busca os últimos movimentos e atualiza a lista.
 */
async function carregarMovimentos() {
  const lista = document.getElementById('movimentosHistorico');

  if (!lista) {
    return;
  }

  try {
    const resposta = await fetch(API_MOVIMENTOS);

    if (!resposta.ok) {
      throw new Error(`Resposta inesperada do servidor: ${resposta.status}`);
    }

    renderizarMovimentos(lista, await resposta.json());
  } catch (erro) {
    console.warn('Spider Bot: histórico de movimentos indisponível.', erro);
    lista.replaceChildren(
      criarElemento('p', 'movimentos-vazio', 'Histórico de movimentos indisponível: backend não conectado.')
    );
  }
}

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);

  if (classe) {
    elemento.className = classe;
  }

  if (texto !== undefined) {
    elemento.textContent = texto;
  }

  return elemento;
}

function formatarDuracao(inicio, fim) {
  if (!fim) {
    return 'Não finalizado';
  }

  const segundos = (new Date(fim) - new Date(inicio)) / 1000;

  return `Duração: ${segundos.toFixed(1).replace('.', ',')} s`;
}

function renderizarMovimentos(lista, movimentos) {
  if (!Array.isArray(movimentos) || movimentos.length === 0) {
    lista.replaceChildren(criarElemento('p', 'movimentos-vazio', 'Nenhum movimento salvo ainda.'));
    return;
  }

  const cartoes = movimentos.map((movimento) => {
    const cartao = criarElemento('article', 'movimento-card');
    const cabecalho = criarElemento('div', 'movimento-cabecalho');
    const titulo = criarElemento('h4');
    const meta = criarElemento('div', 'movimento-meta');
    const grade = criarElemento('div', 'movimento-servos');

    titulo.append(criarElemento('span', undefined, `#${movimento.id}`), movimento.nome);

    meta.append(
      criarElemento('span', undefined, new Date(movimento.iniciado_em).toLocaleString('pt-BR')),
      criarElemento('span', undefined, formatarDuracao(movimento.iniciado_em, movimento.finalizado_em))
    );

    cabecalho.append(titulo, meta);

    movimento.servos.forEach((servo) => {
      const item = criarElemento('div', 'movimento-servo');
      const mudou = servo.fim !== null && servo.fim !== servo.inicio;
      const fim = servo.fim === null ? '—' : `${servo.fim}°`;

      item.dataset.mudou = String(mudou);
      item.append(
        criarElemento('small', undefined, `Servo ${servo.servo}`),
        criarElemento('span', undefined, `${servo.inicio}° → ${fim}`)
      );

      grade.appendChild(item);
    });

    cartao.append(cabecalho, grade);

    return cartao;
  });

  lista.replaceChildren(...cartoes);
}