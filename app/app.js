'use strict';

const ROBOT_URL = 'http://192.168.4.1';
const COMMAND_TIMEOUT = 3000;

const statusElement = document.querySelector('#connection-status');
const activityLog = document.querySelector('#activity-log');
const checkButton = document.querySelector('#check-connection');
const repeatCheckbox = document.querySelector('#repeat-movement');
const originalPanel = document.querySelector('#original-panel');

let activeButton = null;
let repeatTimer = null;
let requestInProgress = false;

const movementCommands = new Set(['2', '3', '4', '5', '6', '7']);

originalPanel.href = `${ROBOT_URL}/`;

function updateStatus(state, message) {
  statusElement.dataset.state = state;
  statusElement.textContent = message;
}

function log(message) {
  activityLog.textContent = message;
}

async function sendCommand(query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    COMMAND_TIMEOUT
  );

  try {
    await fetch(`${ROBOT_URL}/controller${query}`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    });

    updateStatus('unknown', 'Resposta não verificável');

    return {
      sent: true,
      confirmed: false
    };
  } catch (error) {
    updateStatus('disconnected', 'Sem resposta de rede');

    return {
      sent: false,
      confirmed: false,
      error
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function executeMovement(button) {
  if (requestInProgress) return false;

  requestInProgress = true;

  const command = button.dataset.pm;
  const label = button.textContent.trim();

  log(`Enviando comando: ${label} (pm=${command})`);

  try {
    const result = await sendCommand(`?pm=${encodeURIComponent(command)}`);

    if (result.sent) {
      log(`Comando enviado: ${label}. A execução não foi confirmada.`);
      return true;
    }

    log('Não foi possível enviar o comando. Confira a conexão Wi-Fi.');
    return false;
  } finally {
    requestInProgress = false;
  }
}

function stopRepeat() {
  if (repeatTimer !== null) {
    clearTimeout(repeatTimer);
    repeatTimer = null;
  }

  if (activeButton) {
    activeButton.classList.remove('is-active');
    activeButton = null;
  }
}

function scheduleRepeat(button) {
  if (
    !repeatCheckbox.checked ||
    !movementCommands.has(button.dataset.pm) ||
    activeButton !== button
  ) {
    return;
  }

  repeatTimer = setTimeout(async () => {
    if (activeButton !== button) return;

    await executeMovement(button);

    if (activeButton === button) {
      scheduleRepeat(button);
    }
  }, 2400);
}

document.querySelectorAll('.control-button[data-pm]').forEach((button) => {
  button.addEventListener('pointerdown', async (event) => {
    event.preventDefault();

    if (activeButton && activeButton !== button) {
      stopRepeat();
    }

    activeButton = button;
    button.classList.add('is-active');

    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    await executeMovement(button);

    if (activeButton === button) {
      scheduleRepeat(button);
    }
  });

  button.addEventListener('pointerup', stopRepeat);
  button.addEventListener('pointercancel', stopRepeat);
  button.addEventListener('pointerleave', stopRepeat);
  button.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
});

window.addEventListener('blur', stopRepeat);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopRepeat();
});

checkButton.addEventListener('click', async () => {
  checkButton.disabled = true;
  checkButton.textContent = 'Testando...';

  log('Testando a comunicação com o ESP8266...');

  // A rota sem parâmetros não deve solicitar um movimento.
  const result = await sendCommand('');

  if (result.sent) {
    log(
      'A requisição foi enviada, mas o navegador não consegue ' +
      'confirmar a resposta do robô neste modo de comunicação.'
    );
  } else {
    log(
      'Falha ao enviar a requisição. Confira a rede Spider Robot, ' +
      'o endereço do robô e as permissões do navegador.'
    );
  }

  checkButton.disabled = false;
  checkButton.textContent = 'Testar conexão';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => {
        console.info('Spider Bot: service worker registrado.');
      })
      .catch((error) => {
        console.error('Falha ao registrar o service worker:', error);
      });
  });
}

console.info('Spider Bot Control inicializado.');
