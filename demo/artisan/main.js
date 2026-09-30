/* Cuivre & Co — interactions (démo Vortex) */
(() => {
  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');

  /* Split headings into words (keeps <mark> highlights) */
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

  /* Reveal */
  const els = $$('[data-reveal], [data-words]');
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  } else els.forEach((el) => el.classList.add('is-visible'));

  /* Count-up */
  const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target; const to = +el.dataset.count;
    if (reduced) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = (t) => { const p = clamp((t - t0) / 1400); el.textContent = Math.round(to * (1 - (1 - p) ** 3)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* Pointer effects */
  if (fine && !reduced) {
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * 0.2}px`);
        b.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * 0.3}px`);
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
    // floating cards follow the pointer in opposite directions
    const hero = $('.hero');
    const floats = $$('[data-float]');
    hero?.addEventListener('pointermove', (e) => {
      const x = e.clientX / innerWidth - 0.5; const y = e.clientY / innerHeight - 0.5;
      floats.forEach((f) => { const k = +f.dataset.float * 18; f.style.transform = `translate(${x * k}px, ${y * k}px)`; });
    });
  }

  /* Price estimator */
  const chips = $$('.chip');
  const urgent = $('#urgent');
  const minEl = $('.calc__min'); const maxEl = $('.calc__max'); const bar = $('.calc__bar i');
  let cur = { min: 90, max: 180 };
  const animateTo = (min, max) => {
    const from = { ...cur }; const t0 = performance.now();
    const step = (t) => {
      const p = reduced ? 1 : clamp((t - t0) / 600); const k = 1 - (1 - p) ** 3;
      minEl.textContent = fmt(from.min + (min - from.min) * k);
      maxEl.textContent = fmt(from.max + (max - from.max) * k);
      if (p < 1) requestAnimationFrame(step); else cur = { min, max };
    };
    requestAnimationFrame(step);
    if (bar) bar.style.width = `${clamp(Math.log10(max) / Math.log10(20000)) * 100}%`;
  };
  const update = () => {
    const on = chips.find((c) => c.classList.contains('is-on')) || chips[0];
    const f = urgent?.checked ? 1.5 : 1;
    animateTo(+on.dataset.min * f, +on.dataset.max * f);
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-checked', String(x === c)); });
    update();
  }));
  urgent?.addEventListener('change', update);
  if (bar) bar.style.width = `${Math.log10(180) / Math.log10(20000) * 100}%`;

  /* Before / after slider */
  const cmp = $('.compare');
  if (cmp) {
    const range = $('.compare__range', cmp);
    const set = (v) => cmp.style.setProperty('--pos', `${v}%`);
    range.addEventListener('input', () => set(range.value));
    // intro sweep once visible
    if (!reduced) {
      new IntersectionObserver((entries, obs) => entries.forEach((e) => {
        if (!e.isIntersecting) return; obs.disconnect();
        const t0 = performance.now();
        const sweep = (t) => {
          const p = clamp((t - t0) / 1800);
          const v = 50 + Math.sin(p * Math.PI * 2) * 30 * (1 - p);
          set(v); range.value = v;
          if (p < 1) requestAnimationFrame(sweep);
        };
        requestAnimationFrame(sweep);
      }), { threshold: 0.5 }).observe(cmp);
    }
  }

  /* FAQ smooth open */
  $$('.faq__list details').forEach((d) => {
    const sum = $('summary', d); const body = $('.faq__a', d);
    sum.addEventListener('click', (e) => {
      if (reduced) return;
      e.preventDefault();
      if (d.open) {
        body.animate([{ height: `${body.offsetHeight}px` }, { height: '0px' }], { duration: 300, easing: 'ease-out' }).onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* Scroll: nav, pipe fill, steps, mobile call bar */
  const nav = $('#nav');
  const pipeWrap = $('.pipe-steps'); const pipe = $('.pipe');
  const steps = $$('.pstep');
  const callbar = $('.callbar');
  const hero = $('.hero');
  let ticking = false;
  const onScroll = () => {
    const vh = innerHeight;
    nav?.classList.toggle('is-scrolled', scrollY > 60);
    if (callbar && hero) callbar.classList.toggle('is-on', hero.getBoundingClientRect().bottom < 0);
    if (pipeWrap && pipe) {
      const r = pipeWrap.getBoundingClientRect();
      const p = reduced ? 1 : clamp((vh * 0.6 - r.top) / r.height);
      pipe.style.setProperty('--p', p);
      steps.forEach((s) => s.classList.toggle('is-on', s.getBoundingClientRect().top < vh * 0.6));
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  onScroll();

  /* Contact (demo only) */
  const form = $('.cform');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('.cform__msg', form);
    let ok = true;
    ['nom', 'tel'].forEach((n) => { const f = form.elements[n]; const v = !!f.value.trim(); f.classList.toggle('is-invalid', !v); if (!v) ok = false; });
    msg.textContent = ok
      ? `Démo : merci ${form.elements.nom.value.trim().split(' ')[0]} ! Sur un vrai site, l'artisan vous rappellerait dans les 10 minutes.`
      : 'Merci d\'indiquer votre nom et votre téléphone.';
  });
})();
