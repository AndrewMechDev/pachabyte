// Minimal decoder for the prepared PNGs (8-bit RGBA, non-interlaced, as written by tools/prepare_sprite.py), using only
// web APIs (base64 data URLs from Vite's `?inline` imports and DecompressionStream), so no Node typings are needed.
export interface Png { width: number; height: number; data: Uint8Array }

const u32 = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;

export async function decodePng(dataUrl: string): Promise<Png> {
  const buf = Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), c => c.charCodeAt(0));
  let pos = 8, width = 0, height = 0;
  const idat: Uint8Array[] = [];
  while (pos < buf.length) {
    const len = u32(buf, pos), type = String.fromCharCode(...buf.subarray(pos + 4, pos + 8)), body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = u32(body, 0); height = u32(body, 4);
      if (body[8] !== 8 || body[9] !== 6 || body[12] !== 0) throw new Error('expected an 8-bit RGBA, non-interlaced PNG');
    } else if (type === 'IDAT') idat.push(body);
    pos += 12 + len;
  }
  const raw = new Uint8Array(await new Response(new Blob(idat as BlobPart[]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const stride = width * 4, data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? data[y * stride + x - 4] : 0, b = y > 0 ? data[(y - 1) * stride + x] : 0, c = x >= 4 && y > 0 ? data[(y - 1) * stride + x - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      data[y * stride + x] = (line[x] + pred) & 255;
    }
  }
  return { width, height, data };
}
