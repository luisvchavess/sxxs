/* Nonna Lucia — cardápio em formato reels (1080×1920).
   Tudo é desenhado em canvas a partir do tempo t (segundos), então o mesmo
   código toca ao vivo na página e gera o MP4 quadro a quadro. */
(() => {
  'use strict';

  // ───────────────────────── marca e cardápio (edite aqui) ─────────────────────────
  const BRAND = {
    first: 'Nonna',
    second: 'Lucia',
    kicker: 'PIZZERIA NAPOLETANA · FORNO A LENHA',
    handle: '@nonnalucia.pizzeria',
    services: 'Delivery · Retirada · Salão',
    cta: 'Peça pelo link na bio',
  };

  const PIZZAS = [
    {
      type: 'margherita',
      tag: 'LA CLASSICA',
      name: 'Margherita',
      italian: 'pomodoro, fior di latte e basilico',
      accent: '#86B35A',
      ingredients: ['Tomate San Marzano', 'Fior di latte', 'Manjericão fresco', 'Azeite extravirgem', 'Flor de sal'],
      specs: [
        ['TAMANHO', '35 cm · 8 fatias'],
        ['MASSA', '48h de fermentação'],
        ['FORNO', 'Lenha · 485 °C'],
        ['PICÂNCIA', 0, 'Suave'],
      ],
      price: '62',
      note: ['a preferida', 'da casa'],
    },
    {
      type: 'diavola',
      tag: 'LA PICCANTE',
      name: 'Diavola',
      italian: 'salame piccante e miele al peperoncino',
      accent: '#E2553F',
      ingredients: ['Tomate San Marzano', 'Fior di latte', 'Salame picante', 'Pimenta fresca', 'Mel picante'],
      specs: [
        ['TAMANHO', '35 cm · 8 fatias'],
        ['MASSA', '48h de fermentação'],
        ['FORNO', 'Lenha · 485 °C'],
        ['PICÂNCIA', 4, 'Picante'],
      ],
      price: '72',
      note: ['pra quem', 'ama fogo'],
    },
    {
      type: 'parma',
      tag: 'LA RAFFINATA',
      name: 'Parma & Rúcula',
      italian: 'prosciutto crudo, rucola e grana',
      accent: '#E39A8E',
      ingredients: ['Fior di latte', 'Parma 18 meses', 'Rúcula', 'Grana Padano', 'Tomate confit', 'Balsâmico'],
      specs: [
        ['TAMANHO', '35 cm · 8 fatias'],
        ['MASSA', '48h de fermentação'],
        ['FORNO', 'Lenha · 485 °C'],
        ['PICÂNCIA', 0, 'Suave'],
      ],
      price: '79',
      note: ['Parma fresco,', 'pós-forno'],
    },
  ];

  // ───────────────────────── tempo ─────────────────────────
  const W = 1080, H = 1920, FPS = 30;
  const T_INTRO = 3.4;            // abertura
  const T_SCENE = 8;              // cada pizza
  const T_OUTRO = T_INTRO + PIZZAS.length * T_SCENE;
  const DUR = T_OUTRO + 4.6;      // ~32 s

  const COL = {
    bg: '#1A110C',
    cream: '#F4E9D8',
    muted: 'rgba(244,233,216,0.62)',
    faint: 'rgba(244,233,216,0.14)',
    gold: '#E3AC52',
    red: '#C93A2B',
    ink: '#1E130D',
  };

  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = "'Inter', system-ui, sans-serif";
  const HAND = "'Caveat', cursive";

  // ───────────────────────── utilidades ─────────────────────────
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = (t) => { const c1 = 1.9, c3 = c1 + 1; return t <= 0 ? 0 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function softDot(g, x, y, r, rgb, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`);
    gr.addColorStop(0.5, `rgba(${rgb},${a * 0.75})`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }

  function blob(g, x, y, r, R, n = 10, amt = 0.22) {
    const pts = [];
    const ph = R() * TAU;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + ph;
      const rr = r * (1 - amt + R() * amt * 2);
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    const mid = (i) => { const a = pts[i % n], b = pts[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    g.beginPath();
    const s = mid(n - 1);
    g.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const c = pts[i], e = mid(i); g.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
    g.closePath();
  }

  function radial(g, fn, n = 220) {
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU, rr = fn(a);
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
  }

  // pontos espalhados sem encostar demais (amostragem por rejeição)
  function scatter(R, count, rMin, rMax, minD, taken = []) {
    const out = [];
    let tries = 0;
    while (out.length < count && tries < 6000) {
      tries++;
      const a = R() * TAU;
      const rr = Math.sqrt(lerp(rMin * rMin, rMax * rMax, R()));
      const p = [Math.cos(a) * rr, Math.sin(a) * rr];
      const ok = [...out, ...taken].every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) >= minD);
      if (ok) out.push(p);
    }
    return out;
  }

  // ───────────────────────── ingredientes ─────────────────────────
  const PRD = 520; // raio da pizza na arte-base (px)

  function mozz(g, R, x, y, s) {
    g.save();
    g.shadowColor = 'rgba(236,170,100,0.9)';
    g.shadowBlur = s * 0.5;
    blob(g, x, y, s * 1.02, R, 11, 0.22);
    g.fillStyle = 'rgba(238,196,146,0.85)';
    g.fill();
    g.restore();

    g.save();
    blob(g, x, y, s * 0.92, R, 11, 0.2);
    const gr = g.createRadialGradient(x - s * 0.25, y - s * 0.25, s * 0.1, x, y, s * 1.1);
    gr.addColorStop(0, '#FFFDF6');
    gr.addColorStop(0.6, '#F7EDD6');
    gr.addColorStop(1, '#E6CFA0');
    g.fillStyle = gr;
    g.fill();
    g.clip();
    const n = 2 + Math.floor(R() * 5);
    for (let i = 0; i < n; i++) {
      softDot(g, x + (R() - 0.5) * s * 1.3, y + (R() - 0.5) * s * 1.3, s * (0.08 + R() * 0.2), '196,128,58', 0.3 + R() * 0.35);
    }
    softDot(g, x - s * 0.3, y - s * 0.35, s * 0.25, '255,255,255', 0.6);
    g.restore();
  }

  function basil(g, R, x, y, len, ang) {
    const w = len * 0.36;
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.shadowColor = 'rgba(0,0,0,0.45)';
    g.shadowBlur = len * 0.12;
    g.shadowOffsetY = len * 0.04;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(len * 0.25, -w, len * 0.75, -w * 0.8, len, 0);
    g.bezierCurveTo(len * 0.75, w * 0.8, len * 0.25, w, 0, 0);
    const lg = g.createLinearGradient(0, -w, 0, w);
    const dark = R() < 0.35;
    lg.addColorStop(0, dark ? '#3F7429' : '#579A3A');
    lg.addColorStop(0.5, dark ? '#2F5F1E' : '#3F7D2A');
    lg.addColorStop(1, dark ? '#224716' : '#2C5B1C');
    g.fillStyle = lg;
    g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(180,225,140,0.38)';
    g.lineCap = 'round';
    g.lineWidth = len * 0.025;
    g.beginPath(); g.moveTo(len * 0.04, 0); g.quadraticCurveTo(len * 0.5, -w * 0.08, len * 0.92, 0); g.stroke();
    g.lineWidth = len * 0.012;
    for (let i = 1; i <= 4; i++) {
      const t = i / 5, k = 0.55 * (1 - Math.abs(t - 0.5));
      g.beginPath(); g.moveTo(len * t, 0); g.quadraticCurveTo(len * (t + 0.06), -w * k * 0.5, len * (t + 0.13), -w * k); g.stroke();
      g.beginPath(); g.moveTo(len * t, 0); g.quadraticCurveTo(len * (t + 0.06), w * k * 0.5, len * (t + 0.13), w * k); g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,0.13)';
    g.beginPath(); g.ellipse(len * 0.42, -w * 0.32, len * 0.2, w * 0.14, -0.1, 0, TAU); g.fill();
    g.restore();
  }

  function salami(g, R, x, y, s) {
    g.save();
    g.shadowColor = 'rgba(226,110,35,0.85)';
    g.shadowBlur = s * 0.5;
    g.beginPath(); g.arc(x, y, s * 1.03, 0, TAU);
    g.fillStyle = 'rgba(206,86,30,0.55)';
    g.fill();
    g.restore();

    g.save();
    blob(g, x, y, s, R, 16, 0.05);
    const gr = g.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.1, x, y, s);
    gr.addColorStop(0, '#C63F29');
    gr.addColorStop(0.7, '#A12816');
    gr.addColorStop(1, '#6E150B');
    g.fillStyle = gr;
    g.fill();
    g.clip();
    for (let i = 0; i < 16; i++) {
      const a = R() * TAU, rr = Math.sqrt(R()) * s * 0.82;
      g.fillStyle = `rgba(242,${180 + R() * 30},${165 + R() * 25},${0.55 + R() * 0.3})`;
      g.beginPath(); g.ellipse(x + Math.cos(a) * rr, y + Math.sin(a) * rr, s * (0.03 + R() * 0.05), s * (0.025 + R() * 0.035), R() * TAU, 0, TAU); g.fill();
    }
    for (let i = 0; i < 10; i++) {
      const a = R() * TAU, rr = Math.sqrt(R()) * s * 0.85;
      g.fillStyle = 'rgba(40,8,4,0.55)';
      g.beginPath(); g.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, s * 0.025, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(66,10,5,0.7)';
    g.lineWidth = s * 0.14;
    g.beginPath(); g.arc(x, y, s * 0.98, 0, TAU); g.stroke();
    softDot(g, x - s * 0.35, y - s * 0.35, s * 0.4, '255,215,195', 0.32);
    g.restore();
  }

  function chili(g, R, x, y, s) {
    g.save();
    g.translate(x, y);
    g.rotate(R() * TAU);
    g.shadowColor = 'rgba(0,0,0,0.35)';
    g.shadowBlur = s * 0.4;
    g.fillStyle = '#D3261A';
    g.beginPath(); g.ellipse(0, 0, s, s * 0.86, 0, 0, TAU); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = '#F2DDB4';
    g.beginPath(); g.ellipse(0, 0, s * 0.72, s * 0.6, 0, 0, TAU); g.fill();
    g.fillStyle = '#B5301E';
    g.beginPath(); g.ellipse(0, 0, s * 0.56, s * 0.46, 0, 0, TAU); g.fill();
    g.fillStyle = '#F5E3A2';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + R();
      g.beginPath(); g.ellipse(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.25, s * 0.12, s * 0.08, a, 0, TAU); g.fill();
    }
    softDot(g, -s * 0.4, -s * 0.4, s * 0.4, '255,255,255', 0.35);
    g.restore();
  }

  function drizzle(g, R, color, width, reach, loops) {
    const ang = R() * TAU;
    const pts = [];
    for (let j = 0; j <= loops; j++) {
      const yy = lerp(-reach, reach, j / loops) + (R() - 0.5) * reach * (1.4 / loops);
      const half = Math.sqrt(Math.max(0, reach * reach - yy * yy)) * (0.45 + R() * 0.55);
      const xx = (j % 2 ? 1 : -1) * half;
      pts.push([xx * Math.cos(ang) - yy * Math.sin(ang), xx * Math.sin(ang) + yy * Math.cos(ang)]);
    }
    const path = () => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
        g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      const l = pts[pts.length - 1];
      g.lineTo(l[0], l[1]);
    };
    g.save();
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.shadowColor = 'rgba(0,0,0,0.3)';
    g.shadowBlur = width;
    path(); g.strokeStyle = color; g.lineWidth = width; g.stroke();
    g.shadowColor = 'transparent';
    g.translate(-width * 0.18, -width * 0.18);
    path(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = width * 0.3; g.stroke();
    g.restore();
  }

  function rucola(g, R, x, y, len, ang) {
    const cols = ['#4F7F2D', '#3E6E24', '#5E8F37', '#355F1D', '#46782A'];
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.shadowColor = 'rgba(0,0,0,0.42)';
    g.shadowBlur = len * 0.12;
    g.shadowOffsetY = len * 0.04;
    const n = 14, w = len * 0.17, ph = R() * 3;
    const top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const base = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.05)), 0.7);
      const lobe = 0.45 + 0.55 * Math.abs(Math.sin(s * Math.PI * 3.5 + ph));
      const wid = w * base * lobe * (s < 0.18 ? 0.35 : 1);
      top.push([s * len, -wid * (0.85 + R() * 0.3)]);
      bot.push([s * len, wid * (0.85 + R() * 0.3)]);
    }
    g.beginPath();
    g.moveTo(-len * 0.12, 0);
    top.forEach((p) => g.lineTo(p[0], p[1]));
    for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]);
    g.closePath();
    g.fillStyle = cols[Math.floor(R() * cols.length)];
    g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(190,230,150,0.35)';
    g.lineWidth = len * 0.022;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(-len * 0.12, 0); g.lineTo(len * 0.9, 0); g.stroke();
    g.restore();
  }

  function prosciutto(g, R, x, y, len, ang) {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.shadowColor = 'rgba(60,10,10,0.45)';
    g.shadowBlur = len * 0.1;
    g.shadowOffsetY = len * 0.03;
    const n = 30, w = len * 0.4, ph = R() * 3, ph2 = R() * 3;
    const top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const xx = s * len;
      const curve = Math.sin(s * Math.PI * 1.3 + ph) * len * 0.09;
      const wid = w * (0.72 + 0.28 * Math.sin(s * Math.PI * 5 + ph2)) * Math.pow(Math.sin(Math.PI * clamp(s * 0.96 + 0.02)), 0.35);
      top.push([xx, curve - wid / 2]);
      bot.push([xx, curve + wid / 2]);
    }
    const body = () => {
      g.beginPath();
      top.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]);
      g.closePath();
    };
    body();
    const lg = g.createLinearGradient(0, 0, len, 0);
    const folds = 7;
    for (let f = 0; f <= folds; f++) lg.addColorStop(f / folds, f % 2 ? '#C2545B' : '#E88F90');
    g.fillStyle = lg;
    g.fill();
    g.shadowColor = 'transparent';
    g.save();
    body(); g.clip();
    g.strokeStyle = 'rgba(248,230,222,0.95)';
    g.lineWidth = w * 0.22;
    g.lineJoin = 'round';
    g.beginPath();
    top.forEach((p, i) => (i ? g.lineTo(p[0], p[1] + w * 0.06) : g.moveTo(p[0], p[1] + w * 0.06)));
    g.stroke();
    g.strokeStyle = 'rgba(255,236,232,0.3)';
    g.lineWidth = w * 0.03;
    for (let k = 0; k < 3; k++) {
      const off = lerp(0.15, 0.4, R()) * w;
      g.beginPath();
      top.forEach((p, i) => { const yy = p[1] + off + Math.sin(i * 0.7 + k) * w * 0.04; i ? g.lineTo(p[0], yy) : g.moveTo(p[0], yy); });
      g.stroke();
    }
    const sh = g.createLinearGradient(0, -w, 0, w);
    sh.addColorStop(0, 'rgba(255,255,255,0.18)');
    sh.addColorStop(1, 'rgba(90,10,20,0.18)');
    g.fillStyle = sh;
    g.fillRect(-10, -w * 1.5, len + 20, w * 3);
    g.restore();
    g.restore();
  }

  function shaving(g, R, x, y, s) {
    g.save();
    g.translate(x, y);
    g.rotate(R() * TAU);
    g.shadowColor = 'rgba(0,0,0,0.35)';
    g.shadowBlur = s * 0.3;
    g.shadowOffsetY = s * 0.08;
    g.beginPath();
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (R() - 0.5) * 0.6;
      const rr = s * (0.55 + R() * 0.5) * (i % 2 ? 0.6 : 1);
      i ? g.lineTo(Math.cos(a) * rr * 1.4, Math.sin(a) * rr * 0.8) : g.moveTo(Math.cos(a) * rr * 1.4, Math.sin(a) * rr * 0.8);
    }
    g.closePath();
    const lg = g.createLinearGradient(-s, -s, s, s);
    lg.addColorStop(0, '#FBF1D2');
    lg.addColorStop(1, '#E3CD93');
    g.fillStyle = lg;
    g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(170,140,80,0.35)';
    g.lineWidth = 1.5;
    g.stroke();
    g.restore();
  }

  function tomato(g, R, x, y, s) {
    g.save();
    g.translate(x, y);
    g.rotate(R() * TAU);
    g.shadowColor = 'rgba(0,0,0,0.4)';
    g.shadowBlur = s * 0.4;
    g.shadowOffsetY = s * 0.1;
    g.fillStyle = '#B92415';
    g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = '#D9452E';
    g.beginPath(); g.arc(0, 0, s * 0.84, 0, TAU); g.fill();
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU;
      g.fillStyle = 'rgba(240,170,70,0.85)';
      g.beginPath(); g.ellipse(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42, s * 0.27, s * 0.17, a, 0, TAU); g.fill();
      g.fillStyle = 'rgba(250,230,170,0.9)';
      for (let j = 0; j < 3; j++) {
        g.beginPath(); g.arc(Math.cos(a) * s * (0.32 + j * 0.08), Math.sin(a) * s * (0.32 + j * 0.08), s * 0.04, 0, TAU); g.fill();
      }
    }
    g.fillStyle = '#E8735A';
    g.beginPath(); g.arc(0, 0, s * 0.16, 0, TAU); g.fill();
    softDot(g, -s * 0.35, -s * 0.4, s * 0.4, '255,255,255', 0.45);
    g.strokeStyle = 'rgba(90,10,5,0.45)';
    g.lineWidth = s * 0.07;
    g.beginPath(); g.arc(0, 0, s * 0.97, 0, TAU); g.stroke();
    g.restore();
  }

  // ───────────────────────── a pizza inteira ─────────────────────────
  function makePizza(type, seed) {
    const S = PRD * 2 + 40;
    const c = mk(S, S);
    const g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    const R = rng(seed);
    const Rr = PRD;

    const k = [5 + Math.floor(R() * 3), R() * 6, 11 + Math.floor(R() * 4), R() * 6, 7 + Math.floor(R() * 3), R() * 6];
    const outer = (a) => Rr * (1 + 0.012 * Math.sin(a * k[0] + k[1]) + 0.009 * Math.sin(a * k[2] + k[3]));
    const inner = (a) => Rr * 0.8 * (1 + 0.02 * Math.sin(a * k[4] + k[5]) + 0.012 * Math.sin(a * 17 + k[1]));

    // borda (cornicione) com as manchinhas de forno a lenha
    radial(g, outer);
    const cg = g.createRadialGradient(0, 0, Rr * 0.7, 0, 0, Rr);
    cg.addColorStop(0, '#F2C887');
    cg.addColorStop(0.5, '#E8B06A');
    cg.addColorStop(0.85, '#D08E48');
    cg.addColorStop(1, '#A8632D');
    g.fillStyle = cg;
    g.fill();
    g.save();
    radial(g, outer);
    g.clip();
    for (let i = 0; i < 130; i++) {
      const a = R() * TAU, rad = Rr * (0.84 + R() * 0.16), s = Rr * (0.006 + R() * R() * 0.032);
      softDot(g, Math.cos(a) * rad, Math.sin(a) * rad, s, `${35 + Math.floor(R() * 30)},${18 + Math.floor(R() * 12)},8`, 0.45 + R() * 0.45);
    }
    g.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const a0 = R() * TAU, len = 0.2 + R() * 0.4;
      g.strokeStyle = `rgba(255,232,190,${0.1 + R() * 0.15})`;
      g.lineWidth = Rr * (0.015 + R() * 0.02);
      g.beginPath(); g.arc(0, 0, Rr * (0.89 + R() * 0.06), a0, a0 + len); g.stroke();
    }
    for (let i = 0; i < 220; i++) {
      const a = R() * TAU, rad = Rr * (0.86 + R() * 0.14);
      g.fillStyle = `rgba(255,250,240,${0.15 + R() * 0.3})`;
      g.beginPath(); g.arc(Math.cos(a) * rad, Math.sin(a) * rad, 0.8 + R() * 2.2, 0, TAU); g.fill();
    }
    g.restore();

    // sombra do "lábio" da borda
    g.save();
    g.shadowColor = 'rgba(110,50,15,0.7)';
    g.shadowBlur = Rr * 0.05;
    radial(g, (a) => inner(a) * 1.01);
    g.strokeStyle = 'rgba(150,80,30,0.6)';
    g.lineWidth = Rr * 0.025;
    g.stroke();
    g.restore();

    // base
    radial(g, inner);
    const red = type !== 'parma';
    const bg = g.createRadialGradient(-Rr * 0.1, -Rr * 0.1, 0, 0, 0, Rr * 0.82);
    if (red) { bg.addColorStop(0, '#C9432A'); bg.addColorStop(1, '#A42A17'); }
    else { bg.addColorStop(0, '#FBF3E2'); bg.addColorStop(1, '#EED9AE'); }
    g.fillStyle = bg;
    g.fill();

    g.save();
    radial(g, (a) => inner(a) * 1.03);
    g.clip();

    for (let i = 0; i < 520; i++) {
      const a = R() * TAU, rr = Math.sqrt(R()) * Rr * 0.8, s = Rr * (0.004 + R() * 0.012);
      const tone = red ? (R() < 0.5 ? '140,30,14' : '222,90,60') : (R() < 0.6 ? '200,150,80' : '255,250,235');
      softDot(g, Math.cos(a) * rr, Math.sin(a) * rr, s, tone, 0.35);
    }

    if (!red) {
      for (let i = 0; i < 40; i++) {
        const a = R() * TAU, rr = Math.sqrt(R()) * Rr * 0.78;
        softDot(g, Math.cos(a) * rr, Math.sin(a) * rr, Rr * (0.02 + R() * 0.05), '205,140,62', 0.18 + R() * 0.3);
      }
    }

    if (type === 'margherita') {
      scatter(R, 9, Rr * 0.14, Rr * 0.62, Rr * 0.27).forEach((p) => mozz(g, R, p[0], p[1], Rr * (0.13 + R() * 0.04)));
      for (let i = 0; i < 8; i++) {
        blob(g, (R() - 0.5) * Rr, (R() - 0.5) * Rr, Rr * (0.05 + R() * 0.06), R, 8, 0.3);
        g.fillStyle = 'rgba(232,180,60,0.16)';
        g.fill();
      }
      const a0 = R() * TAU;
      for (let i = 0; i < 3; i++) basil(g, R, 0, 0, Rr * 0.23, a0 + i * 2.1);
      scatter(R, 4, Rr * 0.35, Rr * 0.66, Rr * 0.3).forEach((p) => basil(g, R, p[0], p[1], Rr * (0.16 + R() * 0.05), R() * TAU));
      for (let i = 0; i < 12; i++) {
        const a = R() * TAU, rr = Math.sqrt(R()) * Rr * 0.75;
        softDot(g, Math.cos(a) * rr, Math.sin(a) * rr, Rr * 0.012, '255,255,255', 0.7);
      }
    }

    if (type === 'diavola') {
      scatter(R, 11, 0, Rr * 0.64, Rr * 0.22).forEach((p) => mozz(g, R, p[0], p[1], Rr * (0.1 + R() * 0.035)));
      scatter(R, 12, 0, Rr * 0.66, Rr * 0.2).forEach((p) => salami(g, R, p[0], p[1], Rr * (0.098 + R() * 0.012)));
      scatter(R, 3, Rr * 0.2, Rr * 0.6, Rr * 0.3).forEach((p) => basil(g, R, p[0], p[1], Rr * 0.13, R() * TAU));
      scatter(R, 8, 0, Rr * 0.7, Rr * 0.14).forEach((p) => chili(g, R, p[0], p[1], Rr * 0.042));
      for (let i = 0; i < 140; i++) {
        const a = R() * TAU, rr = Math.sqrt(R()) * Rr * 0.78;
        g.fillStyle = R() < 0.5 ? 'rgba(200,30,15,0.9)' : 'rgba(240,120,40,0.85)';
        g.beginPath(); g.ellipse(Math.cos(a) * rr, Math.sin(a) * rr, 2 + R() * 3, 1 + R() * 2, R() * TAU, 0, TAU); g.fill();
      }
      drizzle(g, R, 'rgba(238,168,48,0.7)', Rr * 0.007, Rr * 0.66, 15);
    }

    if (type === 'parma') {
      scatter(R, 10, 0, Rr * 0.62, Rr * 0.24).forEach((p) => mozz(g, R, p[0], p[1], Rr * (0.14 + R() * 0.04)));
      scatter(R, 8, Rr * 0.25, Rr * 0.7, Rr * 0.2).forEach((p) => tomato(g, R, p[0], p[1], Rr * 0.05));
      const a0 = R() * TAU;
      for (let i = 0; i < 7; i++) {
        const a = a0 + (i / 7) * TAU + (R() - 0.5) * 0.25;
        const rad = Rr * (0.47 + R() * 0.05), len = Rr * (0.44 + R() * 0.06);
        const ang = a + Math.PI / 2 + (R() - 0.5) * 0.5;
        const cx = Math.cos(a) * rad, cy = Math.sin(a) * rad;
        prosciutto(g, R, cx - Math.cos(ang) * len / 2, cy - Math.sin(ang) * len / 2, len, ang);
      }
      for (let i = 0; i < 8; i++) {
        const a = a0 + ((i + 0.5) / 8) * TAU;
        rucola(g, R, Math.cos(a) * Rr * 0.62, Math.sin(a) * Rr * 0.62, Rr * (0.15 + R() * 0.05), a + Math.PI + (R() - 0.5));
      }
      for (let i = 0; i < 30; i++) {
        const a = R() * TAU, rr = Math.sqrt(R()) * Rr * 0.3;
        rucola(g, R, Math.cos(a) * rr, Math.sin(a) * rr, Rr * (0.17 + R() * 0.08), a + (R() - 0.5) * 1.6);
      }
      scatter(R, 14, 0, Rr * 0.55, Rr * 0.1).forEach((p) => shaving(g, R, p[0], p[1], Rr * (0.045 + R() * 0.025)));
      drizzle(g, R, 'rgba(58,24,16,0.75)', Rr * 0.0055, Rr * 0.6, 13);
    }
    g.restore();

    // luz geral: brilho em cima à esquerda, sombra embaixo à direita
    g.save();
    g.globalCompositeOperation = 'source-atop';
    const lg = g.createLinearGradient(-Rr, -Rr, Rr, Rr);
    lg.addColorStop(0, 'rgba(255,240,215,0.10)');
    lg.addColorStop(0.5, 'rgba(255,240,215,0)');
    lg.addColorStop(1, 'rgba(20,6,0,0.22)');
    g.fillStyle = lg;
    g.fillRect(-S / 2, -S / 2, S, S);
    g.restore();
    return c;
  }

  function makeBoard(seed) {
    const BR = PRD * 1.13, pad = 140;
    const S = Math.ceil(BR * 2 + pad * 2);
    const c = mk(S, S);
    const g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    const R = rng(seed);
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.7)';
    g.shadowBlur = 90;
    g.shadowOffsetY = 45;
    g.beginPath(); g.arc(0, 0, BR, 0, TAU);
    g.fillStyle = '#5E3820';
    g.fill();
    g.restore();
    g.save();
    g.beginPath(); g.arc(0, 0, BR, 0, TAU); g.clip();
    const wg = g.createRadialGradient(-BR * 0.3, -BR * 0.3, 0, 0, 0, BR);
    wg.addColorStop(0, '#8A5A34');
    wg.addColorStop(1, '#5A341C');
    g.fillStyle = wg;
    g.fillRect(-BR, -BR, BR * 2, BR * 2);
    const ph = R() * 6, ph2 = R() * 6;
    for (let i = 0; i < 170; i++) {
      const y0 = -BR + (i / 170) * BR * 2 + (R() - 0.5) * 6;
      const dark = R() < 0.7;
      g.strokeStyle = dark ? `rgba(40,20,8,${0.06 + R() * 0.2})` : `rgba(190,135,85,${0.06 + R() * 0.12})`;
      g.lineWidth = 1 + R() * 2.5;
      g.beginPath();
      for (let x = -BR; x <= BR; x += 12) {
        const y = y0 + Math.sin(x * 0.006 + ph + i * 0.05) * 9 + Math.sin(x * 0.0021 + ph2) * 16;
        x === -BR ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    for (let i = 0; i < 90; i++) {
      const a = R() * TAU, rr = BR * (0.8 + R() * 0.2);
      g.fillStyle = `rgba(255,250,240,${0.05 + R() * 0.12})`;
      g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1 + R() * 3, 0, TAU); g.fill();
    }
    g.restore();
    g.lineWidth = 7;
    g.strokeStyle = 'rgba(255,215,170,0.16)';
    g.beginPath(); g.arc(0, 0, BR - 9, 0, TAU); g.stroke();
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(0,0,0,0.45)';
    g.beginPath(); g.arc(0, 0, BR - 1, 0, TAU); g.stroke();
    return c;
  }

  function makePuff() {
    const c = mk(128, 128);
    const g = c.getContext('2d');
    softDot(g, 64, 64, 64, '255,250,240', 1);
    return c;
  }

  function makeGrain() {
    const c = mk(256, 256);
    const g = c.getContext('2d');
    const img = g.createImageData(256, 256);
    const R = rng(7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(R() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function makeVignette() {
    const c = mk(W, H);
    const g = c.getContext('2d');
    const vg = g.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.5, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  }

  const REEL_BASE = (document.currentScript && document.currentScript.src) || location.href;

  // ───────────────────────── estado ─────────────────────────
  let ctx, canvas, PZ, BOARD, PUFF, GRAIN, VIGN, grainPattern;
  const EMBERS = (() => {
    const R = rng(99);
    return Array.from({ length: 46 }, () => ({ x: R() * W, sp: 40 + R() * 90, off: R() * H, sz: 1.5 + R() * 3.5, ph: R() * TAU, fl: 2 + R() * 5 }));
  })();

  // ───────────────────────── desenho por quadro ─────────────────────────
  function setFont(weight, size, family, style = 'normal') {
    ctx.font = `${style} ${weight} ${size}px ${family}`;
  }

  function text(s, x, y, o = {}) {
    ctx.save();
    setFont(o.weight || 400, o.size || 32, o.family || SANS, o.style);
    ctx.fillStyle = o.color || COL.cream;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px';
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  function measure(s, weight, size, family, style = 'normal', ls = 0) {
    ctx.save();
    setFont(weight, size, family, style);
    if ('letterSpacing' in ctx) ctx.letterSpacing = ls + 'px';
    const w = ctx.measureText(s).width;
    ctx.restore();
    return w;
  }

  // texto que sobe de dentro de uma "máscara"
  function reveal(s, x, y, size, k, o = {}) {
    if (k <= 0) return;
    ctx.save();
    const w = W;
    const left = o.align === 'center' ? x - w / 2 : x - 30;
    ctx.beginPath();
    ctx.rect(left, y - size * 1.05, w + 60, size * 1.38);
    ctx.clip();
    text(s, x, y + (1 - eOut(k)) * size * 1.25, { ...o, size });
    ctx.restore();
  }

  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function background(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#27180F');
    g.addColorStop(0.55, '#1A110C');
    g.addColorStop(1, '#110A07');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const fl = 1 + 0.05 * Math.sin(t * 7.3) + 0.035 * Math.sin(t * 12.1 + 1) + 0.03 * Math.sin(t * 3.1);
    const gl = ctx.createRadialGradient(W / 2, 640, 0, W / 2, 640, 820 * fl);
    gl.addColorStop(0, `rgba(255,146,64,${0.3 * fl})`);
    gl.addColorStop(0.45, 'rgba(196,78,30,0.12)');
    gl.addColorStop(1, 'rgba(120,40,10,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);
    const gl2 = ctx.createRadialGradient(W / 2, H + 120, 0, W / 2, H + 120, 900);
    gl2.addColorStop(0, `rgba(255,120,40,${0.16 * fl})`);
    gl2.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = gl2;
    ctx.fillRect(0, 0, W, H);
  }

  function embers(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of EMBERS) {
      const y = H + 40 - ((t * e.sp + e.off) % (H + 80));
      const x = e.x + Math.sin(t * 0.9 + e.ph) * 36 + Math.sin(t * 2.3 + e.ph * 2) * 8;
      const life = clamp(y / H);
      const a = (0.35 + 0.35 * Math.sin(t * e.fl + e.ph)) * Math.pow(life, 0.7);
      softDot(ctx, x, y, e.sz * 4, '255,150,60', a * 0.35);
      softDot(ctx, x, y, e.sz, '255,214,150', a);
    }
    ctx.restore();
  }

  function steam(x, y, R, t, a) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let k = 0; k < 6; k++) {
      for (let j = 0; j < 14; j++) {
        const ph = (t * 0.33 + k * 0.21 + j / 14) % 1;
        const px = x + (k - 2.5) * R * 0.27 + Math.sin(ph * 6 + k * 1.7 + t * 0.8) * R * 0.12 * ph;
        const py = y - R * 0.15 - ph * R * 1.15;
        const s = R * (0.14 + ph * 0.3);
        ctx.globalAlpha = a * 0.07 * Math.sin(Math.PI * ph);
        ctx.drawImage(PUFF, px - s, py - s, s * 2, s * 2);
      }
    }
    ctx.restore();
  }

  function pizzaGroup(i, x, y, R, rot, t, steamA = 1, withBoard = true) {
    const sc = R / PRD;
    ctx.save();
    ctx.translate(x, y);
    if (withBoard) {
      const bs = BOARD.width * sc;
      ctx.drawImage(BOARD, -bs / 2, -bs / 2, bs, bs);
    } else {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = R * 0.35;
      ctx.shadowOffsetY = R * 0.15;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.arc(0, 0, R * 0.96, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.rotate(rot);
    const ps = PZ[i].width * sc;
    ctx.drawImage(PZ[i], -ps / 2, -ps / 2, ps, ps);
    ctx.restore();
    if (steamA > 0) steam(x, y, R, t, steamA);
  }

  function tricolor(cx, y, w, k) {
    if (k <= 0) return;
    const ww = w * eOut(k), seg = ww / 3, h = 6;
    const x0 = cx - ww / 2;
    ['#3E8E4A', '#F4E9D8', '#C93A2B'].forEach((c, i) => {
      ctx.fillStyle = c;
      rrect(x0 + i * seg + (i ? 2 : 0), y, seg - (i ? 2 : 0), h, 3);
      ctx.fill();
    });
  }

  function heatDots(x, y, n, color, k) {
    for (let i = 0; i < 5; i++) {
      const on = i < n;
      const s = eBack(clamp(k * 1.6 - i * 0.15));
      ctx.save();
      ctx.translate(x + i * 30, y);
      ctx.scale(s, s);
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU);
      if (on) { ctx.fillStyle = color; ctx.fill(); }
      else { ctx.strokeStyle = 'rgba(244,233,216,0.35)'; ctx.lineWidth = 2.5; ctx.stroke(); }
      ctx.restore();
    }
  }

  function header(t, a, idx, frac) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    // barrinhas de progresso estilo stories
    const x0 = 72, x1 = W - 72, gap = 10, n = PIZZAS.length;
    const sw = (x1 - x0 - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (sw + gap);
      ctx.fillStyle = 'rgba(244,233,216,0.18)';
      rrect(x, 96, sw, 6, 3); ctx.fill();
      const f = i < idx ? 1 : i === idx ? frac : 0;
      if (f > 0) { ctx.fillStyle = COL.cream; rrect(x, 96, sw * f, 6, 3); ctx.fill(); }
    }
    text(BRAND.first.toUpperCase() + ' ' + BRAND.second.toUpperCase(), 72, 168, { family: SERIF, weight: 600, size: 32, ls: 5 });
    text('pizzeria napoletana', 72, 202, { size: 21, ls: 3, color: COL.muted });
    if (idx >= 0 && idx < n) {
      const num = String(idx + 1).padStart(2, '0');
      const tw = measure('/' + String(n).padStart(2, '0'), 600, 24, SANS);
      text('/' + String(n).padStart(2, '0'), W - 72, 196, { size: 24, weight: 600, color: COL.muted, align: 'right' });
      text(num, W - 72 - tw - 6, 196, { family: SERIF, weight: 800, size: 64, color: COL.gold, align: 'right' });
    }
    ctx.restore();
  }

  function stamp(x, y, price, k, t) {
    if (k <= 0) return;
    const s = eBack(k);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.2 + Math.sin(t * 1.6) * 0.03);
    ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = COL.gold;
    ctx.beginPath();
    const r = 110, n = 28;
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * TAU, rr = i % 2 ? r : r * 0.94;
      i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = 'rgba(30,19,13,0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    text('R$', 0, -30, { size: 26, weight: 600, color: COL.ink, align: 'center', ls: 2 });
    text(price, 0, 46, { family: SERIF, weight: 800, size: 84, color: COL.ink, align: 'center' });
    ctx.restore();
  }

  function handNote(lines, k, kArrow) {
    if (k <= 0) return;
    ctx.save();
    ctx.translate(76, 330);
    ctx.rotate(-0.08);
    ctx.globalAlpha *= eOut(k);
    const yy = (1 - eOut(k)) * 14;
    lines.forEach((l, i) => text(l, 0, yy + i * 54, { family: HAND, weight: 600, size: 52, color: COL.gold }));
    ctx.restore();
    if (kArrow <= 0) return;
    // seta desenhada à mão apontando pra pizza
    const P0 = [236, 410], C1 = [292, 402], P1 = [318, 462];
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      pts.push([(1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * C1[0] + u * u * P1[0], (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * C1[1] + u * u * P1[1]]);
    }
    const n = Math.max(1, Math.floor(eOut(kArrow) * 30));
    ctx.save();
    ctx.strokeStyle = COL.gold;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= n; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    if (kArrow > 0.85) {
      const e = pts[30], d = [pts[30][0] - pts[27][0], pts[30][1] - pts[27][1]];
      const a = Math.atan2(d[1], d[0]);
      ctx.beginPath();
      ctx.moveTo(e[0] + Math.cos(a + 2.5) * 22, e[1] + Math.sin(a + 2.5) * 22);
      ctx.lineTo(e[0], e[1]);
      ctx.lineTo(e[0] + Math.cos(a - 2.5) * 22, e[1] + Math.sin(a - 2.5) * 22);
      ctx.stroke();
    }
    ctx.restore();
  }

  const PEEK_Y = 1985, PEEK_R = 520, SCENE_Y = 600, SCENE_R = 300;

  function intro(t) {
    const out = eInOut(prog(t, 2.95, 3.55));
    if (out >= 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - out;
    ctx.translate(0, -out * 70);
    text(BRAND.kicker, W / 2, 712, { size: 22, weight: 600, ls: 6, color: COL.gold, align: 'center', alpha: eOut(prog(t, 0.3, 0.9)) });

    // letras sobem uma a uma
    const word = (s, y, size, style, color, t0) => {
      const fam = SERIF, wt = style === 'italic' ? 500 : 800;
      const total = measure(s, wt, size, fam, style);
      let x = W / 2 - total / 2;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        const k = prog(t, t0 + i * 0.06, t0 + i * 0.06 + 0.6);
        ctx.save();
        ctx.beginPath(); ctx.rect(0, y - size * 1.0, W, size * 1.3); ctx.clip();
        text(ch, x, y + (1 - eOut(k)) * size * 1.1, { family: fam, weight: wt, size, style, color });
        ctx.restore();
        x += measure(ch, wt, size, fam, style);
      }
    };
    word(BRAND.first, 910, 196, 'normal', COL.cream, 0.45);
    word(BRAND.second, 1085, 196, 'italic', COL.gold, 0.75);
    tricolor(W / 2, 1140, 150, prog(t, 1.2, 1.8));
    text('Il Menù', W / 2, 1238, { family: SERIF, style: 'italic', weight: 500, size: 58, align: 'center', alpha: eOut(prog(t, 1.5, 2.1)) });
    ctx.save();
    ctx.translate(W / 2, 1306);
    ctx.rotate(-0.03);
    text('os 3 primeiros sabores', 0, 0, { family: HAND, weight: 600, size: 62, color: COL.gold, align: 'center', alpha: eOut(prog(t, 1.85, 2.4)) });
    ctx.restore();
    ctx.restore();

    // a primeira pizza já aparece espiando lá embaixo
    const rise = eOut(prog(t, 0.5, 2.3));
    if (t < T_INTRO) pizzaGroup(0, W / 2, lerp(PEEK_Y + 560, PEEK_Y, rise), PEEK_R, t * 0.18, t, rise);
  }

  function scene(i, u, t) {
    const P = PIZZAS[i];
    const enter = eOut(prog(u, 0, 1.0));
    const exit = eInOut(prog(u, T_SCENE - 0.45, T_SCENE + 0.45));

    let x = W / 2, y = SCENE_Y, R = SCENE_R, rot = t * 0.18 + i * 1.3;
    if (i === 0) {
      const e = eInOut(prog(u, 0, 1.1));
      y = lerp(PEEK_Y, SCENE_Y, e);
      R = lerp(PEEK_R, SCENE_R, e);
    } else {
      x = lerp(W + 440, W / 2, enter);
      rot += (1 - enter) * 2.4;
    }
    x -= exit * (W / 2 + 440);
    rot -= exit * 2;

    // numeral gigante vazado ao fundo
    ctx.save();
    ctx.globalAlpha = 0.07 * (1 - exit) * enter;
    setFont(800, 820, SERIF);
    ctx.textAlign = 'right';
    ctx.lineWidth = 3;
    ctx.strokeStyle = COL.cream;
    ctx.strokeText(String(i + 1).padStart(2, '0'), W + 60 - (1 - enter) * -120 - exit * 200, 1020);
    ctx.restore();

    pizzaGroup(i, x, y, R, rot, t, 1 - exit);
    stamp(x + 325, y + 285, P.price, prog(u, 2.9, 3.45), t);

    const ca = 1 - prog(u, 7.25, 7.7);
    if (ca <= 0) return;
    ctx.save();
    ctx.globalAlpha = ca;
    ctx.translate(-exit * 90, 0);

    // etiqueta
    const kTag = prog(u, 0.35, 0.85);
    if (kTag > 0) {
      ctx.save();
      ctx.globalAlpha *= eOut(kTag);
      ctx.translate((1 - eOut(kTag)) * -30, 0);
      const tw = measure(P.tag, 600, 22, SANS, 'normal', 5);
      ctx.strokeStyle = P.accent;
      ctx.lineWidth = 2;
      rrect(72, 978, tw + 58, 46, 23); ctx.stroke();
      ctx.fillStyle = P.accent;
      ctx.beginPath(); ctx.arc(96, 1001, 6, 0, TAU); ctx.fill();
      text(P.tag, 114, 1009, { size: 22, weight: 600, ls: 5, color: P.accent });
      ctx.restore();
    }

    // nome
    let size = 120;
    const nw = measure(P.name, 800, size, SERIF);
    if (nw > 840) size *= 840 / nw;
    const kName = prog(u, 0.55, 1.3);
    reveal(P.name, 72, 1138, size, kName, { family: SERIF, weight: 800 });
    if (kName > 0.6) {
      const dotX = 72 + measure(P.name, 800, size, SERIF) + 8;
      ctx.save();
      ctx.globalAlpha *= eOut(prog(kName, 0.6, 1));
      ctx.fillStyle = P.accent;
      ctx.beginPath(); ctx.arc(dotX + 10, 1130, 11, 0, TAU); ctx.fill();
      ctx.restore();
    }
    text(P.italian, 72, 1200, { family: SERIF, style: 'italic', weight: 500, size: 40, color: COL.muted, alpha: eOut(prog(u, 0.95, 1.55)) });

    // ingredientes
    const maxX = 960, chipH = 56;
    let cx = 72, cy = 1238;
    P.ingredients.forEach((ing, k) => {
      const w = measure(ing, 600, 27, SANS) + 64;
      if (cx + w > maxX) { cx = 72; cy += chipH + 12; }
      const kc = prog(u, 1.35 + k * 0.13, 1.8 + k * 0.13);
      if (kc > 0) {
        ctx.save();
        ctx.globalAlpha *= eOut(kc);
        ctx.translate(0, (1 - eOut(kc)) * 22);
        ctx.fillStyle = 'rgba(244,233,216,0.07)';
        rrect(cx, cy, w, chipH, chipH / 2); ctx.fill();
        ctx.strokeStyle = 'rgba(244,233,216,0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = P.accent;
        ctx.beginPath(); ctx.arc(cx + 26, cy + chipH / 2, 6, 0, TAU); ctx.fill();
        text(ing, cx + 44, cy + 37, { size: 27, weight: 600 });
        ctx.restore();
      }
      cx += w + 12;
    });

    // ficha técnica 2×2
    const gy = cy + chipH + 30, gx = 72, gap = 16;
    const cw = (maxX - gx - gap) / 2, ch = 100;
    P.specs.forEach((s, k) => {
      const kc = prog(u, 2.3 + k * 0.16, 2.8 + k * 0.16);
      if (kc <= 0) return;
      const col = k % 2, row = Math.floor(k / 2);
      const x0 = gx + col * (cw + gap), y0 = gy + row * (ch + gap);
      ctx.save();
      ctx.globalAlpha *= eOut(kc);
      ctx.translate(0, (1 - eOut(kc)) * 26);
      ctx.fillStyle = 'rgba(244,233,216,0.055)';
      rrect(x0, y0, cw, ch, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(244,233,216,0.13)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(s[0], x0 + 26, y0 + 38, { size: 19, weight: 600, ls: 4, color: COL.gold });
      if (typeof s[1] === 'number') {
        heatDots(x0 + 36, y0 + 70, s[1], '#E2553F', kc);
        text(s[2], x0 + 36 + 5 * 30 + 4, y0 + 80, { family: SERIF, weight: 600, size: 30 });
      } else {
        text(s[1], x0 + 26, y0 + 80, { family: SERIF, weight: 600, size: 31 });
      }
      ctx.restore();
    });

    handNote(P.note, prog(u, 3.6, 4.2), prog(u, 4.0, 4.6));
    ctx.restore();
  }

  function outro(v, t) {
    // três pizzas lado a lado
    const xs = [220, 540, 860];
    xs.forEach((x, i) => {
      const k = prog(v, 0.1 + i * 0.14, 0.85 + i * 0.14);
      if (k <= 0) return;
      const s = eBack(k);
      const y = lerp(260, 470, eOut(k));
      pizzaGroup(i, x, y, 138 * s, t * 0.25 + i, t, 0.6 * k, false);
    });
    reveal('Buon', W / 2, 860, 168, prog(v, 0.6, 1.25), { family: SERIF, weight: 800, align: 'center' });
    reveal('appetito!', W / 2, 1022, 158, prog(v, 0.8, 1.45), { family: SERIF, weight: 500, style: 'italic', align: 'center', color: COL.gold });
    tricolor(W / 2, 1080, 150, prog(v, 1.2, 1.7));

    const kb = prog(v, 1.4, 1.9);
    if (kb > 0) {
      const pulse = 1 + 0.025 * Math.sin((v - 1.9) * 5.5) * prog(v, 1.9, 2.3);
      ctx.save();
      ctx.translate(W / 2, 1205);
      ctx.scale(eBack(kb) * pulse, eBack(kb) * pulse);
      ctx.shadowColor = 'rgba(201,58,43,0.55)';
      ctx.shadowBlur = 40;
      ctx.fillStyle = COL.red;
      rrect(-370, -58, 740, 116, 58); ctx.fill();
      ctx.shadowColor = 'transparent';
      text(BRAND.cta, 0, 14, { size: 40, weight: 600, align: 'center' });
      ctx.restore();
    }
    text(BRAND.handle, W / 2, 1355, { size: 40, weight: 600, align: 'center', alpha: eOut(prog(v, 1.8, 2.3)) });
    text(BRAND.services, W / 2, 1410, { size: 28, color: COL.muted, align: 'center', ls: 2, alpha: eOut(prog(v, 2.0, 2.5)) });
    ctx.save();
    ctx.translate(W / 2, 1530);
    ctx.rotate(-0.04);
    text('tem mais sabor chegando…', 0, 0, { family: HAND, weight: 600, size: 58, color: COL.gold, align: 'center', alpha: eOut(prog(v, 2.4, 3.0)) });
    ctx.restore();
  }

  function render(t) {
    t = clamp(t, 0, DUR - 1e-6);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    background(t);
    embers(t);

    if (t < T_INTRO + 0.6) intro(t);

    let idx = -1, frac = 0;
    for (let i = 0; i < PIZZAS.length; i++) {
      const u = t - (T_INTRO + i * T_SCENE);
      if (u >= 0 && u < T_SCENE + 0.45) scene(i, u, t);
      if (u >= 0 && u < T_SCENE) { idx = i; frac = u / T_SCENE; }
    }
    if (t >= T_OUTRO) { outro(t - T_OUTRO, t); idx = PIZZAS.length; }
    const ha = prog(t, T_INTRO + 0.4, T_INTRO + 1.0) * (1 - prog(t, T_OUTRO - 0.4, T_OUTRO + 0.1));
    header(t, ha, idx, frac);

    // acabamento: vinheta, granulação e fades
    ctx.drawImage(VIGN, 0, 0);
    const f = Math.floor(t * FPS);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.07;
    ctx.translate(-((f * 73) % 256), -((f * 151) % 256));
    ctx.fillStyle = grainPattern;
    ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();
    const black = Math.max(1 - prog(t, 0, 0.5), prog(t, DUR - 0.6, DUR));
    if (black > 0) {
      ctx.fillStyle = `rgba(10,6,4,${black})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  async function init(cv) {
    canvas = cv;
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');
    await Promise.all([
      `800 100px ${SERIF}`, `600 100px ${SERIF}`, `italic 500 100px ${SERIF}`,
      `400 30px ${SANS}`, `600 30px ${SANS}`, `600 50px ${HAND}`,
    ].map((f) => document.fonts.load(f, 'AaÚúçãé€$0123456789…')));
    PZ = PIZZAS.map((p, i) => makePizza(p.type, 11 + i * 17));
    // foto real (photos/<sabor>.png, gerada por tools/recortar.py) substitui o desenho
    const base = REEL_BASE;
    await Promise.all(PIZZAS.map((p, i) => new Promise((ok) => {
      const im = new Image();
      im.onload = () => {
        const c = mk(PRD * 2 + 40, PRD * 2 + 40);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        PZ[i] = c;
        ok();
      };
      im.onerror = () => ok();
      im.src = new URL(`photos/${p.type}.png`, base).href;
    })));
    BOARD = makeBoard(5);
    PUFF = makePuff();
    GRAIN = makeGrain();
    VIGN = makeVignette();
    grainPattern = ctx.createPattern(GRAIN, 'repeat');
    render(0);
  }

  window.REEL = { W, H, FPS, DUR, BRAND, PIZZAS, init, render };
})();
