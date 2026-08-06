import { memo, useEffect, useRef } from 'react';
import { COPY } from '../config/experienceConfig';
import styles from './PosterFallback.module.css';

export type FallbackKind = 'error' | 'autoplay-blocked';

interface PosterFallbackProps {
  readonly kind: FallbackKind;
  /** Omitted for the autoplay prompt, which opens on black rather than on a
   *  still that would give away the intro's ending. */
  readonly poster?: string;
  readonly onAction: () => void;
}

/**
 * Covers the stage when the film cannot be shown — either it failed to load, or
 * the browser refused to start it without a gesture. Either way the user gets
 * the poster, one line of explanation, and one button. Never a black void.
 */
export const PosterFallback = memo(function PosterFallback({
  kind,
  poster,
  onAction,
}: PosterFallbackProps) {
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const isError = kind === 'error';

  useEffect(() => {
    actionRef.current?.focus({ preventScroll: true });
  }, [kind]);

  return (
    <div
      className={`${styles.overlay} ${isError ? '' : styles.begin}`}
      role={isError ? 'alert' : undefined}
    >
      {poster && <img className={styles.poster} src={poster} alt="" aria-hidden="true" />}

      <div className={styles.panel}>
        <h2 className={styles.title}>{isError ? COPY.errorTitle : COPY.brand}</h2>
        <p className={styles.body}>{isError ? COPY.errorBody : COPY.beginHint}</p>
        <button ref={actionRef} type="button" className={styles.action} onClick={onAction}>
          {isError ? COPY.errorRetry : COPY.beginExperience}
        </button>
      </div>
    </div>
  );
});
