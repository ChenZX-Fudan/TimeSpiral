// TimeSpiral Service Worker — 离线缓存
// 策略：预缓存核心资源（HTML/CSS/JS/故事数据），其余资源（图片等）在首次访问时运行时缓存。
// 导航请求优先走网络，失败时回退到缓存的首页，保证离线可玩。
// 部署新版本时只需修改 CACHE 版本号，activate 阶段会自动清理旧缓存。
const CACHE = 'timespiral-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './css/game.css',
  './js/main.js',
  './js/data/stories.json'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 导航请求：先尝试网络，离线时回退到缓存首页
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html').then(c => c || caches.match('./')))
    );
    return;
  }

  // 其他资源：缓存优先，未命中则取网络并写入缓存（仅同源成功响应）
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        if (resp && resp.ok && new URL(req.url).origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
