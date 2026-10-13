import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Browser smoke for Ruta 01 and Amaru-01. Every gameplay action is real keyboard or pointer input sent
// through Playwright; `window.pachaDebug` (only with ?debug=1) is read as a snapshot and never written.
// Timing-sensitive observations use in-page requestAnimationFrame samplers, so a slow round trip under
// CPU load cannot hide a frame. Run serially against a production preview:
//   PACHA_URL=http://127.0.0.1:4177 [PACHA_RENDERER=canvas] node tests/browser-smoke.mjs
import { chromium } from 'playwright';

const baseURL = process.env.PACHA_URL ?? 'http://127.0.0.1:4173';
const renderer = process.env.PACHA_RENDERER === 'canvas' ? 'canvas' : 'webgl';
const debugQuery = `?debug=1${renderer === 'canvas' ? '&renderer=canvas' : ''}`;
const channel = process.env.PACHA_BROWSER_CHANNEL ?? 'msedge';
const launchOptions = process.env.PACHA_BROWSER_PATH ? { executablePath: process.env.PACHA_BROWSER_PATH } : { channel };
const NOKIA = [0x0f380f, 0x306230, 0x8bac0f, 0x9bbc0f];
const TEXT = {
  intro: 'LAS RUTAS SE ESTÁN APAGANDO', threshold: 'ALGO REPITE UN PATRÓN...', defeat: 'KIPU SE DESCONECTA',
  core: 'EL NÚCLEO DE KIPU DESPIERTA', amaru: 'AMARU: OTRA VEZ... ESTABA CONDENADO A REPETIRLO.', kipu: 'KIPU: ENTONCES CAMBIEMOS EL FINAL.',
  codex: 'CÓDICE: BUCLE', codexFind: 'FRAGMENTO LOOP ENCONTRADO', result: 'NODO AREQUIPA RESTAURADO', pulse: 'TRIPLE PULSO: ESQUIVA',
};
const phaseFor = hp => (hp > 66 ? 1 : hp > 33 ? 2 : 3);

const passed = [];
const errors = [];
const notes = [];
let browser;
let page;
let stage = 'browser launch';

