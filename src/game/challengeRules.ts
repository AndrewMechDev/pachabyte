export interface Progress { training: boolean; guardian: boolean }
export const initialProgress = (): Progress => ({ training: false, guardian: false });
export function completeTraining(progress: Progress, hits: number): Progress { return { ...progress, training: progress.training || hits >= 4 }; }
export function guardianAvailable(_progress: Progress): boolean { return true; }
