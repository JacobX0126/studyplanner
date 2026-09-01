// 홈 화면 설치를 위한 최소 서비스 워커. 오프라인 캐싱은 하지 않는다 —
// 배포 후 오래된 캐시가 새 버전을 가리는 실수를 피하기 위해 항상 네트워크로 통과시킨다.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // 아무것도 가로채지 않는다. 이 핸들러가 존재해야 브라우저가 "설치 가능"으로 인식한다.
})
