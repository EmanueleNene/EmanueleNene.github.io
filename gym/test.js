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

console.log('\n' + (fails ? fails + ' FAILING CHECK(S)' : 'ALL CHECKS PASSED'));
if (fails > 0) process.exitCode = 1;
