const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const mode = process.argv[2] || 'preview';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('page:', m.text()));
  page.on('pageerror', e => console.log('err:', e.message));
  await page.goto('file://' + __dirname + '/anim.html');
  await page.evaluate(() => window.ready);
  const el = await page.$('#c');
  if (mode === 'preview') {
    fs.mkdirSync('preview', { recursive: true });
    for (const t of process.argv.slice(3).map(Number)) {
      await page.evaluate(t => window.draw(t), t);
      await el.screenshot({ path: `preview/t${t}.png` });
    }
  } else {
    fs.mkdirSync('frames', { recursive: true });
    const fps = 30, n = 10 * fps;
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.draw(t), i / fps);
      await el.screenshot({ path: `frames/f${String(i).padStart(4, '0')}.png` });
    }
  }
  await browser.close();
})();
