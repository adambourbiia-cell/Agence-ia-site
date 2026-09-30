/* Le Brasier — interactions (démo Vortex) */
(() => {
  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* Split hero title into letters */
  $$('[data-letters]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((c, i) => (c === ' '
      ? ' '
      : `<span class="ch" aria-hidden="true" style="--i:${i}">${c}</span>`)).join('');
  });

  /* Split headings into words */
  $$('[data-words]').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const o = document.createElement('span'); o.className = 'w';
            const n = document.createElement('span'); n.style.setProperty('--i', i++); n.textContent = p;
            o.appendChild(n); frag.appendChild(o);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
      });
    };
    walk(el);
  });

  /* Reveal on scroll */
  const els = $$('[data-reveal], [data-words], [data-letters], .about__media, .about__sign');
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        $$('.reveal-img', e.target).forEach((f) => f.classList.add('is-visible'));
        io.unobserve(e.target);
      }
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  } else [...els, ...$$('.reveal-img')].forEach((el) => el.classList.add('is-visible'));

  /* Embers particles in hero */
  const cv = $('.embers');
  if (cv && !reduced) {
    const ctx = cv.getContext('2d');
    let w, h, parts = [];
    const spawn = (initial) => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10,
      r: Math.random() * 2.2 + 0.6,
      vy: Math.random() * 0.7 + 0.35,
      vx: (Math.random() - 0.5) * 0.4,
      life: Math.random() * 0.6 + 0.4,
      ph: Math.random() * Math.PI * 2,
    });
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      w = cv.offsetWidth; h = cv.offsetHeight;
      cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      parts = Array.from({ length: Math.round(w / 18) }, () => spawn(true));
    };
    const loop = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      parts.forEach((p, i) => {
        p.y -= p.vy; p.x += p.vx + Math.sin(t / 700 + p.ph) * 0.3;
        const k = clamp(p.y / h);
        const a = p.life * k;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(255,170,90,${a})`);
        g.addColorStop(1, 'rgba(217,97,43,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
        if (p.y < -10) parts[i] = spawn(false);
      });
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(loop);
    };
    size(); addEventListener('resize', size); requestAnimationFrame(loop);
  }

  /* Magnetic buttons */
  if (fine && !reduced) {
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
        b.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  /* Menu tabs with sliding ink */
  const tabs = $$('.tabs button');
  const ink = $('.tabs__ink');
  const moveInk = (btn) => {
    if (!ink || !btn) return;
    ink.style.width = `${btn.offsetWidth}px`;
    ink.style.transform = `translateX(${btn.offsetLeft}px)`;
  };
  const showPanel = (name) => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
    $$('.dishes').forEach((p) => {
      const on = p.dataset.panel === name;
      p.classList.toggle('is-active', on);
      if (on) $$('.dish', p).forEach((d, i) => { d.style.setProperty('--i', i); d.style.animation = 'none'; void d.offsetWidth; d.style.animation = ''; });
    });
    moveInk(tabs.find((t) => t.dataset.tab === name));
  };
  tabs.forEach((t) => t.addEventListener('click', () => showPanel(t.dataset.tab)));
  addEventListener('resize', () => moveInk(tabs.find((t) => t.getAttribute('aria-selected') === 'true')));
  // play the first panel's entrance when the menu scrolls into view
  const menu = $('.menu');
  if (menu) {
    $$('.dishes.is-active .dish').forEach((d) => { d.style.animationPlayState = 'paused'; });
    new IntersectionObserver((entries, obs) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      showPanel('entrees');
      $$('.dish').forEach((d) => { d.style.animationPlayState = ''; });
      obs.disconnect();
    }), { threshold: 0.2 }).observe(menu);
  }
  requestAnimationFrame(() => moveInk(tabs[0]));

  /* Cursor-follow dish image */
  const cImg = $('.cursor-img');
  if (cImg && fine) {
    const img = $('img', cImg);
    let x = 0, y = 0, cx = 0, cy = 0, raf;
    const follow = () => {
      cx += (x - cx) * 0.16; cy += (y - cy) * 0.16;
      cImg.style.left = `${cx}px`; cImg.style.top = `${cy}px`;
      raf = requestAnimationFrame(follow);
    };
    $$('.dish[data-img]').forEach((d) => {
      d.addEventListener('pointerenter', (e) => {
        img.src = d.dataset.img; x = cx = e.clientX + 150; y = cy = e.clientY;
        cImg.classList.add('is-on'); cancelAnimationFrame(raf); follow();
      });
      d.addEventListener('pointermove', (e) => { x = e.clientX + 150; y = e.clientY; });
      d.addEventListener('pointerleave', () => { cImg.classList.remove('is-on'); cancelAnimationFrame(raf); });
    });
  }

  /* Scroll-driven: nav, hero parallax, parallax figures, horizontal gallery */
  const nav = $('#nav');
  const heroMedia = $('.hero__media');
  const heroContent = $('.hero__content');
  const par = $$('[data-parallax]');
  const gal = $('.gallery');
  const track = $('.gallery__track');
  const pinMQ = matchMedia('(min-width: 901px)');
  let lastY = scrollY, ticking = false;

  const sizeGallery = () => {
    if (!gal || !track) return;
    if (pinMQ.matches && !reduced) gal.style.height = `${innerHeight + Math.max(0, track.scrollWidth - innerWidth)}px`;
    else { gal.style.height = ''; track.style.transform = ''; }
  };

  const onScroll = () => {
    const y = scrollY, vh = innerHeight;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 30);
      if (y > 600 && y > lastY + 4) nav.classList.add('is-hidden');
      else if (y < lastY - 4) nav.classList.remove('is-hidden');
    }
    lastY = y;
    if (reduced) return;
    if (y < vh * 1.2) {
      if (heroMedia) heroMedia.style.transform = `translateY(${y * 0.35}px)`;
      if (heroContent) { heroContent.style.transform = `translateY(${y * 0.2}px)`; heroContent.style.opacity = String(clamp(1 - y / (vh * 0.7))); }
    }
    par.forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.translate = `0 ${(r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax)}px`;
    });
    if (gal && track && pinMQ.matches) {
      const r = gal.getBoundingClientRect();
      const dist = gal.offsetHeight - vh;
      const p = dist > 0 ? clamp(-r.top / dist) : 0;
      track.style.transform = `translate3d(${-p * Math.max(0, track.scrollWidth - innerWidth)}px,0,0)`;
    }
  };
  const tick = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } };
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', () => { sizeGallery(); tick(); });
  addEventListener('load', () => { sizeGallery(); tick(); });
  sizeGallery(); onScroll();

  /* Reservation (demo only: nothing is sent) */
  const form = $('.resa');
  if (form) {
    const out = $('output', form);
    let n = 2;
    $$('[data-step]', form).forEach((b) => b.addEventListener('click', () => {
      n = Math.min(12, Math.max(1, n + Number(b.dataset.step)));
      out.textContent = n;
      out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump');
    }));
    const date = form.elements.date;
    if (date) date.min = new Date().toISOString().slice(0, 10);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = $('.resa__msg', form);
      const nom = form.elements.nom;
      let ok = true;
      [nom, date].forEach((f) => { const v = !!f.value.trim(); f.classList.toggle('is-invalid', !v); if (!v) ok = false; });
      if (!ok) { msg.textContent = 'Merci d\'indiquer votre nom et une date.'; return; }
      const d = new Date(`${date.value}T12:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      msg.textContent = `Démo : table pour ${n} le ${d} à ${form.elements.heure.value}. Sur un vrai site, la réservation serait envoyée au restaurant.`;
    });
  }
})();
