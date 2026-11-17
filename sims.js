/* sims.js - interactive simulations for the Oscillations & Waves trainer.
   window.Sims.mount(name, el, opts) -> { destroy() }
   Names: hooke, oscillator, circle, pendulum, resonance, wave. Plain JS, canvas 2D. */
(function () {
'use strict';

const TAU = Math.PI * 2;
let uid = 0;
let CUR = null; // colours of the current frame

/* =====================================================================
   Pure physics kernels (also exposed as Sims._phys for testing)
   ===================================================================== */
function pendRK4(th, om, g, l, h) {
  const a = (t) => -(g / l) * Math.sin(t);
  const k1t = om, k1o = a(th);
  const k2t = om + 0.5 * h * k1o, k2o = a(th + 0.5 * h * k1t);
  const k3t = om + 0.5 * h * k2o, k3o = a(th + 0.5 * h * k2t);
  const k4t = om + h * k3o, k4o = a(th + h * k3t);
  return [th + h * (k1t + 2 * k2t + 2 * k3t + k4t) / 6, om + h * (k1o + 2 * k2o + 2 * k3o + k4o) / 6];
}
// period measured from interpolated right-hand turning points (as the sim's stopwatch does)
function pendPeriod(l, g, a0deg, h) {
  h = h || 1 / 500;
  let th = a0deg * Math.PI / 180, om = 0, t = 0;
  const ev = [];
  while (ev.length < 3 && t < 120) {
    const prev = om;
    const r = pendRK4(th, om, g, l, h);
    th = r[0]; om = r[1];
    if (prev > 0 && om <= 0) ev.push(t + h * prev / (prev - om));
    t += h;
  }
  return (ev[2] - ev[0]) / 2;
}
function agm(a, b) { for (let i = 0; i < 30; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; } return a; }
// exact (large-amplitude) period
function pendExact(l, g, a0deg) { return TAU * Math.sqrt(l / g) / agm(1, Math.cos(a0deg * Math.PI / 360)); }
function resAmp(fd, f0, zeta) { // steady-state amplitude / driver amplitude
  const w0 = TAU * f0, wd = TAU * fd, d = zeta * w0;
  return w0 * w0 / Math.sqrt(Math.pow(w0 * w0 - wd * wd, 2) + Math.pow(2 * d * wd, 2));
}
function pulseP(u, w, A) { return (u >= -w && u <= 0) ? A * Math.sin(Math.PI * (u + w) / w) : 0; }
function pulseY(x, s, L, w, A, fixed) { return pulseP(x - s, w, A) + (fixed ? -1 : 1) * pulseP(2 * L - x - s, w, A); }
const DAMP_Q = [1, 0.95, 0.9, 0.85, 0.8, 0.7];
function dampDelta(step, T) { return -Math.log(DAMP_Q[step]) * 2 / T; }

/* =====================================================================
   Small helpers
   ===================================================================== */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fmt(v, d) {
  let s = Number(v).toFixed(d);
  if (/^-0(\.0*)?$/.test(s)) s = s.slice(1);
  return s.replace('-', '−');
}
function h(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function niceCeil(v) {
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * e >= v - 1e-12) return m * e;
  return 10 * e;
}
function niceStep(range, target) {
  const raw = range / target, e = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 5, 10]) if (m * e >= raw) return m * e;
  return 10 * e;
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }

function colors() {
  const cs = getComputedStyle(document.documentElement);
  const g = (n, d) => (cs.getPropertyValue(n) || '').trim() || d;
  return {
    card: g('--card', '#fff'), sunk: g('--sunk', '#e8ecf2'), line: g('--line', '#d5dce5'),
    ink: g('--ink', '#17202b'), ink2: g('--ink-2', '#4a5666'), ink3: g('--ink-3', '#5f6b7a'),
    accent: g('--accent', '#b5500b'), accentInk: g('--accent-ink', '#fff'), bright: g('--accent-bright', '#f08a24'),
    mag: g('--mag', '#a3155f'), blue: g('--blue', '#1f78c8'), ok: g('--ok', '#1d7a45'), stop: g('--stop', '#b3261e'),
    mono: g('--f-mono', 'ui-monospace, Consolas, monospace'),
    body: g('--f-body', 'system-ui, sans-serif')
  };
}

/* canvas text with a halo in the card colour so labels stay readable over lines */
function txt(ctx, s, x, y, o) {
  o = o || {};
  ctx.font = (o.bold ? '700 ' : '400 ') + (o.size || 12) + 'px ' + (o.mono ? CUR.mono : CUR.body);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  if (o.halo !== false) {
    ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = CUR.card;
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = o.color || CUR.ink2;
  ctx.fillText(s, x, y);
}
function paper(ctx, x, y, w, hh) { // faint graph-paper grid
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, hh); ctx.clip();
  ctx.strokeStyle = CUR.line; ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = x; gx <= x + w; gx += 14) { const p = Math.round(gx) + 0.5; ctx.moveTo(p, y); ctx.lineTo(p, y + hh); }
  for (let gy = y; gy <= y + hh; gy += 14) { const p = Math.round(gy) + 0.5; ctx.moveTo(x, p); ctx.lineTo(x + w, p); }
  ctx.stroke();
  ctx.restore();
}
function line(ctx, x1, y1, x2, y2, color, w, dash) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = w || 1;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}
function dot(ctx, x, y, r, fill, stroke) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = 1.5; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function arrow(ctx, x1, y1, x2, y2, color, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), s = 7;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w || 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * s * 0.7, y2 - Math.sin(a) * s * 0.7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45));
  ctx.lineTo(x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
function spring(ctx, x, y1, y2, coils, amp, color, w) {
  const lead = Math.min(8, Math.abs(y2 - y1) / 4), n = coils * 2;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = w || 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y1 + lead);
  const ya = y1 + lead, yb = y2 - lead;
  for (let i = 1; i <= n; i++) {
    const yy = ya + (yb - ya) * (i - 0.5) / n;
    ctx.lineTo(x + (i % 2 ? amp : -amp), yy);
  }
  ctx.lineTo(x, yb); ctx.lineTo(x, y2);
  ctx.stroke();
  ctx.restore();
}
function frac(deg) { // degrees (multiple of 15) -> "3π/4" style text
  const k = Math.round(deg / 15);
  if (k === 0) return '0';
  const g = gcd(k, 12), n = k / g, d = 12 / g;
  return (n === 1 ? '' : String(n)) + 'π' + (d === 1 ? '' : '/' + d);
}

/* =====================================================================
   CSS (injected once)
   ===================================================================== */
