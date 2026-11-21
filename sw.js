/* Сервис-воркер веб-версии «Цели»: только push-уведомления (кэширования нет,
   чтобы новая версия сайта всегда открывалась сразу). */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const scope = self.registration.scope;
  event.waitUntil(
    self.registration.showNotification(data.title || 'Цель', {
      body: data.body || '',
      icon: new URL('icons/icon-192.png', scope).href,
      badge: new URL('icons/badge-96.png', scope).href,
      data: { url: data.url || scope },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const scope = self.registration.scope;
  const url = (event.notification.data && event.notification.data.url) || scope;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (client.url.startsWith(scope) && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(url);
            } catch {
              // некоторые браузеры не дают переходить — достаточно фокуса
            }
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
