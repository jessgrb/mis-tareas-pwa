/* ==========================================================
   Service Worker — Mis Tareas
   Estrategia: "cache first" para archivos estáticos y
   página offline.html como respuesta cuando no hay red.
   ========================================================== */

// Cambia la versión cada vez que modifiques archivos para que se actualice la caché
const CACHE_NOMBRE = 'mis-tareas-v1';

// Archivos estáticos que se guardan al instalar
const ARCHIVOS_ESTATICOS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* 1. INSTALACIÓN: guarda los archivos estáticos en caché */
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NOMBRE)
      .then(cache => cache.addAll(ARCHIVOS_ESTATICOS))
      .then(() => self.skipWaiting())
  );
});

/* 2. ACTIVACIÓN: elimina cachés de versiones anteriores */
self.addEventListener('activate', event => {
  console.log('[SW] Activado');
  event.waitUntil(
    caches.keys()
      .then(nombres => Promise.all(
        nombres
          .filter(nombre => nombre !== CACHE_NOMBRE)
          .map(nombre => caches.delete(nombre))
      ))
      .then(() => self.clients.claim())
  );
});

/* 3. FETCH: responde desde caché; si no está, va a la red;
      si no hay red, muestra la página offline */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(respuestaCache => {
      if (respuestaCache) return respuestaCache;

      return fetch(event.request)
        .then(respuestaRed => {
          // Guarda en caché las nuevas respuestas válidas del mismo origen
          if (respuestaRed.ok && new URL(event.request.url).origin === self.location.origin) {
            const copia = respuestaRed.clone();
            caches.open(CACHE_NOMBRE).then(cache => cache.put(event.request, copia));
          }
          return respuestaRed;
        })
        .catch(() => {
          // Sin conexión: si se pidió una página, devuelve offline.html
          if (event.request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
          return new Response('', { status: 503, statusText: 'Sin conexión' });
        });
    })
  );
});
