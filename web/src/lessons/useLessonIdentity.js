/* lessons/useLessonIdentity.js — additive shell-wiring helpers (Foundation F3).

   Every lesson component wires <LessonShell> from the registry identically:
   strip the № off the number, hand the tag/title through, and map the registry's
   tabs into the StageTabs `stages` shape. These helpers centralize that so each
   component does it the SAME way (and so a registry shape change touches one
   place, not a dozen call sites).

   PURELY ADDITIVE — new module, imported by nobody yet. No existing behavior is
   altered by adding it. */

import { LESSONS } from "./index.js";

/**
 * stagesFromRegistry(id) — map a lesson's registry tabs into the canonical
 * StageTabs `stages` array: { key, badge, title, sub } per stage, in order.
 *
 *   L.tabs:  [{ n, name, sub, href }]   (registry shape)
 *        →   [{ key:n, badge:n, title:name, sub }]   (StageTabs shape)
 *
 * Returns [] for an unknown id (caller can fall back to its own STAGES).
 *
 * @param {string} id  lesson id (key into LESSONS)
 * @returns {{key:string, badge:string, title:string, sub:string}[]}
 */
export function stagesFromRegistry(id) {
  const L = LESSONS[id];
  if (!L || !Array.isArray(L.tabs)) return [];
  return L.tabs.map((t) => ({
    key: t.n,
    badge: t.n,
    title: t.name,
    sub: t.sub,
  }));
}

/**
 * useLessonIdentity(id) — resolve a lesson's shell identity from the registry.
 * Not a React hook (no hooks used); named `use*` for call-site readability and
 * future-proofing. Pure + synchronous.
 *
 * Returns:
 *   {
 *     no,     // L.num with the leading "№" stripped → LessonShell `no` prop
 *     tag,    // L.tag
 *     title,  // L.title
 *     route,  // L.route
 *     stages, // stagesFromRegistry(id)
 *     tabsFor(currentKey, onSelect, label?) // ready-to-spread LessonShell `tabs`
 *   }
 *
 * Throws if the id is unknown, so a mis-wired lesson fails loudly at mount.
 *
 * @param {string} id
 */
export function useLessonIdentity(id) {
  const L = LESSONS[id];
  if (!L) throw new Error(`useLessonIdentity: unknown lesson id "${id}"`);

  const no = String(L.num || "").replace("№", "");
  const stages = stagesFromRegistry(id);

  return {
    no,
    tag: L.tag,
    title: L.title,
    route: L.route,
    stages,
    /**
     * Build the LessonShell `tabs` object for the current stage.
     * @param {string} currentKey  key of the active stage
     * @param {(key:string)=>void} onSelect
     * @param {string} [label]
     */
    tabsFor(currentKey, onSelect, label) {
      return { stages, current: currentKey, onSelect, ...(label ? { label } : null) };
    },
  };
}

export default useLessonIdentity;