const CSS = `
.sims-root{font-family:var(--f-body);color:var(--ink);max-width:100%}
.sims-root *{box-sizing:border-box}
.sims-box{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.sims-box canvas{display:block;width:100%}
.sims-cap{margin:.6rem 0 .5rem;font-size:.95rem;line-height:1.45;color:var(--ink-2)}
.sims-warn{margin:.6rem 0 0;padding:.6rem .8rem;border-radius:8px;border:1px solid var(--stop);background:var(--stop-soft,transparent);color:var(--stop);font-weight:700;font-size:.95rem;line-height:1.4}
.sims-note{margin:.4rem 0;font-size:.9rem;line-height:1.4;color:var(--ink-2)}
.sims-read{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px 10px;margin:.4rem 0 .6rem}
.sims-rd{background:var(--sunk);border-radius:8px;padding:6px 10px;min-width:0}
.sims-rd.wide{grid-column:1/-1}
.sims-rk{display:block;font-size:.78rem;color:var(--ink-3);line-height:1.2}
.sims-rv{display:block;font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:500;font-size:.95rem;color:var(--ink);overflow-wrap:anywhere}
.sims-btns{display:flex;flex-wrap:wrap;gap:8px;margin:.5rem 0}
.sims-btn{min-height:40px;min-width:40px;padding:0 14px;border-radius:8px;border:1px solid var(--line);background:var(--sunk);color:var(--ink);font:inherit;font-size:.95rem;cursor:pointer}
.sims-btn:hover{border-color:var(--ink-3)}
.sims-btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700}
.sims-btn:disabled{opacity:.5;cursor:not-allowed}
.sims-btn:focus-visible,.sims-root select:focus-visible,.sims-root input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.sims-ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:6px 22px;margin:.3rem 0}
.sims-row{min-width:0}
.sims-row[hidden],.sims-btn[hidden],.sims-note[hidden],.sims-warn[hidden],.sims-extra [hidden]{display:none!important}
.sims-row label{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:.92rem;color:var(--ink)}
.sims-val{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-size:.9rem;color:var(--ink);white-space:nowrap}
.sims-row input[type=range]{display:block;width:100%;min-height:40px;margin:0;accent-color:var(--accent);background:transparent}
.sims-row select,.sims-row input[type=number]{display:block;width:100%;min-height:40px;padding:0 10px;border-radius:8px;border:1px solid var(--line);background:var(--sunk);color:var(--ink);font:inherit;font-size:.95rem}
.sims-row.check label{justify-content:flex-start;align-items:center;min-height:40px;gap:10px;cursor:pointer}
.sims-row.check input{width:22px;height:22px;accent-color:var(--accent);margin:0}
.sims-seg{display:flex;flex-wrap:wrap;gap:6px;margin:.4rem 0}
.sims-seg .sims-btn[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700}
.sims-inline{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}
.sims-inline .sims-row{flex:1 1 160px}
.sims-fb{font-size:.95rem;line-height:1.45;margin:.3rem 0;color:var(--ink)}
.sims-fb.good{color:var(--ok);font-weight:700}.sims-fb.bad{color:var(--stop);font-weight:700}
.sims-tblwrap{overflow-x:auto;margin:.4rem 0}
.sims-tbl{border-collapse:collapse;width:100%;font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-size:.88rem}
.sims-tbl th,.sims-tbl td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:right;white-space:nowrap;color:var(--ink)}
.sims-tbl th{font-family:var(--f-body);font-weight:700;color:var(--ink-2);font-size:.82rem}
.sims-tbl td.bad{color:var(--stop)}
.sims-list{margin:.3rem 0;padding:0;list-style:none;font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-size:.88rem;color:var(--ink)}
.sims-h{font-weight:700;font-size:.95rem;margin:.6rem 0 .2rem;color:var(--ink)}
@media (max-width:520px){.sims-ctrls{grid-template-columns:1fr}.sims-btn{flex:1 1 auto}}
`;
function injectCSS() {
  if (document.getElementById('sims-css')) return;
  const s = document.createElement('style');
  s.id = 'sims-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/* =====================================================================
   Shared sim scaffold: canvas, loop, visibility, resize, controls
   ===================================================================== */
function createBase(name, host, opts, factory) {
  injectCSS();
  const n = ++uid, pre = 'sim-' + name + '-' + n + '-';
  let sc = 0;
  host.textContent = '';
  const root = h('div', 'sims-root'); host.appendChild(root);
  const box = h('div', 'sims-box'); const cv = document.createElement('canvas');
  cv.setAttribute('role', 'img'); box.appendChild(cv); root.appendChild(box);
  const capEl = h('p', 'sims-cap'); root.appendChild(capEl);
  const readEl = h('div', 'sims-read'); root.appendChild(readEl);
  const bar = h('div', 'sims-btns'); root.appendChild(bar);
  const ctrl = h('div', 'sims-ctrls'); root.appendChild(ctrl);
  const extra = h('div', 'sims-extra'); root.appendChild(extra);
  const ctx = cv.getContext('2d');
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const st = { running: !mq.matches, visible: true, dead: false, W: 0, H: 0, dpr: 1, raf: 0, last: 0, pend: false, errLogged: false };
  let sim = null;
  let playLabels = ['Pause', 'Play'];

  function active() { return st.visible && !st.dead && host.getClientRects().length > 0; }
  function drawNow() {
    if (!sim || !st.W || st.dead) return;
    try {
      CUR = colors();
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      ctx.clearRect(0, 0, st.W, st.H);
      ctx.fillStyle = CUR.card; ctx.fillRect(0, 0, st.W, st.H);
      sim.draw(ctx, st.W, st.H);
    } catch (e) { if (!st.errLogged) { st.errLogged = true; console.error('[sims:' + name + ']', e); } }
  }
  function frame(now) {
    st.raf = 0;
    if (st.dead || !st.running || !active()) return;
    const dt = Math.min(0.05, Math.max(0, (now - st.last) / 1000));
    st.last = now;
    try { sim.step(dt); } catch (e) { if (!st.errLogged) { st.errLogged = true; console.error('[sims:' + name + ']', e); } }
    drawNow();
    st.raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (st.raf || st.dead || !st.running || !active()) return;
    st.last = performance.now();
    st.raf = requestAnimationFrame(frame);
  }
  function requestDraw() {
    if (st.pend || st.dead) return;
    st.pend = true;
    requestAnimationFrame(() => { st.pend = false; drawNow(); });
  }
  function resize() {
    if (!sim) return;
    const W = Math.floor(box.clientWidth);
    if (W < 20) return;
    const H = Math.round(sim.height(W));
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (W !== st.W || H !== st.H || dpr !== st.dpr) {
      st.W = W; st.H = H; st.dpr = dpr;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.height = H + 'px';
    }
    drawNow();
  }

  const api = {
    pre, opts, box, extra, ctrl, bar, root,
    caption(html) { capEl.innerHTML = html; },
    label(txtv) { cv.setAttribute('aria-label', txtv); },
    draw: requestDraw,
    running() { return st.running; },
    setRunning(b) { st.running = !!b; playBtn.textContent = st.running ? playLabels[0] : playLabels[1]; playBtn.setAttribute('aria-pressed', String(!st.running)); if (st.running) kick(); else requestDraw(); },
    setPlayLabels(a, b) { playLabels = [a, b]; api.setRunning(st.running); },
    btn(label, onClick, o) {
      o = o || {};
      const b = h('button', 'sims-btn' + (o.primary ? ' primary' : ''), label);
      b.type = 'button';
      if (o.id) b.id = pre + o.id;
      b.addEventListener('click', onClick);
      (o.parent || bar).appendChild(b);
      return b;
    },
    slider(o) {
      const id = pre + (o.key || ('s' + (sc++)));
      const row = h('div', 'sims-row');
      const lab = h('label'); lab.htmlFor = id;
      const nm = h('span', 'sims-name', o.label), val = h('span', 'sims-val');
      lab.append(nm, val);
      const inp = document.createElement('input');
      inp.type = 'range'; inp.id = id; inp.min = o.min; inp.max = o.max; inp.step = o.step; inp.value = o.value;
      row.append(lab, inp);
      (o.parent || ctrl).appendChild(row);
      const f = o.fmt || ((v) => fmt(v, o.dp || 0));
      const upd = () => { val.textContent = f(+inp.value) + (o.unit ? ' ' + o.unit : ''); inp.setAttribute('aria-valuetext', val.textContent); };
      upd();
      inp.addEventListener('input', () => { upd(); if (o.onInput) o.onInput(+inp.value); });
      return { row, input: inp, get: () => +inp.value, set(v) { inp.value = v; upd(); }, hide(b) { row.hidden = b; } };
    },
    select(o) {
      const id = pre + (o.key || ('s' + (sc++)));
      const row = h('div', 'sims-row');
      const lab = h('label', null, '<span class="sims-name">' + o.label + '</span>'); lab.htmlFor = id;
      const sel = document.createElement('select'); sel.id = id;
      o.options.forEach((p) => { const op = document.createElement('option'); op.value = p[0]; op.textContent = p[1]; sel.appendChild(op); });
      sel.value = o.value;
      row.append(lab, sel);
      (o.parent || ctrl).appendChild(row);
      sel.addEventListener('change', () => o.onChange && o.onChange(sel.value));
      return { row, el: sel, get: () => sel.value, set(v) { sel.value = v; }, hide(b) { row.hidden = b; } };
    },
    check(o) {
      const id = pre + (o.key || ('c' + (sc++)));
      const row = h('div', 'sims-row check');
      const lab = h('label'); lab.htmlFor = id;
      const inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = id; inp.checked = !!o.value;
      lab.append(inp, h('span', null, o.label));
      row.appendChild(lab);
      (o.parent || ctrl).appendChild(row);
      inp.addEventListener('change', () => o.onChange && o.onChange(inp.checked));
      return { row, el: inp, get: () => inp.checked, set(v) { inp.checked = !!v; }, hide(b) { row.hidden = b; } };
    },
    segmented(o) {
      const wrap = h('div', 'sims-seg'); wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', o.label || 'Mode');
      const btns = {};
      o.options.forEach((p) => {
        const b = h('button', 'sims-btn', p[1]); b.type = 'button'; b.id = pre + 'seg-' + p[0];
        b.addEventListener('click', () => { set(p[0]); o.onChange && o.onChange(p[0]); });
        wrap.appendChild(b); btns[p[0]] = b;
      });
      function set(v) { for (const k in btns) btns[k].setAttribute('aria-pressed', String(k === v)); }
      set(o.value);
      (o.parent || ctrl.parentNode).insertBefore(wrap, o.before || ctrl);
      return { el: wrap, set };
    },
    readouts(items) {
      readEl.textContent = '';
      const refs = {};
      items.forEach((it) => {
        const c = h('div', 'sims-rd' + (it[2] ? ' wide' : ''));
        const v = h('b', 'sims-rv', '—');
        c.append(h('span', 'sims-rk', it[1]), v);
        readEl.appendChild(c); refs[it[0]] = v;
      });
      return (k, t) => { const e = refs[k]; if (e && e.textContent !== t) e.textContent = t; };
    }
  };

  // Play / Reset (always first)
  const playBtn = h('button', 'sims-btn primary', playLabels[0]);
  playBtn.type = 'button'; playBtn.id = pre + 'play';
  playBtn.addEventListener('click', () => api.setRunning(!st.running));
  const resetBtn = h('button', 'sims-btn', 'Reset');
  resetBtn.type = 'button'; resetBtn.id = pre + 'reset';
  resetBtn.addEventListener('click', () => { sim.reset(); requestDraw(); });
  bar.append(playBtn, resetBtn);

  sim = factory(api);
  api.setRunning(st.running);

  let ro = null, io = null, mo = null;
  if (window.ResizeObserver) { ro = new ResizeObserver(() => resize()); ro.observe(box); } else window.addEventListener('resize', resize);
  if (window.IntersectionObserver) {
    io = new IntersectionObserver((es) => {
      const e = es[es.length - 1];
      st.visible = e.isIntersecting;
      if (st.visible) { resize(); kick(); }
    });
    io.observe(box);
  }
  const redraw = () => requestDraw();
  if (window.MutationObserver) { mo = new MutationObserver(redraw); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] }); }
  const cq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (cq && cq.addEventListener) cq.addEventListener('change', redraw);
  resize();
  kick();

  return {
    destroy() {
      st.dead = true;
      if (st.raf) cancelAnimationFrame(st.raf);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      if (io) io.disconnect();
      if (mo) mo.disconnect();
      if (cq && cq.removeEventListener) cq.removeEventListener('change', redraw);
      if (sim && sim.destroy) sim.destroy();
      host.textContent = '';
    }
  };
}

/* =====================================================================
   1. HOOKE'S LAW
   ===================================================================== */
