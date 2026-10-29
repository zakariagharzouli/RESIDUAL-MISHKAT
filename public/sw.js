// Service worker Mishkat
// Règles : ne jamais garder en cache une réponse cassée, ne jamais bloquer
// l'ouverture de l'app, et ne toucher qu'aux fichiers du site lui-même.
const CACHE_VERSION = 'mishkat-cache-v7';
const NAV_TIMEOUT_MS = 4000;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Supprime toutes les anciennes versions, y compris les caches empoisonnés de v1 à v6
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isHtml = (res) => (res.headers.get('content-type') || '').includes('text/html');

async function put(request, response) {
  try {
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, response);
  } catch { /* quota ou requête non cachable : on ignore */ }
}

// Page : réseau d'abord, avec un délai maximal, puis la dernière version connue
async function handleNavigation(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NAV_TIMEOUT_MS);
    const res = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok && isHtml(res)) put('/', res.clone());
    return res;
  } catch {
    return (await cache.match('/')) || fetch(request);
  }
}

// Fichiers de build (noms uniques) : cache d'abord, mais seulement de vrais fichiers
async function handleAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok && !isHtml(res)) put(request, res.clone());
  return res;
}

// Autres fichiers du site (icônes, images, polices) : on sert le cache et on le rafraîchit
async function handleStatic(request) {
  const cached = await caches.match(request);
  const network = fetch(request).then((res) => {
    if (res.ok && !isHtml(res)) put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Supabase, API, Google Fonts… : jamais interceptés, toujours en direct
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') { event.respondWith(handleNavigation(request)); return; }
  if (url.pathname.startsWith('/assets/')) { event.respondWith(handleAsset(request)); return; }
  event.respondWith(handleStatic(request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Ouvrir l'app quand on touche une notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
