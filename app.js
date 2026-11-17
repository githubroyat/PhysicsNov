/* Oscillations & Waves Trainer: shell, content-page helpers, question component, practice, flashcards, mock test.
   Uses window.PHYS (questions.js) and window.Sims (sims.js) if present. Storage key: owt-v1. */
(function () {
'use strict';

const HAS_DOM = typeof document !== 'undefined';
const KEY = 'owt-v1';
const DAY = 864e5;
const BOX_DAYS = [0, 1, 2, 3, 5];
const FALLBACK_TOPICS = [
  { id: 'hooke', name: "Hooke's law & spring constant" },
  { id: 'describe', name: 'Describing oscillations' },
  { id: 'damping', name: 'Damping' },
  { id: 'pendulum', name: 'Pendulums' },
  { id: 'resonance', name: 'Resonance' },
  { id: 'waves', name: 'Waves' }
];
const getP = () => (typeof window !== 'undefined' && window.PHYS) || {};
const topicsList = () => (getP().topics && getP().topics.length ? getP().topics : FALLBACK_TOPICS);
const topicName = id => { const t = topicsList().find(x => x.id === id); return t ? t.name : id; };
const topicIds = () => topicsList().map(t => t.id);

/* ================= pure helpers (also exported for node tests) ================= */
function parseNum(input) {
  if (input == null) return NaN;
  let s = String(input).trim().replace(/[−–]/g, '-').replace(/ /g, ' ').replace(/^[≈=~\s]+/, '');
  if (s.includes(',') && s.includes('.')) {
    if (s.indexOf(',') < s.indexOf('.')) s = s.replace(/,/g, '');
    else s = s.replace(/\./g, '').replace(',', '.');
  }
  const NUM = '(?:\\d+(?:[ \\u202f]\\d{3})*(?:[.,]\\d+)?|[.,]\\d+)';
  const re = new RegExp('^([+-]?)\\s*(' + NUM + ')(?:\\s*/\\s*(' + NUM + '))?(?:\\s*[eE]\\s*([+-]?\\d+))?');
  const m = s.match(re);
  if (!m) return NaN;
  const rest = s.slice(m[0].length).trim();
  if (/^[\d.,]/.test(rest)) return NaN;
  const conv = t => parseFloat(t.replace(/[  ]/g, '').replace(',', '.'));
  let v = conv(m[2]);
  if (m[3] != null) { const d = conv(m[3]); if (!d) return NaN; v = v / d; }
  if (m[4] != null) v = v * Math.pow(10, parseInt(m[4], 10));
  if (m[1] === '-') v = -v;
  return isFinite(v) ? v : NaN;
}
// How precisely did she type the number? → {dp: decimals, sig: significant figures}; null for fractions / e-notation.
function typedPrecision(str) {
  const s = String(str == null ? '' : str).trim().replace(/^[≈=~]\s*/, '').replace(/^[+\-−–]\s*/, '');
  const m = s.match(/^(\d+(?:[  ]\d{3})*)(?:[.,](\d+))?(?![\d.,]*\s*[\/eE])/);
  if (!m) return null;
  const digits = (m[1].replace(/[  ]/g, '') + (m[2] || '')).replace(/^0+/, '');
  return { dp: m[2] ? m[2].length : 0, sig: digits.length };
}
function gradeNum(str, ans, tol, unit, dp) {
  tol = tol == null ? 0.02 : tol;
  const x = parseNum(str);
  if (!isFinite(x)) return { ok: false, x: NaN, hints: ['Type a number, for example 0,25 or 0.25.'] };
  const close = (a, b) => (b === 0 ? Math.abs(a) <= tol : Math.abs(a - b) <= tol * Math.abs(b));
  if (close(x, ans)) return { ok: true, x, hints: [] };
  // Also accept a correctly rounded answer: either to the decimals the question asks for (dp),
  // or to the precision she typed, as long as she gave at least 2 significant figures.
  const p = typedPrecision(str), eps = 1e-9 * Math.max(1, Math.abs(ans));
  if (dp != null && Math.abs(x - ans) <= 0.5 * Math.pow(10, -dp) + eps) return { ok: true, x, hints: [] };
  if (p && p.sig >= 2 && Math.abs(x - ans) <= 0.5 * Math.pow(10, -p.dp) + eps) return { ok: true, x, hints: [] };
  // At most one hint, most likely cause first, so a coincidence never stacks a second, misleading hint.
  const u = String(unit || '').trim();
  const timeOrFreq = /^(s|Hz)$/.test(u);
  let hint = null;
  if (ans !== 0 && close(-x, ans)) hint = 'Check the sign.';
  else if (timeOrFreq && ans !== 0 && close(x, 1 / ans)) hint = 'Did you mix up T and f? Remember f = 1/T.';
  else if (close(x, ans * 2 * Math.PI) || close(x, ans / (2 * Math.PI))) hint = 'Check the 2π.';
  else if ([10, 100, 1000].some(f => close(x, ans * f) || close(x, ans / f))) hint = 'Check your units. Did you convert cm to m (or g to kg)?';
  return { ok: false, x, hints: hint ? [hint] : [] };
}
function startOfDay(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
function leitner(card, knew, now) {
  const box = knew ? Math.min(5, (card && card.box ? card.box : 1) + 1) : 1;
  const due = BOX_DAYS[box - 1] === 0 ? now : startOfDay(now) + BOX_DAYS[box - 1] * DAY;
  return { box, due };
}
function mulberry(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let rnd = mulberry((Date.now() ^ ((typeof Math.random === 'function' ? Math.random() : 0.5) * 4294967296)) >>> 0);
function shuffle(a, r) { r = r || rnd; const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function fmtNum(x) { if (!isFinite(x)) return String(x); let n = Number(Number(x).toPrecision(4)); return String(n); }
function fmtScore(x) { return Number.isInteger(x) ? String(x) : x.toFixed(1); }
function stripHtml(html) { if (!HAS_DOM) return String(html).replace(/<[^>]*>/g, ''); const d = document.createElement('div'); d.innerHTML = html; return d.textContent; }

/* ================= storage ================= */
function defaultState() { return { attempts: {}, topicLog: [], cards: {}, mocks: [], testDate: '', big: false }; }
let S = defaultState();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') S = Object.assign(defaultState(), o); }
  } catch (e) { /* no storage */ }
  if (!S.attempts || typeof S.attempts !== 'object') S.attempts = {};
  if (!Array.isArray(S.topicLog)) S.topicLog = [];
  if (!S.cards || typeof S.cards !== 'object') S.cards = {};
  if (!Array.isArray(S.mocks)) S.mocks = [];
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
function recordAttempt(item, score) {
  const a = S.attempts[item.id] || { n: 0, correct: 0, last: 0, t: 0 };
  a.n++; if (score === 1) a.correct++; a.last = score; a.t = Date.now();
  S.attempts[item.id] = a;
  S.topicLog.push({ topic: item.topic, score, t: a.t });
  if (S.topicLog.length > 600) S.topicLog.splice(0, S.topicLog.length - 600);
  save();
}
function mastery(topic) {
  const e = S.topicLog.filter(x => x.topic === topic);
  if (e.length < 3) return null;
  const l = e.slice(-10);
  return l.reduce((s, x) => s + x.score, 0) / l.length;
}

/* ================= items from bank / generators ================= */
function itemFromQuestion(q) {
  return { src: 'q', id: q.id, topic: q.topic, level: q.level || 1, type: q.type, prompt: q.prompt, choices: q.choices, answer: q.answer,
    unit: q.unit || '', tol: q.tol == null ? 0.02 : q.tol, dp: q.dp, explain: q.explain || '', model: q.model || '', points: q.points || [], notes: !!q.notes, trap: !!q.trap, extra: !!q.extra };
}
function itemFromGen(g) {
  const r = g.make(rnd);
  return { src: 'g', id: g.id, gen: g, topic: g.topic, level: g.level || 2, type: 'num', prompt: r.prompt, answer: r.answer, unit: r.unit || '',
    tol: r.tol == null ? 0.02 : r.tol, dp: r.dp, steps: r.steps || [], title: g.title || '', explain: '', extra: !!g.extra };
}
function freshItem(it) { return it.gen ? itemFromGen(it.gen) : it; }

/* ================= DOM helpers ================= */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
function h(tag, attrs) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (let i = 2; i < arguments.length; i++) {
    const kids = [].concat(arguments[i]);
    kids.forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(String(c))); });
  }
  return e;
}
let uidN = 0; const uid = p => p + (++uidN);
const LV = { 1: 'Level 1 · remember', 2: 'Level 2 · apply', 3: 'Level 3 · explain' };

