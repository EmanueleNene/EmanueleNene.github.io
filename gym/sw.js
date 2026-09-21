/* Bump CACHE whenever you edit index.html or assets, otherwise phones keep the old copy. */
const CACHE = 'ferrodastiro-v29';
const CORE_ASSETS = [
  './',
  'index.html',
  'exercises.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

const EXERCISE_SVG_ASSETS = [
  'img/exercises/ab-wheel-rollout.svg',
  'img/exercises/arnold-press.svg',
  'img/exercises/assault-bike.svg',
  'img/exercises/back-extension.svg',
  'img/exercises/back-squat.svg',
  'img/exercises/barbell-curl.svg',
  'img/exercises/barbell-row.svg',
  'img/exercises/bench-dip.svg',
  'img/exercises/bench-press.svg',
  'img/exercises/bulgarian-split-squat.svg',
  'img/exercises/cable-crossover.svg',
  'img/exercises/cable-crunch.svg',
  'img/exercises/cable-curl.svg',
  'img/exercises/cable-face-pull.svg',
  'img/exercises/cable-front-raise.svg',
  'img/exercises/cable-lateral-raise.svg',
  'img/exercises/cable-row.svg',
  'img/exercises/cable-triceps-kickback.svg',
  'img/exercises/cable-woodchopper.svg',
  'img/exercises/chin-up.svg',
  'img/exercises/close-grip-bench-press.svg',
  'img/exercises/dead-bug.svg',
  'img/exercises/deadlift.svg',
  'img/exercises/dip.svg',
  'img/exercises/dumbbell-bench-press.svg',
  'img/exercises/dumbbell-curl.svg',
  'img/exercises/dumbbell-fly.svg',
  'img/exercises/dumbbell-row.svg',
  'img/exercises/elliptical.svg',
  'img/exercises/ez-bar-curl.svg',
  'img/exercises/ez-bar-preacher-curl.svg',
  'img/exercises/face-pull.svg',
  'img/exercises/farmers-walk.svg',
  'img/exercises/front-squat.svg',
  'img/exercises/glute-bridge.svg',
  'img/exercises/good-morning.svg',
  'img/exercises/hack-squat.svg',
  'img/exercises/hammer-curl.svg',
  'img/exercises/hanging-leg-raise.svg',
  'img/exercises/high-to-low-cable-fly.svg',
  'img/exercises/hip-thrust.svg',
  'img/exercises/hyperextension-back.svg',
  'img/exercises/hyperextensions-thighs.svg',
  'img/exercises/incline-barbell-press.svg',
  'img/exercises/incline-dumbbell-curl.svg',
  'img/exercises/incline-dumbbell-press.svg',
  'img/exercises/incline-machine-chest-press.svg',
  'img/exercises/incline-walk.svg',
  'img/exercises/jump-rope.svg',
  'img/exercises/kettlebell-swing.svg',
  'img/exercises/lat-pulldown.svg',
  'img/exercises/lateral-raise.svg',
  'img/exercises/leg-curl.svg',
  'img/exercises/leg-extension.svg',
  'img/exercises/leg-press.svg',
  'img/exercises/low-to-high-cable-fly.svg',
  'img/exercises/lying-leg-curl.svg',
  'img/exercises/machine-chest-press.svg',
  'img/exercises/machine-lat-pulldown.svg',
  'img/exercises/overhead-press.svg',
  'img/exercises/overhead-triceps-extension.svg',
  'img/exercises/pec-deck-fly.svg',
  'img/exercises/pendlay-row.svg',
  'img/exercises/plank.svg',
  'img/exercises/preacher-curl.svg',
  'img/exercises/pull-up.svg',
  'img/exercises/push-up.svg',
  'img/exercises/rack-pull.svg',
  'img/exercises/rear-delt-fly.svg',
  'img/exercises/romanian-deadlift.svg',
  'img/exercises/rope-triceps-pushdown.svg',
  'img/exercises/rowing-machine.svg',
  'img/exercises/russian-twist.svg',
  'img/exercises/seated-calf-raise.svg',
  'img/exercises/seated-dumbbell-press.svg',
  'img/exercises/seated-leg-curl.svg',
  'img/exercises/shrug.svg',
  'img/exercises/side-plank.svg',
  'img/exercises/single-arm-cable-curl.svg',
  'img/exercises/single-arm-cable-lat-pulldown.svg',
  'img/exercises/single-arm-cable-lateral-raise.svg',
  'img/exercises/single-arm-cable-seated-row.svg',
  'img/exercises/single-arm-dumbbell-curl.svg',
  'img/exercises/single-arm-dumbbell-lateral-raise.svg',
  'img/exercises/single-arm-dumbbell-row.svg',
  'img/exercises/single-arm-dumbbell-shoulder-press.svg',
  'img/exercises/single-arm-overhead-cable-extension.svg',
  'img/exercises/single-arm-triceps-pushdown.svg',
  'img/exercises/single-leg-45-press.svg',
  'img/exercises/single-leg-curl.svg',
  'img/exercises/single-leg-extension.svg',
  'img/exercises/skull-crusher.svg',
  'img/exercises/sled-push.svg',
  'img/exercises/stairmaster.svg',
  'img/exercises/standing-calf-raise-machine.svg',
  'img/exercises/standing-calf-raise.svg',
  'img/exercises/stationary-bike.svg',
  'img/exercises/step-up.svg',
  'img/exercises/stiff-leg-deadlift.svg',
  'img/exercises/straight-arm-pulldown.svg',
  'img/exercises/t-bar-row.svg',
  'img/exercises/treadmill-run.svg',
  'img/exercises/triceps-pushdown.svg',
  'img/exercises/upright-row.svg',
  'img/exercises/walking-lunge.svg'
];

const ASSETS = [...CORE_ASSETS, ...EXERCISE_SVG_ASSETS];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first, cache fallback: you get updates when online,
   and the app still opens in a basement gym with no signal. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => {
        if (r) return r;
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('index.html');
        }
      }))
  );
});
