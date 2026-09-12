# FerroDaStiro Test Suite

The test suite for FerroDaStiro lives in `test.js` and runs in Node.js via `jsdom`.

## Running Tests

```bash
NODE_PATH=/home/emanuele/n8n-local/node_modules node gym/test.js
```

The entire suite of 14 scenarios and ~130 assertions executes in under 4 seconds with zero external test runners or browser binaries required.

---

## Architecture

* **Engine:** Pure Node.js + `jsdom`. Reads `index.html` directly, evaluates scripts in a virtual DOM context (`runScripts: 'dangerously'`).
* **Isolation (`boot()`):** Each scenario calls `boot()`, which instantiates a fresh DOM window with isolated `localStorage`, mocked `alert` / `confirm` / `scrollTo`, and captures all runtime errors.
* **Realistic Event Simulation (`tap()`):** Dispatches native DOM events (`MouseEvent('click')`, `Event('input')`) to test real user interactions rather than calling internal functions directly.
* **Assertions (`check()`):** Minimalist assertion runner that tracks passing and failing checks with diagnostic logs.

---

## The 14 Scenarios

### Core Workflows (Scenarios 1 – 4)
1. **Scenario 1: Fresh Profile & Calendar Start**
   * *Purpose:* Verifies onboarding (`fname`, `fgo`), default program setup ("Upper / Lower"), and opening today's workout directly from the calendar.
2. **Scenario 2: Ad-Hoc Exercise Selection ("Pick Exercises")**
   * *Purpose:* Verifies building an ad-hoc workout from the exercise library, search filter, selecting exercises, and confirming with `#addsel`.
3. **Scenario 3: Program Day Workout & Multi-Workout Logging**
   * *Purpose:* Follows a scheduled program day (e.g. Upper A), logs weights and sets, finishes the workout, verifies the calendar marks the day as trained (`cell.has`), and proves a user can log a second workout on the same day.
4. **Scenario 4: Repeat Past Workout with Weight Memory**
   * *Purpose:* Verifies that previous weights and rep targets carry over into repeated workouts per set position (e.g. 60/70/80 kg returns as 60/70/80 kg).

### Navigation, Programs & State (Scenarios 5 – 8)
5. **Scenario 5: Month Navigation & Custom Program Builder**
   * *Purpose:* Tests the calendar month arrows (`‹` / `›`) and verifies the "Build a program" editor (`vEditor`) can construct custom multi-day programs and persist them.
6. **Scenario 6: Draft Persistence & Profile Isolation**
   * *Purpose:* Verifies that an open workout draft is preserved when switching tabs or profiles, and never leaks into another profile's storage.
7. **Scenario 7: Date Handling & Backdating**
   * *Purpose:* Tests logging workouts across different calendar dates: past days, today, future planned days, and backdating sessions to verify chronological sorting.
8. **Scenario 8: Multi-Session Deletion & Zero-Weight Math**
   * *Purpose:* Tests deleting individual workouts when multiple exist on one day, updating monthly totals, and prevents NaN or division-by-zero on bodyweight (0 kg) exercises.

### Diagrams & Custom Features (Scenarios 9 – 12)
9. **Scenario 9: SVG Diagram Structure Audit**
   * *Purpose:* Reads the exercise SVG files on disk and asserts they follow the strict 2-frame vector standard (`viewBox="0 0 300 150"`, start frame at x=75, mid frame at x=225, dashed divider at x=150, correct color palette).
10. **Scenario 10: Vector Markup Completeness (Back & Core)**
    * *Purpose:* Audits SVG XML trees to ensure they contain genuine vector paths and shapes rather than empty shells.
11. **Scenario 11: `exSlug()` Mapping & Diagram UI Toggling**
    * *Purpose:* Tests that special exercise names (e.g. "Farmer's walk" with apostrophes) map correctly to file slugs, and that tapping the exercise header toggles the visual diagram in the active workout card.
12. **Scenario 12: Custom Exercise Creation Flow**
    * *Purpose:* Tests the "+ New" button in the library, inline form validation (no duplicate names, muscle group selection, reps vs seconds), persistence in `db.customEx`, and selecting custom exercises into workouts.

### Recent Fixes & Analytics (Scenarios 13 – 14)
13. **Scenario 13: Unticked Sets Persistence (PR #8 Regression Guard)**
    * *Purpose:* Proves that tapping "Finish session" with filled weights/reps saves the workout even if zero ✓ checkmarks were tapped, preventing the silent discard bug.
14. **Scenario 14: Progress Analytics Overhaul (PR #10)**
    * *Purpose:* Validates the new analytics engine: dual volume calculations (total reps and weight tonnage), weekly/monthly timeframe views, muscle group distribution charts, and immediate rendering on the very first workout.
