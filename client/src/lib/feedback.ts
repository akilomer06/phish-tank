import { usePreferences } from './preferences';
import type { Howl } from 'howler';

export type Sound =
  | 'tap'
  | 'success'
  | 'fail'
  | 'tick'
  | 'reveal'
  | 'crack'
  | 'siren'
  | 'victory';
const sounds = new Map<Sound, Howl>();
export async function playSound(name: Sound) {
  if (usePreferences.getState().muted) return;
  try {
    const { Howl } = await import('howler');
    if (usePreferences.getState().muted) return;
    let sound = sounds.get(name);
    if (!sound) {
      sound = new Howl({
        src: [`/audio/${name}.wav`],
        volume: name === 'tap' ? 0.12 : 0.25,
      });
      sounds.set(name, sound);
    }
    sound.play();
  } catch {
    /* Audio is optional; controls remain available when a browser blocks it. */
  }
}
export function feedback() {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    navigator.vibrate?.(8);
  void playSound('tap');
}
export function silenceAudio() {
  for (const sound of sounds.values()) sound.stop();
}
export async function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { default: confetti } = await import('canvas-confetti');
  confetti({
    particleCount: 70,
    spread: 65,
    origin: { y: 0.65 },
    colors: ['#39FF88', '#22D3EE', '#FF3D81'],
    disableForReducedMotion: true,
  });
}
