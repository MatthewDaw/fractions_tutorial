// harness/dashboard/index.js — the dashboard's public entry + a standalone mount.
//
// WIRING (kept OUT of Shell.jsx on purpose — Shell is a runtime file owned by the
// parallel 002 worker). To expose the demo at #/harness, the Shell owner adds ONE
// dev-only branch, mirroring the MasteryInspector gate:
//
//   import HarnessDashboard from './harness/dashboard/index.js';
//   if (import.meta.env.DEV && route === 'harness') return <HarnessDashboard />;
//
// …or mount it standalone (e.g. a scratch harness.html entry) via mountHarnessDashboard.

export { default } from './HarnessDashboard.jsx';
export { default as HarnessDashboard } from './HarnessDashboard.jsx';
export { default as FailureHeatmap } from './FailureHeatmap.jsx';
export { default as RecursivePanel } from './RecursivePanel.jsx';
export { default as VerdictCard } from './VerdictCard.jsx';
export { buildHeatmap, cardsForCell, runDemoSweep, replaySession, DEMO_PERSONA_IDS, DEMO_SKILL_IDS } from './data.js';

/**
 * Mount the dashboard into a DOM node (standalone demo entry). Browser-only — it
 * dynamically imports react-dom/client so this module stays importable in Node.
 * @param {HTMLElement} el
 * @param {object} [props]  forwarded to <HarnessDashboard>
 * @returns {Promise<{ unmount: () => void }>}
 */
export async function mountHarnessDashboard(el, props = {}) {
  const [{ createRoot }, React, { default: HarnessDashboard }] = await Promise.all([
    import('react-dom/client'),
    import('react'),
    import('./HarnessDashboard.jsx'),
  ]);
  const root = createRoot(el);
  root.render(React.createElement(HarnessDashboard, props));
  return { unmount: () => root.unmount() };
}
