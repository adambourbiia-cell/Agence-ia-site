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
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
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
        } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains('rotator')) {
          walk(child);
        } else if (child.classList && child.classList.contains('rotator')) {
          // wrap the rotator itself as one animated "word"
          const outer = document.createElement('span');
          outer.className = 'split-word split-word--block';
          const inner = document.createElement('span');
          inner.style.setProperty('--i', i++);
          child.replaceWith(outer);
          inner.appendChild(child);
          outer.appendChild(inner);
        }
      });
    };
    walk(el);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal], [data-split], .stat');
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

  /* ---------- Count-up numbers ---------- */
  const fmt = (n, el) => {
    const dec = +(el.dataset.decimals || 0);
    let s = n.toFixed(dec);
    if (el.dataset.format === 'fr' || dec) {
      s = Number(s).toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    return s + (el.dataset.suffix || '');
  };
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    if (reduced) { el.textContent = fmt(target, el); return; }
    const dur = 1800; const t0 = performance.now();
    const tick = (t) => {
      const p = clamp((t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * eased, el);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { runCount(e.target); countIO.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- Hero rotating word ---------- */
  const rotWord = $('.rotator__word');
  if (rotWord && !reduced) {
    const words = ['convertissent.', 'se démarquent.', 'se chargent vite.', 'durent.', 'vous ressemblent.'];
    let idx = 0;
    setInterval(() => {
      rotWord.classList.add('is-out');
      setTimeout(() => {
        idx = (idx + 1) % words.length;
        rotWord.textContent = words[idx];
        rotWord.classList.remove('is-out');
        rotWord.classList.add('is-in');
        void rotWord.offsetWidth; // reflow
        rotWord.classList.remove('is-in');
      }, 450);
    }, 2800);
  }

  /* ---------- Hero browser: build loop ---------- */
  const browser = $('.browser');
  if (browser) {
    const lines = $$('.t-line', browser);
    const scores = $$('.score', browser);
    const status = $('.status-text', browser);
    const setScores = (on) => {
      scores.forEach((s) => {
        const val = +s.dataset.score;
        $('.arc', s).style.strokeDashoffset = on ? 100 - val : 100;
        const num = $('span', s);
        if (!on) { num.textContent = '0'; return; }
        const t0 = performance.now();
        const tick = (t) => {
          const p = clamp((t - t0) / 1400);
          num.textContent = Math.round(val * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    };
    const cycle = () => {
      browser.classList.remove('is-building', 'is-done');
      lines.forEach((l) => l.classList.remove('is-on'));
      setScores(false);
      status.textContent = 'Build en cours';
      setTimeout(() => browser.classList.add('is-building'), 200);
      lines.forEach((l, i) => setTimeout(() => l.classList.add('is-on'), 500 + i * 550));
      setTimeout(() => { setScores(true); }, 2000);
      setTimeout(() => { browser.classList.add('is-done'); status.textContent = 'En ligne'; }, 2900);
    };
    if (reduced) {
      browser.classList.add('is-building', 'is-done');
      lines.forEach((l) => l.classList.add('is-on'));
      setScores(true);
      status.textContent = 'En ligne';
    } else {
      cycle();
      setInterval(() => { if (!document.hidden) cycle(); }, 9000);
    }
  }

  /* ---------- 3D tilt ---------- */
  if (finePointer && !reduced) {
    $$('[data-tilt]').forEach((el) => {
      const host = el.parentElement;
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${x * 8}deg`);
        el.style.setProperty('--rx', `${-y * 8}deg`);
      });
      host.addEventListener('pointerleave', () => {
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
      });
    });

    /* Magnetic buttons */
    $$('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * 0.22}px`);
        btn.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * 0.3}px`);
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--bx', '0px');
        btn.style.setProperty('--by', '0px');
      });
    });

    /* Card spotlight */
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Manifesto: split into words ---------- */
  const hl = $('[data-highlight]');
  let hlWords = [];
  if (hl) {
    const accent = ['remarque', 'conversation.', 'mériter'];
    hl.innerHTML = hl.textContent.trim().split(/\s+/).map((w) =>
      `<span class="w${accent.some((a) => w.startsWith(a)) ? ' is-accent' : ''}">${w}</span>`
    ).join(' ');
    hlWords = $$('.w', hl);
    if (reduced) hlWords.forEach((w) => w.classList.add('is-lit'));
  }

  /* ---------- Scroll-driven effects (single rAF loop) ---------- */
  const nav = $('#nav');
  const bar = $('.scroll-progress span');
  const steps = $$('.step');
  const stepsLine = $('.steps__line i');
  const meter = $('.method__meter-num');
  const work = $('.work');
  const track = $('.work__track');
  const workBar = $('.work__bar i');
  const parallax = $$('[data-parallax]');
  const hero = $('.hero__gradient');
  const navLinks = $$('.nav__links a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const pinMQ = window.matchMedia('(min-width: 901px)');

  let lastY = window.scrollY;
  let ticking = false;
  let currentStep = -1;

  const sizeWork = () => {
    if (!work || !track) return;
    if (pinMQ.matches && !reduced) {
      const dist = track.scrollWidth - window.innerWidth;
      work.style.height = `${window.innerHeight + Math.max(0, dist)}px`;
    } else {
      work.style.height = '';
      track.style.transform = '';
    }
  };

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = doc.scrollHeight - vh;

    // progress bar
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // nav state
    if (nav && !nav.classList.contains('is-open')) {
      nav.classList.toggle('is-scrolled', y > 12);
      nav.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
      if (y < lastY - 2) nav.classList.remove('is-hidden');
    }
    lastY = y;

    if (reduced) return;

    // hero gradient parallax
    if (hero && y < vh * 1.2) hero.style.translate = `0 ${y * 0.25}px`;

    // generic parallax
    parallax.forEach((el) => {
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    // manifesto word highlight
    if (hlWords.length) {
      const r = hl.getBoundingClientRect();
      const p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.35));
      const lit = Math.round(p * hlWords.length);
      hlWords.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    }

    // method steps
    if (steps.length) {
      const list = steps[0].parentElement.getBoundingClientRect();
      const p = clamp((vh * 0.55 - list.top) / list.height);
      if (stepsLine) stepsLine.style.setProperty('--p', p);
      let active = 0;
      steps.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.55) active = i; });
      if (active !== currentStep) {
        currentStep = active;
        steps.forEach((s, i) => s.classList.toggle('is-active', i === active));
        if (meter) {
          meter.classList.add('is-swap');
          setTimeout(() => { meter.textContent = String(active + 1).padStart(2, '0'); meter.classList.remove('is-swap'); }, 200);
        }
      }
    }

    // horizontal work track
    if (work && track && pinMQ.matches) {
      const r = work.getBoundingClientRect();
      const dist = work.offsetHeight - vh;
      const p = dist > 0 ? clamp(-r.top / dist) : 0;
      const travel = Math.max(0, track.scrollWidth - window.innerWidth);
      track.style.transform = `translate3d(${-p * travel}px, 0, 0)`;
      if (workBar) workBar.style.setProperty('--p', p);
    }

    // active nav link
    let current = null;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.4) current = navLinks[i]; });
    navLinks.forEach((a) => a.classList.toggle('is-active', a === current));
  };

  const requestTick = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); }
  };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', () => { sizeWork(); requestTick(); });
  window.addEventListener('load', () => { sizeWork(); requestTick(); });
  sizeWork();
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $('.nav__burger');
  if (burger && nav) {
    const close = () => { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('.nav__mobile a').forEach((a) => a.addEventListener('click', close));
  }

  /* ---------- Testimonials carousel ---------- */
  const quotes = $$('.quote');
  if (quotes.length) {
    const wrap = $('.quotes');
    const timer = document.createElement('span');
    timer.className = 't-timer';
    wrap.appendChild(timer);
    const cur = $('.t-current');
    let qi = 0; let qTimer;
    const show = (n) => {
      const prev = quotes[qi];
      qi = (n + quotes.length) % quotes.length;
      if (prev !== quotes[qi]) {
        prev.classList.remove('is-active');
        prev.classList.add('is-leaving');
        setTimeout(() => prev.classList.remove('is-leaving'), 700);
      }
      quotes[qi].classList.add('is-active');
      if (cur) cur.textContent = String(qi + 1).padStart(2, '0');
      restart();
    };
    const restart = () => {
      clearTimeout(qTimer);
      if (reduced) return;
      timer.classList.remove('is-running'); void timer.offsetWidth; timer.classList.add('is-running');
      qTimer = setTimeout(() => show(qi + 1), 7000);
    };
    $('[data-t-next]').addEventListener('click', () => show(qi + 1));
    $('[data-t-prev]').addEventListener('click', () => show(qi - 1));
    restart();
  }

  /* ---------- FAQ smooth accordion ---------- */
  $$('.faq__item').forEach((item) => {
    const summary = $('summary', item);
    const content = $('.faq__content', item);
    summary.addEventListener('click', (e) => {
      if (reduced) return;
      e.preventDefault();
      if (item.open) {
        const h = content.offsetHeight;
        content.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 350, easing: 'cubic-bezier(.16,1,.3,1)' })
          .onfinish = () => { item.open = false; };
      } else {
        // close siblings
        $$('.faq__item[open]').forEach((o) => { if (o !== item) o.open = false; });
        item.open = true;
        const h = content.offsetHeight;
        content.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* ---------- Contact form (Netlify Forms) ---------- */
  const form = $('.form');
  if (form) {
    const msg = $('.form__msg', form);
    const btn = $('button[type="submit"]', form);
    const btnLabel = btn.firstChild;
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
      btnLabel.textContent = 'Envoi… ';
      msg.textContent = '';
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(res.status);
        msg.textContent = `Merci ${name.value.trim().split(' ')[0]} ! Votre demande est bien envoyée, réponse sous 24 h.`;
        btnLabel.textContent = 'Demande envoyée ';
        form.reset();
      } catch (err) {
        msg.textContent = "L'envoi a échoué. Réessayez ou écrivez à vortex.twitch.live@gmail.com.";
        btnLabel.textContent = 'Envoyer la demande ';
        btn.disabled = false;
      }
    });
  }

  /* ---------- Footer year ---------- */
  const year = $('.year');
  if (year) year.textContent = new Date().getFullYear();
})();