function simHooke(api) {
  const o = api.opts, g = 9.81, FLIM = 35; // elastic-limit force (N)
  const S = { k: o.k || 500, m: o.m != null ? o.m : 1.0, xd: 0, rows: [] };
  const xOf = (F, k) => { let x = F / k; if (F > FLIM) { const d = F - FLIM; x += 20 * d * d / (k * FLIM); } return x; };
  const Fn = () => S.m * g, Xn = () => xOf(Fn(), S.k), over = () => Fn() > FLIM + 1e-9;

  api.caption('Add mass and watch the spring stretch. The F–x graph is a straight line through the origin, and its <b>slope is k</b>. Try a stiffer or a softer spring, then record a few measurements like in your experiment.');
  api.label('Hooke\'s law: a spring with a hanging mass, a ruler showing the extension, and an F against x graph.');

  const warn = h('div', 'sims-warn'); warn.setAttribute('role', 'status'); warn.hidden = true;
  warn.textContent = 'Beyond the elastic region — Hooke’s law no longer holds; the spring would be permanently stretched.';
  api.box.after(warn);

  const set = api.readouts([['F', 'Force F = m·g'], ['x', 'Extension x'], ['k', 'Spring constant k = F/x']]);
  const sk = api.slider({ key: 'k', label: 'Spring constant <i>k</i>', min: 50, max: 1000, step: 10, value: S.k, unit: 'N/m', onInput: (v) => { S.k = v; sync(); } });
  const sm = api.slider({ key: 'm', label: 'Mass <i>m</i>', min: 0, max: 4, step: 0.1, value: S.m, unit: 'kg', dp: 1, onInput: (v) => { S.m = v; sync(); } });

  // measurement table
  const recBtn = api.btn('Record measurement', record, { parent: api.extra, id: 'rec' });
  const clrBtn = api.btn('Clear table', () => { S.rows = []; renderTable(); }, { parent: api.extra, id: 'clr' });
  const recRow = h('div', 'sims-btns'); api.extra.append(recRow); recRow.append(recBtn, clrBtn);
  const tblWrap = h('div', 'sims-tblwrap'); api.extra.append(tblWrap);
  const tblNote = h('p', 'sims-note'); api.extra.append(tblNote);

  function record() {
    if (S.m <= 0 || S.rows.length >= 6) return;
    S.rows.push({ m: S.m, x: Xn(), F: Fn(), ok: !over() });
    renderTable();
  }
  function renderTable() {
    let s = '<table class="sims-tbl"><thead><tr><th>#</th><th>m (kg)</th><th>x (cm)</th><th>F = m·g (N)</th><th>k = F/x (N/m)</th></tr></thead><tbody>';
    if (!S.rows.length) s += '<tr><td colspan="5" style="text-align:left;font-family:var(--f-body);color:var(--ink-3)">No measurements yet. Set a mass, then press “Record measurement”.</td></tr>';
    S.rows.forEach((r, i) => {
      s += '<tr><td>' + (i + 1) + '</td><td>' + fmt(r.m, 1) + '</td><td>' + fmt(r.x * 100, 2) + '</td><td>' + fmt(r.F, 2) + '</td><td' + (r.ok ? '' : ' class="bad"') + '>' + fmt(r.F / r.x, 1) + (r.ok ? '' : ' *') + '</td></tr>';
    });
    s += '</tbody></table>';
    tblWrap.innerHTML = s;
    const good = S.rows.filter((r) => r.ok);
    let note = '';
    if (good.length >= 2) note = 'Average k of the rows inside the elastic region: <b>' + fmt(good.reduce((a, r) => a + r.F / r.x, 0) / good.length, 1) + ' N/m</b>. (Several masses and an average beat a single reading.)';
    if (S.rows.some((r) => !r.ok)) note += (note ? ' ' : '') + '* outside the elastic region: F/x is no longer the spring constant.';
    if (S.rows.length >= 6) note += (note ? ' ' : '') + 'Table full (6 rows) — press Clear to start again.';
    tblNote.innerHTML = note;
    recBtn.disabled = S.m <= 0 || S.rows.length >= 6;
  }
  function sync() {
    if (!api.running()) S.xd = Xn();
    warn.hidden = !over();
    recBtn.disabled = S.m <= 0 || S.rows.length >= 6;
    api.draw();
  }
  function readouts() {
    const F = Fn(), x = Xn();
    set('F', fmt(F, 2) + ' N');
    set('x', fmt(x, 4) + ' m = ' + fmt(x * 100, 1) + ' cm');
    if (S.m <= 0) set('k', '—');
    else if (over()) set('k', 'not constant — Hooke’s law does not apply');
    else set('k', fmt(F / x, 0) + ' N/m');
  }

  function layout(W, H) {
    if (W >= 600) { const sw = Math.round(W * 0.42); return { s: { x: 0, y: 0, w: sw, h: H }, g: { x: sw, y: 0, w: W - sw, h: H } }; }
    const sh = Math.round(H * 0.53); return { s: { x: 0, y: 0, w: W, h: sh }, g: { x: 0, y: sh, w: W, h: H - sh } };
  }
  renderTable(); sync(); S.xd = Xn();

  return {
    height(W) { return W >= 600 ? clamp(W * 0.55, 330, 440) : 640; },
    reset() { S.k = 500; S.m = 1.0; sk.set(500); sm.set(1.0); S.rows = []; renderTable(); S.xd = Xn(); warn.hidden = !over(); },
    step(dt) { S.xd += (Xn() - S.xd) * (1 - Math.exp(-dt / 0.12)); if (Math.abs(Xn() - S.xd) < 1e-6) S.xd = Xn(); },
    draw(ctx, W, H) {
      readouts();
      const L = layout(W, H), sr = L.s, gr = L.g;
      line(ctx, W >= 600 ? sr.w + 0.5 : 0, W >= 600 ? 0 : sr.h + 0.5, W >= 600 ? sr.w + 0.5 : W, W >= 600 ? H : sr.h + 0.5, CUR.line, 1);
      // ---- spring panel ----
      const cx = Math.round(sr.x + sr.w * 0.46), barY = sr.y + 16, Ln = 56, yN = barY + 10 + Ln;
      const avail = sr.h - (16 + 10 + Ln) - 126;
      const ncm = niceCeil(xOf(4 * g, S.k) * 100);
      const scale = avail / ncm; // px per cm
      const yM = yN + S.xd * 100 * scale;
      ctx.fillStyle = CUR.ink3; ctx.fillRect(cx - 46, barY, 92, 8);
      for (let i = -44; i < 46; i += 8) line(ctx, cx + i, barY, cx + i - 5, barY - 6, CUR.ink3, 1.5);
      spring(ctx, cx, barY + 8, yM, 10, 11, over() ? CUR.stop : CUR.ink2, 2);
      line(ctx, cx - 54, yN, cx + 66, yN, CUR.ink3, 1, [4, 3]);
      txt(ctx, 'x = 0', cx - 54, yN - 4, { size: 11, mono: true, align: 'right', color: CUR.ink3 });
      dot(ctx, cx, yM, 3.5, CUR.ink2);
      if (S.m > 0) {
        const bw = 42 + 8 * S.m;
        ctx.fillStyle = CUR.sunk; ctx.strokeStyle = CUR.ink2; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.rect(cx - bw / 2, yM + 6, bw, 34); ctx.fill(); ctx.stroke();
        txt(ctx, fmt(S.m, 1) + ' kg', cx, yM + 28, { size: 12, mono: true, align: 'center', color: CUR.ink, halo: false, bold: true });
        const la = 6 + Math.min(Fn(), 40) * 1.1;
        arrow(ctx, cx, yM + 44, cx, yM + 44 + la, CUR.mag, 2.5);
        txt(ctx, 'F = m·g = ' + fmt(Fn(), 1) + ' N', cx, yM + 44 + la + 15, { size: 11, mono: true, align: 'center', color: CUR.mag });
      }
      // ruler
      const rx = cx + 62;
      ctx.fillStyle = CUR.sunk; ctx.fillRect(rx, yN, 24, ncm * scale);
      ctx.strokeStyle = CUR.ink3; ctx.lineWidth = 1; ctx.strokeRect(rx + 0.5, yN + 0.5, 24, ncm * scale);
      let st = 1; for (const c of [1, 2, 5, 10, 20, 25, 50]) { st = c; if (c * scale >= 20) break; }
      for (let v = 0; v <= ncm + 1e-9; v += st) {
        const yy = yN + v * scale;
        line(ctx, rx, yy, rx + 11, yy, CUR.ink3, 1);
        txt(ctx, String(v), rx + 28, yy + 4, { size: 11, mono: true, color: CUR.ink3 });
      }
      txt(ctx, 'cm', rx + 12, yN - 6, { size: 11, mono: true, align: 'center', color: CUR.ink3 });
      if (S.xd > 0.0005) {
        line(ctx, rx + 3, yN, rx + 3, yM, CUR.mag, 4);
        txt(ctx, 'x = ' + fmt(S.xd * 100, 1) + ' cm', cx - 50, yN + Math.max(15, (yM - yN) / 2), { size: 11, mono: true, align: 'right', color: CUR.mag, bold: true });
      }
      // ---- graph panel ----
      const pad = { l: 48, r: 18, t: 28, b: 40 };
      const px = gr.x + pad.l, py = gr.y + pad.t, pw = gr.w - pad.l - pad.r, ph = gr.h - pad.t - pad.b;
      const xmax = niceCeil(xOf(40, S.k)), Fmax = 40;
      const X = (xc) => px + xc / xmax * pw, Y = (F) => py + ph - F / Fmax * ph;
      paper(ctx, px, py, pw, ph);
      const xLim = xOf(FLIM, S.k);
      ctx.save(); ctx.globalAlpha = 0.09; ctx.fillStyle = CUR.stop; ctx.fillRect(X(xLim), py, px + pw - X(xLim), ph); ctx.restore();
      line(ctx, px, py + ph, px + pw, py + ph, CUR.ink3, 1.5); line(ctx, px, py, px, py + ph, CUR.ink3, 1.5);
      for (let F = 0; F <= Fmax; F += 10) { txt(ctx, String(F), px - 6, Y(F) + 4, { size: 11, mono: true, align: 'right', color: CUR.ink3 }); line(ctx, px - 3, Y(F), px, Y(F), CUR.ink3, 1); }
      const xs = niceStep(xmax, 5);
      for (let v = 0; v <= xmax + 1e-9; v += xs) { txt(ctx, fmt(v, 2), X(v), py + ph + 15, { size: 11, mono: true, align: 'center', color: CUR.ink3 }); line(ctx, X(v), py + ph, X(v), py + ph + 3, CUR.ink3, 1); }
      txt(ctx, 'F (N)', gr.x + 8, gr.y + 16, { size: 12, color: CUR.ink2, bold: true });
      txt(ctx, 'extension x (m)', px + pw, py + ph + 32, { size: 12, align: 'right', color: CUR.ink2, bold: true });
      // lines
      ctx.save(); ctx.beginPath(); ctx.rect(px, py - 2, pw + 2, ph + 4); ctx.clip();
      line(ctx, X(xLim), Y(FLIM), X(40 / S.k), Y(40), CUR.ink3, 1.5, [5, 4]);
      ctx.strokeStyle = CUR.blue; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(xLim), Y(FLIM)); ctx.stroke();
      ctx.strokeStyle = CUR.stop; ctx.beginPath(); ctx.moveTo(X(xLim), Y(FLIM));
      for (let F = FLIM; F <= 40.001; F += 0.5) ctx.lineTo(X(xOf(F, S.k)), Y(F));
      ctx.stroke(); ctx.restore();
      dot(ctx, X(xLim), Y(FLIM), 4, CUR.card, CUR.ink2);
      txt(ctx, 'elastic limit', X(xLim) - 8, Y(FLIM) - 7, { size: 11, align: 'right', color: CUR.ink2 });
      txt(ctx, 'slope = k = ' + S.k + ' N/m', X(xLim * 0.42) + 12, Y(FLIM * 0.42) + 4, { size: 12, mono: true, color: CUR.blue, bold: true });
      if (S.m > 0) {
        const cxp = X(Xn()), cyp = Y(Fn());
        line(ctx, cxp, cyp, cxp, py + ph, CUR.mag, 1, [3, 3]); line(ctx, px, cyp, cxp, cyp, CUR.mag, 1, [3, 3]);
        dot(ctx, cxp, cyp, 6, CUR.mag, CUR.card);
      }
      if (over()) txt(ctx, 'Hooke’s law no longer holds here', px + pw - 6, py + ph - 8, { size: 11, align: 'right', color: CUR.stop, bold: true });
    }
  };
}

/* =====================================================================
   2. OSCILLATOR (damping)
   ===================================================================== */
