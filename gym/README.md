# FerroDaStiro

A workout log that runs entirely in the browser. No account, no server, no analytics.
Every session is written to `localStorage` and mirrored into `IndexedDB` on the device that logged it.

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

### Dual-layer storage & durability

- **LocalStorage + IndexedDB Mirroring:** Synchronous UI operations read and write to `localStorage` with zero latency. Every write is asynchronously mirrored to an IndexedDB store (`fds_store`, store `kv`).
- **Auto-Resurrection:** If Safari clears `localStorage` due to storage pressure or site inactivity, FerroDaStiro automatically recovers profile and workout logs from IndexedDB on startup.
- **Persistent Storage API (`navigator.storage.persist()`):** FerroDaStiro requests persistent storage from WebKit so that site data is protected against browser eviction. Status is displayed in Settings under **Storage & Durability**.

Consequences worth knowing:

- Data is **per device and per browser**. The same person on a phone and a laptop has two separate logs.
- IndexedDB mirroring and the WebKit Persistent Storage API prevent data loss from 7-day browser storage eviction.
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

`index.html` contains the markup, styles, and core application logic, while the exercise catalog and equivalence helpers live in `exercises.js`. After changing application code, bump `CACHE` in `sw.js` or installed phones will keep serving the old version.

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
- **Per-exercise 1RM & history:** Exercise selector for tracking estimated one-rep max using the combined **Epley + Brzycki formula** with heavy-set prioritization, allowing different weight/rep combinations to be compared on one axis. Renders 1RM stat card and session volume immediately after 1 logged session, with a trend line drawn once 2 or more sessions are logged.
- **Muscular Balance Radar Chart:** Biomechanical symmetry radar analyzing 6 functional muscle groups against evidence-based benchmark ratios, with multi-exercise equivalence normalization and automated deficit diagnostics.

## 1RM Engine & Multi-Data Precision

FerroDaStiro estimates one-rep maximum (1RM) using a hybrid biomechanical formula combined with rep-bracket predictive weighting:

### Formula: Combined Epley + Brzycki
Traditional single-formula estimators suffer from well-documented skew: Epley tends to overestimate 1RM at moderate rep counts, whereas Brzycki tends to underestimate as reps climb. FerroDaStiro combines both models to maximize accuracy across the rep spectrum:

- **1-Rep Anchor ($r = 1$):** If a single repetition is performed, the 1RM is anchored exactly to the lifted weight:
  $$\text{1RM} = w \quad (r = 1)$$
- **Averaged Estimation ($r > 1$):** For multi-rep sets, the estimate is the arithmetic mean of Epley and Brzycki:
  $$\text{Epley} = w \times \left(1 + \frac{r}{30}\right)$$
  $$\text{Brzycki} = w \times \left(\frac{36}{37 - r}\right)$$
  $$\text{1RM} = \frac{\text{Epley} + \text{Brzycki}}{2}$$
- **High-Rep Safety Fallback ($r \ge 36$):** The Brzycki formula has a singularity at $r = 37$ (division by zero) and produces negative numbers for $r > 37$. When $r \ge 36$, the Brzycki term gracefully falls back to the Epley estimate to prevent mathematical anomalies.

### Multi-Data Precision (Heavy-Set Prioritization)
Repetition maximum formulas lose predictive validity as repetition counts increase, because high-rep sets measure local muscular endurance and cardiovascular capacity rather than neuromuscular maximal force output:

- **Heavy sets ($\le 5$ reps):** Prioritized for 1RM estimation due to high predictive confidence ($\sim 95\%+$ accuracy compared to true 1RM testing). When a session contains any completed sets with 5 or fewer reps, FerroDaStiro isolates those sets to determine the session's peak 1RM.
- **High-rep sets ($> 5$ reps):** Act as a graceful fallback only when no heavy sets ($\le 5$ reps) are recorded in that session.

---

## Muscular Balance Radar & Biomechanical Reference System

The **Muscular Balance & Symmetry** card in the Progress tab evaluates functional muscular harmony and flags structural deficits that could lead to postural imbalances or joint injury.

### 6 Functional Muscle Groups
The radar chart maps symmetry across 6 primary functional muscle groups:
1. **Chest**
2. **Shoulders**
3. **Biceps**
4. **Legs**
5. **Back**
6. **Triceps**

### Biomechanical Benchmark Ratios
Strength standards are anchored relative to the barbell bench press (Chest = 1.00) based on clinical and strength-conditioning literature:

| Muscle Group | Ratio | Compound Benchmark | Biomechanical Rationale |
|---|---|---|---|
| **Chest** | **1.00** | Barbell Bench Press | Horizontal push baseline. |
| **Back** | **1.00** | Barbell Row / Pull-up | Critical 1:1 push/pull ratio to prevent shoulder internal rotation and impingement. |
| **Legs** | **1.45** | Back Squat | Lower-to-upper body structural power foundation. |
| **Shoulders** | **0.65** | Standing Overhead Press | Vertical pressing ratio to horizontal press. |
| **Triceps** | **0.75** | Close-Grip Bench Press | Elbow extension and pressing lockout synergy. |
| **Biceps** | **0.40** | Barbell Curl | Elbow flexion and pulling joint balance. |

### Dual View Modes
- **Relative (% Balance):** Visualizes symmetry relative to the user's strongest compound lift (scaled so that a balanced physique forms a regular hexagon at 100%). Any inward dent immediately exposes an underdeveloped muscle group, while an outward point highlights a dominant muscle group.
- **Absolute ($db.unit$ — kg or lb):** Calibrated in actual weight units, displaying normalized compound 1RM against expected target weight for each group.

### Multi-Exercise Equivalence Engine (`EXERCISE_EQUIV`)
Athletes do not always perform the exact benchmark lift (e.g., performing leg presses instead of back squats, or dumbbell presses instead of barbell bench). FerroDaStiro normalizes any exercise back to its primary compound benchmark equivalent:

$$\text{Normalized 1RM} = \frac{\text{Raw Estimated 1RM}}{\text{Multiplier}}$$

Key equivalence multipliers include:
- **45° Leg Press ($1.85\times$):** Accounts for the incline force vector ($F = mg \sin 45^\circ$), guided track friction, and the absence of spinal and pelvic stabilization load.
- **Dumbbells vs. Barbell ($0.82\times$):** Dumbbell bench press incurs an ~18% stabilization tax measured in EMG studies due to independent rotational drift and unilateral motor control demands.
- **Incline Presses ($0.85\times$ barbell, $0.75\times$ dumbbell):** Biomechanical force vector shift transferring load from sternal pectoralis to anterior deltoids and clavicular head.
- **Lat Pulldowns / Cable Rows ($0.95\times$):** Guided cable pulley systems reduce core stabilization compared to free-weight barbell rows.

The engine automatically selects the **highest normalized compound 1RM** achieved in each muscle group across all logged sessions, ensuring that secondary movements contribute accurately to symmetry diagnostics.

### Interactive Symmetry Diagnostics
- **Interactive vertex and label inspection:** Tapping any vertex or label on the SVG radar chart reveals the exact underlying lift, raw weight lifted, normalized compound weight, target weight, and percentage of biomechanical balance.
- **Automatic Dominant & Lagging Group identification:** When at least 2 muscle groups have logged data, the engine automatically identifies the user's **Dominant Group** and flags the **Lagging Group / Imbalance Alert** with exact percentage deficit and actionable exercise recommendations to restore symmetry.

