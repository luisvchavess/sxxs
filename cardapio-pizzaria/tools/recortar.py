"""Recorta uma foto de pizza vista de cima e gera photos/<sabor>.png pronto para o vídeo.

Uso:
  python3 tools/recortar.py foto.jpg margherita
  python3 tools/recortar.py foto.jpg diavola --cx 0.5 --cy 0.48 --r 0.42   # ajuste manual

Sem --cx/--cy/--r, o círculo da pizza é achado pelas cores quentes (massa, molho, queijo).
--cx/--cy são frações da largura/altura; --r é fração do menor lado.
"""
import argparse, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PRD, S = 520, 1080  # raio da pizza e tamanho da arte, iguais ao reel.js

ap = argparse.ArgumentParser()
ap.add_argument('foto'); ap.add_argument('sabor', choices=['margherita', 'diavola', 'parma'])
ap.add_argument('--cx', type=float); ap.add_argument('--cy', type=float); ap.add_argument('--r', type=float)
ap.add_argument('--brilho', type=float, default=1.0, help='ex.: 1.2 clareia 20%%')
ap.add_argument('--margem', type=float, default=0.985, help='encolhe o círculo pra não pegar fundo')
a = ap.parse_args()

img = Image.open(a.foto).convert('RGB')
if a.brilho != 1.0:
    from PIL import ImageEnhance
    img = ImageEnhance.Brightness(img).enhance(a.brilho)
    img = ImageEnhance.Contrast(img).enhance(1 + (a.brilho - 1) * 0.4)
w, h = img.size
if a.cx is None:
    small = img.copy(); small.thumbnail((400, 400))
    hsv = np.asarray(small.convert('HSV')).astype(float)
    H, Sat, V = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    warm = ((H < 55) | (H > 330)) & (Sat > 0.28) & (V > 0.5)
    pale = (Sat < 0.28) & (V > 0.8)  # mozzarella
    m = warm.copy()
    # queijo só conta se estiver cercado de pixels quentes (evita fundo branco)
    ys, xs = np.nonzero(warm)
    cy0, cx0 = np.median(ys), np.median(xs)
    rr = np.sqrt(warm.sum() / np.pi)
    yy, xx = np.mgrid[:m.shape[0], :m.shape[1]]
    m |= pale & ((yy - cy0) ** 2 + (xx - cx0) ** 2 < (rr * 1.1) ** 2)
    # maior região conectada (separa a pizza de fundo/tábua)
    from collections import deque
    lab = np.zeros(m.shape, int); best, bestn, cur = 0, 0, 0
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]: continue
        cur += 1; n = 0; q = deque([(y0, x0)]); lab[y0, x0] = cur
        while q:
            y, x = q.popleft(); n += 1
            for yy2, xx2 in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy2 < m.shape[0] and 0 <= xx2 < m.shape[1] and m[yy2, xx2] and not lab[yy2, xx2]:
                    lab[yy2, xx2] = cur; q.append((yy2, xx2))
        if n > bestn: best, bestn = cur, n
    ys, xs = np.nonzero(lab == best)
    cy0, cx0 = ys.mean(), xs.mean()
    r0 = np.sqrt(len(ys) / np.pi)
    k = w / small.size[0]
    cx, cy, r = cx0 * k, cy0 * k, r0 * k
else:
    cx, cy, r = a.cx * w, a.cy * h, a.r * min(w, h)
r *= a.margem
print(f'círculo: cx={cx / w:.3f} cy={cy / h:.3f} r={r / min(w, h):.3f}  (use --cx --cy --r para ajustar)')

sc = PRD / r
big = img.resize((round(w * sc), round(h * sc)), Image.LANCZOS)
out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
out.paste(big, (round(S / 2 - cx * sc), round(S / 2 - cy * sc)))
mask = Image.new('L', (S * 2, S * 2), 0)
ImageDraw.Draw(mask).ellipse([S - PRD * 2, S - PRD * 2, S + PRD * 2, S + PRD * 2], fill=255)
mask = mask.resize((S, S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))
out.putalpha(mask)
os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'photos'), exist_ok=True)
dst = os.path.join(os.path.dirname(__file__), '..', 'photos', f'{a.sabor}.png')
out.save(dst)
print('salvo', os.path.normpath(dst))
