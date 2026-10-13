// Original synthesized effects: oscillators and filtered noise generated at runtime.
// No audio files, samples, libraries or third-party material, so there is nothing to license or credit.

export type SfxName = 'shot' | 'bossHit' | 'reflectHit' | 'heroHit' | 'capture' | 'shiftOn' | 'release' | 'charge'
  | 'bossFire' | 'victory' | 'defeat' | 'select' | 'fragment' | 'enemyHit' | 'enemyDown' | 'firewall' | 'pause';

export interface Voice { wave: 'square' | 'triangle' | 'sawtooth' | 'sine' | 'noise'; from: number; to: number; at: number; dur: number; gain: number }
// For 'noise', from/to are the low-pass cutoff sweep in Hz instead of a pitch.
const v = (wave: Voice['wave'], from: number, to: number, at: number, dur: number, gain: number): Voice => ({ wave, from, to, at, dur, gain });

export const RECIPES: Readonly<Record<SfxName, readonly Voice[]>> = Object.freeze({
  shot: [v('square', 880, 300, 0, 0.07, 0.3)],
  bossHit: [v('sawtooth', 180, 90, 0, 0.1, 0.45), v('noise', 2000, 400, 0, 0.09, 0.4)],
  reflectHit: [v('sawtooth', 300, 60, 0, 0.25, 0.55), v('noise', 3500, 300, 0, 0.2, 0.5), v('square', 900, 200, 0, 0.15, 0.35)],
  heroHit: [v('sawtooth', 200, 50, 0, 0.3, 0.55), v('noise', 1800, 300, 0, 0.15, 0.4)],
  capture: [v('sine', 400, 1200, 0, 0.12, 0.5)],
  shiftOn: [v('triangle', 200, 800, 0, 0.25, 0.5), v('sine', 400, 1600, 0.05, 0.25, 0.35)],
  release: [v('square', 1200, 300, 0, 0.12, 0.35)],
  charge: [v('sawtooth', 80, 240, 0, 0.8, 0.22), v('noise', 300, 1800, 0, 0.8, 0.12)],
  bossFire: [v('sawtooth', 140, 70, 0, 0.2, 0.45), v('noise', 1500, 300, 0, 0.12, 0.35)],
  victory: [v('square', 392, 392, 0, 0.14, 0.4), v('square', 523, 523, 0.12, 0.14, 0.4), v('square', 659, 659, 0.24, 0.14, 0.4), v('square', 784, 784, 0.36, 0.14, 0.4), v('square', 1046, 1046, 0.48, 0.45, 0.45)],
  defeat: [v('sawtooth', 300, 60, 0, 0.7, 0.45), v('triangle', 200, 40, 0.1, 0.8, 0.4)],
  select: [v('square', 660, 880, 0, 0.06, 0.35)],
  // Route cues: a bright two-step chime, a short tick, a downward pop, a buzzing barrier and a soft pause blip.
  fragment: [v('triangle', 880, 880, 0, 0.06, 0.4), v('triangle', 1320, 1320, 0.05, 0.1, 0.4)],
  enemyHit: [v('square', 420, 300, 0, 0.05, 0.3)],
  enemyDown: [v('square', 600, 120, 0, 0.14, 0.4), v('noise', 2500, 400, 0, 0.1, 0.3)],
  firewall: [v('sawtooth', 110, 90, 0, 0.18, 0.4), v('noise', 1200, 600, 0, 0.12, 0.25)],
  pause: [v('sine', 520, 390, 0, 0.08, 0.35)],
});
export const SFX_NAMES = Object.keys(RECIPES) as SfxName[];

export const MAX_VOICES = 12;
const MIN_GAP_S = 0.05;
const MASTER_GAIN = 0.16;

const defaultFactory = (): AudioContext | null => {
  try {
    const Ctor = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch { return null; }
};

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  private active = true;
  private played = 0;
  private endTimes: number[] = [];
  private lastAt = new Map<SfxName, number>();

  constructor(private readonly factory: () => AudioContext | null = defaultFactory) {}

  setMuted(value: boolean): void { this.muted = value; }
  isMuted(): boolean { return this.muted; }
  // Focus loss suspends the context so sound pauses together with the game clock.
  setActive(value: boolean): void {
    this.active = value;
    if (!this.ctx) return;
    void (value ? this.ctx.resume() : this.ctx.suspend());
  }
  stats(): { played: number; muted: boolean; state: string } { return { played: this.played, muted: this.muted, state: this.ctx?.state ?? 'none' }; }

  // Called from input handlers, which satisfies browser autoplay rules for lazy creation.
  play(name: SfxName): void {
    if (this.muted || !this.active) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const recipe = RECIPES[name];
    if (now - (this.lastAt.get(name) ?? -Infinity) < MIN_GAP_S) return;
    this.endTimes = this.endTimes.filter(end => end > now);
    if (this.endTimes.length + recipe.length > MAX_VOICES) return;
    this.lastAt.set(name, now);
    const t0 = now + 0.005;
    for (const voice of recipe) this.schedule(ctx, this.master, voice, t0);
    this.played++;
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const ctx = this.factory();
    if (!ctx) return null;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = MASTER_GAIN;
    this.master.connect(ctx.destination);
    return ctx;
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const length = Math.max(1, Math.floor(ctx.sampleRate * 0.5));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
    return (this.noise = buffer);
  }

  private schedule(ctx: AudioContext, master: GainNode, voice: Voice, t0: number): void {
    const start = t0 + voice.at, end = start + voice.dur;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(voice.gain, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    let source: AudioScheduledSourceNode;
    if (voice.wave === 'noise') {
      const buffer = ctx.createBufferSource();
      buffer.buffer = this.noiseBuffer(ctx); buffer.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(voice.from, start);
      filter.frequency.exponentialRampToValueAtTime(voice.to, end);
      buffer.connect(filter); filter.connect(gain);
      source = buffer;
    } else {
      const osc = ctx.createOscillator();
      osc.type = voice.wave;
      osc.frequency.setValueAtTime(voice.from, start);
      osc.frequency.exponentialRampToValueAtTime(voice.to, end);
      osc.connect(gain);
      source = osc;
    }
    gain.connect(master);
    source.start(start); source.stop(end + 0.02);
    this.endTimes.push(end + 0.02);
  }
}

// One session-wide instance; mute state resets on refresh like the achievements.
export const sfx = new Sfx();
