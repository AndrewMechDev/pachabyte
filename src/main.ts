import Phaser from 'phaser';
import './style.css';
import { RouteScene } from './game/RouteScene';
import { MapScene } from './game/MapScene';
import { GuardianScene } from './game/GuardianScene';
import { IntroScene } from './game/IntroScene';
import { entryScene, INTRO_SEEN_KEY } from './game/introRules';
import { GAME } from './game/rules';
import { DEVICE_NOTICE, needsKeyboardNotice } from './game/deviceRules';
import { sfx } from './game/sfx';
import { motion } from './game/motion';
import { initialProgress } from './game/challengeRules';
import { RUN_KEY } from './game/routeRules';
import { VIEW_EVENT, FOCUS_EVENT, sceneForView, viewCopy, type ViewState, type View } from './game/viewState';

const host = document.getElementById('game');
if (!host) throw new Error('Game container is missing.');
const title = document.getElementById('view-title')!;
const help = document.getElementById('view-help')!;
const result = document.getElementById('view-result')!;
const achievements = document.getElementById('achievements')!;
let current: ViewState = {view:'map',outcome:'playing',progress:initialProgress()};
function render(state: ViewState): void {
  current = state;
  const copy = viewCopy(state);
  title.textContent = copy.title; help.textContent = copy.help; result.textContent = copy.result;
  // The canvas already shows the map card, its key bar and the intro help; the DOM lines stay for screen readers only.
  const canvasCovers = state.view==='map' || state.view==='intro';
  help.classList.toggle('sr-only',canvasCovers); result.classList.toggle('sr-only',canvasCovers);
  host!.setAttribute('aria-label', copy.title + '. Juego controlado con teclado.');
  achievements.textContent = `Logros de la sesión: Ruta ${state.progress.route?'completada':'pendiente'} · Amaru ${state.progress.guardian?'liberado':'pendiente'}`;
  document.getElementById('choose')!.hidden = state.view==='map';
  document.getElementById('retry')!.hidden = state.view==='map' || state.view==='intro';
  for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]'))) button.setAttribute('aria-pressed',String(button.dataset.view===(state.view==='intro'?'route':state.view)));
}
render(current);
// Private instance: the DOM bridge receives state events, never debug snapshots.
const game = new Phaser.Game({
  type: new URLSearchParams(location.search).get('renderer') === 'canvas' ? Phaser.CANVAS : Phaser.AUTO,
  parent: host, width: GAME.width, height: GAME.height,
  backgroundColor: '#284958', pixelArt: true, roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // Free flight: no gravity anywhere.
  physics: { default:'arcade', arcade:{ gravity:{x:0,y:0}, debug:false } },
  scene: [MapScene,IntroScene,RouteScene,GuardianScene],
});
game.events.on(VIEW_EVENT,render);
const deviceNotice = document.getElementById('device-notice')!;
const coarsePointer = window.matchMedia('(pointer: coarse)');
deviceNotice.textContent = DEVICE_NOTICE;
function refreshDeviceNotice(): void {
  const rect = host!.getBoundingClientRect();
  const visible = needsKeyboardNotice({ coarsePointer: coarsePointer.matches,
    canvasWidth: rect.width, canvasHeight: rect.height, viewportHeight: window.innerHeight });
  if (deviceNotice.hidden !== !visible) {
    deviceNotice.hidden = !visible;
    if (game.canvas) game.scale.updateBounds(); // Before boot the banner is already in flow; afterward refresh hit-test bounds.
  }
}
const deviceObserver = new ResizeObserver(refreshDeviceNotice);
deviceObserver.observe(host);
coarsePointer.addEventListener('change',refreshDeviceNotice);
window.addEventListener('resize',refreshDeviceNotice);
refreshDeviceNotice();
function focusState(): void {
  const active = document.hasFocus() && document.activeElement===host;
  if(game.input.keyboard) { game.input.keyboard.enabled=active; game.input.keyboard.preventDefault=active; }
  for(const scene of game.scene.getScenes(true)) scene.input.keyboard?.resetKeys();
  sfx.setActive(active);
  game.events.emit(FOCUS_EVENT,active);
}
function syncMotionButton():void {
  const button=document.getElementById('motion')!;
  button.textContent=motion.reduced?'Reducir movimiento: sí':'Reducir movimiento: no';
  button.setAttribute('aria-pressed',String(motion.reduced));
}
function toggleMotion():void { motion.set(!motion.reduced); syncMotionButton(); host!.focus(); focusState(); }
syncMotionButton();
function toggleSound():void {
  sfx.setMuted(!sfx.isMuted());
  const button=document.getElementById('sound')!;
  button.textContent=sfx.isMuted()?'Sonido: no':'Sonido: sí';
  button.setAttribute('aria-pressed',String(!sfx.isMuted()));
  host!.focus(); focusState();
}
// fresh: a page button entry. "Ir a Amaru" then starts with 4 HP and an empty meter; Retry keeps the carried run.
const navigationHeld = new Set<string>();
let navigationEvent: KeyboardEvent | undefined;
const rememberKey = (event: KeyboardEvent): void => { navigationHeld.add(event.code); navigationEvent=event; };
const releaseKey = (event: KeyboardEvent): void => { navigationHeld.delete(event.code); };
const forgetKeys = (): void => { navigationHeld.clear(); navigationEvent=undefined; };
window.addEventListener('keydown',rememberKey,true);
window.addEventListener('keyup',releaseKey,true);
window.addEventListener('blur',forgetKeys);
function navigate(view:View,fresh=false):void {
  const target = view==='route' && current.view==='map' ? entryScene('route',game.registry.get(INTRO_SEEN_KEY)===true) : sceneForView(view);
  if(fresh && view==='guardian') game.registry.remove(RUN_KEY);
  for(const scene of game.scene.getScenes(true)) {
    scene.input.keyboard?.resetKeys();
    game.scene.stop(scene.scene.key);
  }
  game.scene.start(target,{entryKeys:[...navigationHeld],entryEvent:navigationEvent});
  host!.focus(); focusState();
}
const pointerFocus=()=>host.focus();
const clickNav=(event:Event)=>{
  const button=(event.target as Element).closest<HTMLButtonElement>('button');
  if(!button) return;
  const view=button.dataset.view as View|undefined;
  if(button.id==='sound') toggleSound();
  else if(button.id==='motion') toggleMotion();
  else if(view) navigate(view,true);
  else if(button.id==='choose') navigate('map');
  else if(button.id==='retry') navigate(current.view);
};
const nav=document.getElementById('navigation')!;
// Phaser caches the canvas bounds: opening Ajustes or scrolling moves the canvas without a resize event, so map taps would land on the wrong game pixel.
const refreshBounds=()=>game.scale.updateBounds();
const settings=document.getElementById('settings');
settings?.addEventListener('toggle',refreshBounds);
window.addEventListener('scroll',refreshBounds,{passive:true});
nav.addEventListener('click',clickNav);
host.addEventListener('pointerdown',pointerFocus);
document.addEventListener('focusin',focusState);
window.addEventListener('blur',focusState);
window.addEventListener('focus',focusState);
game.events.once('ready',()=>{ host.focus(); focusState(); });
game.events.on(VIEW_EVENT,focusState);
game.events.once('destroy',()=>{
  deviceObserver.disconnect(); coarsePointer.removeEventListener('change',refreshDeviceNotice); window.removeEventListener('resize',refreshDeviceNotice);
  window.removeEventListener('keydown',rememberKey,true); window.removeEventListener('keyup',releaseKey,true); window.removeEventListener('blur',forgetKeys);
  settings?.removeEventListener('toggle',refreshBounds); window.removeEventListener('scroll',refreshBounds);
  nav.removeEventListener('click',clickNav); host.removeEventListener('pointerdown',pointerFocus);
  document.removeEventListener('focusin',focusState);
  window.removeEventListener('blur',focusState); window.removeEventListener('focus',focusState);
  game.events.off(VIEW_EVENT,render).off(VIEW_EVENT,focusState);
});

