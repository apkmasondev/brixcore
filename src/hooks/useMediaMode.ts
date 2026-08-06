import { useEffect, useState } from 'react';
import { MOBILE_BREAKPOINT_PX, TOUCH_MOBILE_MAX_WIDTH_PX } from '../config/experienceConfig';
import type { MediaMode } from '../config/assetManifest';

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

function getConnection(): NetworkInformationLike | undefined {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

export interface MediaModeState {
  /** Which media set to use. Drives `assetManifest`. */
  mode: MediaMode;
  /** True when the viewport is portrait-ish and the stage letterboxes. */
  isPortrait: boolean;
  /**
   * True when we must not speculatively download both branches:
   * mobile media set, Save-Data enabled, or a 2g/3g-class connection.
   */
  isDataConstrained: boolean;
}

const MOBILE_QUERY =
  `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px),` +
  `(pointer: coarse) and (max-width: ${TOUCH_MOBILE_MAX_WIDTH_PX}px)`;
const PORTRAIT_QUERY = '(orientation: portrait)';
const SLOW_TYPES = new Set(['slow-2g', '2g', '3g']);

function read(): MediaModeState {
  const isMobile = window.matchMedia(MOBILE_QUERY).matches;
  const connection = getConnection();
  const saveData = connection?.saveData === true;
  const slow = connection?.effectiveType ? SLOW_TYPES.has(connection.effectiveType) : false;

  return {
    mode: isMobile ? 'mobile' : 'desktop',
    isPortrait: window.matchMedia(PORTRAIT_QUERY).matches,
    isDataConstrained: isMobile || saveData || slow,
  };
}

/**
 * Resolves the media set and the preload budget.
 *
 * The mode is deliberately re-evaluated on resize/orientation change so that
 * rotating a phone or dragging a desktop window across the breakpoint keeps the
 * layout honest. Swapping the *media set* mid-experience is handled by the
 * flow, which only re-sources videos while nothing is playing.
 */
export function useMediaMode(): MediaModeState {
  const [state, setState] = useState<MediaModeState>(() =>
    typeof window === 'undefined'
      ? { mode: 'desktop', isPortrait: false, isDataConstrained: false }
      : read(),
  );

  useEffect(() => {
    const mobileMql = window.matchMedia(MOBILE_QUERY);
    const portraitMql = window.matchMedia(PORTRAIT_QUERY);
    const connection = getConnection();

    const sync = () => {
      const next = read();
      setState((prev) =>
        prev.mode === next.mode &&
        prev.isPortrait === next.isPortrait &&
        prev.isDataConstrained === next.isDataConstrained
          ? prev
          : next,
      );
    };

    mobileMql.addEventListener('change', sync);
    portraitMql.addEventListener('change', sync);
    connection?.addEventListener?.('change', sync);

    return () => {
      mobileMql.removeEventListener('change', sync);
      portraitMql.removeEventListener('change', sync);
      connection?.removeEventListener?.('change', sync);
    };
  }, []);

  return state;
}
