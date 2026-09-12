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

function boot(seed) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://x.test/' });
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
  check('library rendered', !!d.querySelector('#lib .libitem'), log.join(' | '));
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
  d.querySelector('#cxname').value = 'Cable face pull';
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
  check('custom exercise stored in db.customEx', Array.isArray(dbData.customEx) && dbData.customEx.some(e => e.n === 'Cable face pull'));
  const stored = (dbData.customEx || []).find(e => e.n === 'Cable face pull');
  if (stored) {
    check('stored exercise has correct group', stored.g === 'Shoulders');
    check('stored exercise is timed (t:1)', stored.t === 1);
    check('stored exercise has 4 sets', stored.s === 4);
    check('stored exercise has 30 reps/secs', stored.r === 30);
  }

  // The library should now show it in the list (search was set to the name by save logic)
  check('custom exercise visible in library list', !!d.querySelector('#lib .libitem-row'));
  const libItems = [...d.querySelectorAll('#lib .libitem')];
  check('custom exercise appears in lib items', libItems.some(b => b.textContent.includes('Cable face pull')));

  // Check allExercises includes it (via exMeta)
  check('exMeta finds custom exercise', !!w.exMeta('Cable face pull'));
  check('isTimed returns true for timed custom exercise', w.isTimed('Cable face pull'));

  // Clear search and filter to Shoulders to find it
  const qInput = d.querySelector('#q');
  qInput.value = '';
  qInput.dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
  // Filter by Shoulders
  const chips = [...d.querySelectorAll('.chips button')];
  const shouldersChip = chips.find(b => b.textContent === 'Shoulders');
  if (shouldersChip) tap(d, shouldersChip);

  const filteredItems = [...d.querySelectorAll('#lib .libitem')];
  check('custom exercise visible when filtered by Shoulders', filteredItems.some(b => b.textContent.includes('Cable face pull')));

  // Select it into the workout
  const customLibBtn = [...d.querySelectorAll('#lib .libitem')].find(b => b.textContent.includes('Cable face pull'));
  if (customLibBtn) tap(d, customLibBtn);
  check('custom exercise selected (Add button enabled)', !d.querySelector('#addsel').disabled);

  // Confirm add
  tap(d, '#addsel');
  check('draft active workout opened with custom exercise', !!d.querySelector('#finish'));

  // Check the custom exercise is in the draft
  const exList = d.querySelector('#exlist');
  check('custom exercise name appears in draft exlist', !!exList && exList.textContent.includes('Cable face pull'));

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
    check('custom exercise logged in session', last.ex.some(e => e.name === 'Cable face pull'));
  }

  // Verify the custom exercise badge is shown in the library
  tap(d, '#startHere'); tap(d, '#fromLib');
  const allLibItems = [...d.querySelectorAll('#lib .libitem')];
  const customBadgeItem = allLibItems.find(b => b.textContent.includes('Cable face pull'));
  check('custom exercise shows "custom" badge in library', !!customBadgeItem && customBadgeItem.innerHTML.includes('custom'));

  // Duplicate name rejected
  tap(d, '#newex');
  d.querySelector('#cxname').value = 'Cable face pull';
  d.querySelector('#cxname').dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
  log.length = 0;
  tap(d, '#cxsave');
  check('duplicate exercise name is rejected with alert', log.some(m => m.startsWith('ALERT:')));

  // Cancel returns to library
  tap(d, '#cxcancel');
  check('cancel returns to library view', !!d.querySelector('#newex'));

  console.log('  errors:', log.length ? log.join(' | ') : 'none');
}

console.log('\n' + (fails ? fails + ' FAILING CHECK(S)' : 'ALL CHECKS PASSED'));
if (fails > 0) process.exitCode = 1;
