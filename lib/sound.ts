/**
 * Tiny synthesized UI sounds via WebAudio — no audio files.
 * Off by default; MenuBar exposes the toggle.
 */

const SOUND_KEY = "franko-os-sounds";

export type SoundName = "open" | "close" | "tap" | "palette";

let ctx: AudioContext | null = null;

function audioCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function soundsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SOUND_KEY) === "on";
}

export function setSoundsEnabled(on: boolean) {
  localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}

function tone(
  freqFrom: number,
  freqTo: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
) {
  const ac = audioCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const now = ac.currentTime;

  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), now + duration);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playSound(name: SoundName) {
  if (!soundsEnabled()) return;
  try {
    switch (name) {
      case "open":
        tone(320, 640, 0.16, 0.05);
        break;
      case "close":
        tone(560, 240, 0.14, 0.05);
        break;
      case "tap":
        tone(880, 660, 0.05, 0.04, "triangle");
        break;
      case "palette":
        tone(520, 780, 0.09, 0.045, "triangle");
        break;
    }
  } catch {
    // Audio might be blocked before user interaction — ignore.
  }
}
