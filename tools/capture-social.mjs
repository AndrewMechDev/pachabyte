// Screenshot pilot for release material (LinkedIn, README). Not a test: it plays with REAL keyboard input and only
// reads the read-only ?debug=1 snapshot. Output is 1920x1080 canvas captures (deviceScaleFactor 2, crisp pixels).
//
//   $env:OUT = 'C:\path\to\folder'; $env:PACHA_URL = 'https://andrewmechdev.github.io/pachabyte'
//   node tools/capture-social.mjs route    # route candidates every ~1.1 s from 9 s to 40 s
//   node tools/capture-social.mjs amaru    # fight, PachaShift green frame, liberation, codex, result
//
// Run it from the repository root so `playwright` resolves. Pick the best frames afterwards (a contact sheet helps).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const part = process.argv[2];
const out = process.env.OUT;
const base = process.env.PACHA_URL;
if (!out || !base || !['route', 'amaru'].includes(part)) throw new Error('Usage: set OUT and PACHA_URL, then node tools/capture-social.mjs route|amaru');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: process.env.PACHA_BROWSER_CHANNEL ?? 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const snap = () => page.evaluate(() => window.pachaDebug?.() ?? null);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const held = new Set();
async function hold(key, on) {
  if (on && !held.has(key)) { held.add(key); await page.keyboard.down(key); }
  else if (!on && held.has(key)) { held.delete(key); await page.keyboard.up(key); }
}
const releaseAll = async () => { for (const k of [...held]) await hold(k, false); };
const shot = async name => { await page.locator('canvas').screenshot({ path: `${out}/${name}.png` }); console.log('shot', name); };
async function waitScene(scene, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const s = await snap(); if (s?.scene === scene) return s; await sleep(100); }
  throw new Error(`timeout waiting for ${scene}`);
}
const steer = async (px, py, tx, ty, dead = 7) => {
  await hold('w', py > ty + dead); await hold('s', py < ty - dead);
  await hold('a', px > tx + 8); await hold('d', px < tx - 8);
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Skips the story intro when the build has one (scene "intro"), without failing on builds that do not.
async function startFromMap(key) {
  await page.keyboard.press(key);
  for (let i = 0; i < 40; i++) {
    const s = await snap();
    if (s?.scene === 'intro') await page.keyboard.press('Escape');
    if (s && s.scene !== 'map' && s.scene !== 'intro') return s;
    await sleep(100);
  }
}

await page.goto(`${base}/?debug=1`, { waitUntil: 'networkidle' });
await page.locator('canvas').click();
await waitScene('map');

if (part === 'route') {
  await startFromMap('Enter');
  await waitScene('route');
  let next = 9000;
  const t0 = Date.now();
  while (Date.now() - t0 < 150000) {
    const s = await snap();
    if (!s || s.scene !== 'route') break;
    if (s.outcome !== 'playing') { console.log('route ended', s.outcome, 'at', Math.round(s.clock)); break; }
    await hold('Space', true);
    const px = s.player.x - s.cameraX, py = s.player.y;
    let ty = 90;
    const ahead = s.enemyList.filter(e => e.screenX > px + 10).sort((a, b) => a.screenX - b.screenX)[0];
    if (ahead) ty = ahead.y;
    const pk = s.pickups.filter(p => p.screenX > px - 10 && p.screenX - px < 150)[0];
    if (pk) ty = pk.y;
    for (const o of s.orbs) if (o.screenX - px > -10 && o.screenX - px < 70 && Math.abs(o.y - py) < 20) ty = clamp(o.y > py ? py - 45 : py + 45, 28, 160);
    await steer(px, py, 70, clamp(ty, 28, 160));
    if (s.clock >= next) { await shot(`route_${String(Math.round(s.clock / 1000)).padStart(2, '0')}s`); next += 1100; }
    if (s.clock > 40000) break;
    await sleep(35);
  }
  await releaseAll();
} else {
  await startFromMap('2');
  await waitScene('guardian');
  const done = new Set();
  let nextAt = 2500, libStage = '', deaths = 0, slowShots = 0, last = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 240000) {
    const s = await snap();
    if (!s || s.scene !== 'guardian') break;
    last = s;
    if (s.liberation) {
      await releaseAll();
      if (s.liberation.stage !== libStage) {
        libStage = s.liberation.stage;
        await sleep(350);
        await shot(`lib_${String(done.size).padStart(2, '0')}_${libStage}`);
        done.add(libStage + s.liberation.dialogueIndex);
      }
      if (/dialogue|codex|result/i.test(s.liberation.stage)) { await sleep(900); await page.keyboard.press('Enter'); }
      if (/result/i.test(s.liberation.stage) || s.resultText) { await sleep(500); await shot('result'); break; }
      await sleep(120);
      continue;
    }
    if (s.outcome === 'defeat') {
      deaths++;
      await releaseAll(); await sleep(400); await shot(`defeat_${deaths}`);
      if (deaths >= 3) break;
      await page.keyboard.press('Enter'); await sleep(900); continue;
    }
    await hold('Space', true);
    const px = s.player.x, py = s.player.y;
    if (s.reverse.state === 'READY' && s.reverse.meter >= 100) await page.keyboard.press('k');
    let tx = 100, ty = s.boss.y;
    if (s.reverse.state === 'SLOW') {
      const cap = s.enemyBolts.filter(b => b.capturable).sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0];
      if (cap) { tx = cap.x; ty = cap.y; }
      if (s.nokia && slowShots < 3) { slowShots++; await sleep(slowShots === 1 ? 250 : 450); await shot(`slow_${slowShots}`); }
    } else {
      for (const b of s.enemyBolts) if (!b.capturable && b.x > px - 10 && b.x - px < 70 && Math.abs(b.y - py) < 22) ty = clamp(b.y > py ? py - 50 : py + 50, 30, 160);
    }
    await steer(px, py, tx, clamp(ty, 30, 160), s.reverse.state === 'SLOW' ? 4 : 7);
    const tag = `p${s.phase}`;
    if (s.shieldUp && s.phase >= 2 && !done.has('shield' + s.phase)) { done.add('shield' + s.phase); await shot(`amaru_${tag}_shield`); }
    if (s.vulnerable && !s.nokia && !done.has('vuln' + s.phase)) { done.add('vuln' + s.phase); await shot(`amaru_${tag}_vulnerable`); }
    if (s.attack?.kind && /wave/i.test(s.attack.kind) && s.attack.stage === 'action' && !done.has('wave')) { done.add('wave'); await shot(`amaru_${tag}_wave`); }
    if (s.realClock >= nextAt) { await shot(`amaru_${tag}_${String(Math.round(s.realClock / 1000)).padStart(3, '0')}s`); nextAt += 2200; }
    await sleep(30);
  }
  await releaseAll();
  console.log('final', last && { phase: last.phase, bossHP: last.bossHP, hp: last.heroHP, outcome: last.outcome });
}
console.log('errors', JSON.stringify(errors));
await browser.close();
