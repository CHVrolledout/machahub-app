/* MachaHub web app service worker. Generated into prototype/site/sw.js by build.py.
   Pages: network first, falling back to the cache (revalidated past the HTTP cache, so a new deploy shows up straight away,
   and the app still opens offline). Everything else: cache first. */
const VERSION = 'mh-c98e65ea27';
const SHELL = ["./", "index.html", "overview.html", "manifest.webmanifest", "assets/splash-logo-first.jpg", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/maskable-192.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('mh-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  if (url.pathname.endsWith('.mp4') || req.headers.has('range')) return;  // video: straight from the network

  if (req.mode === 'navigate') {
    e.respondWith(
      // no-cache: GitHub Pages sends max-age=600, so skip the browser cache and ask the server every time.
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: !fonts }).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