/* ================= question component ================= */
function answerHTML(it) {
  if (it.type === 'mc') return it.choices[it.answer];
  if (it.type === 'multi') return '<ul>' + it.answer.map(i => '<li>' + it.choices[i] + '</li>').join('') + '</ul>';
  if (it.type === 'tf') return it.answer ? 'True' : 'False';
  if (it.type === 'num') return fmtNum(it.answer) + (it.unit ? ' ' + it.unit : '');
  return it.model || '';
}
function userAnswerNode(it, resp) {
  if (resp == null) return h('em', { text: '(no answer)' });
  if (it.type === 'mc') return h('span', { html: it.choices[resp] });
  if (it.type === 'multi') return h('ul', null, resp.map(i => h('li', { html: it.choices[i] })));
  if (it.type === 'tf') return h('span', { text: resp ? 'True' : 'False' });
  return h('span', { text: String(resp) + (it.type === 'num' && it.unit ? ' ' + stripHtml(it.unit) : '') });
}
function gradeItem(it, resp) {
  if (resp == null) return { score: 0, hints: [] };
  if (it.type === 'mc') return { score: resp === it.answer ? 1 : 0, hints: [] };
  if (it.type === 'tf') return { score: resp === it.answer ? 1 : 0, hints: [] };
  if (it.type === 'multi') {
    const a = new Set(it.answer), r = new Set(resp);
    return { score: a.size === r.size && [...a].every(x => r.has(x)) ? 1 : 0, hints: [] };
  }
  if (it.type === 'num') { const g = gradeNum(resp, it.answer, it.tol, it.unit, it.dp); return { score: g.ok ? 1 : 0, hints: g.hints }; }
  return { score: null, hints: [] };
}
function explanationNode(it) {
  const box = h('div');
  if (it.steps && it.steps.length) {
    box.append(h('div', { class: 'lab', text: 'Worked solution' }), h('ol', { class: 'steps' }, it.steps.map(s => h('li', { html: s }))));
  } else if (it.explain) {
    box.append(h('div', { class: 'lab', text: 'Why' }), h('div', { html: it.explain }));
  }
  return box;
}
function selfMarkBlock(it, onMark) {
  const wrap = h('div', { class: 'fb neutral' });
  wrap.append(h('div', { class: 'lab', text: 'Model answer' }), h('div', { html: it.model }));
  const ticks = [];
  if (it.points && it.points.length) {
    wrap.append(h('div', { class: 'lab', text: 'Key points: tick the ones you had' }));
    const ul = h('ul', { class: 'kp' });
    it.points.forEach(p => { const id = uid('kp'); const cb = h('input', { type: 'checkbox', id }); ticks.push(cb); ul.append(h('li', null, h('label', { for: id }, cb, h('span', { html: p })))); });
    wrap.append(ul);
  }
  if (it.explain) wrap.append(h('div', { html: it.explain }));
  const bar = h('div', { class: 'selfmark' }, h('span', { class: 'lab', text: 'Mark yourself' }));
  const res = h('span', { class: 'tag info', 'aria-live': 'polite' });
  [['Got it', 1], ['Partly', 0.5], ['Not yet', 0]].forEach(([lab, sc]) => {
    bar.append(h('button', { type: 'button', class: 'btn sm', text: lab, onclick: ev => {
      $$('button', bar).forEach(b => { b.setAttribute('aria-pressed', String(b === ev.currentTarget)); });
      res.textContent = 'Marked: ' + lab; onMark(sc);
    } }));
  });
  bar.append(res);
  wrap.append(bar);
  return { el: wrap, ticks };
}

/* buildQ: opt = {mode:'now'|'defer', onGraded(score, resp), onChange()} */
function buildQ(item, opt) {
  opt = opt || {};
  const defer = opt.mode === 'defer';
  const root = h('div', { class: 'q' });
  const meta = h('div', { class: 'q-meta' }, h('span', { class: 'tag info', text: topicName(item.topic) }), h('span', { class: 'tag info', text: LV[item.level] || '' }));
  if (item.src === 'g') meta.append(h('span', { class: 'tag warn', text: 'Calculation' }));
  if (item.notes) meta.append(h('span', { class: 'tag ok', text: 'From your notes' }));
  if (item.extra) meta.append(h('span', { class: 'tag info', text: 'Extra · not in your notes' }));
  if (item.trap) meta.append(h('span', { class: 'tag stop', text: /^\s*(<[^>]+>\s*)*Spot the mistake/i.test(item.prompt || '') ? 'Spot the mistake' : 'Common trap' }));
  root.append(meta, h('div', { class: 'q-prompt', html: item.prompt }));
  const ctl = { el: root, item, locked: false, done: false };
  const order = item.type === 'mc' || item.type === 'multi' ? shuffle(item.choices.map((_, i) => i)) : null;
  let sel = item.type === 'multi' ? new Set() : null;
  let input = null;
  const optBtns = [];
  const ui = h('div');
  const fb = h('div', { 'aria-live': 'polite' });
  const actions = h('div', { class: 'q-actions' });
  const changed = () => { if (opt.onChange) opt.onChange(ctl); };

  function paintSel() { optBtns.forEach(b => { const i = b._i; const on = item.type === 'multi' ? sel.has(i) : sel === i; b.setAttribute('aria-checked', String(on)); }); }
  if (item.type === 'mc' || item.type === 'multi') {
    const multi = item.type === 'multi';
    const grp = h('div', { class: 'qopts', role: multi ? 'group' : 'radiogroup', 'aria-label': multi ? 'Choose all correct answers' : 'Choose one answer' });
    order.forEach(i => {
      const b = h('button', { type: 'button', class: 'qopt' + (multi ? ' sq' : ''), role: multi ? 'checkbox' : 'radio', 'aria-checked': 'false' }, h('span', { class: 'mk' }), h('span', { html: item.choices[i] }));
      b._i = i;
      b.addEventListener('click', () => {
        if (ctl.locked) return;
        if (multi) { if (sel.has(i)) sel.delete(i); else sel.add(i); } else sel = i;
        paintSel(); changed();
      });
      optBtns.push(b); grp.append(b);
    });
    ui.append(grp);
    if (multi) ui.append(h('p', { class: 'small muted', text: 'More than one answer can be right.' }));
  } else if (item.type === 'tf') {
    const grp = h('div', { class: 'qopts tfo', role: 'radiogroup', 'aria-label': 'True or false' });
    [[true, 'True'], [false, 'False']].forEach(([v, lab]) => {
      const b = h('button', { type: 'button', class: 'qopt', role: 'radio', 'aria-checked': 'false' }, h('span', { class: 'mk' }), h('span', { text: lab }));
      b._v = v;
      b.addEventListener('click', () => { if (ctl.locked) return; sel = v; optBtns.forEach(x => x.setAttribute('aria-checked', String(x._v === sel))); changed(); });
      optBtns.push(b); grp.append(b);
    });
    ui.append(grp);
  } else if (item.type === 'num') {
    const id = uid('num');
    input = h('input', { type: 'text', id, inputmode: 'decimal', autocomplete: 'off', placeholder: 'e.g. 0,25 or 0.25', 'aria-label': 'Your numeric answer' });
    input.addEventListener('input', changed);
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !defer && !ctl.locked) { e.preventDefault(); check(); } });
    ui.append(h('div', { class: 'qnum' }, input, item.unit ? h('span', { class: 'unit', html: item.unit }) : null));
  } else {
    const id = uid('open');
    input = h('textarea', { id, 'aria-label': 'Your answer', placeholder: 'Write your answer, then compare' });
    input.addEventListener('input', changed);
    ui.append(input);
  }
  root.append(ui);

  ctl.getResponse = function () {
    if (item.type === 'mc') return sel;
    if (item.type === 'tf') return sel;
    if (item.type === 'multi') return sel.size ? [...sel] : null;
    const v = input.value.trim();
    return v ? v : null;
  };
  ctl.lock = function () {
    ctl.locked = true;
    optBtns.forEach(b => { b.disabled = true; });
    if (input) input.readOnly = true;
  };
  function markOptions() {
    optBtns.forEach(b => {
      if (item.type === 'tf') {
        if (b._v === item.answer) b.classList.add('right'); else if (sel === b._v) b.classList.add('wrong');
      } else {
        const correct = item.type === 'multi' ? item.answer.indexOf(b._i) >= 0 : b._i === item.answer;
        const chosen = item.type === 'multi' ? sel.has(b._i) : sel === b._i;
        if (correct) b.classList.add('right'); else if (chosen) b.classList.add('wrong');
      }
    });
  }
  function showFeedback(score, hints) {
    fb.innerHTML = '';
    const cls = score === 1 ? 'ok' : score === 0.5 ? 'half' : 'bad';
    const box = h('div', { class: 'fb ' + cls });
    box.append(h('div', { class: 'verdict', text: score === 1 ? 'Correct' : score === 0.5 ? 'Partly right' : 'Not quite' }));
    hints.forEach(t => box.append(h('div', { class: 'hintline', text: t })));
    if (item.type !== 'open') box.append(h('div', null, h('span', { class: 'lab', text: 'Answer: ' }), h('span', { html: answerHTML(item) })));
    box.append(explanationNode(item));
    fb.append(box);
  }
  function finish(score, resp, hints) {
    ctl.done = true; ctl.score = score;
    if (item.type !== 'open') markOptions();
    showFeedback(score, hints || []);
    if (opt.onGraded) opt.onGraded(score, resp);
  }
  function check() {
    if (ctl.locked) return;
    const resp = ctl.getResponse();
    if (resp == null) {
      fb.innerHTML = '';
      fb.append(h('div', { class: 'fb neutral' }, h('div', { text: item.type === 'num' ? 'Type a number first.' : 'Choose an answer first.' })));
      return;
    }
    if (item.type === 'num' && !isFinite(parseNum(resp))) {
      fb.innerHTML = ''; fb.append(h('div', { class: 'fb neutral' }, h('div', { text: 'Type a number, for example 0,25 or 0.25. You can add the unit.' })));
      return;
    }
    ctl.lock();
    const g = gradeItem(item, resp);
    actions.hidden = true;
    finish(g.score, resp, g.hints);
  }
  function showModel() {
    if (ctl.locked) return;
    ctl.lock(); actions.hidden = true;
    const sm = selfMarkBlock(item, sc => {
      sm.el.className = 'fb ' + (sc === 1 ? 'ok' : sc === 0.5 ? 'half' : 'bad');
      if (!ctl.done) { ctl.done = true; ctl.score = sc; if (opt.onGraded) opt.onGraded(sc, ctl.getResponse()); }
      else { ctl.score = sc; }
    });
    fb.innerHTML = ''; fb.append(sm.el);
  }
  if (!defer) {
    if (item.type === 'open') actions.append(h('button', { type: 'button', class: 'btn primary', text: 'Show model answer', onclick: showModel }));
    else actions.append(h('button', { type: 'button', class: 'btn primary', text: 'Check', onclick: check }));
    root.append(actions, fb);
  }
  return ctl;
}

