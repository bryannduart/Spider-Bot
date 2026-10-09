'use strict';

/**
 * Spider Bot — funcionalidades da interface pública.
 *
 * Funcionalidades atuais:
 * - Inicialização da interface.
 * - Preparação do indicador de conexão.
 * - Preparação dos indicadores digitais (Gauge).
 *
 * A comunicação real com o ESP8266 será implementada depois
 * de confirmarmos o protocolo utilizado pelo firmware do kit.
 */

document.addEventListener('DOMContentLoaded', () => {
  inicializarInterface();

  console.info('Spider Bot: interface inicializada.');
});

/**
 * Prepara os elementos da interface para futuras integrações.
 *
 * Nenhum estado de conexão ou valor de sensor é inventado.
 * Os indicadores permanecem indisponíveis até receberem dados reais.
 */
function inicializarInterface() {
  inicializarStatusRobo();
  inicializarIndicadores();
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
 * O valor real será definido quando houver uma fonte de dados.
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