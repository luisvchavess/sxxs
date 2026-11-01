"""Trilha original: valsinha italiana (bandolim em trêmolo + violão), cordas por Karplus-Strong."""
import numpy as np, wave, sys

SR = 44100
DUR = 32.0
BPM = 96
BEAT = 60 / BPM
BAR = 3 * BEAT
rng = np.random.default_rng(3)
out = np.zeros(int(SR * (DUR + 2)))

def hz(n):  # n: nome tipo 'C5', 'G#4'
    names = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
    k, o = n[:-1], int(n[-1])
    return 440 * 2 ** ((names[k] + 12 * (o + 1) - 69) / 12)

def pluck(freq, dur, bright=0.5, decay=0.996):
    N = int(round(SR / freq))
    L = int(SR * dur)
    y = np.zeros(L + N + 1)
    noise = rng.uniform(-1, 1, N + 1)
    for _ in range(int((1 - bright) * 6)):  # suaviza o ataque
        noise = 0.5 * (noise + np.roll(noise, 1))
    y[:N + 1] = noise
    k = N + 1
    while k < len(y):
        e = min(k + N, len(y))
        y[k:e] = decay * 0.5 * (y[k - N:e - N] + y[k - N - 1:e - N - 1])
        k = e
    y = y[:L]
    y *= np.minimum(1, np.linspace(0, dur, L)[::-1] / 0.05)  # fim sem estalo
    return y

def add(sig, t, gain):
    i = int(t * SR)
    out[i:i + len(sig)] += sig[:max(0, len(out) - i)] * gain

CH = {
    'C': ('C3', ['E4', 'G4', 'C5']), 'Am': ('A2', ['E4', 'A4', 'C5']), 'Dm': ('D3', ['F4', 'A4', 'D5']),
    'G7': ('G2', ['F4', 'B4', 'D5']), 'E7': ('E3', ['D4', 'G#4', 'B4']), 'A7': ('A2', ['E4', 'G4', 'C#5']),
    'F': ('F2', ['F4', 'A4', 'C5']),
}
prog = ['C', 'C', 'Am', 'Am', 'Dm', 'G7', 'C', 'G7', 'C', 'E7', 'Am', 'A7', 'Dm', 'G7', 'C', 'C', 'C']
mel = [
    [('E5', 2), ('D5', 1)], [('C5', 1), ('E5', 1), ('G5', 1)], [('A5', 2), ('G5', 1)], [('E5', 3)],
    [('F5', 2), ('E5', 1)], [('D5', 2), ('B4', 1)], [('C5', 1), ('E5', 1), ('G5', 1)], [('F5', 2), ('D5', 1)],
    [('E5', 2), ('G5', 1)], [('G#5', 2), ('B5', 1)], [('C6', 2), ('A5', 1)], [('G5', 2), ('E5', 1)],
    [('F5', 2), ('A5', 1)], [('G5', 1), ('F5', 1), ('D5', 1)], [('E5', 2), ('D5', 1)], [('C5', 3)], [],
]
START = 0.25
for b, ch in enumerate(prog):
    t0 = START + b * BAR
    root, tri = CH[ch]
    last = b == len(prog) - 1
    add(pluck(hz(root), 2.4, bright=0.25, decay=0.998), t0, 0.55)  # baixo
    if last:
        for j, n in enumerate(['C4', 'E4', 'G4', 'C5', 'E5']):
            add(pluck(hz(n), 3.5, 0.45, 0.999), t0 + j * 0.035, 0.28)
        add(pluck(hz('C6'), 3.5, 0.7, 0.998), t0 + 0.2, 0.22)
        continue
    for beat in (1, 2):  # "tum-tchá-tchá"
        for j, n in enumerate(tri):
            add(pluck(hz(n), 0.9, 0.4, 0.994), t0 + beat * BEAT + j * 0.018, 0.2)
    tt = t0
    for n, beats in mel[b]:
        d = beats * BEAT
        reps = max(1, int(d * 11))  # trêmolo de bandolim
        for r in range(reps):
            g = 0.24 * (1 if r == 0 else 0.62 + 0.12 * np.sin(r))
            f = hz(n)
            add(pluck(f, 0.35, 0.75, 0.993), tt + r / 11, g)
            add(pluck(f * 1.003, 0.35, 0.75, 0.993), tt + r / 11 + 0.004, g * 0.7)  # corda dupla
        tt += d

# crepitar de lenha bem baixinho
for _ in range(int(DUR * 9)):
    t = rng.uniform(0, DUR)
    n = int(SR * rng.uniform(0.002, 0.008))
    add(rng.uniform(-1, 1, n) * np.exp(-np.linspace(0, 6, n)), t, rng.uniform(0.01, 0.05))

out = out[:int(SR * DUR)]
fade = int(SR * 1.2)
out[-fade:] *= np.linspace(1, 0, fade)
out /= np.max(np.abs(out)) * 1.15
data = (out * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print('ok', len(data) / SR, 's')
