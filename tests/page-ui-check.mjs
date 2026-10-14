import { chromium } from 'playwright';

// Focused check of the HTML shell around the game (B3 page UI): logo title, night background, themed buttons and the
// "Ajustes" disclosure. It reads real DOM and computed styles; it never plays the game. Run against a production preview:
//   PACHA_URL=http://127.0.0.1:4191 [PACHA_BROWSER_CHANNEL=msedge] node tests/page-ui-check.mjs
// Limits: computed styles prove the declared focus ring, target sizes, contrast of text on the button face and the
// absence of `transition: all`; they cannot prove how a ring or glow *looks* against the art. Screenshots cover that.

const baseURL = process.env.PACHA_URL ?? 'http://127.0.0.1:4191';
const channel = process.env.PACHA_BROWSER_CHANNEL ?? 'msedge';
const launchOptions = process.env.PACHA_BROWSER_PATH ? { executablePath: process.env.PACHA_BROWSER_PATH } : { channel };

const results = [];
const errors = [];
const check = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: true });
    console.log(`PASS ${name}${detail ? ` (${detail})` : ''}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`FAIL ${name}: ${error instanceof Error ? error.message : error}`);
  }
};
const expect = (condition, message) => { if (!condition) throw new Error(message); };

// Visible nav controls: buttons and summaries that currently take up space.
const navControls = () => [...document.querySelectorAll('#navigation button, #navigation summary')]
  .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; })
  .map(el => { const r = el.getBoundingClientRect(); return { label: (el.textContent ?? '').trim(), height: r.height, right: r.right, left: r.left }; });

const browser = await chromium.launch({ ...launchOptions, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(5000);
  const responses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => responses.push({ url: response.url(), status: response.status() }));
  await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
  const button = name => page.getByRole('button', { name, exact: true });

  await check('a0) prototype eyebrow is current without claiming a local-only build', async () => {
    const copy = await page.locator('.eyebrow').innerText();
    expect(copy.trim() === 'PROTOTIPO · RUTA 01', `outdated eyebrow: ${JSON.stringify(copy)}`);
  });

  await check('a1) art disclosure is current and preserves pause, focus and achievement guidance', async () => {
    const copy = await page.locator('main > p.note').last().innerText();
    expect(copy.includes('Arte generado con IA y elementos procedurales.'), 'current AI/procedural art disclosure missing');
    expect(!copy.includes('Arte provisional original') && !copy.includes('no son spritesheets finales'), 'obsolete art disclaimer remains');
    for (const guidance of [
      'Haz clic o usa Tab sobre el juego para jugar.',
      'Al enfocar la navegación el juego se pausa; vuelve a enfocarlo para continuar.',
      'Esc también pausa.',
      'Los logros se reinician al recargar; Amaru siempre está disponible desde el mapa.',
    ]) expect(copy.includes(guidance), `missing guidance: ${guidance}`);
  });

  await check('a) one h1 whose only content is the logo image with alt "PachaByte"', async () => {
    const info = await page.evaluate(() => ({
      count: document.querySelectorAll('h1').length,
      alt: document.querySelector('h1 img')?.getAttribute('alt'),
      text: document.querySelector('h1')?.textContent?.trim(),
      width: document.querySelector('h1 img')?.getAttribute('width'),
      height: document.querySelector('h1 img')?.getAttribute('height'),
      natural: document.querySelector('h1 img') ? document.querySelector('h1 img').naturalWidth : 0,
      render: document.querySelector('h1 img')?.getBoundingClientRect().width ?? 0,
    }));
    expect(info.count === 1, `expected exactly one h1, found ${info.count}`);
    expect(info.alt === 'PachaByte', `h1 img alt is ${JSON.stringify(info.alt)}`);
    expect(info.text === '', `h1 must not repeat the name as visible text, found ${JSON.stringify(info.text)}`);
    expect(info.width === '320' && info.height === '107', `explicit width/height attributes are ${info.width}x${info.height}`);
    expect(info.natural === 320, `the logo did not load (naturalWidth ${info.natural})`);
    expect(await page.getByRole('heading', { level: 1, name: 'PachaByte', exact: true }).count() === 1, 'accessible h1 name is not "PachaByte"');
    return `rendered ${Math.round(info.render)} px wide`;
  });

  await check('b1) #settings exists, is closed by default and hides both toggles', async () => {
    const info = await page.evaluate(() => { const d = document.getElementById('settings'); return d ? { tag: d.tagName, open: d.open, summary: d.querySelector(':scope > summary')?.textContent?.trim() } : null; });
    expect(info, '#settings is missing');
    expect(info.tag === 'DETAILS' && info.summary === 'Ajustes', `expected <details> with summary "Ajustes", got ${JSON.stringify(info)}`);
    expect(info.open === false, '#settings must be closed by default');
    expect(!(await button('Sonido: sí').isVisible()), '"Sonido: sí" must be hidden while closed');
    expect(!(await button('Reducir movimiento: no').isVisible()), '"Reducir movimiento: no" must be hidden while closed');
  });

  await check('b2) keyboard (Enter on the summary) opens Ajustes and shows both toggles', async () => {
    await page.locator('#settings > summary').focus();
    await page.keyboard.press('Enter');
    expect(await page.locator('#settings').evaluate(d => d.open), '#settings did not open on Enter');
    expect(await button('Sonido: sí').isVisible(), '"Sonido: sí" not visible after opening');
    expect(await button('Reducir movimiento: no').isVisible(), '"Reducir movimiento: no" not visible after opening');
  });

  await check('b3) toggles keep aria-pressed behaviour and return focus to the game', async () => {
    expect(await button('Sonido: sí').getAttribute('aria-pressed') === 'true', 'Sonido starts pressed');
    await button('Sonido: sí').click();
    expect(await button('Sonido: no').getAttribute('aria-pressed') === 'false', 'Sonido: no must have aria-pressed false');
    expect(await page.evaluate(() => document.activeElement?.id) === 'game', 'the game must regain focus after Sonido');
    await button('Sonido: no').click();
    expect(await button('Sonido: sí').getAttribute('aria-pressed') === 'true', 'Sonido restores to pressed');
    await button('Reducir movimiento: no').click();
    expect(await button('Reducir movimiento: sí').getAttribute('aria-pressed') === 'true', 'Reducir movimiento: sí is pressed');
    expect(await page.evaluate(() => document.activeElement?.id) === 'game', 'the game must regain focus after Reducir movimiento');
    await button('Reducir movimiento: sí').click();
    expect(await button('Reducir movimiento: no').getAttribute('aria-pressed') === 'false', 'Reducir movimiento restores');
  });

  await check('c) every visible nav button and summary is at least 44 px high (Ajustes closed and open)', async () => {
    const open = await page.locator('#settings').evaluate(d => d.open);
    const sample = async () => page.evaluate(navControls);
    const openState = await sample();
    await page.evaluate(() => { document.getElementById('settings').open = false; });
    const closedState = await sample();
    await page.evaluate(() => { document.getElementById('settings').open = true; });
    const all = [...closedState, ...openState];
    const small = all.filter(c => c.height < 43.99);
    expect(small.length === 0, `too short: ${small.map(c => `${c.label} ${c.height}px`).join(', ')}`);
    expect(openState.length >= 3 && closedState.length >= 3, 'the nav controls were not found');
    if (!open) await page.evaluate(() => { document.getElementById('settings').open = false; });
    return `${openState.length} open / ${closedState.length} closed controls`;
  });

  await check('d) no horizontal overflow at 1000, 600 and 470 px (Ajustes closed and open)', async () => {
    for (const width of [1000, 600, 470]) {
      for (const open of [false, true]) {
        await page.setViewportSize({ width, height: 800 });
        await page.evaluate(isOpen => { document.getElementById('settings').open = isOpen; }, open);
        const metrics = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
        metrics.controls = await page.evaluate(navControls);
        expect(metrics.scroll <= metrics.inner, `${width}px (${open ? 'open' : 'closed'}): scrollWidth ${metrics.scroll} > ${metrics.inner}`);
        const outside = metrics.controls.filter(c => c.left < -0.5 || c.right > metrics.inner + 0.5);
        expect(outside.length === 0, `${width}px (${open ? 'open' : 'closed'}): controls outside the viewport: ${outside.map(c => c.label).join(', ')}`);
      }
    }
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.evaluate(() => { document.getElementById('settings').open = false; });
  });

  await check('e) no stylesheet rule sets transition-property to "all"', async () => {
    const report = await page.evaluate(() => {
      let scanned = 0; const bad = [];
      const walk = rules => { for (const rule of rules) {
        if (rule.cssRules) walk(rule.cssRules);
        if (!rule.style) continue;
        scanned += 1;
        const property = rule.style.transitionProperty;
        if (property && property.split(',').map(s => s.trim()).includes('all')) bad.push(rule.selectorText);
        if (/transition:[^;]*\ball\b/.test(rule.cssText)) bad.push(rule.selectorText);
      } };
      for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch { bad.push('unreadable sheet'); } }
      return { scanned, bad };
    });
    expect(report.scanned > 10, `only ${report.scanned} rules scanned; the stylesheet may be unreadable`);
    expect(report.bad.length === 0, `transition "all" in: ${report.bad.join(', ')}`);
    return `${report.scanned} rules scanned`;
  });

  await check('f) body paints the night background image and the file loaded', async () => {
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
    expect(background.includes('url('), `body background-image is ${background}`);
    const loaded = responses.find(r => /page-bg.*\.webp/.test(r.url));
    expect(loaded && loaded.status === 200, 'the page background webp was not fetched with status 200');
    return loaded.url.split('/').slice(-2).join('/');
  });

  await check('g) :focus-visible gives nav buttons and the summary a visible, unclipped ring', async () => {
    await page.keyboard.press('Shift'); // keyboard modality, so programmatic focus matches :focus-visible
    for (const selector of ['#navigation button[data-view="route"]', '#settings > summary']) {
      await page.locator(selector).focus();
      const style = await page.locator(selector).evaluate(el => {
        const cs = getComputedStyle(el);
        return { visible: el.matches(':focus-visible'), outlineStyle: cs.outlineStyle, outlineWidth: parseFloat(cs.outlineWidth), boxShadow: cs.boxShadow, clipPath: cs.clipPath };
      });
      expect(style.visible, `${selector} does not match :focus-visible`);
      const ring = (style.outlineStyle !== 'none' && style.outlineWidth >= 2) || style.boxShadow !== 'none';
      expect(ring, `${selector} has no outline or box-shadow when focused`);
      // clip-path would clip an outline or an outer shadow, so the focused element itself must not be clipped.
      expect(style.clipPath === 'none', `${selector} is clipped (${style.clipPath}) so its ring would be cut`);
    }
  });

  await check('h) text on every visible button face keeps WCAG AA contrast (4.5:1) in its current state', async () => {
    await page.evaluate(() => { document.getElementById('settings').open = true; });
    await page.waitForTimeout(400); // let the 120 ms colour transitions finish so computed colours are settled
    const rows = await page.evaluate(() => {
      // Computed colours arrive as rgb()/rgba(), or as color(srgb r g b / a) with 0-1 channels for color-mix().
      const parse = value => {
        const m = value.match(/(rgba?|color\(srgb)[ (]+([^)]+)\)?/); if (!m) return null;
        const p = m[2].split(/[ ,/]+/).filter(Boolean).map(Number);
        const k = m[1] === 'color(srgb' ? 255 : 1;
        return { r: p[0] * k, g: p[1] * k, b: p[2] * k, a: p[3] ?? 1 };
      };
      const lum = ({ r, g, b }) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      return [...document.querySelectorAll('#navigation button, #navigation summary')].filter(el => el.getBoundingClientRect().width > 0).map(el => {
        const text = parse(getComputedStyle(el).color);
        // The face is the ::after layer when present; otherwise the element's own background.
        const layer = parse(getComputedStyle(el, '::after').backgroundColor);
        const face = layer && layer.a > 0.5 ? layer : parse(getComputedStyle(el).backgroundColor);
        const l1 = lum(text), l2 = lum(face);
        return { label: (el.textContent ?? '').trim(), ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), face: face?.a };
      });
    });
    expect(rows.length >= 4, `only ${rows.length} controls measured`);
    const weak = rows.filter(r => r.ratio < 4.5 || !(r.face > 0.5));
    expect(weak.length === 0, `weak or unmeasurable: ${weak.map(r => `${r.label} ${r.ratio.toFixed(2)}`).join(', ')}`);
    await page.evaluate(() => { document.getElementById('settings').open = false; });
    return `lowest ${Math.min(...rows.map(r => r.ratio)).toFixed(1)}:1`;
  });

  await check('i) aria-pressed="true" has a non-colour marker that the unpressed state lacks', async () => {
    await page.evaluate(() => { document.getElementById('settings').open = true; });
    const marker = id => page.locator(`#${id}`).evaluate(el => ({ pressed: el.getAttribute('aria-pressed'), shadow: getComputedStyle(el, '::after').boxShadow, edge: getComputedStyle(el).getPropertyValue('--edge').trim() }));
    const on = await marker('sound'); const off = await marker('motion');
    expect(on.pressed === 'true' && off.pressed === 'false', 'precondition: Sonido pressed and Reducir movimiento not pressed');
    expect(on.shadow !== 'none' && off.shadow === 'none', `pressed marker missing (pressed: ${on.shadow}, unpressed: ${off.shadow})`);
    await page.evaluate(() => { document.getElementById('settings').open = false; });
  });

  await check('j) prefers-reduced-motion removes the button transitions', async () => {
    const calm = await browser.newPage({ viewport: { width: 1000, height: 800 }, reducedMotion: 'reduce' });
    await calm.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    const durations = await calm.evaluate(() => [...document.querySelectorAll('#navigation button, #navigation summary')].map(el => getComputedStyle(el).transitionDuration));
    await calm.close();
    expect(durations.length > 0 && durations.every(d => d.split(',').every(v => parseFloat(v) === 0)), `non-zero durations under reduced motion: ${durations.join(' | ')}`);
  });

  await check('l) opening Ajustes moves the canvas without misplacing taps (Phaser must refresh its cached bounds)', async () => {
    const tap = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    await tap.goto(`${baseURL}/?debug=1`, { waitUntil: 'networkidle' });
    await tap.waitForFunction(() => window.pachaDebug?.().scene === 'map');
    await tap.locator('#settings > summary').focus(); await tap.keyboard.press('Enter');
    // The canvas centre is empty map: no node may be hit, so the map must stay put and nothing may be selected or started.
    await tap.locator('#game canvas').first().click();
    await tap.waitForTimeout(300);
    const state = await tap.evaluate(() => { const s = window.pachaDebug(); return { scene: s.scene, selected: s.selectedNode }; });
    await tap.close();
    expect(state.scene === 'map' && state.selected === 'arequipa', `tap on empty map after opening Ajustes changed state: ${JSON.stringify(state)}`);
  });

  await check('m) native settings Enter returns focus without advancing the intro card', async () => {
    const story = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    try {
      await story.goto(`${baseURL}/?debug=1`, { waitUntil: 'networkidle' });
      await story.waitForFunction(() => window.pachaDebug?.().scene === 'map');
      await story.getByRole('button', { name: 'Jugar ruta', exact: true }).click();
      await story.waitForFunction(() => window.pachaDebug?.().scene === 'intro');
      const card = await story.evaluate(() => window.pachaDebug().card);
      await story.locator('#settings > summary').focus(); await story.keyboard.press('Enter', { delay: 80 });
      await story.getByRole('button', { name: 'Sonido: sí', exact: true }).focus();
      await story.keyboard.press('Enter', { delay: 80 });
      const state = await story.evaluate(() => window.pachaDebug());
      expect(state.scene === 'intro' && state.card === card, `settings activation leaked into story: ${JSON.stringify({ scene: state.scene, card: state.card })}`);
      expect(state.audio.muted && state.focused, 'settings must be preserved and game focus restored');
    } finally { await story.close(); }
  });

  await check('k) no page or console errors were reported', async () => {
    expect(errors.length === 0, errors.join(' | '));
  });
} finally {
  await browser.close();
}

const failed = results.filter(r => !r.ok);
console.log(failed.length === 0 ? `\nPAGE UI CHECK: PASS (${results.length} assertions)` : `\nPAGE UI CHECK: FAIL (${failed.length} of ${results.length}): ${failed.map(r => r.name.split(')')[0] + ')').join(', ')}`);
process.exit(failed.length === 0 ? 0 : 1);
