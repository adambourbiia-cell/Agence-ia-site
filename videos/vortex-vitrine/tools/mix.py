"""Master mix: voice + music (ducked ~10 dB under the voice) + SFX (kept under the voice).
Writes assets/audio/mix.wav; loudness is normalised afterwards with ffmpeg loudnorm (-15 LUFS, TP -1.5)."""
import json, subprocess, numpy as np, soundfile as sf
from scipy.signal import resample_poly

SR = 48000
T = json.load(open("tools/timeline.json"))
TOTAL = T["total"]
N = int((TOTAL + 0.05) * SR)

def load(path):
    if path.endswith(".mp3"):
        raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"])
        return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
    x, sr = sf.read(path, always_2d=True)
    if sr != SR: x = resample_poly(x, SR, sr, axis=0)
    if x.shape[1] == 1: x = np.repeat(x, 2, 1)
    return x

def place(dst, x, start, gain=1.0):
    i = int(round(start * SR)); j = min(len(dst), i + len(x))
    if j > i: dst[i:j] += x[: j - i] * gain

voice = np.zeros((N, 2))
for a in T["audio"]:
    if a["id"].startswith("vo"):
        v = load(a["src"])
        v = v / (np.sqrt(np.mean(v ** 2)) + 1e-9) * 0.12  # equalise line levels (RMS)
        place(voice, v, a["start"])
music = np.zeros((N, 2)); place(music, load("assets/audio/music.wav"), 0)
sfx = np.zeros((N, 2)); place(sfx, load("assets/audio/sfx.wav"), 0)

# voice activity envelope -> music ducking (smooth attack/release)
win = int(0.02 * SR)
rms = np.sqrt(np.convolve(np.mean(voice ** 2, 1), np.ones(win) / win, mode="same"))
act = (rms > 0.01).astype(float)
k = int(0.25 * SR); kern = np.hanning(2 * k); kern /= kern.sum()
act = np.clip(np.convolve(act, kern, mode="same") * 1.6, 0, 1)
duck = 10 ** (-4.5 * act / 20)  # extra ~4.5 dB dip while the voice speaks

def rms_db(x, mask=None):
    y = x if mask is None else x[mask]
    return 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)

speech = act > 0.5
vdb = rms_db(voice, speech)
mdb = rms_db(music)
music_gain = 10 ** ((vdb - 10 - mdb) / 20)  # music bed ~10 dB under the voice
mix = voice + music * music_gain * duck[:, None] + sfx * 0.55
print("voice dB", round(vdb, 1), "music gain", round(music_gain, 3), "peak", round(float(np.max(np.abs(mix))), 3))
mix /= max(1.0, np.max(np.abs(mix)) / 0.95)
sf.write("assets/audio/mix.wav", mix.astype(np.float32), SR)