function simOscillator(api) {
  const o = api.opts, Tw = 5;
  const S = { r: o.r || 40, f: o.f || 1.22, damp: o.damping != null ? clamp(Math.round(o.damping), 0, 5) : 0, mode: o.start === 'sin' ? 'sin' : 'cos', t: 0, laps: [] };
  const T = () => 1 / S.f, w = () => TAU * S.f, delta = () => dampDelta(S.damp, T());
  const phi0 = () => (S.mode === 'cos' ? 0 : Math.PI / 2);
  const yAt = (t) => S.r * Math.exp(-delta() * t) * (S.mode === 'cos' ? Math.cos(w() * t) : Math.sin(w() * t));
  const ampAt = (t) => S.r * Math.exp(-delta() * t);

  api.caption('Watch the <b>amplitude shrink</b> when damping is on, while the time between tops (T) stays the same. Tap “Lap” at each top to measure T yourself.');
  api.label('A mass bouncing on a spring beside a scrolling y against t graph.');
  const set = api.readouts([['T', 'Period T'], ['f', 'Frequency f'], ['w', 'Angular velocity ω'], ['y', 'Elongation y'], ['a', 'Amplitude now'], ['t', 'Time t']]);

  function restart() { S.t = 0; S.laps = []; renderLaps(); api.draw(); }
  api.slider({ key: 'r', label: 'Amplitude <i>r</i>', min: 5, max: 40, step: 1, value: S.r, unit: 'cm', onInput: (v) => { S.r = v; restart(); } });
  api.slider({ key: 'f', label: 'Frequency <i>f</i>', min: 0.5, max: 2.0, step: 0.01, value: S.f, unit: 'Hz', dp: 2, onInput: (v) => { S.f = v; restart(); } });
  api.slider({ key: 'd', label: 'Damping', min: 0, max: 5, step: 1, value: S.damp, fmt: (v) => v === 0 ? '0 (none)' : v + '  (×' + DAMP_Q[v].toFixed(2) + ' per half-swing)', onInput: (v) => { S.damp = v; restart(); } });
  api.select({ key: 'start', label: 'Start', options: [['cos', 'start at top (cos)'], ['sin', 'start at rest position (sin)']], value: S.mode, onChange: (v) => { S.mode = v; restart(); } });

  const lapBtn = api.btn('Lap (tap at each top)', () => { S.laps.push(S.t); renderLaps(); api.draw(); }, { id: 'lap' });
  api.btn('Clear laps', () => { S.laps = []; renderLaps(); api.draw(); }, { id: 'lapclr' });
  const lapBox = h('div'); api.extra.appendChild(lapBox);
  function renderLaps() {
    if (!S.laps.length) { lapBox.innerHTML = '<p class="sims-note">Measure helper: press “Lap” each time the mass is at the top. The time between taps is the period T.</p>'; return; }
    let s = '<div class="sims-h">Your taps</div><ul class="sims-list">';
    const L = S.laps.slice(-8), off = S.laps.length - L.length;
    L.forEach((t, i) => {
      const k = off + i, d = k > 0 ? S.laps[k] - S.laps[k - 1] : null;
      s += '<li>tap ' + (k + 1) + ': t = ' + fmt(t, 2) + ' s' + (d != null ? '  (time since last tap = ' + fmt(d, 2) + ' s)' : '') + '</li>';
    });
    s += '</ul>';
    if (S.laps.length >= 2) {
      const mean = (S.laps[S.laps.length - 1] - S.laps[0]) / (S.laps.length - 1);
      s += '<p class="sims-note">Mean time between taps: <b>' + fmt(mean, 2) + ' s</b>. If you tapped at every top this is your measured T (the true T is ' + fmt(T(), 2) + ' s).</p>';
    }
    lapBox.innerHTML = s;
  }
  renderLaps();

  return {
    height(W) { return W < 520 ? 330 : clamp(W * 0.52, 320, 400); },
    reset() { S.t = 0; S.laps = []; renderLaps(); },
    step(dt) { S.t += dt; },
    draw(ctx, W, H) {
      const t = S.t, d = delta();
      set('T', fmt(T(), 2) + ' s'); set('f', fmt(S.f, 2) + ' Hz'); set('w', fmt(w(), 2) + ' rad/s');
      set('y', fmt(yAt(t), 1) + ' cm'); set('a', fmt(ampAt(t), 1) + ' cm'); set('t', fmt(t, 2) + ' s');
      const sw = Math.round(clamp(W * 0.22, 84, 150)), cy = H / 2, ppc = (H / 2 - 54) / 42;
      const Y = (v) => cy - v * ppc;
      // spring panel
      const cxs = sw / 2;
      line(ctx, sw + 0.5, 0, sw + 0.5, H, CUR.line, 1);
      ctx.fillStyle = CUR.ink3; ctx.fillRect(cxs - 28, 8, 56, 7);
      const yM = Y(yAt(t));
      spring(ctx, cxs, 15, yM - 12, 9, 10, CUR.ink2, 2);
      ctx.fillStyle = CUR.sunk; ctx.strokeStyle = CUR.ink2; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(cxs - 20, yM - 12, 40, 24); ctx.fill(); ctx.stroke();
      line(ctx, 4, cy, sw - 4, cy, CUR.ink3, 1, [4, 3]);
      txt(ctx, 'rest position', 6, cy - 5, { size: 10, color: CUR.ink3 });
      // graph
      const px = sw + 40, pw = W - sw - 40 - 12, top = Y(42), bot = Y(-42), ph = bot - top;
      const t0 = Math.max(0, t - Tw), X = (tt) => px + (tt - t0) / Tw * pw;
      paper(ctx, px, top, pw, ph);
      ctx.save(); ctx.beginPath(); ctx.rect(px, top - 2, pw, ph + 4); ctx.clip();
      for (let k = Math.ceil(t0 / 0.5 - 1e-9); k <= Math.floor((t0 + Tw) / 0.5 + 1e-9); k++) {
        line(ctx, Math.round(X(k * 0.5)) + 0.5, top, Math.round(X(k * 0.5)) + 0.5, bot, CUR.line, 1);
      }
      ctx.restore();
      [-40, -20, 0, 20, 40].forEach((v) => { line(ctx, px, Y(v), px + pw, Y(v), v === 0 ? CUR.ink3 : CUR.line, v === 0 ? 1.5 : 1); txt(ctx, fmt(v, 0), px - 6, Y(v) + 4, { size: 11, mono: true, align: 'right', color: CUR.ink3 }); });
      for (let k = Math.ceil(t0 - 1e-9); k <= Math.floor(t0 + Tw + 1e-9); k++) txt(ctx, String(k), X(k), bot + 15, { size: 11, mono: true, align: 'center', color: CUR.ink3 });
      line(ctx, px, top, px, bot, CUR.ink3, 1.5);
      txt(ctx, 'y (cm)', sw + 8, top - 8, { size: 12, bold: true });
      txt(ctx, 't (s)', px + pw, bot + 32, { size: 12, bold: true, align: 'right' });
      // r guide
      line(ctx, px, Y(S.r), px + pw, Y(S.r), CUR.ink3, 1, [2, 4]); line(ctx, px, Y(-S.r), px + pw, Y(-S.r), CUR.ink3, 1, [2, 4]);
      ctx.save(); ctx.beginPath(); ctx.rect(px, top - 2, pw + 1, ph + 4); ctx.clip();
      // envelope
      if (S.damp > 0) {
        ctx.strokeStyle = CUR.bright; ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]);
        for (const sg of [1, -1]) {
          ctx.beginPath();
          for (let i = 0; i <= pw; i += 3) { const tt = t0 + i / pw * Tw; if (tt > t) break; const yy = Y(sg * ampAt(tt)); i ? ctx.lineTo(px + i, yy) : ctx.moveTo(px + i, yy); }
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      // curve
      ctx.strokeStyle = CUR.blue; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i <= pw; i += 2) { const tt = t0 + i / pw * Tw; if (tt > t) break; const yy = Y(yAt(tt)); i ? ctx.lineTo(px + i, yy) : ctx.moveTo(px + i, yy); }
      ctx.stroke();
      // laps
      S.laps.forEach((lt, i) => { if (lt >= t0 && lt <= t0 + Tw) { line(ctx, X(lt), top, X(lt), bot, CUR.mag, 1.2, [3, 3]); txt(ctx, String(i + 1), X(lt), top + 12, { size: 10, mono: true, align: 'center', color: CUR.mag }); } });
      // turning points
      const eps = Math.atan(d / w()), pts = [];
      if (S.mode === 'cos' && d > 0) pts.push({ n: 0, t: 0 });
      const nmin = Math.floor((w() * t0 - phi0() + eps) / Math.PI) - 1, nmax = Math.ceil((w() * (t0 + Tw) - phi0() + eps) / Math.PI) + 1;
      for (let nn = nmin; nn <= nmax; nn++) {
        const tn = (phi0() - eps + nn * Math.PI) / w();
        if (tn >= -1e-9 && !(S.mode === 'cos' && d > 0 && Math.abs(tn) < 1e-6)) pts.push({ n: nn + 1, t: tn });
      }
      const spacing = (Math.PI / w()) / Tw * pw, stride = Math.max(1, Math.ceil(36 / spacing));
      pts.forEach((p) => {
        if (p.t > t || p.t < t0 - 1e-9) return;
        const yy = yAt(p.t), sx = X(p.t), sy = Y(yy);
        dot(ctx, sx, sy, 3.6, CUR.mag, CUR.card);
        if (p.n % stride === 0) txt(ctx, fmt(p.t, 2), sx, yy >= 0 ? sy - 8 : sy + 16, { size: 10, mono: true, align: 'center', color: CUR.mag });
      });
      ctx.restore();
      // now
      const nx = X(Math.min(t, t0 + Tw)), ny = Y(yAt(t));
      line(ctx, cxs + 20, ny, nx, ny, CUR.mag, 1, [2, 4]);
      dot(ctx, nx, ny, 5, CUR.bright, CUR.card);
      // equation
      const trig = S.mode === 'cos' ? 'cos' : 'sin';
      txt(ctx, S.damp > 0 ? 'y = (shrinking r) · ' + trig + '(ω·t)' : 'y = r·' + trig + '(ω·t)', px, 16, { size: 13, mono: true, color: CUR.ink, bold: true });
      txt(ctx, S.damp > 0 ? 'amplitude ×' + DAMP_Q[S.damp].toFixed(2) + ' each half-swing; T stays ' + fmt(T(), 2) + ' s' : 'no damping: amplitude stays r = ' + S.r + ' cm', px, 32, { size: 11 });
      txt(ctx, 'dots: turning points (time in s)', px + pw, top - 8, { size: 10, align: 'right', color: CUR.mag });
    }
  };
}

/* =====================================================================
   3. UNIT CIRCLE
   ===================================================================== */
