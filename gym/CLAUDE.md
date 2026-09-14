# FerroDaStiro — working notes

A private workout tracker. Single-page app, no build step, no dependencies, no backend.
Deployed to GitHub Pages at `emanuelenene.github.io/gym/` and installed on iPhones via
Safari → Add to Home Screen. Used by one family; each person has a profile on their own phone.

## Hard constraints

- **One file.** All markup, CSS and JavaScript live in `index.html`. Do not split it into
  modules, add a bundler, or introduce a framework. It has to be openable and editable as
  one file, and served as a static asset.
- **No dependencies.** No npm packages in the app itself, no CDN scripts, no fonts fetched
  from Google. `jsdom` is a dev dependency for tests only.
- **No `<dialog>`.** It was removed after failing in an embedded webview. Full-screen views
  driven by the `screen` state variable replaced it. Don't reintroduce modals.
- **Local storage & IndexedDB only.** No server, no sync, no iCloud share, no account. Data must never leave the device.
- **iOS Safari is the only target that matters.** Test assumptions against it, not Chrome.

## Architecture

Everything is state → `render()` → innerHTML. There is no virtual DOM and no reactivity.

```
tab      'calendar' | 'train' | 'progress' | 'programs'   — bottom nav
screen   null | {type:'profiles'|'start'|'progday'|'past'|'lib', ...}  — full-screen flow, wins over tab
editing  null | program object being edited                — wins over tab when tab==='programs'
db       the active profile's data (unit, programId, custom, sessions, draft)
```

`render()` checks `screen` first, then `editing`, then `tab`. Every view function rebuilds its
container's innerHTML from scratch and re-attaches handlers.

### The bug class to watch for

Handlers are attached to nodes after `innerHTML` is set. Writing to the same container's
`innerHTML` a **second** time re-parses it and silently discards those handlers — the button
still renders and does nothing. This has bitten this codebase once already (`innerHTML +=` in
the calendar day panel). Build the full HTML string, assign once, then wire.

## Storage & Durability

```
fds.profiles      [{id, name}]
fds.active        profile id
fds.data.<id>     {unit, programId, custom:{}, customEx:[], sessions:[], draft}
```

- **Dual-layer persistence:** Synchronous reads and writes use `localStorage` for zero-latency UI updates. Every write is asynchronously mirrored to IndexedDB (`fds_store` / `kv`).
- **Auto-resurrection:** If Safari or WebKit clears `localStorage` under storage pressure, FerroDaStiro automatically restores profiles and data blobs from IndexedDB into `localStorage` upon boot.
- **WebKit Persistent Storage API:** Calls `navigator.storage.persist()` on boot and initial interaction to request eviction immunity from the browser. Persistence status is shown under Settings.
- A one-time migration from the old `ironlog.*` keys runs at startup. Leave it in place.

Session shape: `{id, date, day, program, ex:[{name, sets:[{w, r, done}]}]}`. Dates are stamped at
**midday** so daylight-saving shifts can't move a session onto the neighbouring day.

## Testing

```bash
node gym/test.js
# or: cd gym && npm install jsdom && node test.js
```

Checks across 19 scenarios driving the real UI and assets. Add a scenario for any bug you fix — this suite exists because
visual inspection missed a dead button twice.

## After any change to index.html

Bump `CACHE` in `sw.js` (e.g. `ferrodastiro-v17`). Installed phones serve the cached copy until the version string changes.

## Exercise diagrams (`img/exercises/`)

Two-frame vector SVGs (`viewBox="0 0 300 150"`), transparent background:
- **Left (0–150):** Starting position with `<text x="75" y="142" text-anchor="middle" font-size="10" font-family="system-ui, sans-serif" font-weight="600" fill="#71717A">START</text>`.
- **Right (150–300):** Mid/peak contraction position with `<text x="225" y="142" text-anchor="middle" font-size="10" font-family="system-ui, sans-serif" font-weight="600" fill="#71717A">MID</text>`.
- **Divider:** dashed vertical line `<line x1="150" y1="15" x2="150" y2="135" stroke="#E4E4E7" stroke-dasharray="3 3" />`.
- **Colors:** limbs/torso `#18181B`, equipment `#52525B` / `#71717A`, active accents `#C25E3E`.

## Deliberate design decisions — don't "fix" these

- Weights are remembered **per set position**, so a 60/70/80 ramp returns as 60/70/80.
- Changing an exercise's target reps only rewrites sets **not yet logged**, keeping history honest.
- Estimated 1RM uses combined Epley + Brzycki formula (`(epley + brzycki) / 2`, exact weight for 1 rep) with heavy-set prioritization (`r ≤ 5` prioritized over high-rep sets `r > 5`).
- Calendar weeks start Monday.
- Timed exercises (`t:1` in `EXERCISES`) label their column `sec`, not `reps`.
- Muscular balance radar evaluates 6 functional muscle groups (Chest, Shoulders, Biceps, Legs, Back, Triceps) using biomechanical benchmark balance ratios relative to Chest: Bench (1.00), OHP (0.65), Curl (0.40), Squat (1.45), Row/Pull-up (1.00), Close-Grip Bench (0.75). Multi-exercise equivalence table (`EXERCISE_EQUIV`) normalizes any lift in that group to its compound benchmark equivalent, picking the group's highest normalized 1RM across sessions.
