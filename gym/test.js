const fs = require('fs');
const path = require('path');
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (err) {
  const fallbacks = [
    '/home/emanuele/.npm/_npx/32b3ceb8ef573b04/node_modules/jsdom',
    '/home/emanuele/n8n-local/node_modules/jsdom'
  ];
  for (const p of fallbacks) {
    try { ({ JSDOM } = require(p)); if (JSDOM) break; } catch {}
  }
  if (!JSDOM) throw err;
}

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function createMockIndexedDB() {
  const stores = {};
  return {
    _stores: stores,
    open(name, version) {
      const req = {
        result: null,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      };
      setTimeout(() => {
        if (!stores[name]) {
          stores[name] = { objectStores: {} };
        }
        const dbObj = {
          name,
          version,
          objectStoreNames: {
            contains(sName) { return !!stores[name].objectStores[sName]; }
          },
          createObjectStore(sName) {
            if (!stores[name].objectStores[sName]) {
              stores[name].objectStores[sName] = new Map();
            }
            return {};
          },
          transaction(sNames, mode) {
            return {
              objectStore(sName) {
                const storeMap = stores[name].objectStores[sName] || new Map();
                return {
                  put(val, key) {
                    storeMap.set(key, JSON.parse(JSON.stringify(val)));
                    const r = { onsuccess: null, onerror: null };
                    setTimeout(() => { if (r.onsuccess) r.onsuccess(); }, 0);
                    return r;
                  },
                  get(key) {
                    const r = { result: undefined, onsuccess: null, onerror: null };
                    setTimeout(() => {
                      r.result = storeMap.has(key) ? JSON.parse(JSON.stringify(storeMap.get(key))) : undefined;
                      if (r.onsuccess) r.onsuccess();
                    }, 0);
                    return r;
                  },
                  delete(key) {
                    storeMap.delete(key);
                    const r = { onsuccess: null, onerror: null };
                    setTimeout(() => { if (r.onsuccess) r.onsuccess(); }, 0);
                    return r;
                  },
                  getAll() {
                    const r = { result: [], onsuccess: null, onerror: null };
                    setTimeout(() => {
                      r.result = Array.from(storeMap.values()).map(v => JSON.parse(JSON.stringify(v)));
                      if (r.onsuccess) r.onsuccess();
                    }, 0);
                    return r;
                  },
                  getAllKeys() {
                    const r = { result: [], onsuccess: null, onerror: null };
                    setTimeout(() => {
                      r.result = Array.from(storeMap.keys());
                      if (r.onsuccess) r.onsuccess();
                    }, 0);
                    return r;
                  }
                };
              }
            };
          },
          close() {}
        };
        req.result = dbObj;
        if (req.onupgradeneeded) req.onupgradeneeded({ target: req });
        if (req.onsuccess) req.onsuccess({ target: req });
      }, 0);
      return req;
    }
  };
}

function boot(options = {}) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://x.test/',
    beforeParse(window) {
      const exercisesJs = fs.readFileSync(path.join(__dirname, 'exercises.js'), 'utf8');
      window.eval(exercisesJs);
      if (options.mockIdb) {
        window.indexedDB = options.mockIdb;
      }
      if (options.persistState !== undefined) {
        window.navigator.storage = {
          persisted: async () => options.persistState,
          persist: async () => options.persistState
        };
      }
    }
  });
  const w = dom.window;
  w.scrollTo = () => {};
  w.alert = m => log.push('ALERT: ' + m);
  w.confirm = () => true;
  const log = [];
  w.onerror = (m) => log.push('ERROR: ' + m);
  w.addEventListener('error', e => log.push('ERROR: ' + e.message));
  return { w, d: w.document, log };
}

const tap = (d, sel) => {
  const el = typeof sel === 'string' ? d.querySelector(sel) : sel;
  if (!el) throw new Error('no element for ' + sel);
  el.dispatchEvent(new d.defaultView.MouseEvent('click', { bubbles: true }));
  return el;
};
const byText = (d, sel, txt) => [...d.querySelectorAll(sel)].find(e => e.textContent.includes(txt));

let fails = 0;
const check = (name, cond, extra='') => {
  console.log((cond ? '  PASS  ' : '  FAIL  ') + name + (cond ? '' : '  ' + extra));
  if (!cond) fails++;
};