function simCircle(api) {
  const o = api.opts;
  const S = { T: o.T || 4, mode: o.mode === 'cos' ? 'cos' : 'sin', t: 0 };
  const w = () => TAU / S.T, a0 = () => (S.mode === 'cos' ? Math.PI / 2 : 0), alpha = () => a0() + w() * S.t;

  api.caption('The point goes round the circle at constant ω. Its <b>height y</b> (magenta) plotted against time is the oscillation. Use “Step 1/8 turn” to see 45° = π/4 rad at a time.');
  api.label('A point moving round a circle, a ball moving up and down at the same height, and the y against t graph.');
  const set = api.readouts([['wt', 'ω·t (angle turned since t = 0)', true], ['a', 'Angle of the point (α)', true], ['y', 'Height y'], ['t', 'Time t'], ['f', 'f = 1/T'], ['w', 'ω = 2π/T']]);

  function restart() { S.t = 0; api.draw(); }
  api.slider({ key: 'T', label: 'Period <i>T</i>', min: 1, max: 8, step: 0.1, value: S.T, unit: 's', dp: 1, onInput: (v) => { S.T = v; restart(); } });
  api.select({ key: 'mode', label: 'Formula', options: [['sin', 'sin: y = r·sin(ωt), start at y = 0'], ['cos', 'cos: y = r·cos(ωt), start at the top y = r']], value: S.mode, onChange: (v) => { S.mode = v; restart(); } });
  api.btn('Step 1/8 turn (45°)', () => { api.setRunning(false); S.t += S.T / 8; api.draw(); }, { id: 'step' });

  function lay(W, H) {
    if (W >= 560) {
      const cw = W * 0.36, bw = W * 0.14, cy = H / 2, R = Math.min(cw / 2 - 28, H / 2 - 44);
      return { wide: true, cx: cw / 2, cy, R, bx: cw + bw / 2, g: { x: W * 0.5, y: 0, w: W * 0.5, h: H }, cyG: cy, RG: R };
    }
    const top = 214, R = Math.min(W * 0.32 - 24, 78), gh = H - top;
    return { wide: false, cx: W * 0.32, cy: top / 2, R, bx: W * 0.82, g: { x: 0, y: top, w: W, h: gh }, cyG: top + gh / 2 - 6, RG: (gh - 64) / 2 };
  }
  function angText(ang, prefix) {
    const deg = ((ang * 180 / Math.PI) % 360 + 360) % 360;
    const d = Math.round(deg) % 360, rad = deg * Math.PI / 180;
    const near = Math.abs(deg / 15 - Math.round(deg / 15)) < 0.03;
    if (near) { const dd = Math.round(deg / 15) * 15 % 360; return prefix + ' = ' + dd + '° = ' + frac(dd) + ' rad ≈ ' + fmt(dd * Math.PI / 180, 2) + ' rad'; }
    return prefix + ' = ' + d + '° ≈ ' + fmt(rad, 2) + ' rad';
  }
  function alphaText() { return S.mode === 'cos' ? angText(alpha(), 'angle of the point = ω·t + 90°') : angText(alpha(), 'α = ω·t'); }

  return {
    height(W) { return W >= 560 ? clamp(W * 0.42, 280, 340) : 430; },
    reset() { S.t = 0; },
    step(dt) { S.t += dt; },
    draw(ctx, W, H) {
      const L = lay(W, H), al = alpha(), sa = Math.sin(al), ca = Math.cos(al);
      set('wt', angText(w() * S.t, 'ω·t')); set('a', alphaText()); set('y', fmt(sa, 2) + ' r'); set('t', fmt(S.t, 2) + ' s'); set('f', fmt(1 / S.T, 3) + ' Hz'); set('w', fmt(w(), 2) + ' rad/s');
      const { cx, cy, R } = L;
      // circle
      paper(ctx, cx - R - 22, cy - R - 22, 2 * R + 44, 2 * R + 44);
      line(ctx, cx - R - 14, cy, cx + R + 14, cy, CUR.ink3, 1); line(ctx, cx, cy - R - 14, cx, cy + R + 14, CUR.ink3, 1);
      ctx.strokeStyle = CUR.ink2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      const Px = cx + R * ca, Py = cy - R * sa;
      // triangle
      line(ctx, cx, cy, Px, cy, CUR.ink3, 2);
      line(ctx, Px, cy, Px, Py, CUR.mag, 4.5);
      line(ctx, cx, cy, Px, Py, CUR.bright, 2.5);
      // angle arc
      const am = ((al % TAU) + TAU) % TAU, ar = Math.min(26, R * 0.35);
      ctx.strokeStyle = CUR.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, ar, 0, -am, true); ctx.stroke();
      if (am > 0.35 && am < TAU - 0.1) txt(ctx, 'α', cx + (ar + 12) * Math.cos(am / 2), cy - (ar + 12) * Math.sin(am / 2) + 4, { size: 13, color: CUR.accent, align: 'center', bold: true });
      dot(ctx, Px, Py, 6, CUR.bright, CUR.card);
      if (Math.abs(sa) > 0.12) txt(ctx, 'y', Px + (ca >= 0 ? 9 : -9), (Py + cy) / 2 + 4, { size: 13, color: CUR.mag, align: ca >= 0 ? 'left' : 'right', bold: true });
      // r label
      const mx = (cx + Px) / 2, my = (cy + Py) / 2; let nx = sa, ny = ca; const sg = sa * ca;
      if (Math.abs(sg) < 0.05) { nx = 0; ny = -1; } else if (sg > 0) { nx = -nx; ny = -ny; }
      txt(ctx, 'r', mx + nx * 11, my + ny * 11 + 4, { size: 13, color: CUR.accent, align: 'center', bold: true });
      txt(ctx, 'circle: r', cx, cy + R + 28, { size: 11, align: 'center', color: CUR.ink3 });
      // ball panel
      const bx = L.bx;
      line(ctx, bx, 14, bx, L.cy * 2 > H ? H : (L.wide ? H - 20 : 208), CUR.line, 1);
      const topB = L.wide ? 10 : 8;
      ctx.fillStyle = CUR.ink3; ctx.fillRect(bx - 20, topB, 40, 6);
      const yb = cy - R * sa;
      spring(ctx, bx, topB + 6, yb - 10, 8, 8, CUR.ink2, 2);
      dot(ctx, bx, yb, 10, CUR.bright, CUR.ink2);
      line(ctx, bx - 22, cy, bx + 22, cy, CUR.ink3, 1, [4, 3]);
      txt(ctx, 'rest', bx + 24, cy + 4, { size: 10, color: CUR.ink3 });
      line(ctx, bx - 14, cy - R, bx + 14, cy - R, CUR.line, 1); line(ctx, bx - 14, cy + R, bx + 14, cy + R, CUR.line, 1);
      line(ctx, bx, cy, bx, yb, CUR.mag, 3.5);
      // graph
      const g = L.g, px = g.x + 42, pw = g.w - 42 - 14, cyG = L.cyG, RG = L.RG, topG = cyG - RG - 14, botG = cyG + RG + 14;
      const Tw = 2 * S.T, t0 = Math.max(0, S.t - Tw), X = (tt) => px + (tt - t0) / Tw * pw, Y = (v) => cyG - v * RG;
      paper(ctx, px, topG, pw, botG - topG);
      const stp = S.T / 4;
      for (let k = Math.ceil(t0 / stp - 1e-9); k <= Math.floor((t0 + Tw) / stp + 1e-9); k++) {
        const xx = X(k * stp);
        line(ctx, Math.round(xx) + 0.5, topG, Math.round(xx) + 0.5, botG, CUR.line, 1);
        if (k % 2 === 0) txt(ctx, fmt(k * stp, S.T < 2 ? 1 : (Math.abs(k * stp % 1) < 1e-6 ? 0 : 1)), xx, botG + 14, { size: 11, mono: true, align: 'center', color: CUR.ink3 });
      }
      line(ctx, px, cyG, px + pw, cyG, CUR.ink3, 1.5); line(ctx, px, topG, px, botG, CUR.ink3, 1.5);
      [['+r', 1], ['0', 0], ['−r', -1]].forEach((p) => txt(ctx, p[0], px - 6, Y(p[1]) + 4, { size: 11, mono: true, align: 'right', color: CUR.ink3 }));
      line(ctx, px, Y(1), px + pw, Y(1), CUR.line, 1, [3, 3]); line(ctx, px, Y(-1), px + pw, Y(-1), CUR.line, 1, [3, 3]);
      txt(ctx, 't (s)', px + pw, botG + 30, { size: 12, align: 'right', bold: true });
      txt(ctx, 'y', g.x + 10, topG - 2, { size: 12, bold: true });
      txt(ctx, S.mode === 'cos' ? 'y = r·cos(ω·t)' : 'y = r·sin(ω·t)', px + 4, topG - 2, { size: 13, mono: true, color: CUR.ink, bold: true });
      ctx.save(); ctx.beginPath(); ctx.rect(px, topG - 2, pw + 1, botG - topG + 4); ctx.clip();
      ctx.strokeStyle = CUR.blue; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i <= pw; i += 2) { const tt = t0 + i / pw * Tw; if (tt > S.t) break; const yy = Y(Math.sin(a0() + w() * tt)); i ? ctx.lineTo(px + i, yy) : ctx.moveTo(px + i, yy); }
      ctx.stroke();
      // period marker
      if (S.T >= t0 && S.T <= t0 + Tw) { line(ctx, X(S.T), topG, X(S.T), botG, CUR.accent, 1.2, [4, 3]); }
      ctx.restore();
      if (S.T >= t0 && S.T <= t0 + Tw) txt(ctx, 'T', X(S.T) + 4, botG - 4, { size: 12, color: CUR.accent, bold: true });
      const gx = X(Math.min(S.t, t0 + Tw)), gy = Y(sa);
      if (L.wide) line(ctx, Px, Py, gx, gy, CUR.mag, 1, [2, 4]); else line(ctx, bx, yb, bx, yb, CUR.mag, 1);
      dot(ctx, gx, gy, 5, CUR.bright, CUR.card);
    }
  };
}

/* =====================================================================
   4. PENDULUM
   ===================================================================== */
