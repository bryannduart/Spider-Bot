'use strict';

// O aplicativo não usa mais cache nem instalação.
// Este arquivo só limpa o que versões antigas guardaram.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.map((nome) => caches.delete(nome))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((janelas) => {
        janelas.forEach((janela) => janela.navigate(janela.url));
      })
  );
});