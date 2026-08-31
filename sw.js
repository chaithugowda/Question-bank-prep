/* The Bank — service worker.
   Bump SHELL_VERSION whenever index.html changes; the app shows a reload
   prompt rather than swapping the page out from under you mid-session. */
const SHELL_VERSION = "v1";
const SHELL = "bank-shell-" + SHELL_VERSION;
const VENDOR = "bank-vendor-" + SHELL_VERSION;
const MODEL = "bank-model";           /* deliberately unversioned: 23 MB, never re-fetch */

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
];

/* Everything the app pulls from a CDN. Cached on first success, then served
   from cache forever — these are all version-pinned URLs. */
const VENDOR_HOSTS = [
  "cdnjs.cloudflare.com",
  "cdn.jsdelivr.net",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];
/* Model weights live in their own bucket so clearing app caches on an update
   does not force a 23 MB re-download. */
const MODEL_HOSTS = ["huggingface.co", "cdn-lfs.huggingface.co", "cdn-lfs-us-1.huggingface.co"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL)
      .then((c) => c.addAll(SHELL_FILES))
      .catch(() => {})          /* a single 404 must not block installation */
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("bank-") && k !== SHELL && k !== VENDOR && k !== MODEL)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "skip-waiting") self.skipWaiting();
});

const isModel = (u) => MODEL_HOSTS.some((h) => u.hostname.endsWith(h)) ||
  (u.hostname === "cdn.jsdelivr.net" && /transformers|onnx|\.wasm$/.test(u.pathname));
const isVendor = (u) => VENDOR_HOSTS.some((h) => u.hostname === h);

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  /* Big immutable assets: cache first, and keep them across app updates. */
  if (isModel(url)) {
    e.respondWith(
      caches.open(MODEL).then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => {
          if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  /* Pinned CDN libraries: cache first — this is what makes offline work. */
  if (isVendor(url)) {
    e.respondWith(
      caches.open(VENDOR).then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => {
          if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
          return res;
        }).catch(() => hit))
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  /* The app shell: network first so a deploy is picked up, cache as the
     fallback so a dead connection still opens the app. */
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match("./index.html"))
      )
  );
});