function simPendulum(api) {
  const o = api.opts;
  const PL = [['earth', 'Earth', 9.81], ['moon', 'Moon', 1.62], ['mars', 'Mars', 3.71], ['jup', 'Jupiter', 24.79], ['x', 'Planet X (mystery)', null]];
  const gx = Math.round((12 + Math.random() * 4) * 100) / 100; // hidden, chosen once per mount
  const S = { l: o.l || 1.0, m: o.m || 1.0, a0: o.angle || 10, pid: o.planet || 'earth', th: 0, om: 0, t: 0, acc: 0, sw: null, revealed: false };
  const gNow = () => (S.pid === 'x' ? gx : PL.find((p) => p[0] === S.pid)[2]);
  const HSTEP = 1 / 500;

  api.caption('Time the swings with the stopwatch. Does the mass change the period? Try it. Does the length? The formula T = 2π√(l/g) works for <b>small angles</b>.');
  api.label('A pendulum with a protractor scale, controls for length, mass, start angle and planet, and a stopwatch.');
  const set = api.readouts([['g', 'g'], ['Tf', 'T from formula'], ['Tm', 'T from your stopwatch'], ['th', 'Angle now θ']]);
  const swEl = h('p', 'sims-fb'); api.box.after(swEl);
  swEl.setAttribute('aria-live', 'polite');

  function restart() { S.th = S.a0 * Math.PI / 180; S.om = 0; S.t = 0; S.acc = 0; S.sw = null; timeBtn.textContent = 'Start timing'; updateSW(); api.draw(); }
  api.slider({ key: 'l', label: 'Length <i>l</i>', min: 0.1, max: 2.0, step: 0.01, value: S.l, unit: 'm', dp: 2, onInput: (v) => { S.l = v; restart(); } });
  api.slider({ key: 'm', label: 'Mass <i>m</i> (changes the bob size only)', min: 0.1, max: 2.0, step: 0.1, value: S.m, unit: 'kg', dp: 1, onInput: (v) => { S.m = v; api.draw(); } });
  api.slider({ key: 'a', label: 'Start angle', min: 5, max: 30, step: 1, value: S.a0, unit: '°', onInput: (v) => { S.a0 = v; restart(); } });
  api.select({ key: 'pl', label: 'Gravity (planet)', options: PL.map((p) => [p[0], p[0] === 'x' ? p[1] : p[1] + ' — ' + p[2].toFixed(2) + ' m/s²']), value: S.pid, onChange: (v) => { S.pid = v; S.revealed = false; xBox.hidden = v !== 'x'; fb.textContent = ''; fb.className = 'sims-fb'; restart(); } });
  const timeBtn = api.btn('Start timing', () => {
    if (S.sw && S.sw.active) { S.sw.active = false; timeBtn.textContent = 'Start timing'; }
    else { S.sw = S.t === 0 ? { active: true, t0: 0, n: 0, last: 0 } : { active: true, t0: null, n: 0, last: null }; timeBtn.textContent = 'Stop timing'; if (!api.running()) api.setRunning(true); }
    updateSW(); api.draw();
  }, { id: 'sw' });

  // Planet X guess box
  const xBox = h('div'); xBox.hidden = S.pid !== 'x'; api.extra.appendChild(xBox);
  const inl = h('div', 'sims-inline'); xBox.appendChild(inl);
  const gRow = h('div', 'sims-row'); const gLab = h('label', null, '<span class="sims-name">Your g = ___ m/s²</span>'); const gIn = document.createElement('input');
  gIn.type = 'number'; gIn.step = '0.01'; gIn.min = '0'; gIn.id = api.pre + 'gx'; gIn.inputMode = 'decimal'; gLab.htmlFor = gIn.id; gRow.append(gLab, gIn); inl.appendChild(gRow);
  const chk = api.btn('Check', checkG, { parent: inl, id: 'chk' });
  const fb = h('p', 'sims-fb'); fb.setAttribute('aria-live', 'polite'); xBox.appendChild(fb);
  xBox.appendChild(h('p', 'sims-note', 'Planet X has a hidden g. Measure T (time several swings), then use g = 4π²·l / T². The answer counts if it is within 3 %.'));

  function checkG() {
    const v = parseFloat(String(gIn.value).replace(',', '.'));
    if (!isFinite(v) || v <= 0) { fb.className = 'sims-fb bad'; fb.textContent = 'Type a number for g first.'; return; }
    const gEff = 4 * Math.PI * Math.PI * S.l / Math.pow(pendExact(S.l, gx, S.a0), 2); // what a perfect stopwatch would give at this start angle
    if (Math.abs(v - gx) / gx <= 0.03 || Math.abs(v - gEff) / gEff <= 0.03) {
      S.revealed = true;
      const T = measuredT();
      let wk = 'Formula: g = 4π²·l / T².';
      if (T) wk += ' With your stopwatch: g = 4π² × ' + fmt(S.l, 2) + ' m / (' + fmt(T, 2) + ' s)² = ' + fmt(4 * Math.PI * Math.PI * S.l / (T * T), 2) + ' m/s².';
      fb.className = 'sims-fb good'; fb.textContent = 'Correct! The hidden value was g = ' + fmt(gx, 2) + ' m/s². ' + wk;
    } else {
      fb.className = 'sims-fb bad'; fb.textContent = 'Not within 3 %. Check your measurement: time 10 swings, divide by 10 for T, then g = 4π²·l / T² (l in metres).';
    }
  }
  function measuredT() { const s = S.sw; return s && s.n >= 1 ? (s.last - s.t0) / s.n : null; }
  function updateSW() {
    const s = S.sw;
    if (!s) swEl.textContent = 'Stopwatch: press “Start timing”. It starts when the bob reaches the far right and counts each full swing back to the right.';
    else if (s.t0 == null) swEl.textContent = 'Waiting for the bob to reach the far-right turning point…';
    else if (s.n === 0) swEl.textContent = 'Timing… 0 swings so far.';
    else swEl.textContent = s.n + ' swing' + (s.n > 1 ? 's' : '') + ' in ' + fmt(s.last - s.t0, 2) + ' s → T = t/n = ' + fmt((s.last - s.t0) / s.n, 3) + ' s' + (s.n < 10 && s.active ? '   (more swings = more accurate; try 10)' : '');
  }
  restart();

  return {
    height(W) { return W < 520 ? 340 : clamp(W * 0.6, 340, 430); },
    reset() { restart(); },
    step(dt) {
      S.acc += dt;
      let cnt = 0;
      while (S.acc >= HSTEP && cnt++ < 60) {
        const g = gNow(), prevOm = S.om;
        const r = pendRK4(S.th, S.om, g, S.l, HSTEP);
        S.th = r[0]; S.om = r[1];
        if (prevOm > 0 && S.om <= 0) {
          const te = S.t + HSTEP * prevOm / (prevOm - S.om);
          const s = S.sw;
          if (s && s.active) { if (s.t0 == null) { s.t0 = te; s.n = 0; } else { s.n++; s.last = te; } updateSW(); }
        }
        S.t += HSTEP; S.acc -= HSTEP;
      }
      if (S.acc > HSTEP) S.acc = 0;
    },
    draw(ctx, W, H) {
      const g = gNow(), known = S.pid !== 'x', T0 = TAU * Math.sqrt(S.l / g);
      set('g', known || S.revealed ? fmt(g, 2) + ' m/s²' : '? (hidden)');
      set('Tf', known ? fmt(T0, 2) + ' s  (f = ' + fmt(1 / T0, 2) + ' Hz)' : '— (find g first)');
      const mt = measuredT(); set('Tm', mt ? fmt(mt, 3) + ' s' : '—');
      set('th', fmt(S.th * 180 / Math.PI, 1) + '°');
      if (S.sw && S.sw.active && S.sw.t0 != null && S.sw.n === 0) updateSW();
      const pxv = W / 2, pyv = 34, sc = (H - pyv - 30 - 22) / 2.0, Lp = S.l * sc;
      const rb = 6 + 8 * Math.sqrt(S.m / 2);
      // support
      ctx.fillStyle = CUR.ink3; ctx.fillRect(pxv - 44, pyv - 10, 88, 8);
      for (let i = -42; i < 44; i += 9) line(ctx, pxv + i, pyv - 10, pxv + i - 5, pyv - 16, CUR.ink3, 1.5);
      // protractor
      const Rp = clamp(Lp + rb + 10, 56, 88);
      line(ctx, pxv, pyv, pxv, pyv + Math.max(Lp + rb + 6, Rp + 6), CUR.ink3, 1, [4, 3]);
      ctx.strokeStyle = CUR.ink3; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(pxv, pyv, Rp, Math.PI / 2 - 35 * Math.PI / 180, Math.PI / 2 + 35 * Math.PI / 180); ctx.stroke();
      for (let a = -35; a <= 35; a += 5) {
        const aa = Math.PI / 2 - a * Math.PI / 180, big = a % 10 === 0, r2 = Rp + (big ? 8 : 4);
        line(ctx, pxv + Rp * Math.cos(aa), pyv + Rp * Math.sin(aa), pxv + r2 * Math.cos(aa), pyv + r2 * Math.sin(aa), CUR.ink3, 1);
        if (a % 10 === 0 && a !== 0 && Math.abs(a) <= 30) txt(ctx, Math.abs(a) + '°', pxv + (Rp + 20) * Math.cos(aa), pyv + (Rp + 20) * Math.sin(aa) + 4, { size: 10, mono: true, align: 'center', color: CUR.ink3 });
      }
      // path of the bob
      ctx.strokeStyle = CUR.line; ctx.lineWidth = 1.5; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.arc(pxv, pyv, Lp, Math.PI / 2 - S.a0 * Math.PI / 180, Math.PI / 2 + S.a0 * Math.PI / 180); ctx.stroke(); ctx.setLineDash([]);
      // start-angle arc and ghost rod
      const a0r = S.a0 * Math.PI / 180, ra = Math.min(46, Math.max(24, Lp * 0.5));
      line(ctx, pxv, pyv, pxv + Lp * Math.sin(a0r), pyv + Lp * Math.cos(a0r), CUR.ink3, 1, [3, 3]);
      ctx.strokeStyle = CUR.accent; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(pxv, pyv, ra, Math.PI / 2 - a0r, Math.PI / 2); ctx.stroke();
      txt(ctx, 'θ₀ = ' + S.a0 + '°', pxv + ra + 6, pyv + ra * 0.6 + 8, { size: 12, mono: true, color: CUR.accent, bold: true });
      // length dimension
      const dxm = pxv - Rp - 30;
      line(ctx, dxm, pyv, dxm, pyv + Lp, CUR.blue, 1.5); line(ctx, dxm - 4, pyv, dxm + 4, pyv, CUR.blue, 1.5); line(ctx, dxm - 4, pyv + Lp, dxm + 4, pyv + Lp, CUR.blue, 1.5);
      ctx.save(); ctx.translate(dxm - 6, pyv + Math.max(Lp / 2, 40)); ctx.rotate(-Math.PI / 2);
      txt(ctx, 'l = ' + fmt(S.l, 2) + ' m', 0, 0, { size: 12, mono: true, align: 'center', color: CUR.blue, bold: true });
      ctx.restore();
      // rod and bob
      const bxp = pxv + Lp * Math.sin(S.th), byp = pyv + Lp * Math.cos(S.th);
      line(ctx, pxv, pyv, bxp, byp, CUR.ink, 2.5);
      dot(ctx, pxv, pyv, 3.5, CUR.ink);
      ctx.beginPath(); ctx.arc(bxp, byp, rb, 0, TAU); ctx.fillStyle = CUR.bright; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = CUR.ink; ctx.stroke();
      txt(ctx, 'bob: ' + fmt(S.m, 1) + ' kg', bxp, byp + rb + 14, { size: 10, mono: true, align: 'center', color: CUR.ink3 });
      txt(ctx, 't = ' + fmt(S.t, 2) + ' s', W - 10, 20, { size: 12, mono: true, align: 'right', color: CUR.ink2 });
      txt(ctx, known ? 'g = ' + fmt(g, 2) + ' m/s²' : 'g = ?', 10, 20, { size: 12, mono: true, color: CUR.ink2 });
      txt(ctx, 'formula is for small angles', W - 10, H - 10, { size: 11, align: 'right', color: CUR.ink3 });
    }
  };
}

/* =====================================================================
   5. RESONANCE
   ===================================================================== */
