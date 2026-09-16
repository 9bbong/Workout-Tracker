// index.html을 수정할 때마다 이 버전 숫자만 올려서 커밋하세요 (v2 -> v3 -> v4 ...)
const CACHE_VERSION = "v2";
const CACHE_NAME = "workout-tracker-" + CACHE_VERSION;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// 설치: 새 캐시에 최신 파일들 담기
self.addEventListener("install", (event) => {
  self.skipWaiting(); // 새 서비스워커를 바로 활성화 대기 상태로
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 활성화: 이전 버전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // 열려있는 앱/탭에도 새 버전 즉시 적용
});

// HTML 문서는 네트워크 우선(항상 최신 시도) -> 실패 시에만 캐시 사용
// 그 외 리소스(아이콘 등)는 캐시 우선
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match("./index.html"))
        )
    );
  } else {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
  }
});
