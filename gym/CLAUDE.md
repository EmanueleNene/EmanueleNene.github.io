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
- **localStorage only.** No server, no sync, no account. Data must never leave the device.
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

## Storage

```
fds.profiles      [{id, name}]
fds.active        profile id
fds.data.<id>     {unit, programId, custom:{}, customEx:[], sessions:[], draft}
```

A one-time migration from the old `ironlog.*` keys runs at startup. Leave it in place.

Session shape: `{id, date, day, program, ex:[{name, sets:[{w, r, done}]}]}`. Dates are stamped at
**midday** so daylight-saving shifts can't move a session onto the neighbouring day.

## Testing

```bash
node gym/test.js
# or: cd gym && npm install jsdom && node test.js
```

145 checks across 14 scenarios driving the real UI and assets. Add a scenario for any bug you fix — this suite exists because
visual inspection missed a dead button twice.

## After any change to index.html

Bump `CACHE` in `sw.js` (e.g. `ferrodastiro-v10`). Installed phones serve the cached copy until the version string changes.

## Exercise diagrams (`img/exercises/`)

Two-frame vector SVGs (`viewBox="0 0 300 150"`), transparent background:
- **Left (0–150):** Starting position with `<text x="75" y="142" text-anchor="middle" font-size="10" font-family="system-ui, sans-serif" font-weight="600" fill="#71717A">START</text>`.
- **Right (150–300):** Mid/peak contraction position with `<text x="225" y="142" text-anchor="middle" font-size="10" font-family="system-ui, sans-serif" font-weight="600" fill="#71717A">MID</text>`.
- **Divider:** dashed vertical line `<line x1="150" y1="15" x2="150" y2="135" stroke="#E4E4E7" stroke-dasharray="3 3" />`.
- **Colors:** limbs/torso `#18181B`, equipment `#52525B` / `#71717A`, active accents `#C25E3E`.

## Deliberate design decisions — don't "fix" these

- Weights are remembered **per set position**, so a 60/70/80 ramp returns as 60/70/80.
- Changing an exercise's target reps only rewrites sets **not yet logged**, keeping history honest.
- Estimated 1RM uses Epley (`w × (1 + r/30)`), accurate to roughly ±5% under ~10 reps.
- Calendar weeks start Monday.
- Timed exercises (`t:1` in `EXERCISES`) label their column `sec`, not `reps`.
