// test_affectProbe.test.jsx — Phase 3 (plan 005, S3): the self-report probe UI.
//
// Babushka asks "tricky, or easy-peasy?" with two big tappable faces. Reader-safe
// (each face carries a TEXT label, not just an emoji) and in-fiction. The tap is the
// gold-standard self-report; the parent owns when the probe appears (rare T3 pauses).

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import AffectProbe from '../../src/ui/AffectProbe.jsx';

afterEach(cleanup);

describe('AffectProbe', () => {
  it('renders nothing when not open', () => {
    const { container } = render(<AffectProbe open={false} onReport={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('when open, shows a prompt and two reader-safe face buttons', () => {
    render(<AffectProbe open onReport={() => {}} />);
    expect(screen.getByTestId('affect-probe')).toBeTruthy();
    const easy = screen.getByRole('button', { name: /easy-peasy/i });
    const tricky = screen.getByRole('button', { name: /tricky/i });
    // reader-safe: a visible text label, not only an emoji
    expect(easy.textContent).toMatch(/easy/i);
    expect(tricky.textContent).toMatch(/tricky/i);
  });

  it('tapping easy reports "easy"; tapping tricky reports "tricky"', () => {
    const onReport = vi.fn();
    render(<AffectProbe open onReport={onReport} />);
    fireEvent.click(screen.getByRole('button', { name: /easy-peasy/i }));
    expect(onReport).toHaveBeenCalledWith('easy');

    onReport.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /tricky/i }));
    expect(onReport).toHaveBeenCalledWith('tricky');
  });

  it('the prompt is in-fiction (Babushka) and readable by the tap-to-read layer', () => {
    render(<AffectProbe open onReport={() => {}} />);
    const probe = screen.getByTestId('affect-probe');
    // a readable copy block carrying Babushka's speaker tag for in-character TTS
    const prompt = probe.querySelector('[data-vox-speaker]');
    expect(prompt).toBeTruthy();
    expect(prompt.textContent.length).toBeGreaterThan(0);
  });

  it('offers a skip that calls onDismiss without reporting', () => {
    const onReport = vi.fn();
    const onDismiss = vi.fn();
    render(<AffectProbe open onReport={onReport} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /skip|not now|×/i }));
    expect(onDismiss).toHaveBeenCalled();
    expect(onReport).not.toHaveBeenCalled();
  });
});
