import { memo, useCallback, useEffect, useState } from 'react';
import type { VideoAsset } from '../config/assetManifest';
import type { LayerId } from '../hooks/useChoiceFlow';
import { useReadinessListeners } from '../hooks/useVideoPreload';
import styles from './VideoStage.module.css';

export interface StageLayerSpec {
  readonly id: LayerId;
  readonly asset: VideoAsset;
  /** Buffering budget for this layer. Upgraded to `auto` when it is needed. */
  readonly preload: 'none' | 'metadata' | 'auto';
  /** Accessible description of the clip. */
  readonly label: string;
  /**
   * Poster to paint before the first frame decodes. Omitted for the intro: its
   * poster is the *final* frame, so showing it up front would both spoil the
   * reveal and jump when playback starts from the opening shot. Branch layers
   * are invisible until they play, so their poster is never seen either — it is
   * carried for {@link PosterFallback} to use on failure.
   */
  readonly poster?: string;
}

interface VideoStageProps {
  readonly layers: readonly StageLayerSpec[];
  readonly activeLayer: LayerId;
  readonly registerLayer: (id: LayerId, el: HTMLVideoElement | null) => void;
  readonly markReady: (id: LayerId, ready: boolean) => void;
  readonly onLayerPlaying: (id: LayerId) => void;
  readonly onLayerEnded: (id: LayerId) => void;
  readonly onLayerError: (id: LayerId) => void;
}

interface VideoLayerProps extends Omit<VideoStageProps, 'layers'> {
  readonly layer: StageLayerSpec;
}

function VideoLayer({
  layer,
  activeLayer,
  registerLayer,
  markReady,
  onLayerPlaying,
  onLayerEnded,
  onLayerError,
}: VideoLayerProps) {
  // Held in state, not a ref: the readiness effect below has to re-run once the
  // element actually exists, and a ref mutation would not schedule that.
  const [el, setEl] = useState<HTMLVideoElement | null>(null);
  const isActive = layer.id === activeLayer;

  const setRef = useCallback(
    (node: HTMLVideoElement | null) => {
      setEl(node);
      registerLayer(layer.id, node);
    },
    [layer.id, registerLayer],
  );

  useReadinessListeners(el, layer.id, markReady);

  // Release decoder and buffers when the layer goes away (media-set swap).
  useEffect(() => {
    if (!el) return;
    return () => {
      el.pause();
      el.removeAttribute('src');
      el.load();
    };
  }, [el]);

  return (
    <div className={`${styles.layer} ${isActive ? styles.layerActive : ''}`} aria-hidden={!isActive}>
      <video
        ref={setRef}
        className={styles.video}
        src={layer.asset.src}
        poster={layer.poster}
        preload={layer.preload}
        // The media has no audio track at all, but `muted` is what makes
        // autoplay permissible, so it is set explicitly and never toggled.
        muted
        playsInline
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({ 'webkit-playsinline': 'true', 'x5-playsinline': 'true' } as any)}
        disablePictureInPicture
        controls={false}
        tabIndex={-1}
        aria-label={layer.label}
        onPlaying={() => onLayerPlaying(layer.id)}
        onEnded={() => onLayerEnded(layer.id)}
        onError={() => onLayerError(layer.id)}
      />
    </div>
  );
}

/**
 * Renders one `<video>` per branch and cross-fades between them by opacity.
 *
 * Why three elements rather than one element with a swapped `src`:
 *
 *  - swapping `src` tears down the decoder, so the element paints black (or the
 *    poster) for a beat before the new first frame arrives — exactly the flash
 *    the experience must not have;
 *  - each element owns one URL for its whole life, so the first frame of the
 *    *other* branch can never appear;
 *  - the intro element stays parked on its final frame, which makes
 *    "CHOOSE ANOTHER CORE" an instant fade back rather than a reload;
 *  - the preload budget becomes a per-element attribute instead of scheduling
 *    logic, and the fetched bytes are the ones actually played — no double
 *    download through a separate hidden preloader.
 *
 * The cost is two idle elements. They are paused and never played off-screen.
 */
export const VideoStage = memo(function VideoStage({ layers, ...layerProps }: VideoStageProps) {
  return (
    <div className={styles.stage}>
      {layers.map((layer) => (
        <VideoLayer key={layer.id} layer={layer} {...layerProps} />
      ))}
      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
});
