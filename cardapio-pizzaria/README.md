# Nonna Lucia — cardápio em reels

Os três primeiros sabores em vídeo vertical (1080 × 1920, 30 fps, 32 s), com trilha original.

| Arquivo | O que é |
|---|---|
| `cardapio-reels.mp4` | Vídeo pronto para Reels / TikTok / Stories |
| `capa.jpg` | Capa sugerida para o post |
| `index.html` | Página com o reels tocando ao vivo + fichas técnicas |
| `reel.js` | Toda a animação (pizzas desenhadas em código). Nome, preços e textos ficam no topo |
| `trilha.m4a` | Trilha original (valsinha com bandolim e violão) |
| `tools/` | Scripts para gerar a trilha e o MP4 de novo |

## Roteiro (32 s)

1. **0–3 s** · Abertura: *Nonna Lucia*, "Il Menù — os 3 primeiros sabores", a Margherita aparece por baixo.
2. **3–11 s** · 01 Margherita
3. **11–19 s** · 02 Diavola
4. **19–27 s** · 03 Parma & Rúcula
5. **27–32 s** · Fechamento: *Buon appetito!*, botão "Peça pelo link na bio", @ e "tem mais sabor chegando…".

## Fichas técnicas

Todas: **35 cm · 8 fatias · serve 2** · massa de farinha tipo 00, fermentação natural de 48 h, 70 % de hidratação · forno a lenha a 485 °C, cerca de 90 s.

### 01 · Margherita — *La Classica* · R$ 62
*pomodoro, fior di latte e basilico*
Tomate San Marzano, fior di latte, manjericão fresco, azeite extravirgem, flor de sal.
Picância: ○○○○○ suave. O manjericão entra na saída do forno, com fio de azeite.

### 02 · Diavola — *La Piccante* · R$ 72
*salame piccante e miele al peperoncino*
Tomate San Marzano, fior di latte, salame picante, pimenta fresca, mel picante.
Picância: ●●●●○ picante. Mel picante finalizado na hora, sobre o salame tostado.

### 03 · Parma & Rúcula — *La Raffinata* · R$ 79
*prosciutto crudo, rucola e grana*
Base branca com fior di latte e tomate confit; depois do forno: Parma 18 meses, rúcula, lascas de Grana Padano e balsâmico.
Picância: ○○○○○ suave.

## Legenda sugerida para o post

> Il Menù chegou 🍕🇮🇹
> Os 3 primeiros sabores da Nonna Lucia, massa de 48h e forno a lenha a 485 °C:
>
> 01 · Margherita — a clássica de Nápoles · R$ 62
> 02 · Diavola — salame picante e mel picante · R$ 72
> 03 · Parma & Rúcula — Parma 18 meses, rúcula e Grana · R$ 79
>
> Qual vai ser a sua? Conta aqui embaixo 👇
> Peça pelo link na bio · Delivery, retirada e salão.
>
> #pizzanapoletana #pizzaria #fornoalenha #margherita #diavola #pizzalovers

## Como trocar nome, preços ou sabores

Edite os blocos `BRAND` e `PIZZAS` no topo do `reel.js`. Para gerar o MP4 de novo:

```bash
cd cardapio-pizzaria
python3 tools/trilha.py /tmp/trilha.wav   # opcional: regenerar a trilha
python3 -m http.server 8765 &
node tools/render-video.cjs                # precisa de Playwright e ffmpeg
```
