import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

// S3 early timeline only: real input, read-only debug, no full-route pilot or state injection.
const base = process.env.PACHA_URL;
if (!base) throw new Error('PACHA_URL must select the owned preview explicitly');
const out = 'docs/design/checkpoint-2-captures'; mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PACHA_BROWSER_CHANNEL ?? 'msedge', headless: true });
const results = [];
try {
  for (const renderer of ['webgl', 'canvas']) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const snap = () => page.evaluate(() => window.pachaDebug?.());
    await page.goto(`${base}/?debug=1${renderer === 'canvas' ? '&renderer=canvas' : ''}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.pachaDebug?.().scene === 'map');
    await page.locator('#game').focus();
    await page.keyboard.press('Enter', { delay: 80 });
    // A newly exposed scene can still be finishing the entry key's dispatch. Release + an active frame first.
    await page.waitForFunction(() => { const s = window.pachaDebug?.(); return s?.scene === 'intro' && s.focused && s.elapsed >= 100; });
    await page.keyboard.press('Escape', { delay: 80 });
    await page.waitForFunction(() => window.pachaDebug?.().scene === 'route');

    // Collect ALL time-critical samples in the browser, before any slow Node-side screenshot IO.
    const samples = await page.evaluate(() => new Promise((resolve, reject) => {
      const targets = [1100, 2100, 3400, 5500], collected = []; let waitingSince = performance.now();
      const collect = () => {
        if (performance.now() - waitingSince > 5000) { reject(new Error(`sample ${targets[collected.length]} exceeded the original5000ms wait budget`)); return; }
        const s = window.pachaDebug?.();
        if (s?.scene === 'route' && s.clock >= targets[collected.length]) {
          collected.push({ clock: s.clock, caption: s.caption, enemyList: s.enemyList,
            player: { hp: s.player.hp }, transitionMs: s.transitionMs, narrative: s.narrative }); waitingSince = performance.now();
        }
        if (collected.length === targets.length) resolve(collected);
        else requestAnimationFrame(collect);
      };
      requestAnimationFrame(collect);
    }));
    const targets = [1100, 2100, 3400, 5500];
    for (let i = 0; i < samples.length; i++) {
      assert.ok(samples[i].clock >= targets[i] && samples[i].clock < targets[i] + 200,
        `sample ${targets[i]} must not drift past its strict native-frame window: ${samples[i].clock}`);
    }
    assert.equal(samples[0].caption, 'MUÉVETE: WASD O FLECHAS');
    assert.equal(samples[0].enemyList.filter(b => b.type === 'glitchling').length, 0);
    assert.equal(samples[1].caption, 'DISPARA: ESPACIO O J');
    assert.equal(samples[1].enemyList.filter(b => b.type === 'glitchling').length, 0, 'both hints precede the first shootable enemy');
    for (const [sampleIndex, count] of [[2, 1], [3, 2]]) {
      const s = samples[sampleIndex];
      assert.equal(s.enemyList.filter(b => b.type === 'glitchling').length, count);
      assert.equal(s.caption, 'DISPARA: ESPACIO O J');
      const bugs = s.enemyList.filter(b => b.type === 'glitchling').toSorted((a, b) => a.spawnedAt - b.spawnedAt);
      for (let i = 0; i < bugs.length; i++) {
        const b = bugs[i], scheduled = i === 0 ? 3000 : 5000;
        assert.ok(b.spawnedAt >= scheduled && b.spawnedAt < scheduled + 70);
        assert.equal(b.displayWidth, 12); assert.equal(b.hp, 2);
        assert.ok(b.screenX + 6 > 0 && b.screenX - 6 < 320, 'native enemy frame must actually intersect the screen');
        assert.ok(Math.abs(b.screenX - (330 - 45 * (s.clock - b.spawnedAt) / 1000)) < 5, 'actual position follows the measured screen drift');
      }
      assert.equal(s.player.hp, 4); assert.equal(s.transitionMs, 98000);
      assert.equal(s.narrative.active, null, 'S2 lore does not displace opening hints');
    }
    // This image is a PAUSED later state, not a claim to depict the3400ms sample. Preserve the exact capture clock.
    await page.keyboard.press('Escape', { delay: 80 });
    await page.waitForFunction(() => window.pachaDebug?.().paused === true);
    const captured = await snap();
    assert.ok(captured.clock >= 5500 && captured.clock < 6500, `capture clock must stay in the bounded opening: ${captured.clock}`);
    assert.equal(captured.caption, 'DISPARA: ESPACIO O J');
    const capturePath = `${out}/s3-corrected-paused-${Math.round(captured.clock)}ms-${renderer}.png`;
    await page.locator('#game canvas').screenshot({ path: capturePath });
    assert.equal((await snap()).clock, captured.clock, 'real Esc pause must stabilize slow screenshot IO');
    assert.deepEqual(errors, []);
    results.push({ renderer, samples: samples.map(s => ({ clock: s.clock, caption: s.caption,
      bugs: s.enemyList.filter(b => b.type === 'glitchling').map(b => ({ spawnedAt: b.spawnedAt, screenX: b.screenX })) })),
      capture: { path: capturePath, clock: captured.clock, paused: true } });
    await page.close();
  }
  console.log(JSON.stringify({ status: 'passed', checks: results }, null, 2));
} finally { await browser.close(); }
