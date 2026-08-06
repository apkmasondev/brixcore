import { useCallback, useEffect, useRef, useState } from 'react';
import type { CoreId } from '../config/assetManifest';

export type LayerKey = CoreId | 'intro';
export type ReadinessMap = Readonly<Record<LayerKey, boolean>>;

const EMPTY_READINESS: ReadinessMap = { intro: false, forge: false, evolve: false };

/** Grace given to `preload="auto"` before falling back to an explicit `load()`. */
const PRELOAD_FALLBACK_MS = 200;

export interface VideoPreloadApi {
  /** Per-layer "buffered enough to start". Changes only on media events. */
  readonly readiness: ReadinessMap;
  readonly register: (id: LayerKey, el: HTMLVideoElement | null) => void;
  readonly markReady: (id: LayerKey, ready: boolean) => void;
  readonly getElement: (id: LayerKey) => HTMLVideoElement | null;
  /** Promotes a layer to eager buffering. Idempotent. */
  readonly requestPreload: (id: LayerKey) => void;
  /** Forgets every eager-load record, e.g. when the media set is swapped. */
  readonly resetPreloads: () => void;
}

/**
 * Owns the video elements and the decision of when each one starts downloading.
 *
 * Readiness lives in React state because it drives the loader, but it is only
 * ever written on discrete media events — never per frame, never on timeupdate.
 */
export function useVideoPreload(): VideoPreloadApi {
  const [readiness, setReadiness] = useState<ReadinessMap>(EMPTY_READINESS);
  const elements = useRef<Partial<Record<LayerKey, HTMLVideoElement | null>>>({});
  /** Layers we have already asked to buffer. */
  const requested = useRef<Set<LayerKey>>(new Set());
  /** Pending `load()` fallbacks, so they can be cancelled. */
  const fallbackTimers = useRef<Map<LayerKey, number>>(new Map());

  const cancelFallback = useCallback((id: LayerKey) => {
    const timer = fallbackTimers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      fallbackTimers.current.delete(id);
    }
  }, []);

  // Never leave a timer to fire against a torn-down element.
  useEffect(() => {
    const timers = fallbackTimers.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  const markReady = useCallback((id: LayerKey, ready: boolean) => {
    setReadiness((prev) => (prev[id] === ready ? prev : { ...prev, [id]: ready }));
  }, []);

  const register = useCallback(
    (id: LayerKey, el: HTMLVideoElement | null) => {
      elements.current[id] = el;
      if (!el) {
        requested.current.delete(id);
        cancelFallback(id);
      }
    },
    [cancelFallback],
  );

  const getElement = useCallback((id: LayerKey) => elements.current[id] ?? null, []);

  /**
   * Promotes a layer to eager buffering.
   *
   * Raising `preload` to `auto` is enough on its own in Chromium and Firefox —
   * the property change starts the fetch. Calling `load()` straight afterwards
   * would abort that request and re-issue it, which is visible in the network
   * panel as a cancelled request per branch.
   *
   * Some engines (notably older WebKit) ignore a `preload` change once resource
   * selection has already run, so `load()` is kept as a *fallback*: scheduled,
   * and only executed if nothing has actually started buffering by then.
   *
   * The `requested` set keeps all of this to exactly once per element.
   */
  const requestPreload = useCallback(
    (id: LayerKey) => {
      const el = elements.current[id];
      if (!el || requested.current.has(id)) return;
      requested.current.add(id);
      el.preload = 'auto';

      cancelFallback(id);
      const timer = window.setTimeout(() => {
        fallbackTimers.current.delete(id);
        const current = elements.current[id];
        if (!current) return;
        if (current.networkState !== current.NETWORK_LOADING && current.readyState === current.HAVE_NOTHING) {
          current.load();
        }
      }, PRELOAD_FALLBACK_MS);
      fallbackTimers.current.set(id, timer);
    },
    [cancelFallback],
  );

  const resetPreloads = useCallback(() => {
    requested.current.clear();
    fallbackTimers.current.forEach((t) => window.clearTimeout(t));
    fallbackTimers.current.clear();
    setReadiness(EMPTY_READINESS);
  }, []);

  return { readiness, register, markReady, getElement, requestPreload, resetPreloads };
}

/**
 * Attaches readiness listeners to one video element.
 *
 * `canplaythrough` is the signal we want (the browser believes it can play to
 * the end without stalling), with `canplay` as a floor so a conservative browser
 * never leaves the loader up indefinitely.
 */
export function useReadinessListeners(
  el: HTMLVideoElement | null,
  id: LayerKey,
  markReady: (id: LayerKey, ready: boolean) => void,
) {
  useEffect(() => {
    if (!el) return;

    const onReady = () => markReady(id, true);
    const onEmptied = () => markReady(id, false);

    el.addEventListener('canplay', onReady);
    el.addEventListener('canplaythrough', onReady);
    el.addEventListener('emptied', onEmptied);

    // May already be buffered when this runs, e.g. after a remount.
    if (el.readyState >= el.HAVE_FUTURE_DATA) markReady(id, true);

    return () => {
      el.removeEventListener('canplay', onReady);
      el.removeEventListener('canplaythrough', onReady);
      el.removeEventListener('emptied', onEmptied);
    };
  }, [el, id, markReady]);
}
