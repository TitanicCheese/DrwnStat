(() => {
  'use strict';

  // Card is laid out in 400x560 units and rendered at 2x for crisp exports.
  const W = 400;
  const H = 560;
  const SCALE = 2;
  const PIC = { x: 115, y: 34, w: 270, h: 290 };
  const STORAGE_KEY = 'drwnstat.cards.v1';
  const MAX_IMAGE_SIDE = 700;

  const PRESETS = {
    football: { name: 'Football', labels: ['PAC', 'SHO', 'PAS', 'DRI', 'DEF'] },
    shooter: { name: 'Shooter (FPS)', labels: ['AIM', 'MOV', 'UTL', 'IQ', 'CLT'] },
    moba: { name: 'MOBA', labels: ['MEC', 'MAP', 'FRM', 'TFT', 'IQ'] },
    battle: { name: 'Battle royale', labels: ['AIM', 'BLD', 'ROT', 'SRV', 'CLT'] },
    racing: { name: 'Racing', labels: ['SPD', 'LNE', 'CRN', 'CON', 'OVT'] },
    fighting: { name: 'Fighting', labels: ['EXE', 'NEU', 'DEF', 'CMB', 'ADP'] },
    custom: { name: 'Custom', labels: null },
  };

  const THEMES = {
    gold: {
      name: 'Gold', bg: ['#fff3b0', '#e8c25a', '#b98a22'], text: '#3a2a05',
      accent: '#5a420b', border: '#fff6c9', shine: 0.35,
    },
    silver: {
      name: 'Silver', bg: ['#ffffff', '#c9ced6', '#8b939f'], text: '#22262c',
      accent: '#3b414b', border: '#f4f6f9', shine: 0.35,
    },
    bronze: {
      name: 'Bronze', bg: ['#f3c8a0', '#c4834f', '#7f4a22'], text: '#2e1606',
      accent: '#4a2810', border: '#f8d9bb', shine: 0.3,
    },
    icon: {
      name: 'Icon', bg: ['#fffdf5', '#efe6cc', '#cdb98a'], text: '#3d3013',
      accent: '#8b6c22', border: '#c9a24a', shine: 0.25,
    },
    inferno: {
      name: 'Inferno', bg: ['#ff8a3d', '#c4161c', '#2a0306'], text: '#fff4e6',
      accent: '#ffd36e', border: '#ffb347', shine: 0.2,
    },
    ice: {
      name: 'Ice', bg: ['#e6fbff', '#5cc8f2', '#0b3d75'], text: '#ffffff',
      accent: '#d9f6ff', border: '#bff0ff', shine: 0.25,
    },
    toxic: {
      name: 'Toxic', bg: ['#d7ff5a', '#2fa84f', '#06240f'], text: '#f2ffe6',
      accent: '#d7ff5a', border: '#b6ff3c', shine: 0.2,
    },
    midnight: {
      name: 'Midnight', bg: ['#6b4cff', '#241354', '#07040f'], text: '#f3eeff',
      accent: '#ff5cd6', border: '#a98bff', shine: 0.18,
    },
  };

  const DEFAULT_CARD = () => ({
    id: null,
    game: '',
    name: 'Player',
    position: 'ST',
    team: '',
    preset: 'football',
    stats: PRESETS.football.labels.map((label, i) => ({ label, value: [88, 84, 79, 86, 42][i] })),
    autoOverall: true,
    overall: 75,
    theme: 'gold',
    image: null,
    zoom: 1,
    offX: 0,
    offY: 0,
  });

  let card = DEFAULT_CARD();
  let img = null; // HTMLImageElement for card.image

  const $ = (id) => document.getElementById(id);
  const canvas = $('card');
  const ctx = canvas.getContext('2d');

  // ---------- helpers ----------

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function overallOf(c) {
    if (!c.autoOverall) return clamp(Math.round(c.overall) || 1, 1, 99);
    const sum = c.stats.reduce((s, st) => s + st.value, 0);
    return clamp(Math.round(sum / c.stats.length), 1, 99);
  }

  function fitFont(text, weight, maxSize, maxWidth, family = '"Barlow Condensed", sans-serif') {
    let size = maxSize;
    do {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    } while (size > 8);
    return size;
  }

  function setStatus(msg) {
    const el = $('status');
    el.textContent = msg;
    clearTimeout(setStatus.t);
    setStatus.t = setTimeout(() => { el.textContent = ''; }, 3000);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
  }

  // Downscale uploads so saved cards fit in localStorage.
  async function normalizeUpload(file) {
    const url = URL.createObjectURL(file);
    try {
      const raw = await loadImage(url);
      const s = Math.min(1, MAX_IMAGE_SIDE / Math.max(raw.naturalWidth, raw.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(raw.naturalWidth * s);
      c.height = Math.round(raw.naturalHeight * s);
      c.getContext('2d').drawImage(raw, 0, 0, c.width, c.height);
      const hasAlpha = /png|webp|gif|svg/.test(file.type);
      return c.toDataURL(hasAlpha ? 'image/png' : 'image/jpeg', 0.88);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ---------- drawing ----------

  function cardPath(c, inset = 0) {
    const i = inset;
    const notch = 18;
    c.beginPath();
    c.moveTo(34 + i, i);
    c.lineTo(W / 2 - 60, i);
    c.quadraticCurveTo(W / 2, i + notch, W / 2 + 60, i);
    c.lineTo(W - 34 - i, i);
    c.quadraticCurveTo(W - 10 - i, 10 + i, W - i, 34 + i);
    c.lineTo(W - i, H - 90 - i * 0.5);
    c.quadraticCurveTo(W - i, H - 40 - i, W / 2 + 40, H - 14 - i);
    c.quadraticCurveTo(W / 2, H - i, W / 2 - 40, H - 14 - i);
    c.quadraticCurveTo(i, H - 40 - i, i, H - 90 - i * 0.5);
    c.lineTo(i, 34 + i);
    c.quadraticCurveTo(10 + i, 10 + i, 34 + i, i);
    c.closePath();
  }

  function drawBackground(t) {
    const g = ctx.createLinearGradient(0, 0, W * 0.6, H);
    g.addColorStop(0, t.bg[0]);
    g.addColorStop(0.45, t.bg[1]);
    g.addColorStop(1, t.bg[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Diagonal sheen stripes
    ctx.save();
    ctx.globalAlpha = t.shine * 0.35;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    for (let x = -H; x < W; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + H, 0);
      ctx.stroke();
    }
    ctx.restore();

    // Soft highlight behind the picture
    const r = ctx.createRadialGradient(W * 0.62, H * 0.3, 10, W * 0.62, H * 0.3, 260);
    r.addColorStop(0, `rgba(255,255,255,${t.shine})`);
    r.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);

    // Big faint triangle shapes for depth
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.55);
    ctx.lineTo(W, H * 0.35);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPicture(t) {
    const off = document.createElement('canvas');
    off.width = PIC.w * SCALE;
    off.height = PIC.h * SCALE;
    const o = off.getContext('2d');
    o.scale(SCALE, SCALE);

    if (img) {
      const base = Math.max(PIC.w / img.naturalWidth, PIC.h / img.naturalHeight);
      const s = base * card.zoom;
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      o.imageSmoothingQuality = 'high';
      o.drawImage(img, (PIC.w - dw) / 2 + card.offX, (PIC.h - dh) / 2 + card.offY, dw, dh);
    } else {
      // Silhouette placeholder
      o.fillStyle = t.accent;
      o.globalAlpha = 0.28;
      o.beginPath();
      o.arc(PIC.w / 2, PIC.h * 0.36, 58, 0, Math.PI * 2);
      o.fill();
      o.beginPath();
      o.ellipse(PIC.w / 2, PIC.h * 1.02, 120, 120, 0, Math.PI, 0);
      o.fill();
      o.globalAlpha = 0.7;
      o.font = '600 14px Inter, sans-serif';
      o.textAlign = 'center';
      o.fillStyle = t.text;
      o.fillText('Upload a picture', PIC.w / 2, PIC.h * 0.62);
    }

    // Fade the bottom and left edges into the card
    o.globalCompositeOperation = 'destination-in';
    const fy = o.createLinearGradient(0, 0, 0, PIC.h);
    fy.addColorStop(0, 'rgba(0,0,0,1)');
    fy.addColorStop(0.72, 'rgba(0,0,0,1)');
    fy.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = fy;
    o.fillRect(0, 0, PIC.w, PIC.h);
    const fx = o.createLinearGradient(0, 0, PIC.w, 0);
    fx.addColorStop(0, 'rgba(0,0,0,0)');
    fx.addColorStop(0.14, 'rgba(0,0,0,1)');
    fx.addColorStop(0.9, 'rgba(0,0,0,1)');
    fx.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = fx;
    o.fillRect(0, 0, PIC.w, PIC.h);

    ctx.drawImage(off, PIC.x, PIC.y, PIC.w, PIC.h);
  }

  function drawText(t) {
    const cond = '"Barlow Condensed", sans-serif';
    ctx.fillStyle = t.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Overall + position
    const cx = 70;
    ctx.font = `800 76px ${cond}`;
    ctx.fillText(String(overallOf(card)), cx, 112);
    const pos = (card.position || '').toUpperCase();
    fitFont(pos, 700, 30, 90);
    ctx.fillText(pos, cx, 146);

    // Divider + game name
    ctx.fillStyle = t.accent;
    ctx.fillRect(cx - 26, 162, 52, 2);
    ctx.fillStyle = t.text;
    const game = (card.game || '').toUpperCase();
    if (game) {
      const words = game.split(/\s+/);
      // Up to two lines, so longer game names stay readable
      let lines = [game];
      if (words.length > 1) {
        ctx.font = `700 17px ${cond}`;
        if (ctx.measureText(game).width > 96) {
          const mid = Math.ceil(words.length / 2);
          lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
        }
      }
      lines.forEach((line, i) => {
        fitFont(line, 700, 17, 96);
        ctx.fillText(line, cx, 186 + i * 18);
      });
    }

    // Name
    const name = (card.name || '').toUpperCase();
    fitFont(name, 800, 40, W - 70);
    ctx.fillText(name, W / 2, 360);

    // Divider
    ctx.fillStyle = t.accent;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(50, 376, W - 100, 1.5);
    ctx.globalAlpha = 1;

    // Stats: 5 columns
    const left = 30;
    const colW = (W - left * 2) / card.stats.length;
    card.stats.forEach((st, i) => {
      const x = left + colW * i + colW / 2;
      ctx.fillStyle = t.text;
      ctx.font = `800 36px ${cond}`;
      ctx.fillText(String(st.value), x, 424);
      const label = (st.label || '').toUpperCase();
      fitFont(label, 600, 17, colW - 8);
      ctx.globalAlpha = 0.85;
      ctx.fillText(label, x, 446);
      ctx.globalAlpha = 1;

      // Mini bar
      const bw = colW - 22;
      const bx = x - bw / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(bx, 456, bw, 4);
      ctx.fillStyle = t.accent;
      ctx.fillRect(bx, 456, bw * clamp(st.value, 0, 99) / 99, 4);
    });

    // Team / clan
    if (card.team) {
      ctx.fillStyle = t.text;
      ctx.globalAlpha = 0.8;
      const team = card.team.toUpperCase();
      fitFont(team, 600, 16, W - 120);
      ctx.fillText(team, W / 2, 498);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    const t = THEMES[card.theme] || THEMES.gold;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    cardPath(ctx);
    ctx.clip();
    drawBackground(t);
    drawPicture(t);
    drawText(t);
    ctx.restore();

    // Borders
    ctx.save();
    cardPath(ctx, 1.5);
    ctx.lineWidth = 3;
    ctx.strokeStyle = t.border;
    ctx.stroke();
    cardPath(ctx, 8);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = t.accent;
    ctx.stroke();
    ctx.restore();
  }

  // ---------- editor UI ----------

  function buildPresetSelect() {
    const sel = $('preset');
    for (const [key, p] of Object.entries(PRESETS)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = p.labels ? `${p.name} — ${p.labels.join(' · ')}` : p.name;
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => {
      card.preset = sel.value;
      const labels = PRESETS[sel.value].labels;
      if (labels) card.stats.forEach((st, i) => { st.label = labels[i]; });
      renderStats();
      draw();
    });
  }

  function renderStats() {
    const wrap = $('stats');
    wrap.innerHTML = '';
    card.stats.forEach((st, i) => {
      const row = document.createElement('div');
      row.className = 'stat';

      const label = document.createElement('input');
      label.type = 'text';
      label.maxLength = 4;
      label.value = st.label;
      label.setAttribute('aria-label', `Stat ${i + 1} name`);

      const range = document.createElement('input');
      range.type = 'range';
      range.min = 1;
      range.max = 99;
      range.value = st.value;
      range.setAttribute('aria-label', `Stat ${i + 1} value slider`);

      const num = document.createElement('input');
      num.type = 'number';
      num.min = 1;
      num.max = 99;
      num.value = st.value;
      num.setAttribute('aria-label', `Stat ${i + 1} value`);

      label.addEventListener('input', () => {
        st.label = label.value;
        card.preset = 'custom';
        $('preset').value = 'custom';
        draw();
      });
      range.addEventListener('input', () => {
        st.value = Number(range.value);
        num.value = st.value;
        syncOverall();
        draw();
      });
      num.addEventListener('input', () => {
        if (num.value === '') return;
        st.value = clamp(Math.round(Number(num.value)) || 1, 1, 99);
        range.value = st.value;
        syncOverall();
        draw();
      });
      num.addEventListener('blur', () => { num.value = st.value; });

      row.append(label, range, num);
      wrap.appendChild(row);
    });
  }

  function buildThemes() {
    const wrap = $('themes');
    for (const [key, t] of Object.entries(THEMES)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme';
      b.dataset.theme = key;
      b.setAttribute('role', 'radio');
      b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,${t.bg.join(',')})"></span><span class="label">${t.name}</span>`;
      b.addEventListener('click', () => {
        card.theme = key;
        syncThemeButtons();
        draw();
      });
      wrap.appendChild(b);
    }
  }

  function syncThemeButtons() {
    document.querySelectorAll('.theme').forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.theme === card.theme));
    });
  }

  function syncOverall() {
    if (card.autoOverall) $('overall').value = overallOf(card);
  }

  function syncForm() {
    $('game').value = card.game;
    $('name').value = card.name;
    $('position').value = card.position;
    $('team').value = card.team;
    $('preset').value = card.preset;
    $('autoOverall').checked = card.autoOverall;
    $('overall').disabled = card.autoOverall;
    $('overall').value = overallOf(card);
    $('zoom').value = card.zoom;
    renderStats();
    syncThemeButtons();
  }

  function bindTextInputs() {
    for (const key of ['game', 'name', 'position', 'team']) {
      $(key).addEventListener('input', (e) => {
        card[key] = e.target.value;
        draw();
      });
    }
    $('autoOverall').addEventListener('change', (e) => {
      card.autoOverall = e.target.checked;
      if (!card.autoOverall) card.overall = Number($('overall').value) || 75;
      $('overall').disabled = card.autoOverall;
      syncOverall();
      draw();
    });
    $('overall').addEventListener('input', (e) => {
      if (e.target.value === '') return;
      card.overall = clamp(Math.round(Number(e.target.value)) || 1, 1, 99);
      draw();
    });
  }

  // ---------- picture controls ----------

  function bindPictureControls() {
    $('image').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        card.image = await normalizeUpload(file);
        img = await loadImage(card.image);
        card.zoom = 1; card.offX = 0; card.offY = 0;
        $('zoom').value = 1;
        draw();
      } catch {
        setStatus("Couldn't read that image.");
      }
    });

    $('clearImage').addEventListener('click', () => {
      card.image = null;
      img = null;
      draw();
    });

    $('resetImage').addEventListener('click', () => {
      card.zoom = 1; card.offX = 0; card.offY = 0;
      $('zoom').value = 1;
      draw();
    });

    $('zoom').addEventListener('input', (e) => {
      card.zoom = Number(e.target.value);
      draw();
    });

    // Drag to reposition, wheel to zoom
    let drag = null;
    const toCard = (ev) => {
      const r = canvas.getBoundingClientRect();
      return { x: (ev.clientX - r.left) * (W / r.width), y: (ev.clientY - r.top) * (H / r.height) };
    };
    canvas.addEventListener('pointerdown', (ev) => {
      if (!img) return;
      const p = toCard(ev);
      drag = { x: p.x, y: p.y, offX: card.offX, offY: card.offY };
      canvas.setPointerCapture(ev.pointerId);
      canvas.classList.add('dragging');
    });
    canvas.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const p = toCard(ev);
      card.offX = drag.offX + (p.x - drag.x);
      card.offY = drag.offY + (p.y - drag.y);
      draw();
    });
    const endDrag = () => { drag = null; canvas.classList.remove('dragging'); };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', (ev) => {
      if (!img) return;
      ev.preventDefault();
      card.zoom = clamp(card.zoom * (ev.deltaY < 0 ? 1.06 : 1 / 1.06), 0.5, 3);
      $('zoom').value = card.zoom;
      draw();
    }, { passive: false });
  }

  // ---------- export + collection ----------

  function fileName() {
    const slug = (card.name || 'card').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${slug || 'card'}-${overallOf(card)}.png`;
  }

  function download() {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName();
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  }

  function readCollection() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function writeCollection(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  }

  function thumbnail() {
    const c = document.createElement('canvas');
    c.width = 280;
    c.height = 392;
    c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  function save() {
    const list = readCollection();
    if (!card.id) card.id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const entry = { card: { ...card, stats: card.stats.map((s) => ({ ...s })) }, thumb: thumbnail() };
    const idx = list.findIndex((e) => e.card.id === card.id);
    if (idx >= 0) list[idx] = entry; else list.unshift(entry);
    if (writeCollection(list)) {
      setStatus(idx >= 0 ? 'Card updated.' : 'Saved to your collection.');
      renderGallery();
    } else {
      setStatus('Storage is full — delete some cards first.');
    }
  }

  async function openCard(saved) {
    card = { ...DEFAULT_CARD(), ...saved, stats: saved.stats.map((s) => ({ ...s })) };
    img = card.image ? await loadImage(card.image).catch(() => null) : null;
    syncForm();
    draw();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderGallery() {
    const list = readCollection();
    const gal = $('gallery');
    gal.innerHTML = '';
    $('emptyCollection').hidden = list.length > 0;
    list.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      const im = document.createElement('img');
      im.src = entry.thumb;
      im.alt = `${entry.card.name} card`;
      im.title = 'Open in editor';
      im.addEventListener('click', () => openCard(entry.card));
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '×';
      del.title = 'Delete';
      del.setAttribute('aria-label', `Delete ${entry.card.name}`);
      del.addEventListener('click', () => {
        if (!confirm(`Delete "${entry.card.name}" from your collection?`)) return;
        writeCollection(readCollection().filter((e) => e.card.id !== entry.card.id));
        if (card.id === entry.card.id) card.id = null;
        renderGallery();
      });
      item.append(im, del);
      gal.appendChild(item);
    });
  }

  // ---------- init ----------

  buildPresetSelect();
  buildThemes();
  bindTextInputs();
  bindPictureControls();
  $('download').addEventListener('click', download);
  $('save').addEventListener('click', save);
  $('new').addEventListener('click', () => {
    card = DEFAULT_CARD();
    img = null;
    syncForm();
    draw();
  });

  syncForm();
  draw();
  renderGallery();

  // Redraw once the web fonts are ready so the canvas uses them.
  if (document.fonts) {
    Promise.all([
      document.fonts.load('800 40px "Barlow Condensed"'),
      document.fonts.load('600 17px "Barlow Condensed"'),
      document.fonts.load('700 17px "Barlow Condensed"'),
    ]).then(draw, () => {});
  }
})();
