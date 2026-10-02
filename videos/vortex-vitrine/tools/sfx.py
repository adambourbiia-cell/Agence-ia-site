"""Synthesised SFX for the Vortex promo, placed on their measured PEAK (not their start).
Writes assets/audio/sfx.wav (48 kHz stereo, same length as the video)."""
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
TOTAL = 41.143 + 0.5
rng = np.random.default_rng(42)

def t(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype="band", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, btype="high", fs=SR, output="sos"), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, btype="low", fs=SR, output="sos"), x)
def env(n, a, d):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-np.maximum(0, x - a) / d)
def norm(x, peak=0.9): return x / (np.max(np.abs(x)) + 1e-9) * peak

def tick():
    x = t(0.05); return norm(np.sin(2 * np.pi * 2600 * x) * env(len(x), 0.001, 0.008) + 0.3 * hp(rng.standard_normal(len(x)), 4000) * env(len(x), 0.0005, 0.003))
def key():
    x = t(0.07); n = rng.standard_normal(len(x))
    s = bp(n, 1800, 6000) * env(len(x), 0.0008, 0.012) + 0.6 * np.sin(2 * np.pi * (140 + rng.uniform(-20, 20)) * x) * env(len(x), 0.001, 0.018)
    return norm(s)
def click():
    x = t(0.08); n = rng.standard_normal(len(x))
    s = hp(n, 2500) * env(len(x), 0.0004, 0.004) + 0.8 * np.sin(2 * np.pi * 1300 * x) * env(len(x), 0.0005, 0.012)
    s2 = np.zeros_like(s); o = int(0.045 * SR); s2[o:] = 0.5 * s[: len(s) - o]
    return norm(s + s2)
def pop(f0=900, f1=280, d=0.12):
    x = t(d); f = f1 + (f0 - f1) * np.exp(-x / 0.02)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.002, d / 3.5))
def blip():
    x = t(0.12); f = 1300 + 900 * np.minimum(1, x / 0.05)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return norm(s * env(len(x), 0.003, 0.03))
def whoosh(d=0.5, peak=0.6, lo=300, hi=4000):
    x = t(d); n = rng.standard_normal(len(x)); pk = peak * d
    e = np.where(x < pk, (x / pk) ** 2.2, np.exp(-(x - pk) / (0.18 * d)))
    out = np.zeros_like(x); seg = 2048
    for i in range(0, len(x), seg):  # swept band-pass
        c = lo + (hi - lo) * (e[min(i, len(e) - 1)] ** 0.8)
        out[i:i + seg] = bp(n[i:i + seg], max(80, c * 0.5), min(20000, c * 1.6), 1)
    return norm(lp(out, 9000) * e)
def shimmer():
    x = t(0.9); s = np.zeros_like(x)
    for k in range(9):
        f = 2400 + rng.uniform(0, 4200); st = rng.uniform(0, 0.35)
        s += np.sin(2 * np.pi * f * x) * env(len(x), 0.004, 0.12) * (x >= st) * np.roll(np.ones_like(x), 0)
    return norm(s * env(len(x), 0.08, 0.35))
def bell(freqs, d=0.6, dec=0.18):
    x = t(d); s = np.zeros_like(x)
    for i, f in enumerate(freqs):
        s += np.sin(2 * np.pi * f * x) * (0.7 ** i) + 0.25 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x / 0.05)
    return norm(s * env(len(x), 0.002, dec))
def notif():
    a = bell([1318.5], 0.28, 0.07); b = bell([1975.5], 0.4, 0.1)
    s = np.zeros(int(0.5 * SR)); s[: len(a)] += a; o = int(0.075 * SR); s[o:o + len(b)] += b
    return norm(s)
def success():
    s = np.zeros(int(0.9 * SR))
    for i, f in enumerate([1046.5, 1318.5, 1568, 2093]):
        b = bell([f], 0.6, 0.14); o = int(i * 0.07 * SR); s[o:o + len(b)] += b * (0.8 + 0.1 * i)
    return norm(s)
