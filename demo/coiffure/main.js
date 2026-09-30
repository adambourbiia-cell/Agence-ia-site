/* Atelier Lune — interactions (démo Vortex) */
(() => {
  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

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

  /* Reveal (the hero arch is clipped, so it is revealed on load instead of observed) */
  const arch = $('.arch');
  const els = $$('[data-reveal], [data-words]').filter((el) => el !== arch);
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
    setTimeout(() => arch?.classList.add('is-visible'), 150);
  } else [...els, arch].forEach((el) => el?.classList.add('is-visible'));

  /* Count-up */
  const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target; const to = +el.dataset.count;
    if (reduced) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = (t) => { const p = clamp((t - t0) / 1500); el.textContent = Math.round(to * (1 - (1 - p) ** 3)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach((el) => cio.observe(el));

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

  /* Price tabs + image cross-fade */
  const tabs = $$('.tabs button');
  const ink = $('.tabs__ink');
  const moveInk = (btn) => { if (!ink || !btn) return; ink.style.width = `${btn.offsetWidth}px`; ink.style.transform = `translateX(${btn.offsetLeft}px)`; };
  const show = (name) => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
    $$('.plist').forEach((p) => p.classList.toggle('is-on', p.dataset.panel === name));
    $$('.services__img img').forEach((i) => i.classList.toggle('is-on', i.dataset.for === name));
    moveInk(tabs.find((t) => t.dataset.tab === name));
  };
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
  addEventListener('resize', () => moveInk(tabs.find((t) => t.getAttribute('aria-selected') === 'true')));
  addEventListener('load', () => moveInk(tabs[0]));
  requestAnimationFrame(() => moveInk(tabs[0]));

  /* Booking widget (demo) */
  const book = $('.book');
  if (book) {
    const state = { service: 'Coupe & brushing', dur: '1h', day: null, slot: null };
    const daysEl = $('.days', book); const slotsEl = $('.slots', book);
    const recap = $('.book__recap', book); const confirm = $('.book__summary .btn', book); const msg = $('.book__msg', book);
    const fmtDay = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const refresh = () => {
      recap.textContent = state.day && state.slot
        ? `${state.service} · ${fmtDay(state.day)} à ${state.slot}`
        : `${state.service} (${state.dur}) · choisissez ${state.day ? 'un créneau' : 'un jour'}`;
      recap.classList.remove('flash'); void recap.offsetWidth; recap.classList.add('flash');
      confirm.disabled = !(state.day && state.slot);
    };
    // next 12 days; closed Sunday (0) and Monday (1)
    const today = new Date(); today.setHours(12, 0, 0, 0);
    for (let k = 1; k <= 12; k++) {
      const d = new Date(today); d.setDate(today.getDate() + k);
      const closed = d.getDay() === 0 || d.getDay() === 1;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'day'; b.disabled = closed;
      b.innerHTML = `<small>${d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</small><b>${d.getDate()}</b>`;
      b.setAttribute('aria-label', fmtDay(d) + (closed ? ' (fermé)' : ''));
      b.addEventListener('click', () => {
        $$('.day', daysEl).forEach((x) => x.classList.toggle('is-on', x === b));
        state.day = d; state.slot = null;
        const hours = d.getDay() === 6 ? ['9h00', '10h00', '11h00', '13h30', '14h30', '15h30'] : ['9h30', '10h30', '11h30', '14h00', '15h00', '16h00', '17h00', '18h00'];
        slotsEl.innerHTML = '';
        hours.forEach((h, i) => {
          const s = document.createElement('button');
          s.type = 'button'; s.className = 'slot'; s.textContent = h; s.style.setProperty('--i', i);
          s.disabled = (d.getDate() * 7 + i * 3) % 5 === 0; // some slots already taken (deterministic)
          s.addEventListener('click', () => { $$('.slot', slotsEl).forEach((x) => x.classList.toggle('is-on', x === s)); state.slot = h; refresh(); });
          slotsEl.appendChild(s);
        });
        refresh();
      });
      daysEl.appendChild(b);
    }
    $$('.pill', book).forEach((p) => p.addEventListener('click', () => {
      $$('.pill', book).forEach((x) => x.classList.toggle('is-on', x === p));
      state.service = p.dataset.value; state.dur = p.dataset.dur; refresh();
    }));
    confirm.addEventListener('click', () => {
      msg.textContent = `Démo : rendez-vous « ${state.service} » réservé le ${fmtDay(state.day)} à ${state.slot}. Sur un vrai site, vous recevriez une confirmation par SMS.`;
    });
    refresh();
  }

  /* Lightbox */
  const lb = $('.lightbox');
  if (lb) {
    const img = $('img', lb);
    const close = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); };
    $$('.shot').forEach((s) => s.addEventListener('click', () => {
      const i = $('img', s); img.src = i.src; img.alt = i.alt;
      lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    }));
    lb.addEventListener('click', (e) => { if (e.target !== img) close(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* Reviews autoplay */
  const qs = $$('.q'); const dots = $$('.dots button');
  if (qs.length) {
    let qi = 0; let timer;
    const go = (n) => {
      qi = (n + qs.length) % qs.length;
      qs.forEach((q, i) => q.classList.toggle('is-on', i === qi));
      dots.forEach((d, i) => d.classList.toggle('is-on', i === qi));
      clearTimeout(timer); if (!reduced) timer = setTimeout(() => go(qi + 1), 6000);
    };
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    go(0);
  }

  /* Scroll: nav, parallax, sticky RDV bar */
  const nav = $('#nav'); const par = $$('[data-parallax]'); const bar = $('.rdv-bar'); const hero = $('.hero'); const rdv = $('#rdv');
  let ticking = false;
  const onScroll = () => {
    const vh = innerHeight;
    nav?.classList.toggle('is-scrolled', scrollY > 40);
    if (bar && hero && rdv) {
      const rr = rdv.getBoundingClientRect();
      bar.classList.toggle('is-on', hero.getBoundingClientRect().bottom < 0 && !(rr.top < vh && rr.bottom > 0));
    }
    if (reduced) return;
    par.forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.translate = `0 ${(r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax)}px`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  onScroll();
})();
