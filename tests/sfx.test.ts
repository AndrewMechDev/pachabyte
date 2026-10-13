import { describe, expect, it } from 'vitest';
import { MAX_VOICES, RECIPES, SFX_NAMES, Sfx } from '../src/game/sfx';

const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
function fakeContext() {
  const state = { oscillators: 0, noise: 0, resumed: 0, suspended: 0 };
  const node = () => ({ connect() { return this; }, disconnect() {}, gain: param(), frequency: param(), type: '', buffer: null as unknown, start() {}, stop() {} });
  const ctx = {
    currentTime: 0, state: 'running', destination: {},
    createGain: node, createBiquadFilter: node,
    createOscillator() { state.oscillators++; return node(); },
    createBufferSource() { state.noise++; return node(); },
    createBuffer: (_c: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
    resume() { state.resumed++; return Promise.resolve(); },
    suspend() { state.suspended++; return Promise.resolve(); },
    sampleRate: 8000,
  };
  return { ctx, state };
}

describe('sound recipes', () => {
  it('covers the flight route cues and drops the retired platformer ones', () => {
    for (const name of ['fragment', 'enemyHit', 'enemyDown', 'firewall', 'pause']) expect(SFX_NAMES).toContain(name);
    for (const name of ['jump', 'land', 'targetHit', 'complete']) expect(SFX_NAMES).not.toContain(name);
  });
  it('defines a bounded recipe for every named effect', () => {
    expect(SFX_NAMES.length).toBe(17);
    for (const name of SFX_NAMES) {
      const voices = RECIPES[name];
      expect(voices.length).toBeGreaterThan(0);
      for (const v of voices) {
        expect(v.from).toBeGreaterThanOrEqual(20); expect(v.from).toBeLessThanOrEqual(8000);
        expect(v.to).toBeGreaterThanOrEqual(20); expect(v.to).toBeLessThanOrEqual(8000);
        expect(v.gain).toBeGreaterThan(0); expect(v.gain).toBeLessThanOrEqual(1);
        expect(v.at).toBeGreaterThanOrEqual(0); expect(v.dur).toBeGreaterThan(0);
        expect(v.at + v.dur).toBeLessThanOrEqual(1.2);
      }
    }
  });
});

describe('Sfx', () => {
  it('stays silent and safe when Web Audio is unavailable', () => {
    const sfx = new Sfx(() => null);
    expect(() => sfx.play('shot')).not.toThrow();
    expect(sfx.stats().played).toBe(0);
  });
  it('creates the context lazily from the first play and schedules every voice', () => {
    const { ctx, state } = fakeContext(); let created = 0;
    const sfx = new Sfx(() => { created++; return ctx as unknown as AudioContext; });
    expect(created).toBe(0);
    sfx.play('victory');
    expect(created).toBe(1);
    expect(state.oscillators).toBe(RECIPES.victory.length);
    expect(sfx.stats().played).toBe(1);
  });
  it('does not play while muted or inactive, and resumes after being re-enabled', () => {
    const { ctx } = fakeContext(); const sfx = new Sfx(() => ctx as unknown as AudioContext);
    sfx.setMuted(true); sfx.play('shot');
    expect(sfx.stats()).toMatchObject({ played: 0, muted: true });
    sfx.setMuted(false); sfx.setActive(false); sfx.play('shot');
    expect(sfx.stats().played).toBe(0);
    sfx.setActive(true); sfx.play('shot');
    expect(sfx.stats().played).toBe(1);
  });
  it('suspends the context while inactive and resumes it when active again', () => {
    const { ctx, state } = fakeContext(); const sfx = new Sfx(() => ctx as unknown as AudioContext);
    sfx.play('select'); ctx.currentTime = 1;
    sfx.setActive(false); expect(state.suspended).toBe(1);
    sfx.setActive(true); expect(state.resumed).toBeGreaterThan(0);
  });
  it('rate-limits one effect and caps simultaneous voices', () => {
    const { ctx, state } = fakeContext(); const sfx = new Sfx(() => ctx as unknown as AudioContext);
    sfx.play('shot'); sfx.play('shot');
    expect(sfx.stats().played).toBe(1);
    for (const name of SFX_NAMES) { ctx.currentTime += 0.001; sfx.play(name); }
    expect(state.oscillators + state.noise).toBeLessThanOrEqual(MAX_VOICES + RECIPES.shot.length);
  });
  it('allows the same effect again after its minimum gap', () => {
    const { ctx } = fakeContext(); const sfx = new Sfx(() => ctx as unknown as AudioContext);
    sfx.play('shot'); ctx.currentTime = 1; sfx.play('shot');
    expect(sfx.stats().played).toBe(2);
  });
});
