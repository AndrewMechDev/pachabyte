import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.PACHA_URL ?? 'http://127.0.0.1:4173';
const channel = process.env.PACHA_BROWSER_CHANNEL ?? 'msedge';
const launchOptions = process.env.PACHA_BROWSER_PATH
  ? { executablePath: process.env.PACHA_BROWSER_PATH }
  : { channel };
const passed = [];
const errors = [];
let browser;
let page;
let stage = 'browser launch';

// Only inspect actual snapshots. Every gameplay action goes through keyboard input.
try {
  browser = await chromium.launch({ ...launchOptions, headless: true });
  page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const wait = (predicate, argument) => page.waitForFunction(predicate, argument, { timeout: 12000 });
  const snapshot = () => page.evaluate(() => window.pachaDebug());
  const settle = ms => new Promise(resolve => setTimeout(resolve, ms));
  const checkKipu = state => {
    // Animation swaps only among same-sized frames derived from the preserved Kipu art.
    assert.ok(['kipu-evaluation', 'kipu-evaluation-bob', 'kipu-evaluation-squash', 'kipu-evaluation-stretch'].includes(state.player.texture), `unexpected Kipu texture ${state.player.texture}`);
    assert.equal(state.player.nativeWidth, 32);
    assert.equal(state.player.nativeHeight, 40);
    assert.equal(state.player.displayWidth, 32);
    assert.equal(state.player.displayHeight, 40);
    assert.equal(state.player.bodyWidth, 12);
    assert.equal(state.player.bodyHeight, 18);
    assert.ok(Math.abs(state.player.bodyRelativeX + 6) < 0.01);
    assert.ok(Math.abs(state.player.bodyRelativeY + 8) < 0.01);
    assert.equal(state.player.flipX, state.player.facing === -1);
  };
  // Independently measure actual image pixels, rather than trusting a scene gap field.
  let alphaBottom;
  const checkGrounding = (state, context) => {
    const visibleBottom = state.player.y - state.player.displayOriginY
      + alphaBottom * state.player.displayHeight / state.player.nativeHeight;
    const gap = state.player.bodyBottom - visibleBottom;
    assert.ok(Math.abs(gap) <= 1, `${context}: occupied alpha edge gap ${gap} logical pixels`);
  };
  const restart = async () => {
    const previousRun = (await snapshot()).sceneRun;
    await page.keyboard.press('r');
    await wait(previous => window.pachaDebug?.().sceneRun > previous && window.pachaDebug().player.grounded, previousRun);
    const state = await snapshot();
    assert.equal(state.targetCount, 4);
    assert.equal(state.bulletCount, 0);
    assert.equal(state.allocatedBullets, 12);
    assert.equal(state.player.facing, 1);
    assert.equal(state.hud.type, 'BitmapText');
    assert.equal(state.hud.text, 'KIPU  TARGETS 0/4');
    assert.equal(state.hud.fontSize, 6);
    checkKipu(state);
    checkGrounding(state, 'restart floor');
  };

  await page.goto(`${baseURL}/?debug=1${process.env.PACHA_RENDERER === 'canvas' ? '&renderer=canvas' : ''}`, { waitUntil: 'networkidle' });
  await page.locator('canvas').click();
  const actualRenderer = await page.locator('canvas').evaluate(canvas => canvas.getContext('webgl') || canvas.getContext('webgl2') ? 'webgl' : 'canvas');
  assert.equal(actualRenderer, process.env.PACHA_RENDERER === 'canvas' ? 'canvas' : 'webgl');
  await wait(() => window.pachaDebug?.().scene === 'map');
  stage = 'fresh direct access and semantic keyboard navigation';
  assert.deepEqual((await snapshot()).progress, {training:false,guardian:false});
  assert.equal((await snapshot()).locked, false);
  await page.locator('canvas').screenshot({ path: 'docs/phase3-map.png' });
  await page.keyboard.press('Enter');
  await wait(() => window.pachaDebug?.().scene === 'guardian');
  assert.match(await page.locator('#view-title').innerText(), /Amaru/);
  // Moving focus to native navigation must freeze combat and release all input.
  await page.keyboard.down('d');
  await wait(() => window.pachaDebug().player.velocityX > 0);
  await page.keyboard.press('Tab');
  await page.keyboard.up('d');
  await wait(() => !window.pachaDebug().focused);
  const navPaused = await snapshot(); await settle(350);
  assert.equal((await snapshot()).clock, navPaused.clock);
  assert.equal((await snapshot()).heroHP, navPaused.heroHP);
  assert.equal((await snapshot()).player.y, navPaused.player.y);
  await page.locator('#game').focus();
  await wait(clock => window.pachaDebug().focused && window.pachaDebug().clock > clock, navPaused.clock);
  assert.equal((await snapshot()).player.velocityX, 0);
  for (const key of ['Enter','Space']) {
    await page.getByRole('button',{name:'Choose challenge',exact:true}).focus();
    await page.keyboard.press(key);
    await wait(() => window.pachaDebug?.().scene === 'map');
    await page.getByRole('button',{name:'Play Amaru',exact:true}).focus();
    await page.keyboard.press(key);
    await wait(() => window.pachaDebug?.().scene === 'guardian');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'game');
  }
  await page.getByRole('button',{name:'Choose challenge',exact:true}).click();
  await wait(() => window.pachaDebug?.().scene === 'map');
  assert.deepEqual((await snapshot()).progress,{training:false,guardian:false});
  await page.keyboard.press('2');
  await wait(() => window.pachaDebug?.().scene === 'guardian');
  await page.getByRole('button',{name:'Choose challenge',exact:true}).click();
  await wait(() => window.pachaDebug?.().scene === 'map');
  await page.keyboard.press('1');
  await wait(() => window.pachaDebug?.().scene === 'training' && window.pachaDebug().player.grounded);
  assert.match(await page.locator('#view-title').innerText(), /Arequipa/);
  assert.doesNotMatch(await page.locator('#view-help').innerText(), /PachaShift/);
  passed.push('fresh default Enter, direct 1/2, semantic Enter/Space, truthful achievements and navigation focus pause/resume');
  const initial = await snapshot();
  assert.equal(initial.background.key,'amaru-arena');
  assert.equal(initial.background.alpha,0.4);
  assert.equal(initial.background.scrollFactor,0.25);
  assert.match(initial.background.sourceURL,/arequipa-arena/);
  stage = 'compact native bitmap HUD';
  assert.equal(initial.hud.type, 'BitmapText');
  assert.equal(initial.hud.text, 'KIPU  TARGETS 0/4');
  assert.equal(initial.hud.font, 'pacha-retro');
  assert.equal(initial.hud.fontSize, 6);
  assert.ok(initial.hud.width === 102 && initial.hud.height <= 8);
  passed.push('compact native bitmap HUD without duplicated controls');
  stage = 'Kipu evaluation texture and preserved collision footprint';
  checkKipu(initial);
  const loadedArt = await page.evaluate(async sourceURL => {
    const image = new Image();
    image.src = sourceURL;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let bottom = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 0) bottom = y + 1;
      }
    }
    const sample = (x, y) => [...pixels.slice((y * canvas.width + x) * 4, (y * canvas.width + x) * 4 + 4)];
    return { bottom, leftEye: sample(22, 19), rightEye: sample(26, 20) };
  }, initial.player.sourceURL);
  alphaBottom = loadedArt.bottom;
  assert.deepEqual(loadedArt.leftEye, [250, 250, 250, 255]);
  assert.deepEqual(loadedArt.rightEye, [250, 250, 250, 255]);
  passed.push('actual loaded Kipu has both eye glints');
  assert.ok(alphaBottom > 0, 'loaded Kipu image must have occupied pixels');
  stage = 'occupied alpha grounding on floor';
  checkGrounding(initial, 'initial floor');
  if (process.env.PACHA_GROUND_SCREENSHOT) {
    await page.locator('canvas').screenshot({ path: process.env.PACHA_GROUND_SCREENSHOT });
  }
  passed.push('actual loaded alpha edge grounded on floor');
  passed.push('32x40 Kipu art with unchanged 12x18 collision footprint');
  assert.equal(initial.logicalWidth, 320);
  assert.equal(initial.logicalHeight, 180);
  assert.equal(await page.locator('canvas').getAttribute('width'), '320');
  assert.equal(initial.allocatedBullets, 12);
  passed.push('canvas boot and initial physics state');

  await page.keyboard.down('d');
  await wait(() => window.pachaDebug().player.x > 85);
  await page.keyboard.down('a');
  await wait(() => window.pachaDebug().player.velocityX === 0);
  assert.equal((await snapshot()).player.facing, 1);
  await page.keyboard.up('d');
  await wait(() => window.pachaDebug().player.x < 65);
  await page.keyboard.up('a');
  await wait(() => window.pachaDebug().player.velocityX === 0);
  assert.equal((await snapshot()).player.facing, -1);
  checkKipu(await snapshot());
  checkGrounding(await snapshot(), 'left-facing floor');
  passed.push('A/D movement, opposite cancellation, release and facing retention');

  await page.keyboard.down('ArrowRight');
  await wait(() => window.pachaDebug().player.x > 85);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowLeft');
  await wait(() => window.pachaDebug().player.x < 65);
  await page.keyboard.up('ArrowLeft');
  await wait(() => window.pachaDebug().player.velocityX === 0);
  passed.push('arrow-key movement');

  for (const jumpKey of ['Space', 'w', 'ArrowUp']) {
    stage = `jump binding ${jumpKey}`;
    await restart();
    await page.keyboard.down(jumpKey);
    await wait(() => window.pachaDebug().player.velocityY < -100);
    await page.keyboard.up(jumpKey);
    const airborne = await snapshot();
    await page.keyboard.down(jumpKey);
    await settle(80);
    const secondPress = await snapshot();
    assert.ok(secondPress.player.velocityY > airborne.player.velocityY, 'airborne repress must not reset jump velocity');
    await wait(() => window.pachaDebug().player.grounded);
    const landed = await snapshot();
    await settle(150);
    assert.ok(Math.abs((await snapshot()).player.y - landed.player.y) < 1, 'holding jump through landing must not auto-jump');
    await page.keyboard.up(jumpKey);
  }
  passed.push('all jump bindings, gravity/landing, no double jump or held auto-jump');

  stage = 'Kipu animation frames stay visual-only';
  await restart();
  const soundBefore = (await snapshot()).audio.played;
  await page.evaluate(() => { window.__frames = new Set(); const loop = () => { const frame = window.pachaDebug?.()?.kipuFrame; if (frame) window.__frames.add(frame); window.__raf = requestAnimationFrame(loop); }; loop(); });
  await page.keyboard.down('d');
  await wait(() => window.pachaDebug().player.x > 70);
  await page.keyboard.down('Space');
  await wait(() => window.pachaDebug().player.velocityY < -100);
  checkKipu(await snapshot());
  await page.keyboard.up('Space');
  await wait(() => window.pachaDebug().player.grounded);
  await settle(300);
  await page.keyboard.up('d');
  await wait(() => window.pachaDebug().player.velocityX === 0);
  const seenFrames = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return [...window.__frames]; });
  for (const frame of ['idle', 'bob', 'squash', 'stretch']) assert.ok(seenFrames.includes(frame), `Kipu frame ${frame} never rendered (saw ${seenFrames})`);
  const animated = await snapshot();
  checkKipu(animated);
  checkGrounding(animated, 'after animated landing');
  assert.ok(animated.fx.active <= animated.fx.capacity && animated.fx.capacity === 64);
  passed.push('Kipu idle/run/jump/land frames and bounded dust keep 32x40 art, 12x18 body and grounding');
  stage = 'synthesized sound effects and mute toggle';
  assert.ok(animated.audio.played > soundBefore, 'jump and landing must trigger synthesized sounds');
  assert.notEqual(animated.audio.state, 'none', 'Web Audio context must be created from real input');
  const soundButton = page.getByRole('button', { name: /^Sound:/ });
  await soundButton.click();
  assert.equal(await soundButton.innerText(), 'Sound: off');
  assert.equal(await soundButton.getAttribute('aria-pressed'), 'false');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'game');
  const mutedState = await snapshot();
  assert.equal(mutedState.audio.muted, true);
  await page.keyboard.press('j', { delay: 60 });
  await settle(200);
  assert.equal((await snapshot()).audio.played, mutedState.audio.played, 'muted game must stay silent');
  await soundButton.click();
  assert.equal(await soundButton.innerText(), 'Sound: on');
  await settle(100);
  await page.keyboard.press('j', { delay: 60 });
  await wait(before => window.pachaDebug().audio.played > before, mutedState.audio.played);
  passed.push('synthesized effects play from real input, mute toggle silences them and returns focus to the game');
  stage = 'platform landing';
  await restart();
  await page.keyboard.down('d');
  await wait(() => window.pachaDebug().player.x >= 95);
  await page.keyboard.down('Space');
  await wait(() => window.pachaDebug().player.x > 128 && window.pachaDebug().player.y < 115);
  await page.keyboard.up('d');
  await wait(() => window.pachaDebug().player.grounded && window.pachaDebug().player.y < 135);
  await page.keyboard.up('Space');
  await wait(() => window.pachaDebug().player.velocityX === 0);
  checkGrounding(await snapshot(), 'first platform landing');
  if (process.env.PACHA_PLATFORM_SCREENSHOT) {
    await page.locator('canvas').screenshot({ path: process.env.PACHA_PLATFORM_SCREENSHOT });
  }
  passed.push('landing on an elevated static platform with occupied alpha grounding');

  stage = 'right shooting and pool';
  await restart();
  await page.keyboard.press('j', { delay: 60 });
  await wait(() => window.pachaDebug().bullets.some(bullet => bullet.velocityX > 0));
  await wait(() => window.pachaDebug().hits === 1);
  await wait(() => window.pachaDebug().bulletCount === 0);
  assert.equal((await snapshot()).hits, 1);
  assert.equal((await snapshot()).hud.text, 'KIPU  TARGETS 1/4');
  passed.push('bitmap HUD updates actual target progress');
  await page.keyboard.down('j');
  let maxActive = 0;
  for (let sample = 0; sample < 25; sample += 1) {
    const state = await snapshot();
    maxActive = Math.max(maxActive, state.bulletCount);
    assert.ok(state.bulletCount <= state.bulletCapacity);
    assert.equal(state.allocatedBullets, 12);
    assert.equal(state.hits + state.targetCount, 4, 'each destroyed target must score exactly once');
    await settle(100);
  }
  await page.keyboard.up('j');
  await wait(() => window.pachaDebug().bulletCount === 0);
  assert.ok(maxActive > 0);
  passed.push(`right shots, target impact once, bounded pool (observed max ${maxActive}), TTL cleanup`);

  stage = 'left shooting';
  await page.keyboard.down('a');
  await wait(() => window.pachaDebug().player.facing === -1);
  await page.keyboard.up('a');
  await page.keyboard.down('z');
  await wait(() => window.pachaDebug().bullets.some(bullet => bullet.velocityX < 0));
  await page.keyboard.up('z');
  await wait(() => window.pachaDebug().bulletCount === 0);
  passed.push('left-facing Z shots and left-world-edge cleanup');

  stage = 'camera and world bounds';
  await restart();
  await page.keyboard.down('d');
  await wait(() => window.pachaDebug().player.x > 430);
  const scrolling = await snapshot();
  assert.ok(scrolling.cameraX > 200);
  assert.equal(scrolling.hudScrollFactor, 0);
  await wait(() => window.pachaDebug().player.x >= 953);
  assert.ok((await snapshot()).player.x <= 954.1);
  await page.keyboard.up('d');
  passed.push('wider-world camera follow, fixed HUD and right world bound');

  stage = 'blur lifecycle';
  await restart();
  await page.keyboard.down('d');
  await page.keyboard.down('j');
  await wait(() => window.pachaDebug().player.velocityX > 0 && window.pachaDebug().bulletCount > 0);
  // Dispatch the real browser blur event through the public lifecycle listener.
  // This verifies the handler, not OS-level focus behavior on every platform.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await wait(() => window.pachaDebug().player.velocityX === 0);
  await page.keyboard.up('d');
  await page.keyboard.up('j');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await wait(() => window.pachaDebug().bulletCount === 0);
  passed.push('blur lifecycle clears held movement and fire');

  stage = 'restart, resize, ordinary launch';
  for (let run = 0; run < 3; run += 1) await restart();
  passed.push('repeated restart restores targets, pool, facing and spawn');
  await page.setViewportSize({ width: 600, height: 700 });
  const bounds = await page.locator('canvas').boundingBox();
  assert.ok(bounds && Math.abs(bounds.width / bounds.height - 16 / 9) < 0.02);
  assert.ok(bounds.width <= 600 && bounds.x >= 0 && bounds.x + bounds.width <= 600, 'resized canvas must remain inside the viewport');
  passed.push('responsive canvas aspect ratio');
  if (process.env.PACHA_SCREENSHOT) {
    await mkdir(dirname(process.env.PACHA_SCREENSHOT), { recursive: true });
    await page.screenshot({ path: process.env.PACHA_SCREENSHOT, fullPage: true });
  }
  stage = 'real training completion and challenge return';
  await restart();
  await page.keyboard.down('j');
  await page.keyboard.down('d');
  await wait(() => window.pachaDebug().completed === true);
  await page.keyboard.up('d'); await page.keyboard.up('j');
  assert.equal((await snapshot()).hits, 4);
  assert.equal((await snapshot()).bulletCount, 0);
  await page.keyboard.press('Enter');
  await wait(() => window.pachaDebug?.().scene === 'map');
  assert.equal((await snapshot()).locked, false);
  assert.equal((await snapshot()).progress.training,true);
  await page.keyboard.press('2');
  await wait(() => window.pachaDebug?.().scene === 'guardian' && window.pachaDebug().player.grounded);
  stage = 'guardian two patterns and actual PachaShift return';
  await page.locator('canvas').screenshot({ path: 'docs/phase3-arena.png' });
  await page.evaluate(() => { window.__angles = { min: 0, max: 0 }; const loop = () => { const angle = window.pachaDebug?.()?.bossAngle; if (typeof angle === 'number') { window.__angles.min = Math.min(window.__angles.min, angle); window.__angles.max = Math.max(window.__angles.max, angle); } window.__raf = requestAnimationFrame(loop); }; loop(); });
  await wait(() => window.pachaDebug().clock > 2500);
  const angles = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__angles; });
  assert.ok((await snapshot()).audio.played > 0, 'guardian attack telegraph must be audible');
  assert.ok(angles.min < -5, `Amaru must rear back during anticipation (min ${angles.min})`);
  assert.ok(angles.max > 3, `Amaru must lunge on action (max ${angles.max})`);
  assert.ok(angles.min >= -12 && angles.max <= 12, 'Amaru visual rotation stays within its forgiving body range');
  const bossBody = (await snapshot()).boss; assert.equal(bossBody.width, 32); assert.equal(bossBody.height, 44);
  await page.keyboard.press('x');
  await wait(() => window.pachaDebug().shift.captured > 0);
  const shifted = await snapshot();
  assert.equal(shifted.nokia, true);
  assert.ok(shifted.shift.captured <= 3);
  assert.ok(shifted.enemies.every(bolt => Math.hypot(bolt.vx, bolt.vy) <= 38.51), 'active X slows old enemy projectiles to 0.35x');
  assert.equal(shifted.player.bodyWidth, 12); assert.equal(shifted.player.bodyHeight, 18);
  assert.equal(shifted.player.displayWidth, 32); assert.equal(shifted.player.displayHeight, 40);
  // Freeze through the real blur handler before screenshot overhead can expire X.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.locator('canvas').screenshot({ path: 'docs/phase3-nokia.png' });
  // Read actual rendered pixels, equally applicable to Canvas and WebGL.
  const colors = JSON.parse(execFileSync('python', ['-c',
    "from PIL import Image;import json; im=Image.open('docs/phase3-nokia.png').convert('RGB');print(json.dumps(sorted({(r<<16)|(g<<8)|b for r,g,b in im.getdata()})))"
  ], { encoding: 'utf8' }));
  assert.ok(colors.length > 0 && colors.every(c => [0x0f380f,0x306230,0x8bac0f,0x9bbc0f].includes(c)), `unexpected Nokia colors: ${colors.slice(0,12).map(c => c.toString(16)).join(',')} (${colors.length} colors)`);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await snapshot(); await settle(400);
  assert.equal((await snapshot()).clock,paused.clock);
  assert.equal((await snapshot()).player.y,paused.player.y);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await wait(() => window.pachaDebug().reflectedHits > 0);
  assert.ok((await snapshot()).bossHP <= 9);
  const reflected = await snapshot();
  assert.equal(reflected.bossHP, 12 - 3 * reflected.reflectedHits, 'each returned bolt deals three HP exactly once');
  await wait(() => window.pachaDebug().patternsSeen.includes('rune'));
  passed.push('two telegraphed patterns, real capture/return damage, rendered four-color Nokia and focus clock pause');
  stage = 'guardian victory and restart';
  await page.keyboard.down('j');
  await wait(() => window.pachaDebug().outcome === 'victory');
  await page.keyboard.up('j');
  const won = await snapshot(); assert.equal(won.bossHP,0); assert.equal(won.enemies.length,0); assert.equal(won.shots.length,0);
  await page.locator('canvas').screenshot({ path: 'docs/phase3-victory.png' });
  assert.ok((await snapshot()).fx.active > 0, 'victory must emit defeat bursts');
  await wait(() => window.pachaDebug().bossAlpha === 0);
  await page.keyboard.press('r');
  await wait(previous => window.pachaDebug?.().sceneRun > previous,won.sceneRun);
  assert.equal((await snapshot()).heroHP,3); assert.equal((await snapshot()).bossHP,12);
  stage = 'guardian defeat, retry and session progress';
  await wait(() => window.pachaDebug().outcome === 'defeat');
  const lost = await snapshot(); assert.equal(lost.enemies.length,0); assert.equal(lost.shots.length,0);
  await page.keyboard.press('r'); await wait(previous => window.pachaDebug?.().sceneRun > previous,lost.sceneRun);
  await page.keyboard.press('m'); await wait(() => window.pachaDebug?.().scene === 'map');
  assert.equal((await snapshot()).progress.guardian,true);
  passed.push('actual victory/defeat, bounded pools, terminal cleanup, retry and session-only map progression');
  stage = 'fresh refresh, actual prepared assets and 470px layout';
  await page.reload({waitUntil:'networkidle'});
  await wait(() => window.pachaDebug?.().scene === 'map');
  assert.deepEqual((await snapshot()).progress,{training:false,guardian:false});
  await page.setViewportSize({width:470,height:900});
  await page.getByRole('button',{name:'Play Amaru',exact:true}).click();
  await wait(() => window.pachaDebug?.().scene === 'guardian');
  assert.equal((await snapshot()).bossHP,12);
  const assets=(await snapshot()).assets;
  assert.equal(assets.background,'amaru-arena'); assert.equal(assets.head,'amaru-head');
  const dimensions=await page.evaluate(async urls => Promise.all(urls.map(async url => {const image=new Image();image.src=url;await image.decode();return [image.naturalWidth,image.naturalHeight];})),[assets.arenaURL,assets.headURL]);
  assert.deepEqual(dimensions,[[320,180],[64,64]]);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('button',{name:'Explore Arequipa',exact:true}).click();
  await wait(() => window.pachaDebug?.().scene === 'training');
  await page.getByRole('button',{name:'Choose challenge',exact:true}).click();
  await wait(() => window.pachaDebug?.().scene === 'map');
  passed.push('fresh refresh retains direct availability, optional route button, repeated scenes and no overflow at 470px');
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.getByRole('button',{name:'Play Amaru',exact:true}).click();
  await page.waitForFunction(() => document.getElementById('view-title').textContent.includes('Amaru'));
  assert.equal(await page.evaluate(() => 'pachaDebug' in window), false);
  assert.deepEqual(errors, []);
  passed.push('debug opt-in only and no browser errors');
  console.log(JSON.stringify({ status: 'passed', browser: await browser.version(), checks: passed }, null, 2));
} catch (error) {
  const lastState = await page?.evaluate(() => window.pachaDebug?.()).catch(() => undefined);
  console.error(JSON.stringify({ status: 'failed_or_unavailable', stage, passed, errors, lastState, error: String(error) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser?.close();
}
