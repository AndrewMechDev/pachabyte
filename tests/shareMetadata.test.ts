import { expect, it } from 'vitest';
// This project intentionally has DOM-only types and no @types/node dependency. Declare the tiny read-only test bridge.
interface NativeFiles { existsSync(path: string): boolean; readFileSync(path: string): Uint8Array; readFileSync(path: string, encoding: 'utf8'): string }
const fsModule: string = 'node:fs', processModule: string = 'node:process';
const files: NativeFiles = await import(fsModule);
const runtime: { env: Record<string, string | undefined> } = await import(processModule);
const { existsSync, readFileSync } = files;

// Source checks run with the unit suite. PACHA_CHECK_DIST=1 repeats these exact assertions on built bytes.
const built = runtime.env.PACHA_CHECK_DIST === '1';
const html = readFileSync(built ? 'dist/index.html' : 'index.html', 'utf8');
const description = 'Arcade retroandino: guía a Kipu por Arequipa, repara las rutas y libera a Amaru.';
const tags = {
  description, 'og:title': 'PachaByte — Ruta 01', 'og:description': description,
  'og:type': 'website', 'og:url': 'https://andrewmechdev.github.io/pachabyte/',
  'og:image': 'https://andrewmechdev.github.io/pachabyte/social-preview.png', 'twitter:card': 'summary_large_image',
};
it.each(Object.entries(tags))('has exactly one correct Spanish/Pages metadata field %s', (key, value) => {
  const matches = [...html.matchAll(/<meta\b[^>]+>/g)].map(m => m[0]).filter(tag => tag.includes(`name="${key}"`) || tag.includes(`property="${key}"`));
  expect(matches, key).toHaveLength(1); expect(matches[0]).toContain(`content="${value}"`);
});

// Read-only native RGB/RGBA decoder verifies the supplied crop's pixels, not merely a convincing generated image.
const u32 = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
async function rgbPixels(png: Uint8Array): Promise<Uint8Array> {
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect([u32(png, 16), u32(png, 20)]).toEqual([1200, 630]);
  expect(png[24]).toBe(8); expect([2, 6]).toContain(png[25]); expect(png[28]).toBe(0);
  const channels = png[25] === 6 ? 4 : 3, width = 1200, height = 630, stride = width * channels;
  const idat: Uint8Array[] = [];
  for (let pos = 8; pos < png.length;) {
    const length = u32(png, pos);
    if (String.fromCharCode(...png.subarray(pos + 4, pos + 8)) === 'IDAT') idat.push(png.subarray(pos + 8, pos + 8 + length));
    pos += length + 12;
  }
  const raw = new Uint8Array(await new Response(new Blob(idat as BlobPart[]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const data = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]; expect(filter).toBeLessThanOrEqual(4);
    for (let x = 0; x < stride; x++) {
      const offset = y * stride + x, a = x >= channels ? data[offset - channels] : 0;
      const b = y ? data[offset - stride] : 0, c = y && x >= channels ? data[offset - stride - channels] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const predictor = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      data[offset] = (raw[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
  }
  const rgb = new Uint8Array(width * height * 3); let opaque = true;
  for (let i = 0; i < width * height; i++) {
    rgb.set(data.subarray(i * channels, i * channels + 3), i * 3);
    if (channels === 4 && data[i * 4 + 3] !== 255) opaque = false;
  }
  expect(opaque).toBe(true); return rgb;
}
it('serves the exact1200x630 center crop of the authorized source, copied unchanged by the build', async () => {
  const path = built ? 'dist/social-preview.png' : 'public/social-preview.png';
  expect(existsSync(path), `missing ${path}`).toBe(true);
  const bytes = readFileSync(path), rgb = await rgbPixels(bytes);
  // User-selected public/02_amaru_escudo_roto.png is1920x1080. Center rectangle [360,225,1560,855], no redraw/rescale.
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', rgb as BufferSource))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  expect(hash).toBe('f315768f02e72c939d83f829d9ee968bc56425a3f3597b3b5908eda1ebb844df');
  if (built) expect(bytes).toEqual(readFileSync('public/social-preview.png'));
});
