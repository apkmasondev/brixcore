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
  const choicesRef = useRef<HTMLDivElement | null>(null);
  const wasVisible = useRef(false);

  // Move focus onto the choice group the moment it becomes available, so
  // keyboard users are not left hunting for it — but only on the transition
  // into visibility, never on every render.
  //
  // The *group* rather than the first button on purpose. Chrome treats a
  // programmatic focus as keyboard-initiated whenever the user has not clicked
  // yet, so focusing the button directly matched `:focus-visible` on a fresh
  // load and lit FORGE up as though it were hovered until the first click
  // landed somewhere. The group is unstyled, announces its label to screen
  // readers, and puts the very next Tab on FORGE.
  useEffect(() => {
    if (visible && !wasVisible.current) {
      choicesRef.current?.focus({ preventScroll: true });
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

        <div
          ref={choicesRef}
          className={styles.choices}
          role="group"
          aria-label={COPY.choicePrompt}
          tabIndex={-1}
        >
          {CORE_ORDER.map((core) => {
            const copy = COPY.cores[core];
            const anchor = BRICK_ANCHORS[core];
            const accent = ACCENTS[core];

            return (
              <button
                key={core}
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