/* review card used in the mock test after hand-in */
function reviewCard(item, resp, idx, state, onMark) {
  const card = h('div', { class: 'q rev' });
  const paint = () => { card.className = 'q rev ' + (state.score === 1 ? 'ok' : state.score === 0.5 ? 'half' : state.score === 0 ? 'bad' : ''); };
  card.append(h('div', { class: 'q-meta' }, h('span', { class: 'mq-n', text: 'Question ' + idx }), h('span', { class: 'tag info', text: topicName(item.topic) }), h('span', { class: 'tag info', text: LV[item.level] || '' }), item.src === 'g' ? h('span', { class: 'tag warn', text: 'Calculation' }) : null));
  card.append(h('div', { class: 'q-prompt', html: item.prompt }));
  card.append(h('div', null, h('span', { class: 'lab', text: 'Your answer: ' }), userAnswerNode(item, resp)));
  if (item.type === 'open') {
    const sm = selfMarkBlock(item, sc => { state.score = sc; paint(); onMark(sc); });
    card.append(sm.el);
  } else {
    const g = gradeItem(item, resp);
    const fbx = h('div', { class: 'fb ' + (state.score === 1 ? 'ok' : 'bad') });
    fbx.append(h('div', { class: 'verdict', text: state.score === 1 ? 'Correct' : 'Not quite' }));
    g.hints.forEach(t => fbx.append(h('div', { class: 'hintline', text: t })));
    fbx.append(h('div', null, h('span', { class: 'lab', text: 'Answer: ' }), h('span', { html: answerHTML(item) })));
    fbx.append(explanationNode(item));
    card.append(fbx);
  }
  paint();
  return card;
}