def zap():
    x = t(0.32); f = 500 + 2600 * (x / x[-1]) ** 1.5
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / x[-1]) ** 2 * 0.6 + 0.2 * bp(rng.standard_normal(len(x)), 3000, 8000) * np.sin(np.pi * x / x[-1]))
def swish():
    x = t(0.22); return norm(hp(rng.standard_normal(len(x)), 3000) * np.sin(np.pi * x / x[-1]) ** 3)
def impact():
    x = t(2.2); f = 42 + 70 * np.exp(-x / 0.06)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.7)
    hit = lp(rng.standard_normal(len(x)), 2500) * env(len(x), 0.001, 0.05)
    return norm(boom + 0.5 * hit)
def drop():
    a = pop(1400, 350, 0.16); b = pop(180, 60, 0.25) * 0.8
    s = np.zeros(int(0.4 * SR)); s[: len(a)] += a; o = int(0.09 * SR); s[o:o + len(b)] += b
    return norm(s)

LIB = {
    "tick": tick, "key": key, "click": click, "pop": lambda: pop(), "pops": lambda: pop(1500, 650, 0.07),
    "blip": blip, "whs": lambda: whoosh(0.45, 0.55), "whb": lambda: whoosh(1.0, 0.86, 200, 6000),
    "swm": lambda: whoosh(0.28, 0.5, 800, 6000), "cam": lambda: whoosh(0.5, 0.6, 250, 3000),
    "rev": lambda: whoosh(0.7, 0.95, 300, 5000), "shim": shimmer, "notif": notif, "chime": lambda: bell([1568, 2349], 0.7, 0.16),
    "ding": lambda: bell([2093], 0.8, 0.2), "ok": success, "zap": zap, "swish": swish, "impact": impact, "drop": drop,
}

