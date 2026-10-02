// Assembles src/ into renderable HyperFrames files:
//   compositions/<id>.html  (one templated sub-composition per scene, lib + base CSS inlined)
//   index.html              (root composition: scene slots + voice/music/sfx audio)
// Run from the project root: node tools/build.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
// --portrait builds the 9:16 variant: src/scenes-916 -> compositions-916/ + index-916.html
const PORTRAIT = process.argv.includes("--portrait");
const W = PORTRAIT ? 1080 : 1920, H = PORTRAIT ? 1920 : 1080;
const SRC = PORTRAIT ? "src/scenes-916" : "src/scenes";
const OUTC = PORTRAIT ? "compositions-916" : "compositions";
const INDEX = PORTRAIT ? "index-916.html" : "index.html";
const T = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/timeline.json"), "utf8"));
T.scenes = T.scenes.filter((s) => fs.existsSync(path.join(ROOT, SRC, s.id + ".html")));
const lib = fs.readFileSync(path.join(ROOT, "src/lib.js"), "utf8");
const base = fs.readFileSync(path.join(ROOT, "src/base.css"), "utf8");
fs.mkdirSync(path.join(ROOT, OUTC), { recursive: true });

const r3 = (v) => Math.round(v * 1000) / 1000;

for (const s of T.scenes) {
  const src = fs.readFileSync(path.join(ROOT, SRC, s.id + ".html"), "utf8");
  const style = (src.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
  const script = (src.match(/<script>([\s\S]*?)<\/script>/) || [, ""])[1];
  const markup = src.replace(/<style>[\s\S]*?<\/style>/, "").replace(/<script>[\s\S]*?<\/script>/, "").trim();
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <template>
      <style>
${base}
${style}
      </style>
      <div id="root" data-composition-id="${s.id}" data-width="${W}" data-height="${H}" data-duration="${r3(s.dur)}">
${markup}
      </div>
      <script>
${lib}
(function () {
  const ID = "${s.id}";
  const DUR = ${r3(s.dur)};
  const T0 = ${r3(s.start)};
  const A = (x) => x - T0; // absolute (voice-over) time -> scene time
  const root = document.querySelector('[data-composition-id="${s.id}"]');
  const q = (sel) => root.querySelector(sel);
  const qa = (sel) => Array.from(root.querySelectorAll(sel));
${script}
})();
      </script>
    </template>
  </body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, OUTC, s.id + ".html"), html);
}

const total = r3(T.total);
const slots = T.scenes
  .map(
    (s, i) => `      <div
        id="slot-${s.id}"
        data-composition-id="${s.id}"
        data-composition-src="${OUTC}/${s.id}.html"
        data-start="${r3(s.start)}"
        data-duration="${r3(s.dur)}"
        data-track-index="${s.track ?? i + 1}"
        data-width="${W}"
        data-height="${H}"
      ></div>`,
  )
  .join("\n");

const audio = (T.audio || [])
  .map(
    (a) =>
      `      <audio id="${a.id}" src="${a.src}" data-start="${r3(a.start)}"${a.dur ? ` data-duration="${r3(a.dur)}"` : ""} data-track-index="${a.track}" data-volume="${a.volume ?? 1}"></audio>`,
  )
  .join("\n");

const index = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #0f1117; }
      #root { width: 100%; height: 100%; position: relative; background: #0f1117; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${slots}
${audio}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(ROOT, INDEX), index);
console.log("built", T.scenes.length, "scenes, total", total + "s");
