// Session-wide "reduce motion" preference. Starts from the OS setting; the page button can override it.
// It gates decorative motion only (shake, flicker, sway, particles, squash/stretch), never gameplay telegraphs.
const systemPrefersReduced = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Motion {
  private value: boolean;
  constructor(initial: () => boolean = systemPrefersReduced) { this.value = initial(); }
  get reduced(): boolean { return this.value; }
  set(value: boolean): void { this.value = value; }
}

export const motion = new Motion();
