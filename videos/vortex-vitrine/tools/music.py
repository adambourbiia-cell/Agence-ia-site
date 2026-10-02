"""Procedural BGM for the Vortex promo: 105 BPM, A minor, deterministic.
Structure (bars of 4 beats): 0-1 intro pulse, 2-13 full groove,
14-15 retombée (CTA), 16-17 end card + fade."""
import numpy as np, soundfile as sf
SR = 48000
BPM = 105
BEAT = 60 / BPM
BARS = 18
N = int(SR * (BARS * 4 * BEAT + 2.5))
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def t(n): return np.arange(n) / SR
def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt(0.5 * (1 - pan)) * 1.414 * 0.707
    R[i:j] += s * np.sqrt(0.5 * (1 + pan)) * 1.414 * 0.707
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a=0.005, d=0.2):
    x = t(n); e = np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d); return e
def lp(sig, cutoff):
    # one-pole lowpass (cutoff may be array)
    out = np.zeros_like(sig); y = 0.0
    c = np.broadcast_to(np.asarray(cutoff, float), sig.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    for k in range(len(sig)):
        y += a[k] * (sig[k] - y); out[k] = y
    return out

def kick():
    n = int(0.45 * SR); x = t(n)
    f = 45 + 120 * np.exp(-x / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-x / 0.16) * 1.0 + 0.3 * np.sin(ph * 2) * np.exp(-x / 0.02)
def clap():
    n = int(0.3 * SR); x = t(n); nz = rng.standard_normal(n)
    e = np.zeros(n)
    for o in (0, 0.01, 0.02):
        i = int(o * SR); e[i:] += np.exp(-(x[: n - i]) / 0.012)
    e += 0.6 * np.exp(-x / 0.09)
    s = nz * e
    s = s - lp(s, 900)  # highpass-ish
    return s * 0.5
def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR); x = t(n); nz = rng.standard_normal(n)
    s = nz - lp(nz, 7000)
    return s * np.exp(-x / (0.07 if open_ else 0.012)) * 0.35
def bass(m, dur):
    n = int(dur * SR); x = t(n); f = midi(m)
    saw = 2 * ((x * f) % 1) - 1
    sub = np.sin(2 * np.pi * f * x)
    s = lp(0.5 * saw + 0.8 * sub, 300 + 900 * np.exp(-x / 0.06))
    return s * np.minimum(1, x / 0.004) * np.exp(-x / 0.25) * 0.55
def pluck(m, dur=0.3):
    n = int(dur * SR); x = t(n); f = midi(m)
    s = np.sign(np.sin(2 * np.pi * f * x)) * 0.5 + np.sin(2 * np.pi * f * 2 * x) * 0.3
    s = lp(s, 600 + 3500 * np.exp(-x / 0.05))
    return s * env(n, 0.002, 0.12) * 0.22
def pad(ms, dur):
    n = int(dur * SR); x = t(n); s = np.zeros(n)
    for m in ms:
        for det in (-0.08, 0.0, 0.08):
            f = midi(m + det); s += 2 * ((x * f + det) % 1) - 1
    s = lp(s / (len(ms) * 3), 1400)
    a = np.minimum(1, x / 0.6) * np.minimum(1, (dur - x) / 0.6)
    return s * np.clip(a, 0, 1) * 0.22

# chord progression per bar: Am, F, C, G (roots / chords)
prog = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]
arp_pat = [0, 2, 1, 2, 0, 2, 1, 2]

for bar in range(BARS):
    b0 = bar * 4 * BEAT
    root, chord = prog[bar % 4]
    full = 2 <= bar <= 13
    drop = 14 <= bar <= 15
    end = bar >= 16
    # pad always (fades at end)
    add(pad(chord, 4 * BEAT + 0.3), b0, 0.9 if not end else 0.7)
    for b in range(4):
        tb = b0 + b * BEAT
        if full or (bar == 1):
            add(kick(), tb, 0.9 if full else 0.6)
        if full and b in (1, 3):
            add(clap(), tb, 0.7)
        for s16 in range(4):
            ts = tb + s16 * BEAT / 4
            if full:
                add(hat(open_=(s16 == 2)), ts, 0.55 if s16 % 2 else 0.35, pan=0.25)
            elif bar <= 1 or drop:
                if s16 == 2: add(hat(), ts, 0.3, pan=0.25)
        # offbeat bass eighths
        if full or bar == 1 or drop:
            add(bass(root - 12 + 12, BEAT / 2), tb + BEAT / 2, 0.9 if full else 0.6)
        if full:
            add(bass(root, BEAT / 2), tb, 0.4)
        # arp 8ths
        if full or drop:
            for e8 in range(2):
                idx = arp_pat[(b * 2 + e8) % 8]
                add(pluck(chord[idx] + 12), tb + e8 * BEAT / 2, 0.8 if full else 0.6, pan=-0.3 + 0.6 * e8)
    # crash/riser into bar 2 and into end
    if bar == 1:
        n = int(4 * BEAT * SR); x = t(n); nz = rng.standard_normal(n)
        r = (nz - lp(nz, 2000)) * (x / x[-1]) ** 3 * 0.25
        add(r, b0)

# final low impact on end card (beat 64)
n = int(2.5 * SR); x = t(n)
imp = np.sin(2 * np.pi * (38 + 40 * np.exp(-x / 0.08)) * x) * np.exp(-x / 0.7)
add(imp, 64 * BEAT, 0.9)
add(pad([57, 60, 64, 69], 3.5), 64 * BEAT, 0.9)

mix = np.stack([L, R], 1)
# master fade-out last 2.5 s and gentle limiter
total = 72 * BEAT + 0.6
nT = int(total * SR); mix = mix[:nT]
fo = int(2.6 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
fi = int(0.05 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix /= np.max(np.abs(mix)) / 0.89
sf.write("assets/audio/music.wav", mix.astype(np.float32), SR, subtype="PCM_16")
print("music", total)
