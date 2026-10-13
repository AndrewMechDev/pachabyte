// Session-only progress; resets on refresh. Amaru stays directly reachable from the map at all times.
export interface Progress { route: boolean; guardian: boolean }
export const initialProgress = (): Progress => ({ route: false, guardian: false });
export function completeRoute(progress: Progress): Progress { return { ...progress, route: true }; }
export function freeGuardian(progress: Progress): Progress { return { ...progress, guardian: true }; }
// The Arequipa node stays corrupted (purple) until Amaru is freed.
export function nodeState(progress: Progress): 'corrupted' | 'restored' { return progress.guardian ? 'restored' : 'corrupted'; }
