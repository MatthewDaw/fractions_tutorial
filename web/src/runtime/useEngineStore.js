// useEngineStore.js — React binding for engineStore.js.
//
// Kept separate so engineStore.js stays a plain, React-free observable that the
// engine runtime can publish to and unit tests can drive without a renderer.
import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot } from './engineStore.js';

/** Subscribe a component to the live engine store snapshot. */
export function useEngineStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
