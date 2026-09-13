# FerroDaStiro

A workout log that runs entirely in the browser. No account, no server, no analytics.
Every session is written to `localStorage` on the device that logged it.

## Deployment

FerroDaStiro is hosted at `https://emanuelenene.github.io/gym/`. Pushing changes on `main` deploys automatically via GitHub Pages.

GitHub Pages serves over HTTPS, which the service worker and the install prompt both require.

## Install on an iPhone

1. Open the URL in **Safari** (not Chrome — only Safari can add to the Home Screen on iOS).
2. Share button → **Add to Home Screen**.
3. Launch it from the icon. It opens full-screen, no browser chrome, and works offline.

Each family member does this on their own phone and creates their own profile on first launch.

## How the data works

| Key | Contents |
|---|---|
| `fds.profiles` | `[{id, name}]` — the people on this device |
| `fds.active` | which profile is currently selected |
| `fds.data.<id>` | that person's programs, sessions, custom exercises, and in-progress draft |

Consequences worth knowing:

- Data is **per device and per browser**. The same person on a phone and a laptop has two separate logs.
- Safari clears localStorage for sites you haven't opened in **7 days** — but this does not apply to sites added to the Home Screen, which is the main reason to install it rather than bookmark it.
- Deleting the Home Screen app deletes the data with it. Use **Programs → Backup → Export file** periodically; import restores it.
- Several people can share one phone via profiles, but anyone using that phone can read all profiles on it. There is no password.

## How a workout gets logged

The calendar is the home screen. Tap a day — today is selected on open — and start a workout on it.
Three routes:

1. **From a program** — any day out of any program, active one listed first.
2. **Pick exercises** — straight into the library, build the session as a one-off.
3. **Repeat a past workout** — clones an earlier session with its weights already filled in.

Sessions are stamped at midday on the chosen date, so you can backdate a workout you forgot to log
(or plan a future one) without daylight-saving pushing it onto the wrong day. Logged sessions can be
deleted from the calendar card.

## Weight memory

Weights are remembered **per set position**, not as a single number. If bench went 60 / 70 / 80 last
week, next week's three sets come pre-filled 60 / 70 / 80. Ask for more sets than last time and the
extras inherit the final weight. Each exercise also shows a "last time" line with the exact sets you
did and when.

## Building your own program

**Programs → Build a program.** Add days, then pull exercises from a library of 73 movements
filtered by muscle group (Chest, Back, Shoulders, Legs, Arms, Core, Conditioning) or by search.
Each exercise carries a default sets × reps that you can override per program.

Built-in programs can't be edited directly — hit **Copy** on one and you get an editable duplicate,
so the originals stay intact for whoever else uses the phone.

Custom programs are stored per profile under `custom` in that person's data blob:

```js
custom: { c1a2b3: { name, note, days: [ { name, ex: [ ['Exercise', sets, reps], ... ] } ] } }
```

Exercises marked `t:1` in the `EXERCISES` array (planks, sled pushes, cardio) are measured in
seconds — the logging screen labels that column `sec` instead of `reps`.

## Calendar

Month grid, Monday-first. Days with a logged session are filled and show the workout name;
tap one to see the full session, tap again to go back to the whole month. Deleting a custom
program does not remove sessions already logged under it.

## Editing the code

`index.html` is the whole application — markup, styles and logic in one file. After changing it,
bump `CACHE` in `sw.js` (currently `ferrodastiro-v11`) or installed phones will keep serving the old version.

### Running the tests

`test.js` drives the real UI in a headless browser — creating profiles, starting workouts by all
three routes, logging sets, finishing, repeating past sessions, editing programs.

```bash
node gym/test.js
```

Or from within the `gym/` directory:

```bash
npm install jsdom
node test.js
```

Worth running after any edit. It catches the class of bug that looks fine on screen: a button that
renders but whose click handler was thrown away.

Programs live in the `BUILTIN` object near the top of the script. The shape is:

```js
key: { name:'Display name', note:'subtitle', days:[
  { name:'Day name', ex:[ ['Exercise', sets, targetReps], ... ] }
]}
```

## Progress & analytics

The Progress tab provides timeframe analytics and per-exercise tracking:

- **Volume trends & timeframe views:** Interactive SVG bar charts showing Weekly (past 8 weeks) or Monthly (past 6 months) volume, with toggles between weight volume (`weight × reps`) and total reps volume.
- **Muscle group breakdown:** Visual breakdown showing total sets, reps, and percentage distribution across muscle groups (Chest, Back, Legs, Shoulders, Arms, Core, Conditioning).
- **Per-exercise 1RM & history:** Exercise selector for tracking estimated one-rep max using the **Epley formula** (`weight × (1 + reps / 30)`), which allows different weight/rep combinations to be compared on one axis. Renders 1RM stat card and session volume immediately after 1 logged session, with a trend line drawn once 2 or more sessions are logged.
