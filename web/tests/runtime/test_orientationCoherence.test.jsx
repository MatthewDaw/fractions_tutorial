// test_orientationCoherence.test.jsx — UI3 (gap-build-260609): the coherence
// counter-metric. recordCoherence() accumulates answered orientation probes into
// engineStore.metrics (advisory instrumentation — NEVER the mastery gate), and the
// MasteryInspector surfaces the ratio. Skips record nothing.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

import {
  recordCoherence,
  resetEngineStore,
  getSnapshot,
} from '../../src/runtime/engineStore.js';
import { evaluateOrientationReport } from '../../src/runtime/affect/orientationReport.js';
import MasteryInspector from '../../src/ui/MasteryInspector.jsx';

beforeEach(() => {
  resetEngineStore();
  cleanup();
});

describe('engineStore coherence metric', () => {
  it('starts at zero', () => {
    const s = getSnapshot();
    expect(s.metrics.coherenceAsked).toBe(0);
    expect(s.metrics.coherenceCorrect).toBe(0);
  });

  it('recordCoherence accumulates asked + correct', () => {
    recordCoherence(true);
    recordCoherence(false);
    recordCoherence(true);
    const s = getSnapshot();
    expect(s.metrics.coherenceAsked).toBe(3);
    expect(s.metrics.coherenceCorrect).toBe(2);
  });

  it('a graded report drives the metric end-to-end (probe → grade → store)', () => {
    const coherent = evaluateOrientationReport('stack', 'stack');
    const incoherent = evaluateOrientationReport('compare', 'stack');
    recordCoherence(coherent.coherent);
    recordCoherence(incoherent.coherent);
    const s = getSnapshot();
    expect(s.metrics.coherenceAsked).toBe(2);
    expect(s.metrics.coherenceCorrect).toBe(1);
  });

  it('does not touch uiChurn (firewalled from the structural metric)', () => {
    recordCoherence(true);
    expect(getSnapshot().metrics.uiChurn).toBe(0);
  });
});

describe('MasteryInspector surfaces coherence', () => {
  it('shows the coherence ratio in counter-metrics when probes were answered', () => {
    render(
      <MasteryInspector
        masteryMap={null}
        decisionLog={[]}
        counterMetrics={{ coherenceAsked: 4, coherenceCorrect: 3 }}
      />
    );
    // The inspector starts collapsed; open it via its toggle.
    fireEvent.click(screen.getByTestId('inspector-toggle'));
    const cell = screen.getByTestId('metric-coherence');
    expect(cell.textContent).toMatch(/75\.0%/);
    expect(cell.textContent).toMatch(/3\/4/);
  });

  it('renders a dash when no orientation probe was answered yet', () => {
    render(
      <MasteryInspector masteryMap={null} decisionLog={[]} counterMetrics={{}} />
    );
    fireEvent.click(screen.getByTestId('inspector-toggle'));
    expect(screen.getByTestId('metric-coherence').textContent).toMatch(/—/);
  });
});
