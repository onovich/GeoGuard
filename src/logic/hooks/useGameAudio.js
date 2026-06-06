import { useEffect, useRef, useState } from 'react';
import { AUDIO_CUES, AUDIO_STORAGE_KEY } from '../audio/audioCueLibrary.js';

const DEFAULT_AUDIO_SETTINGS = {
  enabled: true,
  volume: 0.6,
};

const createNoiseBuffer = (audioContext) => {
  const length = audioContext.sampleRate * 0.5;
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    channelData[index] = Math.random() * 2 - 1;
  }
  return buffer;
};

const loadAudioSettings = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_AUDIO_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_AUDIO_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled ?? DEFAULT_AUDIO_SETTINGS.enabled,
      volume: Number.isFinite(parsed.volume) ? Math.max(0, Math.min(1, parsed.volume)) : DEFAULT_AUDIO_SETTINGS.volume,
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
};

export default function useGameAudio() {
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const noiseBufferRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audioSettings));
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = audioSettings.enabled ? audioSettings.volume : 0;
    }
  }, [audioSettings]);

  const ensureContext = () => {
    if (typeof window === 'undefined') {
      return null;
    }
    if (audioContextRef.current) {
      return audioContextRef.current;
    }

    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    const audioContext = new AudioContextCtor();
    const masterGain = audioContext.createGain();
    masterGain.gain.value = audioSettings.enabled ? audioSettings.volume : 0;
    masterGain.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    masterGainRef.current = masterGain;
    noiseBufferRef.current = createNoiseBuffer(audioContext);
    return audioContext;
  };

  const resumeAudio = async () => {
    const audioContext = ensureContext();
    if (!audioContext) {
      return;
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  };

  const playTone = (audioContext, layer, now) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = layer.type ?? 'triangle';
    oscillator.frequency.setValueAtTime(layer.frequency, now + (layer.start ?? 0));
    gainNode.gain.setValueAtTime(0.0001, now + (layer.start ?? 0));
    gainNode.gain.linearRampToValueAtTime(layer.gain ?? 0.04, now + (layer.start ?? 0) + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (layer.start ?? 0) + (layer.duration ?? 0.12));
    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    oscillator.start(now + (layer.start ?? 0));
    oscillator.stop(now + (layer.start ?? 0) + (layer.duration ?? 0.12));
  };

  const playNoise = (audioContext, layer, now) => {
    if (!noiseBufferRef.current) {
      noiseBufferRef.current = createNoiseBuffer(audioContext);
    }

    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gainNode = audioContext.createGain();
    source.buffer = noiseBufferRef.current;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(layer.filter ?? 900, now);
    gainNode.gain.setValueAtTime(0.0001, now + (layer.start ?? 0));
    gainNode.gain.linearRampToValueAtTime(layer.gain ?? 0.015, now + (layer.start ?? 0) + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (layer.start ?? 0) + (layer.duration ?? 0.1));
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    source.start(now + (layer.start ?? 0));
    source.stop(now + (layer.start ?? 0) + (layer.duration ?? 0.1));
  };

  const playCue = async (cueId) => {
    if (!audioSettings.enabled) {
      return;
    }

    const audioContext = ensureContext();
    if (!audioContext || !masterGainRef.current) {
      return;
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const cue = AUDIO_CUES[cueId];
    if (!cue) {
      return;
    }

    const now = audioContext.currentTime;
    cue.forEach((layer) => {
      if (layer.kind === 'noise') {
        playNoise(audioContext, layer, now);
      } else {
        playTone(audioContext, layer, now);
      }
    });
  };

  return {
    audioSettings,
    setAudioEnabled: (enabled) => setAudioSettings((previous) => ({ ...previous, enabled })),
    setAudioVolume: (volume) => setAudioSettings((previous) => ({ ...previous, volume: Math.max(0, Math.min(1, volume)) })),
    playCue,
    resumeAudio,
  };
}
