// test_orientationProbe.test.jsx — UI3 (gap-build-260609): the orientation probe UI.
//
// A sibling to AffectProbe. Babushka asks one OCCASIONAL orientation question
// ("What are you working on right now?") with 2–3 reader-safe tap options. The
// parent governs cadence (occasional, not per-turn). The probe is 1-tap, skippable,
// and NEVER hard-gates the learner. Mirrors test_affectProbe.test.jsx.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import OrientationProbe from '../../src/ui/OrientationProbe.jsx';

afterEach(cleanup);

const OPTS = [
  { key: 'stack', label: 'Stacking pieces to make a whole' },
  { key: 'compare', label: 'Comparing two fractions' },
  { key: 'name', label: 'Naming the fraction' },
];

describe('OrientationProbe', () => {
  it('renders nothing when not open (never blocks by default)', () => {
    const { container } = render(
      <OrientationProbe open={false} options={OPTS} onReport={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('when open, shows the prompt and reader-safe option buttons', () => {
    render(<OrientationProbe open options={OPTS} onReport={() => {}} />);
    expect(screen.getByTestId('orientation-probe')).toBeTruthy();
    // each option carries a visible text label (early-reader safe)
    for (const o of OPTS) {
      const btn = screen.getByRole('button', { name: o.label });
      expect(btn.textContent).toMatch(/\w/);
    }
  });

  it('caps options at three (no-choice-paralysis)', () => {
    const four = [...OPTS, { key: 'extra', label: 'A fourth thing' }];
    render(<OrientationProbe open options={four} onReport={() => {}} />);
    // 4 supplied options + the skip button = 5; capping leaves 3 options + skip = 4
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('is 1-tap: tapping an option reports that option key once', () => {
    const onReport = vi.fn();
    render(<OrientationProbe open options={OPTS} onReport={onReport} />);
    fireEvent.click(screen.getByRole('button', { name: OPTS[1].label }));
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onReport).toHaveBeenCalledWith('compare');
  });

  it('the prompt is in-fiction (Babushka) and readable by the tap-to-read layer', () => {
    render(<OrientationProbe open options={OPTS} onReport={() => {}} />);
    const probe = screen.getByTestId('orientation-probe');
    const prompt = probe.querySelector('[data-vox-speaker="Babushka"]');
    expect(prompt).toBeTruthy();
    expect(prompt.textContent.length).toBeGreaterThan(0);
  });

  it('is skippable: "Not now" calls onDismiss without reporting (never hard-gates)', () => {
    const onReport = vi.fn();
    const onDismiss = vi.fn();
    render(
      <OrientationProbe open options={OPTS} onReport={onReport} onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByRole('button', { name: /skip|not now/i }));
    expect(onDismiss).toHaveBeenCalled();
    expect(onReport).not.toHaveBeenCalled();
  });

  it('accepts a custom prompt (e.g. "Why did this change?")', () => {
    render(
      <OrientationProbe
        open
        prompt="Why did this change?"
        options={OPTS}
        onReport={() => {}}
      />
    );
    expect(screen.getByTestId('orientation-probe').textContent).toMatch(/why did this change/i);
  });
});
