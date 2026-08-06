import { memo, useEffect, useRef, type CSSProperties } from 'react';
import type { CoreId } from '../config/assetManifest';
import { COPY } from '../config/experienceConfig';
import styles from './EndOverlay.module.css';

const ACCENTS: Record<CoreId, { color: string; rgb: string }> = {
  forge: { color: 'var(--forge)', rgb: 'var(--forge-rgb)' },
  evolve: { color: 'var(--evolve)', rgb: 'var(--evolve-rgb)' },
};

interface EndOverlayProps {
  readonly visible: boolean;
  /** Which branch just finished. Kept while fading out so copy never flickers. */
  readonly core: CoreId | null;
  readonly onChooseAnother: () => void;
  readonly onReplay: () => void;
}

export const EndOverlay = memo(function EndOverlay({
  visible,
  core,
  onChooseAnother,
  onReplay,
}: EndOverlayProps) {
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const wasVisible = useRef(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      primaryRef.current?.focus({ preventScroll: true });
    }
    wasVisible.current = visible;
  }, [visible]);

  const accent = ACCENTS[core ?? 'forge'];

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      aria-hidden={!visible}
      style={
        {
          '--accent': accent.color,
          '--accent-rgb': accent.rgb,
        } as CSSProperties
      }
    >
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <h2 className={styles.headline}>
          {core ? COPY.cores[core].finale : ''}
          <span className={styles.headlineRule} aria-hidden="true" />
        </h2>

        <div className={styles.actions}>
          <button
            ref={primaryRef}
            type="button"
            className={`${styles.action} ${styles.actionPrimary}`}
            onClick={onChooseAnother}
            disabled={!visible}
          >
            {COPY.endChooseAnother}
          </button>
          <button
            type="button"
            className={styles.action}
            onClick={onReplay}
            disabled={!visible}
          >
            {COPY.endReplay}
          </button>
        </div>
      </div>
    </div>
  );
});
