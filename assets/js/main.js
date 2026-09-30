/* =========================================================
   Vortex — interactions (vanilla, no dependencies)
   ========================================================= */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Split headings into masked words ---------- */
  $$('[data-split]').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = 'split-word';
            const inner = document.createElement('span');
            inner.style.setProperty('--i', i++);
            inner.textContent = p;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal], [data-split]');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Count-up ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      if (reduced) { el.textContent = target; return; }
      const t0 = performance.now();
      const tick = (t) => {
        const p = clamp((t - t0) / 1600);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- Hero starfield ---------- */
  const canvas = $('.hero__stars');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w = 0; let h = 0;
    let mx = 0; let my = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 9000);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.3 + 0.2,
        z: Math.random() * 0.8 + 0.2,
        tw: Math.random() * Math.PI * 2,
        teal: Math.random() < 0.18,
      }));
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach((s) => {
        const a = 0.35 + 0.45 * Math.sin(t / 900 + s.tw);
        const x = s.x + mx * s.z * 18;
        const y = s.y + my * s.z * 18 - (t / 60) * s.z;
        const yy = ((y % h) + h) % h;
        ctx.beginPath();
        ctx.arc(x, yy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.teal ? `rgba(34,193,211,${a})` : `rgba(255,255,255,${a * 0.7})`;
        ctx.fill();
      });
      if (!reduced) requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize);
    if (finePointer) {
      window.addEventListener('pointermove', (e) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
      });
    }
    requestAnimationFrame(draw);
  }

  /* ---------- Pointer effects ---------- */
  if (finePointer && !reduced) {
    // magnetic buttons
    $$('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * 0.2}px`);
        btn.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * 0.3}px`);
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--bx', '0px');
        btn.style.setProperty('--by', '0px');
      });
    });
    // card spotlight + border glow
    $$('.scard').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
    // mock tilt following the pointer
    $$('[data-tilt]').forEach((el) => {
      const card = el.closest('.scard');
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 22}deg`);
        el.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 16}deg`);
      });
      card.addEventListener('pointerleave', () => {
        el.style.removeProperty('--ry');
        el.style.removeProperty('--rx');
      });
    });
  }

  /* ---------- Project frame tilt ---------- */
  if (finePointer && !reduced) {
    $$('[data-tilt-frame]').forEach((frame) => {
      const host = frame.parentElement;
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        frame.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`);
        frame.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 8}deg`);
      });
      host.addEventListener('pointerleave', () => {
        frame.style.removeProperty('--ry');
        frame.style.removeProperty('--rx');
      });
    });
  }

  /* ---------- Scroll-driven effects ---------- */
  const header = $('#header');
  const bar = $('.scroll-progress span');
  const planet = $('.horizon__planet');
  const heroContent = $('.hero__content');
  const stepsWrap = $('.steps');
  const stepsLine = $('.steps__line i');
  const steps = $$('.step');
  const navLinks = $$('.header__nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = doc.scrollHeight - vh;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (header) {
      header.classList.toggle('is-scrolled', y > 20);
      if (y > 500 && y > lastY + 4) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y <= 500) header.classList.remove('is-hidden');
    }
    lastY = y;

    let current = null;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.4) current = navLinks[i]; });
    navLinks.forEach((a) => a.classList.toggle('is-active', a === current));

    if (reduced) return;

    // hero parallax: planet rises, content drifts and fades
    if (y < vh * 1.2) {
      if (planet) planet.style.translate = `0 ${-y * 0.18}px`;
      if (heroContent) {
        heroContent.style.transform = `translateY(${y * 0.25}px)`;
        heroContent.style.opacity = String(clamp(1 - y / (vh * 0.8)));
      }
    }

    // method line fill + lit steps
    if (stepsWrap && stepsLine) {
      const r = stepsWrap.getBoundingClientRect();
      const p = clamp((vh * 0.75 - r.top) / (r.height * 0.9));
      stepsLine.style.setProperty('--p', p);
      steps.forEach((s, i) => s.classList.toggle('is-lit', p >= i / Math.max(1, steps.length - 1) - 0.02));
    }
  };
  const requestTick = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); }
  };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  /* ---------- Contact form (Netlify Forms) ---------- */
  const form = $('.form');
  if (form) {
    const msg = $('.form__msg', form);
    const btn = $('button[type="submit"]', form);
    const label = $('.btn__label', btn);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = form.elements.name;
      const email = form.elements.email;
      let ok = true;
      [name, email].forEach((f) => {
        const valid = f.value.trim() && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        f.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) { msg.textContent = 'Merci de renseigner votre nom et un e‑mail valide.'; return; }
      btn.disabled = true;
      label.textContent = 'Envoi…';
      msg.textContent = '';
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(res.status);
        msg.textContent = `Merci ${name.value.trim().split(' ')[0]} ! Votre demande est bien envoyée, on vous répond sous 24 h.`;
        label.textContent = 'Demande envoyée';
        form.reset();
      } catch (err) {
        msg.textContent = "L'envoi a échoué. Réessayez ou écrivez à vortex.twitch.live@gmail.com.";
        label.textContent = 'Demander mon site';
        btn.disabled = false;
      }
    });
  }

  /* ---------- FAQ smooth accordion ---------- */
  $$('.faq__item').forEach((item) => {
    const summary = $('summary', item);
    const body = $('.faq__answer', item);
    summary.addEventListener('click', (e) => {
      if (reduced) return;
      e.preventDefault();
      if (item.open) {
        body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 300, easing: 'ease-out' }).onfinish = () => { item.open = false; };
      } else {
        $$('.faq__item[open]').forEach((o) => { if (o !== item) o.open = false; });
        item.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* ---------- Footer year ---------- */
  const year = $('.year');
  if (year) year.textContent = new Date().getFullYear();
})();
