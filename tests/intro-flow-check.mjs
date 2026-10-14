import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

// Focused S1 proof only: real input and read-only debug, no route pilot or game-state injection.
// PACHA_URL=http://127.0.0.1:4190 node tests/intro-flow-check.mjs
const base = process.env.PACHA_URL;
if (!base) throw new Error('PACHA_URL must select the owned preview explicitly');
const out = 'docs/design/checkpoint-2-captures';
mkdirSync(out, { recursive: true });
const CARDS = [
  'EN EL PERÚ DE LA TRAMA, TODO ESTÁ CONECTADO.',
  'EL DESFASE APAGA LAS RUTAS Y CORROMPE A SUS GUARDIANES.',
  'UNA CHISPA TURQUESA DESPIERTA: KIPU.',
  'REPARA LAS RUTAS. LIBERA, NO DESTRUYAS.',
];
const browser = await chromium.launch({ channel: process.env.PACHA_BROWSER_CHANNEL ?? 'msedge', headless: true });
const results = [];
try {
  for (const renderer of ['webgl', 'canvas']) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const url = `${base}/?debug=1${renderer === 'canvas' ? '&renderer=canvas' : ''}`;
    const snap = () => page.evaluate(() => window.pachaDebug?.());
    const scene = name => page.waitForFunction(n => window.pachaDebug?.().scene === n, name, { timeout: 3000 });
    const press = key => page.keyboard.press(key, { delay: 80 });
    const map = async () => { await press('m'); await scene('map'); };
    await page.goto(url, { waitUntil: 'networkidle' }); await scene('map');
    assert.equal((await snap()).introSeen, false);
    await press('2'); await scene('guardian'); await map();
    assert.equal((await snap()).introSeen, false, 'direct Amaru must not consume the intro');
    await press('1'); await scene('intro');
    assert.equal((await snap()).card, 0, 'entry key must not advance the first card');
    assert.equal((await snap()).seen, true);
    assert.ok((await snap()).displayText.length < CARDS[0].length, 'normal motion types the card');
    await page.keyboard.down('Enter'); await page.waitForFunction(() => window.pachaDebug?.().card === 1);
    await page.keyboard.down('Enter'); await page.keyboard.down('Enter'); await page.waitForTimeout(350);
    assert.equal((await snap()).card, 1, 'held/repeated Enter must advance only once');
    await page.keyboard.up('Enter');
    const frozen = await snap();
    await page.locator('#settings > summary').focus();
    await page.waitForFunction(() => window.pachaDebug?.().paused === true);
    const paused = await snap(); await page.waitForTimeout(400);
    assert.equal((await snap()).elapsed, paused.elapsed, 'focus loss must freeze the intro clock');
    assert.equal((await snap()).displayText, paused.displayText);
    await page.locator('#game').focus(); await page.waitForTimeout(80);
    assert.ok((await snap()).elapsed - paused.elapsed < 200, 'focus resume must not catch up lost time');
    assert.equal((await snap()).card, frozen.card);
    await press('Space'); assert.equal((await snap()).card, 2);
    await page.keyboard.down('Escape'); await page.waitForTimeout(100);
    assert.equal((await snap()).scene, 'intro', 'manual skip waits for key release');
    assert.equal((await snap()).done, true);
    await page.keyboard.up('Escape'); await scene('route');
    assert.equal((await snap()).paused, false, 'skip Escape must not pause the route');
    assert.equal((await snap()).player.hp, 4);
    await map(); assert.equal((await snap()).introSeen, true);
    await press('Enter'); await scene('route'); await map();
    await page.getByRole('button', { name: 'Jugar ruta', exact: true }).click(); await scene('route');
    await map();

    // Fresh page resets registry. Native page-button entry and all four auto-timed cards are exercised once.
    await page.reload({ waitUntil: 'networkidle' }); await scene('map');
    await page.getByRole('button', { name: 'Jugar ruta', exact: true }).focus(); await press('Enter'); await scene('intro');
    assert.equal((await snap()).card, 0, 'native page-button Enter must not leak into the intro');
    const start = Date.now(); let audio;
    for (let card = 0; card < 4; card++) {
      await page.waitForFunction(c => { const s = window.pachaDebug?.(); return s?.scene === 'intro' && s.card === c && s.elapsed >= 1900; }, card, { timeout: 5000 });
      const state = await snap();
      assert.equal(state.text, CARDS[card]);
      assert.equal(state.displayText.replaceAll('\n', ' '), CARDS[card]);
      if (audio !== undefined) assert.equal(state.audio.played - audio, 1, 'one blip per new card');
      audio = state.audio.played;
      await page.locator('#game canvas').screenshot({ path: `${out}/s1-card-${card + 1}-${renderer}.png` });
    }
    await scene('route'); assert.ok(Date.now() - start <= 13500, 'auto intro must finish in about 12 seconds');
    assert.equal((await snap()).paused, false);
    assert.deepEqual(errors, []);
    await page.close();

    const calm = await browser.newPage({ viewport: { width: 1000, height: 900 }, reducedMotion: 'reduce' });
    await calm.goto(url, { waitUntil: 'networkidle' });
    await calm.waitForFunction(() => window.pachaDebug?.().scene === 'map');
    await calm.keyboard.press('Enter', { delay: 80 });
    await calm.waitForFunction(() => window.pachaDebug?.().scene === 'intro');
    assert.equal(await calm.evaluate(() => window.pachaDebug().reducedMotion), true);
    assert.equal(await calm.evaluate(() => window.pachaDebug().displayText.replaceAll('\n', ' ')), CARDS[0]);
    await calm.locator('#game canvas').screenshot({ path: `${out}/s1-reduced-${renderer}.png` });
    await calm.keyboard.press('Escape', { delay: 80 });
    await calm.waitForFunction(() => window.pachaDebug?.().scene === 'route');
    await calm.close();
    results.push(`${renderer}: entry keys/page button, direct Amaru bypass, typing, held key, focus pause, skip, once flag, four auto cards/blips, reduced motion`);
  }
  console.log(JSON.stringify({ status: 'passed', checks: results }, null, 2));
} finally { await browser.close(); }