function simResonance(api) {
  const o = api.opts;
  const ZETA = { weak: 0.055, medium: 0.125, strong: 0.2 };
  const S = { f0: o.f0 || 1.0, fd: o.fd || 0.5, damp: o.damping && ZETA[o.damping] ? o.damping : 'weak', x: 0, v: 0, ph: 0, acc: 0, buf: [], fmax: 0, big: false };
  const Ad = 1; // driver amplitude, cm
  const HS = 1 / 200;

  api.caption('Move f<sub>d</sub> close to the natural frequency and watch the amplitude grow. Far below f<sub>0</sub> the mass just follows the driver (about ×1); far above it hardly moves; near f<sub>0</sub> the amplitude is largest (with strong damping the peak sits slightly below f<sub>0</sub>).');
  api.label('A driven spring with mass and a resonance curve of amplitude against driving frequency.');
  const set = api.readouts([['f0', 'Natural frequency f₀'], ['fd', 'Driving frequency f_d'], ['ratio', 'Ratio f_d / f₀'], ['amp', 'Amplitude (last few cycles)'], ['x', 'Amplitude ÷ driver amplitude']]);
  const s0 = api.slider({ key: 'f0', label: 'Natural frequency <i>f</i><sub>0</sub>', min: 0.5, max: 1.5, step: 0.01, value: S.f0, unit: 'Hz', dp: 2, onInput: (v) => { S.f0 = v; api.draw(); } });
  const sd = api.slider({ key: 'fd', label: 'Driving frequency <i>f</i><sub>d</sub>', min: 0.2, max: 2.0, step: 0.01, value: S.fd, unit: 'Hz', dp: 2, onInput: (v) => { S.fd = v; api.draw(); } });
  api.select({ key: 'damp', label: 'Damping', options: [['weak', 'weak'], ['medium', 'medium'], ['strong', 'strong']], value: S.damp, onChange: (v) => { S.damp = v; api.draw(); } });
  api.btn('Set f_d = f₀', () => { S.fd = clamp(Math.round(S.f0 * 100) / 100, 0.2, 2.0); sd.set(S.fd); api.draw(); }, { id: 'match' });

  const s_of = (ph) => Ad * Math.cos(ph);
  function integrate(hh) {
    const w0 = TAU * S.f0, d = ZETA[S.damp] * w0, wd = TAU * S.fd;
    const acc = (x, v, ph) => -2 * d * v - w0 * w0 * (x - s_of(ph));
    const x = S.x, v = S.v, p = S.ph, dph = wd * hh;
    const k1x = v, k1v = acc(x, v, p);
    const k2x = v + 0.5 * hh * k1v, k2v = acc(x + 0.5 * hh * k1x, v + 0.5 * hh * k1v, p + 0.5 * dph);
    const k3x = v + 0.5 * hh * k2v, k3v = acc(x + 0.5 * hh * k2x, v + 0.5 * hh * k2v, p + 0.5 * dph);
    const k4x = v + hh * k3v, k4v = acc(x + hh * k3x, v + hh * k3v, p + dph);
    S.x = x + hh * (k1x + 2 * k2x + 2 * k3x + k4x) / 6;
    S.v = v + hh * (k1v + 2 * k2v + 2 * k3v + k4v) / 6;
    S.ph = p + dph;
  }
  function measured() {
    const win = Math.min(8, 3 / Math.min(S.fd, S.f0)), tn = S.tnow || 0;
    let m = 0;
    for (let i = S.buf.length - 1; i >= 0; i--) { if (tn - S.buf[i][0] > win) break; if (S.buf[i][1] > m) m = S.buf[i][1]; }
    return m;
  }
  S.tnow = 0;

  function lay(W, H) {
    if (W >= 600) { const sw = Math.round(W * 0.36); return { s: { x: 0, y: 0, w: sw, h: H }, c: { x: sw, y: 0, w: W - sw, h: H } }; }
    const sh = 290; return { s: { x: 0, y: 0, w: W, h: sh }, c: { x: 0, y: sh, w: W, h: H - sh } };
  }

  return {
    height(W) { return W >= 600 ? clamp(W * 0.5, 330, 400) : 290 + 250; },
    reset() { S.x = 0; S.v = 0; S.ph = 0; S.acc = 0; S.buf = []; S.tnow = 0; S.fmax = 0; },
    step(dt) {
      S.acc += dt;
      let cnt = 0, mx = S.fmax;
      while (S.acc >= HS && cnt++ < 20) { integrate(HS); S.acc -= HS; S.tnow += HS; const a = Math.abs(S.x); if (a > mx) mx = a; }
      if (S.acc > HS) S.acc = 0;
      S.buf.push([S.tnow, mx]); S.fmax = 0;
      while (S.buf.length > 700) S.buf.shift();
    },
    draw(ctx, W, H) {
      const L = lay(W, H), sr = L.s, cr = L.c;
      const ze = ZETA[S.damp], meas = measured(), steady = resAmp(S.fd, S.f0, ze) * Ad;
      set('f0', fmt(S.f0, 2) + ' Hz'); set('fd', fmt(S.fd, 2) + ' Hz'); set('ratio', fmt(S.fd / S.f0, 2));
      set('amp', fmt(meas, 1) + ' cm'); set('x', '× ' + fmt(meas / Ad, 1));
      if (W >= 600) line(ctx, sr.w + 0.5, 0, sr.w + 0.5, H, CUR.line, 1); else line(ctx, 0, sr.h + 0.5, W, sr.h + 0.5, CUR.line, 1);
      // ---- sim panel ----
      const cx = Math.round(sr.w * 0.5), bar0 = 40, yM0 = Math.round(sr.h * 0.55);
      const halfH = Math.min(yM0 - (bar0 + 62), sr.h - yM0 - 34), ppu = halfH / 10;
      const sNow = s_of(S.ph), yBar = bar0 - sNow * ppu;
      const xpx = S.x * ppu, big = Math.abs(xpx) > halfH, xc = clamp(xpx, -halfH, halfH), yM = yM0 - xc;
      line(ctx, cx - 70, yM0, cx + 70, yM0, CUR.ink3, 1, [4, 3]); txt(ctx, 'rest', cx + 74, yM0 + 4, { size: 10, color: CUR.ink3 });
      ctx.fillStyle = CUR.accent; ctx.beginPath(); ctx.rect(cx - 34, yBar - 8, 68, 16); ctx.fill();
      txt(ctx, 'driver', cx, yBar + 4, { size: 10, align: 'center', color: CUR.accentInk, halo: false, bold: true });
      line(ctx, cx, yBar - 8, cx, 8, CUR.accent, 3);
      spring(ctx, cx, yBar + 8, yM - 13, 9, 11, CUR.ink2, 2);
      ctx.fillStyle = CUR.sunk; ctx.strokeStyle = big ? CUR.stop : CUR.ink2; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(cx - 22, yM - 13, 44, 26); ctx.fill(); ctx.stroke();
      txt(ctx, 'mass', cx, yM + 4, { size: 10, mono: true, align: 'center', color: CUR.ink, halo: false });
      txt(ctx, 'driver moves ±' + Ad + ' cm at f_d', cx, sr.h - 10, { size: 11, align: 'center', color: CUR.ink3 });
      if (big) txt(ctx, 'amplitude too big to draw', cx, sr.h - 28, { size: 12, align: 'center', color: CUR.stop, bold: true });
      // ---- resonance curve ----
      const pad = { l: 44, r: 14, t: 34, b: 42 };
      const px = cr.x + pad.l, py = cr.y + pad.t, pw = cr.w - pad.l - pad.r, ph = cr.h - pad.t - pad.b;
      const FX = (f) => px + (f - 0.2) / 1.8 * pw, AY = (a) => py + ph - Math.min(a, 10.5) / 10.5 * ph;
      paper(ctx, px, py, pw, ph);
      for (let a = 0; a <= 10; a += 2) { line(ctx, px, AY(a), px + pw, AY(a), CUR.line, 1); txt(ctx, String(a), px - 6, AY(a) + 4, { size: 11, mono: true, align: 'right', color: CUR.ink3 }); }
      for (let f = 0.2; f <= 2.001; f += 0.2) { if (W >= 600 || Math.round(f * 10) % 4 === 2 || f > 1.99) txt(ctx, fmt(f, 1), FX(f), py + ph + 15, { size: 11, mono: true, align: 'center', color: CUR.ink3 }); line(ctx, FX(f), py + ph, FX(f), py + ph + 3, CUR.ink3, 1); }
      line(ctx, px, py + ph, px + pw, py + ph, CUR.ink3, 1.5); line(ctx, px, py, px, py + ph, CUR.ink3, 1.5);
      txt(ctx, 'amplitude ÷ driver amplitude (resonance curve)', cr.x + 8, cr.y + 16, { size: 12, bold: true });
      txt(ctx, 'driving frequency f_d (Hz)', px + pw, py + ph + 32, { size: 12, bold: true, align: 'right' });
      ctx.save(); ctx.beginPath(); ctx.rect(px, py - 2, pw + 1, ph + 4); ctx.clip();
      ['weak', 'medium', 'strong'].forEach((nm) => {
        const cur = nm === S.damp;
        ctx.strokeStyle = cur ? CUR.blue : CUR.ink3; ctx.lineWidth = cur ? 3 : 1.2; ctx.globalAlpha = cur ? 1 : 0.65; ctx.beginPath();
        for (let i = 0; i <= pw; i += 2) { const f = 0.2 + i / pw * 1.8, yy = AY(resAmp(f, S.f0, ZETA[nm]) * Ad); i ? ctx.lineTo(px + i, yy) : ctx.moveTo(px + i, yy); }
        ctx.stroke(); ctx.globalAlpha = 1;
      });
      ctx.restore();
      ['weak', 'medium', 'strong'].forEach((nm) => {
        const fp = S.f0 * Math.sqrt(Math.max(0.01, 1 - 2 * ZETA[nm] * ZETA[nm])), ap = resAmp(fp, S.f0, ZETA[nm]) * Ad;
        if (fp < 1.4) txt(ctx, nm, FX(fp) + 8, AY(ap) + 3, { size: 11, color: nm === S.damp ? CUR.blue : CUR.ink3, bold: nm === S.damp });
        else txt(ctx, nm, FX(fp) - 8, AY(ap) + 3, { size: 11, color: nm === S.damp ? CUR.blue : CUR.ink3, bold: nm === S.damp, align: 'right' });
      });
      // markers
      line(ctx, FX(S.f0), py, FX(S.f0), py + ph, CUR.mag, 1.5, [5, 4]);
      const lab0 = 'natural frequency f₀ = ' + fmt(S.f0, 2) + ' Hz', left0 = FX(S.f0) > px + pw * 0.6;
      txt(ctx, lab0, FX(S.f0) + (left0 ? -5 : 5), py + 12, { size: 11, color: CUR.mag, bold: true, align: left0 ? 'right' : 'left' });
      line(ctx, FX(S.fd), py, FX(S.fd), py + ph, CUR.bright, 2);
      const leftd = FX(S.fd) > px + pw * 0.75;
      txt(ctx, 'f_d = ' + fmt(S.fd, 2), FX(S.fd) + (leftd ? -5 : 5), py + ph - 8, { size: 11, mono: true, color: CUR.accent, bold: true, align: leftd ? 'right' : 'left' });
      dot(ctx, FX(S.fd), AY(steady), 5.5, CUR.blue, CUR.card);
      ctx.beginPath(); ctx.arc(FX(S.fd), AY(meas), 5, 0, TAU); ctx.lineWidth = 2; ctx.strokeStyle = CUR.accent; ctx.stroke();
      txt(ctx, 'filled dot: steady value on the curve   ring: what the mass is doing now', px + pw, cr.y + 30, { size: 10, align: 'right', color: CUR.ink3 });
    }
  };
}

/* =====================================================================
   6. WAVES ON A STRING
   ===================================================================== */
