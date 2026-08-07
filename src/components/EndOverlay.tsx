import { memo, useEffect, useRef, type CSSProperties } from 'react';
import type { CoreId } from '../config/assetManifest';
import { COPY } from '../config/experienceConfig';
import styles from './EndOverlay.module.css';

const ACCENTS: Record<CoreId, { color: string; rgb: string }> = {
  forge: { color: 'var(--forge)', rgb: 'var(--forge-rgb)' },
  evolve: { color: 'var(--evolve)', rgb: 'var(--evolve-rgb)' },
};

const OTHER_CORE: Record<CoreId, CoreId> = { forge: 'evolve', evolve: 'forge' };

interface EndOverlayProps {
  readonly visible: boolean;
  /** Which branch just finished. Goes null the moment the flow moves on. */
  readonly core: CoreId | null;
  /** True once every path has been watched through, in this session. */
  readonly bothCoresSeen: boolean;
  readonly onChooseAnother: () => void;
  readonly onReplay: () => void;
  /** Opens the project dossier. Tertiary on purpose — it must never compete
   *  with the two actions that continue the experience. */
  readonly onAbout: () => void;
}

export const EndOverlay = memo(function EndOverlay({
  visible,
  core,
  bothCoresSeen,
  onChooseAnother,
  onReplay,
  onAbout,
}: EndOverlayProps) {
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const wasVisible = useRef(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      primaryRef.current?.focus({ preventScroll: true });
    }
    wasVisible.current = visible;
  }, [visible]);

  /*
   * `core` goes null in the same commit that hides the overlay, but the overlay
   * then spends the whole reveal duration fading out — so reading it directly
   * blanked the headline and snapped an EVOLVE ending to the FORGE accent
   * halfway through the fade. Holding the last real value keeps the copy and
   * the colour intact until the overlay is gone.
   */
  const lastCore = useRef<CoreId>('forge');
  if (core) lastCore.current = core;
  const shown = core ?? lastCore.current;

  const accent = ACCENTS[shown];
  const other = ACCENTS[OTHER_CORE[shown]];

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      aria-hidden={!visible}
      style={
        {
          '--accent': accent.color,
          '--accent-rgb': accent.rgb,
          '--accent-other': other.color,
          '--accent-other-rgb': other.rgb,
        } as CSSProperties
      }
    >
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        {/* Grouped so the grid's gap separates the statement from the controls,
            not the headline from its own subline. */}
        <div className={styles.statement}>
          <h2 className={styles.headline}>
            {COPY.cores[shown].finale}
            <span
              className={`${styles.headlineRule} ${bothCoresSeen ? styles.headlineRuleBoth : ''}`}
              aria-hidden="true"
            />
          </h2>

          {/* The road not taken — or, once there is none left, the summation. */}
          <p className={`${styles.subline} ${bothCoresSeen ? styles.sublineBoth : ''}`}>
            {bothCoresSeen ? COPY.bothCoresLine : COPY.cores[OTHER_CORE[shown]].unbuilt}
          </p>
        </div>

        <div className={styles.actions}>
          <button
            ref={primaryRef}
            type="button"
            className={`${styles.action} ${styles.actionPrimary}`}
            onClick={onChooseAnother}
            disabled={!visible}
          >
            {bothCoresSeen ? COPY.endReturn : COPY.endChooseAnother}
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

        <button
          type="button"
          className={styles.about}
          onClick={onAbout}
          disabled={!visible}
          aria-label={COPY.dossierOpenAria}
        >
          {COPY.endAbout}
        </button>
      </div>
    </div>
  );
});
