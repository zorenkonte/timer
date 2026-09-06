export type Cue = 'tick' | 'go' | 'rest' | 'done';

export interface CueOptions {
  sound: boolean;
  vibrate: boolean;
}

let ctx: AudioContext | null = null;

/** Call from a user gesture (Start button) so mobile browsers allow audio later. */
export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, startOffset: number, durationMs: number, gain = 0.25): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const t0 = ctx.currentTime + startOffset;
  const t1 = t0 + durationMs / 1000;
  osc.type = 'sine';
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.setValueAtTime(gain, t1 - 0.03);
  amp.gain.linearRampToValueAtTime(0, t1);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t1 + 0.02);
}

const PATTERNS: Record<Cue, { tones: Array<[freq: number, at: number, ms: number]>; vibrate: number | number[] }> = {
  tick: { tones: [[880, 0, 90]], vibrate: 40 },
  go: { tones: [[1175, 0, 120], [1568, 0.15, 220]], vibrate: [80, 40, 120] },
  rest: { tones: [[660, 0, 260]], vibrate: 120 },
  done: { tones: [[784, 0, 140], [988, 0.16, 140], [1175, 0.32, 140], [1568, 0.48, 380]], vibrate: [100, 50, 100, 50, 250] },
};

export function playCue(cue: Cue, opts: CueOptions): void {
  const p = PATTERNS[cue];
  if (opts.sound) {
    unlockAudio();
    for (const [freq, at, ms] of p.tones) tone(freq, at, ms);
  }
  if (opts.vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(p.vibrate);
    } catch {
      // unsupported
    }
  }
}
