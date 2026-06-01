// log.ts — append-only Event log + localStorage persistence adapter + migration.
//
// Separation of concerns:
//   PURE core  — appendEvent, foldLog   — immutable, no side effects, no I/O.
//   ADAPTER    — loadLog, saveLog       — reads/writes localStorage; called by the
//                                         React runtime (useLessonEngine), NOT inside folds.
//   MIGRATION  — migrateFromKitchenProgress — one-time seed of high priors for rooms
//                                              that were already mastered under the old
//                                              binary 'moms-kitchen-progress-v1' store.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls inside the pure core.
// The persistence adapter touches localStorage (a browser side-effect) and is
// intentionally in a separate function family so the fold remains replayable.

import type { Event } from './types.js';
import { allNodes } from './graph.js';

// ---------------------------------------------------------------------------
// Pure core
// ---------------------------------------------------------------------------

/** Immutably append one event to the log. Returns a NEW array — never mutates. */
export function appendEvent(log: readonly Event[], event: Event): readonly Event[] {
  return [...log, event];
}

/**
 * Apply a pure fold function over a log, accumulating state.
 * The fold is called in log order; `init` is the seed state.
 *
 * Using this rather than a raw `.reduce` means the call sites express intent,
 * and the fold is independently unit-testable.
 */
export function foldLog<S>(
  log: readonly Event[],
  init: S,
  reducer: (state: S, event: Event) => S
): S {
  return log.reduce(reducer, init);
}

// ---------------------------------------------------------------------------
// Persistence adapter (side-effectful; keep out of the fold)
// ---------------------------------------------------------------------------

const LOG_STORAGE_KEY = 'moms-engine-log-v1';

/**
 * Load the persisted event log from localStorage.
 * Returns an empty array if nothing is stored or the stored value is invalid.
 */
export function loadLog(): readonly Event[] {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as readonly Event[];
  } catch {
    return [];
  }
}

/**
 * Persist the event log to localStorage.
 * Silently swallows storage errors (quota exceeded, private-browsing restrictions).
 */
export function saveLog(log: readonly Event[]): void {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(log));
  } catch {
    // storage unavailable — continue without persistence
  }
}

// ---------------------------------------------------------------------------
// Migration (one-time; reads the old binary progress store)
// ---------------------------------------------------------------------------

/** The legacy storage key used by kitchenProgress.js */
const KITCHEN_PROGRESS_KEY = 'moms-kitchen-progress-v1';

/** High prior seed for a room that was already mastered (just below the prior clamp max). */
const MASTERED_SEED_PRIOR = 0.80;
/** Cold-start default when no prior mastery information is available. */
const DEFAULT_SEED_PRIOR = 0.10;

export interface SeedPriors {
  /** Map from node id → seed P_known prior. */
  [nodeId: string]: number;
}

/**
 * Read the legacy `moms-kitchen-progress-v1` record `{ mastered: string[] }` and
 * return a seed-prior map for the BKT cold-start.  This is called ONCE on first
 * engine init; afterward the engine's own log supersedes it.
 *
 * - A roomId present in the `mastered` list → its node gets MASTERED_SEED_PRIOR (0.80).
 * - A roomId absent from the list          → its node gets DEFAULT_SEED_PRIOR (0.10).
 *
 * The function is kept pure-ish: it reads localStorage (a side effect) but never
 * writes, and is separated from the fold so tests can call it with a mocked store.
 *
 * @param storage Injectable storage backend (defaults to window.localStorage).
 *                Pass a stub in tests.
 */
export function migrateFromKitchenProgress(
  storage: Pick<Storage, 'getItem'> = localStorage
): SeedPriors {
  let masteredRoomIds: string[] = [];
  try {
    const raw = storage.getItem(KITCHEN_PROGRESS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'mastered' in parsed &&
        Array.isArray((parsed as { mastered: unknown }).mastered)
      ) {
        masteredRoomIds = (parsed as { mastered: unknown[] }).mastered.filter(
          (x): x is string => typeof x === 'string'
        );
      }
    }
  } catch {
    // corrupt storage — treat as empty
  }

  const masteredSet = new Set(masteredRoomIds);
  const priors: SeedPriors = {};

  for (const node of allNodes()) {
    priors[node.id] = masteredSet.has(node.roomId)
      ? MASTERED_SEED_PRIOR
      : DEFAULT_SEED_PRIOR;
  }

  return priors;
}
