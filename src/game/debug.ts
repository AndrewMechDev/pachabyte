// Read-only debug snapshots, only with ?debug=1. Automation must still drive the game through real input.
declare global { interface Window { readonly pachaDebug?: () => unknown } }

export const debugEnabled = (): boolean => new URLSearchParams(window.location.search).get('debug') === '1';

export function exposeDebug(snapshot: () => unknown): void {
  if (debugEnabled()) Object.defineProperty(window, 'pachaDebug', { configurable: true, value: snapshot });
}

export function clearDebug(): void { Reflect.deleteProperty(window, 'pachaDebug'); }
