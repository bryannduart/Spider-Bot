'use strict';

/**
 * Spider Bot — funcionalidades da interface pública.
 *
 * Funcionalidades atuais:
 * - Inicialização da interface.
 * - Preparação do indicador de conexão.
 * - Indicador digital (Gauge) do ângulo definido na interface.
 * - Registro dos ângulos no banco de dados, por meio do backend.
 *
 * O site público não envia comandos ao robô. O controle do robô é feito
 * pelo painel do próprio ESP8266 (192.168.4.1) ou pelo aplicativo.
 */

// URL base do backend. Trocar pela URL publicada quando ele estiver na internet.
const API_BASE = 'http://localhost:3000';
const API_REGISTROS = `${API_BASE}/api/registros`;

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
  const resposta = await fetch(API_REGISTROS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ servo, angulo })
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