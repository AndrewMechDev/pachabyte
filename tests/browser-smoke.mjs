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
  flyToRhombi: 'VUELA HACIA LOS ROMBOS', shieldBroken: '¡ESCUDO ROTO! ¡DISPARA!',
  checkpointHelp: phase => `R: REINTENTAR DESDE FASE ${phase}\nENTER: DESDE EL INICIO  M: MAPA`,
};
// Route bug values (2026-10-13); mirror src/game/bugRules.ts and comboRules.ts.
// 250 is the Bucle node (A2): breaking it by shots debugs the loop like a bug.
const BUG_SCORES = new Set([75, 150, 100, 40, 250]);
const comboMultiplier = hits => 1 + [5, 12, 20].filter(t => hits >= t).length;
// REVERSE tuning from the first human playtest (2026-10-13); mirrors src/game/reverseRules.ts.
const SLOW_MS = 1200, CAPTURE_RADIUS = 40;
const phaseFor = hp => (hp > 66 ? 1 : hp > 33 ? 2 : 3);
// Rare pickups (B3, 2026-10-13); mirror src/game/pickupRules.ts.
const RAFAGA_MS = 6000, RAFAGA_COOLDOWN = 120, SHOT_COOLDOWN = 180, SHOT_POOL = 36, MAX_HP = 4;
// Guardian Ráfaga drops (2026-10-13): middle of phase 1 (HP 83) and every phase 2 shield break; mirror pickupRules.ts.
const RAFAGA_DROP_HP = 83;
// Route background (2026-10-13): only the arena backdrop and the ambient layers; mirror RouteScene.ts and routeAmbient.ts.
const BACKGROUND_LAYERS = new Set(['backdrop', 'ambient-volcano', 'ambient-clouds']);
// A2 route (2026-10-13): 98 s with Packet Loss, the eruption, Memory Leak and the Bucle; mirror routeRules.ts and the
// hazard modules. Packet Loss lanes are the four inset blocks of packetLossRules.blockRects.
const ROUTE_MS = 98000, MAREA = { start: 72000, peak: 78000, end: 82000 }, LOOP_START = 82000, THRESHOLD_MS = 90000;
const PL = { start: 37600, period: 2400, solid: 800, speed: 64, width: 10, lanes: [[19, 38], [59, 37], [98, 38], [138, 37]] };
const plSolid = (t, i) => ((((t - PL.start + (i % 2 ? PL.period / 2 : 0)) % PL.period) + PL.period) % PL.period) < PL.solid;
const EMBER_MARKER_MS = 700, LEAK_DRAIN = 25, LOOP_SCORE = 250, LOOP_BOB = 14, LOOP_ITERATION_MS = 2600;
const TEXT_A2 = { packetLoss: 'PACKET LOSS: CRUZA CUANDO SE PIERDAN', eruption: '¡EL MISTI DESPIERTA!', memoryLeak: 'MEMORY LEAK: DRENA TU ENERGÍA', loop: 'BUCLE: ROMPE EL NODO', loopBroken: 'BUCLE ROTO' };
// Multiple of 10 up to float noise (the Memory Leak drain makes the meter fractional).
const step10 = d => { const r = ((d % 10) + 10) % 10; return r < 1e-6 || r > 10 - 1e-6; };

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
    const smalls = s.enemyList.filter(e => e.type === 'shadow');
    return {
      scene: 'route', run: s.sceneRun, c: s.clock, rc: s.realClock, cx: s.cameraX, a: s.anim, seg: s.segment, cap: s.caption, hp: s.player.hp, m: s.meter, sc: s.score, fr: s.fragments, bg: s.bugs,
      en: s.enemies, g1: s.glitchlings.filter(bug => bug.hp === 1).length, front: s.marea.front, left, right: left + w, top, bottom: s.player.bodyBottom,
      touch, beyond, near, out: s.outcome, p: s.paused, f: s.focused, shots: s.shotCount, y: s.player.y,
      bp: s.bugPoints, cb: s.comboBonus, ch: s.combo.hits, cm: s.combo.multiplier, hc: s.hud.combo, hs: s.hitStop.active, hsc: s.hitStop.count, hst: s.hitStop.totalMs,
      ct: s.enemyList.filter(e => e.type === 'corruptor').length, chg: s.enemyList.some(e => e.type === 'corruptor' && e.charging), oc: s.orbs.length,
      lg: s.enemyList.filter(e => e.type === 'sombra').length, sm: smalls.length, smhp: Math.max(0, ...smalls.map(e => e.hp)),
      dodge: s.enemyList.some(e => e.type === 'sombra' && e.dodge !== 'none'), dr: s.fragmentsDropped, dk: s.fragmentList.filter(k => k.dropped).length, fl: s.floaters.active,
      pw: s.power.rafaga.active, prm: s.power.rafaga.remainingMs, shd: s.power.shield, inv: s.player.invulnerableUntil, pk: s.pickups.map(p => p.type).join(','),
      pcr: s.pickupsCollected.rafaga, pce: s.pickupsCollected.escudo, pcc: s.pickupsCollected.corazon, pb: s.pickupBonus,
      vc: s.fire.count, vs: s.fire.lastSize, va: s.fire.lastAt, hr: s.hud.rafaga, hsh: s.hud.shield,
      bd: s.background.ambient.band, em: s.background.ambient.ember, pf: s.background.ambient.puffs, er: s.background.ambient.eruption, dim: s.background.ambient.dim,
      act: s.hazards.active.join(','), pl: s.hazards.packetLoss.map(c => `${c.index}:${c.states}`).join('|'),
      plTouch: s.hazards.packetLoss.some(c => left < c.screenX + 10 && left + w > c.screenX && [[19, 38], [59, 37], [98, 38], [138, 37]].some(([y, hh], i) => c.states[i] === 'S' && top < y + hh && top + h > y)),
      emb: s.hazards.embers.map(e => `${e.at}:${e.stage}:${e.x}:${e.y}`).join('|'), ei: s.hazards.emberImpacts,
      hp_: s.hazards.hurts.packet.damage + s.hazards.hurts.packet.absorbed, he_: s.hazards.hurts.ember.damage + s.hazards.hurts.ember.absorbed,
      lk: s.hazards.leak.inside, ld: s.hazards.leak.drained, lz: s.hazards.leak.zones.length, hl: s.hud.leak,
      la: s.hazards.loop.active, lr: s.hazards.loop.resets, lh: s.hazards.loop.hp, lb: s.hazards.loop.brokenBy ?? '', lf: s.hazards.loop.formation.length,
      tex: [...new Set([...s.enemyList.filter(e => e.type !== 'glitchling').map(e => e.texture), ...s.pickups.map(p => p.texture)])].join(','),
    };
  });
  assert.equal(await page.locator('#view-title').innerText(), 'Ruta 01 — Santuario de la Trama (Arequipa)');
  await wait(text => window.pachaDebug().caption === text, TEXT.intro);
  {
    const s = await snap();
    assert.equal(s.capacity.shots, SHOT_POOL); assert.equal(s.capacity.enemies, 12); assert.equal(s.capacity.fragments, 10); assert.equal(s.capacity.pickups, 4);
    assert.deepEqual([s.capacity.corruptors, s.capacity.shadows, s.capacity.orbs, s.capacity.floaters], [2, 3, 6, 8], 'bounded pools for the new bugs, orbs and floating numbers');
    assert.equal(s.player.bodyWidth, 12); assert.equal(s.player.bodyHeight, 18);
    assert.equal(s.player.displayWidth, 32); assert.equal(s.player.displayHeight, 40);
    assert.equal(s.hud.score, '000000');
    // Route background: the arena art (Misti) at high opacity plus the ambient layers; no procedural scenery.
    const names = s.background.layers.map(l => l.name);
    assert.ok(names.length > 0 && names.every(n => BACKGROUND_LAYERS.has(n)), `only backdrop and ambient layers behind the play area (${names})`);
    assert.ok(names.filter(n => n === 'backdrop').length === 1 && s.background.backdropAlpha >= 0.8, 'one whole arena backdrop, clearly visible');
    assert.ok(s.background.ambient.summits.length === 1 && s.background.ambient.cloudLayers === 3, 'the Misti plume sits on its summit; three cloud layers');
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
  passed.push('2 route: Spanish arrival caption, bounded pools (12/12/10, Corruptors 2, shadows 3, orbs 6, floaters 8), 32x40 art with 12x18 body, no gravity, Esc pause and focus loss freeze clock/anim/camera and resume');

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
  const route = {
    mareaTouched: false, rightDone: false, screenshot: false, bugShot: false, deliberateWall: true, rafagaPause: null, pickupShot: false,
    // A2: take one solid Packet Loss block and one ember on purpose, drain the meter in the first Memory Leak zone, and
    // (WebGL) shoot the Bucle node after its first repeat or (Canvas) let it break by itself after two repeats.
    deliberatePacket: true, deliberateEmber: null, leakDone: false, shots: { packetloss: false, eruption: false, memoryleak: false, loop: false },
  };
  const breakLoopByShot = renderer === 'webgl';
  // Forecast 0.6 s of the nine flight directions against round orbs and Corruptor bodies (screen space).
  const avoid = (s, px, py, tx, ty) => {
    const rate = s.worldRate ?? 1;
    const threats = [
      ...s.orbs.map(o => ({ x: o.screenX, y: o.y, vx: o.vx - s.scrollSpeed * rate, vy: o.vy, rx: 11, ry: 14 })),
      ...s.enemyList.filter(e => e.type === 'corruptor').map(e => ({ x: e.screenX, y: e.y, vx: 0, vy: 0, rx: 20, ry: 20 })),
      // A2: the longer route leaves less room for stray contact, so the pilot also steers around close Glitchlings.
      ...s.enemyList.filter(e => e.type === 'glitchling' && e.screenX > px - 10 && e.screenX < px + 110).map(e => ({ x: e.screenX, y: e.y, vx: -45, vy: 0, rx: 11, ry: 14 })),
    ];
    // Ember landing points: dangerous around their impact time (marker 700 ms ahead); the deliberate one is ignored.
    const embers = s.hazards.embers.filter(e => e.at !== route.deliberateEmber && (e.stage === 'marker' || e.stage === 'impact')).map(e => ({ x: e.x, y: e.y, dt: (e.at - s.clock) / 1000 }));
    if (!threats.length && !embers.length) return null;
    let best = null;
    for (const mx of [-1, 0, 1]) for (const my of [-1, 0, 1]) {
      const norm = Math.hypot(mx, my) || 1, vx = 110 * mx / norm, vy = 110 * my / norm;
      let cost = 0, reach = Infinity;
      for (let step = 1; step <= 12; step++) {
        const t = step * 0.05, x = Math.min(300, Math.max(12, px + vx * t)), y = Math.min(168, Math.max(28, py + vy * t));
        for (const b of threats) if (Math.abs(b.x + b.vx * t - x) < b.rx && Math.abs(b.y + b.vy * t - (y + 1)) < b.ry) cost += (13 - step) * 40;
        for (const e of embers) if (t > e.dt - 0.25 && t < e.dt + 0.2 && Math.abs(e.x - x) < 21 && Math.abs(e.y - (y + 1)) < 24) cost += (13 - step) * 50;
        reach = Math.min(reach, Math.hypot(tx - x, ty - y));
      }
      cost += Math.min(reach, Math.hypot(tx - px, ty - py));
      if (!best || cost < best.cost) best = { cost, mx, my };
    }
    return best.cost >= 40 || threats.some(b => Math.abs(b.x - px) < 70) || embers.some(e => e.dt < 0.9) ? best : null;
  };
  const routeKeys = s => {
    const px = s.player.x - s.cameraX, py = s.player.y, t = s.clock, keys = new Set(['j']);
    let tx = 56, ty = 97;
    // Let the first Corruptor fire once (its charge and fire frames and an orb must be observed) before engaging it.
    if (s.orbs.length) route.orbSeen = true;
    const spare = s.enemyList.filter(e => e.type === 'corruptor' && !route.orbSeen);
    const bugs = s.enemyList.filter(bug => bug.x > s.player.x + 2 && !spare.includes(bug)).sort((a, b) => a.x - b.x);
    const knots = s.fragmentList.filter(knot => knot.x > s.player.x - 4 && knot.x - s.cameraX > s.marea.front + 14).sort((a, b) => a.x - b.x);
    if (bugs.length) ty = bugs[0].y + 1; else if (knots.length) ty = knots[0].y;
    // Rare pickups: fly out to meet the nearest one ahead (it rides the scroll toward Kipu).
    const item = s.pickups.filter(p => p.screenX > px - 4 && p.screenX < 312 && p.screenX > s.marea.front + 14).sort((a, b) => a.screenX - b.screenX)[0];
    if (item) { ty = item.y; tx = Math.max(56, Math.min(item.screenX - 4, s.hazards.packetLoss.length ? 56 : 170)); }
    // Firewalls: aim for the gap; the first wall (gap 60) is touched on purpose at y 130 to prove its damage.
    const wall = s.walls.filter(w => w.screenX + 8 > px - 10 && w.screenX < px + 190).sort((a, b) => a.screenX - b.screenX)[0];
    if (wall) { ty = wall.gapY === 60 && route.deliberateWall ? 130 : wall.gapY - 1; tx = 56; }
    // Packet Loss: pick a lane that stays open while the nearest column passes (one deliberate solid hit first).
    const column = s.hazards.packetLoss.filter(c => c.screenX + PL.width > px - 8 && c.screenX < px + 200).sort((a, b) => a.screenX - b.screenX)[0];
    if (column) {
      const arrive = Math.max(0, (column.screenX - (px + 6)) / PL.speed * 1000), leave = Math.max(0, (column.screenX + PL.width - (px - 6)) / PL.speed * 1000);
      // Fraction of the crossing window (with a margin) in which a lane stays open; the most open lane wins, then the nearest.
      const openness = i => { let open = 0, n = 0; for (let dt = arrive - 160; dt <= leave + 160; dt += 20, n++) if (!plSolid(t + dt, i)) open++; return open / n; };
      const centre = i => PL.lanes[i][0] + PL.lanes[i][1] / 2 - 1;
      const lanes = [0, 1, 2, 3].sort((a, b) => openness(b) - openness(a) || Math.abs(centre(a) - py) - Math.abs(centre(b) - py));
      const lane = route.deliberatePacket && s.player.invulnerableUntil < s.realClock && s.player.hp >= 2 ? lanes.find(i => plSolid(t + (arrive + leave) / 2, i)) : lanes[0];
      if (lane !== undefined) { ty = centre(lane); tx = 56; }
    }
    // Erupción: stand still under the first aimed ember once, to prove the impact hurts (the Escudo may take it).
    const deliberate = route.deliberateEmber === null ? s.hazards.embers.find(e => e.aimed && e.stage === 'marker' && e.at - s.clock > 500 && s.player.invulnerableUntil < s.realClock + e.at - s.clock) : s.hazards.embers.find(e => e.at === route.deliberateEmber);
    if (deliberate && route.deliberateEmber === null && !route.emberDone) route.deliberateEmber = deliberate.at;
    if (deliberate && deliberate.at === route.deliberateEmber && deliberate.stage !== 'done') return keys;
    // Memory Leak: fly into the first zone until it drains some energy, then carry on.
    const zone = !route.leakDone && s.hazards.leak.zones.find(z => z.screenX + z.width > px);
    if (zone) { tx = Math.max(56, Math.min(230, zone.screenX + 30)); ty = zone.y + zone.height / 2; }
    // Bucle: let it repeat; then (WebGL) shoot the node, or (Canvas) hold fire near the node's lane until it gives up.
    const loop = s.hazards.loop;
    if (loop.active) {
      if (breakLoopByShot && loop.resets >= 1) {
        // Lead the bobbing node by the shot's travel time (node path mirrors loopRules.nodePosition).
        tx = 120;
        const travel = Math.max(0, loop.node.x - (px + 12)) / 230 * 1000;
        ty = 97 + LOOP_BOB * Math.sin(2 * Math.PI * (t + travel - LOOP_START) / LOOP_ITERATION_MS) + 1;
      }
      else { tx = 40; if (Math.abs(py - 1 - loop.node.y) <= 20) keys.delete('j'); }
    }
    // Marea: wait at the left edge until its contact drains one heart, then flee right.
    if (t > MAREA.start - 1500 && t < MAREA.end) tx = route.mareaTouched ? 210 : 30;
    if (t >= THRESHOLD_MS) { tx = route.rightDone ? 200 : 400; ty = 97; keys.delete('j'); }
    if (spare.some(e => Math.abs(e.y - (py - 1)) < 16)) keys.delete('j');
    const dodge = avoid(s, px, py, Math.min(tx, 300), ty);
    if (dodge) {
      if (dodge.mx > 0) keys.add('d'); else if (dodge.mx < 0) keys.add('a');
      if (dodge.my > 0) keys.add('s'); else if (dodge.my < 0) keys.add('w');
      return keys;
    }
    return steer(keys, tx - px, ty - py, 3);
  };
  const flyRoute = async () => {
    let previous = await snap();
    const deadline = Date.now() + 220000;
    while (Date.now() < deadline) {
      const s = await snap();
      if (!s || s.scene !== 'route') break;
      if (s.outcome === 'defeat') return 'defeat';
      if (s.clock > MAREA.start && !route.mareaTouched && s.player.hp < previous.player.hp && s.marea.front >= s.player.x - 6 - s.cameraX - 1) route.mareaTouched = true;
      if (s.clock > MAREA.start + 2500 && s.marea.front > 0 && !route.mareaTouched && s.player.hp < previous.player.hp) route.mareaTouched = true;
      if (s.clock > MAREA.peak + 1000) route.mareaTouched = true; // never stay in the Marea past its peak
      if (s.clock > THRESHOLD_MS && s.player.x + 6 - s.cameraX >= 313) route.rightDone = true;
      if (route.deliberatePacket && s.hazards.hurts.packet.damage + s.hazards.hurts.packet.absorbed > 0) route.deliberatePacket = false;
      if (route.deliberatePacket && s.clock > PL.start + 9000) route.deliberatePacket = false;
      if (route.deliberateEmber !== null && !s.hazards.embers.some(e => e.at === route.deliberateEmber && e.stage !== 'done')) { route.deliberateEmber = null; route.emberDone = s.hazards.hurts.ember.damage + s.hazards.hurts.ember.absorbed > 0; }
      if (!route.leakDone && (s.hazards.leak.drained >= 15 || s.clock > 70500)) route.leakDone = true;
      // One capture per new A2 segment, taken when the hazard is clearly readable.
      const shoot = async (key, file) => { route.shots[key] = true; await canvas.screenshot({ path: `docs/ruta01-${file}.png` }); };
      if (!route.shots.packetloss && s.hazards.packetLoss.filter(c => c.screenX < 300).length >= 2 && s.hazards.packetLoss.some(c => c.states.includes('S'))) await shoot('packetloss', 'packetloss');
      if (!route.shots.eruption && s.hazards.eruption === 1 && s.hazards.embers.filter(e => e.stage === 'marker').length >= 2) await shoot('eruption', 'eruption');
      if (!route.shots.memoryleak && s.hazards.leak.inside && s.hazards.leak.zones.length >= 2) await shoot('memoryleak', 'memoryleak');
      if (!route.shots.loop && s.hazards.loop.active && s.hazards.loop.resets >= 1 && s.hazards.loop.formation.filter(f => f.x < 300).length >= 2) await shoot('loop', 'loop');
      if (!route.screenshot && s.clock > 29000) {
        route.screenshot = true;
        await canvas.screenshot({ path: 'docs/ruta01-route.png' });
      }
      if (!route.bugShot && s.enemyList.some(e => e.type === 'corruptor' && e.charging) && s.enemyList.some(e => e.type !== 'glitchling' && e.type !== 'corruptor' || s.orbs.length)) {
        route.bugShot = true;
        await canvas.screenshot({ path: 'docs/ruta01-bugs.png' });
      }
      // Esc pause during a Ráfaga freezes its real-clock timer.
      if (!route.rafagaPause && s.power.rafaga.active && s.power.rafaga.remainingMs < 5000) {
        await releaseAll();
        await page.keyboard.press('Escape');
        await wait(() => window.pachaDebug().paused === true);
        const before = await snap();
        await frames(20);
        const after = await snap();
        route.rafagaPause = { before: before.power.rafaga.remainingMs, after: after.power.rafaga.remainingMs, real: [before.realClock, after.realClock] };
        await page.keyboard.press('Escape');
        await wait(clock => !window.pachaDebug().paused && window.pachaDebug().realClock > clock, before.realClock);
        continue;
      }
      if (!route.pickupShot && s.pickups.length && s.pickups.some(p => p.screenX > 20 && p.screenX < 300) && (s.power.shield || s.power.rafaga.active)) {
        route.pickupShot = true;
        await canvas.screenshot({ path: 'docs/ruta01-pickups.png' });
      }
      await setKeys(routeKeys(s));
      previous = s;
    }
    await releaseAll();
    return (await snap())?.scene ?? 'none';
  };
  let routeResult = await flyRoute();
  let routeAttempts = 1;
  // The 98 s A2 route takes four deliberate hits (Firewall, Packet Loss, ember, Marea), so allow a third attempt.
  while (routeResult === 'defeat' && routeAttempts < 3) {
    { const lost = await snap(); notes.push(`route attempt ${routeAttempts} ended in defeat at ${Math.round(lost.clock)} ms (hurts ${JSON.stringify(lost.hazards.hurts)})`); }
    const panel = (await snap()).panel;
    assert.match(panel, /KIPU SE DESCONECTA/);
    const run = (await snap()).sceneRun;
    await page.keyboard.press('r');
    await wait(previous => window.pachaDebug?.().scene === 'route' && window.pachaDebug().sceneRun > previous && window.pachaDebug().clock > 0, run);
    Object.assign(route, { orbSeen: false, mareaTouched: false, rightDone: false, rafagaPause: null, deliberatePacket: true, deliberateEmber: null, emberDone: false, leakDone: false });
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
  assert.ok(R.some(s => s.shots > 0) && R.every(s => s.shots <= SHOT_POOL), `shots fire and stay within the ${SHOT_POOL}-shot pool`);
  for (const [a, b] of pairs) {
    assert.equal(b.sc - a.sc, 100 * (b.fr - a.fr) + (b.bp - a.bp) + (b.cb - a.cb) + (b.pb - a.pb), `score delta at ${b.c} ms`);
    if (b.m < 100 && !a.lk && !b.lk) assert.ok(step10(b.m - a.m), `meter moves in steps of 10 outside Memory Leak at ${b.c} ms (${a.m} -> ${b.m})`);
    if (b.bg === a.bg + 1) {
      assert.ok(BUG_SCORES.has(b.bp - a.bp), `a debugged bug scores its own value (${b.bp - a.bp}) at ${b.c} ms`);
      assert.equal(b.cb - a.cb, (b.bp - a.bp) * (comboMultiplier(b.ch) - 1), `racha bonus = base x (multiplier - 1) at ${b.c} ms`);
    }
  }
  const firstWound = pairs.find(([a, b]) => b.g1 > a.g1 && b.bg === a.bg && b.fr === a.fr && b.m < 100 && !a.lk && !b.lk);
  assert.ok(firstWound, 'a Glitchling must lose one of its two HP to a shot');
  assert.ok(Math.abs(firstWound[1].m - firstWound[0].m - 10) < 1e-6, 'each Glitchling hit adds +10 meter');
  const firstKill = pairs.find(([a, b]) => b.bg === a.bg + 1 && b.fr === a.fr);
  assert.ok(firstKill, 'a Glitchling must be destroyed by shots');
  assert.equal(firstKill[1].bp - firstKill[0].bp, 75, 'the first debugged bug is a Glitchling worth 75');
  assert.equal(firstKill[1].sc - firstKill[0].sc, 75 * comboMultiplier(firstKill[1].ch));
  // A Ráfaga volley can land several hits in one frame; each hit (racha +1) adds exactly +10.
  if (firstKill[1].m < 100) assert.ok(Math.abs(firstKill[1].m - firstKill[0].m - 10 * (firstKill[1].ch - firstKill[0].ch)) < 1e-6 && firstKill[1].ch > firstKill[0].ch, 'the killing hit adds +10 meter');
  const firstFragment = pairs.find(([a, b]) => b.fr === a.fr + 1 && b.bg === a.bg);
  assert.ok(firstFragment, 'a fragment must be collected');
  assert.equal(firstFragment[1].sc - firstFragment[0].sc, 100, 'a fragment adds 100 score');
  assert.equal(firstFragment[1].m - firstFragment[0].m, Math.min(20, 100 - firstFragment[0].m), 'a fragment adds +20 meter');
  const wallHit = pairs.find(([a, b]) => b.hp < a.hp && (a.touch || b.touch) && b.seg === 'firewall');
  assert.ok(wallHit, 'touching a Firewall column outside its gap must cost a heart');
  assert.equal(R.reduce((n, s) => n + s.beyond, 0), 0, 'no shot may appear beyond a Firewall while Kipu is in front of it');
  // Ambient (visual only): a smoke plume always, a faint ember glow now and then, mist bands at the marked transitions.
  assert.ok(R.every(s => s.pf > 0) && R.some(s => s.em > 0) && R.every(s => s.em <= 0.3 || s.er > 0), 'the Misti smokes and glows faintly (brighter only in the eruption)');
  assert.ok(R.some(s => s.er === 1 && s.dim > 0 && s.dim <= 0.25) && R.filter(s => s.seg !== 'eruption').every(s => s.dim === 0), 'the eruption dims the sky slightly, only in its segment');
  for (const seg of ['firewall', 'marea', 'threshold']) assert.ok(R.some(s => s.bd === seg), `a mist band marks the ${seg} start`);
  assert.ok(R.every(s => s.bd === null || ['firewall', 'marea', 'threshold'].includes(s.bd)), 'mist bands only at the marked transitions');
  const textures = new Set(R.flatMap(s => s.tex.split(',').filter(Boolean)));
  for (const key of ['corruptor', 'corruptor-charge', 'corruptor-fire', 'sombra', 'sombra-blink', 'shadow', 'pickup-rafaga', 'pickup-rafaga-shine']) assert.ok(textures.has(key), `user sprite frame ${key} shown (${[...textures]})`);
  assert.ok(R.some(s => s.near > 0), 'shots must have been fired at a Firewall column');
  const mareaFronts = R.filter(s => s.c > MAREA.start && s.c < MAREA.peak).map(s => s.front);
  assert.ok(mareaFronts.length > 10 && mareaFronts.every((f, i) => i === 0 || f >= mareaFronts[i - 1]) && Math.max(...mareaFronts) > 100, `the Marea front advances from the left edge (${mareaFronts.length} samples, max ${Math.max(...mareaFronts)}, first drop at ${mareaFronts.findIndex((f, i) => i > 0 && f < mareaFronts[i - 1])})`);
  const mareaHit = pairs.find(([a, b]) => b.hp < a.hp && b.front > 0 && b.front >= b.left - 1);
  assert.ok(mareaHit, 'contact with the Marea front must cost a heart');
  const threshold = R.filter(s => s.seg === 'threshold');
  assert.ok(threshold.length > 30 && threshold.every(s => s.en === 0 && s.oc === 0), 'at the threshold every bug and orb is gone and none spawn');
  assert.ok(threshold.some(s => s.cap === TEXT.threshold), 'threshold line must show');
  const rightMost = Math.max(...threshold.map(s => s.right));
  assert.ok(rightMost >= 312.5 && rightMost <= 315, `right clamp keeps Kipu inside the play area (right edge ${rightMost})`);
  const final = R.at(-1);
  assert.equal(arrival.combo.hits, final.ch, 'the racha carries into the guardian');
  assert.deepEqual({ bugPoints: arrival.run.bugPoints, comboBonus: arrival.run.comboBonus, comboHits: arrival.run.comboHits }, { bugPoints: final.bp, comboBonus: final.cb, comboHits: final.ch });
  assert.deepEqual(
    { hp: arrival.run.hp, score: arrival.run.score, fragments: arrival.run.fragments, bugs: arrival.run.bugs, meter: arrival.run.meter },
    { hp: final.hp, score: final.sc, fragments: final.fr, bugs: final.bg, meter: final.m }, 'guardian must receive the route state');
  assert.ok(arrival.run.routeSeconds >= ROUTE_MS / 1000 && arrival.run.routeSeconds < ROUTE_MS / 1000 + 0.2, `route time ${arrival.run.routeSeconds}`);
  assert.equal(arrival.heroHP, final.hp);
  assert.equal(arrival.reverse.meter, final.m);
  assert.equal(arrival.score, final.sc);
  assert.equal(arrival.run.pickupBonus, final.pb, 'the full-heart bonus carries into the guardian');

  stage = '2 route A2: Packet Loss, Erupción del Misti, Memory Leak, Bucle and fairness (sampled frames)';
  // Fairness: never two hazard types at once; every heart lost costs exactly one.
  assert.ok(R.every(s => s.act.split(',').filter(Boolean).length <= 1), 'never two hazard types active at once');
  for (const [a, b] of pairs) if (b.hp < a.hp) assert.equal(a.hp - b.hp, 1, `a hit costs exactly one heart (${b.c} ms)`);
  for (const [key, text] of Object.entries({ packetLoss: TEXT_A2.packetLoss, eruption: TEXT_A2.eruption, memoryLeak: TEXT_A2.memoryLeak, loop: TEXT_A2.loop })) {
    assert.ok(R.some(s => s.cap === text), `${key} caption "${text}" shows`);
  }
  // Packet Loss: every block that turns solid was telegraphing in the previous frame; a solid block costs a heart.
  const plStates = s => Object.fromEntries(s.pl.split('|').filter(Boolean).map(x => x.split(':')));
  let solidTurns = 0;
  for (const [a, b] of pairs) {
    const before = plStates(a), now = plStates(b);
    for (const [index, states] of Object.entries(now)) {
      if (!before[index]) continue;
      for (let i = 0; i < states.length; i++) if (states[i] === 'S' && before[index][i] !== 'S') { solidTurns++; assert.equal(before[index][i], 'T', `block ${index}/${i} telegraphs before turning solid (${b.c} ms)`); }
    }
  }
  assert.ok(solidTurns >= 4, `blocks turned solid ${solidTurns} times`);
  const packetHits = pairs.filter(([a, b]) => b.hp_ > a.hp_);
  assert.ok(packetHits.length >= 1, 'touching a solid Packet Loss block must cost a heart (or the Escudo)');
  for (const [a, b] of packetHits) assert.ok((a.plTouch || b.plTouch) && (b.hp === a.hp - 1 || (a.shd && !b.shd)), `a Packet Loss hit only while touching a solid block (${b.c} ms)`);
  // Erupción: every impact was marked at least 600 ms before; an ember impact hurts in its radius.
  const markerSeen = new Map();
  for (const s of R) for (const e of s.emb.split('|').filter(Boolean)) { const [at, st] = e.split(':'); if (st === 'marker' && !markerSeen.has(at)) markerSeen.set(at, s.c); }
  const impacts = new Set();
  for (const s of R) for (const e of s.emb.split('|').filter(Boolean)) { const [at, st] = e.split(':'); if (st === 'impact') impacts.add(at); }
  assert.ok(impacts.size >= 10, `embers landed (${impacts.size})`);
  for (const at of impacts) assert.ok(markerSeen.has(at) && Number(at) - markerSeen.get(at) >= 600, `ember ${at} was marked ${Number(at) - (markerSeen.get(at) ?? at)} ms before impact`);
  const emberHits = pairs.filter(([a, b]) => b.he_ > a.he_);
  assert.ok(emberHits.length >= 1, 'an ember impact must hurt Kipu (a heart or the Escudo)');
  for (const [a, b] of emberHits) assert.ok(b.emb.includes(':impact:') && (b.hp === a.hp - 1 || (a.shd && !b.shd)), `an ember hurts only at impact (${b.c} ms)`);
  // Memory Leak: inside a zone the meter drains at 25/s of world time and the hearts never change.
  const drains = pairs.filter(([a, b]) => a.lk && b.lk && a.m > 0 && b.c > a.c && b.fr === a.fr && b.ch === a.ch);
  assert.ok(drains.length >= 10 && drains.every(([a, b]) => Math.abs((a.m - b.m) - Math.min(a.m, LEAK_DRAIN * (b.c - a.c) / 1000)) < 0.01), `Memory Leak drains ${LEAK_DRAIN}/s (${drains.length} frames)`);
  assert.ok(drains.every(([a, b]) => b.hp === a.hp || b.hp_ > a.hp_ || b.he_ > a.he_), 'Memory Leak never costs a heart');
  assert.ok(R.some(s => s.lk && s.hl) && R.filter(s => !s.lk).every(s => !s.hl), 'the HUD shows the drain indicator only while draining');
  assert.ok(R.at(-1).ld >= 15, `the pilot was drained (${R.at(-1).ld})`);
  // Bucle: it repeats (formation cleared and respawned) and then breaks by a shot (WebGL) or by itself (Canvas).
  const loopFrames = R.filter(s => s.la);
  assert.ok(loopFrames.length > 30, 'the Bucle runs');
  const resetPairs = pairs.filter(([a, b]) => b.lr > a.lr);
  assert.ok(resetPairs.length >= 1 && resetPairs.every(([, b]) => b.lf === 0), 'each repeat clears the formation');
  assert.ok(resetPairs.every(([a, b]) => R.some(s => s.c > b.c && s.c < b.c + 1500 && s.lr === b.lr && s.lf > 0)), 'and brings it back');
  const final2 = R.at(-1);
  assert.ok(final2.lr >= 1 && final2.lr <= 2, `the Bucle repeated ${final2.lr} time(s), at most 2`);
  assert.equal(final2.lb, breakLoopByShot ? 'shot' : 'timeout', 'the Bucle breaks the expected way');
  if (breakLoopByShot) {
    const broke = pairs.find(([a, b]) => a.lb === '' && b.lb === 'shot');
    assert.ok(broke && broke[1].bp - broke[0].bp === LOOP_SCORE && broke[1].bg === broke[0].bg + 1, 'breaking the node scores like a bug worth 250');
  } else assert.equal(final2.lr, 2, 'left alone, the Bucle breaks by itself after two repeats');
  assert.ok(R.some(s => s.cap === TEXT_A2.loopBroken), '"BUCLE ROTO" shows');
  for (const key of Object.keys(route.shots)) assert.ok(route.shots[key], `capture docs/ruta01-${key}.png taken`);
  notes.push(`A2: ${solidTurns} solid turns, ${packetHits.length} Packet Loss hit(s), ${impacts.size} ember impacts (${emberHits.length} hit Kipu), leak drained ${Math.round(final2.ld)}, Bucle ${final2.lr} repeat(s) then ${final2.lb}`);
  passed.push(`2 route A2: one hazard at a time, each hit costs one heart; Packet Loss telegraphs before every solid turn (${solidTurns}) and a solid block hurt; ${impacts.size} embers each marked >= 600 ms ahead and one hurt; Memory Leak drained ${LEAK_DRAIN}/s with the HUD indicator and no heart lost; Bucle repeated ${final2.lr} time(s) then broke by ${final2.lb} with "BUCLE ROTO"`);
  stage = '2 route B2: Corruptor, Sombra de Error, racha, hit-stop, debug-drop (sampled frames)';
  const firstOrb = pairs.find(([a, b]) => b.oc > a.oc);
  assert.ok(firstOrb, 'a Corruptor must fire an orb');
  for (const [, b] of pairs.filter(([a, b]) => b.oc > a.oc)) {
    const before = R.filter(s => s.c >= b.c - 650 && s.c < b.c);
    assert.ok(before.some(s => s.chg), `every orb is telegraphed by a Corruptor charge in the previous 600 ms (orb at ${b.c} ms)`);
  }
  assert.ok(R.every(s => s.ct <= 2 && s.lg + s.sm <= 3), 'at most 2 Corruptors and 3 shadow units on screen');
  for (const seg of ['firewall', 'packetLoss', 'eruption', 'loop']) assert.ok(R.filter(s => s.seg === seg).every(s => s.ct === 0 && s.lg + s.sm === 0 && s.oc === 0), `no Corruptor, Sombra or orb during ${seg}`);
  assert.ok(R.some(s => s.dodge), 'a Sombra de Error telegraphs a sideways dodge');
  const split = pairs.find(([a, b]) => b.lg === a.lg - 1 && b.bg >= a.bg + 1 && b.sm === a.sm + 2);
  assert.ok(split, 'a debugged Sombra splits into two small shadows');
  for (const [a, b] of pairs) if (b.sm > a.sm) assert.ok(b.lg < a.lg, `small shadows appear only when a large Sombra splits (${b.c} ms)`);
  assert.ok(R.every(s => s.smhp <= 1), 'small shadows have 1 HP');
  const smallDown = pairs.find(([a, b]) => b.sm < a.sm && b.bg > a.bg && b.lg === a.lg);
  if (smallDown) assert.ok(smallDown[1].sm === smallDown[0].sm - 1, 'a debugged small shadow never splits again');
  assert.ok(R.some(s => s.cm >= 2 && s.hc === `RACHA ×${s.cm}`), 'the racha rises to x2 and shows "RACHA xN" in the HUD');
  const hurts = pairs.filter(([a, b]) => b.hp < a.hp);
  assert.ok(hurts.length > 0 && hurts.every(([a, b]) => b.ch === 0 || b.ch < a.ch), 'taking damage resets the racha');
  assert.ok(hurts.some(([a, b]) => a.ch > 0 && b.ch === 0), 'a hit while on a racha resets it to zero');
  for (const [a, b] of pairs) assert.ok(b.c - a.c <= b.rc - a.rc + 0.01, `the world clock never runs ahead of the real clock (${b.c} ms)`);
  const stopped = pairs.filter(([a, b]) => b.rc > a.rc && b.c - a.c < b.rc - a.rc - 1);
  assert.ok(stopped.length > 0, 'a heavy hit stops the world clock while the real clock keeps running');
  for (const [a, b] of pairs.filter(([a, b]) => b.c === a.c && b.rc > a.rc)) assert.equal(b.cx, a.cx, 'the camera holds during a full hit-stop frame');
  assert.ok(final.rc - final.c <= final.hst + 0.01 && final.rc - final.c >= final.hst - 50.01, `real - world equals the hit-stop total (${final.rc - final.c} vs ${final.hst})`);
  assert.ok(final.hsc >= 1);
  assert.ok(final.dr >= 1 && final.dr === Math.floor(final.bg / 4), `every 4th debugged bug drops a fragment (${final.dr} drops for ${final.bg} bugs)`);
  assert.ok(R.some(s => s.dk > 0), 'a dropped fragment appears');
  assert.ok(R.some(s => s.fl > 0) && R.every(s => s.fl <= 8), 'floating numbers show and stay within their pool');
  passed.push(`2 route B2: Corruptor orbs telegraphed by a 600 ms charge, caps (2 Corruptors / 3 shadows) held, quiet Firewall, Sombra dodge and split into two 1 HP shadows, racha up to x${Math.max(...R.map(s => s.cm))} and reset on damage, ${final.hsc} hit-stops (${final.hst} ms) on the world clock only, ${final.dr} debug-drop fragment(s) for ${final.bg} bugs`);
  stage = '2 route B3: Ráfaga de la Trama, Escudo and Corazón (sampled frames)';
  assert.ok(R.every(s => s.hp <= MAX_HP), 'hearts never exceed 4');
  const rafagaStarts = pairs.filter(([a, b]) => b.pcr > a.pcr);
  assert.ok(rafagaStarts.length >= 1, 'a Ráfaga de la Trama must be collected');
  const rafagaWindows = [];
  for (const [, start] of rafagaStarts) {
    // Arcade overlaps run before the scene update advances the owned real clock, so the first sample is up to a frame in.
    assert.ok(start.pw && start.prm > RAFAGA_MS - 100 && start.prm <= RAFAGA_MS, `a collected Ráfaga starts with ${RAFAGA_MS} ms (${start.prm})`);
    assert.equal(start.hr, 'RÁFAGA', 'the HUD shows the RÁFAGA bar while it runs');
    const end = R.find(s => s.rc > start.rc && !s.pw);
    if (!end || R.some(s => s.rc > start.rc && s.rc < end.rc && s.pcr > start.pcr)) continue;
    rafagaWindows.push({ start, end, real: end.rc - (start.rc - (RAFAGA_MS - start.prm)) });
  }
  assert.ok(rafagaWindows.length >= 1, 'a Ráfaga must run out');
  for (const w of rafagaWindows) assert.ok(w.real >= RAFAGA_MS && w.real <= RAFAGA_MS + 100, `the Ráfaga lasts ${RAFAGA_MS} ms of real time (${w.real})`);
  const inside = s => rafagaWindows.some(w => s.rc > w.start.rc && s.rc < w.end.rc);
  const volleyTimes = (filter) => [...new Set(R.filter(filter).map(s => s.va))].sort((a, b) => a - b);
  const gaps = times => times.slice(1).map((t, i) => t - times[i]);
  const triple = pairs.filter(([a, b]) => b.vc > a.vc && inside(a) && inside(b));
  assert.ok(triple.length >= 10 && triple.every(([, b]) => b.vs === 3), `every volley during a Ráfaga is a triple spread (${triple.length} volleys)`);
  const fastGaps = gaps(volleyTimes(s => inside(s) && s.vs === 3)).filter(g => g < 400);
  assert.ok(fastGaps.length >= 8 && fastGaps.every(g => g >= RAFAGA_COOLDOWN - 0.01), `Ráfaga cooldown >= ${RAFAGA_COOLDOWN} ms (${Math.min(...fastGaps)})`);
  assert.ok(fastGaps.filter(g => g < SHOT_COOLDOWN - 1).length > fastGaps.length / 2, 'the Ráfaga fires faster than the normal cooldown');
  assert.ok(Math.max(...R.filter(inside).map(s => s.shots)) > 12, 'a Ráfaga keeps more shots on screen than the old 12-shot pool');
  const after = rafagaWindows[0].end;
  const single = pairs.filter(([a, b]) => b.vc > a.vc && a.rc >= after.rc && !a.pw && !b.pw && b.c < THRESHOLD_MS);
  assert.ok(single.length >= 5 && single.every(([, b]) => b.vs === 1), 'after the Ráfaga Kipu fires single shots again');
  const slowGaps = gaps(volleyTimes(s => s.rc >= after.rc && !s.pw && s.vs === 1 && s.c < THRESHOLD_MS)).filter(g => g < 400);
  assert.ok(slowGaps.length >= 3 && slowGaps.every(g => g >= SHOT_COOLDOWN - 0.01), `normal cooldown ${SHOT_COOLDOWN} ms returns (${Math.min(...slowGaps)})`);
  assert.ok(R.filter(s => !s.pw).every(s => s.hr === ''), 'the RÁFAGA bar hides when it runs out');
  assert.ok(route.rafagaPause, 'the pilot paused during a Ráfaga');
  assert.equal(route.rafagaPause.after, route.rafagaPause.before, 'Esc pause freezes the Ráfaga timer');
  assert.equal(route.rafagaPause.real[1], route.rafagaPause.real[0], 'Esc pause freezes the real clock');
  const shieldPick = pairs.find(([a, b]) => b.pce > a.pce);
  assert.ok(shieldPick, 'an Escudo must be collected');
  assert.ok(shieldPick[1].shd && shieldPick[1].hsh, 'a collected Escudo shows on Kipu and next to the hearts');
  const absorbed = pairs.find(([a, b]) => a.shd && !b.shd);
  assert.ok(absorbed, 'the Escudo must absorb a hit');
  assert.equal(absorbed[1].hp, absorbed[0].hp, 'the absorbed hit costs no heart');
  assert.ok(absorbed[1].inv > absorbed[0].inv && absorbed[1].inv > absorbed[1].rc, 'the normal invulnerability still triggers on an absorbed hit');
  const heartPicks = pairs.filter(([a, b]) => b.pcc > a.pcc);
  assert.ok(heartPicks.length >= 1, 'a Corazón must be collected');
  for (const [a, b] of heartPicks) {
    if (a.hp < MAX_HP) assert.ok(b.hp === a.hp + 1 && b.pb === a.pb, `a Corazón heals one heart (${a.hp} -> ${b.hp})`);
    else assert.ok(b.hp === MAX_HP && b.pb === a.pb + 100, 'a Corazón at full hearts scores +100 instead');
  }
  notes.push(`route pickups: ${rafagaStarts.length} Ráfaga (${rafagaWindows.map(w => Math.round(w.real)).join('/')} ms real, ${triple.length} triple volleys), Escudo absorbed at ${Math.round(absorbed[1].c)} ms, Corazón ${heartPicks.map(([a, b]) => `${a.hp}->${b.hp}${b.pb > a.pb ? ' +100' : ''}`).join(', ')}`);
  passed.push(`2 route B3: Ráfaga triples every volley for ${rafagaWindows.map(w => Math.round(w.real)).join('/')} ms of real time at >= ${RAFAGA_COOLDOWN} ms then reverts to single shots at ${SHOT_COOLDOWN} ms, Esc pause freezes its timer, RÁFAGA bar shows and hides; Escudo shows on Kipu and the HUD and absorbs a hit with no heart lost and invulnerability; Corazón heals (cap ${MAX_HP})`);
  passed.push(`2 route: shots fire (pool <= ${SHOT_POOL}), Glitchling wounded then destroyed (+10 meter per hit, +75 score at x1), fragment +100/+20, Firewall contact costs a heart and stops shots, Marea advances and drains a heart, silent threshold with "${TEXT.threshold}", right clamp, transition carries hp ${final.hp} / score ${final.sc} / fragments ${final.fr} / meter ${final.m}`);

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
      hs: s.hitStop.active, hsc: s.hitStop.count, ch: s.combo.hits, cm: s.combo.multiplier, fb: s.fightBonus, sc: s.score, fl: s.floaters.active,
      pk: s.pickups.map(p => p.type).join(','), pkt: s.pickups.map(p => p.texture).join(','), pdc: s.pickupsDropped.corazon, pde: s.pickupsDropped.escudo,
      pcc: s.pickupsCollected.corazon, pce: s.pickupsCollected.escudo, shd: s.power.shield, inv: s.invulnerableUntil, fpb: s.fightPickups.bonus,
      pdr: s.pickupsDropped.rafaga, pcr: s.pickupsCollected.rafaga, pw: s.power.rafaga.active,
    };
  });
  const fight = { nokiaDone: false, pauseDone: false, shiftKey: 0, attempts: 0, waveSeen: false };
  const guardianKeys = s => {
    const p = s.player, slow = s.reverse.state === 'SLOW', keys = new Set(['j']);
    // Phase 3 can start inside an open shield window, and normal fire alone can then end the fight before its wave.
    // The pilot holds normal fire in phase 3 until the wave has run once, so every run exercises the wave.
    if (s.wave?.active) fight.waveSeen = true;
    if (s.phase === 3 && !fight.waveSeen) keys.delete('j');
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
    assert.ok(colors.length > 0 && colors.length <= 4 && colors.every(c => NOKIA.includes(c)), `unexpected REVERSE colors: ${colors.slice(0, 12).map(c => c.toString(16)).join(',')} (${colors.length} colors)`);
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
    // A phase 2/3 defeat offers a checkpoint; this pilot always restarts the whole fight (Enter) so the winning
    // attempt still crosses phases 1, 2 and 3. The checkpoint itself is exercised in the defeat section.
    if (lost.phase >= 2) assert.equal(lost.panelHelp, TEXT.checkpointHelp(lost.phase));
    if (fight.attempts === 2) {
      // Two losses with the carried run: continue from a fresh direct entry (4 HP, empty meter).
      await button('Mapa').click();
      await wait(() => window.pachaDebug?.().scene === 'map');
      await button('Ir a Amaru').click();
      notes.push('fight: switched to direct entry after two carried-run losses');
    } else await page.keyboard.press(lost.phase >= 2 ? 'Enter' : 'r');
    await wait(previous => window.pachaDebug?.().scene === 'guardian' && window.pachaDebug().sceneRun > previous && window.pachaDebug().outcome === 'playing', lost.sceneRun);
    assert.equal((await snap()).bossHP, 100, 'the fight pilot restarts from phase 1');
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
    assert.ok(real >= SLOW_MS && real <= SLOW_MS + 100, `SLOW lasts ${SLOW_MS} ms of real clock (observed ${real})`);
    assert.ok(Math.abs(world - 0.2 * real) < 0.5, `world advances at 0.2 during SLOW (${world} vs ${real})`);
  }
  const wall = closed.filter(r => !F.some(s => s.run === r.start.run && s.rc >= r.start.rc && s.rc <= r.end.rc && !s.f)).map(r => Math.round(r.end.t - r.start.t));
  notes.push(`SLOW wall-clock durations (unfrozen): ${wall.join(', ')} ms`);
  assert.ok(wall.length > 0 && wall.every(ms => ms >= SLOW_MS - 50 && ms <= SLOW_MS * 2), `unfrozen SLOW must take about ${SLOW_MS} ms of wall time (${wall})`);
  const captures = gPairs.filter(([a, b]) => b.cap > a.cap && b.st === 'SLOW');
  assert.ok(captures.length >= 2, 'bolts must be captured');
  assert.ok(G.every(s => s.cap <= 6), 'at most six captures per activation');
  for (const [a, b] of captures) {
    assert.ok(a.mcd !== null && a.mcd <= CAPTURE_RADIUS + 14, `captured bolt was ${a.mcd} px away (radius ${CAPTURE_RADIUS} plus one frame of motion)`);
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
  // Hit-stop in the fight: returned-bolt impacts and the shield break stop the world clock, never the real clock.
  for (const [a, b] of gPairs) assert.ok(b.wc - a.wc <= Math.max(a.ws, b.ws) * (b.rc - a.rc) + 0.01, `the world never runs ahead (${b.rc} ms)`);
  const gStopped = gPairs.filter(([a, b]) => b.rc > a.rc && b.wc - a.wc < Math.min(a.ws, b.ws) * (b.rc - a.rc) - 1);
  assert.ok(gStopped.length > 0 && G.some(s => s.hsc > 0), 'a heavy hit on Amaru stops the world clock while the real clock runs');
  assert.ok(G.some(s => s.fl > 0), 'damage numbers float over Amaru');
  for (const [a, b] of gPairs) if (b.hero < a.hero) assert.ok(b.ch === 0 || b.ch < a.ch, 'damage resets the racha in the fight');
  stage = '3 B3 guardian drops (sampled frames)';
  assert.ok(G.every(s => s.hero <= MAX_HP), 'hearts never exceed 4 in the fight');
  const toPhase = n => gPairs.filter(([a, b]) => a.ph === n - 1 && b.ph === n);
  assert.ok(toPhase(2).length >= 1 && toPhase(3).length >= 1, 'phase 2 and phase 3 starts were sampled');
  for (const [a, b] of toPhase(2)) assert.ok(b.pdc === a.pdc + 1 && b.pk.split(',').includes('corazon'), `Amaru drops a Corazón when phase 2 starts (${b.pk})`);
  for (const [a, b] of toPhase(3)) assert.ok(b.pde === a.pde + 1 && b.pk.split(',').includes('escudo'), `Amaru drops an Escudo when phase 3 starts (${b.pk})`);
  assert.ok(G.every(s => s.pdc <= 1 && s.pde <= 1), 'one drop per phase start');
  // Ráfaga drops: at the middle of phase 1 and at each phase 2 shield break, never two on screen.
  const rafagaOn = s => s.pk.split(',').filter(k => k === 'rafaga').length;
  assert.ok(G.every(s => rafagaOn(s) <= 1), 'at most one Ráfaga drop on screen');
  const halfway = gPairs.filter(([a, b]) => a.ph === 1 && a.hp > RAFAGA_DROP_HP && b.hp <= RAFAGA_DROP_HP);
  // A volley of returned bolts can break the phase 2 shield and push Amaru into phase 3 in the same frame (phase 3
  // raises a fresh shield), so a shielded phase 2 sample followed by a phase 3 sample also contains a shield break.
  const breaks = gPairs.filter(([a, b]) => a.ph === 2 && a.sh > 0 && ((b.ph === 2 && b.sh === 0) || b.ph === 3));
  assert.ok(halfway.length >= 1 && breaks.length >= 1, 'the phase 1 halfway mark and a phase 2 shield break were sampled');
  for (const [a, b] of [...halfway, ...breaks]) assert.ok(b.pdr === a.pdr + (rafagaOn(a) ? 0 : 1), `a Ráfaga drops at ${a.ph === 1 ? 'mid phase 1' : 'a shield break'} (${a.pdr} -> ${b.pdr}, on screen: ${a.pk})`);
  for (const pair of gPairs.filter(([a, b]) => b.run === a.run && b.pdr > a.pdr)) assert.ok(halfway.includes(pair) || breaks.includes(pair), `Ráfaga drops only at those two moments (${pair[0].ph}:${pair[0].hp}/${pair[0].sh} -> ${pair[1].hp}/${pair[1].sh})`);
  for (const s of G.filter(s => s.nokia && s.pkt)) assert.ok(s.pkt.split(',').every(t => t.endsWith('-nokia')), `drops use their four-green twins during REVERSE (${s.pkt})`);
  const drift = G.filter(s => s.pk && !s.p && s.f && s.ws === 1);
  for (const [a, b] of gPairs.filter(([a, b]) => b.pcc > a.pcc)) {
    if (a.hero < MAX_HP) assert.ok(b.hero === a.hero + 1, 'a dropped Corazón heals one heart');
    else assert.equal(b.fpb, a.fpb + 100, 'a dropped Corazón at full hearts scores +100');
  }
  for (const [a, b] of gPairs.filter(([a, b]) => a.shd && !b.shd && b.out === 'playing')) assert.ok(b.hero === a.hero && b.inv > a.inv, 'the Escudo absorbs a hit in the fight');
  notes.push(`fight pickups: drops corazón ${Math.max(...G.map(s => s.pdc))} / escudo ${Math.max(...G.map(s => s.pde))} per run, collected corazón ${Math.max(...G.map(s => s.pcc))} / escudo ${Math.max(...G.map(s => s.pce))}, ${drift.length} frames with a drop on screen`);
  passed.push(`3 B3: Amaru drops a Corazón at every phase 2 start and an Escudo at every phase 3 start, drops use four-green twins in REVERSE, hearts capped at ${MAX_HP}`);
  passed.push(`3 A1: Ráfaga drops at mid phase 1 and at ${breaks.length} phase 2 shield breaks (${Math.max(...G.map(s => s.pdr))} dropped in the last run, ${Math.max(...G.map(s => s.pcr))} collected), never two on screen`);
  passed.push(`3 hit-stop and racha in the fight: ${gStopped.length} sampled frames with the world clock stopped while the real clock ran, damage numbers float, damage resets the racha`);
  passed.push(`3 REVERSE: READY only at 100, ${closed.length} SLOW windows of ${closed.map(r => Math.round(r.end.rc - r.start.rc)).join('/')} ms real at worldScale 0.2, ${captures.length} captures all within reach and never harmful, <= 6 per activation, shield drops only with returned bolts, rhombus/orb silhouettes, wave seen, Esc and focus pause froze real and world clocks`);

  stage = '5 phases, victory and liberation (sampled frames)';
  assert.ok(G.every(s => s.ph === phaseFor(s.hp)), 'phase always follows Amaru HP thresholds (66/33)');
  assert.deepEqual([...new Set(G.filter(s => s.run === runs.at(-1)).map(s => s.ph))], [1, 2, 3], 'the winning attempt crosses phases 1, 2 and 3 in order');
  const phase2 = G.find(s => s.ph === 2);
  assert.ok(phase2.m === 100 || phase2.st === 'SLOW', 'entering phase 2 awakens the core and fills the meter');
  assert.ok(F.some(s => s.msg.includes(TEXT.core)), 'core-awakening message shows');
  assert.ok(F.some(s => s.ph === 2 && s.st === 'SLOW' && s.msg === TEXT.flyToRhombi), 'the first SLOW of phase 2 coaches "fly into the rhombi"');
  assert.ok(F.some(s => s.msg === TEXT.shieldBroken), 'a broken shield calls the punish window');
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
  assert.equal(points('TOTAL'), points('FRAGMENTOS') + points('BUGS') + points('DEVOLUCIONES') + points('RACHA') + points('OBJETOS') + points('BONO DE TIEMPO'), 'score breakdown adds up');
  assert.equal(points('OBJETOS'), won.run.pickupBonus + won.fightPickups.bonus, 'the OBJETOS line adds the full-heart bonuses');
  assert.equal(count('OBJETOS'), won.run.pickups + won.fightPickups.count, 'the OBJETOS line counts every pickup collected');
  assert.equal(points('RACHA'), won.run.comboBonus + won.fightBonus, 'the racha line adds the route and fight bonuses');
  assert.equal(points('BUGS'), won.run.bugPoints);
  assert.equal(count('DEVOLUCIONES'), won.reverse.returnsTotal);
  assert.equal(count('FRAGMENTOS'), won.run.fragments); assert.equal(count('BUGS'), won.run.bugs);
  assert.equal(points('FRAGMENTOS'), 100 * won.run.fragments); assert.equal(points('DEVOLUCIONES'), 200 * won.reverse.returnsTotal);
  const map = await snap();
  assert.equal(map.node, 'restored'); assert.equal(map.progress.guardian, true);
  assert.match(await page.locator('#view-result').innerText(), /nodo restaurado/);
  assert.match(await page.locator('#achievements').innerText(), /Amaru liberado/);
  passed.push(`5 phases 1-2-3 by HP thresholds, corrupted head while fighting, victory, liberation: corruption overlay recedes > color wave restores the arena > two dialogue lines > codex > result (total ${points('TOTAL')} = fragments + bugs + returns + racha + pickups + time), Enter to map with restored node and progress.guardian true`);

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

  stage = '5 checkpoint: a phase 2 defeat resumes at phase 2 with R and restarts the fight with Enter';
  // Fight phase 1 with the pilot (it never uses PachaShift there), then stand still in phase 2 until the hearts run out.
  const loseInPhase2 = async () => {
    for (let tries = 0; tries < 3; tries++) {
      const deadline = Date.now() + 120000;
      while (Date.now() < deadline) {
        const s = await snap();
        if (s.outcome !== 'playing' || s.phase >= 2) break;
        await setKeys(guardianKeys(s).keys);
      }
      await releaseAll();
      const s = await snap();
      if (s.outcome === 'playing' && s.phase === 2) break;
      notes.push(`checkpoint setup: lost in phase ${s.phase} at boss HP ${s.bossHP}; retrying`);
      await page.keyboard.press('r');
      await wait(previous => window.pachaDebug?.().sceneRun > previous && window.pachaDebug().outcome === 'playing', s.sceneRun);
    }
    await wait(() => window.pachaDebug().outcome === 'defeat', undefined, 90000);
    return snap();
  };
  const lost2 = await loseInPhase2();
  assert.equal(lost2.phase, 2, 'the defeat happens in phase 2');
  assert.equal(lost2.panel, TEXT.defeat);
  assert.equal(lost2.panelHelp, TEXT.checkpointHelp(2));
  assert.equal(lost2.checkpoint.phase, 2); assert.equal(lost2.checkpoint.returnsTotal, lost2.reverse.returnsTotal);
  assert.ok(lost2.checkpoint.elapsedMs > 0 && lost2.checkpoint.elapsedMs <= lost2.fightElapsedMs, 'the checkpoint keeps the fight time already spent');
  assert.match(await page.locator('#view-help').innerText(), /R: reintentar desde la fase 2 · Enter: desde el inicio · M: mapa/);
  await frames(10);
  await page.keyboard.press('r');
  await wait(previous => window.pachaDebug?.().sceneRun > previous && window.pachaDebug().realClock > 0, lost2.sceneRun);
  const resumed = await snap();
  assert.deepEqual(
    { outcome: resumed.outcome, hero: resumed.heroHP, boss: resumed.bossHP, phase: resumed.phase, shield: resumed.shieldHP, state: resumed.reverse.state, meter: resumed.reverse.meter, returns: resumed.reverse.returnsTotal, checkpointed: resumed.checkpointed, from: resumed.resumedFrom, score: resumed.score },
    { outcome: 'playing', hero: 4, boss: 66, phase: 2, shield: 6, state: 'READY', meter: 100, returns: lost2.reverse.returnsTotal, checkpointed: true, from: 2, score: lost2.score },
    'R after a phase 2 defeat resumes at phase 2 with full hearts, a full meter and the score kept');
  assert.ok(resumed.fightElapsedMs >= lost2.checkpoint.elapsedMs, 'resuming never resets the fight time (no time bonus abuse)');
  assert.match(await page.locator('#view-help').innerText(), /PachaShift/);
  await wait(() => window.pachaDebug().outcome === 'defeat', undefined, 90000);
  const lostAgain = await snap();
  assert.equal(lostAgain.panelHelp, TEXT.checkpointHelp(2));
  await frames(10);
  await page.keyboard.press('Enter');
  await wait(previous => window.pachaDebug?.().sceneRun > previous && window.pachaDebug().realClock > 0, lostAgain.sceneRun);
  const restarted = await snap();
  assert.deepEqual(
    { outcome: restarted.outcome, hero: restarted.heroHP, boss: restarted.bossHP, phase: restarted.phase, meter: restarted.reverse.meter, returns: restarted.reverse.returnsTotal, checkpointed: restarted.checkpointed },
    { outcome: 'playing', hero: 4, boss: 100, phase: 1, meter: 0, returns: 0, checkpointed: false },
    'Enter after a phase 2 defeat restarts the whole fight');
  notes.push(`checkpoint: lost in phase 2 at boss HP ${lost2.bossHP}, R resumed at 66 with 4 hearts and meter 100; Enter restarted at 100`);
  passed.push('5 checkpoint: a phase 2 defeat shows "R: REINTENTAR DESDE FASE 2" / "ENTER: DESDE EL INICIO  M: MAPA" (canvas and DOM help); R resumes at HP 66 with 4 hearts, a full meter, shield up, score and fight time kept; Enter restarts from phase 1');

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
  // The route's ambient background is still under reduced motion: frozen plume, no ember, no mist band, static frames.
  await page.keyboard.press('m');
  await wait(() => window.pachaDebug?.().scene === 'map');
  await page.keyboard.press('1');
  await wait(() => window.pachaDebug?.().scene === 'route' && window.pachaDebug().clock > 300);
  await startSampler('calmRoute', s => (s.scene === 'route' ? { em: s.background.ambient.ember, bd: s.background.ambient.band, pf: s.background.ambient.puffs, c: s.clock } : {}));
  await frames(90);
  const calmRoute = (await stopSampler('calmRoute')).filter(s => s.c !== undefined);
  assert.ok(calmRoute.length > 30 && calmRoute.every(s => s.em === 0 && s.bd === null && s.pf === calmRoute[0].pf), 'reduced motion: the Misti plume is frozen, no ember glow and no mist band');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  passed.push('6 reduced motion: OS preference sets the toggle; no particles, no sway or tilt, neutral Kipu frame while telegraphs and signals remain; the toggle switches it off and on and returns focus; the route ambient background stays still');

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
