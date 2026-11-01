// Gera cardapio-reels.mp4 (1080×1920, 30 fps) a partir do reel.js.
// Uso: python3 -m http.server 8765 (na pasta cardapio-pizzaria) e depois
//      node tools/render-video.cjs
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const URL = process.env.REEL_URL || 'http://localhost:8765/tools/render.html';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('erro na página:', e.message));
  await page.goto(URL);
  await page.waitForFunction(() => window.READY, null, { timeout: 60000 });
  const { FPS, DUR } = await page.evaluate(() => ({ FPS: REEL.FPS, DUR: REEL.DUR }));
  const total = Math.round(FPS * DUR);

  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(ROOT, 'trilha.m4a'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'copy', '-shortest', '-movflags', '+faststart',
    path.join(ROOT, 'cardapio-reels.mp4'),
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let f = 0; f < total; f++) {
    const b64 = await page.evaluate((t) => {
      REEL.render(t);
      return document.getElementById('c').toDataURL('image/jpeg', 0.95).split(',')[1];
    }, f / FPS);
    const buf = Buffer.from(b64, 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 90 === 0) console.log(`quadro ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log('pronto: cardapio-reels.mp4');
})();
