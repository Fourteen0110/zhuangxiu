/**
 * Service Worker - 离线缓存
 * 策略：Cache First with Network Update（缓存优先，后台更新）
 * 确保首次加载不阻塞，二次访问秒开
 */
const CACHE_NAME = 'reno-v4';

// 安装：不预缓存，直接激活（避免安装失败导致卡死）
self.addEventListener('install', () => {
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先，后台更新
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // 只缓存同源请求
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // 后台更新缓存
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => null);

      // 有缓存则立即返回，否则等网络
      return cached || fetchPromise.then(r => r || new Response('离线', { status: 503 }));
    })
  );
});
