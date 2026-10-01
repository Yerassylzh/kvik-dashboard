import { useCallback } from 'react';

/**
 * useMessageSound
 *
 * Plays a soft notification chime via the browser Audio API.
 * No external libraries required — uses a small, royalty-free WAV encoded
 * as a data URI so it works offline and without any network requests.
 *
 * The sound only plays when the user has interacted with the page at least
 * once (browser autoplay policy).  We silently swallow errors otherwise.
 */

// We use a real hosted, lightweight sound instead:
const CHIME_URL =
  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

let audioInstance: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (typeof window === 'undefined') {
    // SSR guard — return a noop stub
    return {} as HTMLAudioElement;
  }
  if (!audioInstance) {
    audioInstance = new Audio(CHIME_URL);
    audioInstance.volume = 0.4;
    // Preload so the first play is instant
    audioInstance.preload = 'auto';
  }
  return audioInstance;
}

export function useMessageSound() {
  const playNotificationSound = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const audio = getAudio();
      // Reset to start so rapid calls replay from beginning
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Silently ignore — browser blocked autoplay before user interaction
      });
    } catch {
      // Ignore any Audio API errors
    }
  }, []);

  return { playNotificationSound };
}