/* ================= pages / routing ================= */
const PAGES = [
  { v: 'home', t: 'Start here', g: 'Start', ic: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { v: 'hooke', t: "Hooke's law & the spring constant", n: 'Hooke’s law', g: 'Learn', ic: 'M3 12h3l2-6 3 12 3-12 2 6h5' },
  { v: 'describe', t: 'Describing oscillations', g: 'Learn', ic: 'M2 12c3-9 6-9 10 0s7 9 10 0' },
  { v: 'damping', t: 'Damping', g: 'Learn', ic: 'M2 12C3 4 5 4 6 12S9 18 10 12 12 8.5 13 12 14.5 14 15.5 12 17 11 22 12' },
  { v: 'pendulum', t: 'Pendulums', g: 'Learn', ic: 'M12 3L8 14M4.8 16.5a3 3 0 1 0 6 0a3 3 0 1 0-6 0' },
  { v: 'resonance', t: 'Resonance', g: 'Learn', ic: 'M2 19c3 0 4-1 5-4s2-11 5-11 4 8 5 11 2 4 5 4' },
  { v: 'waves', t: 'Waves', g: 'Learn', ic: 'M2 9c3-4 5-4 8 0s5 4 8 0M2 16c3-4 5-4 8 0s5 4 8 0' },
  { v: 'practice', t: 'Practice', g: 'Practise', ic: 'M5 13l4 4L19 7' },
  { v: 'cards', t: 'Flashcards', g: 'Practise', ic: 'M3 8h12v12H3zM8 4h12v12' },
  { v: 'mock', t: 'Mock test', g: 'Practise', ic: 'M12 4a8 8 0 1 0 .01 0zM12 8v4l3 2' },
  { v: 'formulas', t: 'Formula sheet', g: 'Reference', ic: 'M18 5H8l5 7-5 7h10' },
  { v: 'mistakes', t: 'Fix your notes', g: 'Reference', ic: 'M12 3l10 18H2zM12 10v5M12 18v.5' }
];
const TOPIC_PAGES = ['hooke', 'describe', 'damping', 'pendulum', 'resonance', 'waves'];
const icon = d => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
let curView = null;

function renderShell() {
  const groups = ['Start', 'Learn', 'Practise', 'Reference'];
  $('#pnav').innerHTML = groups.map((g, i) => '<div><p class="ngrp" id="ng' + i + '">' + g + '</p><ul aria-labelledby="ng' + i + '">' +
    PAGES.filter(p => p.g === g).map(p => '<li><a href="#' + p.v + '" data-v="' + p.v + '">' + icon(p.ic) + '<span>' + p.t.replace(/&/g, '&amp;') + '</span></a></li>').join('') + '</ul></div>').join('');
  $$('[data-pn]').forEach(nv => {
    const i = PAGES.findIndex(x => x.v === nv.closest('.view').dataset.view);
    const pr = PAGES[i - 1], nx = PAGES[i + 1];
    nv.innerHTML = (pr ? '<a class="prev" href="#' + pr.v + '"><small>Previous</small><b>' + pr.t.replace(/&/g, '&amp;') + '</b></a>' : '<span></span>') +
      (nx ? '<a class="next" href="#' + nx.v + '"><small>Next</small><b>' + nx.t.replace(/&/g, '&amp;') + '</b></a>' : '');
  });
  let d = 'M0 22';
  for (let i = 0; i < 12; i++) d += i === 0 ? ' Q50 2 100 22' : ' T' + (100 * (i + 1)) + ' 22';
  d += ' V34 H0Z';
  $$('.phead').forEach(ph => ph.insertAdjacentHTML('beforeend', '<svg class="wavedge" viewBox="0 0 1200 34" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/></svg>'));
}
function setSize(big, persist) {
  document.documentElement.classList.toggle('big', big);
  $$('#txtPick button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.size === '1') === big)));
  if (persist) { S.big = big; save(); }
}
const side = () => $('#side');
function openMenu() {
  side().classList.add('open'); $('#scrim').classList.add('open'); $('#menuBtn').setAttribute('aria-expanded', 'true');
  $('#main').inert = true; $('#topbar').inert = true;
  const cur = $('#pnav a[aria-current="page"]') || $('#pnav a'); setTimeout(() => cur.focus(), 30);
}
function closeMenu(refocus) {
  if (!side().classList.contains('open')) return;
  side().classList.remove('open'); $('#scrim').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  $('#main').inert = false; $('#topbar').inert = false;
  if (refocus) $('#menuBtn').focus();
}
function mountSims(view) {
  $$('.sim', view).forEach(div => {
    if (div.dataset.mounted) return;
    if (!(window.Sims && typeof window.Sims.mount === 'function')) return;
    try {
      div.textContent = ''; div.classList.remove('ph');
      window.Sims.mount(div.dataset.sim, div, { damping: +div.dataset.damping || 0 });
      div.dataset.mounted = '1';
    } catch (e) {
      div.classList.add('ph'); div.textContent = 'This simulation could not start.'; div.dataset.mounted = '1';
    }
  });
}

/* ---------- inline "Check yourself" ---------- */
function renderInline(host) {
  const P = getP();
  if (host.dataset.done) return;
  const t = host.dataset.qtopic;
  if (!P.questions) { host.innerHTML = '<div class="empty">Questions not loaded</div>'; return; }
  host.dataset.done = '1'; host.innerHTML = '';
  let list = P.questions.filter(q => q.topic === t && q.inline);
  if (!list.length) list = P.questions.filter(q => q.topic === t && q.level <= 2).slice(0, 4);
  list = list.slice(0, 5);
  if (!list.length) { host.innerHTML = '<div class="empty">No questions for this topic yet.</div>'; return; }
  let right = 0, answered = 0;
  const foot = h('div', { class: 'q-actions' });
  function mkAll() {
    host.innerHTML = ''; right = 0; answered = 0;
    list.forEach(q => {
      const it = itemFromQuestion(q);
      host.append(buildQ(it, { mode: 'now', onGraded: sc => {
        recordAttempt(it, sc); answered++; right += sc;
        if (answered === list.length) {
          foot.innerHTML = '';
          foot.append(h('span', { class: 'tag ' + (right === list.length ? 'ok' : 'info'), text: fmtScore(right) + ' of ' + list.length + ' right' }),
            h('button', { type: 'button', class: 'btn sm', text: 'Try again', onclick: mkAll }));
          host.append(foot);
        }
      } }).el);
    });
  }
  mkAll();
}

/* ---------- figures (JS-drawn SVG) ---------- */
function pathFrom(pts) { return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '); }
function figSinCos(svg) {
  const x0 = 50, W = 360, cy = 110, A = 70;
  const cos = [], sin = [];
  for (let i = 0; i <= 90; i++) { const s = i / 90; cos.push([x0 + W * s, cy - A * Math.cos(2 * Math.PI * s)]); sin.push([x0 + W * s, cy - A * Math.sin(2 * Math.PI * s)]); }
  let g = '';
  [0, 0.25, 0.5, 0.75, 1].forEach((s, i) => {
    const x = x0 + W * s;
    g += '<path class="ggrid" d="M' + x + ' 36V196"/><text class="gt" x="' + x + '" y="212" text-anchor="middle">' + ['0', 'T/4', 'T/2', '3T/4', 'T'][i] + '</text>';
  });
  g += '<path class="gax" d="M' + x0 + ' 30V196M40 ' + cy + 'H420"/>';
  g += '<text class="gt" x="' + (x0 - 6) + '" y="' + (cy - A + 4) + '" text-anchor="end">r</text><text class="gt" x="' + (x0 - 6) + '" y="' + (cy + 4) + '" text-anchor="end">0</text><text class="gt" x="' + (x0 - 6) + '" y="' + (cy + A + 4) + '" text-anchor="end">−r</text>';
  g += '<path class="gb" d="' + pathFrom(cos) + '"/><path class="go" d="' + pathFrom(sin) + '"/>';
  g += '<circle class="gdot" cx="' + x0 + '" cy="' + (cy - A) + '" r="5"/><circle class="gdoto" cx="' + x0 + '" cy="' + cy + '" r="5"/>';
  g += '<path class="gd" d="M' + x0 + ' 30H' + (x0 + W / 4) + '"/><text class="gtm" x="' + (x0 + W / 8) + '" y="22" text-anchor="middle">T/4</text>';
  g += '<path class="gb" d="M232 16H252"/><text class="gt" x="258" y="20">cos: starts at r</text><path class="go" d="M232 32H252"/><text class="gt" x="258" y="36">sin: starts at 0</text>';
  g += '<text class="gtb" x="426" y="' + (cy - 6) + '" text-anchor="end">t</text>';
  svg.innerHTML = g;
}
function figDamp(svg) {
  const T = [0, 0.42, 0.86, 1.21, 1.64, 2.06, 2.46, 2.88, 3.28, 3.68];
  const Y = [40, -33, 24, -20, 15, -12, 10, -7, 6, -5];
  const L = 56, R = 500, yc = 140, k = 3, sx = (R - L) / 3.8;
  const X = t => L + t * sx, Yp = y => yc - y * k;
  let g = '';
  [0, 1, 2, 3].forEach(t => { g += '<path class="ggrid" d="M' + X(t) + ' 20V262"/><text class="gt" x="' + X(t) + '" y="276" text-anchor="middle">' + t + '</text>'; });
  [-40, -20, 0, 20, 40].forEach(y => { g += '<path class="ggrid" d="M' + L + ' ' + Yp(y) + 'H' + R + '"/><text class="gt" x="' + (L - 8) + '" y="' + (Yp(y) + 4) + '" text-anchor="end">' + (y < 0 ? '−' + (-y) : y) + '</text>'; });
  g += '<path class="gax" d="M' + L + ' 16V262M' + L + ' ' + yc + 'H' + (R + 6) + '"/>';
  g += '<text class="gtb" x="8" y="12">y (cm)</text><text class="gtb" x="' + R + '" y="292" text-anchor="end">t (s)</text>';
  const up = [], dn = [];
  for (let t = 0; t <= 3.7001; t += 0.05) { const a = 40 * Math.pow(0.8, t / 0.41); up.push([X(t), Yp(a)]); dn.push([X(t), Yp(-a)]); }
  g += '<path class="gd" d="' + pathFrom(up) + '"/><path class="gd" d="' + pathFrom(dn) + '"/>';
  const cur = [];
  for (let i = 0; i < T.length - 1; i++) {
    for (let j = 0; j <= 16; j++) { const s = j / 16, e = (1 - Math.cos(Math.PI * s)) / 2; cur.push([X(T[i] + (T[i + 1] - T[i]) * s), Yp(Y[i] + (Y[i + 1] - Y[i]) * e)]); }
  }
  g += '<path class="gb" d="' + pathFrom(cur) + '"/>';
  T.forEach((t, i) => { g += '<circle class="gdot" cx="' + X(t).toFixed(1) + '" cy="' + Yp(Y[i]) + '" r="3.8"/>'; });
  g += '<text class="gt" x="' + X(1.35) + '" y="36">envelope ±40·0.8^(t/0.41)</text><path class="gd" d="M' + X(1.05) + ' 32H' + X(1.3) + '"/>';
  g += '<path class="gm" d="M' + X(0) + ' 286V292M' + X(0.42) + ' 286V292M' + X(0) + ' 289H' + X(0.42) + '"/><text class="gtm" x="' + (X(0.42) + 6) + ' " y="292">half period ≈ 0.41 s</text>';
  g += '<path class="gm" d="M' + X(0) + ' 302V308M' + X(0.86) + ' 302V308M' + X(0) + ' 305H' + X(0.86) + '"/><text class="gtm" x="' + (X(0.86) + 6) + '" y="309">one period T ≈ 0.82 s</text>';
  svg.setAttribute('viewBox', '0 0 520 316');
  svg.innerHTML = g;
}
function figWave(svg) {
  const x0 = 20, Lw = 200, cy = 124, A = 60, pts = [];
  for (let x = x0; x <= 500; x += 4) pts.push([x, cy - A * Math.sin(2 * Math.PI * (x - x0) / Lw)]);
  let g = '<path class="gd" d="M' + x0 + ' ' + cy + 'H552"/>';
  g += '<path class="gb" d="' + pathFrom(pts) + '"/>';
  const c1 = x0 + Lw / 4, c2 = c1 + Lw, tr = x0 + 3 * Lw / 4;
  g += '<circle class="gdotm" cx="' + c1 + '" cy="' + (cy - A) + '" r="4.5"/><circle class="gdotm" cx="' + c2 + '" cy="' + (cy - A) + '" r="4.5"/><circle class="gdotm" cx="' + tr + '" cy="' + (cy + A) + '" r="4.5"/>';
  g += '<path class="gd" d="M' + c1 + ' ' + (cy - A) + 'V36M' + c2 + ' ' + (cy - A) + 'V36"/>';
  g += '<path class="gm" d="M' + c1 + ' 40H' + c2 + 'M' + c1 + ' 34V46M' + c2 + ' 34V46"/><text class="gtm" x="' + ((c1 + c2) / 2) + '" y="30" text-anchor="middle">wavelength λ</text>';
  g += '<text class="gtb" x="' + (c1 + 9) + '" y="' + (cy - A - 8) + '">crest</text><text class="gtb" x="' + tr + '" y="' + (cy + A + 22) + '" text-anchor="middle">trough</text>';
  const ax = x0 + 1.25 * Lw + Lw * 1.05 - 20; // near next crest at 470
  g += '<path class="gm" d="M' + (c2 + Lw - 0) + ' ' + cy + 'V' + (cy - A + 3) + 'M' + (c2 + Lw - 5) + ' ' + (cy - A + 12) + 'L' + (c2 + Lw) + ' ' + (cy - A + 2) + 'L' + (c2 + Lw + 5) + ' ' + (cy - A + 12) + '"/>';
  g += '<text class="gtm" x="' + (c2 + Lw + 10) + '" y="' + (cy - A / 2 + 4) + '">amplitude</text>';
  g += '<text class="gt" x="8" y="' + (cy + 16) + '">rest position</text>';
  g += '<path class="gax" d="M220 224H280M272 219L282 224L272 229"/><text class="gtb" x="290" y="228">wave travels</text>';
  svg.innerHTML = g;
}
function figRefl(svg) {
  function pulse(ox, base, c, sign, cls) {
    const pts = [];
    for (let x = 0; x <= 220; x += 2) pts.push([ox + x, base - sign * 36 * Math.exp(-Math.pow((x - c) / 15, 2))]);
    return '<path class="' + cls + '" d="' + pathFrom(pts) + '"/>';
  }
  function arrow(x1, x2, y) { const d = x2 > x1 ? -1 : 1; return '<path class="gm" d="M' + x1 + ' ' + y + 'H' + x2 + 'M' + (x2 + 8 * d) + ' ' + (y - 5) + 'L' + x2 + ' ' + y + 'L' + (x2 + 8 * d) + ' ' + (y + 5) + '"/>'; }
  let g = '';
  [[10, 'Fixed end', -1, 'comes back upside down (inverted)'], [290, 'Loose end', 1, 'comes back the same way up (upright)']].forEach(([ox, title, sign, cap]) => {
    g += '<text class="gtb" x="' + (ox + 120) + '" y="16" text-anchor="middle">' + title + '</text>';
    [76, 176].forEach((base, row) => {
      g += '<path class="gd" d="M' + ox + ' ' + base + 'H' + (ox + 230) + '"/>';
      if (title === 'Fixed end') g += '<path class="gwall" d="M' + (ox + 230) + ' ' + (base - 30) + 'V' + (base + 30) + '"/>';
      else g += '<path class="gwall" d="M' + (ox + 238) + ' ' + (base - 32) + 'V' + (base + 32) + '"/><circle class="gring gfill" cx="' + (ox + 230) + '" cy="' + base + '" r="6"/><path class="gt" d="M' + (ox + 236) + ' ' + base + 'H' + (ox + 238) + '"/>';
      if (row === 0) { g += pulse(ox, base, 100, 1, 'gb') + arrow(ox + 90, ox + 150, base - 52); g += '<text class="gt" x="' + ox + '" y="' + (base - 52) + '">going in</text>'; }
      else { g += pulse(ox, base, 100, sign, 'go') + arrow(ox + 150, ox + 90, base - 52 + (sign === -1 ? 0 : 0)); g += '<text class="gt" x="' + ox + '" y="' + (base - 52) + '">coming back</text>'; }
    });
    g += '<text class="gtm" x="' + (ox + 120) + '" y="244" text-anchor="middle">' + cap + '</text>';
  });
  svg.innerHTML = g;
}
function buildFigures() {
  const m = { figSinCos, figDamp, figWave, figRefl };
  Object.keys(m).forEach(id => { const el = document.getElementById(id); if (el) m[id](el); });
}

/* ================= HOME ================= */
function renderHome() {
  renderProgress(); renderDue();
}
function renderProgress() {
  const box = $('#progress'); box.innerHTML = '';
  topicsList().forEach(t => {
    const m = mastery(t.id);
    const pct = m == null ? 0 : Math.round(m * 100);
    box.append(h('div', { class: 'barrow' }, h('a', { href: '#' + t.id, text: t.name }),
      h('div', { class: 'track', role: 'img', 'aria-label': m == null ? 'not started' : pct + ' percent' }, h('i', { class: m == null ? '' : pct >= 80 ? 'hi' : pct >= 50 ? 'mid' : 'lo', style: 'width:' + pct + '%' })),
      h('span', { class: 'pc', text: m == null ? 'not started' : pct + ' %' })));
  });
}
function cardsDueCount() {
  const fc = getP().flashcards || []; const now = Date.now();
  return fc.filter(c => { const s = S.cards[c.id]; return !s || s.due <= now; }).length;
}
function renderDue() {
  const n = cardsDueCount(); const fc = getP().flashcards;
  $('#cardsDueTxt').textContent = fc ? (n + ' card' + (n === 1 ? '' : 's') + ' due now. Know it or not, the system schedules the next review.') : 'Flashcards not loaded';
  $('#goCards b').textContent = 'Flashcards (' + (fc ? n : 0) + ' due)';
  $('#sideDue').innerHTML = '<span class="k">Flashcards</span><b>' + (fc ? n + (n === 1 ? ' card' : ' cards') + ' due' : 'Flashcards') + '</b><a href="#cards">Open flashcards</a>';
}

/* ================= PRACTICE ================= */
const pr = { sel: null, level: 'all', mode: 'q', count: '10', phase: 'setup', sess: null };
function allSel() { return topicIds(); }
function prSelected() { return pr.sel ? pr.sel.filter(id => topicIds().indexOf(id) >= 0) : allSel(); }
function qPool() {
  const sel = new Set(prSelected());
  return (getP().questions || []).filter(q => sel.has(q.topic) && (pr.level === 'all' || q.level === +pr.level));
}
function gPool() {
  const sel = new Set(prSelected());
  return (getP().generators || []).filter(g => sel.has(g.topic) && (pr.level === 'all' || (g.level || 2) === +pr.level));
}
function preferOrder(list) {
  const fresh = [], rest = [];
  list.forEach(q => { const a = S.attempts[q.id]; (!a || a.last < 1 ? fresh : rest).push(q); });
  return shuffle(fresh).concat(shuffle(rest));
}
function renderPracticeView() {
  if (pr.phase === 'session' && pr.sess) { $('#prSetup').hidden = true; $('#prSummary').hidden = true; $('#prSession').hidden = false; return; }
  if (pr.phase === 'summary') { $('#prSetup').hidden = true; $('#prSession').hidden = true; $('#prSummary').hidden = false; return; }
  $('#prSession').hidden = true; $('#prSummary').hidden = true; $('#prSetup').hidden = false;
  renderPrSetup();
}
function renderPrSetup() {
  const box = $('#prSetup'); box.innerHTML = '';
  const P = getP();
  if (!P.questions && !P.generators) { box.append(h('div', { class: 'empty', text: 'Questions not loaded' })); return; }
  const sel = new Set(prSelected());
  const fsT = h('fieldset', null, h('legend', { text: 'Topics' }));
  const grid = h('div', { class: 'chkgrid' });
  topicsList().forEach(t => {
    const id = 'prt-' + t.id;
    const cb = h('input', { type: 'checkbox', id, value: t.id, checked: sel.has(t.id) ? true : null });
    cb.addEventListener('change', () => { pr.sel = $$('input[name=prt]', box).filter(x => x.checked).map(x => x.value); cb.name = 'prt'; upd(); });
    cb.name = 'prt';
    grid.append(h('label', { class: 'chk', for: id }, cb, h('span', { text: t.name })));
  });
  fsT.append(grid, h('div', { class: 'q-actions' },
    h('button', { type: 'button', class: 'btn sm', text: 'All topics', onclick: () => { pr.sel = null; renderPrSetup(); } }),
    h('button', { type: 'button', class: 'btn sm', text: 'None', onclick: () => { pr.sel = []; renderPrSetup(); } })));
  const radio = (name, val, lab, cur, on) => { const id = name + '-' + val; const r = h('input', { type: 'radio', name, id, value: val, checked: cur === val ? true : null }); r.addEventListener('change', () => { on(val); upd(); }); return h('label', { class: 'chk', for: id }, r, h('span', { text: lab })); };
  const fsL = h('fieldset', null, h('legend', { text: 'Level' }), h('div', { class: 'seg' }, [['all', 'All levels'], ['1', 'Level 1 remember'], ['2', 'Level 2 apply'], ['3', 'Level 3 explain']].map(a => radio('prlevel', a[0], a[1], pr.level, v => { pr.level = v; }))));
  const fsM = h('fieldset', null, h('legend', { text: 'Mode' }), h('div', { class: 'seg' },
    radio('prmode', 'q', 'Questions (question bank)', pr.mode, v => { pr.mode = v; }),
    radio('prmode', 'g', 'Calculations (endless, fresh numbers)', pr.mode, v => { pr.mode = v; })));
  const cid = 'prCount';
  const cnt = h('select', { id: cid }, [['10', '10 questions'], ['20', '20 questions'], ['all', 'All matching']].map(a => h('option', { value: a[0], text: a[1], selected: pr.count === a[0] ? true : null })));
  cnt.addEventListener('change', () => { pr.count = cnt.value; });
  const fsC = h('div', { class: 'seg' }, h('label', { for: cid, class: 'small muted', text: 'Session length (Questions mode): ' }), cnt);
  const info = h('p', { class: 'muted', id: 'prInfo', 'aria-live': 'polite' });
  const go = h('button', { type: 'button', class: 'btn primary', id: 'prStart', text: 'Start', onclick: startFromSetup });
  box.append(fsT, fsL, fsM, fsC, info, h('div', { class: 'q-actions' }, go));
  function upd() {
    if (pr.mode === 'q') { const n = qPool().length; info.textContent = n + ' question' + (n === 1 ? '' : 's') + ' match.'; go.disabled = n === 0; }
    else { const n = gPool().length; info.textContent = n + ' calculation type' + (n === 1 ? '' : 's') + ' match. Numbers change every time.'; go.disabled = n === 0; }
    fsC.style.display = pr.mode === 'q' ? '' : 'none';
  }
  upd();
}
function startFromSetup() {
  if (pr.mode === 'q') {
    let list = preferOrder(qPool());
    if (pr.count !== 'all') list = list.slice(0, +pr.count);
    beginSession('q', list.map(itemFromQuestion), null);
  } else {
    beginSession('g', [], gPool());
  }
}
function startQuick() {
  const P = getP();
  const qs = P.questions || [], gens = P.generators || [];
  let items = [];
  if (qs.length) {
    const by = {}; topicIds().forEach(t => { by[t] = preferOrder(qs.filter(q => q.topic === t)); });
    const order = shuffle(topicIds()); const picked = []; let guard = 0;
    const want = gens.length ? 8 : 10;
    while (picked.length < want && guard++ < 200) { let any = false; order.forEach(t => { if (picked.length < want && by[t].length) { picked.push(by[t].shift()); any = true; } }); if (!any) break; }
    items = picked.map(itemFromQuestion);
  }
  if (gens.length) shuffle(gens).slice(0, 10 - items.length).forEach(g => items.push(itemFromGen(g)));
  items = shuffle(items);
  if (!items.length) { pr.phase = 'setup'; pr.sess = null; location.hash = '#practice'; return; }
  beginSession('quick', items, null);
  if (location.hash !== '#practice') location.hash = '#practice'; else route(false);
}
function beginSession(kind, items, genPool) {
  pr.sess = { kind, queue: items.slice(), genPool, answered: 0, score: 0, per: {}, missed: [], total: items.length };
  pr.phase = 'session';
  renderPracticeView(); nextQuestion();
}
function ensureQueue(s) {
  if (s.kind !== 'g') return;
  while (s.queue.length < 6 && s.genPool && s.genPool.length) {
    const g = s.genPool[Math.floor(rnd() * s.genPool.length)];
    s.queue.push(itemFromGen(g));
  }
}
function nextQuestion() {
  const s = pr.sess; if (!s) return;
  ensureQueue(s);
  if (!s.queue.length) { endSession(); return; }
  const it = s.queue.shift();
  s.cur = it;
  const box = $('#prSession'); box.innerHTML = '';
  const total = s.kind === 'g' ? '' : ' of ' + (s.answered + s.queue.length + 1);
  const bar = h('div', { class: 'sessbar' },
    h('span', { text: 'Question ' + (s.answered + 1) + total }), h('span', { text: 'Score ' + fmtScore(s.score) + ' / ' + s.answered }), h('span', { class: 'sp' }),
    h('button', { type: 'button', class: 'btn sm', text: 'End session', onclick: endSession }));
  const holder = h('div');
  const q = buildQ(it, { mode: 'now', onGraded: sc => graded(it, sc, holder) });
  holder.append(q.el);
  box.append(bar, holder);
  const f = $('input,textarea,.qopt', q.el); if (f && matchMedia('(min-width:1000px)').matches) f.focus({ preventScroll: true });
}
function graded(it, sc, holder) {
  const s = pr.sess; if (!s) return;
  s.answered++; s.score += sc;
  const p = s.per[it.topic] || (s.per[it.topic] = { n: 0, s: 0 }); p.n++; p.s += sc;
  recordAttempt(it, sc);
  if (sc < 1) {
    if (!it._rq) {
      s.missed.push(it);
      const re = freshItem(it); re._rq = true; it._rq = true;
      s.queue.splice(Math.min(s.queue.length, 3 + (rnd() < 0.5 ? 0 : 1)), 0, re);
    }
  }
  ensureQueue(s);
  const last = !s.queue.length;
  const nb = h('button', { type: 'button', class: 'btn primary', id: 'prNext', text: last ? 'Finish' : 'Next question', onclick: () => (last ? endSession() : nextQuestion()) });
  holder.append(h('div', { class: 'q-actions' }, nb));
  const sb = $('#prSession .sessbar span:nth-child(2)'); if (sb) sb.textContent = 'Score ' + fmtScore(s.score) + ' / ' + s.answered;
  nb.focus({ preventScroll: false });
}
function endSession() {
  const s = pr.sess; if (!s) { pr.phase = 'setup'; renderPracticeView(); return; }
  if (!s.answered) { pr.sess = null; pr.phase = 'setup'; renderPracticeView(); return; }
  pr.phase = 'summary';
  const box = $('#prSummary'); box.innerHTML = '';
  const pct = Math.round(100 * s.score / s.answered);
  const wrap = h('div', { class: 'panel sum' });
  wrap.append(h('div', null, h('div', { class: 'lab mono small muted', text: 'Session score' }), h('div', { class: 'sumscore num', text: fmtScore(s.score) + ' / ' + s.answered + '  (' + pct + ' %)' })));
  const tb = h('tbody');
  Object.keys(s.per).forEach(t => { const p = s.per[t]; tb.append(h('tr', null, h('td', { text: topicName(t) }), h('td', { class: 'm', text: fmtScore(p.s) + ' / ' + p.n }), h('td', { class: 'm', text: Math.round(100 * p.s / p.n) + ' %' }))); });
  wrap.append(h('div', { class: 'tw' }, h('table', null, h('thead', null, h('tr', null, h('th', { text: 'Topic' }), h('th', { text: 'Score' }), h('th', { text: '%' }))), tb)));
  if (s.missed.length) {
    wrap.append(h('h3', { text: 'Questions to look at again' }));
    const ul = h('ul', { class: 'missed' });
    s.missed.forEach(m => ul.append(h('li', null, h('div', { class: 'tag info', text: topicName(m.topic) }), h('div', { html: m.prompt }))));
    wrap.append(ul);
  } else wrap.append(h('p', { class: 'good', text: 'Nothing missed. Well done.' }));
  const act = h('div', { class: 'q-actions' });
  if (s.missed.length) act.append(h('button', { type: 'button', class: 'btn primary', text: 'Retry missed', onclick: () => { const items = s.missed.map(m => { const f = freshItem(m); f._rq = false; return f; }); beginSession('q', items, null); } }));
  act.append(h('button', { type: 'button', class: 'btn', text: 'New session', onclick: () => { pr.sess = null; pr.phase = 'setup'; renderPracticeView(); } }));
  wrap.append(act);
  box.append(wrap);
  $('#prSession').hidden = true; $('#prSetup').hidden = true; box.hidden = false;
  window.scrollTo(0, 0);
}

/* ================= FLASHCARDS ================= */
const cd = { topic: 'all', mode: 'due', queue: [], cur: null, flipped: false, seen: 0, known: 0 };
function cardsAll() { const fc = getP().flashcards || []; return cd.topic === 'all' ? fc : fc.filter(c => c.topic === cd.topic); }
function cardState(c) { return S.cards[c.id] || { box: 1, due: 0 }; }
function buildCardQueue() {
  const now = Date.now();
  const list = cardsAll().filter(c => cd.mode === 'all' || cardState(c).due <= now);
  cd.queue = shuffle(list).sort((a, b) => cardState(a).box - cardState(b).box);
  cd.cur = null; cd.flipped = false;
}
function renderCards() {
  const box = $('#cdSetup'), stage = $('#cdStage');
  const fc = getP().flashcards;
  box.innerHTML = ''; stage.innerHTML = '';
  if (!fc || !fc.length) { box.append(h('div', { class: 'empty', text: 'Flashcards not loaded' })); return; }
  const now = Date.now(); const list = cardsAll();
  const counts = [0, 0, 0, 0, 0]; let due = 0;
  list.forEach(c => { const s = cardState(c); counts[s.box - 1]++; if (s.due <= now) due++; });
  const sel = h('select', { id: 'cdTopic' }, h('option', { value: 'all', text: 'All topics' }), topicsList().map(t => h('option', { value: t.id, text: t.name, selected: cd.topic === t.id ? true : null })));
  sel.addEventListener('change', () => { cd.topic = sel.value; buildCardQueue(); renderCards(); });
  const mode = h('select', { id: 'cdMode' }, h('option', { value: 'due', text: 'Due now', selected: cd.mode === 'due' ? true : null }), h('option', { value: 'all', text: 'All cards (ignore due dates)', selected: cd.mode === 'all' ? true : null }));
  mode.addEventListener('change', () => { cd.mode = mode.value; buildCardQueue(); renderCards(); });
  box.append(h('div', { class: 'q-actions' }, h('label', { for: 'cdTopic', class: 'small muted', text: 'Topic' }), sel, h('label', { for: 'cdMode', class: 'small muted', text: 'Show' }), mode),
    h('p', { class: 'num' }, h('b', { text: 'Due now: ' + due }), '  of ' + list.length + ' cards'),
    h('div', { class: 'leit', role: 'group', 'aria-label': 'Cards per box' }, counts.map((n, i) => h('div', null, h('b', { text: n }), 'Box ' + (i + 1) + (i ? ' · ' + BOX_DAYS[i] + 'd' : ' · now')))));
  if (!cd.cur && cd.queue.length) { cd.cur = cd.queue.shift(); cd.flipped = false; }
  if (!cd.cur) {
    stage.append(h('div', { class: 'empty' }, h('p', { text: cd.mode === 'due' ? 'Nothing due right now. Come back later, or study all cards anyway.' : 'No cards here.' }),
      cd.mode === 'due' ? h('div', { class: 'q-actions', style: 'justify-content:center;margin-top:10px' }, h('button', { type: 'button', class: 'btn primary', text: 'Study all cards', onclick: () => { cd.mode = 'all'; buildCardQueue(); renderCards(); } })) : null));
    return;
  }
  const c = cd.cur, s = cardState(c);
  const f = h('div', { class: 'flash' + (cd.flipped ? ' back' : ''), 'aria-live': 'polite' },
    h('div', { class: 'side-l', text: cd.flipped ? 'Answer' : 'Question · box ' + s.box }), h('div', { html: cd.flipped ? c.back : c.front }),
    c.extra ? h('div', null, h('span', { class: 'tag info', text: 'Extra · not in your notes' })) : '');
  stage.append(f);
  const act = h('div', { class: 'q-actions', style: 'justify-content:center;margin-top:14px' });
  if (!cd.flipped) act.append(h('button', { type: 'button', class: 'btn primary', id: 'cdFlip', text: 'Show answer', onclick: flipCard }), h('span', { class: 'small muted', text: 'or press Space' }));
  else act.append(h('button', { type: 'button', class: 'btn primary', id: 'cdKnew', text: 'I knew it', onclick: () => rateCard(true) }), h('button', { type: 'button', class: 'btn', id: 'cdNot', text: 'Not yet', onclick: () => rateCard(false) }));
  stage.append(act);
  const fb = $(cd.flipped ? '#cdKnew' : '#cdFlip'); if (fb && cd._focus) fb.focus({ preventScroll: true });
}
function flipCard() { cd.flipped = true; cd._focus = true; renderCards(); }
function rateCard(knew) {
  const c = cd.cur; if (!c) return;
  S.cards[c.id] = leitner(cardState(c), knew, Date.now()); save();
  cd.seen++; if (knew) cd.known++;
  if (!knew) cd.queue.splice(Math.min(cd.queue.length, 3 + (rnd() < 0.5 ? 0 : 1)), 0, c);
  cd.cur = null; cd.flipped = false; cd._focus = true;
  renderCards(); renderDue();
}

/* ================= MOCK TEST ================= */
function drawMock(P, r) {
  r = r || rnd;
  // Items marked "(extra)" are beyond her notes: keep them in practice, never in a mock test.
  const qs = (P.questions || []).filter(q => !/\(extra\)/i.test(q.prompt || '')), gens = P.generators || [];
  const tids = (P.topics || FALLBACK_TOPICS).map(t => t.id);
  const used = new Set(), cnt = {}; tids.forEach(t => { cnt[t] = 0; });
  const out = [];
  const pick = (pool, slot) => {
    const cand = pool.filter(c => !used.has(c.id));
    if (!cand.length) return false;
    let best = null, bs = 1e9;
    cand.forEach(c => { const a = S.attempts[c.id]; const sc = (cnt[c.topic] || 0) * 10 + r() * 6 - (!a || a.last < 1 ? 3 : 0); if (sc < bs) { bs = sc; best = c; } });
    used.add(best.id); cnt[best.topic] = (cnt[best.topic] || 0) + 1;
    out.push({ c: best, slot, level: slot === 'gen' ? 2 : (best.level || slot) });
    return true;
  };
  const L = n => qs.filter(q => q.level === n);
  const nums2 = L(2).filter(q => q.type === 'num');
  // constrained slots first
  for (let i = 0; i < 2; i++) pick(shuffle(gens), 'gen') || pick(nums2, 'num2');
  pick(nums2, 'num2') || pick(L(2), 'l2');
  for (let i = 0; i < 2; i++) pick(L(3).filter(q => q.type === 'open'), 'open3') || pick(L(3), 'l3');
  for (let i = 0; i < 3; i++) pick(L(3).filter(q => q.type !== 'open'), 'l3') || pick(L(3), 'l3');
  for (let i = 0; i < 3; i++) pick(L(2), 'l2') || pick(qs, 'any');
  for (let i = 0; i < 5; i++) pick(L(1), 'l1') || pick(qs, 'any');
  while (out.length < 16 && pick(qs, 'any')) { /* top up */ }
  // repair: every topic needs at least 2 questions
  for (let iter = 0; iter < 12; iter++) {
    const low = tids.find(t => cnt[t] < 2 && (qs.some(q => q.topic === t && !used.has(q.id)) || gens.some(g => g.topic === t && !used.has(g.id))));
    if (!low) break;
    const hi = tids.slice().sort((a, b) => cnt[b] - cnt[a])[0];
    if (cnt[hi] <= 2) break;
    const idx = out.findIndex(o => o.c.topic === hi && o.slot !== 'gen' && o.slot !== 'open3');
    if (idx < 0) break;
    const lv = out[idx].level;
    let rep = qs.find(q => q.topic === low && !used.has(q.id) && q.level === lv && q.type !== 'open') || qs.find(q => q.topic === low && !used.has(q.id));
    if (!rep) break;
    used.delete(out[idx].c.id); cnt[hi]--; cnt[low]++; used.add(rep.id);
    out[idx] = { c: rep, slot: out[idx].slot, level: rep.level || lv };
  }
  const items = out.map(o => { if (o.c.make) { const g = itemFromGen(o.c); g.level = 2; return g; } return itemFromQuestion(o.c); });
  return shuffle(items).sort((a, b) => a.level - b.level);
}
const mk = { phase: 'intro', items: [], comps: [], t0: 0, paused: false, acc: 0, timer: null, state: [], resp: [], entry: null };
const MOCK_SECS = 30 * 60;
function mkElapsed() { return Math.floor((mk.acc + (mk.paused ? 0 : Date.now() - mk.t0)) / 1000); }
function fmtClock(sec) { const a = Math.abs(sec); return (sec < 0 ? '+' : '') + Math.floor(a / 60) + ':' + String(a % 60).padStart(2, '0'); }
function tickMock() {
  const c = $('#mkClock'); if (!c) return;
  const left = MOCK_SECS - mkElapsed();
  c.textContent = fmtClock(left);
  c.classList.toggle('over', left < 0);
  const msg = $('#mkMsg'); if (msg) msg.textContent = left < 0 ? 'Time is up. You can still finish and hand in.' : (mk.paused ? 'Paused' : '');
}
function renderMock() {
  const body = $('#mkBody');
  if (mk.phase === 'run' || mk.phase === 'confirm') return; // keep the running test untouched
  if (mk.phase === 'done') return;
  body.innerHTML = '';
  const P = getP();
  if (!P.questions || !P.questions.length) { body.append(h('div', { class: 'empty', text: 'Questions not loaded' })); return; }
  const panel = h('div', { class: 'panel' },
    h('h2', { text: 'Before you start' }),
    h('ul', null, h('li', { text: '16 questions drawn fresh each time, from all six topics.' }), h('li', { text: '30 minutes. You can pause. If time runs out you can still finish.' }), h('li', { text: 'No feedback until you hand in. Open questions you mark yourself afterwards.' }), h('li', { text: 'Have your formula sheet in your head, not on screen.' })),
    h('div', { class: 'q-actions' }, h('button', { type: 'button', class: 'btn primary', id: 'mkStart', text: 'Start the mock test', onclick: startMock })));
  body.append(panel, historyBlock());
}
function historyBlock() {
  const wrap = h('section', { class: 'blk', style: 'margin-top:28px' }, h('h2', { text: 'Your earlier mock tests' }));
  if (!S.mocks.length) { wrap.append(h('p', { class: 'muted', text: 'None yet.' })); return wrap; }
  const ul = h('ul', { class: 'hist' });
  S.mocks.slice(-10).reverse().forEach(m => ul.append(h('li', null, h('span', { text: new Date(m.t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }), h('b', { text: Math.round(m.score) + ' %' }))));
  wrap.append(ul); return wrap;
}
function startMock() {
  const items = drawMock(getP(), rnd);
  mk.items = items; mk.phase = 'run'; mk.t0 = Date.now(); mk.acc = 0; mk.paused = false; mk.entry = null;
  mk.comps = []; mk.state = []; mk.resp = [];
  const body = $('#mkBody'); body.innerHTML = '';
  const timer = h('div', { class: 'timer', role: 'group', 'aria-label': 'Timer' },
    h('span', { class: 'clock num', id: 'mkClock', text: '30:00', role: 'timer' }),
    h('button', { type: 'button', class: 'btn sm', id: 'mkPause', text: 'Pause', onclick: togglePause }),
    h('span', { class: 'small', id: 'mkMsg', 'aria-live': 'polite' }), h('span', { class: 'sp' }),
    h('span', { class: 'small muted', id: 'mkCount', text: '0 of ' + items.length + ' answered' }));
  body.append(timer);
  const list = h('div', { class: 'qhost', id: 'mkList', style: 'margin-top:16px' });
  items.forEach((it, i) => {
    const c = buildQ(it, { mode: 'defer', onChange: updCount });
    c.el.insertBefore(h('div', { class: 'mq-n', text: 'Question ' + (i + 1) + ' of ' + items.length }), c.el.firstChild);
    mk.comps.push(c); list.append(c.el);
  });
  body.append(list, h('div', { id: 'mkEnd', style: 'margin-top:18px' }, h('button', { type: 'button', class: 'btn primary', id: 'mkHand', text: 'Hand in', onclick: confirmHandIn })));
  clearInterval(mk.timer); mk.timer = setInterval(tickMock, 1000); tickMock();
  window.scrollTo(0, 0);
}
function updCount() { const n = mk.comps.filter(c => c.getResponse() != null).length; const e = $('#mkCount'); if (e) e.textContent = n + ' of ' + mk.items.length + ' answered'; }
function togglePause() {
  if (mk.paused) { mk.paused = false; mk.t0 = Date.now(); } else { mk.acc += Date.now() - mk.t0; mk.paused = true; }
  $('#mkPause').textContent = mk.paused ? 'Resume' : 'Pause';
  $('#mkList').style.visibility = mk.paused ? 'hidden' : '';
  tickMock();
}
function confirmHandIn() {
  const n = mk.comps.filter(c => c.getResponse() != null).length;
  const end = $('#mkEnd'); end.innerHTML = '';
  end.append(h('div', { class: 'confirm', role: 'alertdialog', 'aria-label': 'Confirm hand in' },
    h('p', { text: 'You answered ' + n + ' of ' + mk.items.length + ' questions.' + (n < mk.items.length ? ' Unanswered questions count as wrong.' : '') + ' Hand in now? You cannot change your answers afterwards.' }),
    h('div', { class: 'q-actions' }, h('button', { type: 'button', class: 'btn primary', id: 'mkYes', text: 'Yes, hand in', onclick: handIn }),
      h('button', { type: 'button', class: 'btn', text: 'Keep working', onclick: () => { end.innerHTML = ''; end.append(h('button', { type: 'button', class: 'btn primary', id: 'mkHand', text: 'Hand in', onclick: confirmHandIn })); } }))));
  $('#mkYes').focus();
}
function handIn() {
  clearInterval(mk.timer);
  mk.elapsed = mkElapsed();
  mk.paused = false;
  mk.phase = 'done';
  mk.resp = mk.comps.map(c => c.getResponse());
  mk.state = mk.items.map((it, i) => {
    if (it.type === 'open') return { score: null };
    const g = gradeItem(it, mk.resp[i]);
    recordAttempt(it, g.score);
    return { score: g.score };
  });
  mk.entry = { t: Date.now(), score: 0, byTopic: {} };
  S.mocks.push(mk.entry); if (S.mocks.length > 40) S.mocks.splice(0, S.mocks.length - 40);
  drawMockResults();
  window.scrollTo(0, 0);
}
function mockTotals() {
  const by = {}; let s = 0;
  mk.items.forEach((it, i) => { const b = by[it.topic] || (by[it.topic] = { s: 0, m: 0 }); b.m++; const sc = mk.state[i].score; if (sc != null) { b.s += sc; s += sc; } });
  return { by, s, m: mk.items.length };
}
function drawMockResults() {
  const body = $('#mkBody'); body.innerHTML = '';
  const sum = h('div', { class: 'panel', id: 'mkSum', 'aria-live': 'polite' });
  body.append(sum);
  const rev = h('div', { class: 'qhost', style: 'margin-top:20px' }, h('h2', { text: 'Every question' }));
  mk.items.forEach((it, i) => rev.append(reviewCard(it, mk.resp[i], i + 1, mk.state[i], sc => {
    mk.state[i].score = sc; if (!mk.state[i].rec) { mk.state[i].rec = true; recordAttempt(it, sc); } fillSummary();
  })));
  body.append(rev);
  body.append(h('div', { class: 'q-actions', style: 'margin-top:18px' }, h('button', { type: 'button', class: 'btn primary', text: 'New mock test', onclick: () => { mk.phase = 'intro'; renderMock(); window.scrollTo(0, 0); } })));
  fillSummary();
}
function fillSummary() {
  const sum = $('#mkSum'); if (!sum) return;
  const T = mockTotals(); const pct = 100 * T.s / T.m;
  const openLeft = mk.state.filter(s => s.score == null).length;
  mk.entry.score = pct; mk.entry.byTopic = T.by; save();
  sum.innerHTML = '';
  sum.append(h('div', null, h('div', { class: 'lab mono small muted', text: 'Mock test score' }), h('div', { class: 'sumscore num', text: Math.round(pct) + ' %' }),
    h('p', { class: 'muted', text: fmtScore(T.s) + ' of ' + T.m + ' points' + (openLeft ? '. ' + openLeft + ' open question' + (openLeft === 1 ? '' : 's') + ' not marked yet: mark them below (counted as 0 until then).' : '. Time used: ' + fmtClock(mk.elapsed) + '.') })));
  const bars = h('div', { class: 'bars' });
  let weakest = null, wp = 2;
  Object.keys(T.by).forEach(t => {
    const b = T.by[t]; const p = b.s / b.m;
    if (p < wp) { wp = p; weakest = t; }
    bars.append(h('div', { class: 'barrow' }, h('span', { text: topicName(t) }), h('div', { class: 'track', role: 'img', 'aria-label': Math.round(p * 100) + ' percent' }, h('i', { class: p >= 0.8 ? 'hi' : p >= 0.5 ? 'mid' : 'lo', style: 'width:' + Math.round(p * 100) + '%' })), h('span', { class: 'pc', text: fmtScore(b.s) + ' / ' + b.m })));
  });
  sum.append(h('h3', { text: 'By topic' }), bars);
  if (weakest) sum.append(h('p', null, h('b', { text: 'Weakest topic: ' + topicName(weakest) + '  ' }), h('a', { href: '#' + weakest, text: 'Learn page' }), '  ·  ', h('a', { href: '#practice/' + weakest, text: 'Practise it' })));
  sum.append(historyBlock());
}

/* ================= router / boot ================= */
function route(first) {
  const raw = decodeURIComponent(location.hash.slice(1));
  const parts = raw.split('/');
  let v = parts[0]; const args = parts.slice(1);
  if (!PAGES.some(p => p.v === v)) v = 'home';
  closeMenu(false);
  if (v === 'practice' && args[0]) {
    pr.sel = args[0] === 'all' ? null : [args[0]]; pr.phase = 'setup'; pr.sess = null;
  }
  $$('.view').forEach(el => { el.hidden = el.dataset.view !== v; });
  $$('#pnav a').forEach(a => { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const pg = PAGES.find(x => x.v === v);
  $('#tbPage').innerHTML = '<span class="tb-ico">' + icon(pg.ic) + '</span><span>' + pg.t.replace(/&/g, '&amp;') + '</span>';
  curView = v;
  const view = $('#view-' + v);
  if (v === 'home') renderHome();
  else if (TOPIC_PAGES.indexOf(v) >= 0) { $$('.qhost[data-qtopic]', view).forEach(renderInline); }
  else if (v === 'practice') renderPracticeView();
  else if (v === 'cards') { buildCardQueue(); renderCards(); }
  else if (v === 'mock') renderMock();
  mountSims(view);
  renderDue();
  if (!first) { window.scrollTo(0, 0); const h1 = $('#h-' + v); if (h1) h1.focus({ preventScroll: true }); }
}
function init() {
  load();
  renderShell();
  buildFigures();
  setSize(!!S.big, false);
  window.addEventListener('hashchange', () => route(false));
  $('#skip').addEventListener('click', e => { e.preventDefault(); const h1 = $('#h-' + curView); if (h1) h1.focus(); });
  $('#menuBtn').addEventListener('click', openMenu);
  $('#menuClose').addEventListener('click', () => closeMenu(true));
  $('#scrim').addEventListener('click', () => closeMenu(true));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && side().classList.contains('open')) closeMenu(true);
    if ((e.key === ' ' || e.code === 'Space') && curView === 'cards' && cd.cur && !cd.flipped) {
      const tg = e.target && e.target.tagName;
      if (['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].indexOf(tg) < 0) { e.preventDefault(); flipCard(); }
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1000) closeMenu(false); });
  window.addEventListener('load', () => { const v = $('#view-' + curView); if (v) { mountSims(v); $$('.qhost[data-qtopic]', v).forEach(renderInline); } });
  $$('#txtPick button').forEach(b => b.addEventListener('click', () => setSize(b.dataset.size === '1', true)));
  $('#goQuick').addEventListener('click', startQuick);
  route(true);
}

if (HAS_DOM) init();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseNum, gradeNum, leitner, drawMock, startOfDay, mulberry, shuffle, _S: () => S, _setS: s => { S = s; } };
}
})();
