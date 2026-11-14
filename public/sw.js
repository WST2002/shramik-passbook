const CACHE = 'shramik-passbook-v1';
const PAGES = ['./', './confirm/'];

async function precache() {
  const cache = await caches.open(CACHE);
  const urls = new Set([...PAGES, './manifest.webmanifest', './favicon.svg', './icon-192.png']);
  for (const page of PAGES) {
    const html = await (await fetch(page, { cache: 'no-cache' })).text();
    for (const match of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) urls.add(new URL(match[1], self.registration.scope).href);
  }
  for (const url of [...urls].filter((u) => u.endsWith('.css'))) {
    const css = await (await fetch(url)).text();
    for (const match of css.matchAll(/url\(([^)]+\.woff2)\)/g)) urls.add(new URL(match[1].replace(/["']/g, ''), url).href);
  }
  await cache.addAll([...urls]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    const page = new URL(request.url).pathname.includes('/confirm') ? './confirm/' : './';
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(new URL(page, self.registration.scope).href, copy));
          return response;
        })
        .catch(() => caches.match(new URL(page, self.registration.scope).href)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