E = []  # (time, kind, dB, pan)
def ev(tt, k, db, pan=0.0): E.append((tt, k, db, pan))
# S01 — search
ev(0.3, "whs", -16)
ev(0.62, "tick", -22)
for x in [1.2, 1.38, 1.69, 1.88, 2.32, 2.63, 2.72]: ev(x, "tick", -27)
ev(1.42, "click", -12, 0.1)
for i in range(13): ev(1.55 + i * 0.068 + 0.012, "key", -17 - (i % 3), -0.1)
ev(2.45, "swm", -19)
ev(3.3, "blip", -18); ev(3.95, "blip", -18)
ev(4.72, "click", -10, 0.25)
ev(5.85, "whb", -9)
# S02 — brand + tablet
ev(5.95, "rev", -14); ev(6.25, "pop", -11)
for i in range(6): ev(6.24 + i * 0.07, "tick", -23)
ev(6.66, "swm", -20)
for x in [6.85, 7.01, 7.16, 7.28, 7.73, 8.27, 8.37, 8.71]: ev(x, "tick", -27)
ev(8.1, "shim", -21)
ev(8.45, "whs", -13)
for x in [8.78, 8.9, 8.97, 9.05, 9.1, 9.2, 9.38, 9.46, 9.54, 9.63, 9.73]: ev(x, "pops", -22, rng.uniform(-0.3, 0.3))
ev(10.15, "swm", -21)
ev(11.62, "whb", -10, -0.4)
# S03 — work
ev(11.5, "whs", -15, 0.4)
ev(11.8, "tick", -21)
for x in [12.14, 12.88, 13.92]: ev(x, "blip", -17)
for x in [12.9, 13.54, 14.18]: ev(x + 0.12, "whs", -14, 0.5); ev(x + 0.02, "pops", -19)
for x in [11.95, 12.98, 13.62, 14.26]: ev(x, "tick", -23)
ev(15.62, "whb", -10)
# S04 — visible
ev(15.55, "pop", -13)
for i in range(5): ev(15.73 + i * 0.06, "tick", -26)
ev(15.66, "tick", -22)
for x in [16.52, 17.4, 17.82]: ev(x, "blip", -17)
for x, p in [(16.36, -0.5), (17.24, 0.5), (17.76, 0)]: ev(x, "zap", -16, p)
for x, p in [(16.55, -0.5), (17.42, 0.5), (17.94, 0)]: ev(x, "pop", -13, p)
ev(17.62, "drop", -13, 0.5)
for i in range(3): ev(18.05 + i * 0.18, "tick", -20)
ev(19.62, "whb", -10)
# S05 — clients
ev(19.68, "tick", -22)
for i in range(11): ev(19.65 + i * 0.3, "notif", -15 - (i % 2) * 2, 0.35)
for x in [20.72, 20.86, 21.28, 21.76]: ev(x, "tick", -26)
ev(21.42, "swish", -15)
ev(21.92, "pop", -11)
ev(23.02, "whb", -10, -0.4)
# S06 — steps
ev(22.95, "whs", -15, 0.4)
for x in [23.16, 23.4, 23.6, 23.74, 24.04]: ev(x, "tick", -26)
for i in range(3): ev(24.15 + i * 0.1, "pops", -21)
for x in [24.64, 25.64, 26.44]: ev(x, "chime", -15)
ev(26.8, "pop", -15)
for k in range(14): ev(26.88 + 0.98 * (1 - (1 - k / 14) ** 2.2), "tick", -24)
ev(27.86, "ding", -15)
ev(28.12, "whs", -14)
# S07 — bento
for i in range(4): ev(28.06 + i * 0.07, "whs", -17, [-0.5, 0.5, -0.4, 0.4][i])
for x in [28.42, 29.08, 29.94, 30.56]: ev(x, "cam", -14)
for i in range(4): ev(29.34 + i * 0.18, "blip", -21)
ev(29.98, "pop", -16)
for i in range(3): ev(30.66 + i * 0.16, "tick", -18)
for i in range(7): ev(30.75 + i * 0.07, "tick", -26)
ev(31.48, "rev", -15)
for x in [31.5, 31.54, 31.99]: ev(x, "tick", -23)
ev(32.16, "pop", -13)
ev(33.3, "whb", -11)
# S08 — CTA + end card
ev(33.3, "whs", -15)
for x in [33.46, 33.65, 33.7, 33.91, 34.05]: ev(x, "tick", -26)
ev(33.8, "pop", -15)
ev(34.86, "click", -9, 0.1)
ev(35.02, "blip", -19)
ev(35.66, "ok", -12)
ev(36.52, "rev", -12)
ev(36.571, "impact", -6)
for i in range(6): ev(36.69 + i * 0.05, "tick", -25)
ev(36.97, "tick", -21); ev(37.14, "tick", -21)
ev(37.32, "swm", -21)

N = int(TOTAL * SR)
out = np.zeros((N, 2))
cache = {}
for tt, k, db, pan in E:
    if k in ("key",) or k not in cache:
        s = LIB[k]()
        if k != "key": cache[k] = s
    else:
        s = cache[k]
    peak = int(np.argmax(np.abs(s)))  # align the measured peak to the event time
    i0 = int(tt * SR) - peak
    a, b = max(0, i0), min(N, i0 + len(s))
    if b <= a: continue
    seg = s[a - i0 : b - i0] * 10 ** (db / 20)
    out[a:b, 0] += seg * np.sqrt(0.5 * (1 - pan)) * 1.414
    out[a:b, 1] += seg * np.sqrt(0.5 * (1 + pan)) * 1.414
print("events", len(E), "peak", np.max(np.abs(out)))
out = np.tanh(out * 1.1) / 1.1
sf.write("assets/audio/sfx.wav", out.astype(np.float32), SR, subtype="PCM_16")
