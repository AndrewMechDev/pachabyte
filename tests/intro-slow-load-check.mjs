import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Regression for the checkpoint 2 live failure: on a first visit the intro downloads two textures in preload(). If that is
// slower than the key press that opened it, the native keyup used to fire before the scene listened, so the entry key stayed
// "held" and a manual skip never left the intro. This check delays those downloads and uses real, short key presses.
// PACHA_URL=http://127.0.0.1:4198 node tests/intro-slow-load-check.mjs
const base = process.env.PACHA_URL;
if (!base) throw new Error('PACHA_URL must select the owned preview explicitly');
const LOAD_DELAY_MS = 700;
const browser = await chromium.launch({ channel: process.env.PACHA_BROWSER_CHANNEL ?? 'msedge', headless: true });
const results = [];
try {
  for (const renderer of ['webgl', 'canvas']) {
    for (const exit of ['Escape', 'Enter x4']) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      let delayed = 0;
      // Fresh page, empty cache: the intro's own textures are fetched after the key press and answered late.
      await page.route(/arequipa-arena|kipu-v4/, async route => { delayed += 1; await new Promise(resolve => setTimeout(resolve, LOAD_DELAY_MS)); await route.continue(); });
      await page.goto(`${base}/?debug=1${renderer === 'canvas' ? '&renderer=canvas' : ''}`, { waitUntil: 'networkidle' });
      const scene = (name, timeout = 5000) => page.waitForFunction(n => window.pachaDebug?.().scene === n, name, { timeout });
      await scene('map');
      await page.keyboard.press('Enter', { delay: 80 });
      await scene('intro');
      assert.ok(delayed >= 1, `the intro textures must have been fetched late (${delayed} delayed requests)`);
      await page.waitForTimeout(300);
      if (exit === 'Escape') await page.keyboard.press('Escape', { delay: 80 });
      else for (let i = 0; i < 4; i++) { await page.keyboard.press('Enter', { delay: 80 }); await page.waitForTimeout(200); }
      await scene('route', 3000).catch(async () => { throw new Error(`${renderer}/${exit}: intro never left after the manual exit (${JSON.stringify(await page.evaluate(() => { const d = window.pachaDebug?.(); return d && { scene: d.scene, card: d.card, done: d.done }; }))})`); });
      assert.deepEqual(errors, [], `${renderer}/${exit}: page errors`);
      results.push(`${renderer}/${exit}: left the intro (${delayed} delayed requests)`);
      await page.close();
    }
  }
  console.log(JSON.stringify({ status: 'passed', results }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', results, error: String(error?.message ?? error) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
