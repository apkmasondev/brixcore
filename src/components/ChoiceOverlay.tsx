import { memo, useEffect, useRef, type CSSProperties } from 'react';
import type { CoreId } from '../config/assetManifest';
import { BRICK_ANCHORS, COPY, CORE_ORDER } from '../config/experienceConfig';
import styles from './ChoiceOverlay.module.css';

const ACCENTS: Record<CoreId, { color: string; rgb: string }> = {
  forge: { color: 'var(--forge)', rgb: 'var(--forge-rgb)' },
  evolve: { color: 'var(--evolve)', rgb: 'var(--evolve-rgb)' },
};

interface ChoiceOverlayProps {
  readonly visible: boolean;
  /** True once a choice has been committed — blocks any further clicks. */
  readonly locked: boolean;
  readonly onChoose: (core: CoreId) => void;
}

export const ChoiceOverlay = memo(function ChoiceOverlay({
  visible,
  locked,
  onChoose,
}: ChoiceOverlayProps) {
  const firstChoiceRef = useRef<HTMLButtonElement | null>(null);
  const wasVisible = useRef(false);

  // Move focus onto the choice the moment it becomes available, so keyboard
  // users are not left hunting for it — but only on the transition into
  // visibility, never on every render.
  useEffect(() => {
    if (visible && !wasVisible.current) {
      firstChoiceRef.current?.focus({ preventScroll: true });
    }
    wasVisible.current = visible;
  }, [visible]);

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      // Hidden from assistive tech while the intro is still running. The buttons
      // inside are `disabled` in the same state, so nothing focusable is ever
      // left inside an aria-hidden subtree.
      aria-hidden={!visible}
    >
      <div className={styles.geometry}>
        <p className={styles.prompt}>
          <span className={styles.promptText}>{COPY.choicePrompt}</span>
          <span className={styles.promptRule} aria-hidden="true" />
        </p>

        <div className={styles.choices} role="group" aria-label={COPY.choicePrompt}>
          {CORE_ORDER.map((core, index) => {
            const copy = COPY.cores[core];
            const anchor = BRICK_ANCHORS[core];
            const accent = ACCENTS[core];

            return (
              <button
                key={core}
                ref={index === 0 ? firstChoiceRef : undefined}
                type="button"
                className={styles.choice}
                style={
                  {
                    '--x': `${anchor.x}%`,
                    '--y': `${anchor.labelY}%`,
                    '--accent': accent.color,
                    '--accent-rgb': accent.rgb,
                  } as CSSProperties
                }
                onClick={() => onChoose(core)}
                disabled={locked || !visible}
                aria-label={copy.ariaLabel}
              >
                <span className={styles.choiceTether} aria-hidden="true" />
                <span className={styles.choiceFrame} aria-hidden="true" />
                <span className={styles.choiceLabel}>{copy.label}</span>
                <span className={styles.choiceTagline}>{copy.tagline}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
