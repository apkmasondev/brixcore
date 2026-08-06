import { memo } from 'react';
import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  readonly visible: boolean;
  readonly label: string;
  /**
   * True while nothing has been painted yet, so the overlay covers black.
   * During a branch hand-off it stays transparent and the intro's final frame
   * remains visible underneath.
   */
  readonly blanket?: boolean;
}

export const LoadingOverlay = memo(function LoadingOverlay({
  visible,
  label,
  blanket = false,
}: LoadingOverlayProps) {
  return (
    <div
      className={[
        styles.overlay,
        visible ? styles.overlayVisible : '',
        blanket ? styles.overlayBlanket : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <div className={styles.inner}>
        <div className={styles.meter} aria-hidden="true">
          <span className={styles.brick} />
          <span className={styles.brick} />
          <span className={styles.brick} />
        </div>
        <span className={styles.label}>{visible ? label : ''}</span>
      </div>
    </div>
  );
});
