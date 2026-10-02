export const AUDIO_STORAGE_KEY = 'geoguard-audio-settings';

export const AUDIO_CUES = {
  ui_confirm: [
    { kind: 'tone', type: 'triangle', frequency: 560, duration: 0.09, gain: 0.05 },
    { kind: 'tone', type: 'triangle', frequency: 720, start: 0.06, duration: 0.12, gain: 0.04 },
  ],
  ui_error: [
    { kind: 'tone', type: 'sawtooth', frequency: 220, duration: 0.08, gain: 0.04 },
    { kind: 'tone', type: 'square', frequency: 170, start: 0.04, duration: 0.12, gain: 0.03 },
  ],
  tower_place: [
    { kind: 'tone', type: 'triangle', frequency: 420, duration: 0.08, gain: 0.045 },
    { kind: 'tone', type: 'triangle', frequency: 560, start: 0.03, duration: 0.1, gain: 0.03 },
  ],
  reward_open: [
    { kind: 'tone', type: 'sine', frequency: 420, duration: 0.2, gain: 0.05 },
    { kind: 'tone', type: 'sine', frequency: 630, start: 0.08, duration: 0.24, gain: 0.045 },
    { kind: 'tone', type: 'triangle', frequency: 840, start: 0.14, duration: 0.22, gain: 0.03 },
  ],
  reward_pick: [
    { kind: 'tone', type: 'triangle', frequency: 660, duration: 0.11, gain: 0.05 },
    { kind: 'tone', type: 'triangle', frequency: 990, start: 0.08, duration: 0.18, gain: 0.04 },
  ],
  boss_incoming: [
    { kind: 'tone', type: 'sawtooth', frequency: 110, duration: 0.32, gain: 0.07 },
    { kind: 'tone', type: 'triangle', frequency: 220, start: 0.12, duration: 0.28, gain: 0.045 },
    { kind: 'noise', start: 0.02, duration: 0.18, gain: 0.018, filter: 720 },
  ],
  boss_phase_shift: [
    { kind: 'tone', type: 'square', frequency: 280, duration: 0.1, gain: 0.05 },
    { kind: 'tone', type: 'sawtooth', frequency: 420, start: 0.05, duration: 0.14, gain: 0.04 },
    { kind: 'tone', type: 'triangle', frequency: 760, start: 0.11, duration: 0.22, gain: 0.03 },
    { kind: 'noise', start: 0, duration: 0.08, gain: 0.012, filter: 880 },
  ],
  boss_defeat: [
    { kind: 'tone', type: 'triangle', frequency: 360, duration: 0.14, gain: 0.05 },
    { kind: 'tone', type: 'triangle', frequency: 540, start: 0.08, duration: 0.2, gain: 0.04 },
    { kind: 'tone', type: 'triangle', frequency: 720, start: 0.16, duration: 0.26, gain: 0.03 },
  ],
};
