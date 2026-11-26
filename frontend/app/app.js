'use strict';

const ROBOT_URL = 'http://192.168.4.1';
const COMMAND_TIMEOUT = 3000;

// Folga somada ao tempo programado de cada movimento (estimativa, ainda não testada com o robô).
const MOVEMENT_MARGIN = 200;

// Tempo programado de cada movimento no firmware v2.0, em milissegundos.
const MOVEMENT_DURATION = {
  1: 1000,
  2: 2200,
  3: 2200,
  4: 2200,
  5: 2200,
  6: 1600,
  7: 1600,
  8: 500,
  9: 3800,
  10: 5500,
  11: 9600,
  12: 2000,
  13: 4000,
  14: 3600,
  15: 4000
};

const statusElement = document.querySelector('#connection-status');
const activityLog = document.querySelector('#activity-log');
const checkButton = document.querySelector('#check-connection');
const installButton = document.querySelector('#install-button');
const repeatCheckbox = document.querySelector('#repeat-movement');
const originalPanel = document.querySelector('#original-panel');
const controlButtons = document.querySelectorAll('.control-button[data-pm]');

let activeButton = null;
let repeatTimer = null;
let requestInProgress = false;
let busyUntil = 0;
let busyTimer = null;
let installPrompt = null;

const movementCommands = new Set(['2', '3', '4', '5', '6', '7']);

originalPanel.href = `${ROBOT_URL}/`;

function updateStatus(state, message) {
  statusElement.dataset.state = state;
  statusElement.textContent = message;
}

function log(message) {
  activityLog.textContent = message;
}

// Se o app estiver em HTTPS, o navegador pode bloquear comandos HTTP (conteúdo misto).
function failureHint() {
  return location.protocol === 'https:'
    ? ' Este app está em HTTPS, e o navegador pode bloquear comandos HTTP enviados ao robô.'
    : '';
}

function setBusy(duration) {
  busyUntil = Date.now() + duration;
  controlButtons.forEach((button) => button.classList.add('is-busy'));

  clearTimeout(busyTimer);
  busyTimer = setTimeout(clearBusy, duration);
}

function clearBusy() {
  busyUntil = 0;
  controlButtons.forEach((button) => button.classList.remove('is-busy'));
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

  const remaining = busyUntil - Date.now();

  if (remaining > 0) {
    log(`Aguarde o movimento terminar (${(remaining / 1000).toFixed(1)} s).`);
    return false;
  }

  requestInProgress = true;

  const command = button.dataset.pm;
  const label = button.textContent.trim();
  const duration = (MOVEMENT_DURATION[command] ?? 2400) + MOVEMENT_MARGIN;

  log(`Enviando comando: ${label} (pm=${command})`);

  try {
    const result = await sendCommand(`?pm=${encodeURIComponent(command)}`);

    if (result.sent) {
      setBusy(duration);
      log(
        `Comando enviado: ${label}. Novo comando liberado em ` +
        `${(duration / 1000).toFixed(1)} s (tempo programado). ` +
        'A execução não foi confirmada.'
      );
      return true;
    }

    log(`Não foi possível enviar o comando. Confira a conexão Wi-Fi.${failureHint()}`);
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

  // Reenvia só depois que o ciclo do movimento anterior terminar.
  const wait = Math.max(busyUntil - Date.now(), 0) + 20;

  repeatTimer = setTimeout(async () => {
    if (activeButton !== button) return;

    await executeMovement(button);

    if (activeButton === button) {
      scheduleRepeat(button);
    }
  }, wait);
}

controlButtons.forEach((button) => {
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
      `o endereço do robô e as permissões do navegador.${failureHint()}`
    );
  }

  checkButton.disabled = false;
  checkButton.textContent = 'Testar conexão';
});

// Botão "Instalar": o navegador só dispara este evento quando o app é instalável.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener('click', async () => {
  if (!installPrompt) return;

  installPrompt.prompt();

  const { outcome } = await installPrompt.userChoice;

  log(
    outcome === 'accepted'
      ? 'Instalação aceita.'
      : 'Instalação cancelada.'
  );

  installPrompt = null;
  installButton.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton.hidden = true;
  log('Aplicativo instalado.');
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