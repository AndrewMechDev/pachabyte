import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

// Bounded S2 proof: early story only, real input/read-only snapshots, no route pilot or clock injection.
const base = process.env.PACHA_URL;
if (!base) throw new Error('PACHA_URL must select the owned preview explicitly');
const out = 'docs/design/checkpoint-2-captures';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PACHA_BROWSER_CHANNEL ?? 'msedge', headless: true });
const results = [];
try {
  for (const renderer of ['webgl', 'canvas']) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, reducedMotion: renderer === 'canvas' ? 'reduce' : 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const snap = () => page.evaluate(() => window.pachaDebug?.());
    const press = key => page.keyboard.press(key, { delay: 80 });
    await page.goto(`${base}/?debug=1${renderer === 'canvas' ? '&renderer=canvas' : ''}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.pachaDebug?.().scene === 'map');
    await press('Enter'); await page.waitForFunction(() => window.pachaDebug?.().scene === 'intro');
    await press('Escape'); await page.waitForFunction(() => window.pachaDebug?.().scene === 'route');
    const start = await snap();
    assert.equal(start.caption, 'LAS RUTAS SE ESTÁN APAGANDO');
    assert.equal(start.narrative.active, null, 'arrival hint must not be displaced');
    assert.equal(start.narrative.cursor, 0);
    await page.locator('#game canvas').screenshot({ path: `${out}/s2-instruction-${renderer}.png` });
    await page.waitForFunction(() => window.pachaDebug?.().narrative?.active?.segment === 'firstBug', null, { timeout: 11000 });
    const story = await snap();
    assert.equal(story.caption, 'LOS ERRORES DE LA TRAMA TE BUSCAN.');
    assert.equal(story.narrative.instruction, '');
    assert.equal(story.narrative.active.start, 8000); assert.equal(story.narrative.active.end, 10800);
    assert.equal(story.narrative.cursor, 1);
    assert.ok(story.narrative.stripTop > story.narrative.hudBottom, 'shared caption strip is below the HUD');
    assert.ok(story.narrative.stripBottom < 40, 'story occupies the existing small hint strip only');
    await page.locator('#game canvas').screenshot({ path: `${out}/s2-story-${renderer}.png` });
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(180); await page.keyboard.up('ArrowRight');
    const moving = await snap();
    assert.ok(moving.clock > story.clock + 100, 'narrative never freezes the gameplay clock');
    assert.ok(moving.player.x > story.player.x, 'real flight input continues during narrative');
    assert.equal(moving.caption, story.caption);
    await press('Escape'); await page.waitForFunction(() => window.pachaDebug?.().paused === true);
    const paused = await snap(); await page.waitForTimeout(250);
    assert.equal((await snap()).clock, paused.clock); assert.equal((await snap()).caption, paused.caption);
    await press('Escape');
    await page.locator('#settings > summary').focus(); await page.waitForFunction(() => window.pachaDebug?.().focused === false);
    const unfocused = await snap(); await page.waitForTimeout(250);
    assert.equal((await snap()).clock, unfocused.clock); assert.equal((await snap()).caption, unfocused.caption);
    await page.locator('#game').focus();
    await page.waitForFunction(() => window.pachaDebug?.().clock >= 10800, null, { timeout: 4000 });
    assert.equal((await snap()).narrative.active, null); assert.equal((await snap()).caption, '');
    const run = (await snap()).sceneRun;
    await press('r'); await page.waitForFunction(r => window.pachaDebug?.().sceneRun > r, run);
    const reset = await snap();
    assert.equal(reset.narrative.cursor, 0); assert.equal(reset.narrative.active, null);
    assert.equal(reset.caption, 'LAS RUTAS SE ESTÁN APAGANDO');
    assert.deepEqual(errors, []);
    results.push(`${renderer}: arrival priority, firstBug story, HUD separation, movement/clock continuity, pause/focus freeze, expiration and restart reset`);
    await page.close();
  }
  console.log(JSON.stringify({ status: 'passed', checks: results }, null, 2));
} finally { await browser.close(); }