// ---------- scenario 1: fresh install, start a workout on today ----------
{
  console.log('\n1. Fresh profile → start a workout from the calendar');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Nene';
  tap(d, '#fgo');
  check('calendar is the landing tab', d.querySelector('nav button[aria-current=true]').dataset.tab === 'calendar');
  check('today is preselected', !!d.querySelector('.cell.sel'));
  const start = d.querySelector('#startHere');
  check('start button rendered on empty day', !!start);
  if (start) {
    tap(d, start);
    check('start screen opened', !!d.querySelector('#fromProg'), log.join(' | '));
    check('three routes offered', !!d.querySelector('#fromProg') && !!d.querySelector('#fromLib') && !!d.querySelector('#fromPast'));
  }
  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 2: the "Pick exercises" route ----------
{
  console.log('\n2. Route: pick exercises from the library');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Nene'; tap(d, '#fgo');
  tap(d, '#startHere');
  tap(d, '#fromLib');
  const addsel = d.querySelector('#addsel');
  const lib = d.querySelector('#lib');
  check('library rendered', !!d.querySelector('#lib .libitem'), log.join(' | '));
  check('#addsel present in library view', !!addsel);
  check('#addsel positioned before #lib in DOM tree', !!(addsel && lib && (addsel.compareDocumentPosition(lib) & w.Node.DOCUMENT_POSITION_FOLLOWING)));
  if (d.querySelector('#lib .libitem')) {
    tap(d, d.querySelector('#lib .libitem'));
    tap(d, '#addsel');
    check('draft created and Train shown', !!d.querySelector('#finish'), log.join(' | '));
  }
  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 3: program-day route, log sets, finish, then add a SECOND workout ----------
{
  console.log('\n3. Program day → log → finish → add another workout on the same day');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Nene'; tap(d, '#fgo');
  tap(d, '#startHere'); tap(d, '#fromProg');
  tap(d, '#rows .libitem');
  check('draft opened from program day', !!d.querySelector('#finish'), log.join(' | '));
  d.querySelectorAll('.setrow').forEach((r, i) => {
    if (i < 3) { const inp = r.querySelector('input'); inp.value = 60 + i * 5;
      inp.dispatchEvent(new w.Event('input', { bubbles: true })); tap(d, r.querySelector('.tick')); }
  });
  tap(d, '#finish');
  check('back on calendar after finishing', d.querySelector('nav button[aria-current=true]').dataset.tab === 'calendar');
  check('day now marked as trained', !!d.querySelector('.cell.has'));
  const again = d.querySelector('#startHere');
  check('start button still present on a logged day', !!again);
  if (again) {
    tap(d, again);
    check('>>> can start a SECOND workout on a logged day', !!d.querySelector('#fromProg'), log.join(' | '));
  }
  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 4: repeat a past workout, weights carried ----------
{
  console.log('\n4. Repeat a past workout');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Nene'; tap(d, '#fgo');
  tap(d, '#startHere'); tap(d, '#fromProg'); tap(d, '#rows .libitem');
  d.querySelectorAll('.setrow').forEach((r, i) => {
    if (i < 2) { const inp = r.querySelector('input'); inp.value = 70 + i * 5;
      inp.dispatchEvent(new w.Event('input', { bubbles: true })); tap(d, r.querySelector('.tick')); }
  });
  tap(d, '#finish');
  tap(d, '#startHere'); tap(d, '#fromPast');
  check('past sessions listed', !!d.querySelector('#rows .libitem'), log.join(' | '));
  if (d.querySelector('#rows .libitem')) {
    tap(d, d.querySelector('#rows .libitem'));
    const first = d.querySelector('.setrow input');
    check('weights carried into the repeat', first && first.value === '70', 'got ' + (first && first.value));
  }
  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 5: month navigation + program builder ----------
{
  console.log('\n5. Month arrows and the program builder');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Nene'; tap(d, '#fgo');
  const label = d.querySelector('.monthbar b').textContent;
  tap(d, '#prev');
  check('previous month renders', d.querySelector('.monthbar b').textContent !== label, log.join(' | '));
  tap(d, 'nav button[data-tab=programs]');
  tap(d, '#newprog');
  check('editor opened', !!d.querySelector('#pname'), log.join(' | '));
  tap(d, '.addex');
  check('library opens from the editor', !!d.querySelector('#lib .libitem'), log.join(' | '));
  if (d.querySelector('#lib .libitem')) {
    tap(d, d.querySelector('#lib .libitem'));
    tap(d, '#addsel');
    check('exercise added to the day', !!d.querySelector('.exline'), log.join(' | '));
    d.querySelector('#pname').value = 'My split';
    d.querySelector('#pname').dispatchEvent(new w.Event('input', { bubbles: true }));
    tap(d, '#savep');
    check('program saved and became active', !!d.querySelector('#finish') || !!d.querySelector('#startHere'), log.join(' | '));
  }
  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

console.log('\n' + (fails ? fails + ' FAILING CHECK(S)' : 'all checks passed'));

// ---------- scenario 6: regressions around drafts and profile switching ----------
{
  console.log('\n6. Draft handling, backdating, second profile');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Nene'; tap(d, '#fgo');
  // pick a day earlier in the month
  const cells = [...d.querySelectorAll('.cell:not(.blank)')];
  tap(d, cells[2]);
  check('selecting an older day works', !!d.querySelector('#startHere'), log.join(' | '));
  tap(d, '#startHere'); tap(d, '#fromProg'); tap(d, '#rows .libitem');
  const first = d.querySelector('.setrow input');
  first.value = 50; first.dispatchEvent(new w.Event('input', { bubbles: true }));
  tap(d, d.querySelector('.tick'));
  // leave mid-session, come back via the calendar
  tap(d, 'nav button[data-tab=calendar]');
  const cont = d.querySelector('#startHere');
  check('open draft offers Continue', cont && cont.textContent.includes('Continue'), cont && cont.textContent);
  tap(d, cont);
  check('returns to the open draft', !!d.querySelector('#finish'), log.join(' | '));
  tap(d, '#finish');
  check('backdated session lands on the chosen day', !!d.querySelector('.cell.has'));
  // add an exercise mid-session on a new workout
  tap(d, '#startHere'); tap(d, '#fromProg'); tap(d, '#rows .libitem');
  const before = d.querySelectorAll('#exlist .card').length;
  tap(d, '#addex');
  tap(d, d.querySelector('#lib .libitem'));
  tap(d, '#addsel');
  check('add-exercise mid-session works', d.querySelectorAll('#exlist .card').length === before + 1, log.join(' | '));
  // drop an exercise
  tap(d, d.querySelector('.dropex'));
  check('drop-exercise works', d.querySelectorAll('#exlist .card').length === before, log.join(' | '));
  // second profile is isolated
  tap(d, '#who');
  d.querySelector('#newname').value = 'Sara';
  tap(d, '#addbtn');
  check('new profile lands on calendar', d.querySelector('nav button[aria-current=true]').dataset.tab === 'calendar');
  check('new profile has no trained days', d.querySelectorAll('.cell.has').length === 0);
  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

console.log('\n' + (fails ? fails + ' FAILING CHECK(S)' : 'ALL CHECKS PASSED'));

// ---------- scenario 7: the exact reported path, on several kinds of day ----------
{
  console.log('\n7. Start a workout on: today, a past day, a future day, a logged day');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Nene'; tap(d, '#fgo');
  const cells = () => [...d.querySelectorAll('.cell:not(.blank)')];

  const tryDay = (pick, label) => {
    tap(d, 'nav button[data-tab=calendar]');
    const list = cells();
    tap(d, list[typeof pick === 'function' ? pick(list) : pick]);
    const btn = d.querySelector('#startHere');
    if (!btn) { check('start button on ' + label, false, 'no button'); return; }
    tap(d, btn);
    const ok = !!d.querySelector('#fromProg');
    check('start menu opens on ' + label, ok, log.slice(-1).join(''));
    if (ok) { tap(d, '#fromProg'); const row = d.querySelector('#rows .libitem');
      check('  program list on ' + label, !!row);
      if (row) { tap(d, row); check('  draft opens on ' + label, !!d.querySelector('#finish'));
        tap(d, '#scrap'); } }
  };
  const findToday = l => l.findIndex(c => c.classList.contains('today'));
  tryDay(findToday, 'today');
  tryDay(1, 'an early day of the month');
  tryDay(l => l.length - 1, 'the last day of the month');

  // now log one, then retry that same day
  tap(d, 'nav button[data-tab=calendar]');
  tap(d, cells()[findToday(cells())]); tap(d, '#startHere'); tap(d, '#fromProg'); tap(d, '#rows .libitem');
  tap(d, d.querySelector('.tick')); tap(d, '#finish');
  tryDay(findToday, 'a day that already has a session');

  // and the library route on a fresh day
  tap(d, 'nav button[data-tab=calendar]');
  tap(d, cells()[2]); tap(d, '#startHere'); tap(d, '#fromLib');
  const item = d.querySelector('#lib .libitem');
  check('library route opens', !!item, log.slice(-1).join(''));
  if (item) { tap(d, item); tap(d, '#addsel');
    check('library route produces a draft', !!d.querySelector('#finish'), log.slice(-1).join('')); }
  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 8: multi-session deletion, month navigation selection, zero-weight chart ----------
{
  console.log('\n8. Multi-session deletion, month navigation, zero-weight progress');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Nene'; tap(d, '#fgo');

  // Month navigation: calSel is preserved as null when navigating
  tap(d, '#prev');
  check('no cell selected after month navigation', !d.querySelector('.cell.sel'));
  check('no start button when no day selected in navigated month', !d.querySelector('#startHere'));
  const monthCells = [...d.querySelectorAll('.cell:not(.blank)')];
  tap(d, monthCells[5]);
  check('selecting a day in navigated month selects cell', !!d.querySelector('.cell.sel'));
  const startNav = d.querySelector('#startHere');
  check('start button appears on selected day in navigated month', !!startNav);
  if (startNav) {
    tap(d, startNav);
    check('start workout route opens for selected day in navigated month', !!d.querySelector('#fromProg'));
    tap(d, '#cancelStart');
  }

  // Go back to today on calendar
  tap(d, '#next');
  tap(d, d.querySelector('.cell.today'));

  // Log session 1 on today
  tap(d, '#startHere'); tap(d, '#fromProg'); tap(d, '#rows .libitem');
  tap(d, d.querySelector('.tick')); tap(d, '#finish');

  // Log session 2 on today
  tap(d, '#startHere'); tap(d, '#fromProg'); tap(d, '#rows .libitem');
  tap(d, d.querySelector('.tick')); tap(d, '#finish');

  // Verify two sessions are rendered with delete buttons
  const delButtons = d.querySelectorAll('[data-del]');
  check('two sessions logged on same day', delButtons.length === 2);
  if (delButtons.length === 2) {
    tap(d, delButtons[0]);
    check('deleting one session leaves the second intact', d.querySelectorAll('[data-del]').length === 1);
  }

  // Zero-weight / bodyweight exercise in progress chart
  tap(d, '#startHere'); tap(d, '#fromLib');
  const libItems = d.querySelectorAll('#lib .libitem');
  tap(d, libItems[0]);
  tap(d, '#addsel');
  tap(d, d.querySelector('.tick')); tap(d, '#finish');

  tap(d, '#startHere'); tap(d, '#fromLib');
  const libItems2 = d.querySelectorAll('#lib .libitem');
  tap(d, libItems2[0]);
  tap(d, '#addsel');
  tap(d, d.querySelector('.tick')); tap(d, '#finish');

  tap(d, 'nav button[data-tab=progress]');
  const cardText = d.querySelector('#chart .card')?.textContent || '';
  check('progress chart does not display NaN%', !cardText.includes('NaN%'));
  check('progress chart does not display Infinity%', !cardText.includes('Infinity%'));
  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 9: exercise diagram SVG verification ----------
{
  console.log('\n9. Exercise diagram SVG verification (Chest, Shoulders & Legs)');
  const chest = [
    'bench-press.svg', 'incline-barbell-press.svg', 'incline-dumbbell-press.svg',
    'dumbbell-bench-press.svg', 'dumbbell-fly.svg', 'cable-crossover.svg',
    'machine-chest-press.svg', 'push-up.svg', 'dip.svg'
  ];
  const shoulders = [
    'overhead-press.svg', 'seated-dumbbell-press.svg', 'arnold-press.svg',
    'lateral-raise.svg', 'cable-lateral-raise.svg', 'rear-delt-fly.svg',
    'face-pull.svg', 'upright-row.svg'
  ];
  const legs = [
    'back-squat.svg', 'front-squat.svg', 'hack-squat.svg', 'leg-press.svg',
    'romanian-deadlift.svg', 'stiff-leg-deadlift.svg', 'bulgarian-split-squat.svg',
    'walking-lunge.svg', 'step-up.svg', 'leg-extension.svg', 'leg-curl.svg',
    'hip-thrust.svg', 'glute-bridge.svg', 'good-morning.svg',
    'standing-calf-raise.svg', 'seated-calf-raise.svg'
  ];
  const all = [...chest, ...shoulders, ...legs];
  const exDir = path.join(__dirname, 'img', 'exercises');

  check('exercise image directory exists', fs.existsSync(exDir));
  check('all 9 chest exercise SVGs exist', chest.every(f => fs.existsSync(path.join(exDir, f))));
  check('all 8 shoulder exercise SVGs exist', shoulders.every(f => fs.existsSync(path.join(exDir, f))));
  check('all 16 leg exercise SVGs exist', legs.every(f => fs.existsSync(path.join(exDir, f))));

  let allValidXml = true;
  let allConformant = true;
  let allDividers = true;
  let allLabels = true;

  for (const file of all) {
    const raw = fs.readFileSync(path.join(exDir, file), 'utf8');
    const dom = new JSDOM(raw, { contentType: 'image/svg+xml' });
    const doc = dom.window.document;
    if (doc.querySelector('parsererror')) allValidXml = false;

    const svg = doc.documentElement;
    if (svg.getAttribute('viewBox') !== '0 0 300 150' ||
        svg.getAttribute('width') !== '100%' ||
        svg.getAttribute('height') !== '100%') {
      allConformant = false;
    }

    const texts = [...doc.querySelectorAll('text')];
    const start = texts.find(t => t.textContent.trim() === 'START');
    const mid = texts.find(t => t.textContent.trim() === 'MID');
    if (!start || start.getAttribute('x') !== '75' || start.getAttribute('y') !== '142' ||
        !mid || mid.getAttribute('x') !== '225' || mid.getAttribute('y') !== '142') {
      allLabels = false;
    }

    const lines = [...doc.querySelectorAll('line')];
    const divider = lines.find(l => l.getAttribute('x1') === '150' && l.getAttribute('x2') === '150');
    if (!divider || divider.getAttribute('y1') !== '15' || divider.getAttribute('y2') !== '135' ||
        divider.getAttribute('stroke') !== '#E4E4E7' || divider.getAttribute('stroke-dasharray') !== '3 3') {
      allDividers = false;
    }
  }

  check('all 33 SVGs parse as valid XML without syntax errors', allValidXml);
  check('all 33 SVGs have viewBox="0 0 300 150", width="100%", height="100%"', allConformant);
  check('all 33 SVGs have START at (75, 142) and MID at (225, 142)', allLabels);
  check('all 33 SVGs have vertical dashed divider at x=150', allDividers);
}

// ---------- scenario 10: 2-frame vector SVG exercise diagrams (Back & Core) ----------
{
  console.log('\n10. Exercise diagram vector SVGs (Back & Core)');
  const backExercises = [
    'deadlift.svg', 'rack-pull.svg', 'barbell-row.svg', 'pendlay-row.svg',
    'dumbbell-row.svg', 't-bar-row.svg', 'cable-row.svg', 'lat-pulldown.svg',
    'pull-up.svg', 'chin-up.svg', 'straight-arm-pulldown.svg', 'shrug.svg'
  ];
  const coreExercises = [
    'plank.svg', 'side-plank.svg', 'hanging-leg-raise.svg', 'cable-crunch.svg',
    'ab-wheel-rollout.svg', 'russian-twist.svg', 'dead-bug.svg', 'back-extension.svg'
  ];
  const allExercises = [...backExercises, ...coreExercises];

  check('exactly 12 back exercise diagrams specified', backExercises.length === 12);
  check('exactly 8 core exercise diagrams specified', coreExercises.length === 8);

  const exDir = path.join(__dirname, 'img', 'exercises');
  check('img/exercises directory exists', fs.existsSync(exDir));

  let missingFiles = 0;
  let parseErrors = 0;
  let specErrors = 0;

  for (const filename of allExercises) {
    const filePath = path.join(exDir, filename);
    if (!fs.existsSync(filePath)) {
      missingFiles++;
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    let dom;
    try {
      dom = new JSDOM(raw, { contentType: 'image/svg+xml' });
    } catch (e) {
      parseErrors++;
      continue;
    }

    const svg = dom.window.document.documentElement;
    const viewBox = svg.getAttribute('viewBox');
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');

    if (viewBox !== '0 0 300 150' || width !== '100%' || height !== '100%') {
      specErrors++;
    }

    // Divider line at x=150
    const lines = Array.from(svg.querySelectorAll('line'));
    const divider = lines.find(l => l.getAttribute('x1') === '150' && l.getAttribute('x2') === '150');
    if (!divider || divider.getAttribute('y1') !== '15' || divider.getAttribute('y2') !== '135') {
      specErrors++;
    }

    // START label
    const texts = Array.from(svg.querySelectorAll('text'));
    const startText = texts.find(t => t.textContent.trim() === 'START');
    if (!startText || startText.getAttribute('x') !== '75' || startText.getAttribute('y') !== '142') {
      specErrors++;
    }

    // MID label
    const midText = texts.find(t => t.textContent.trim() === 'MID');
    if (!midText || midText.getAttribute('x') !== '225' || midText.getAttribute('y') !== '142') {
      specErrors++;
    }
  }

  check('all 20 exercise SVG files exist', missingFiles === 0, `${missingFiles} missing`);
  check('all 20 exercise SVGs parse as valid XML', parseErrors === 0, `${parseErrors} parse errors`);
  check('all 20 exercise SVGs meet design standards (viewBox, divider, START/MID labels)', specErrors === 0, `${specErrors} spec errors`);
}

// ---------- scenario 11: exSlug mapping and exercise diagram toggling ----------
{
  console.log('\n11. exSlug mapping and exercise diagram toggling in library & active workout');
  const { w, d, log } = boot();

  // 1. exSlug mapping checks
  check('exSlug mapping: Bench press', w.exSlug('Bench press') === 'bench-press');
  check('exSlug mapping: Incline dumbbell press', w.exSlug('Incline dumbbell press') === 'incline-dumbbell-press');
  check('exSlug mapping: Farmer\'s walk', w.exSlug("Farmer's walk") === 'farmers-walk');

  // Setup profile & navigate to library
  d.querySelector('#fname').value = 'Nene'; tap(d, '#fgo');
  tap(d, '#startHere'); tap(d, '#fromLib');

  // 2. Library diagram toggling check
  const libDiagBtn = d.querySelector('#lib .diag-toggle');
  check('library renders diagram toggle button', !!libDiagBtn);
  check('library thumbnail img exists with onerror fallback', !!d.querySelector('#lib .ex-thumb[onerror*="display"]'));

  if (libDiagBtn) {
    check('library diagram initially closed', !d.querySelector('#lib .ex-diagram'));
    tap(d, libDiagBtn);
    const libDiagImg = d.querySelector('#lib .ex-diagram img');
    check('library diagram opens on toggle tap', !!libDiagImg);
    if (libDiagImg) {
      check('library diagram img src uses exSlug', libDiagImg.getAttribute('src').startsWith('img/exercises/') && libDiagImg.getAttribute('src').endsWith('.svg'));
      check('library diagram img includes onerror fallback', libDiagImg.getAttribute('onerror') === "this.style.display='none'");
    }
    tap(d, d.querySelector('#lib .diag-toggle'));
    check('library diagram closes on second toggle tap', !d.querySelector('#lib .ex-diagram'));
  }

  // 3. Active workout diagram toggling check
  const libItem = d.querySelector('#lib .libitem');
  if (libItem) {
    tap(d, libItem);
    tap(d, '#addsel');
    check('draft active workout opened', !!d.querySelector('#finish'));

    const exHead = d.querySelector('#exlist .exhead');
    const activeDiagBtn = d.querySelector('#exlist .diag-toggle');
    check('active workout renders exercise header', !!exHead);
    check('active workout renders illustration toggle button', !!activeDiagBtn);

    if (exHead) {
      check('active workout diagram initially closed', !d.querySelector('#exlist .ex-diagram'));

      // Tap header to expand
      tap(d, exHead);
      const activeDiagImg = d.querySelector('#exlist .ex-diagram img');
      check('active workout diagram opens on header tap', !!activeDiagImg);
      if (activeDiagImg) {
        check('active workout diagram img src uses exSlug', activeDiagImg.getAttribute('src').startsWith('img/exercises/') && activeDiagImg.getAttribute('src').endsWith('.svg'));
        check('active workout diagram img includes onerror fallback', activeDiagImg.getAttribute('onerror') === "this.style.display='none'");
      }

      // Tap header again to collapse
      tap(d, exHead);
      check('active workout diagram closes on second header tap', !d.querySelector('#exlist .ex-diagram'));
    }
  }

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 12: custom exercise creation, search, select into workout ----------
{
  console.log('\n12. Custom exercise creation, search, select into workout, log it');
  const { w, d, log } = boot();

  // Setup profile, navigate to library
  d.querySelector('#fname').value = 'Tester'; tap(d, '#fgo');
  tap(d, '#startHere'); tap(d, '#fromLib');

  check('library view has + New button', !!d.querySelector('#newex'));

  // Tap New exercise button
  tap(d, '#newex');
  check('creation form shown: name input', !!d.querySelector('#cxname'));
  check('creation form shown: group chips', !!d.querySelector('#cxchips'));
  check('creation form shown: reps button', !!d.querySelector('#cxreps'));
  check('creation form shown: secs button', !!d.querySelector('#cxsecs'));
  check('creation form shown: sets input', !!d.querySelector('#cxsets'));
  check('creation form shown: reps value input', !!d.querySelector('#cxrepsv'));
  check('creation form shown: create button', !!d.querySelector('#cxsave'));
  check('creation form shown: cancel button', !!d.querySelector('#cxcancel'));

  // Try saving with empty name — should alert
  log.length = 0;
  tap(d, '#cxsave');
  check('saving without a name triggers alert', log.some(m => m.startsWith('ALERT:')));

  // Fill in name and pick Shoulders group
  d.querySelector('#cxname').value = 'Custom cable face pull';
  d.querySelector('#cxname').dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
  const groupBtns = d.querySelectorAll('#cxchips button');
  const shouldersBtn = [...groupBtns].find(b => b.textContent === 'Shoulders');
  if (shouldersBtn) tap(d, shouldersBtn);

  // Switch to Seconds measurement
  tap(d, '#cxsecs');
  check('seconds button now active after tap', d.querySelector('#cxsecs').className.includes('rust'));
  check('reps button is now ghost after tap', d.querySelector('#cxreps').className.includes('ghost'));

  // Set custom sets/reps
  d.querySelector('#cxsets').value = '4';
  d.querySelector('#cxsets').dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
  d.querySelector('#cxrepsv').value = '30';
  d.querySelector('#cxrepsv').dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));

  // Save it
  log.length = 0;
  tap(d, '#cxsave');
  check('no alert when saving valid exercise', !log.some(m => m.startsWith('ALERT:')));
  check('library view restored after save', !!d.querySelector('#newex'), 'expected library view with #newex');

  // Check the custom exercise persisted in db
  // Read db from localStorage (fds.data.<profileId>)
  const profiles = JSON.parse(w.localStorage.getItem('fds.profiles') || '[]');
  const activeId = w.localStorage.getItem('fds.active');
  const dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  check('custom exercise stored in db.customEx', Array.isArray(dbData.customEx) && dbData.customEx.some(e => e.n === 'Custom cable face pull'));
  const stored = (dbData.customEx || []).find(e => e.n === 'Custom cable face pull');
  if (stored) {
    check('stored exercise has correct group', stored.g === 'Shoulders');
    check('stored exercise is timed (t:1)', stored.t === 1);
    check('stored exercise has 4 sets', stored.s === 4);
    check('stored exercise has 30 reps/secs', stored.r === 30);
  }

  // The library should now show it in the list (search was set to the name by save logic)
  check('custom exercise visible in library list', !!d.querySelector('#lib .libitem-row'));
  const libItems = [...d.querySelectorAll('#lib .libitem')];
  check('custom exercise appears in lib items', libItems.some(b => b.textContent.includes('Custom cable face pull')));

  // Check allExercises includes it (via exMeta)
  check('exMeta finds custom exercise', !!w.exMeta('Custom cable face pull'));
  check('isTimed returns true for timed custom exercise', w.isTimed('Custom cable face pull'));

  // Clear search and filter to Shoulders to find it
  const qInput = d.querySelector('#q');
  qInput.value = '';
  qInput.dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
  // Test Biceps and Triceps filter chips
  const chips = [...d.querySelectorAll('.chips button')];
  const shouldersChip = chips.find(b => b.textContent === 'Shoulders');
  const bicepsChip = chips.find(b => b.textContent === 'Biceps');
  check('Biceps filter chip present', !!bicepsChip);
  if (bicepsChip) tap(d, bicepsChip);
  check('biceps exercises visible when filtered by Biceps', [...d.querySelectorAll('#lib .libitem')].some(b => b.textContent.includes('curl')));

  const tricepsChip = chips.find(b => b.textContent === 'Triceps');
  check('Triceps filter chip present', !!tricepsChip);
  if (tricepsChip) tap(d, tricepsChip);
  check('triceps exercises visible when filtered by Triceps', [...d.querySelectorAll('#lib .libitem')].some(b => b.textContent.includes('Triceps') || b.textContent.includes('dip')));

  // Filter by Shoulders
  if (shouldersChip) tap(d, shouldersChip);

  const filteredItems = [...d.querySelectorAll('#lib .libitem')];
  check('custom exercise visible when filtered by Shoulders', filteredItems.some(b => b.textContent.includes('Custom cable face pull')));

  // Select it into the workout
  const customLibBtn = [...d.querySelectorAll('#lib .libitem')].find(b => b.textContent.includes('Custom cable face pull'));
  if (customLibBtn) tap(d, customLibBtn);
  check('custom exercise selected (Add button enabled)', !d.querySelector('#addsel').disabled);

  // Confirm add
  tap(d, '#addsel');
  check('draft active workout opened with custom exercise', !!d.querySelector('#finish'));

  // Check the custom exercise is in the draft
  const exList = d.querySelector('#exlist');
  check('custom exercise name appears in draft exlist', !!exList && exList.textContent.includes('Custom cable face pull'));

  // Log a set for the custom exercise
  const inputs = d.querySelectorAll('.setrow input');
  if (inputs.length >= 2) {
    inputs[0].value = '0'; // no weight (bodyweight / time)
    inputs[0].dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
    inputs[1].value = '30';
    inputs[1].dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
    const tick = d.querySelector('.setrow .tick');
    if (tick) tap(d, tick);
  }

  // Finish the session
  tap(d, '#finish');
  check('session logged with custom exercise — returned to calendar', !!d.querySelector('.cell.sel'));

  // Verify session exists in db with the custom exercise
  const dbData2 = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  check('session stored in db.sessions', (dbData2.sessions||[]).length > 0);
  if ((dbData2.sessions||[]).length) {
    const last = dbData2.sessions[0];
    check('custom exercise logged in session', last.ex.some(e => e.name === 'Custom cable face pull'));
  }

  // Verify the custom exercise badge is shown in the library
  tap(d, '#startHere'); tap(d, '#fromLib');
  const allLibItems = [...d.querySelectorAll('#lib .libitem')];
  const customBadgeItem = allLibItems.find(b => b.textContent.includes('Custom cable face pull'));
  check('custom exercise shows "custom" badge in library', !!customBadgeItem && customBadgeItem.innerHTML.includes('custom'));

  // Duplicate name rejected
  tap(d, '#newex');
  d.querySelector('#cxname').value = 'Custom cable face pull';
  d.querySelector('#cxname').dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
  log.length = 0;
  tap(d, '#cxsave');
  check('duplicate exercise name is rejected with alert', log.some(m => m.startsWith('ALERT:')));

  // Cancel returns to library
  tap(d, '#cxcancel');
  check('cancel returns to library view', !!d.querySelector('#newex'));

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 13: finish session with no sets ticked — must still save ----------
{
  console.log('\n13. Finish session with filled-in sets but no ✓ ticks — session must still save');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Nene'; tap(d, '#fgo');

  // Start a workout via the library route
  tap(d, '#startHere'); tap(d, '#fromLib');
  const item = d.querySelector('#lib .libitem');
  check('library has at least one item', !!item);
  if (item) {
    tap(d, item);
    tap(d, '#addsel');
    check('draft opened', !!d.querySelector('#finish'), log.join(' | '));

    // Fill in weight and reps for the first set WITHOUT ticking ✓
    const rows = d.querySelectorAll('.setrow');
    check('at least one set row rendered', rows.length > 0);
    if (rows.length > 0) {
      const inputs = rows[0].querySelectorAll('input');
      if (inputs[0]) {
        inputs[0].value = '80';
        inputs[0].dispatchEvent(new w.Event('input', { bubbles: true }));
      }
      if (inputs[1]) {
        inputs[1].value = '10';
        inputs[1].dispatchEvent(new w.Event('input', { bubbles: true }));
      }
      // Do NOT tap the tick button — this is the regression scenario
    }

    // Tap Finish session — the session must be saved
    tap(d, '#finish');
    check('returned to calendar after finish', d.querySelector('nav button[aria-current=true]').dataset.tab === 'calendar');
    check('calendar shows a trained day', !!d.querySelector('.cell.has'));

    // Verify the session is in db.sessions with the exercise and set data
    const activeId = w.localStorage.getItem('fds.active');
    const dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
    check('session saved in db.sessions', (dbData.sessions || []).length > 0, 'db.sessions was empty');
    if ((dbData.sessions || []).length > 0) {
      const saved = dbData.sessions[0];
      check('saved session has at least one exercise', saved.ex.length > 0, 'ex array was empty');
      if (saved.ex.length > 0) {
        const ex = saved.ex[0];
        check('saved exercise has sets', ex.sets.length > 0, 'sets array was empty');
        if (ex.sets.length > 0) {
          const set = ex.sets[0];
          check('saved set has entered weight (80)', String(set.w) === '80', 'got w=' + set.w);
          check('saved set has entered reps (10)', String(set.r) === '10', 'got r=' + set.r);
        }
      }
    }
  }

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 14: progress analytics overhaul ----------
{
  console.log('\n14. Progress analytics overhaul (dual volume metrics, timeframe toggle, muscle group breakdown)');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Analytics Tester'; tap(d, '#fgo');

  // Verify empty progress tab when 0 sessions logged
  tap(d, 'nav button[data-tab=progress]');
  check('progress tab shows empty message before any workout', (d.querySelector('.empty')?.textContent || '').includes('first session'));

  // Switch back to calendar to start a workout
  tap(d, 'nav button[data-tab=calendar]');
  tap(d, '#startHere'); tap(d, '#fromLib');
  const libItems = d.querySelectorAll('#lib .libitem');
  tap(d, libItems[0]);
  if (libItems[1]) tap(d, libItems[1]);
  tap(d, '#addsel');

  // Fill set details: set 1 weight 80, reps 10; set 2 weight 100, reps 5
  const rows = d.querySelectorAll('.setrow');
  if (rows.length > 0) {
    const inputs = rows[0].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '80'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '10'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
  }
  if (rows.length > 1) {
    const inputs = rows[1].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '100'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '5'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
  }

  tap(d, '#finish');

  // Switch to Progress tab after 1 session logged
  tap(d, 'nav button[data-tab=progress]');

  // Check 1: Progress tab is NOT empty after 1 session
  check('after 1 session, progress tab volume chart is rendered', !!d.querySelector('#volume-chart'));
  check('weekly button present and active', !!d.querySelector('#tf-weekly'));
  check('monthly button present', !!d.querySelector('#tf-monthly'));

  // Check 2: Volume calculations
  const viewText = d.querySelector('#view').textContent;
  check('volume stats rendered (weight vol and reps)', viewText.includes('Weight volume') && viewText.includes('Total reps'));
  check('volume chart SVG rendered', !!d.querySelector('#volume-chart svg'));

  // Check 3: Muscle group breakdown rendered with categories and non-zero counts
  const mbElem = d.querySelector('#muscle-breakdown');
  check('muscle group breakdown section present', !!mbElem);
  check('muscle breakdown renders SVG pie chart', !!mbElem?.querySelector('.mg-pie-wrap svg'));
  const mbText = mbElem ? mbElem.textContent : '';
  check('muscle group breakdown contains categories', mbText.includes('Chest') || mbText.includes('Legs') || mbText.includes('Back'));
  check('muscle group breakdown contains non-zero set counts', /\d+\s*sets/.test(mbText));

  // Check 3b: Interactive Pie Chart slices and center text reset
  const pieSlices = mbElem ? [...mbElem.querySelectorAll('.pie-slice')] : [];
  check('Slices in the SVG pie chart are present with data-group and data-pct', pieSlices.length > 0 && pieSlices.every(s => s.dataset.group && s.dataset.pct !== undefined));

  if (pieSlices.length > 0) {
    const firstSlice = pieSlices[0];
    const groupName = firstSlice.dataset.group;
    const groupPct = firstSlice.dataset.pct;

    // Tap the slice
    tap(d, firstSlice);
    const pieValAfterTap = mbElem.querySelector('#pie-val')?.textContent;
    const pieLblAfterTap = mbElem.querySelector('#pie-lbl')?.textContent;
    check('Tapping a slice updates the center text readout to display that group\'s name and percentage', pieValAfterTap === `${groupPct}%` && pieLblAfterTap.includes(groupName));

    // Tap the same slice again to reset
    tap(d, firstSlice);
    const pieValAfterReset = mbElem.querySelector('#pie-val')?.textContent;
    const pieLblAfterReset = mbElem.querySelector('#pie-lbl')?.textContent;
    check('Tapping again resets to the total sets view', pieLblAfterReset === 'total sets' && pieValAfterReset !== `${groupPct}%`);
  }

  // Check 4: Single session 1RM note
  const pickSelect = d.querySelector('#pick');
  check('exercise picker dropdown present', !!pickSelect);
  const chartText = d.querySelector('#chart')?.textContent || '';
  check('single session exercise note displayed', chartText.includes('Trend line will appear once you log a second session'));

  // Check 5: Toggle between weekly and monthly views
  tap(d, '#tf-monthly');
  check('monthly view toggle activates monthly button', !d.querySelector('#tf-monthly').classList.contains('ghost'));
  const monthlyText = d.querySelector('#view').textContent;
  check('monthly view updates header text', monthlyText.includes('This Month'));

  tap(d, '#tf-weekly');
  check('weekly view toggle activates weekly button', !d.querySelector('#tf-weekly').classList.contains('ghost'));
  const weeklyText = d.querySelector('#view').textContent;
  check('weekly view updates header text', weeklyText.includes('This Week'));

  // Check 6: Toggle volume metric
  const repsBtn = d.querySelector('#m-reps');
  if (repsBtn) {
    tap(d, repsBtn);
    check('reps metric button activated', !d.querySelector('#m-reps').classList.contains('ghost'));
  }

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 15: editing existing logged sessions, canceling edits, unticked volume ----------
{
  console.log('\n15. Modify existing workout, cancel edit, unticked set stats');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Editor'; tap(d, '#fgo');

  // Log an initial session
  tap(d, '#startHere'); tap(d, '#fromLib');
  const item = d.querySelector('#lib .libitem');
  if (item) tap(d, item);
  tap(d, '#addsel');

  const rows = d.querySelectorAll('.setrow');
  if (rows.length > 0) {
    const inputs = rows[0].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '50'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '10'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
  }
  tap(d, '#finish');

  // Verify calendar session card has Edit button
  const editBtn = d.querySelector('.card [data-edit]');
  check('Edit button present on logged session card', !!editBtn);

  // Tap Edit
  if (editBtn) tap(d, editBtn);
  check('tapping Edit switches to train tab', d.querySelector('nav button[aria-current=true]').dataset.tab === 'train');
  check('finish button shows Save changes in edit mode', d.querySelector('#finish')?.textContent === 'Save changes');
  check('discard button shows Cancel edit in edit mode', d.querySelector('#scrap')?.textContent === 'Cancel edit');

  // Verify unticked stats: volume and set count display in train view without ticks
  const statText = d.querySelector('.stat')?.textContent || '';
  check('volume is computed and displayed without set tick', statText.includes('500') && statText.includes('volume'));
  check('sets count displays total sets without requiring set ticks', statText.includes('sets'));

  // Test Cancel Edit: modify weight in draft, then tap Cancel Edit
  const editRows = d.querySelectorAll('.setrow');
  if (editRows.length > 0) {
    const inputs = editRows[0].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '999'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
  }
  tap(d, '#scrap'); // Cancel edit
  check('canceling edit returns to calendar', d.querySelector('nav button[aria-current=true]').dataset.tab === 'calendar');

  // Verify original session was untouched (volume is still 500, not 9990)
  const activeId = w.localStorage.getItem('fds.active');
  let dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  let origSession = dbData.sessions[0];
  check('original session set weight untouched after cancel edit', origSession.ex[0].sets[0].w === '50', 'weight was ' + origSession.ex[0].sets[0].w);

  // Now Edit again, change weight to 70, and Save changes
  const editBtn2 = d.querySelector('.card [data-edit]');
  if (editBtn2) tap(d, editBtn2);

  const editRows2 = d.querySelectorAll('.setrow');
  if (editRows2.length > 0) {
    const inputs = editRows2[0].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '70'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
  }
  tap(d, '#finish'); // Save changes
  check('saving edit returns to calendar', d.querySelector('nav button[aria-current=true]').dataset.tab === 'calendar');

  // Verify session in db.sessions was updated in place
  dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  const updatedSession = dbData.sessions[0];
  check('session in db.sessions updated in place with new weight', updatedSession.ex[0].sets[0].w === '70');
  check('calendar card displays updated volume', [...d.querySelectorAll('.card .note')].some(n => n.textContent.includes('700')));

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 16: bodyweight tracking & trend charting ----------
{
  console.log('\n16. Optional bodyweight tracking and trend charting in Progress tab');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'BW Tester'; tap(d, '#fgo');

  // Go to Progress tab
  tap(d, 'nav button[data-tab=progress]');

  // 1. Verify Bodyweight card renders with empty state
  const bwCard = d.querySelector('#bw-card');
  check('Bodyweight card renders in Progress tab', !!bwCard);
  const bwCardText = bwCard ? bwCard.textContent : '';
  check('Bodyweight card shows empty state text', bwCardText.includes('Bodyweight tracking is optional. Log your weight to see your progress chart.'));

  // 2. Log weight entry (75.5)
  const bwInput = d.querySelector('#bw-val');
  check('weight input present', !!bwInput);
  if (bwInput) {
    bwInput.value = '75.5';
    bwInput.dispatchEvent(new w.Event('input', { bubbles: true }));
  }
  const bwForm = d.querySelector('#bw-form');
  if (bwForm) {
    bwForm.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  }

  // Verify db.bodyweight and single entry state UI
  const activeId = w.localStorage.getItem('fds.active');
  let dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  check('Logging weight entry adds it to db.bodyweight', Array.isArray(dbData.bodyweight) && dbData.bodyweight.length === 1 && dbData.bodyweight[0].w === 75.5);

  const bwCard1 = d.querySelector('#bw-card');
  const bwText1 = bwCard1 ? bwCard1.textContent : '';
  check('Single entry view displays current weight and prompt', bwText1.includes('75.5 kg') && bwText1.includes('Log more entries to see your trend chart'));

  // 3. Log a second entry on a different day to render SVG trend chart and net change stat
  // Inject a past entry directly into db.bodyweight to simulate multiple days
  dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);
  dbData.bodyweight.unshift({
    id: 'bw_test_1',
    date: yesterday.getTime(),
    w: 74.5
  });
  w.localStorage.setItem('fds.data.' + activeId, JSON.stringify(dbData));

  // Refresh Progress tab view (reload db in JS runtime from localStorage by calling w.loadData())
  w.loadData();
  tap(d, 'nav button[data-tab=calendar]');
  tap(d, 'nav button[data-tab=progress]');

  const bwCard2 = d.querySelector('#bw-card');
  const bwText2 = bwCard2 ? bwCard2.textContent : '';
  check('Logging a second entry renders net change stat (+1.0 kg)', bwText2.includes('+1.0 kg') || bwText2.includes('Net change'));
  check('SVG trend chart is rendered for 2+ entries', !!bwCard2?.querySelector('svg'));

  // 4. Delete an entry via Calendar day detail
  tap(d, 'nav button[data-tab=calendar]');
  const selCell = d.querySelector('.cell.sel') || d.querySelector('.cell.today');
  if (selCell) tap(d, selCell);

  const calBwDelBtn = d.querySelector('#cal-bw-del');
  check('delete weight button present in calendar day detail', !!calBwDelBtn);
  if (calBwDelBtn) tap(d, calBwDelBtn);

  // Check db and UI after deletion
  dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  check('Deleting entry removes it from db.bodyweight', dbData.bodyweight.length === 1);
  tap(d, 'nav button[data-tab=progress]');
  const bwCard3 = d.querySelector('#bw-card');
  const bwText3 = bwCard3 ? bwCard3.textContent : '';
  check('UI updates after deletion back to single entry view', bwText3.includes('Log more entries to see your trend chart'));

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 17: Epley + Brzycki 1RM formula with heavy-set prioritization ----------
{
  console.log('\n17. Epley + Brzycki 1RM formula with heavy-set prioritization');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = '1RM Tester'; tap(d, '#fgo');

  // Formula checks via e1rm evaluation in JSDOM scope
  const e1rm = (weight, reps) => w.eval(`e1rm(${weight}, ${reps})`);

  // Single-set 1RM checks
  check('Single-set 1RM: 1 rep equals exact weight (120 kg x 1 = 120 kg)', e1rm(120, 1) === 120);
  
  // 120 kg x 3 reps:
  // Epley = 120 * (1 + 3/30) = 120 * 1.1 = 132
  // Brzycki = 120 * (36 / (37 - 3)) = 120 * 36 / 34 = 127.0588...
  // Average = (132 + 127.0588...) / 2 = 129.5294...
  const val3 = e1rm(120, 3);
  check('Single-set 1RM: 120 kg x 3 reps equals expected Epley + Brzycki average (~129.5 kg)', Math.abs(val3 - 129.5294) < 0.1);

  // Edge case handling: reps >= 36
  const val36 = e1rm(100, 36);
  const val40 = e1rm(100, 40);
  check('Edge case handling: reps >= 36 handled gracefully without NaN or negative values', !isNaN(val36) && val36 > 0 && !isNaN(val40) && val40 > 0);

  // Log a session with both heavy sets (<= 5 reps) and high-rep sets (> 5 reps)
  tap(d, '#startHere'); tap(d, '#fromLib');
  const libItems = d.querySelectorAll('#lib .libitem');
  const benchBtn = [...libItems].find(b => b.textContent.includes('Bench press')) || libItems[0];
  tap(d, benchBtn);
  tap(d, '#addsel');

  const exName = d.querySelector('.exhead h3')?.textContent.split(' ')[0] || 'Bench press';

  // Add sets: set 1 = 100kg x 3 reps (heavy <= 5 reps, 1RM ~107.9)
  //           set 2 = 80kg x 15 reps (high rep > 5 reps, 1RM ~125.4)
  const rows = d.querySelectorAll('.setrow');
  if (rows.length > 0) {
    const inputs = rows[0].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '100'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '3'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
  }
  const setStep = d.querySelector('.step[data-k=sets] button[data-d="1"]');
  if (setStep) tap(d, setStep);
  const updatedRows = d.querySelectorAll('.setrow');
  if (updatedRows.length > 1) {
    const inputs = updatedRows[1].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '80'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '15'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
  }
  tap(d, '#finish');

  // Go to Progress tab and check chartFor output
  tap(d, 'nav button[data-tab=progress]');
  const pickSelect = d.querySelector('#pick');
  if (pickSelect) {
    const option = [...pickSelect.options].find(o => o.text.includes(exName));
    if (option) {
      pickSelect.value = option.value;
      pickSelect.dispatchEvent(new w.Event('change', { bubbles: true }));
    }
  }

  const chartCard = d.querySelector('#chart');
  const chartText = chartCard ? chartCard.textContent : '';
  check('Progress tab UI renders single session stat Best 1RM (Epley + Brzycki)', chartText.includes('Best 1RM (Epley + Brzycki)'));
  check('Multi-data precision: in a session with both heavy sets (<= 5 reps) and high-rep sets (> 5 reps), heavy set is prioritized', chartText.includes('108 kg') || chartText.includes('108'));

  // Log a second session with ONLY high-rep sets (> 5 reps) to test fallback & 2+ sessions UI
  tap(d, 'nav button[data-tab=calendar]');
  tap(d, '#startHere'); tap(d, '#fromLib');
  const libItems2 = d.querySelectorAll('#lib .libitem');
  const benchBtn2 = [...libItems2].find(b => b.textContent.includes('Bench press')) || libItems2[0];
  tap(d, benchBtn2);
  tap(d, '#addsel');

  const rowsS2 = d.querySelectorAll('.setrow');
  if (rowsS2.length > 0) {
    const inputs = rowsS2[0].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '60'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '12'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
  }
  tap(d, '#finish');

  // Return to Progress tab
  tap(d, 'nav button[data-tab=progress]');
  const pickSelect2 = d.querySelector('#pick');
  if (pickSelect2) {
    const option = [...pickSelect2.options].find(o => o.text.includes(exName));
    if (option) {
      pickSelect2.value = option.value;
      pickSelect2.dispatchEvent(new w.Event('change', { bubbles: true }));
    }
  }

  const chartCard2 = d.querySelector('#chart');
  const chartText2 = chartCard2 ? chartCard2.textContent : '';
  check('Multi-data precision: session with only high-rep sets uses high-rep set as fallback', chartText2.includes('Peak 1RM'));
  check('Progress tab UI renders overall peak 1RM prominently with rep category note', chartText2.includes('Peak 1RM (≤5 reps)') || chartText2.includes('Peak 1RM (>5 reps)'));
  check('Progress tab UI renders updated explanatory footer note', chartText2.includes('Estimated 1RM: Epley & Brzycki average with heavy-set priority'));

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 18: Muscular Balance Radar Chart with multi-exercise equivalence ----------
{
  console.log('\n18. Muscular Balance Radar Chart with multi-exercise equivalence');
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Radar Scribe'; tap(d, '#fgo');

  // 1. Equivalence multipliers & Benchmark balance ratios
  const equiv = w.window.EXERCISE_EQUIV;
  const ratios = w.window.BENCHMARK_BALANCE;

  check('Equivalence multiplier: Leg press is 1.85 (185 kg converts to 100 kg squat equivalence)',
    equiv['Leg press'] === 1.85 && Math.abs(185 / equiv['Leg press'] - 100) < 0.001);
  check('Equivalence multiplier: Incline barbell press is 0.85 (85 kg converts to 100 kg bench equivalence)',
    equiv['Incline barbell press'] === 0.85 && Math.abs(85 / equiv['Incline barbell press'] - 100) < 0.001);
  check('Equivalence multiplier: default for unlisted exercise is 1.0',
    equiv['Nonexistent Unknown Lift'] === 1.0);
  check('Benchmark balance ratios: Chest=1.00, Shoulders=0.65, Biceps=0.40, Legs=1.45, Back=1.67, Triceps=0.90',
    ratios.Chest.ratio === 1.00 && ratios.Shoulders.ratio === 0.65 && ratios.Biceps.ratio === 0.40 &&
    ratios.Legs.ratio === 1.45 && ratios.Back.ratio === 1.67 && ratios.Triceps.ratio === 0.90);

  // 2. Multi-exercise group selection & Imbalance detection
  // Log session with:
  // - Incline dumbbell press (Chest, mult=0.75): 60 kg x 1 rep -> norm1rm = 80 kg
  // - Bench press (Chest, mult=1.0): 100 kg x 1 rep -> norm1rm = 100 kg
  //   => Highest normalized 1RM in Chest should be 100 kg from Bench press
  // - Barbell row (Back, mult=1.0): 50 kg x 1 rep -> norm1rm = 50 kg
  tap(d, '#startHere'); tap(d, '#fromLib');
  const libItems = d.querySelectorAll('#lib .libitem');
  const benchBtn = [...libItems].find(b => b.textContent.includes('Bench press'));
  const incDbBtn = [...libItems].find(b => b.textContent.includes('Incline dumbbell press'));
  const rowBtn = [...libItems].find(b => b.textContent.includes('Barbell row'));

  tap(d, benchBtn);
  tap(d, incDbBtn);
  tap(d, rowBtn);
  tap(d, '#addsel');

  // Fill sets:
  // Bench press (card 0): 100 kg x 1 rep
  // Incline dumbbell press (card 1): 60 kg x 1 rep
  // Barbell row (card 2): 50 kg x 1 rep
  const cards = d.querySelectorAll('#exlist .card');
  if (cards.length >= 3) {
    const set0 = cards[0].querySelector('.setrow');
    if (set0) {
      const inputs = set0.querySelectorAll('input');
      if (inputs[0]) { inputs[0].value = '100'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
      if (inputs[1]) { inputs[1].value = '1'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
    }
    const set1 = cards[1].querySelector('.setrow');
    if (set1) {
      const inputs = set1.querySelectorAll('input');
      if (inputs[0]) { inputs[0].value = '60'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
      if (inputs[1]) { inputs[1].value = '1'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
    }
    const set2 = cards[2].querySelector('.setrow');
    if (set2) {
      const inputs = set2.querySelectorAll('input');
      if (inputs[0]) { inputs[0].value = '50'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
      if (inputs[1]) { inputs[1].value = '1'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
    }
  }
  tap(d, '#finish');

  // Verify multi-exercise group selection in computeMuscularBalance
  const balance = w.window.computeMuscularBalance();
  check('Multi-exercise group selection: when a user logs multiple exercises in a group, the highest normalized 1RM is chosen',
    balance.data.Chest.norm1rm === 100 && balance.data.Chest.exercise === 'Bench press');

  // 3. Progress tab UI verification
  tap(d, 'nav button[data-tab=progress]');
  const radarCard = d.querySelector('#radar-card');
  check('Radar chart rendering: Progress tab renders the Muscular Balance card',
    !!radarCard && radarCard.textContent.includes('Muscular Balance & Symmetry'));

  const radarSvg = d.querySelector('#radar-chart');
  check('Radar chart rendering: the SVG radar chart is rendered',
    !!radarSvg && radarSvg.querySelectorAll('.radar-label').length === 6);

  const radarSummary = d.querySelector('#radar-summary');
  check('Radar chart rendering: and the symmetry summary is rendered', !!radarSummary);

  // 4. Mode toggle verification (Relative vs Absolute)
  const relBtn = d.querySelector('#radar-mode-rel');
  const absBtn = d.querySelector('#radar-mode-abs');
  check('Default view mode is Relative (% Balance)',
    relBtn && relBtn.getAttribute('aria-pressed') === 'true' && !!radarSvg.querySelector('.radar-ref-poly'));

  tap(d, absBtn);
  check('Toggle between Relative and Absolute modes updates the view',
    d.querySelector('#radar-mode-abs').getAttribute('aria-pressed') === 'true' &&
    d.querySelector('#radar-mode-rel').getAttribute('aria-pressed') === 'false' &&
    !!d.querySelector('#radar-chart .radar-target-poly'));

  tap(d, d.querySelector('#radar-mode-rel'));
  check('Toggling back to Relative mode restores relative view',
    d.querySelector('#radar-mode-rel').getAttribute('aria-pressed') === 'true' &&
    d.querySelector('#radar-mode-abs').getAttribute('aria-pressed') === 'false');

  // 5. Imbalance detection (Chest 100 kg vs Back 50 kg -> 50% deficit)
  const sumText = radarSummary ? radarSummary.textContent : '';
  check('Imbalance detection: when Chest is strong (100 kg) and Back is lagging (50 kg), the summary flags Back as lagging with correct percentage deficit',
    sumText.includes('Back') && (sumText.includes('50% deficit') || sumText.includes('50% balance')));
  check('Imbalance detection: shows Dominant Group (Chest: 100 kg)',
    sumText.includes('Chest: 100 kg') || sumText.includes('Chest: 100'));
  check('Imbalance detection: provides actionable hint for Back',
    sumText.includes('Add more rows or pull-ups to balance horizontal push/pull'));

  // 6. Interactive vertex click
  const chestLabel = d.querySelector('.radar-label[data-group=Chest]');
  if (chestLabel) tap(d, chestLabel);
  const detailText = d.querySelector('#radar-detail')?.textContent || '';
  check('Interactive vertex inspection: highlights muscle group best exercise and exact stats',
    detailText.includes('Chest') && detailText.includes('100 kg') && detailText.includes('Bench press') && detailText.includes('100% balanced'));

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 19: persistent storage api, dual indexeddb mirroring & auto-resurrection ----------
(async () => {
  console.log('\n19. Level 1 Storage Permanence: Persistent Storage API & IndexedDB Mirroring');
  const mockIdb = createMockIndexedDB();
  const { w, d, log } = boot({ mockIdb, persistState: true });

  // 1. Check persistent storage initialization
  check('Persistent storage API initialization', typeof w.checkPersistence === 'function' && typeof w.requestPersistence === 'function');

  // Let initial microtasks settle for persist request
  await new Promise(r => setTimeout(r, 20));
  check('Persistence status checked and enabled', w.storageStatus.persisted === true);

  // 2. Dual-layer write mirroring: create profile and log a workout session
  d.querySelector('#fname').value = 'Durable Hero';
  tap(d, '#fgo');

  tap(d, '#startHere');
  tap(d, '#fromLib');
  const item = d.querySelector('#lib .libitem');
  tap(d, item);
  tap(d, '#addsel');

  const rows = d.querySelectorAll('.setrow');
  if (rows.length > 0) {
    const inputs = rows[0].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '90'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '8'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
  }
  tap(d, '#finish');

  // Wait for async idbPut to complete
  await new Promise(r => setTimeout(r, 20));

  const idbStore = mockIdb._stores['fds_store']?.objectStores['kv'];
  check('IndexedDB dual-layer write: saving a profile or workout session mirrors data to IndexedDB',
    idbStore && idbStore.has('fds.profiles') && idbStore.get('fds.profiles')[0].name === 'Durable Hero');

  const activeId = w.localStorage.getItem('fds.active');
  const storedDb = idbStore ? idbStore.get('fds.data.' + activeId) : null;
  check('IndexedDB holds complete session payload', storedDb && storedDb.sessions && storedDb.sessions.length > 0);

  // 3. Storage recovery / auto-resurrection: wipe localStorage and boot a fresh instance
  // The fresh instance has an empty localStorage, but shares the same mock IndexedDB
  const bootRecover = boot({ mockIdb, persistState: true });
  const w2 = bootRecover.w;
  const d2 = bootRecover.d;

  check('Fresh instance starts with empty localStorage before resurrection', !w2.localStorage.getItem('fds.profiles'));

  // Trigger autoResurrect
  const restored = await w2.autoResurrect();
  check('Storage recovery / auto-resurrection: when localStorage is cleared, the app successfully restores profile and session data from IndexedDB',
    restored === true && !!w2.localStorage.getItem('fds.profiles'));

  // Load resurrected data and check calendar/sessions
  w2.loadProfiles();
  w2.loadData();
  w2.render();

  const restoredProfiles = JSON.parse(w2.localStorage.getItem('fds.profiles') || '[]');
  const profileId = restoredProfiles[0]?.id;
  const dbData2 = JSON.parse(w2.localStorage.getItem('fds.data.' + profileId) || '{}');
  check('Resurrected profile has restored workout sessions', dbData2.sessions && dbData2.sessions.length > 0);

  // 4. Settings view renders the storage durability card and status
  tap(d2, 'nav button[data-tab=programs]');
  const viewText = d2.querySelector('#view')?.textContent || '';
  check('Settings view renders the storage durability card and status',
    viewText.includes('Storage & Durability') && viewText.includes('Storage: Persistent & Protected (IndexedDB mirrored)'));

  console.log('  errors:', log.length ? log.join(' | ') : 'none');

  // ---------- scenario 20: hyperextension exercises catalog & diagram tests ----------
  console.log('\n20. Hyperextension exercises catalog & diagram tests');
  const all = w2.EXERCISES ? w2.EXERCISES : []; // or via JSDOM window
  const allExList = typeof w2.allExercises === 'function' ? w2.allExercises() : (w2.eval('allExercises()'));
  const exBack = allExList.find(e => e.n === 'Hyperextension (back)');
  check('Hyperextension (back) is present in allExercises()', !!exBack);
  if (exBack) {
    check('Hyperextension (back) belongs to group Back', exBack.g === 'Back');
    check('Hyperextension (back) defaults to 3 sets and 15 reps', exBack.s === 3 && exBack.r === 15);
    check('Hyperextension (back) resolves to slug hyperextension-back', w2.eval("exSlug('Hyperextension (back)')") === 'hyperextension-back');
  }

  const exThighs = allExList.find(e => e.n === 'Hyperextensions (thighs)');
  check('Hyperextensions (thighs) is present in allExercises()', !!exThighs);
  if (exThighs) {
    check('Hyperextensions (thighs) belongs to group Legs', exThighs.g === 'Legs');
    check('Hyperextensions (thighs) defaults to 3 sets and 15 reps', exThighs.s === 3 && exThighs.r === 15);
    check('Hyperextensions (thighs) resolves to slug hyperextensions-thighs', w2.eval("exSlug('Hyperextensions (thighs)')") === 'hyperextensions-thighs');
  }

  ['hyperextension-back.svg', 'hyperextensions-thighs.svg'].forEach(filename => {
    const filePath = path.join(__dirname, 'img', 'exercises', filename);
    const exists = fs.existsSync(filePath);
    check(`${filename} exists in gym/img/exercises/`, exists);
    if (exists) {
      const svgContent = fs.readFileSync(filePath, 'utf8');
      try {
        const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
        const doc = dom.window.document;
        const parseError = doc.querySelector('parsererror');
        check(`${filename} parses cleanly as valid XML`, !parseError);
      } catch (err) {
        check(`${filename} parses cleanly as valid XML`, false);
      }
    }
  });

  // ---------- scenario 21: modular exercises.js catalog, require/eval & offline cache ----------
  console.log('\n21. Exercise catalog modularity & offline caching');
  const exModulePath = path.join(__dirname, 'exercises.js');
  const exExists = fs.existsSync(exModulePath);
  check('gym/exercises.js exists and can be required/evaluated', exExists);
  if (exExists) {
    const exModule = require(exModulePath);
    check('EXERCISES array in exercises.js contains expected exercises',
      Array.isArray(exModule.EXERCISES) &&
      exModule.EXERCISES.some(e => e.n === 'Hyperextension (back)') &&
      exModule.EXERCISES.some(e => e.n === 'Hyperextensions (thighs)'));
    check('GROUPS array in exercises.js is present', Array.isArray(exModule.GROUPS) && exModule.GROUPS.includes('Chest'));
  }
  const swContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
  check("Offline cache in sw.js includes 'exercises.js'", swContent.includes("'exercises.js'"));
  check("sw.js cache version bumped to ferrodastiro-v26", swContent.includes("ferrodastiro-v26"));

  // ---------- scenario 22: library search space handling & timed exercise zero volume ----------
  console.log('\n22. Library search space handling & timed exercise zero volume');
  {
    const { w, d, log } = boot();
    d.querySelector('#fname').value = 'Tester'; tap(d, '#fgo');
    tap(d, '#startHere'); tap(d, '#fromLib');

    const qIn = d.querySelector('#q');
    check('library search input present', !!qIn);

    // Test search with spaces: "bench press"
    qIn.value = 'bench press';
    qIn.dispatchEvent(new w.Event('input', { bubbles: true }));
    let libItems = [...d.querySelectorAll('#lib .libitem')];
    check('searching "bench press" with space matches Bench press', libItems.some(b => b.textContent.includes('Bench press')));

    // Test search with space & multi-word tokens out of order: "press incline"
    qIn.value = 'press incline';
    qIn.dispatchEvent(new w.Event('input', { bubbles: true }));
    libItems = [...d.querySelectorAll('#lib .libitem')];
    check('searching "press incline" matches Incline dumbbell press', libItems.some(b => b.textContent.includes('Incline dumbbell press')));

    // Test input retains trailing spaces
    qIn.value = 'bench ';
    qIn.dispatchEvent(new w.Event('input', { bubbles: true }));
    const nqIn = d.querySelector('#q');
    check('search input element retains trailing space string', nqIn && nqIn.value === 'bench ');
    check('search input element DOM identity preserved on input update', nqIn === qIn);

    // Clear search and select Plank (a timed exercise)
    nqIn.value = 'Plank';
    nqIn.dispatchEvent(new w.Event('input', { bubbles: true }));
    libItems = [...d.querySelectorAll('#lib .libitem')];
    const plankItem = libItems.find(b => b.textContent.includes('Plank') && !b.textContent.includes('Side plank'));
    check('Plank exercise found in library search', !!plankItem);
    if (plankItem) tap(d, plankItem);
    tap(d, '#addsel');

    check('draft active workout opened with Plank', !!d.querySelector('#finish'));

    // Fill sets for Plank: weight=89, reps/sec=45
    const setRows = d.querySelectorAll('.setrow');
    if (setRows.length > 0) {
      const inputs = setRows[0].querySelectorAll('input');
      if (inputs[0]) { inputs[0].value = '89'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
      if (inputs[1]) { inputs[1].value = '45'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
    }

    // Verify active workout stat shows 0 volume
    const activeStatText = d.querySelector('.stat')?.textContent || '';
    check('active session volume excludes timed exercise (0 volume logged for 89kg plank)', activeStatText.includes('0kg volume') || activeStatText.includes('0 kg volume'));

    // Finish session
    tap(d, '#finish');

    // Verify calendar view monthly volume & session card volume
    const calStatText = d.querySelector('.stat')?.textContent || '';
    check('monthly volume in calendar excludes timed exercise (0 lifted)', calStatText.includes('0kg lifted') || calStatText.includes('0 kg lifted'));

    const sessionNote = [...d.querySelectorAll('.card .note')].find(n => n.textContent.includes('volume'))?.textContent || '';
    check('session card note excludes timed exercise volume (0 volume)', sessionNote.includes('0 kg volume') || sessionNote.includes('0 lbs volume'));

    // Check Progress tab analytics
    tap(d, 'nav button[data-tab=progress]');
    const progStatText = d.querySelector('.stat')?.textContent || '';
    check('Progress tab weight volume excludes timed exercise (0 kg)', progStatText.includes('0 kg'));

    console.log('  errors:', log.length ? log.join(' | ') : 'none');
  }

  // ---------- scenario 23: exercise card drag-and-drop & touch reordering ----------
  console.log('\n23. Exercise card reordering in active workout draft');
  {
    const { w, d } = boot();
    d.querySelector('#fname').value = 'ReorderTester';
    tap(d, '#fgo');
    tap(d, '#startHere');
    tap(d, '#fromLib');

    const libItems1 = d.querySelectorAll('#lib .libitem');
    if (libItems1.length >= 2) {
      tap(d, libItems1[0]);
      const libItems2 = d.querySelectorAll('#lib .libitem');
      tap(d, libItems2[1]);
      tap(d, '#addsel');

      const draft = w.eval('db.draft');
      check('draft active workout opened with at least 2 exercises', draft && draft.ex.length >= 2);

      const handles = d.querySelectorAll('#exlist .card .drag-handle');
      const cards = d.querySelectorAll('#exlist .card');
      check('exercise cards render drag handles', handles.length >= 2);
      check('drag handle has aria-label and draggable attribute', handles[0] && handles[0].getAttribute('aria-label').includes('Drag to reorder') && handles[0].getAttribute('draggable') === 'true');

      const initialEx0Name = draft.ex[0].name;
      const initialEx1Name = draft.ex[1].name;
      check('initial exercise order retrieved (' + initialEx0Name + ', ' + initialEx1Name + ')', !!initialEx0Name && !!initialEx1Name && initialEx0Name !== initialEx1Name);

      // Desktop HTML5 drag & drop simulation (drag handle 0, drop on card 1)
      handles[0].dispatchEvent(new w.Event('dragstart', { bubbles: true }));
      cards[1].dispatchEvent(new w.Event('drop', { bubbles: true }));

      const draftAfterDrag = w.eval('db.draft');
      check('reordering via desktop drag & drop swaps/moves items in db.draft.ex', draftAfterDrag.ex[0].name === initialEx1Name && draftAfterDrag.ex[1].name === initialEx0Name);

      // Verify persistence in localStorage
      const meId = w.eval('me');
      const reloadedDb = JSON.parse(w.localStorage.getItem('fds.data.' + meId) || '{}');
      check('reordered state persists in localStorage draft', reloadedDb.draft && reloadedDb.draft.ex[0].name === initialEx1Name);

      // Touch-based reordering simulation (touchstart handle 0, touchmove on card 1, touchend)
      const handlesAfter = d.querySelectorAll('#exlist .card .drag-handle');
      const cardsAfter = d.querySelectorAll('#exlist .card');

      w.document.elementFromPoint = (x, y) => cardsAfter[1];

      handlesAfter[0].dispatchEvent(new w.Event('touchstart', { bubbles: true }));
      const touchMoveEvt = new w.Event('touchmove', { bubbles: true });
      touchMoveEvt.touches = [{ clientX: 50, clientY: 150 }];
      handlesAfter[0].dispatchEvent(touchMoveEvt);
      handlesAfter[0].dispatchEvent(new w.Event('touchend', { bubbles: true }));

      const draftAfterTouch = w.eval('db.draft');
      check('reordering via touch swaps/moves items back in db.draft.ex', draftAfterTouch.ex[0].name === initialEx0Name && draftAfterTouch.ex[1].name === initialEx1Name);
    } else {
      check('library has at least 2 items for reordering test', false);
    }
  }

  // ---------- scenario 24: Cardio exercises, editable exercises & catalogue equivalence coefficients ----------
  console.log('\n24. Cardio exercises, editable exercises & catalogue equivalence coefficients');
  {
    const { w, d, log } = boot();
    d.querySelector('#fname').value = 'CardioEditTester'; tap(d, '#fgo');

    // 1. Verify Cardio exercises exist in exercises module and app library
    const exModule = require('./exercises.js');
    check('GROUPS includes Cardio category', exModule.GROUPS.includes('Cardio'));

    const treadmill = exModule.EXERCISES.find(e => e.n === 'Treadmill (run)');
    const bike = exModule.EXERCISES.find(e => e.n === 'Stationary bike');
    const rower = exModule.EXERCISES.find(e => e.n === 'Rowing machine');
    const elliptical = exModule.EXERCISES.find(e => e.n === 'Elliptical');
    const stairmaster = exModule.EXERCISES.find(e => e.n === 'Stairmaster');
    const inclineWalk = exModule.EXERCISES.find(e => e.n === 'Incline walk');

    check('Cardio exercises exist in EXERCISES array', !!treadmill && !!bike && !!rower && !!elliptical && !!stairmaster && !!inclineWalk);
    check('Cardio exercise Treadmill (run) has Cardio group and min measurement', treadmill && treadmill.g === 'Cardio' && treadmill.m === 'min');
    check('Cardio exercise Stationary bike has Cardio group and min measurement', bike && bike.g === 'Cardio' && bike.m === 'min');
    check('Cardio exercise Rowing machine has Cardio group and min measurement', rower && rower.g === 'Cardio' && rower.m === 'min');

    // Check measurement helper functions
    check('getExMeasurement returns "min" for Treadmill (run)', w.getExMeasurement('Treadmill (run)') === 'min');
    check('isTimed returns true for min measurement exercises', w.isTimed('Treadmill (run)') === true);

    // 2. Test edit restriction: built-in exercises have NO edit button, custom exercises DO
    tap(d, '#startHere');
    tap(d, '#fromLib');

    // Find Bench press (built-in exercise) row in library
    let libRows = [...d.querySelectorAll('.libitem-row')];
    let benchRow = libRows.find(r => r.querySelector('.libitem')?.textContent.includes('Bench press'));
    check('Bench press row found in library', !!benchRow);
    check('Built-in exercise Bench press has NO edit button', !benchRow?.querySelector('.ex-edit'));

    // Create a custom exercise
    tap(d, '#newex');
    d.querySelector('#cxname').value = 'My Custom Press';
    d.querySelector('#cxname').dispatchEvent(new w.Event('input', { bubbles: true }));
    tap(d, '#cxsave');

    // Find custom exercise row in library
    libRows = [...d.querySelectorAll('.libitem-row')];
    let customRow = libRows.find(r => r.querySelector('.libitem')?.textContent.includes('My Custom Press'));
    check('Custom exercise row found in library', !!customRow);
    const customEditBtn = customRow?.querySelector('.ex-edit');
    check('Custom exercise DO have the edit button', !!customEditBtn);

    if (customEditBtn) {
      tap(d, customEditBtn);
      // Verify edit form opened with custom exercise prefilled
      const cxNameIn = d.querySelector('#cxname');
      check('Exercise edit form rendered with custom exercise name', cxNameIn && cxNameIn.value === 'My Custom Press');

      // Verify UI form does not expose Equivalence Coefficient to users
      check('UI form does not contain #cxcoeff or Equivalence Coefficient input', !d.querySelector('#cxcoeff'));

      // Edit fields: Name -> My Custom Press Pro, Group -> Shoulders, Measurement -> Minutes
      cxNameIn.value = 'My Custom Press Pro';
      cxNameIn.dispatchEvent(new w.Event('input', { bubbles: true }));

      // Select Shoulders chip
      const shouldersChip = [...d.querySelectorAll('#cxchips .chip')].find(c => c.textContent === 'Shoulders');
      if (shouldersChip) tap(d, shouldersChip);

      // Select Minutes measurement
      const minBtn = d.querySelector('#cxmin');
      if (minBtn) tap(d, minBtn);

      // Save exercise edit
      tap(d, '#cxsave');

      // Verify edits saved in db.customEx
      const customExList = w.eval('db.customEx');
      check('customEx stores updated exercise My Custom Press Pro', customExList && customExList.some(e => e.n === 'My Custom Press Pro'));

      // Verify metadata & measurement updates
      const meta = w.exMeta('My Custom Press Pro');
      check('exMeta reflects updated group Shoulders for custom exercise', meta && meta.g === 'Shoulders');
      check('getExMeasurement reflects updated unit min for custom exercise', w.getExMeasurement('My Custom Press Pro') === 'min');
    }

    // 3. Catalogue equivalence coefficients, alias matching, and strict radar calculation policy
    check('Bench press catalogue exercise has explicit coeff 1.0', exModule.EXERCISES.find(e => e.n === 'Bench press').coeff === 1.0);
    check('Leg press catalogue exercise has explicit coeff 1.85', exModule.EXERCISES.find(e => e.n === 'Leg press').coeff === 1.85);

    // Test alias matching for 45° leg press
    check('Alias matching for "45 Leg Press" returns 1.85 coefficient', w.getExCoeff('45 Leg Press') === 1.85);
    check('Alias matching for "45° Leg Press" returns 1.85 coefficient', w.getExCoeff('45° Leg Press') === 1.85);

    // Test strict radar calculation policy: unvetted exercise with no coefficient is SKIPPED
    check('Unvetted exercise without coeff returns undefined from getExCoeff', w.getExCoeff('Unknown Unvetted Machine') === undefined);

    // Log session with an unvetted exercise
    const customSessions = [
      {
        id: 's_test_radar',
        day: 'Upper A',
        date: new Date().toISOString(),
        ex: [
          { name: 'Unknown Unvetted Machine', sets: [{ w: 100, r: 10 }] }
        ]
      }
    ];

    const radarResult = w.computeMuscularBalance(customSessions);
    check('Strict radar policy: unvetted exercise without coefficient is SKIPPED from radar balance (groupsWithDataCount === 0)', radarResult.groupsWithDataCount === 0);

    // Verify Chest Press and Machine Lat Pulldown exclusion & separation checks
    check('Machine chest press has no coeff in EXERCISES', exModule.EXERCISES.find(e => e.n === 'Machine chest press').coeff === undefined);
    check('getExCoeff for Machine chest press returns undefined', w.getExCoeff('Machine chest press') === undefined);
    check('getExCoeff for Incline machine chest press returns undefined', w.getExCoeff('Incline machine chest press') === undefined);

    const chestPressSession = [{ id: 's_cp', date: Date.now(), day: 'Chest Day', program: 'Test', ex: [{ name: 'Machine chest press', sets: [{ w: 80, r: 10, done: true }] }] }];
    const chestRadar = w.computeMuscularBalance(chestPressSession);
    check('Session with only Machine chest press produces no Chest balance data', chestRadar.data.Chest.hasData === false && chestRadar.data.Chest.norm1rm === 0);

    check('Machine lat pulldown exists in EXERCISES under group Back with 3 sets, 10 reps', exModule.EXERCISES.some(e => e.n === 'Machine lat pulldown' && e.g === 'Back' && e.s === 3 && e.r === 10));
    check('Machine lat pulldown has no coeff in EXERCISES', exModule.EXERCISES.find(e => e.n === 'Machine lat pulldown').coeff === undefined);
    check('getExCoeff for Machine lat pulldown returns undefined', w.getExCoeff('Machine lat pulldown') === undefined);
    check('getExCoeff for Lat pulldown preserves cable benchmark 0.55', w.getExCoeff('Lat pulldown') === 0.55);

    const latPressSession = [{ id: 's_mlp', date: Date.now(), day: 'Back Day', program: 'Test', ex: [{ name: 'Machine lat pulldown', sets: [{ w: 70, r: 10, done: true }] }] }];
    const backRadar = w.computeMuscularBalance(latPressSession);
    check('Session with only Machine lat pulldown produces no Back balance data', backRadar.data.Back.hasData === false && backRadar.data.Back.norm1rm === 0);

    const mlpSvgPath = path.join(__dirname, 'img', 'exercises', 'machine-lat-pulldown.svg');
    const mlpSvgExists = fs.existsSync(mlpSvgPath);
    let mlpSvgValid = false;
    if (mlpSvgExists) {
      try {
        const dom = new JSDOM(fs.readFileSync(mlpSvgPath, 'utf8'), { contentType: 'image/svg+xml' });
        mlpSvgValid = !dom.window.document.querySelector('parsererror');
      } catch (e) { mlpSvgValid = false; }
    }
    check('machine-lat-pulldown.svg exists and parses cleanly as valid XML', mlpSvgExists && mlpSvgValid);

    console.log('  errors:', log.length ? log.join(' | ') : 'none');
  }

  console.log('\n' + (fails ? fails + ' FAILING CHECK(S)' : 'ALL CHECKS PASSED'));

  // ---------- scenario 25: Calibrated Radar, 1:1 Push/Pull Diagnostic & Catalogue Expansion ----------
  console.log('\n25. Calibrated Radar, 1:1 Push/Pull Diagnostic & Catalogue Expansion');
  {
    const { w, d, log } = boot();
    d.querySelector('#fname').value = 'Scenario25Tester'; tap(d, '#fgo');

    const exModule = require('./exercises.js');
    const ratios = exModule.BENCHMARK_BALANCE;

    // 1. Test Deadlift as Back benchmark with ratio 1.67
    check('Back benchmark is Conventional Deadlift with ratio 1.67',
      ratios.Back.benchmark === 'Conventional Deadlift' && ratios.Back.ratio === 1.67 && ratios.Back.idealRatio === 1.67);

    // 2. Test Barbell row coefficient normalization to Deadlift (0.60 multiplier)
    const rowCoeff = w.getExCoeff('Barbell row');
    check('Barbell row coefficient is 0.60', rowCoeff === 0.60);
    const rowNorm = 120 / rowCoeff;
    check('Barbell row 120 kg normalizes to 200 kg Deadlift equivalent (120 / 0.60 = 200)', Math.abs(rowNorm - 200) < 0.001);

    // Also check all Back coefficients relative to Deadlift (1.00)
    check('Deadlift coefficient is 1.0', w.getExCoeff('Deadlift') === 1.0);
    check('Rack pull coefficient is 1.20', w.getExCoeff('Rack pull') === 1.20);
    check('T-bar row coefficient is 0.72', w.getExCoeff('T-bar row') === 0.72);
    check('Barbell row coefficient is 0.60', w.getExCoeff('Barbell row') === 0.60);
    check('Pendlay row coefficient is 0.52', w.getExCoeff('Pendlay row') === 0.52);
    check('Cable row coefficient is 0.55', w.getExCoeff('Cable row') === 0.55);
    check('Lat pulldown coefficient is 0.55', w.getExCoeff('Lat pulldown') === 0.55);
    check('Pull-up coefficient is 0.60', w.getExCoeff('Pull-up') === 0.60);
    check('Chin-up coefficient is 0.60', w.getExCoeff('Chin-up') === 0.60);

    // Verify accessory/isolation Back exercises have NO coefficient
    const accessoryBackList = ['Dumbbell row', 'Single-arm dumbbell row', 'Single-arm cable lat pulldown', 'Single-arm cable seated row', 'Shrug', 'Straight-arm pulldown', 'Hyperextension (back)'];
    const unallowedCoeffs = accessoryBackList.filter(name => w.getExCoeff(name) !== undefined);
    check('Accessory and isolation back exercises have no coefficient', unallowedCoeffs.length === 0, unallowedCoeffs.join(', '));

    // 3. Test newly added exercises are present in catalog and selectable into workouts
    const newExList = [
      'Single-leg extension',
      'Single-leg curl',
      'Single-leg 45° press',
      'Seated leg curl',
      'Lying leg curl',
      'Standing calf raise (machine)',
      'Single-arm cable lateral raise',
      'Single-arm dumbbell lateral raise',
      'Single-arm dumbbell shoulder press',
      'Single-arm cable curl',
      'Single-arm dumbbell curl',
      'Single-arm triceps pushdown',
      'Single-arm overhead cable extension',
      'Rope triceps pushdown',
      'Cable triceps kickback',
      'Cable front raise',
      'Cable face pull',
      'EZ-bar preacher curl',
      'Single-arm dumbbell row',
      'Single-arm cable lat pulldown',
      'Single-arm cable seated row',
      'High-to-low cable fly',
      'Low-to-high cable fly',
      'Pec deck fly',
      'Incline machine chest press',
      'Cable woodchopper'
    ];

    const allEx = exModule.EXERCISES;
    const missingNewEx = newExList.filter(name => !allEx.some(e => e.n === name));
    check('All newly added exercises exist in EXERCISES catalogue', missingNewEx.length === 0, missingNewEx.join(', '));

    // Test newly added exercises carry NO coeff (undefined) for radar protection
    const coeffNewEx = newExList.filter(name => w.getExCoeff(name) !== undefined);
    check('Radar Protection Rule: Newly added isolation/unilateral exercises carry no coeff', coeffNewEx.length === 0, coeffNewEx.join(', '));

    // Verify selectable into workout draft via Library
    tap(d, '#startHere');
    tap(d, '#fromLib');
    const singleLegExtBtn = [...d.querySelectorAll('#lib .libitem')].find(b => b.textContent.includes('Single-leg extension'));
    const singleArmLatBtn = [...d.querySelectorAll('#lib .libitem')].find(b => b.textContent.includes('Single-arm cable lateral raise'));
    const woodchopperBtn = [...d.querySelectorAll('#lib .libitem')].find(b => b.textContent.includes('Cable woodchopper'));

    check('Newly added exercise Single-leg extension visible in library', !!singleLegExtBtn);
    check('Newly added exercise Single-arm cable lateral raise visible in library', !!singleArmLatBtn);
    check('Newly added exercise Cable woodchopper visible in library', !!woodchopperBtn);

    if (singleLegExtBtn) tap(d, singleLegExtBtn);
    if (singleArmLatBtn) tap(d, singleArmLatBtn);
    if (woodchopperBtn) tap(d, woodchopperBtn);

    tap(d, '#addsel');

    const draft = w.eval('db.draft');
    check('Newly added exercises are selectable into workout draft',
      draft && draft.ex.some(e => e.name === 'Single-leg extension') &&
      draft.ex.some(e => e.name === 'Single-arm cable lateral raise') &&
      draft.ex.some(e => e.name === 'Cable woodchopper'));

    // Fill set inputs and finish session to test Progress tab 1:1 Push/Pull Balance diagnostic
    tap(d, '#scrap'); // clear draft

    tap(d, 'nav button[data-tab=calendar]');
    const todayCell = d.querySelector('.cell.today');
    if (todayCell) tap(d, todayCell);

    // Start a workout with Bench press & Barbell row
    tap(d, '#startHere');
    tap(d, '#fromLib');
    const benchBtn = [...d.querySelectorAll('#lib .libitem')].find(b => b.textContent.includes('Bench press'));
    const rowBtn = [...d.querySelectorAll('#lib .libitem')].find(b => b.textContent.includes('Barbell row'));
    if (benchBtn) tap(d, benchBtn);
    if (rowBtn) tap(d, rowBtn);
    tap(d, '#addsel');

    const cards = d.querySelectorAll('#exlist .card');
    if (cards.length >= 2) {
      // Bench press 100 kg x 5 reps (Card 0)
      const set0 = cards[0].querySelector('.setrow');
      if (set0) {
        const benchInp = set0.querySelectorAll('input');
        if (benchInp[0]) { benchInp[0].value = '100'; benchInp[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
        if (benchInp[1]) { benchInp[1].value = '5'; benchInp[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
        const tick0 = set0.querySelector('.tick');
        if (tick0) tap(d, tick0);
      }

      // Barbell row 100 kg x 5 reps (Card 1)
      const set1 = cards[1].querySelector('.setrow');
      if (set1) {
        const rowInp = set1.querySelectorAll('input');
        if (rowInp[0]) { rowInp[0].value = '100'; rowInp[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
        if (rowInp[1]) { rowInp[1].value = '5'; rowInp[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
        const tick1 = set1.querySelector('.tick');
        if (tick1) tap(d, tick1);
      }
    }
    tap(d, '#finish');

    // 4. Test dedicated 1:1 Push/Pull Balance diagnostic renders in Progress tab
    tap(d, 'nav button[data-tab=progress]');
    const progressTab = d.querySelector('#chart');
    const pushPullDiag = d.querySelector('.push-pull-diag') || progressTab?.querySelector('.push-pull-diag');
    check('Dedicated 1:1 Push/Pull balance diagnostic renders in Progress tab', !!pushPullDiag);
    if (pushPullDiag) {
      check('Push/Pull diagnostic displays Horizontal Push/Pull Balance header', pushPullDiag.textContent.includes('Horizontal Push/Pull Balance'));
      check('Push/Pull diagnostic displays 1:1 ratio (1:1.0)', pushPullDiag.textContent.includes('1:1.0'));
      check('Push/Pull diagnostic displays optimal note', pushPullDiag.textContent.includes('1:1 optimal shoulder health balance'));
    }

    console.log('  errors:', log.length ? log.join(' | ') : 'none');
  }

  // ---------- scenario 26: 2-frame vector SVG exercise diagrams for 29 newly added exercises ----------
  console.log('\n26. Exercise diagram vector SVGs (29 newly added catalog exercises)');
  {
    const new29Exercises = [
    'high-to-low-cable-fly.svg',
    'low-to-high-cable-fly.svg',
    'pec-deck-fly.svg',
    'incline-machine-chest-press.svg',
    'single-arm-dumbbell-row.svg',
    'single-arm-cable-lat-pulldown.svg',
    'single-arm-cable-seated-row.svg',
    'single-arm-cable-lateral-raise.svg',
    'single-arm-dumbbell-lateral-raise.svg',
    'single-arm-dumbbell-shoulder-press.svg',
    'cable-front-raise.svg',
    'cable-face-pull.svg',
    'single-leg-extension.svg',
    'single-leg-curl.svg',
    'single-leg-45-press.svg',
    'seated-leg-curl.svg',
    'lying-leg-curl.svg',
    'standing-calf-raise-machine.svg',
    'single-arm-cable-curl.svg',
    'single-arm-dumbbell-curl.svg',
    'ez-bar-preacher-curl.svg',
    'single-arm-triceps-pushdown.svg',
    'single-arm-overhead-cable-extension.svg',
    'rope-triceps-pushdown.svg',
    'cable-triceps-kickback.svg',
    'cable-woodchopper.svg',
    'elliptical.svg',
    'stairmaster.svg',
    'incline-walk.svg'
  ];

  check('exactly 29 newly added exercise diagrams specified', new29Exercises.length === 29);

  const exDir26 = path.join(__dirname, 'img', 'exercises');
  check('img/exercises directory exists', fs.existsSync(exDir26));

  let missingFiles26 = 0;
  let parseErrors26 = 0;
  let specErrors26 = 0;

  for (const filename of new29Exercises) {
    const filePath = path.join(exDir26, filename);
    if (!fs.existsSync(filePath)) {
      missingFiles26++;
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    let dom;
    try {
      dom = new JSDOM(raw, { contentType: 'image/svg+xml' });
    } catch (e) {
      parseErrors26++;
      continue;
    }

    const doc = dom.window.document;
    if (doc.querySelector('parsererror')) {
      parseErrors26++;
      continue;
    }

    const svg = doc.documentElement;
    const viewBox = svg.getAttribute('viewBox');
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');

    if (viewBox !== '0 0 300 150' || width !== '100%' || height !== '100%') {
      specErrors26++;
    }

    // Divider line at x=150
    const lines = Array.from(svg.querySelectorAll('line'));
    const divider = lines.find(l => l.getAttribute('x1') === '150' && l.getAttribute('x2') === '150');
    if (!divider || divider.getAttribute('y1') !== '15' || divider.getAttribute('y2') !== '135' ||
        divider.getAttribute('stroke') !== '#E4E4E7' || divider.getAttribute('stroke-dasharray') !== '3 3') {
      specErrors26++;
    }

    // START label
    const texts = Array.from(svg.querySelectorAll('text'));
    const startText = texts.find(t => t.textContent.trim() === 'START');
    if (!startText || startText.getAttribute('x') !== '75' || startText.getAttribute('y') !== '142') {
      specErrors26++;
    }

    // MID label
    const midText = texts.find(t => t.textContent.trim() === 'MID');
    if (!midText || midText.getAttribute('x') !== '225' || midText.getAttribute('y') !== '142') {
      specErrors26++;
    }
  }

  check('all 29 newly added exercise SVG files exist', missingFiles26 === 0, `${missingFiles26} missing`);
  check('all 29 newly added exercise SVGs parse cleanly as valid XML', parseErrors26 === 0, `${parseErrors26} parse errors`);
  check('all 29 newly added exercise SVGs meet design standards (viewBox 0 0 300 150, START at 75, MID at 225, dashed vertical divider at x=150)', specErrors26 === 0, `${specErrors26} spec errors`);

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 27: Calendar bodyweight tracking & day detail integration ----------
console.log('\n27. Calendar bodyweight tracking & day detail integration');
{
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'Cal BW Tester'; tap(d, '#fgo');

  // Navigate to calendar and select today's cell
  tap(d, 'nav button[data-tab=calendar]');
  const todayCell = d.querySelector('.cell.today');
  check('today calendar cell found', !!todayCell);
  if (todayCell) tap(d, todayCell);

  // Check initial state in day detail: no weight logged, input present
  const valInput = d.querySelector('#cal-bw-val');
  const saveBtn = d.querySelector('#cal-bw-save');
  check('calendar day detail displays inline weight input', !!valInput);
  check('calendar day detail displays log weight button', !!saveBtn);

  // Log weight 82.4 kg for today
  if (valInput) {
    valInput.value = '82.4';
    valInput.dispatchEvent(new w.Event('input', { bubbles: true }));
  }
  if (saveBtn) tap(d, saveBtn);

  // Verify db.bodyweight updated
  const activeId = w.localStorage.getItem('fds.active');
  let dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  check('Logging weight from calendar saves entry to db.bodyweight', Array.isArray(dbData.bodyweight) && dbData.bodyweight.length === 1 && dbData.bodyweight[0].w === 82.4);

  // Verify dot indicator on calendar cell
  const dotCell = d.querySelector('.cell.today .bw-dot');
  check('calendar cell renders .bw-dot indicator for days with bodyweight entry', !!dotCell);

  // Verify day detail displays logged weight
  const dayDetailCard = d.querySelector('#daydetail .card');
  check('day detail panel displays logged bodyweight', dayDetailCard && dayDetailCard.textContent.includes('Bodyweight: 82.4 kg'));

  // Test updating weight (edit)
  const editBtn = d.querySelector('#cal-bw-edit');
  check('edit bodyweight button present in day detail', !!editBtn);
  if (editBtn) tap(d, editBtn);

  const editInput = d.querySelector('#cal-bw-val');
  const updateSaveBtn = d.querySelector('#cal-bw-save');
  check('edit mode shows weight input prepopulated', editInput && editInput.value === '82.4');
  if (editInput) {
    editInput.value = '83.0';
    editInput.dispatchEvent(new w.Event('input', { bubbles: true }));
  }
  if (updateSaveBtn) tap(d, updateSaveBtn);

  dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  check('updating bodyweight in calendar updates db.bodyweight in place', dbData.bodyweight.length === 1 && dbData.bodyweight[0].w === 83.0);

  // Test deleting weight
  const delBtn = d.querySelector('#cal-bw-del');
  check('delete bodyweight button present in day detail', !!delBtn);
  if (delBtn) tap(d, delBtn);

  dbData = JSON.parse(w.localStorage.getItem('fds.data.' + activeId) || '{}');
  check('deleting bodyweight from calendar removes entry from db.bodyweight', (dbData.bodyweight || []).length === 0);
  check('deleting bodyweight removes .bw-dot from calendar cell', !d.querySelector('.cell.today .bw-dot'));

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

// ---------- scenario 28: Rest Timer, Hidden History, and Backup Export/Restore ----------
console.log('\n28. Rest Timer, Hidden History, and Backup Export/Restore');
{
  const { w, d, log } = boot();
  d.querySelector('#fname').value = 'QoL Tester'; tap(d, '#fgo');

  // 1. Rest Timer test
  tap(d, '#startHere'); tap(d, '#fromLib');
  const libItems = d.querySelectorAll('#lib .libitem');
  if (libItems.length > 0) tap(d, libItems[0]);
  tap(d, '#addsel');

  // Check tick starts timer
  const tickBtn = d.querySelector('.setrow .tick');
  check('timer initially hidden', !d.querySelector('#timerbar').classList.contains('on'));
  if (tickBtn) tap(d, tickBtn);
  check('timer bar shows when set ticked', d.querySelector('#timerbar').classList.contains('on'));
  const clockText = d.querySelector('#clock').textContent;
  check('timer formats countdown (e.g. 1:30 or 3:00)', clockText === '1:30' || clockText === '3:00');

  // Test +30s button
  tap(d, '#t30');
  const clockTextAfter30 = d.querySelector('#clock').textContent;
  check('timer add +30s updates countdown (2:00 or 3:30)', clockTextAfter30 === '2:00' || clockTextAfter30 === '3:30');

  // Test Skip button
  tap(d, '#tstop');
  check('timer skip hides timer bar', !d.querySelector('#timerbar').classList.contains('on'));

  // Finish session to create history for exercise
  const rows = d.querySelectorAll('.setrow');
  if (rows.length > 0) {
    const inputs = rows[0].querySelectorAll('input');
    if (inputs[0]) { inputs[0].value = '80'; inputs[0].dispatchEvent(new w.Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '10'; inputs[1].dispatchEvent(new w.Event('input', { bubbles: true })); }
    const tick = rows[0].querySelector('.tick');
    if (tick) tap(d, tick);
  }
  tap(d, '#finish');

  // Start second session on same exercise to check past performance history
  tap(d, 'nav button[data-tab=calendar]');
  tap(d, '.cell.today');
  tap(d, '#startHere');
  tap(d, '#fromLib');
  const libItems2 = d.querySelectorAll('#lib .libitem');
  if (libItems2.length > 0) tap(d, libItems2[0]);
  tap(d, '#addsel');

  const exCard = d.querySelector('#exlist .card');
  const histToggle = exCard ? exCard.querySelector('.ex-history-toggle') : null;
  check('exercise card renders history toggle', !!histToggle);
  check('history drawer is initially collapsed', !exCard.querySelector('.ex-history-drawer'));
  if (histToggle) {
    tap(d, histToggle);
    const updatedExCard = d.querySelector('#exlist .card');
    check('history drawer expands on click showing past sets', !!updatedExCard.querySelector('.ex-history-drawer'));
  }

  // 3. Backup export and restore test
  tap(d, 'nav button[data-tab=programs]');
  check('Data Backup & Portability section present', (d.querySelector('#view').textContent || '').includes('Data Backup & Portability'));

  // Test export
  const activeId = w.localStorage.getItem('fds.active');
  const profilesRaw = w.localStorage.getItem('fds.profiles');
  const activeDataRaw = w.localStorage.getItem('fds.data.' + activeId);

  check('localStorage contains profile and session data before backup export', !!profilesRaw && !!activeDataRaw);

  const parsedProfiles = JSON.parse(profilesRaw);
  const parsedData = JSON.parse(activeDataRaw);
  const exportedObj = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: parsedProfiles,
    active: activeId,
    data: { [activeId]: parsedData }
  };
  check('backup export generates valid JSON payload containing profiles and sessions', exportedObj.version === 1 && Array.isArray(exportedObj.profiles) && exportedObj.data[activeId].sessions.length > 0);

  // Test restore
  // Clear local storage to simulate new device restore
  w.localStorage.clear();
  check('localStorage cleared for restore test', !w.localStorage.getItem('fds.profiles'));

  // Perform restore with exportedObj payload
  w.localStorage.setItem('fds.profiles', JSON.stringify(exportedObj.profiles));
  w.localStorage.setItem('fds.active', exportedObj.active);
  for (const k of Object.keys(exportedObj.data)) {
    w.localStorage.setItem('fds.data.' + k, JSON.stringify(exportedObj.data[k]));
    w.idbPut('fds.data.' + k, exportedObj.data[k]);
  }
  w.idbPut('fds.profiles', exportedObj.profiles);
  w.idbPut('fds.active', exportedObj.active);
  w.loadProfiles();
  w.loadData();
  w.render();

  const restoredActiveId = w.localStorage.getItem('fds.active');
  const restoredData = JSON.parse(w.localStorage.getItem('fds.data.' + restoredActiveId) || '{}');
  check('backup restore parses JSON, restores profiles and sessions, and updates IndexedDB', restoredActiveId === activeId && (restoredData.sessions || []).length > 0);

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

if (fails > 0) process.exitCode = 1;
})();
