// Original synthesized effects: oscillators and filtered noise generated at runtime.
// No audio files, samples, libraries or third-party material, so there is nothing to license or credit.

export type SfxName = 'shot' | 'bossHit' | 'reflectHit' | 'heroHit' | 'capture' | 'shiftOn' | 'release' | 'charge'
  | 'bossFire' | 'victory' | 'defeat' | 'select' | 'fragment' | 'enemyHit' | 'enemyDown' | 'firewall' | 'pause'
  | 'deflect' | 'shieldHit' | 'shieldBreak' | 'wave' | 'restore' | 'blip'
  | 'corruptorCharge' | 'corruptorShot' | 'sombraDodge' | 'sombraSplit' | 'comboUp'
  | 'pickupRafaga' | 'pickupEscudo' | 'pickupCorazon' | 'shieldAbsorb';

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
  // Amaru cues: a dull tick off the shield, a ringing crack, a glassy fracture, the wave's rumble,
  // a rising restoration chord and a short dialogue blip.
  deflect: [v('triangle', 1400, 1100, 0, 0.04, 0.25)],
  shieldHit: [v('square', 700, 350, 0, 0.12, 0.4), v('noise', 4000, 1500, 0, 0.08, 0.3)],
  shieldBreak: [v('noise', 6000, 500, 0, 0.45, 0.55), v('square', 1600, 200, 0, 0.35, 0.4), v('triangle', 900, 120, 0.05, 0.4, 0.35)],
  wave: [v('sawtooth', 60, 110, 0, 0.9, 0.3), v('noise', 400, 1200, 0, 0.9, 0.2)],
  restore: [v('triangle', 330, 330, 0, 0.3, 0.35), v('triangle', 415, 415, 0.15, 0.3, 0.35), v('triangle', 494, 494, 0.3, 0.3, 0.35), v('sine', 660, 990, 0.45, 0.6, 0.35)],
  blip: [v('square', 980, 980, 0, 0.03, 0.2)],
  // Route bugs (2026-10-13): the Corruptor's rising hum before a shot and its dull spit, the Sombra's glitch
  // chirp when it dodges and a doubled pop when it splits, and a two-step climb when the racha reaches a new tier.
  corruptorCharge: [v('sawtooth', 90, 260, 0, 0.55, 0.16), v('sine', 300, 700, 0, 0.55, 0.12)],
  corruptorShot: [v('square', 260, 110, 0, 0.16, 0.32), v('noise', 1400, 300, 0, 0.1, 0.22)],
  sombraDodge: [v('triangle', 700, 1400, 0, 0.06, 0.22), v('triangle', 1400, 700, 0.05, 0.06, 0.18)],
  sombraSplit: [v('square', 500, 160, 0, 0.16, 0.32), v('square', 750, 240, 0.03, 0.16, 0.28), v('noise', 3000, 600, 0, 0.12, 0.22)],
  comboUp: [v('square', 660, 660, 0, 0.06, 0.28), v('square', 990, 990, 0.06, 0.1, 0.3)],
  // Rare pickups (2026-10-13): a fast three-step climb for the Ráfaga, a glassy shimmer for the Escudo, a warm
  // two-note rise for the Corazón, and a dull crack when the Escudo takes a hit in Kipu's place.
  pickupRafaga: [v('square', 520, 520, 0, 0.05, 0.28), v('square', 700, 700, 0.05, 0.05, 0.28), v('square', 940, 1400, 0.1, 0.1, 0.3)],
  pickupEscudo: [v('triangle', 600, 1200, 0, 0.18, 0.35), v('sine', 1200, 1800, 0.04, 0.2, 0.22)],
  pickupCorazon: [v('triangle', 523, 523, 0, 0.1, 0.4), v('triangle', 784, 784, 0.09, 0.18, 0.4)],
  shieldAbsorb: [v('noise', 5000, 800, 0, 0.18, 0.4), v('triangle', 1100, 300, 0, 0.2, 0.35)],
});
export const SFX_NAMES = Object.keys(RECIPES) as SfxName[];

export const MAX_VOICES = 12;
const MIN_GAP_S = 0.05;
export const MASTER_GAIN = 0.16;
// "Audio se amortigua": the master gain drops while REVERSE is SLOW.
export const DUCKED_GAIN = 0.05;
const DUCK_RAMP_S = 0.06;

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
  private ducked = false;
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
  stats(): { played: number; muted: boolean; ducked: boolean; gain: number; state: string } {
    return { played: this.played, muted: this.muted, ducked: this.ducked, gain: this.target(), state: this.ctx?.state ?? 'none' };
  }

  setDucked(value: boolean): void {
    if (this.ducked === value) return;
    this.ducked = value;
    if (!this.ctx || !this.master) return;
    const gain = this.master.gain, now = this.ctx.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(this.target(), now + DUCK_RAMP_S);
  }

  private target(): number { return this.ducked ? DUCKED_GAIN : MASTER_GAIN; }

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
    this.master.gain.value = this.target();
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
