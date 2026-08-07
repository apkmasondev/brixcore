import { memo, useEffect, useId, useRef, type CSSProperties } from 'react';
import type { CoreId } from '../config/assetManifest';
import { COPY } from '../config/experienceConfig';
import { DOSSIER } from '../config/projectDossier';
import styles from './InfoPanel.module.css';

const ACCENTS: Record<CoreId, { color: string; rgb: string }> = {
  forge: { color: 'var(--forge)', rgb: 'var(--forge-rgb)' },
  evolve: { color: 'var(--evolve)', rgb: 'var(--evolve-rgb)' },
};

/** Everything inside the panel that can hold focus. `:not([disabled])` matters:
 *  the close button is disabled while the panel is hidden. */
const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

interface InfoPanelProps {
  readonly visible: boolean;
  /** Path the viewer just finished — the panel carries its accent through. */
  readonly core: CoreId | null;
  readonly onClose: () => void;
}

/**
 * The informational layer: concept, flow, production, build, and the two
 * layouts. Opened from the end screen, never before — the film is the product,
 * and this sits behind it rather than beside it.
 *
 * A real modal: it takes focus, traps Tab, closes on Escape, and hands focus
 * back to whatever opened it.
 */
export const InfoPanel = memo(function InfoPanel({ visible, core, onClose }: InfoPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!visible) return;

    const panel = panelRef.current;
    if (!panel) return;

    const restoreTo = document.activeElement as HTMLElement | null;

    // Open at the top every time, and put the keyboard on the scroll region so
    // arrows and Page Down work without having to Tab first. The region is
    // `tabindex="-1"`, so this is the only way focus ever lands on it.
    const scroll = scrollRef.current;
    if (scroll) {
      scroll.scrollTop = 0;
      scroll.focus({ preventScroll: true });
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const at = focusable.indexOf(document.activeElement as HTMLElement);

      // `at === -1` covers the scroll region, which sits *after* the close
      // button in the DOM — left to the browser, a Tab from there would walk
      // straight out of the panel.
      if (at === -1) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && at === 0) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && at === focusable.length - 1) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreTo?.focus({ preventScroll: true });
    };
  }, [visible, onClose]);

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
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.bar}>
          <p className={styles.barBrand}>
            <span className={styles.barMark} aria-hidden="true" />
            {COPY.brand}
          </p>

          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            disabled={!visible}
            aria-label={COPY.dossierCloseAria}
          >
            {COPY.dossierClose}
            <span className={styles.closeHint} aria-hidden="true">
              {COPY.dossierCloseHint}
            </span>
          </button>
        </div>

        <div className={styles.scroll} ref={scrollRef} tabIndex={-1}>
          <div className={styles.column}>
            <header className={styles.masthead}>
              <h2 className={styles.title} id={titleId}>
                {DOSSIER.title}
              </h2>
              <span className={styles.titleRule} aria-hidden="true" />
              <p className={styles.lede}>{DOSSIER.lede}</p>
            </header>

            {DOSSIER.sections.map((section) => (
              <section className={styles.section} key={section.index}>
                <p className={styles.sectionIndex} aria-hidden="true">
                  {section.index}
                </p>

                <div className={styles.sectionBody}>
                  <h3 className={styles.sectionTitle}>{section.title}</h3>

                  {section.body.map((paragraph) => (
                    <p className={styles.paragraph} key={paragraph}>
                      {paragraph}
                    </p>
                  ))}

                  <dl className={styles.specs}>
                    {section.specs.map((spec) => (
                      <div className={styles.spec} key={spec.label}>
                        <dt className={styles.specLabel}>{spec.label}</dt>
                        <dd className={styles.specValue}>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            ))}

            <footer className={styles.colophon}>
              <span className={styles.colophonRule} aria-hidden="true" />
              <p className={styles.colophonText}>{DOSSIER.colophon}</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
});
