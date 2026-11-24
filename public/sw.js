// Service worker do Pelada.
// Não guarda páginas nem dados em cache: placar, fila e times precisam estar sempre
// atualizados. Só mostra uma página "sem conexão" quando a navegação falha.

const CACHE = "pelada-v1";
const OFFLINE = "/offline.html";
const ARQUIVOS = [OFFLINE, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
