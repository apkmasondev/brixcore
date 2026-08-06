import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ambientAudioSrc } from '../config/assetManifest';
import { COPY } from '../config/experienceConfig';
import styles from './SoundToggle.module.css';

interface SoundToggleProps {
  /** Playback is only attempted while the experience is actually running. */
  readonly active: boolean;
}

/**
 * Optional ambient score on a dedicated `<audio>` element.
 *
 * The video track is silent by design, so sound is purely additive: it starts
 * off, is only ever started from a real user gesture (never autoplay), and if
 * no soundtrack is configured the control does not render at all — no request,
 * no 404, no console noise.
 */
export const SoundToggle = memo(function SoundToggle({ active }: SoundToggleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  // Pause when the experience is not running, resume when it is.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !enabled) return;

    if (active) {
      void audio.play().catch(() => setEnabled(false));
    } else {
      audio.pause();
    }
  }, [active, enabled]);

  // Always leave the element stopped on unmount.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      audio.pause();
      setEnabled(false);
      return;
    }

    // Started inside the click handler so the gesture is still in scope.
    audio
      .play()
      .then(() => setEnabled(true))
      .catch(() => setEnabled(false));
  }, [enabled]);

  if (!ambientAudioSrc) return null;

  return (
    <>
      <audio ref={audioRef} src={ambientAudioSrc} loop preload="none" />
      <button
        type="button"
        className={styles.toggle}
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? COPY.soundOn : COPY.soundOff}
        title={enabled ? COPY.soundOn : COPY.soundOff}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          {enabled ? (
            <>
              <path d="M16.5 8.5a5 5 0 0 1 0 7" />
              <path d="M19 6a8.5 8.5 0 0 1 0 12" />
            </>
          ) : (
            <path d="M17 9.5l4 5M21 9.5l-4 5" />
          )}
        </svg>
      </button>
    </>
  );
});
