// Construit la version web de démonstration de Dicta : une page + un seul fichier JS,
// sans chemin absolu, pour être hébergée n'importe où (sous-dossier compris).
// Usage : node scripts/build-web-demo.mjs [dossier de sortie, défaut dist-web-demo]
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const out = resolve(process.argv[2] ?? 'dist-web-demo');
const tmp = join(out, '.export');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

execSync(`npx expo export --platform web --output-dir "${tmp}"`, {
  stdio: 'inherit',
  // Sans Supabase : mode hors ligne, données dans le navigateur, exemples au premier lancement.
  env: { ...process.env, EXPO_PUBLIC_WEB_DEMO: '1', EXPO_PUBLIC_SUPABASE_URL: '', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' },
});

const jsDir = join(tmp, '_expo/static/js/web');
const bundles = readdirSync(jsDir).filter((f) => f.endsWith('.js'));
if (bundles.length !== 1) throw new Error(`Un seul bundle attendu, trouvé : ${bundles.join(', ')}`);
let js = readFileSync(join(jsDir, bundles[0]), 'utf8');

// Icônes de navigation : intégrées en data URI plutôt que chargées depuis /assets/.
js = js.replace(/"\/assets\/([^"]+?\.png)"/g, (_, path) => {
  const file = join(tmp, 'assets', path);
  if (!existsSync(file)) throw new Error(`Image introuvable : ${path}`);
  return `"data:image/png;base64,${readFileSync(file).toString('base64')}"`;
});
const leftover = js.match(/"\/(assets|_expo)\/[^"]*"/);
if (leftover) throw new Error(`Chemin absolu restant dans le bundle : ${leftover[0]}`);
writeFileSync(join(out, 'app.js'), js);

writeFileSync(
  join(out, 'index.html'),
  `<title>Dicta</title>
<style>
  html, body { height: 100%; }
  body { overflow: hidden; background: #f5f6f8; }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<noscript>Active JavaScript pour utiliser Dicta.</noscript>
<div id="root"></div>
<script>
  (function () {
    // Le fichier JS est à côté de la page, quel que soit le dossier où elle est servie.
    var base = '';
    try { base = new URL('.', location.href).href; } catch (e) {}
    // Expo Router lit le chemin de l'URL : on démarre toujours sur l'accueil.
    try { if (location.pathname !== '/') history.replaceState(null, '', '/'); } catch (e) {}
    var s = document.createElement('script');
    s.src = base + 'app.js';
    document.body.appendChild(s);
  })();
</script>
`,
);
rmSync(tmp, { recursive: true, force: true });
console.log(`Version web prête dans ${out} (index.html + app.js, ${(js.length / 1e6).toFixed(1)} Mo)`);
