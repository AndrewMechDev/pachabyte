import Phaser from 'phaser';
import './style.css';
import { RouteScene } from './game/RouteScene';
import { MapScene } from './game/MapScene';
import { GuardianScene } from './game/GuardianScene';
import { GAME } from './game/rules';
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
  host!.setAttribute('aria-label', copy.title + '. Juego controlado con teclado.');
  achievements.textContent = `Logros de la sesión: Ruta ${state.progress.route?'completada':'pendiente'} · Amaru ${state.progress.guardian?'liberado':'pendiente'}`;
  document.getElementById('choose')!.hidden = state.view==='map';
  document.getElementById('retry')!.hidden = state.view==='map';
  for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]'))) button.setAttribute('aria-pressed',String(button.dataset.view===state.view));
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
  scene: [MapScene,RouteScene,GuardianScene],
});
game.events.on(VIEW_EVENT,render);
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
function navigate(view:View,fresh=false):void {
  if(fresh && view==='guardian') game.registry.remove(RUN_KEY);
  for(const scene of game.scene.getScenes(true)) {
    scene.input.keyboard?.resetKeys();
    game.scene.stop(scene.scene.key);
  }
  game.scene.start(sceneForView(view));
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
nav.addEventListener('click',clickNav);
host.addEventListener('pointerdown',pointerFocus);
document.addEventListener('focusin',focusState);
window.addEventListener('blur',focusState);
window.addEventListener('focus',focusState);
game.events.once('ready',()=>{ host.focus(); focusState(); });
game.events.on(VIEW_EVENT,focusState);
game.events.once('destroy',()=>{
  nav.removeEventListener('click',clickNav); host.removeEventListener('pointerdown',pointerFocus);
  document.removeEventListener('focusin',focusState);
  window.removeEventListener('blur',focusState); window.removeEventListener('focus',focusState);
  game.events.off(VIEW_EVENT,render).off(VIEW_EVENT,focusState);
});

