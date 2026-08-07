import { memo } from 'react';
import { COPY } from '../config/experienceConfig';
import styles from './SoundToggle.module.css';

interface SoundToggleProps {
  readonly enabled: boolean;
  readonly onToggle: () => void;
}

/**
 * The score's only control.
 *
 * Purely presentational — every element, gain and fade lives in
 * {@link useAudioScore}. The score is off until this is pressed, because
 * autoplay policy means sound can only ever begin from a real gesture, and
 * because a film that starts making noise at a viewer who did not ask for it is
 * not a premium one.
 */
export const SoundToggle = memo(function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
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
  );
});
