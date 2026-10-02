// Shared, deterministic motion helpers. Inlined into every scene by tools/build.mjs.
// Everything is a pure function of scene time t (seconds) — no clocks, no randomness.
window.VX = window.VX || (function () {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, t0, t1) => (t1 <= t0 ? (t >= t1 ? 1 : 0) : clamp((t - t0) / (t1 - t0)));
  const E = {
    lin: (p) => p,
    outCubic: (p) => 1 - Math.pow(1 - p, 3),
    inCubic: (p) => p * p * p,
    inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    outQuart: (p) => 1 - Math.pow(1 - p, 4),
    outExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    inExpo: (p) => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
    inOutExpo: (p) =>
      p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
    inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  };
  const tw = (t, t0, t1, a, b, ease = E.outCubic) => lerp(a, b, ease(prog(t, t0, t1)));

  // Closed-form step response of a damped spring (unit step at tau = 0).
  function step(tau, f, z) {
    if (tau <= 0) return 0;
    const w = 2 * Math.PI * f;
    if (z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
  }
  // Spring through a list of target changes: keys = [[t0, v0], [t1, v1], ...].
  // Value = v0 + sum of (vi - v(i-1)) * step(t - ti): one step response per target change.
  function spring(t, keys, f = 2.4, z = 0.74) {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * step(t - keys[i][0], f, z);
    return v;
  }
  // Spring 0 -> 1 starting at t0.
  const sp = (t, t0, f = 2.4, z = 0.74) => step(t - t0, f, z);

  // Seeded PRNG (mulberry32) for deterministic scatter.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  const set = (el, css) => {
    if (!el) return;
    for (const k in css) {
      if (k.startsWith("--")) el.style.setProperty(k, css[k]);
      else el.style[k] = css[k];
    }
  };
  const tf = (el, s) => el && (el.style.transform = s);
  const op = (el, v) => el && (el.style.opacity = String(clamp(v)));

  // Split an element's words into mask-reveal structures: <span.mw><span.mwi>word</span></span>
  function splitWords(el) {
    const parts = [];
    const walk = (node, cls) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) parts.push({ space: true });
            else parts.push({ w, cls });
          });
        } else if (child.nodeType === 1) {
          walk(child, (cls ? cls + " " : "") + (child.className || ""));
        }
      }
    };
    walk(el, "");
    el.innerHTML = "";
    const words = [];
    parts.forEach((p) => {
      if (p.space) {
        el.appendChild(document.createTextNode(" "));
        return;
      }
      const mw = document.createElement("span");
      mw.className = "mw";
      const mwi = document.createElement("span");
      mwi.className = "mwi" + (p.cls ? " " + p.cls : "");
      mwi.textContent = p.w;
      mw.appendChild(mwi);
      el.appendChild(mw);
      words.push(mwi);
    });
    return words;
  }
  // Mask reveal: word rises from below a cut line. times[i] = start time of word i.
  function revealWords(words, t, times, dur = 0.42) {
    words.forEach((w, i) => {
      const t0 = times[Math.min(i, times.length - 1)];
      const p = sp(t, t0, 2.6, 0.78);
      tf(w, `translate3d(0, ${(1 - p) * 112}%, 0) rotate(${(1 - clamp(p)) * 4}deg)`);
      w.style.opacity = t < t0 ? "0" : "1";
    });
  }
  // Exit: words drop/rise away.
  function hideWords(words, t, t0, stagger = 0.02) {
    words.forEach((w, i) => {
      const p = E.inCubic(prog(t, t0 + i * stagger, t0 + i * stagger + 0.3));
      if (p > 0) tf(w, `translate3d(0, ${-p * 112}%, 0)`);
    });
  }

  // Text Rotate: swaps words letter by letter. Builds stacked layers inside `el`.
  function rotator(el, words, opts = {}) {
    el.innerHTML = "";
    el.classList.add("rot");
    el.setAttribute("data-layout-allow-overlap", ""); // stacked letter layers are intentional
    const layers = words.map((w) => {
      const lay = document.createElement("span");
      lay.className = "rot-layer";
      const letters = Array.from(w).map((ch) => {
        const m = document.createElement("span");
        m.className = "rot-m";
        const l = document.createElement("span");
        l.className = "rot-l";
        l.textContent = ch === " " ? " " : ch;
        m.appendChild(l);
        lay.appendChild(m);
        return l;
      });
      el.appendChild(lay);
      return { lay, letters, width: 0 };
    });
    let measured = false;
    const measure = () => {
      layers.forEach((L, i) => (L.width = textW(words[i].replace(/ /g, "\u00a0"), el)));
      measured = layers.every((L) => L.width > 0);
    };
    const stg = opts.stagger ?? 0.028;
    const d = opts.dur ?? 0.34;
    // times[i] = time word i becomes current (times[0] is its entry time, may be -1 for "already there").
    function render(t, times) {
      if (!measured) measure();
      let cur = 0;
      for (let i = 0; i < times.length; i++) if (t >= times[i]) cur = i;
      layers.forEach((L, i) => {
        const tin = times[i];
        const tout = i + 1 < times.length ? times[i + 1] : 1e9;
        L.letters.forEach((l, k) => {
          const pin = tin < 0 ? 1 : E.outCubic(prog(t, tin + k * stg, tin + k * stg + d));
          const pout = E.inCubic(prog(t, tout + k * stg, tout + k * stg + d * 0.8));
          const y = (1 - pin) * 105 - pout * 105;
          l.style.transform = `translate3d(0, ${y}%, 0)`;
          l.style.opacity = pin > 0 && pout < 1 ? "1" : "0";
        });
      });
      // width follows the current word with a spring
      const keys = [[0, layers[0].width]];
      for (let i = 1; i < times.length; i++) keys.push([times[i], layers[i].width]);
      el.style.width = spring(t, keys, 2.8, 0.8).toFixed(2) + "px";
      return cur;
    }
    return { measure, render, layers };
  }

  // Border Beam: a light blob travelling around a rounded rect, masked to the border ring.
  function beam(host, opts = {}) {
    const ring = document.createElement("div");
    ring.className = "beam";
    ring.setAttribute("data-layout-allow-overflow", "");
    if (opts.radius != null) ring.style.borderRadius = opts.radius + "px";
    const dot = document.createElement("div");
    dot.className = "beam-dot";
    if (opts.size) set(dot, { width: opts.size + "px", height: opts.size + "px", margin: `${-opts.size / 2}px 0 0 ${-opts.size / 2}px` });
    ring.appendChild(dot);
    host.appendChild(ring);
    let W = 0, H = 0;
    const R = opts.radius ?? 20;
    const measure = () => {
      W = host.offsetWidth;
      H = host.offsetHeight;
    };
    function point(u) {
      // u in [0,1) along a rounded-rect perimeter, clockwise from top-left straight segment
      const r = Math.min(R, W / 2, H / 2);
      const sx = W - 2 * r, sy = H - 2 * r, arc = (Math.PI * r) / 2;
      const P = 2 * sx + 2 * sy + 4 * arc;
      let d = (((u % 1) + 1) % 1) * P;
      const segs = [
        [sx, (q) => [r + q, 0]],
        [arc, (q) => { const a = -Math.PI / 2 + (q / arc) * (Math.PI / 2); return [W - r + r * Math.cos(a), r + r * Math.sin(a)]; }],
        [sy, (q) => [W, r + q]],
        [arc, (q) => { const a = (q / arc) * (Math.PI / 2); return [W - r + r * Math.cos(a), H - r + r * Math.sin(a)]; }],
        [sx, (q) => [W - r - q, H]],
        [arc, (q) => { const a = Math.PI / 2 + (q / arc) * (Math.PI / 2); return [r + r * Math.cos(a), H - r + r * Math.sin(a)]; }],
        [sy, (q) => [0, H - r - q]],
        [arc, (q) => { const a = Math.PI + (q / arc) * (Math.PI / 2); return [r + r * Math.cos(a), r + r * Math.sin(a)]; }],
      ];
      for (const [len, f] of segs) {
        if (d <= len) return f(d);
        d -= len;
      }
      return [r, 0];
    }
    function render(t, speed = 0.42, phase = 0, alpha = 1) {
      if (!W) measure();
      const [x, y] = point(t * speed + phase);
      dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      ring.style.opacity = String(alpha);
    }
    return { render, measure, ring };
  }

  // Layout-independent text width (canvas) — works even while the slot is hidden.
  const _cv = document.createElement("canvas").getContext("2d");
  function textW(text, el) {
    const cs = getComputedStyle(el);
    _cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const ls = parseFloat(cs.letterSpacing) || 0;
    return _cv.measureText(text).width + ls * Array.from(text).length;
  }

  // Deterministic looping offset (marquee).
  const loop = (t, speed, len) => (((t * speed) % len) + len) % len;

  // Render clock: a property setter tweened by the paused GSAP timeline calls render(t)
  // on every seek, so the whole scene state is a pure function of time.
  function clock(tl, dur, render) {
    let cur = -1;
    const proxy = {};
    Object.defineProperty(proxy, "t", {
      get: () => cur,
      set: (v) => {
        cur = v;
        render(v);
      },
    });
    tl.fromTo(proxy, { t: 0 }, { t: dur, duration: dur, ease: "none" }, 0);
    render(0);
    return tl;
  }

  async function ready(fonts) {
    try {
      await Promise.all(
        (fonts || ['800 100px "Syne"', '700 100px "Syne"', '400 40px "Inter"', '600 40px "Inter"']).map((f) => document.fonts.load(f)),
      );
      await document.fonts.ready;
    } catch (e) {}
  }

  return { textW, clamp, lerp, prog, E, tw, step, spring, sp, rng, set, tf, op, splitWords, revealWords, hideWords, rotator, beam, loop, clock, ready };
})();
