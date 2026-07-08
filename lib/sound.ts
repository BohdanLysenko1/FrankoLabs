/**
 * Tiny synthesized UI sounds via WebAudio — no audio files.
 * Off by default; MenuBar exposes the toggle.
 * The retro XP theme swaps in its own chime-flavored sound set.
 */

const SOUND_KEY = "franko-os-sounds";

export type SoundName = "open" | "close" | "tap" | "palette" | "startup" | "balloon";

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
  delay = 0,
) {
  const ac = audioCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const now = ac.currentTime + delay;

  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), now + duration);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function isRetro() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("xp")
  );
}

/** The 2003 sound set — soft chimes instead of modern blips. */
function playRetro(name: SoundName) {
  switch (name) {
    case "open":
      tone(392, 392, 0.18, 0.05, "triangle");
      tone(587, 587, 0.22, 0.05, "triangle", 0.09);
      break;
    case "close":
      tone(587, 587, 0.16, 0.05, "triangle");
      tone(392, 392, 0.22, 0.05, "triangle", 0.08);
      break;
    case "tap":
      // The classic sharp navigate click
      tone(1800, 900, 0.03, 0.05, "square");
      break;
    case "palette":
      tone(523, 523, 0.12, 0.045, "triangle");
      tone(784, 784, 0.14, 0.045, "triangle", 0.07);
      break;
    case "balloon":
      // Notification "ding"
      tone(880, 880, 0.35, 0.05, "sine");
      tone(1109, 1109, 0.3, 0.035, "sine", 0.02);
      break;
    case "startup": {
      // A little welcome arpeggio, in the spirit of the boot chime
      const notes = [311, 415, 466, 622];
      notes.forEach((f, i) => tone(f, f, 0.55, 0.045, "sine", i * 0.16));
      tone(155, 155, 1.1, 0.03, "sine");
      break;
    }
  }
}

export function playSound(name: SoundName) {
  if (!soundsEnabled()) return;
  try {
    if (isRetro()) {
      playRetro(name);
      return;
    }
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
      case "balloon":
        tone(700, 900, 0.12, 0.045, "triangle");
        break;
      case "startup":
        tone(320, 640, 0.3, 0.05);
        break;
    }
  } catch {
    // Audio might be blocked before user interaction — ignore.
  }
}
