import { useCallback, useMemo, useReducer } from 'react';
import type { CoreId } from '../config/assetManifest';
import { CORE_ORDER } from '../config/experienceConfig';

/** The complete set of positions the experience can be in. */
export type FlowPhase =
  | 'intro-loading'
  | 'intro-playing'
  | 'choice-ready'
  | 'branch-loading'
  | 'branch-playing-forge'
  | 'branch-playing-evolve'
  | 'branch-ended-forge'
  | 'branch-ended-evolve'
  | 'error';

/** Which video layer the stage should show. */
export type LayerId = 'intro' | CoreId;

export interface FlowState {
  readonly phase: FlowPhase;
  /** Core the user picked; retained through the branch and its end screen. */
  readonly selectedCore: CoreId | null;
  /** Cores whose media has been requested. Drives each element's `preload`. */
  readonly requestedCores: readonly CoreId[];
  /**
   * Cores whose sequence has been watched to the end, in this session.
   *
   * Only ever grows — `replay` and `retry` deliberately leave it alone. Having
   * seen a path is a fact about the viewer, not about the current run, and
   * making them re-earn it would read as a punishment for pressing replay.
   */
  readonly seenCores: readonly CoreId[];
  /** Set when the browser refused to autoplay the muted intro. */
  readonly autoplayBlocked: boolean;
  readonly error: string | null;
  /** Bumped to restart the intro from frame zero. */
  readonly introRunId: number;
  /** Bumped to restart the active branch from frame zero. */
  readonly branchRunId: number;
}

export type FlowAction =
  | { type: 'intro-started' }
  | { type: 'intro-ended' }
  | { type: 'autoplay-blocked' }
  | { type: 'begin' }
  | { type: 'choose'; core: CoreId }
  | { type: 'branch-started' }
  | { type: 'branch-ended' }
  | { type: 'choose-another' }
  | { type: 'replay' }
  | { type: 'request-core'; core: CoreId }
  | { type: 'fail'; message: string }
  | { type: 'retry' };

export const INITIAL_FLOW_STATE: FlowState = {
  phase: 'intro-loading',
  selectedCore: null,
  requestedCores: [],
  seenCores: [],
  autoplayBlocked: false,
  error: null,
  introRunId: 0,
  branchRunId: 0,
};

/** Appends a core to a list unless it is already there, preserving identity. */
function withCore(list: readonly CoreId[], core: CoreId): readonly CoreId[] {
  return list.includes(core) ? list : [...list, core];
}

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'intro-started':
      return state.phase === 'intro-loading' || state.phase === 'error'
        ? { ...state, phase: 'intro-playing', autoplayBlocked: false, error: null }
        : state;

    case 'intro-ended':
      // The intro holds its final frame; the choice UI fades in over it.
      return state.phase === 'intro-playing' ? { ...state, phase: 'choice-ready' } : state;

    case 'autoplay-blocked':
      return state.phase === 'intro-loading' || state.phase === 'intro-playing'
        ? { ...state, phase: 'intro-loading', autoplayBlocked: true }
        : state;

    case 'begin':
      return { ...state, autoplayBlocked: false, introRunId: state.introRunId + 1 };

    case 'choose':
      // Guarded here rather than in the view: once we leave `choice-ready`,
      // further clicks cannot change the branch.
      if (state.phase !== 'choice-ready') return state;
      return {
        ...state,
        phase: 'branch-loading',
        selectedCore: action.core,
        requestedCores: withCore(state.requestedCores, action.core),
        branchRunId: state.branchRunId + 1,
        error: null,
      };

    case 'branch-started':
      if (state.phase !== 'branch-loading' || !state.selectedCore) return state;
      return {
        ...state,
        phase: state.selectedCore === 'forge' ? 'branch-playing-forge' : 'branch-playing-evolve',
      };

    // Reaching the end of a sequence is what marks a core as seen — starting it
    // is not enough, or leaving halfway would count.
    case 'branch-ended':
      if (state.phase === 'branch-playing-forge')
        return {
          ...state,
          phase: 'branch-ended-forge',
          seenCores: withCore(state.seenCores, 'forge'),
        };
      if (state.phase === 'branch-playing-evolve')
        return {
          ...state,
          phase: 'branch-ended-evolve',
          seenCores: withCore(state.seenCores, 'evolve'),
        };
      return state;

    case 'choose-another':
      // Straight back to the intro's held final frame — no re-watch, no reload.
      return { ...state, phase: 'choice-ready', selectedCore: null, error: null };

    case 'replay':
      return {
        ...state,
        phase: 'intro-loading',
        selectedCore: null,
        autoplayBlocked: false,
        error: null,
        introRunId: state.introRunId + 1,
      };

    case 'request-core':
      return { ...state, requestedCores: withCore(state.requestedCores, action.core) };

    case 'fail':
      return { ...state, phase: 'error', error: action.message };

    case 'retry':
      return {
        ...state,
        phase: 'intro-loading',
        selectedCore: null,
        autoplayBlocked: false,
        error: null,
        introRunId: state.introRunId + 1,
        branchRunId: state.branchRunId + 1,
      };

    default:
      return state;
  }
}

