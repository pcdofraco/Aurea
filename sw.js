// ─────────────────────────────────────────
//  MUDE ESTE NÚMERO A CADA DEPLOY!
//  Ex: foco-v1 → foco-v2 → foco-v3 ...
// ─────────────────────────────────────────
const CACHE = 'foco-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting()) // ativa imediatamente sem esperar aba fechar
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE) // apaga todos os caches antigos
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // assume controle de todas as abas abertas
  );
});

self.addEventListener('fetch', e => {
  // Fontes do Google: tenta rede, cai no cache se offline
  if (e.request.url.includes('fonts.googleapis') || e.request.url.includes('fonts.gstatic')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Resto: tenta rede PRIMEIRO, usa cache só se falhar (network-first)
  // Isso garante que atualizações do GitHub apareçam imediatamente
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)) // offline: usa cache
  );
});
