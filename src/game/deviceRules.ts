import { GAME } from './rules';

export const DEVICE_NOTICE = 'PachaByte se juega con teclado: ábrelo en una computadora.';
export interface DeviceFit { coarsePointer: boolean; canvasWidth: number; canvasHeight: number; viewportHeight: number }
// Advisory only: native320x180 must fit the actual responsive host and viewport. Never disable the game.
export const needsKeyboardNotice = ({ coarsePointer, canvasWidth, canvasHeight, viewportHeight }: DeviceFit): boolean =>
  coarsePointer || canvasWidth < GAME.width || Math.min(canvasHeight, viewportHeight) < GAME.height;
