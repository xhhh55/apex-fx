/* ═══════════════════════════════════════════════════════
   APEX INVEST — Service Worker v4
   Offline Cache + Push Notifications + Background Sync
   ═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'apex-invest-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico',
  '/manifest.json',
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>APEX INVEST - Offline</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#070A0F;color:#EEE8DA;font-family:'Cairo','DM Sans',sans-serif;
      min-height:100vh;display:flex;align-items:center;justify-content:center;
      text-align:center;padding:20px}
    .logo{font-size:26px;font-weight:900;letter-spacing:5px;color:#D4A843;margin-bottom:6px}
    .sub{font-size:9px;color:rgba(212,168,67,0.4);letter-spacing:3px;margin-bottom:36px}
    .icon{font-size:64px;margin-bottom:20px;animation:pulse 2s ease-in-out infinite}
    .title{font-size:18px;font-weight:800;margin-bottom:8px}
    .desc{font-size:12px;color:rgba(238,232,218,0.5);line-height:1.8;max-width:300px;margin:0 auto 28px}
    .btn{padding:12px 28px;background:linear-gradient(135deg,#D4A843,#A07820);
      border:none;border-radius:12px;color:#000;font-weight:800;font-size:13px;
      cursor:pointer;transition:opacity 0.2s}
    .btn:active{opacity:0.8}
    .dots{display:flex;gap:6px;justify-content:center;margin-top:20px}
    .dot{width:8px;height:8px;border-radius:50%;background:#D4A843;
      animation:blink 1.4s infinite}
    .dot:nth-child(2){animation-delay:0.25s}
    .dot:nth-child(3){animation-delay:0.5s}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
    @keyframes blink{0%,80%,100%{opacity:0.2}40%{opacity:1}}
  </style>
</head>
<body>
  <div>
    <div class="logo">APEX INVEST</div>
    <div class="sub">INVESTMENT PLATFORM</div>
    <div class="icon">📡</div>
    <div class="title">لا يوجد اتصال بالإنترنت</div>
    <div class="desc">
      تحقق من اتصالك وأعد المحاولة.<br>
      No internet connection detected.
    </div>
    <button class="btn" onclick="window.location.reload()">🔄 إعادة المحاولة</button>
    <div class="dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  </div>
</body>
</html>`;

/* ── Install ─────────────────────────────────────────── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

/* ── Activate ────────────────────────────────────────── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch (Network first → Cache → Offline page) ───── */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Skip: API calls, external services
  const url = e.request.url;
  if (
    url.includes('/api/') ||
    url.includes('api.anthropic.com') ||
    url.includes('supabase.co') ||
    url.includes('tradingview.com') ||
    url.includes('frankfurter.app')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(e.request, clone))
            .catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        // Serve offline page for navigation requests
        if (e.request.mode === 'navigate') {
          return new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
        return new Response('', { status: 503 });
      })
  );
});

/* ── Push Notifications ──────────────────────────────── */
self.addEventListener('push', e => {
  const defaults = {
    title: 'APEX INVEST',
    body: 'تنبيه جديد',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'apex-alert',
    url: '/',
  };

  let data = defaults;
  try {
    if (e.data) data = { ...defaults, ...e.data.json() };
  } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/logo192.png',
      badge: data.badge || '/logo192.png',
      tag: data.tag,
      data: { url: data.url },
      vibrate: data.urgent ? [300, 100, 300, 100, 300] : [200, 100, 200],
      requireInteraction: data.urgent || false,
      actions: data.actions || [],
    })
  );
});

/* ── Notification Click ──────────────────────────────── */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';

  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c =>
          c.url.includes(self.location.origin)
        );
        if (existing) {
          existing.focus();
          existing.navigate(url);
        } else {
          clients.openWindow(url);
        }
      })
  );
});

/* ── Background Sync (Price Alerts) ─────────────────── */
self.addEventListener('sync', e => {
  if (e.tag === 'check-price-alerts') {
    e.waitUntil(checkPriceAlerts());
  }
});

async function checkPriceAlerts() {
  try {
    const cache = await caches.open('apex-alerts-cache');
    const alertsResp = await cache.match('pending-alerts');
    if (!alertsResp) return;

    const alerts = await alertsResp.json();
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=EUR&to=USD,GBP,JPY,AUD,CAD,CHF,NZD'
    );
    if (!res.ok) return;

    const data = await res.json();
    for (const alert of alerts) {
      const rate = data.rates[alert.currency];
      if (!rate) continue;
      const hit =
        alert.dir === 'above' ? rate >= alert.price : rate <= alert.price;
      if (hit) {
        await self.registration.showNotification(
          `${alert.dir === 'above' ? '📈' : '📉'} تنبيه سعر — APEX`,
          {
            body: `${alert.pair}: ${rate.toFixed(5)} (${alert.dir === 'above' ? 'فوق' : 'تحت'} ${alert.price})`,
            icon: '/logo192.png',
            tag: `price-alert-${alert.id}`,
            data: { url: '/?tab=smartalerts' },
            vibrate: [300, 100, 300],
            requireInteraction: true,
          }
        );
      }
    }
  } catch {}
}

/* ── Periodic Background Sync ───────────────────────── */
self.addEventListener('periodicsync', e => {
  if (e.tag === 'market-update') {
    e.waitUntil(sendMarketUpdateNotif());
  }
});

async function sendMarketUpdateNotif() {
  try {
    const now = new Date();
    const h = now.getUTCHours();
    // Only notify during key trading hours
    if (h < 8 || h > 22) return;
    // Silently check — don't spam users
  } catch {}
}