function simWave(api) {
  const o = api.opts;
  const N = 61, LEN = 2.0, DX = LEN / (N - 1), HB = Math.round(0.35 * (N - 1)), PW = 0.4;
  const HSZ = 1 / 240, RING = 1024;
  const S = { mode: o.mode === 'longitudinal' || o.mode === 'pulse' ? o.mode : 'transverse', f: o.f || 1.0, A: o.A || 3, ten: o.tension || 25, fixed: true,
    t: 0, acc: 0, phase: 0, Ae: 0, hist: new Float32Array(RING), cnt: 0, hl: false, lam: false, capped: false,
    pulse: { on: false, s: 0, started: false, ts: 0, done: false, el: null }, log: [] };
  const cOf = () => 2 * Math.sqrt(S.ten / 100);

  const captions = {
    transverse: 'The beads only move <b>up and down</b>; the wave moves to the right. Freeze it and measure λ from crest to crest on the ruler. Does amplitude change c?',
    longitudinal: 'The beads move <b>left and right</b> (along the wave). Where they bunch up is a compression, where they spread out is a rarefaction.',
    pulse: 'Send a pulse and compare the reflected pulse for a fixed and a loose end. Change the tension and the amplitude: only one of them changes the travel time.'
  };
  const baseNote = ' (Vertical scale is enlarged so you can see the wave.)';
  const modeSeg = api.segmented({ label: 'Wave type', options: [['transverse', 'Transverse'], ['longitudinal', 'Longitudinal'], ['pulse', 'Pulse + reflection']], value: S.mode, before: api.box, parent: api.root, onChange: (v) => setMode(v) });
  const sf = api.slider({ key: 'f', label: 'Frequency <i>f</i>', min: 0.2, max: 3, step: 0.1, value: S.f, unit: 'Hz', dp: 1, onInput: (v) => { S.f = v; api.draw(); } });
  const sa = api.slider({ key: 'A', label: 'Amplitude <i>A</i>', min: 1, max: 8, step: 0.5, value: S.A, unit: 'cm', dp: 1, onInput: (v) => { S.A = v; api.draw(); } });
  const st = api.slider({ key: 'ten', label: 'Tension', min: 10, max: 100, step: 1, value: S.ten, unit: '%', onInput: (v) => { S.ten = v; api.draw(); } });
  const hlChk = api.check({ key: 'hl', label: 'Highlight one bead', value: false, onChange: (v) => { S.hl = v; api.draw(); } });
  const lamChk = api.check({ key: 'lam', label: 'Show wavelength λ', value: false, onChange: (v) => { S.lam = v; api.draw(); } });
  const endSel = api.select({ key: 'end', label: 'End of the string', options: [['fixed', 'Fixed end'], ['loose', 'Loose end (ring on a pole)']], value: 'fixed', onChange: (v) => { S.fixed = v === 'fixed'; sendPulse(); } });
  const sendBtn = api.btn('Send pulse', () => sendPulse(), { id: 'send' });
  api.setPlayLabels('Freeze', 'Play');

  const noteEl = h('p', 'sims-note'); api.extra.appendChild(noteEl);
  const logBox = h('div'); api.extra.appendChild(logBox);
  let set = () => {};

  function sendPulse() {
    S.pulse = { on: true, s: 0, started: false, ts: 0, done: false, el: null };
    S.t = 0; api.draw();
  }
  function renderLog() {
    if (S.mode !== 'pulse') { logBox.innerHTML = ''; return; }
    let s = '<div class="sims-h">Pulse timer log</div><ul class="sims-list">';
    if (!S.log.length) s += '<li>No runs yet.</li>';
    S.log.slice(-5).forEach((r) => { s += '<li>tension ' + r.ten + ' %, A = ' + fmt(r.A, 1) + ' cm → ' + fmt(r.el, 2) + ' s</li>'; });
    logBox.innerHTML = s + '</ul>';
  }
  function resetWave() {
    S.t = 0; S.acc = 0; S.phase = 0; S.Ae = 0; S.hist.fill(0); S.cnt = 0;
  }
  function setMode(m) {
    S.mode = m; modeSeg.set(m);
    api.caption(captions[m] + (m === 'pulse' ? '' : baseNote));
    const pu = m === 'pulse';
    sf.hide(pu); hlChk.hide(pu); lamChk.hide(m !== 'transverse'); endSel.hide(!pu); sendBtn.hidden = !pu;
    if (!pu) {
      set = api.readouts([['c', 'Wave speed c'], ['f', 'Frequency f'], ['lam', 'Wavelength λ = c/f'], ['chk', 'Check: c = f·λ', true]]);
      noteEl.textContent = m === 'longitudinal' ? 'Longitudinal: oscillation direction is parallel to the direction the wave travels.' : 'Transverse: oscillation direction is perpendicular to the direction the wave travels.';
    } else {
      set = api.readouts([['c', 'Wave speed c'], ['t', 'Pulse timer (crest, 0 → 2 m)'], ['last', 'Last measured time']]);
      noteEl.textContent = 'Only the tension changes the time. A bigger amplitude does not make the pulse slower — if a stopwatch says it does, that is reaction-time error.';
    }
    resetWave();
    if (pu) sendPulse();
    renderLog();
    api.draw();
  }

  setMode(S.mode);

  function histAt(tau) { // source displacement (cm) a time tau ago
    const idx = S.cnt - 1 - tau / HSZ;
    if (idx < 0) return 0;
    const i0 = Math.floor(idx), fr = idx - i0;
    const a = S.hist[((i0 % RING) + RING) % RING], b = S.hist[(((i0 + 1) % RING) + RING) % RING];
    return i0 + 1 > S.cnt - 1 ? a : a + (b - a) * fr;
  }

  return {
    height(W) { return clamp(W * 0.46, 250, 350); },
    reset() { resetWave(); if (S.mode === 'pulse') sendPulse(); S.log = []; renderLog(); },
    step(dt) {
      const c = cOf();
      if (S.mode === 'pulse') {
        const p = S.pulse;
        if (p.on) {
          const ds = c * dt;
          const sOld = p.s; p.s += ds; S.t += dt;
          if (!p.started && p.s >= PW / 2) { p.started = true; p.ts = S.t - (p.s - PW / 2) / c; }
          if (p.started && !p.done && p.s >= LEN + PW / 2) {
            p.done = true; p.el = (S.t - (p.s - LEN - PW / 2) / c) - p.ts;
            S.log.push({ ten: S.ten, A: S.A, el: p.el }); renderLog();
          }
          if (p.s > 2 * LEN + PW + 0.05) { p.on = false; p.s = 3 * LEN; }
          void sOld;
        }
        return;
      }
      S.acc += dt;
      let n = 0;
      const wl = c / S.f, cap = 0.8 * wl / TAU * 100; // cm
      const target = S.mode === 'longitudinal' ? Math.min(S.A, cap) : S.A;
      S.capped = S.mode === 'longitudinal' && S.A > cap;
      while (S.acc >= HSZ && n++ < 30) {
        S.acc -= HSZ; S.t += HSZ; S.phase += TAU * S.f * HSZ;
        S.Ae += (target - S.Ae) * (1 - Math.exp(-HSZ / 0.15));
        S.hist[S.cnt % RING] = S.Ae * Math.sin(S.phase); S.cnt++;
      }
      if (S.acc > HSZ) S.acc = 0;
    },
    draw(ctx, W, H) {
      const c = cOf(), lam = c / S.f, pu = S.mode === 'pulse';
      const padL = 16, padR = 36, X = (x) => padL + x / LEN * (W - padL - padR);
      const top = 28, rulerY = H - 30, cyS = (top + rulerY - 10) / 2;
      set('c', fmt(c, 2) + ' m/s');
      if (!pu) { set('f', fmt(S.f, 1) + ' Hz'); set('lam', fmt(lam, 2) + ' m'); set('chk', fmt(S.f, 1) + ' Hz × ' + fmt(lam, 2) + ' m = ' + fmt(S.f * lam, 2) + ' m/s  ✓  (= c)'); }
      // ruler
      line(ctx, X(0), rulerY, X(LEN), rulerY, CUR.ink3, 1.5);
      for (let i = 0; i <= 20; i++) {
        const xx = X(i * 0.1), major = i % 5 === 0;
        line(ctx, xx, rulerY, xx, rulerY + (major ? 8 : 4), CUR.ink3, 1);
        if (major) txt(ctx, i === 20 ? '2.0 m' : fmt(i * 0.1, 1), xx, rulerY + 21, { size: 11, mono: true, align: 'center', color: CUR.ink3 });
      }
      txt(ctx, 'x (m)', 6, rulerY - 6, { size: 11, color: CUR.ink3 });
      line(ctx, X(0), cyS, X(LEN), cyS, CUR.ink3, 1, [5, 4]);
      if (S.mode === 'transverse') {
        txt(ctx, 'Beads move up and down ↕ — the wave travels to the right →', 8, 18, { size: 12, color: CUR.ink2 });
        const ppcm = (cyS - top - 8) / 8.6, ys = new Array(N);
        for (let i = 0; i < N; i++) ys[i] = histAt(i * DX / c);
        ctx.strokeStyle = CUR.blue; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
        for (let i = 0; i < N; i++) { const xx = X(i * DX), yy = cyS - ys[i] * ppcm; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke();
        if (S.hl) { const xx = X(HB * DX); line(ctx, xx, cyS - S.A * ppcm - 6, xx, cyS + S.A * ppcm + 6, CUR.mag, 1.2, [3, 3]); }
        for (let i = 0; i < N; i++) { if (S.hl && i === HB) continue; dot(ctx, X(i * DX), cyS - ys[i] * ppcm, 2.8, CUR.blue); }
        if (S.hl) dot(ctx, X(HB * DX), cyS - ys[HB] * ppcm, 6, CUR.mag, CUR.card);
        // lambda bracket from the bead data
        if (S.lam && S.Ae > 0.5) {
          const cr = [];
          for (let i = 1; i < N - 1; i++) if (ys[i] > ys[i - 1] && ys[i] >= ys[i + 1] && ys[i] > 0.7 * S.Ae) {
            const d = ys[i - 1] - 2 * ys[i] + ys[i + 1], off = d !== 0 ? 0.5 * (ys[i - 1] - ys[i + 1]) / d : 0;
            cr.push((i + off) * DX);
          }
          if (cr.length >= 2) {
            const xa = X(cr[0]), xb = X(cr[1]), by = top + 8;
            line(ctx, xa, by, xa, cyS - S.Ae * ppcm - 2, CUR.mag, 1, [3, 3]); line(ctx, xb, by, xb, cyS - S.Ae * ppcm - 2, CUR.mag, 1, [3, 3]);
            arrow(ctx, (xa + xb) / 2 + 1, by, xa, by, CUR.mag, 1.5); arrow(ctx, (xa + xb) / 2 - 1, by, xb, by, CUR.mag, 1.5);
            txt(ctx, 'λ = ' + fmt(lam, 2) + ' m', clamp((xa + xb) / 2, 44, W - 44), by - 3 + 0, { size: 12, mono: true, align: 'center', color: CUR.mag, bold: true, base: 'bottom' });
          }
        }
      } else if (S.mode === 'longitudinal') {
        txt(ctx, 'Beads move left and right ↔ — the wave travels to the right →', 8, 18, { size: 12, color: CUR.ink2 });
        const xs = new Array(N), rowH = Math.min(46, (rulerY - top) * 0.34);
        for (let i = 0; i < N; i++) xs[i] = i * DX + histAt(i * DX / c) / 100;
        for (let i = 0; i < N; i++) line(ctx, X(i * DX), cyS + rowH + 14, X(i * DX), cyS + rowH + 22, CUR.line, 1.5);
        txt(ctx, 'rest positions', X(LEN), cyS + rowH + 34, { size: 10, align: 'right', color: CUR.ink3 });
        for (let i = 0; i < N; i++) { if (S.hl && i === HB) continue; line(ctx, X(xs[i]), cyS - rowH, X(xs[i]), cyS + rowH, CUR.blue, 2.2); }
        if (S.hl) {
          const am = Math.max(S.Ae, 0.3) / 100;
          line(ctx, X(HB * DX - am), cyS, X(HB * DX + am), cyS, CUR.mag, 1.2, [3, 3]);
          line(ctx, X(xs[HB]), cyS - rowH - 4, X(xs[HB]), cyS + rowH + 4, CUR.mag, 4);
        }
        if (S.Ae > 0.15) {
          const d = []; for (let i = 0; i < N - 1; i++) d.push(xs[i + 1] - xs[i]);
          let bc = -1, br = -1, dc = 1e9, dr = 1e9;
          for (let i = 1; i < d.length - 1; i++) {
            if (d[i] < DX * 0.85 && d[i] <= d[i - 1] && d[i] < d[i + 1] && Math.abs(i - N * 0.4) < dc) { dc = Math.abs(i - N * 0.4); bc = i; }
            if (d[i] > DX * 1.15 && d[i] >= d[i - 1] && d[i] > d[i + 1] && Math.abs(i - N * 0.7) < dr) { dr = Math.abs(i - N * 0.7); br = i; }
          }
          if (bc >= 0) { const xx = X((xs[bc] + xs[bc + 1]) / 2); line(ctx, xx, cyS - rowH - 4, xx, cyS - rowH - 14, CUR.mag, 1.5); txt(ctx, 'compression', clamp(xx, 44, W - 44), cyS - rowH - 18, { size: 12, color: CUR.mag, align: 'center', bold: true }); }
          if (br >= 0) { const xx = X((xs[br] + xs[br + 1]) / 2); line(ctx, xx, cyS + rowH + 4, xx, cyS + rowH + 12, CUR.accent, 1.5); txt(ctx, 'rarefaction', clamp(xx, 44, W - 44), cyS + rowH + 2 + 22 - 14 + 0, { size: 12, color: CUR.accent, align: 'center', bold: true, base: 'top' }); }
        }
        if (S.capped) txt(ctx, 'amplitude limited so beads never pass through each other', W - 10, top - 4, { size: 10, align: 'right', color: CUR.ink3 });
      } else {
        // pulse + reflection
        const p = S.pulse, ppcm = (cyS - top - 8) / 16.5;
        const ysP = new Array(N);
        for (let i = 0; i < N; i++) ysP[i] = p.on ? pulseY(i * DX, p.s, LEN, PW, S.A, S.fixed) : 0;
        const crestX = p.s - PW / 2, refl = p.on && crestX > LEN;
        let status = !p.on ? 'Press “Send pulse”.' : (!refl ? 'Incoming pulse →' : (S.fixed ? '← Reflected pulse: upside down (inverted) — fixed end' : '← Reflected pulse: same way up (upright) — loose end'));
        txt(ctx, status, 8, 18, { size: 12, color: refl ? CUR.mag : CUR.ink2, bold: refl });
        // end fixture
        const xe = X(LEN);
        if (S.fixed) {
          ctx.fillStyle = CUR.ink3; ctx.fillRect(xe, cyS - 30, 7, 60);
          for (let k = -28; k < 30; k += 8) line(ctx, xe + 7, cyS + k, xe + 13, cyS + k - 6, CUR.ink3, 1.5);
        } else {
          line(ctx, xe, cyS - 56, xe, cyS + 56, CUR.ink3, 4);
        }
        ctx.strokeStyle = CUR.blue; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
        for (let i = 0; i < N; i++) { const xx = X(i * DX), yy = cyS - ysP[i] * ppcm; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke();
        if (!S.fixed) { ctx.beginPath(); ctx.ellipse(xe, cyS - ysP[N - 1] * ppcm, 5, 7, 0, 0, TAU); ctx.lineWidth = 2.5; ctx.strokeStyle = CUR.accent; ctx.stroke(); }
        const tm = p.done ? p.el : (p.started ? S.t - p.ts : 0);
        set('t', fmt(tm, 2) + ' s'); set('last', p.done ? fmt(p.el, 2) + ' s' : (S.log.length ? fmt(S.log[S.log.length - 1].el, 2) + ' s' : '—'));
      }
    }
  };
}

/* =====================================================================
   Public API
   ===================================================================== */
const SIMS = { hooke: simHooke, oscillator: simOscillator, circle: simCircle, pendulum: simPendulum, resonance: simResonance, wave: simWave };
window.Sims = {
  mount(name, el, opts) {
    const f = SIMS[name];
    if (!f || !el) { if (el) el.textContent = 'Unknown simulation: ' + name; return { destroy() {} }; }
    return createBase(name, el, opts || {}, f);
  },
  _phys: { pendRK4, pendPeriod, pendExact, resAmp, pulseP, pulseY, dampDelta, DAMP_Q }
};
})();
