/* Vortex — personnalisation des démos par l'URL, pour les maquettes prospects.
   ?n=Nom de l'entreprise &v=Ville &t=Téléphone &c=couleur (hex sans #)
   Doit être chargé AVANT le main.js de la démo (qui découpe les titres en lettres). */
(() => {
  const q = new URLSearchParams(location.search);
  const clean = (s, max) => (s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
  const name = clean(q.get('n'), 40);
  const city = clean(q.get('v'), 30);
  const tel = clean(q.get('t'), 20);
  const color = /^[0-9a-f]{6}$/i.test(q.get('c') || '') ? '#' + q.get('c') : '';
  if (!name && !city && !tel && !color) return;

  const D = {
    artisan: { brand: ['Cuivre & Co'], city: ['Lyon'], logos: ['.logo > span', '.logo--foot > span'], accent: ['--yellow', '--yellow-2'] },
    restaurant: { brand: ['Le Brasier'], alt: [['au Brasier', 'chez ' + name], ['Au Brasier', 'Chez ' + name]], city: ['Lyon'], logos: [], brandEls: ['.brand'], accent: ['--ember', '--ember-2'] },
    coiffure: { brand: ["l'Atelier Lune", 'Atelier Lune'], city: ['Lyon'], logos: ['.logo > span', '.logo--foot > span'], accent: ['--rose', '--rose-2'] },
    garage: { brand: ['Delta Auto'], city: ['Vénissieux', 'Lyon'], logos: ['.logo__txt'], accent: ['--orange', '--orange-2'] },
  };
  const key = (location.pathname.match(/\/demo\/([a-z]+)\//) || [])[1];
  const cfg = D[key]; if (!cfg) return;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const split = (s) => { const w = s.split(' '); return w.length > 1 ? esc(w.slice(0, -1).join(' ')) + ' <em>' + esc(w[w.length - 1]) + '</em>' : esc(s); };
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 1. Textes de la page
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    let t = n.nodeValue, o = t;
    if (name) {
      for (const [a, b] of cfg.alt || []) t = t.split(a).join(b);
      for (const b of cfg.brand) t = t.replace(new RegExp(reEsc(b), 'gi'), name);
    }
    if (city) for (const c of cfg.city) t = t.replace(new RegExp('\\b' + reEsc(c) + '(?: \\d{1,2}(?:er|e|ᵉ)(?![a-z]))?(?![A-Za-zÀ-ÿ])', 'g'), city);
    if (tel) t = t.replace(/0[1-9] 00 00 00 00/g, tel);
    if (t !== o) n.nodeValue = t;
  }
  // 2. Logos (nom découpé avec la dernière partie en couleur)
  if (name) {
    for (const sel of cfg.logos) document.querySelectorAll(sel).forEach((el) => { el.innerHTML = split(name); });
    for (const sel of cfg.brandEls || []) document.querySelectorAll(sel).forEach((el) => { const s = el.querySelector('span'); el.textContent = name + ' '; if (s) { if (city) s.textContent = city; el.appendChild(s); } });
    document.querySelectorAll('[aria-label]').forEach((el) => { const a = el.getAttribute('aria-label'); for (const b of cfg.brand.concat(['Cuivre et Co'])) if (a.includes(b)) el.setAttribute('aria-label', a.replace(b, name)); });
    document.title = document.title.replace(/^[^—]+/, name + ' ').replace(/\(démo Vortex\)/, '— maquette Vortex');
  }
  if (city) for (const c of cfg.city) document.title = document.title.split(c).join(city);
  // Titre principal : réduit si le nom est long (évite les coupures en plein mot)
  if (name && name.length > 10) document.querySelectorAll('.hero__title[data-letters]').forEach((h) => { const fs = parseFloat(getComputedStyle(h).fontSize) || 64; h.style.fontSize = Math.max(fs * 10 / name.length, fs * .45) + 'px'; h.style.whiteSpace = 'nowrap'; });
  // Restaurant : la partie en italique du grand titre = le dernier mot du nom
  if (name && key === 'restaurant') {
    const w = name.split(' '), k = w.length > 1 ? w.slice(0, -1).join('').length + 1 : 1;
    const st = document.createElement('style');
    st.textContent = `.hero__title .ch:nth-child(n){font-style:normal;color:inherit}.hero__title .ch:nth-child(n+${k}){font-style:italic;color:var(--ember-2)}`;
    document.head.appendChild(st);
  }
  // « Lyon 6<sup>e</sup> » → retire l'arrondissement après la nouvelle ville
  if (city) document.querySelectorAll('sup').forEach((sup) => { const prev = sup.previousSibling; if (prev && prev.nodeType === 3 && new RegExp(reEsc(city) + ' \\d{1,2}$').test(prev.nodeValue)) { prev.nodeValue = prev.nodeValue.replace(/ \d{1,2}$/, ''); sup.remove(); } });
  // 3. Téléphone cliquable
  if (tel) { const num = tel.replace(/[^\d+]/g, ''); document.querySelectorAll('a[href^="tel:"], .contact__phone, a.phone').forEach((a) => { a.setAttribute('href', 'tel:' + num); const sm = a.querySelector('small'); if (sm) sm.remove(); }); }
  // 4. Couleur principale
  if (color) for (const v of cfg.accent) document.documentElement.style.setProperty(v, color);
  // 5. Bandeau
  const bar = document.querySelector('.demo-bar span');
  if (bar && name) bar.innerHTML = 'Maquette préparée pour <strong>' + esc(name) + '</strong> par Vortex';
  const back = document.querySelector('.demo-bar a');
  if (back) { back.textContent = 'Je veux ce site →'; back.setAttribute('href', '/#contact'); }
})();
