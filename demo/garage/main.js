/* Delta Auto — interactions (démo Vortex) */
(() => {
  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');

  /* Line-by-line title reveal */
  $$('[data-lines]').forEach((el) => {
    [...el.children].forEach((line, i) => {
      const inner = document.createElement('span');
      inner.style.setProperty('--i', i);
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);
    });
  });

  /* Reveal */
  const els = $$('[data-reveal], [data-lines]');
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
    if (reduced) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => { const p = clamp((t - t0) / 1600); el.textContent = fmt(to * (1 - (1 - p) ** 4)); if (p < 1) requestAnimationFrame(step); };
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
    $$('[data-tilt]').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
        c.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 8}deg`);
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* Quote: license plate + gauge */
  const plate = $('#plate');
  const hint = $('.plate__hint');
  const plateBox = $('.plate');
  if (plate) {
    plate.addEventListener('input', () => {
      const raw = plate.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
      let out = raw;
      if (raw.length > 2) out = raw.slice(0, 2) + '-' + raw.slice(2);
      if (raw.length > 5) out = raw.slice(0, 2) + '-' + raw.slice(2, 5) + '-' + raw.slice(5);
      plate.value = out;
      const ok = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/.test(out);
      plateBox.classList.toggle('is-valid', ok);
      hint.classList.toggle('ok', ok);
      hint.textContent = ok ? '✓ Plaque reconnue — estimation pour votre véhicule' : 'Format français : AB-123-CD';
      if (ok) update();
    });
  }
  const ticks = $('.gauge__ticks');
  if (ticks) {
    for (let k = 0; k <= 10; k++) {
      const a = Math.PI * (1 - k / 10);
      const x1 = 100 + Math.cos(a) * 66, y1 = 110 - Math.sin(a) * 66;
      const x2 = 100 + Math.cos(a) * (k % 5 ? 60 : 56), y2 = 110 - Math.sin(a) * (k % 5 ? 60 : 56);
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2);
      ticks.appendChild(l);
    }
  }
  const chips = $$('.chip');
  const minEl = $('.q-min'), maxEl = $('.q-max'), label = $('.gauge__label');
  const needle = $('.gauge__needle'), fill = $('.gauge__fill');
  let cur = { min: 89, max: 169 };
  const update = () => {
    const c = chips.find((x) => x.classList.contains('is-on')) || chips[0];
    const min = +c.dataset.min, max = +c.dataset.max;
    label.innerHTML = c.dataset.label;
    // gauge position: log scale 20 € → 1000 €
    const p = clamp(Math.log(max / 20) / Math.log(1000 / 20));
    needle.style.transform = `rotate(${-90 + p * 180}deg)`;
    fill.style.strokeDashoffset = String(252 - 252 * p);
    const from = { ...cur }; const t0 = performance.now();
    const step = (t) => {
      const k = reduced ? 1 : 1 - (1 - clamp((t - t0) / 700)) ** 3;
      minEl.textContent = fmt(from.min + (min - from.min) * k);
      maxEl.textContent = fmt(from.max + (max - from.max) * k);
      if (k < 1) requestAnimationFrame(step); else cur = { min, max };
    };
    requestAnimationFrame(step);
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-checked', String(x === c)); });
    update();
  }));
  const gauge = $('.gauge');
  if (gauge) {
    new IntersectionObserver((entries, obs) => entries.forEach((e) => { if (e.isIntersecting) { update(); obs.disconnect(); } }), { threshold: 0.4 }).observe(gauge);
  }

  /* Booking days (demo) */
  const days = $('.days');
  let chosen = null;
  if (days) {
    const d0 = new Date(); d0.setHours(12, 0, 0, 0);
    let added = 0; let k = 1;
    while (added < 6) {
      const d = new Date(d0); d.setDate(d0.getDate() + k++);
      if (d.getDay() === 0) continue;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'day';
      b.innerHTML = `<small>${d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</small><b>${d.getDate()}</b>`;
      b.setAttribute('aria-label', d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
      b.addEventListener('click', () => { $$('.day', days).forEach((x) => x.classList.toggle('is-on', x === b)); chosen = d; });
      days.appendChild(b); added++;
    }
  }
  const form = $('.rform');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('.rform__msg', form);
    let ok = true;
    ['nom', 'tel'].forEach((n) => { const f = form.elements[n]; const v = !!f.value.trim(); f.classList.toggle('is-invalid', !v); if (!v) ok = false; });
    if (!ok) { msg.style.color = '#e0413b'; msg.textContent = 'Merci d\'indiquer votre nom et votre téléphone.'; return; }
    if (!chosen) { msg.style.color = '#e0413b'; msg.textContent = 'Choisissez un jour.'; return; }
    msg.style.color = '';
    msg.textContent = `Démo : demande enregistrée pour le ${chosen.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}. Sur un vrai site, le garage vous rappellerait pour confirmer.`;
  });

  /* Scroll: nav, hero parallax, road progress, parallax images, call bar */
  const nav = $('#nav'); const heroBg = $('.hero__bg'); const hero = $('.hero');
  const road = $('.road__track'); const roadLine = $('.road__line'); const rsteps = $$('.rstep');
  const par = $$('[data-parallax]'); const callbar = $('.callbar');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY, vh = innerHeight;
    nav?.classList.toggle('is-scrolled', y > 40);
    if (callbar && hero) callbar.classList.toggle('is-on', hero.getBoundingClientRect().bottom < 0);
    if (reduced) { roadLine?.style.setProperty('--p', 1); rsteps.forEach((s) => s.classList.add('is-on')); return; }
    if (heroBg && y < vh * 1.2) heroBg.style.translate = `0 ${y * 0.3}px`;
    if (road && roadLine) {
      const r = road.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (vh * 0.6));
      roadLine.style.setProperty('--p', p);
      rsteps.forEach((s, i) => s.classList.toggle('is-on', p >= (i + 0.5) / rsteps.length - 0.1));
    }
    par.forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.translate = `0 ${(r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax)}px`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  onScroll();
})();
