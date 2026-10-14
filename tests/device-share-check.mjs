import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.PACHA_URL;
if (!base) throw new Error('PACHA_URL must select the owned preview explicitly');
const channel = process.env.PACHA_BROWSER_CHANNEL ?? 'msedge';
const notice = 'PachaByte se juega con teclado: ábrelo en una computadora.';
const description = 'Arcade retroandino: guía a Kipu por Arequipa, repara las rutas y libera a Amaru.';
const tags = { description, 'og:title': 'PachaByte — Ruta 01', 'og:description': description,
  'og:type': 'website', 'og:url': 'https://andrewmechdev.github.io/pachabyte/',
  'og:image': 'https://andrewmechdev.github.io/pachabyte/social-preview.png', 'twitter:card': 'summary_large_image' };
const out = 'docs/design/checkpoint-2-captures'; mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel, headless: true });
const results = [];
try {
  for (const renderer of ['webgl', 'canvas']) {
    const url = `${base}/?debug=1${renderer === 'canvas' ? '&renderer=canvas' : ''}`;
    const page = await browser.newPage({ viewport: { width: 470, height: 900 }, hasTouch: true });
    page.setDefaultTimeout(5000);
    const states = [];
    const deviceState = async stage => {
      const state = await page.evaluate(stage => {
        const warning = document.getElementById('device-notice'), game = document.getElementById('game');
        const w = warning.getBoundingClientRect(), g = game.getBoundingClientRect();
        return { stage, coarse: matchMedia('(pointer: coarse)').matches, anyCoarse: matchMedia('(any-pointer: coarse)').matches,
          hidden: warning.hidden, display: getComputedStyle(warning).display, text: warning.textContent,
          width: innerWidth, height: innerHeight, gameWidth: g.width, gameHeight: g.height, warningHeight: w.height,
          scene: window.pachaDebug?.().scene, active: document.activeElement?.id };
      }, stage);
      states.push(state); console.log('S4_DEVICE_STATE', JSON.stringify({ renderer, channel, ...state })); return state;
    };
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.pachaDebug?.().scene === 'map');
    await deviceState('initial map');
    assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
    assert.equal(await page.locator('#device-notice').innerText(), notice);
    const layout = await page.evaluate(() => {
      const warning = document.getElementById('device-notice'), game = document.getElementById('game');
      const w = warning.getBoundingClientRect(), g = game.getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth > innerWidth, warningBottom: w.bottom, gameTop: g.top,
        gameWidth: g.width, gameHeight: g.height, textFits: warning.scrollWidth <= warning.clientWidth };
    });
    assert.equal(layout.overflow, false); assert.equal(layout.textFits, true);
    assert.ok(layout.warningBottom <= layout.gameTop, 'advisory stays above—not over—the game');
    assert.ok(layout.gameWidth >= 320 && layout.gameHeight >= 180, 'coarse notice is not caused by missing native canvas fit');
    for (const [key, value] of Object.entries(tags)) {
      assert.equal(await page.locator(`meta[name="${key}"],meta[property="${key}"]`).getAttribute('content'), value);
    }
    await page.locator('#game').focus(); await deviceState('focused game');
    const first = await page.evaluate(() => window.pachaDebug().selectedNode);
    await page.keyboard.press('ArrowRight', { delay: 80 }); await deviceState('after keyboard ArrowRight');
    assert.notEqual(await page.evaluate(() => window.pachaDebug().selectedNode), first, 'banner never disables keyboard input');
    await page.keyboard.press('ArrowLeft', { delay: 80 }); await deviceState('after keyboard ArrowLeft');
    await page.keyboard.press('1', { delay: 80 });
    await page.waitForFunction(() => { const s = window.pachaDebug?.(); return s?.scene === 'intro' && s.focused && s.elapsed >= 100; });
    await deviceState('intro input-ready');
    await page.keyboard.press('Escape', { delay: 80 });
    await page.waitForFunction(() => window.pachaDebug?.().scene === 'route' && window.pachaDebug().clock > 200);
    assert.equal(await page.evaluate(() => window.pachaDebug().paused), false);
    const beforeCapture = await deviceState('route before screenshot');
    assert.equal(beforeCapture.coarse, true, 'coarse fixture must remain coarse after real keyboard input');
    assert.equal(beforeCapture.hidden, false, 'notice must still be visible before screenshot');
    await page.screenshot({ path: `${out}/s4-notice-470-${renderer}-${channel}-viewport.png`, fullPage: false });
    // Chromium's beyond-viewport capture changed coarse media in the diagnostic RED. Keep this viewport capture
    // non-perturbing and verify it, rather than making application visibility sticky or relaxing assertions.
    const afterCapture = await deviceState('after viewport screenshot');
    assert.equal(afterCapture.coarse, true, 'capture must preserve the coarse media fixture');
    assert.equal(afterCapture.hidden, false, 'notice must remain visible in the captured viewport');
    await page.setViewportSize({ width: 1000, height: 900 }); await deviceState('after resize1000');
    // Viewport/media/ResizeObserver notifications settle on an animation frame, not at setViewportSize return.
    await page.waitForFunction(() => !document.getElementById('device-notice').hidden);
    await deviceState('coarse desktop after resize');
    assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
    assert.equal(await page.locator('#device-notice').isVisible(), true, 'coarse pointer warns independently of width');
    assert.deepEqual(errors, []); await page.close();

    const fine = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    await fine.goto(url, { waitUntil: 'networkidle' });
    await fine.waitForFunction(() => window.pachaDebug?.().scene === 'map');
    assert.equal(await fine.locator('#device-notice').isVisible(), false);
    await fine.setViewportSize({ width: 320, height: 900 });
    await fine.waitForFunction(() => document.getElementById('device-notice')?.hidden === false);
    assert.equal(await fine.locator('#device-notice').innerText(), notice);
    assert.equal(await fine.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await fine.setViewportSize({ width: 1000, height: 179 });
    assert.equal(await fine.locator('#device-notice').isVisible(), true);
    await fine.setViewportSize({ width: 1000, height: 900 });
    await fine.waitForFunction(() => document.getElementById('device-notice')?.hidden === true);
    await fine.close();
    results.push({ renderer, channel, states, ok: true, checks: 'coarse/native-fit OR small host/viewport,470px no overflow, exact notice, real keyboard/route available, metadata' });
  }
  // Preserve missing-asset evidence without preventing independent renderer checks from completing.
  const response = await browser.newContext();
  try {
    const image = await response.request.get(`${base}/social-preview.png`);
    assert.match(image.headers()['content-type'] ?? '', /image\/png/);
    const bytes = await image.body(); assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [1200, 630]);
    results.push({ asset: 'social-preview.png', ok: true });
  } catch (error) { results.push({ asset: 'social-preview.png', ok: false, error: error.message }); }
  finally { await response.close(); }
  console.log(JSON.stringify({ status: results.every(r => r.ok) ? 'passed' : 'partial', results }, null, 2));
  process.exitCode = results.every(r => r.ok) ? 0 : 1;
} finally { await browser.close(); }
