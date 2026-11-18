/* Color Picker for Blender — documentation site interactions. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ------------------------------------------------------------ toast */
  const toastEl = $('#toast');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 1600);
  }

  /* ------------------------------------------------------------ theme */
  $('#theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    store.set('cp-theme', next);
  });

  /* ------------------------------------------------------------ mobile menu */
  const sidebar = $('#sidebar'), menuBtn = $('#menu-btn');
  const setMenu = (open) => { sidebar.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); };
  menuBtn.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
  $$('#sidebar a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
  });

  /* ------------------------------------------------------------ reveal on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ------------------------------------------------------------ scrollspy */
  const links = $$('#sidebar a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ------------------------------------------------------------ feature card glow follows mouse */
  $$('.feature').forEach(card => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ------------------------------------------------------------ tabs */
  $$('[data-tabs]').forEach(tabs => {
    const btns = $$('[role="tab"]', tabs);
    const select = (btn) => {
      btns.forEach(b => {
        const on = b === btn;
        b.setAttribute('aria-selected', on);
        b.tabIndex = on ? 0 : -1;
        $('#' + b.getAttribute('aria-controls')).hidden = !on;
      });
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        const n = btns[(i + d + btns.length) % btns.length];
        n.focus(); select(n);
      });
    });
  });

  /* ------------------------------------------------------------ size calculator */
  const cDpi = $('#c-dpi'), cScale = $('#c-scale');
  function calc() {
    const f = (+cDpi.value / 72) * +cScale.value;
    $('#c-dpi-v').textContent = cDpi.value;
    $('#c-scale-v').textContent = (+cScale.value).toFixed(1);
    const cw = Math.round(400 * f), ch = Math.round(200 * f);
    $('#c-out-color').textContent = `${cw} × ${ch} px`;
    $('#c-out-weight').textContent = `${Math.round(360 * f)} × ${Math.round(72 * f)} px`;
    const box = $('#c-box');
    box.style.width = `${cw / 10}px`;
    box.style.height = `${ch / 10}px`;
  }
  cDpi.addEventListener('input', calc);
  cScale.addEventListener('input', calc);
  calc();

  /* ================================================================== */
  /*  LIVE DEMO                                                          */
  /* ================================================================== */
  const vp = $('#viewport'), cp = $('#cp'), paint = $('#paint'), pctx = paint.getContext('2d');
  const cv = $('#cp-canvas'), ctx = cv.getContext('2d');
  const hint = $('#vp-hint'), kbdFloat = $('#kbd-float');

  const S = {
    h: 0.06, s: 0.9, v: 0.85,   // current color (HSV, 0..1)
    old: null,                   // color before the last change (RGB)
    recent: [],
    weight: 1.0,
    mode: 'color', layout: 'sv', hex: false, pin: false,
    open: false, mouse: { x: 0, y: 0 }, inside: false,
  };

  // --- color math
  function hsv2rgb(h, s, v) {
    const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][((i % 6) + 6) % 6];
  }
  function rgb2hsv(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [((h / 6) + 1) % 1, mx ? d / mx : 0, mx];
  }
  const css = (rgb) => `rgb(${rgb.map(c => Math.round(c * 255)).join(',')})`;
  const hex = (rgb) => '#' + rgb.map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
  const rgb = () => hsv2rgb(S.h, S.s, S.v);
  const weightColor = (w) => w < 0.5 ? css([0, w * 2, 1 - w * 2]) : css([(w - 0.5) * 2, 1 - (w - 0.5) * 2, 0]);

  // --- sliders (H S V / R G B), built once
  const sliderDefs = [
    [['H', 'h'], ['S', 's'], ['V', 'v']],
    [['R', 0], ['G', 1], ['B', 2]],
  ];
  const sliders = [];
  sliderDefs.forEach(group => {
    const g = document.createElement('div');
    g.className = 'cp-group';
    group.forEach(([label, key]) => {
      const row = document.createElement('div');
      row.className = 'cp-row';
      row.innerHTML = `<label>${label}</label><div class="cp-track" role="slider" tabindex="0" aria-label="${label}" aria-valuemin="0" aria-valuemax="1"><i></i></div>`;
      g.appendChild(row);
      const track = $('.cp-track', row);
      sliders.push({ key, track, handle: $('i', track) });
    });
    $('#cp-sliders').appendChild(g);
  });

  function setChannel(key, val) {
    val = clamp(val);
    if (typeof key === 'string') { S[key] = key === 'h' ? Math.min(val, 0.9999) : val; }
    else {
      const c = rgb(); c[key] = val;
      const [h, s, v] = rgb2hsv(...c);
      if (s > 0 && v > 0) S.h = h;   // keep hue when the color goes grey/black
      if (v > 0) S.s = s;
      S.v = v;
    }
  }
  function getChannel(key) { return typeof key === 'string' ? S[key] : rgb()[key]; }

  function sliderGradient(key) {
    if (key === 'h') return `linear-gradient(90deg, ${[0, 1, 2, 3, 4, 5, 6].map(i => css(hsv2rgb(i / 6 % 1, S.s, S.v))).join(',')})`;
    if (key === 's') return `linear-gradient(90deg, ${css(hsv2rgb(S.h, 0, S.v))}, ${css(hsv2rgb(S.h, 1, S.v))})`;
    if (key === 'v') return `linear-gradient(90deg, #000, ${css(hsv2rgb(S.h, S.s, 1))})`;
    const a = rgb(), b = rgb(); a[key] = 0; b[key] = 1;
    return `linear-gradient(90deg, ${css(a)}, ${css(b)})`;
  }

  // --- main canvas
  const N = 360, R = N / 2;
  const ring = { outer: 178, inner: 146, sq: 196 };
  function drawSV(x0, y0, size) {
    const base = hsv2rgb(S.h, 1, 1);
    const gx = ctx.createLinearGradient(x0, 0, x0 + size, 0);
    gx.addColorStop(0, '#fff'); gx.addColorStop(1, css(base));
    ctx.fillStyle = gx; ctx.fillRect(x0, y0, size, size);
    const gy = ctx.createLinearGradient(0, y0, 0, y0 + size);
    gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(1, '#000');
    ctx.fillStyle = gy; ctx.fillRect(x0, y0, size, size);
    handle(x0 + S.s * size, y0 + (1 - S.v) * size, css(rgb()));
  }
  function handle(x, y, fill, r = 9) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.stroke();
  }
  let wheelCache = null, wheelCacheV = -1;
  function drawWheel() {
    if (!wheelCache || wheelCacheV !== S.v) {
      const img = ctx.createImageData(N, N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const dx = x - R + 0.5, dy = y - R + 0.5, d = Math.hypot(dx, dy) / (R - 2);
        const i = (y * N + x) * 4;
        if (d > 1) { img.data[i + 3] = 0; continue; }
        const h = (Math.atan2(-dy, dx) / (2 * Math.PI) + 1) % 1;
        const c = hsv2rgb(h, d, S.v);
        img.data[i] = c[0] * 255; img.data[i + 1] = c[1] * 255; img.data[i + 2] = c[2] * 255;
        img.data[i + 3] = d > 0.985 ? (1 - d) / 0.015 * 255 : 255;
      }
      wheelCache = img; wheelCacheV = S.v;
    }
    ctx.putImageData(wheelCache, 0, 0);
    const a = S.h * Math.PI * 2;
    handle(R + Math.cos(a) * S.s * (R - 2), R - Math.sin(a) * S.s * (R - 2), css(rgb()));
  }
  function drawRing() {
    const seg = 180;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1.5) / seg) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(R, R, ring.outer, -a1, -a0);
      ctx.arc(R, R, ring.inner, -a0, -a1, true);
      ctx.closePath();
      ctx.fillStyle = css(hsv2rgb(i / seg, 1, 1)); ctx.fill();
    }
    const o = R - ring.sq / 2;
    drawSV(o, o, ring.sq);
    const a = S.h * Math.PI * 2, rr = (ring.outer + ring.inner) / 2;
    handle(R + Math.cos(a) * rr, R - Math.sin(a) * rr, '#fff', 8);
  }
  function drawMain() {
    ctx.clearRect(0, 0, N, N);
    if (S.layout === 'sv') drawSV(4, 4, N - 8);
    else if (S.layout === 'ring') drawRing();
    else drawWheel();
  }

  function render() {
    const c = rgb();
    if (S.mode === 'color') {
      drawMain();
      sliders.forEach(sl => {
        sl.track.style.background = sliderGradient(sl.key);
        const v = getChannel(sl.key);
        sl.handle.style.left = `${v * 100}%`;
        sl.track.setAttribute('aria-valuenow', v.toFixed(3));
      });
      $('#sw-new').style.background = css(c);
      $('#sw-old').style.background = css(S.old || c);
      const hx = $('#cp-hex'); hx.hidden = !S.hex; hx.textContent = hex(c);
      $('#hud-swatch').style.background = css(c);
      $('#hud-label').textContent = S.hex ? hex(c) : 'Brush color';
    } else {
      $('#weight-handle').style.left = `${S.weight * 100}%`;
      $('#weight-val').textContent = S.weight.toFixed(3).slice(0, 4);
      $('#hud-swatch').style.background = weightColor(S.weight);
      $('#hud-label').textContent = `Weight ${S.weight.toFixed(2)}`;
    }
  }
  function renderRecent() {
    const box = $('#cp-recent');
    box.innerHTML = '';
    [...S.recent].reverse().forEach(col => {
      const b = document.createElement('button');
      b.style.background = css(col);
      b.title = hex(col);
      b.setAttribute('aria-label', 'Use recent color ' + hex(col));
      b.addEventListener('click', () => { S.old = rgb(); [S.h, S.s, S.v] = rgb2hsv(...col); render(); });
      box.appendChild(b);
    });
  }

  // --- interaction helpers
  let beforeDrag = null;
  function beginChange() { beforeDrag = rgb(); }
  function endChange() {
    if (!beforeDrag) return;
    const now = rgb();
    if (hex(now) !== hex(beforeDrag)) {
      S.old = beforeDrag;
      S.recent = S.recent.filter(c => hex(c) !== hex(now));
      S.recent.push(now);
      if (S.recent.length > 24) S.recent.shift();
      renderRecent();
    }
    beforeDrag = null; render();
  }
  function drag(el, onMove) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      beginChange(); onMove(e);
      const move = (ev) => onMove(ev);
      const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); endChange(); };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  }

  // main area: which part was grabbed decides the behaviour for the whole drag
  let grab = null;
  cv.addEventListener('pointerdown', (e) => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * N, y = (e.clientY - r.top) / r.height * N;
    const d = Math.hypot(x - R, y - R);
    grab = S.layout === 'ring' && d > ring.inner - 6 ? 'hue' : 'main';
  }, true);
  drag(cv, (e) => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * N, y = (e.clientY - r.top) / r.height * N;
    if (S.layout === 'sv') { S.s = clamp((x - 4) / (N - 8)); S.v = clamp(1 - (y - 4) / (N - 8)); }
    else if (S.layout === 'ring') {
      if (grab === 'hue') S.h = (Math.atan2(-(y - R), x - R) / (2 * Math.PI) + 1) % 1;
      else { const o = R - ring.sq / 2; S.s = clamp((x - o) / ring.sq); S.v = clamp(1 - (y - o) / ring.sq); }
    } else {
      const dx = x - R, dy = y - R;
      S.h = (Math.atan2(-dy, dx) / (2 * Math.PI) + 1) % 1;
      S.s = clamp(Math.hypot(dx, dy) / (R - 2));
    }
    render();
  });
  sliders.forEach(sl => {
    drag(sl.track, (e) => {
      const r = sl.track.getBoundingClientRect();
      setChannel(sl.key, (e.clientX - r.left) / r.width); render();
    });
    sl.track.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 0.01, ArrowUp: 0.01, ArrowLeft: -0.01, ArrowDown: -0.01 }[e.key];
      if (d === undefined) return;
      e.preventDefault(); beginChange();
      setChannel(sl.key, getChannel(sl.key) + d * (e.shiftKey ? 10 : 1)); endChange();
    });
  });
  const wbar = $('#weight-bar');
  drag(wbar, (e) => {
    const r = wbar.getBoundingClientRect();
    S.weight = clamp((e.clientX - r.left) / r.width); render();
  });
  $('#cp-hex').addEventListener('click', async () => {
    const t = hex(rgb());
    try { await navigator.clipboard.writeText(t); toast(`Copied ${t}`); } catch (e) { toast(t); }
  });

  // --- open / close
  function placePicker(x, y) {
    const w = cp.offsetWidth, h = cp.offsetHeight, m = 8, vw = vp.clientWidth, vh = vp.clientHeight;
    const cx = w + 2 * m > vw ? vw / 2 : clamp(x, w / 2 + m, vw - w / 2 - m);
    const cy = h + 2 * m > vh ? vh / 2 : clamp(y, h / 2 + m, vh - h / 2 - m);
    cp.style.left = `${cx - w / 2}px`; cp.style.top = `${cy - h / 2}px`;
  }
  function openPicker(x, y) {
    cp.hidden = false;
    cp.classList.toggle('is-weight', S.mode === 'weight');
    $('#cp-weight').hidden = S.mode !== 'weight';
    // restart pop animation
    cp.style.animation = 'none'; void cp.offsetWidth; cp.style.animation = '';
    placePicker(x, y);
    S.open = true; hint.style.opacity = 0;
    render();
  }
  function closePicker() {
    if (!S.open) return;
    cp.hidden = true; S.open = false; hint.style.opacity = '';
    kbdFloat.classList.remove('show');
  }

  vp.addEventListener('pointerenter', () => { S.inside = true; });
  vp.addEventListener('pointerleave', () => { S.inside = false; });
  vp.addEventListener('pointermove', (e) => {
    const r = vp.getBoundingClientRect();
    S.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    kbdFloat.style.left = `${S.mouse.x}px`; kbdFloat.style.top = `${S.mouse.y}px`;
  });

  const spaceDown = (e) => e.code === 'Space' || e.key === ' ';
  let spaceHeld = false;
  window.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') && document.activeElement.type !== 'checkbox' && document.activeElement.type !== 'range';
    if (spaceDown(e) && (S.inside || document.activeElement === vp) && !typing) {
      e.preventDefault();
      if (e.repeat || spaceHeld) return;
      spaceHeld = true;
      if (S.pin && S.open) { closePicker(); return; }
      openPicker(S.mouse.x || vp.clientWidth / 2, S.mouse.y || vp.clientHeight / 2);
    } else if (e.key === 'Escape' && S.open) { closePicker(); }
  });
  window.addEventListener('keyup', (e) => {
    if (!spaceDown(e)) return;
    spaceHeld = false;
    kbdFloat.classList.remove('show');
    if (!S.pin) closePicker();
  });
  window.addEventListener('blur', () => { spaceHeld = false; if (!S.pin) closePicker(); });

  // --- painting (and long-press to open on touch)
  // Strokes are stored so the canvas can be redrawn crisply after a resize.
  const strokes = [];
  let lastSize = '';
  function resizePaint() {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = vp.clientWidth, h = vp.clientHeight;
    if (!w || !h || lastSize === `${w}x${h}@${dpr}`) return;
    lastSize = `${w}x${h}@${dpr}`;
    paint.width = Math.round(w * dpr); paint.height = Math.round(h * dpr);
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawPaint();
  }
  function meshGeom() {
    const w = vp.clientWidth, h = vp.clientHeight;
    return { cx: w / 2, cy: h / 2 + 20, r: Math.min(w, h) * 0.34 };
  }
  function redrawPaint() {
    const w = vp.clientWidth, h = vp.clientHeight, { cx, cy, r } = meshGeom();
    pctx.clearRect(0, 0, w, h);
    // ground shadow + a soft shaded sphere to paint on, so the viewport reads as 3D
    const sh = pctx.createRadialGradient(cx, cy + r * 0.95, 0, cx, cy + r * 0.95, r * 1.1);
    sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    pctx.fillStyle = sh; pctx.beginPath(); pctx.ellipse(cx, cy + r * 0.95, r * 1.1, r * 0.22, 0, 0, Math.PI * 2); pctx.fill();
    const g = pctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.08, cx, cy, r);
    g.addColorStop(0, '#e2e2e7'); g.addColorStop(0.55, '#a2a2ab'); g.addColorStop(1, '#4e4e56');
    pctx.fillStyle = g; pctx.beginPath(); pctx.arc(cx, cy, r, 0, Math.PI * 2); pctx.fill();
    // paint only lands on the sphere
    pctx.save(); pctx.beginPath(); pctx.arc(cx, cy, r, 0, Math.PI * 2); pctx.clip();
    strokes.forEach(s => drawStroke(s, w, h));
    // re-apply shading on top of the paint
    const shade = pctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    shade.addColorStop(0, 'rgba(255,255,255,.18)'); shade.addColorStop(0.6, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.45)');
    pctx.fillStyle = shade; pctx.fillRect(0, 0, w, h);
    pctx.restore();
  }
  function drawStroke(s, w, h) {
    pctx.strokeStyle = s.color; pctx.lineWidth = 18; pctx.lineCap = 'round'; pctx.lineJoin = 'round'; pctx.globalAlpha = 0.92;
    pctx.beginPath();
    s.pts.forEach(([x, y], i) => (i ? pctx.lineTo(x * w, y * h) : pctx.moveTo(x * w, y * h)));
    if (s.pts.length === 1) pctx.lineTo(s.pts[0][0] * w + 0.1, s.pts[0][1] * h);
    pctx.stroke(); pctx.globalAlpha = 1;
  }
  new ResizeObserver(resizePaint).observe(vp);

  let painting = false, last = null, longPress = null;
  vp.addEventListener('pointerdown', (e) => {
    if (cp.contains(e.target)) return;
    const r = vp.getBoundingClientRect(), p = { x: e.clientX - r.left, y: e.clientY - r.top };
    S.mouse = p;
    if (S.open) { if (S.pin) closePicker(); else return; }   // click outside closes (toggle mode)
    vp.focus({ preventScroll: true });
    if (e.pointerType === 'touch') {
      longPress = setTimeout(() => { painting = false; openPicker(p.x, p.y); }, 380);
    }
    painting = true; last = p;
    strokes.push({ color: S.mode === 'weight' ? weightColor(S.weight) : css(rgb()), pts: [[p.x / vp.clientWidth, p.y / vp.clientHeight]] });
    if (strokes.length > 400) strokes.shift();
    redrawPaint();
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener('pointermove', (e) => {
    if (!painting) return;
    const r = vp.getBoundingClientRect(), p = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (longPress && Math.hypot(p.x - last.x, p.y - last.y) > 6) { clearTimeout(longPress); longPress = null; }
    strokes[strokes.length - 1].pts.push([p.x / vp.clientWidth, p.y / vp.clientHeight]);
    redrawPaint();
    last = p;
  });
  const stopPaint = () => {
    painting = false; clearTimeout(longPress); longPress = null;
    if (S.open && !S.pin && !spaceHeld && matchMedia('(pointer: coarse)').matches) {
      // touch: picker opened by long-press stays until the next tap outside
      S.pin = true; $('#opt-pin').checked = true;
    }
  };
  vp.addEventListener('pointerup', stopPaint);
  vp.addEventListener('pointercancel', stopPaint);

  // --- toolbar
  $$('[data-mode]').forEach(b => b.addEventListener('click', () => {
    S.mode = b.dataset.mode;
    $$('[data-mode]').forEach(x => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-checked', x === b); });
    $('#layout-seg').classList.toggle('is-disabled', S.mode === 'weight');
    const wasOpen = S.open; closePicker();
    if (wasOpen || S.pin) openPicker(vp.clientWidth / 2, vp.clientHeight / 2);
    render();
  }));
  $$('[data-layout]').forEach(b => b.addEventListener('click', () => {
    S.layout = b.dataset.layout;
    $$('[data-layout]').forEach(x => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-checked', x === b); });
    render();
  }));
  $('#opt-hex').addEventListener('change', (e) => { S.hex = e.target.checked; render(); });
  $('#opt-pin').addEventListener('change', (e) => {
    S.pin = e.target.checked;
    if (S.pin) openPicker(vp.clientWidth / 2, vp.clientHeight / 2); else closePicker();
  });

  render();
})();