export interface FlowView {
  readonly state: FlowState;
  readonly dispatch: React.Dispatch<FlowAction>;
  /** Layer the stage must show right now. */
  readonly activeLayer: LayerId;
  readonly isChoiceVisible: boolean;
  readonly isEndVisible: boolean;
  readonly isBranchBusy: boolean;
  /** Core whose finale copy the end overlay should show. */
  readonly endedCore: CoreId | null;
  /** True once every path has been watched through — the end screen changes. */
  readonly bothCoresSeen: boolean;
  readonly actions: {
    choose: (core: CoreId) => void;
    chooseAnother: () => void;
    replay: () => void;
    retry: () => void;
    begin: () => void;
  };
}

/**
 * Resolves which layer is on screen.
 *
 * `branch-loading` deliberately keeps the **intro** layer visible: the intro is
 * parked on its final frame, so buffering a branch never exposes black, and the
 * branch layer only becomes visible once it is genuinely playing.
 */
export function resolveActiveLayer(state: FlowState): LayerId {
  switch (state.phase) {
    case 'branch-playing-forge':
    case 'branch-ended-forge':
      return 'forge';
    case 'branch-playing-evolve':
    case 'branch-ended-evolve':
      return 'evolve';
    default:
      return 'intro';
  }
}

export function useChoiceFlow(): FlowView {
  const [state, dispatch] = useReducer(flowReducer, INITIAL_FLOW_STATE);

  const choose = useCallback((core: CoreId) => dispatch({ type: 'choose', core }), []);
  const chooseAnother = useCallback(() => dispatch({ type: 'choose-another' }), []);
  const replay = useCallback(() => dispatch({ type: 'replay' }), []);
  const retry = useCallback(() => dispatch({ type: 'retry' }), []);
  const begin = useCallback(() => dispatch({ type: 'begin' }), []);

  const actions = useMemo(
    () => ({ choose, chooseAnother, replay, retry, begin }),
    [choose, chooseAnother, replay, retry, begin],
  );

  return useMemo(() => {
    const endedCore: CoreId | null =
      state.phase === 'branch-ended-forge'
        ? 'forge'
        : state.phase === 'branch-ended-evolve'
          ? 'evolve'
          : null;

    return {
      state,
      dispatch,
      activeLayer: resolveActiveLayer(state),
      isChoiceVisible: state.phase === 'choice-ready',
      isEndVisible: endedCore !== null,
      isBranchBusy: state.phase === 'branch-loading',
      endedCore,
      bothCoresSeen: CORE_ORDER.every((core) => state.seenCores.includes(core)),
      actions,
    };
  }, [state, actions]);
}