try {
  browser = await chromium.launch({ ...launchOptions, headless: true });
  page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

  // ------------------------------------------------------------------ read-only helpers
  const wait = (predicate, argument, timeout = 15000) => page.waitForFunction(predicate, argument, { timeout, polling: 'raf' });
  const snap = () => page.evaluate(() => window.pachaDebug?.());
  const frames = count => page.evaluate(n => new Promise(resolve => { let i = 0; const step = () => (++i >= n ? resolve() : requestAnimationFrame(step)); requestAnimationFrame(step); }), count);
  const canvas = page.locator('canvas');
  const button = name => page.getByRole('button', { name, exact: true });
  const activeId = () => page.evaluate(() => document.activeElement?.id ?? '');
  // Per-frame sampler: `project` runs in the page on each snapshot and returns a compact record.
  const startSampler = (name, project) => page.evaluate(([key, source]) => {
    const fn = new Function(`return (${source})`)();
    const store = (window.__samplers ??= {});
    if (store[key]) cancelAnimationFrame(store[key].raf);
    const entry = (store[key] = { samples: [], raf: 0 });
    const loop = () => {
      const s = window.pachaDebug?.();
      if (s) entry.samples.push({ t: performance.now(), ...fn(s) });
      entry.raf = requestAnimationFrame(loop);
    };
    loop();
  }, [name, project.toString()]);
  const stopSampler = name => page.evaluate(key => {
    const entry = window.__samplers?.[key];
    if (!entry) return [];
    cancelAnimationFrame(entry.raf);
    delete window.__samplers[key];
    return entry.samples;
  }, name);

  // Held-key bookkeeping so the bots only send real keydown/keyup transitions.
  const held = new Set();
  const setKeys = async desired => {
    for (const key of [...held]) if (!desired.has(key)) { held.delete(key); await page.keyboard.up(key); }
    for (const key of desired) if (!held.has(key)) { held.add(key); await page.keyboard.down(key); }
  };
  const releaseAll = () => setKeys(new Set());
  const steer = (keys, dx, dy, dead = 3) => {
    if (dx > dead) keys.add('d'); else if (dx < -dead) keys.add('a');
    if (dy > dead) keys.add('s'); else if (dy < -dead) keys.add('w');
    return keys;
  };
  const checkFrozen = async (clockKeys, context) => {
    const before = await snap();
    await frames(20);
    const after = await snap();
    for (const key of clockKeys) assert.equal(after[key], before[key], `${context}: ${key} must stay frozen`);
    assert.equal(after.player.y, before.player.y, `${context}: Kipu must not move`);
    return before;
  };

  // ================================================================== 1. map
  stage = '1 map: Spanish copy, DOM buttons, native activation and fresh corrupted node';
  await page.goto(`${baseURL}/${debugQuery}`, { waitUntil: 'networkidle' });
  await canvas.click();
  const actualRenderer = await canvas.evaluate(c => (c.getContext('webgl2') || c.getContext('webgl') ? 'webgl' : 'canvas'));
  assert.equal(actualRenderer, renderer, 'the requested renderer must be the one actually running');
  await wait(() => window.pachaDebug?.().scene === 'map');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'es');
  assert.equal(await page.locator('#view-title').innerText(), 'Mapa de la Trama');
  assert.match(await page.locator('#view-help').innerText(), /Enter: iniciar ruta · 2: ir a Amaru/);
  assert.match(await page.locator('#view-result').innerText(), /nodo corrupto/);
  assert.match(await page.locator('#achievements').innerText(), /Ruta pendiente · Amaru pendiente/);
  const fresh = await snap();
  assert.equal(fresh.node, 'corrupted');
  assert.deepEqual(fresh.progress, { route: false, guardian: false });
  for (const name of ['Jugar ruta', 'Ir a Amaru', 'Sonido: sí', 'Reducir movimiento: no']) assert.ok(await button(name).isVisible(), `${name} must be visible on the map`);
  for (const name of ['Mapa', 'Reintentar']) assert.equal(await button(name).isVisible(), false, `${name} stays hidden on the map`);
  await canvas.screenshot({ path: 'docs/ruta01-map.png' });
  // Native button activation: Enter and Space on focused buttons, focus always returns to the game.
  await button('Jugar ruta').focus(); await page.keyboard.press('Enter');
  await wait(() => window.pachaDebug?.().scene === 'route');
  assert.equal(await activeId(), 'game');
  assert.match(await page.locator('#view-title').innerText(), /Ruta 01/);
  await button('Mapa').focus(); await page.keyboard.press('Space');
  await wait(() => window.pachaDebug?.().scene === 'map');
  await button('Ir a Amaru').focus(); await page.keyboard.press('Space');
  await wait(() => window.pachaDebug?.().scene === 'guardian');
  assert.match(await page.locator('#view-title').innerText(), /Amaru-01/);
  const runBefore = (await snap()).sceneRun;
  await button('Reintentar').focus(); await page.keyboard.press('Enter');
  await wait(previous => window.pachaDebug?.().scene === 'guardian' && window.pachaDebug().sceneRun > previous, runBefore);
  assert.equal(await activeId(), 'game');
  await button('Mapa').focus(); await page.keyboard.press('Enter');
  await wait(() => window.pachaDebug?.().scene === 'map');
  assert.equal(await activeId(), 'game');
  passed.push('1 map: lang="es", Spanish title/help/result/achievements, corrupted fresh node, six DOM buttons with native Enter/Space activation returning focus to the game');

  // ================================================================== 2. route
  stage = '2 route: arrival copy, no gravity, Esc pause and focus pause';
  await page.keyboard.press('Enter'); // canvas Enter on the map starts the route
  await wait(() => window.pachaDebug?.().scene === 'route' && window.pachaDebug().clock > 200);
  await startSampler('route', s => {
    if (s.scene !== 'route') return { scene: s.scene };
    const left = s.player.x + s.player.bodyRelativeX - s.cameraX, top = s.player.bodyTop, w = s.player.bodyWidth, h = s.player.bodyHeight;
    const walls = s.walls.filter(wall => wall.visible);
    const touch = walls.some(wall => left < wall.screenX + 8 && left + w > wall.screenX && (top < wall.gapY - 20 || top + h > wall.gapY + 20));
    let beyond = 0, near = 0;
    for (const wall of walls) {
      if (wall.screenX > 300 || left + w >= wall.screenX) continue;
      for (const shot of s.shots) {
        if (!(shot.y - 1.5 < wall.gapY - 20 || shot.y + 1.5 > wall.gapY + 20)) continue;
        if (shot.screenX - 3 > wall.screenX + 8) beyond++;
        else if (shot.screenX + 3 >= wall.screenX - 30) near++;
      }
    }
    return {
      scene: 'route', run: s.sceneRun, c: s.clock, a: s.anim, seg: s.segment, cap: s.caption, hp: s.player.hp, m: s.meter, sc: s.score, fr: s.fragments, bg: s.bugs,
      en: s.enemies, g1: s.glitchlings.filter(bug => bug.hp === 1).length, front: s.marea.front, left, right: left + w, top, bottom: s.player.bodyBottom,
      touch, beyond, near, out: s.outcome, p: s.paused, f: s.focused, shots: s.shotCount, y: s.player.y,
    };
  });
  assert.equal(await page.locator('#view-title').innerText(), 'Ruta 01 — Santuario de la Trama (Arequipa)');
  await wait(text => window.pachaDebug().caption === text, TEXT.intro);
  {
    const s = await snap();
    assert.equal(s.capacity.shots, 12); assert.equal(s.capacity.enemies, 12); assert.equal(s.capacity.fragments, 10);
    assert.equal(s.player.bodyWidth, 12); assert.equal(s.player.bodyHeight, 18);
    assert.equal(s.player.displayWidth, 32); assert.equal(s.player.displayHeight, 40);
    assert.equal(s.hud.score, '000000');
  }
  const still = await snap();
  await frames(30);
  const drifted = await snap();
  assert.equal(drifted.player.velocityY, 0, 'no gravity: idle vertical velocity stays 0');
  assert.ok(Math.abs(drifted.player.y - still.player.y) < 0.01, `no gravity: y must stay put (${still.player.y} -> ${drifted.player.y})`);
  assert.ok(drifted.clock > still.clock);
  // Esc pause freezes both route clocks and the camera; a second Esc resumes.
  await page.keyboard.press('Escape');
  await wait(() => window.pachaDebug().paused === true);
  const escPaused = await checkFrozen(['clock', 'anim', 'cameraX'], 'Esc pause');
  await page.keyboard.press('Escape');
  await wait(clock => !window.pachaDebug().paused && window.pachaDebug().clock > clock, escPaused.clock);
  // Moving focus from the game to the page freezes it; clicking the game resumes.
  await page.keyboard.press('Tab');
  await wait(() => window.pachaDebug().focused === false);
  assert.notEqual(await activeId(), 'game');
  const blurred = await checkFrozen(['clock', 'anim', 'cameraX'], 'focus leaves the game');
  await canvas.click();
  await wait(clock => window.pachaDebug().focused && window.pachaDebug().clock > clock, blurred.clock);
  passed.push('2 route: Spanish arrival caption, bounded pools (12/12/10), 32x40 art with 12x18 body, no gravity, Esc pause and focus loss freeze clock/anim/camera and resume');

  stage = '2 route: 8-direction normalized flight and play-area clamps';
  const DIRECTIONS = [[['d'], 1, 0], [['ArrowRight', 'ArrowDown'], 1, 1], [['s'], 0, 1], [['a', 's'], -1, 1], [['ArrowLeft'], -1, 0], [['a', 'w'], -1, -1], [['ArrowUp'], 0, -1], [['d', 'w'], 1, -1]];
  for (const [keys, dx, dy] of DIRECTIONS) {
    await setKeys(new Set(keys));
    await wait(([x, y]) => { const s = window.pachaDebug(); const vx = s.player.velocityX - s.scrollSpeed; return Math.sign(Math.round(vx)) === x && Math.sign(Math.round(s.player.velocityY)) === y; }, [dx, dy], 5000);
    const s = await snap();
    const vx = s.player.velocityX - s.scrollSpeed, vy = s.player.velocityY, norm = Math.hypot(dx, dy);
    assert.ok(Math.abs(Math.hypot(vx, vy) - 110) < 0.01, `${keys}: speed ${Math.hypot(vx, vy)} must be 110`);
    assert.ok(Math.abs(vx - 110 * dx / norm) < 0.01 && Math.abs(vy - 110 * dy / norm) < 0.01, `${keys}: velocity (${vx}, ${vy})`);
    await releaseAll();
    await wait(() => { const s = window.pachaDebug(); return s.player.velocityY === 0 && s.player.velocityX === s.scrollSpeed; }, undefined, 5000);
  }
  const clampCheck = async (key, predicate, check, label) => {
    await setKeys(new Set([key]));
    await wait(predicate, undefined, 8000);
    await frames(8);
    const s = await snap();
    await releaseAll();
    assert.ok(check(s), `${label} clamp: ${JSON.stringify({ top: s.player.bodyTop, bottom: s.player.bodyBottom, left: s.player.x - 6 - s.cameraX })}`);
  };
  await clampCheck('w', () => window.pachaDebug().player.bodyTop <= 18.5, s => s.player.bodyTop >= 17.5, 'top');
  await clampCheck('s', () => window.pachaDebug().player.bodyBottom >= 175.5, s => s.player.bodyBottom <= 176.5, 'bottom');
  await clampCheck('a', () => { const s = window.pachaDebug(); return s.player.x - 6 - s.cameraX <= 6.8; }, s => s.player.x - 6 - s.cameraX >= 5, 'left');
  passed.push('2 route: 8 directions (WASD and arrows) at 110 px/s with normalized diagonals plus scroll carry; top, bottom and left play-area clamps');

  // ------------------------------------------------------------------ route bot
  stage = '2 route: scripted keyboard pilot through Ruta 01';
  const route = { mareaTouched: false, rightDone: false, screenshot: false, deliberateWall: true };
  const routeKeys = s => {
    const px = s.player.x - s.cameraX, py = s.player.y, t = s.clock, keys = new Set(['j']);
    let tx = 56, ty = 97;
    const bugs = s.glitchlings.filter(bug => bug.x > s.player.x + 2).sort((a, b) => a.x - b.x);
    const knots = s.fragmentList.filter(knot => knot.x > s.player.x - 4 && knot.x - s.cameraX > s.marea.front + 14).sort((a, b) => a.x - b.x);
    if (bugs.length) ty = bugs[0].y + 1; else if (knots.length) ty = knots[0].y;
    // Firewalls: aim for the gap; the first wall (gap 60) is touched on purpose at y 130 to prove its damage.
    const wall = s.walls.filter(w => w.screenX + 8 > px - 10 && w.screenX < px + 190).sort((a, b) => a.screenX - b.screenX)[0];
    if (wall) ty = wall.gapY === 60 && route.deliberateWall ? 130 : wall.gapY - 1;
    // Marea: wait at the left edge until its contact drains one heart, then flee right.
    if (t > 46500 && t < 62000) tx = route.mareaTouched ? 210 : 30;
    if (t >= 62000) { tx = route.rightDone ? 200 : 400; ty = 97; keys.delete('j'); }
    return steer(keys, tx - px, ty - py, 3);
  };
  const flyRoute = async () => {
    let previous = await snap();
    const deadline = Date.now() + 160000;
    while (Date.now() < deadline) {
      const s = await snap();
      if (!s || s.scene !== 'route') break;
      if (s.outcome === 'defeat') return 'defeat';
      if (s.clock > 46500 && !route.mareaTouched && s.player.hp < previous.player.hp && s.marea.front >= s.player.x - 6 - s.cameraX - 1) route.mareaTouched = true;
      if (s.clock > 50500 && s.marea.front > 0 && !route.mareaTouched && s.player.hp < previous.player.hp) route.mareaTouched = true;
      if (s.clock > 55000) route.mareaTouched = true; // never stay in the Marea past its peak
      if (s.clock > 62000 && s.player.x + 6 - s.cameraX >= 313) route.rightDone = true;
      if (!route.screenshot && s.clock > 29000) {
        route.screenshot = true;
        await canvas.screenshot({ path: 'docs/ruta01-route.png' });
      }
      await setKeys(routeKeys(s));
      previous = s;
    }
    await releaseAll();
    return (await snap())?.scene ?? 'none';
  };
  let routeResult = await flyRoute();
  let routeAttempts = 1;
  while (routeResult === 'defeat' && routeAttempts < 2) {
    notes.push(`route attempt ${routeAttempts} ended in defeat at ${(await snap()).clock} ms`);
    const panel = (await snap()).panel;
    assert.match(panel, /KIPU SE DESCONECTA/);
    const run = (await snap()).sceneRun;
    await page.keyboard.press('r');
    await wait(previous => window.pachaDebug?.().scene === 'route' && window.pachaDebug().sceneRun > previous && window.pachaDebug().clock > 0, run);
    Object.assign(route, { mareaTouched: false, rightDone: false });
    routeAttempts += 1;
    routeResult = await flyRoute();
  }
  assert.equal(routeResult, 'guardian', `the route must end in the guardian arena (result ${routeResult})`);
  await wait(() => window.pachaDebug?.().scene === 'guardian' && window.pachaDebug().realClock > 0);
  const arrival = await snap();
  const routeSamples = (await stopSampler('route'));
  const lastRun = routeSamples.filter(s => s.scene === 'route').at(-1).run;
  const R = routeSamples.filter(s => s.scene === 'route' && s.run === lastRun);
  notes.push(`route: ${routeAttempts} attempt(s), ${R.length} frames sampled, final hp ${R.at(-1).hp}, score ${R.at(-1).sc}, fragments ${R.at(-1).fr}, bugs ${R.at(-1).bg}, meter ${R.at(-1).m}`);

  stage = '2 route: shots, Glitchling, fragment, Firewall, Marea, threshold and carried state (sampled frames)';
  const pairs = R.slice(1).map((s, i) => [R[i], s]);
  assert.ok(R.some(s => s.shots > 0) && R.every(s => s.shots <= 12), 'shots fire and stay within the 12-shot pool');
  for (const [a, b] of pairs) {
    assert.equal(b.sc - a.sc, 100 * (b.fr - a.fr) + 75 * (b.bg - a.bg), `score delta at ${b.c} ms`);
    if (b.m < 100) assert.equal((b.m - a.m) % 10, 0, `meter moves in steps of 10 at ${b.c} ms`);
  }
  const firstWound = pairs.find(([a, b]) => b.g1 > a.g1 && b.bg === a.bg && b.fr === a.fr && b.m < 100);
  assert.ok(firstWound, 'a Glitchling must lose one of its two HP to a shot');
  assert.equal(firstWound[1].m - firstWound[0].m, 10, 'each Glitchling hit adds +10 meter');
  const firstKill = pairs.find(([a, b]) => b.bg === a.bg + 1 && b.fr === a.fr);
  assert.ok(firstKill, 'a Glitchling must be destroyed by shots');
  assert.equal(firstKill[1].sc - firstKill[0].sc, 75);
  if (firstKill[1].m < 100) assert.equal(firstKill[1].m - firstKill[0].m, 10, 'the killing hit adds +10 meter');
  const firstFragment = pairs.find(([a, b]) => b.fr === a.fr + 1 && b.bg === a.bg);
  assert.ok(firstFragment, 'a fragment must be collected');
  assert.equal(firstFragment[1].sc - firstFragment[0].sc, 100, 'a fragment adds 100 score');
  assert.equal(firstFragment[1].m - firstFragment[0].m, Math.min(20, 100 - firstFragment[0].m), 'a fragment adds +20 meter');
  const wallHit = pairs.find(([a, b]) => b.hp < a.hp && (a.touch || b.touch) && b.seg === 'firewall');
  assert.ok(wallHit, 'touching a Firewall column outside its gap must cost a heart');
  assert.equal(R.reduce((n, s) => n + s.beyond, 0), 0, 'no shot may appear beyond a Firewall while Kipu is in front of it');
  assert.ok(R.some(s => s.near > 0), 'shots must have been fired at a Firewall column');
  const mareaFronts = R.filter(s => s.c > 48000 && s.c < 56000).map(s => s.front);
  assert.ok(mareaFronts.length > 10 && mareaFronts.every((f, i) => i === 0 || f >= mareaFronts[i - 1]) && Math.max(...mareaFronts) > 100, 'the Marea front advances from the left edge');
  const mareaHit = pairs.find(([a, b]) => b.hp < a.hp && b.front > 0 && b.front >= b.left - 1);
  assert.ok(mareaHit, 'contact with the Marea front must cost a heart');
  const threshold = R.filter(s => s.seg === 'threshold');
  assert.ok(threshold.length > 30 && threshold.every(s => s.en === 0), 'at the threshold every Glitchling is gone and none spawn');
  assert.ok(threshold.some(s => s.cap === TEXT.threshold), 'threshold line must show');
  const rightMost = Math.max(...threshold.map(s => s.right));
  assert.ok(rightMost >= 312.5 && rightMost <= 315, `right clamp keeps Kipu inside the play area (right edge ${rightMost})`);
  const final = R.at(-1);
  assert.deepEqual(
    { hp: arrival.run.hp, score: arrival.run.score, fragments: arrival.run.fragments, bugs: arrival.run.bugs, meter: arrival.run.meter },
    { hp: final.hp, score: final.sc, fragments: final.fr, bugs: final.bg, meter: final.m }, 'guardian must receive the route state');
  assert.ok(arrival.run.routeSeconds >= 70 && arrival.run.routeSeconds < 70.2, `route time ${arrival.run.routeSeconds}`);
  assert.equal(arrival.heroHP, final.hp);
  assert.equal(arrival.reverse.meter, final.m);
  assert.equal(arrival.score, final.sc);
  passed.push(`2 route: shots fire (pool <= 12), Glitchling wounded then destroyed (+10 meter per hit, +75 score), fragment +100/+20, Firewall contact costs a heart and stops shots, Marea advances and drains a heart, silent threshold with "${TEXT.threshold}", right clamp, transition carries hp ${final.hp} / score ${final.sc} / fragments ${final.fr} / meter ${final.m}`);

  // ================================================================== 3-5. guardian fight
  stage = '3-5 guardian: keyboard fight with REVERSE';
  await startSampler('fight', s => {
    if (s.scene !== 'guardian') return { scene: s.scene };
    let mcd = null;
    for (const b of s.enemyBolts) if (b.capturable) { const d = Math.hypot(b.x - s.player.x, b.y - s.player.y); mcd = mcd === null ? d : Math.min(mcd, d); }
    return {
      scene: 'guardian', run: s.sceneRun, rc: s.realClock, wc: s.worldClock, ws: s.worldScale, ph: s.phase, hp: s.bossHP, sh: s.shieldHP, st: s.reverse.state,
      m: s.reverse.meter, cap: s.reverse.captured, ret: s.reverse.returnsTotal, act: s.reverse.activations, hero: s.heroHP, mcd,
      shapeOk: s.enemyBolts.every(b => b.capturable === (b.shape === 'rhombus')), shapes: [...new Set(s.enemyBolts.map(b => `${b.shape}:${b.texture}`))].join(','),
      out: s.outcome, lib: s.liberation ? `${s.liberation.stage}${s.liberation.dialogueIndex}` : '', p: s.paused, f: s.focused, nokia: s.nokia,
      msg: s.message, panel: s.panel, wave: s.wave ? (s.wave.active ? 'A' : 'T') : '', head: s.assets.head, dim: s.assets.dimAlpha, ov: s.assets.overlay,
    };
  });
  const fight = { nokiaDone: false, pauseDone: false, shiftKey: 0, attempts: 0 };
  const guardianKeys = s => {
    const p = s.player, slow = s.reverse.state === 'SLOW', keys = new Set(['j']);
    // Aim where Amaru's body will be when the shot arrives (head path from amaruRules, world clock).
    const travel = Math.max(0, 240 - p.x - 12) / 230 * 1000 * s.worldScale;
    let tx = 80, ty = 94 + 34 * Math.sin(2 * Math.PI * (s.worldClock + travel) / 7000) + 10 + 1;
    if (s.wave) ty = s.wave.gapY - 1;
    const capturable = s.enemyBolts.filter(b => b.capturable);
    if (slow && s.reverse.captured < 6 && capturable.length) {
      const nearest = capturable.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      tx = Math.min(224, Math.max(12, nearest.x)); ty = nearest.y;
    }
    const dangers = s.enemyBolts.filter(b => !(slow && b.capturable && s.reverse.captured < 6));
    let best = null;
    for (const mx of [-1, 0, 1]) for (const my of [-1, 0, 1]) {
      const norm = Math.hypot(mx, my) || 1, vx = 110 * mx / norm, vy = 110 * my / norm;
      let cost = 0, x = p.x, y = p.y;
      for (let step = 1; step <= 14; step++) {
        const t = step * 0.05;
        x = Math.min(224, Math.max(12, p.x + vx * t)); y = Math.min(154, Math.max(26, p.y + vy * t));
        for (const b of dangers) {
          const bx = b.x + b.vx * t, by = b.y + b.vy * t;
          if (Math.abs(bx - x) < 11 && Math.abs(by - (y + 1)) < 14) cost += (15 - step) * 40;
        }
        if (s.wave?.active) {
          const wx = s.wave.x - 80 * t * s.worldScale;
          if (x + 8 > wx && x - 8 < wx + 6 && (y - 10 < s.wave.gapY - 20 || y + 12 > s.wave.gapY + 20)) cost += (15 - step) * 60;
        }
      }
      cost += Math.hypot(tx - x, ty - y);
      if (!best || cost < best.cost) best = { cost, mx, my };
    }
    if (best.mx > 0) keys.add('d'); else if (best.mx < 0) keys.add('a');
    if (best.my > 0) keys.add('s'); else if (best.my < 0) keys.add('w');
    const close = capturable.filter(b => Math.hypot(b.x - p.x, b.y - p.y) < 55).length;
    return { keys, shift: s.reverse.state === 'READY' && s.phase >= 2 && (close >= 2 || capturable.some(b => Math.hypot(b.x - p.x, b.y - p.y) < 30)) };
  };
  // Freeze the very first SLOW frame through the real blur handler, so the screenshot shows REVERSE.
  const armNokia = () => page.evaluate(() => {
    window.__nokia = null;
    const loop = () => {
      const s = window.pachaDebug?.();
      if (s?.scene === 'guardian' && s.reverse.state === 'SLOW' && s.nokia && s.outcome === 'playing') {
        window.dispatchEvent(new Event('blur'));
        window.__nokia = { realClock: s.realClock, until: s.reverse.until };
        return;
      }
      window.__nokiaRaf = requestAnimationFrame(loop);
    };
    loop();
  });
  const nokiaCheck = async () => {
    await releaseAll();
    await wait(() => window.pachaDebug().focused === false);
    await frames(3);
    const frozen = await snap();
    assert.equal(frozen.reverse.state, 'SLOW'); assert.equal(frozen.nokia, true);
    await canvas.screenshot({ path: 'docs/ruta01-nokia.png' });
    const colors = JSON.parse(execFileSync('python', ['-c',
      "import json,sys;from PIL import Image;im=Image.open('docs/ruta01-nokia.png').convert('RGB');print(json.dumps(sorted({(r<<16)|(g<<8)|b for r,g,b in im.getdata()})))",
    ], { encoding: 'utf8' }));
    assert.ok(colors.length > 0 && colors.every(c => NOKIA.includes(c)), `unexpected REVERSE colors: ${colors.slice(0, 12).map(c => c.toString(16)).join(',')} (${colors.length} colors)`);
    const after = await snap();
    assert.equal(after.realClock, frozen.realClock, 'blur freezes the real clock'); assert.equal(after.worldClock, frozen.worldClock, 'blur freezes the world clock');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await wait(clock => window.pachaDebug().focused && window.pachaDebug().realClock > clock, frozen.realClock);
    fight.nokiaDone = true;
    notes.push(`nokia frame: ${colors.length} colors, all in the four-green palette`);
  };
  const pauseChecks = async () => {
    await releaseAll();
    await page.keyboard.press('Escape');
    await wait(() => window.pachaDebug().paused === true);
    const paused = await checkFrozen(['realClock', 'worldClock', 'bossHP', 'heroHP'], 'guardian Esc pause');
    await page.keyboard.press('Escape');
    await wait(clock => !window.pachaDebug().paused && window.pachaDebug().realClock > clock && window.pachaDebug().worldClock > 0, paused.realClock);
    await page.keyboard.press('Tab');
    await wait(() => window.pachaDebug().focused === false);
    const blurred = await checkFrozen(['realClock', 'worldClock', 'bossHP', 'heroHP'], 'guardian focus loss');
    await canvas.click();
    await wait(clock => window.pachaDebug().focused && window.pachaDebug().realClock > clock, blurred.realClock);
    fight.pauseDone = true;
  };
  const fightOnce = async () => {
    fight.attempts += 1;
    if (!fight.nokiaDone) await armNokia();
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      const s = await page.evaluate(() => { const s = window.pachaDebug?.(); return s && { ...s, nokiaFrozen: window.__nokia ?? null }; });
      if (!s || s.scene !== 'guardian' || s.outcome !== 'playing') break;
      if (!fight.nokiaDone && s.nokiaFrozen) { await nokiaCheck(); continue; }
      if (!fight.pauseDone && s.realClock > 2500) { await pauseChecks(); continue; }
      const { keys, shift } = guardianKeys(s);
      await setKeys(keys);
      if (shift) await page.keyboard.press(fight.shiftKey++ % 2 ? 'k' : 'Shift');
    }
    await releaseAll();
    return (await snap()).outcome;
  };
  let outcome = await fightOnce();
  while (outcome === 'defeat' && fight.attempts < 4) {
    const lost = await snap();
    notes.push(`fight attempt ${fight.attempts} lost at boss HP ${lost.bossHP} (phase ${lost.phase})`);
    if (fight.attempts === 2) {
      // Two losses with the carried run: continue from a fresh direct entry (4 HP, empty meter).
      await button('Mapa').click();
      await wait(() => window.pachaDebug?.().scene === 'map');
      await button('Ir a Amaru').click();
      notes.push('fight: switched to direct entry after two carried-run losses');
    } else await page.keyboard.press('r');
    await wait(previous => window.pachaDebug?.().scene === 'guardian' && window.pachaDebug().sceneRun > previous && window.pachaDebug().outcome === 'playing', lost.sceneRun);
    outcome = await fightOnce();
  }
  assert.equal(outcome, 'victory', `the keyboard pilot must free Amaru (attempts ${fight.attempts})`);
  assert.ok(fight.nokiaDone, 'REVERSE must have been activated for the four-green frame');
  passed.push('4 exact four-green Nokia frame: the first SLOW frame frozen through the real blur handler, canvas pixels verified by PIL; blur freezes real and world clocks');

  stage = '5 liberation: recede, restore, dialogue, codex, result and map';
  await wait(() => window.pachaDebug().liberation?.stage === 'dialogue', undefined, 10000);
  await frames(30);
  await canvas.screenshot({ path: 'docs/ruta01-liberation.png' });
  await page.keyboard.press('Enter');
  await wait(() => window.pachaDebug().liberation.dialogueIndex === 1);
  await frames(30);
  await page.keyboard.press('Enter');
  await wait(() => window.pachaDebug().liberation.stage === 'codex');
  await frames(30);
  await page.keyboard.press('Enter');
  await wait(() => window.pachaDebug().liberation.stage === 'result');
  const won = await snap();
  await page.keyboard.press('Enter');
  await wait(() => window.pachaDebug?.().scene === 'map');
  const F = (await stopSampler('fight')).filter(s => s.scene === 'guardian');
  const runs = [...new Set(F.map(s => s.run))];
  notes.push(`fight: ${fight.attempts} attempt(s), victory at real ${Math.round(won.realClock)} ms, returns ${won.reverse.returnsTotal}, activations ${won.reverse.activations}`);

  stage = '3 REVERSE invariants (sampled frames)';
  const G = F.filter(s => s.out === 'playing');
  const gPairs = G.slice(1).map((s, i) => [G[i], s]).filter(([a, b]) => a.run === b.run);
  assert.ok(G.every(s => (s.st !== 'READY' || s.m === 100) && (s.st !== 'CHARGING' || s.m < 100)), 'READY exactly when the meter is full');
  assert.ok(G.every(s => s.ws === (s.st === 'SLOW' ? 0.2 : 1)), 'world scale is 0.2 only while SLOW');
  const slowRuns = [];
  for (let i = 1; i < G.length; i++) {
    if (G[i].run !== G[i - 1].run) continue;
    if (G[i].st === 'SLOW' && G[i - 1].st !== 'SLOW') slowRuns.push({ start: G[i] });
    if (G[i].st !== 'SLOW' && G[i - 1].st === 'SLOW' && slowRuns.at(-1) && !slowRuns.at(-1).end) Object.assign(slowRuns.at(-1), { end: G[i], last: G[i - 1] });
  }
  const closed = slowRuns.filter(r => r.end);
  assert.ok(closed.length >= 2, `REVERSE must be used at least twice (${closed.length})`);
  for (const r of closed) {
    const real = r.end.rc - r.start.rc, world = r.end.wc - r.start.wc;
    assert.ok(real >= 800 && real <= 900, `SLOW lasts 800 ms of real clock (observed ${real})`);
    assert.ok(Math.abs(world - 0.2 * real) < 0.5, `world advances at 0.2 during SLOW (${world} vs ${real})`);
  }
  const wall = closed.filter(r => !F.some(s => s.run === r.start.run && s.rc >= r.start.rc && s.rc <= r.end.rc && !s.f)).map(r => Math.round(r.end.t - r.start.t));
  notes.push(`SLOW wall-clock durations (unfrozen): ${wall.join(', ')} ms`);
  assert.ok(wall.length > 0 && wall.every(ms => ms >= 750 && ms <= 1600), `unfrozen SLOW must take about 800 ms of wall time (${wall})`);
  const captures = gPairs.filter(([a, b]) => b.cap > a.cap && b.st === 'SLOW');
  assert.ok(captures.length >= 2, 'bolts must be captured');
  assert.ok(G.every(s => s.cap <= 6), 'at most six captures per activation');
  for (const [a, b] of captures) {
    assert.ok(a.mcd !== null && a.mcd <= 28 + 14, `captured bolt was ${a.mcd} px away (radius 28 plus one frame of motion)`);
    assert.ok(b.hero === a.hero, 'a captured bolt never damages Kipu');
  }
  const shieldDrops = gPairs.filter(([a, b]) => b.sh < a.sh);
  assert.ok(shieldDrops.length >= 1, 'returned bolts must crack the shield');
  for (const [a, b] of shieldDrops) assert.ok(b.ret > a.ret, `shield fell ${a.sh}->${b.sh} without a returned bolt`);
  const returnDamage = gPairs.filter(([a, b]) => b.ret > a.ret && b.sh === a.sh && a.sh === 0);
  for (const [a, b] of returnDamage) if (b.hp > 0) assert.ok(a.hp - b.hp >= 3 * (b.ret - a.ret), 'a returned bolt deals 3 HP');
  assert.ok(returnDamage.length > 0 || shieldDrops.length > 0, 'released bolts must deal damage');
  assert.ok(G.every(s => s.shapeOk), 'capturable exactly when the bolt is a rhombus');
  const shapes = new Set(G.flatMap(s => (s.shapes ? s.shapes.split(',') : [])));
  assert.ok([...shapes].some(x => x.startsWith('rhombus:bolt-rhombus')) && [...shapes].some(x => x.startsWith('orb:bolt-orb')), `both silhouettes seen: ${[...shapes]}`);
  assert.ok(G.some(s => s.wave === 'A'), 'the non-capturable wave must run');
  assert.ok(F.some(s => s.p) && F.some(s => !s.f), 'Esc and focus pauses were exercised');
  passed.push(`3 REVERSE: READY only at 100, ${closed.length} SLOW windows of ${closed.map(r => Math.round(r.end.rc - r.start.rc)).join('/')} ms real at worldScale 0.2, ${captures.length} captures all within reach and never harmful, <= 6 per activation, shield drops only with returned bolts, rhombus/orb silhouettes, wave seen, Esc and focus pause froze real and world clocks`);

  stage = '5 phases, victory and liberation (sampled frames)';
  assert.ok(G.every(s => s.ph === phaseFor(s.hp)), 'phase always follows Amaru HP thresholds (66/33)');
  assert.deepEqual([...new Set(G.filter(s => s.run === runs.at(-1)).map(s => s.ph))], [1, 2, 3], 'the winning attempt crosses phases 1, 2 and 3 in order');
  const phase2 = G.find(s => s.ph === 2);
  assert.ok(phase2.m === 100 || phase2.st === 'SLOW', 'entering phase 2 awakens the core and fills the meter');
  assert.ok(F.some(s => s.msg.includes(TEXT.core)), 'core-awakening message shows');
  const lib = F.filter(s => s.run === runs.at(-1) && s.lib).map(s => s.lib);
  const order = lib.filter((x, i) => x !== lib[i - 1]);
  assert.deepEqual(order, ['recede0', 'restore0', 'dialogue0', 'dialogue1', 'codex1', 'result1'], 'liberation stages in order');
  const at = key => F.find(s => s.run === runs.at(-1) && s.lib === key);
  const W = F.filter(s => s.run === runs.at(-1));
  assert.ok(G.every(s => /^amaru-head-(corrupt|flash)/.test(s.head)), 'Amaru fights with the corrupted (or hit-flash) head');
  const recede = W.filter(s => s.lib === 'recede0').map(s => s.ov), restore = W.filter(s => s.lib === 'restore0').map(s => s.dim);
  assert.ok(recede[0] > 0.9 && recede.at(-1) < 0.2 && recede.every((v, i) => i === 0 || v <= recede[i - 1]), `the corruption overlay recedes (${recede[0]} -> ${recede.at(-1)})`);
  assert.ok(restore[0] > 0.9 && restore.at(-1) < 0.2 && restore.every((v, i) => i === 0 || v <= restore[i - 1]), `the color wave restores the arena (${restore[0]} -> ${restore.at(-1)})`);
  assert.equal(at('dialogue0').head, 'amaru-head'); assert.equal(at('dialogue0').ov, 0); assert.equal(at('dialogue0').dim, 0);
  assert.equal(at('dialogue0').panel, TEXT.amaru); assert.equal(at('dialogue1').panel, TEXT.kipu);
  assert.ok(at('codex1').panel.startsWith(TEXT.codex) && at('codex1').panel.includes(TEXT.codexFind));
  const result = won.resultText.split('\n');
  assert.equal(result[0], TEXT.result);
  const points = label => Number(result.find(line => line.startsWith(label)).trim().split(/\s+/).at(-1));
  const count = label => Number(result.find(line => line.startsWith(label)).slice(16).trim().split(/\s+/)[0]);
  assert.equal(points('TOTAL'), points('FRAGMENTOS') + points('BUGS') + points('DEVOLUCIONES') + points('BONO DE TIEMPO'), 'score breakdown adds up');
  assert.equal(count('DEVOLUCIONES'), won.reverse.returnsTotal);
  assert.equal(count('FRAGMENTOS'), won.run.fragments); assert.equal(count('BUGS'), won.run.bugs);
  assert.equal(points('FRAGMENTOS'), 100 * won.run.fragments); assert.equal(points('DEVOLUCIONES'), 200 * won.reverse.returnsTotal);
  const map = await snap();
  assert.equal(map.node, 'restored'); assert.equal(map.progress.guardian, true);
  assert.match(await page.locator('#view-result').innerText(), /nodo restaurado/);
  assert.match(await page.locator('#achievements').innerText(), /Amaru liberado/);
  passed.push(`5 phases 1-2-3 by HP thresholds, corrupted head while fighting, victory, liberation: corruption overlay recedes > color wave restores the arena > two dialogue lines > codex > result (total ${points('TOTAL')} = fragments + bugs + returns + time), Enter to map with restored node and progress.guardian true`);

  stage = '5 defeat path, READY gate and full retry reset';
  await page.keyboard.press('2');
  await wait(() => window.pachaDebug?.().scene === 'guardian' && window.pachaDebug().realClock > 100);
  const direct = await snap();
  assert.deepEqual({ hp: direct.run.hp, meter: direct.run.meter, score: direct.run.score }, { hp: 4, meter: 0, score: 0 }, 'map key 2 is a fresh direct entry');
  assert.equal(direct.reverse.state, 'CHARGING');
  for (const key of ['Shift', 'k', 'x']) await page.keyboard.press(key);
  await frames(5);
  assert.equal((await snap()).reverse.activations, 0, 'PachaShift cannot activate before the meter is full');
  assert.equal((await snap()).reverse.state, 'CHARGING');
  await wait(() => window.pachaDebug().outcome === 'defeat', undefined, 60000);
  const lost = await snap();
  assert.equal(lost.panel, TEXT.defeat);
  assert.equal(lost.heroHP, 0); assert.equal(lost.enemyBolts.length, 0); assert.equal(lost.alliedShots.length, 0);
  assert.match(await page.locator('#view-result').innerText(), /Derrota/);
  await frames(10);
  await page.keyboard.press('r');
  await wait(previous => window.pachaDebug?.().sceneRun > previous && window.pachaDebug().realClock > 0, lost.sceneRun);
  const retried = await snap();
  assert.deepEqual(
    { outcome: retried.outcome, hero: retried.heroHP, boss: retried.bossHP, phase: retried.phase, shield: retried.shieldHP, state: retried.reverse.state, meter: retried.reverse.meter, activations: retried.reverse.activations, returns: retried.reverse.returnsTotal, liberation: retried.liberation, bolts: retried.enemyBolts.length },
    { outcome: 'playing', hero: 4, boss: 100, phase: 1, shield: 0, state: 'CHARGING', meter: 0, activations: 0, returns: 0, liberation: null, bolts: 0 }, 'R resets the fight');
  assert.ok(retried.realClock < 1000);
  passed.push('5 defeat: Shift/K/X rejected while CHARGING, standing still loses all hearts, "KIPU SE DESCONECTA", bolts cleared, R restarts with full state reset');

  // ================================================================== 7. sound
  stage = '7 sound toggle';
  await button('Sonido: sí').click();
  assert.equal(await button('Sonido: no').getAttribute('aria-pressed'), 'false');
  assert.equal(await activeId(), 'game');
  const muted = await snap();
  assert.equal(muted.audio.muted, true);
  await page.keyboard.down('j'); await frames(40); await page.keyboard.up('j');
  assert.equal((await snap()).audio.played, muted.audio.played, 'muted game stays silent while firing');
  await button('Sonido: no').click();
  assert.equal(await activeId(), 'game');
  await page.keyboard.down('j');
  await wait(before => window.pachaDebug().audio.played > before, muted.audio.played);
  await page.keyboard.up('j');
  passed.push('7 sound: "Sonido" toggle mutes synthesized effects, unmutes them and returns focus to the game');

  // ================================================================== 8. responsive
  stage = '8 responsive canvas';
  for (const [width, height] of [[1000, 800], [600, 700], [470, 900]]) {
    await page.setViewportSize({ width, height });
    await frames(5);
    const box = await canvas.boundingBox();
    assert.ok(box && Math.abs(box.width / box.height - 16 / 9) < 0.02, `${width}px: canvas keeps 16:9`);
    assert.ok(box.x >= 0 && box.x + box.width <= width + 0.5, `${width}px: canvas stays inside the viewport`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: no horizontal overflow`);
  }
  await page.setViewportSize({ width: 1000, height: 800 });
  passed.push('8 responsive: 16:9 canvas inside the viewport at 1000, 600 and 470 px with no horizontal overflow');

  // ================================================================== 6. reduced motion
  stage = '6 reduced motion (OS preference and toggle)';
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${baseURL}/${debugQuery}`, { waitUntil: 'networkidle' });
  await wait(() => window.pachaDebug?.().scene === 'map');
  assert.equal(await button('Reducir movimiento: sí').getAttribute('aria-pressed'), 'true', 'the OS preference initialises the toggle');
  await canvas.click();
  await page.keyboard.press('2');
  await wait(() => window.pachaDebug?.().scene === 'guardian');
  const calmProject = s => (s.scene === 'guardian' ? { ang: s.boss.angle, kipu: s.player.angle, fx: s.pools.particlesActive, frame: s.kipuFrame, sig: s.hud.signal, stage: s.attack?.stage ?? '', rc: s.realClock } : {});
  const moveAndFire = async ms => {
    const start = (await snap()).realClock;
    await page.keyboard.down('j');
    let up = true;
    while ((await snap()).realClock < start + ms) {
      await page.keyboard.down(up ? 'w' : 's'); await frames(12); await page.keyboard.up(up ? 'w' : 's');
      up = !up;
    }
    await page.keyboard.up('j');
  };
  await startSampler('calm', calmProject);
  await moveAndFire(4000);
  const calm = await stopSampler('calm');
  assert.ok(calm.every(s => s.ang === 0 && s.kipu === 0), 'reduced motion: no boss sway and no Kipu tilt');
  assert.ok(calm.every(s => s.fx === 0), 'reduced motion: no particles');
  assert.deepEqual([...new Set(calm.map(s => s.frame))], ['idle'], 'reduced motion: Kipu stays on the neutral frame');
  assert.ok(calm.some(s => s.stage === 'anticipation') && calm.some(s => s.sig === TEXT.pulse), 'telegraphs remain under reduced motion');
  await button('Reducir movimiento: sí').click();
  assert.equal(await activeId(), 'game');
  await startSampler('lively', calmProject);
  await moveAndFire(3000);
  const lively = await stopSampler('lively');
  assert.ok(lively.some(s => s.ang !== 0) && lively.some(s => s.fx > 0) && lively.some(s => s.frame !== 'idle'), 'turning the toggle off restores sway, particles and frames');
  await button('Reducir movimiento: no').click();
  await startSampler('toggled', calmProject);
  await moveAndFire(1500);
  const toggled = await stopSampler('toggled');
  assert.ok(toggled.slice(2).every(s => s.ang === 0 && s.frame === 'idle'), 'turning the toggle on calms the fight again');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  passed.push('6 reduced motion: OS preference sets the toggle; no particles, no sway or tilt, neutral Kipu frame while telegraphs and signals remain; the toggle switches it off and on and returns focus');

  // ================================================================== 9. debug opt-in and errors
  stage = '9 debug opt-in only and zero browser errors';
  await page.goto(`${baseURL}/${renderer === 'canvas' ? '?renderer=canvas' : ''}`, { waitUntil: 'networkidle' });
  await button('Ir a Amaru').click();
  await page.waitForFunction(() => document.getElementById('view-title').textContent.includes('Amaru'));
  assert.equal(await page.evaluate(() => 'pachaDebug' in window), false);
  assert.deepEqual(errors, []);
  passed.push('9 debug snapshots only with ?debug=1; zero page or console errors');
  console.log(JSON.stringify({ status: 'passed', renderer, browser: await browser.version(), checks: passed, notes }, null, 2));
} catch (error) {
  const lastState = await page?.evaluate(() => { const s = window.pachaDebug?.(); return s && { scene: s.scene, clock: s.clock ?? s.realClock, outcome: s.outcome, hp: s.player?.hp ?? s.heroHP, bossHP: s.bossHP, phase: s.phase, reverse: s.reverse }; }).catch(() => undefined);
  console.error(JSON.stringify({ status: 'failed_or_unavailable', renderer, stage, passed, notes, errors, lastState, error: String(error?.stack ?? error) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser?.close();
}
