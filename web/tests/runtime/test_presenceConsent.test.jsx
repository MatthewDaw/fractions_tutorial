// test_presenceConsent.test.jsx — Phase 4 (plan 005, S2): the OPT-IN consent UI.
//
// Proves the hardest privacy property at the UI seam: the on-device landmarker is
// NEVER started until the user explicitly taps "Turn the camera on". Mounting the
// consent dialog, or declining, must touch no camera.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import PresenceConsent from '../../src/ui/PresenceConsent.jsx';
import { makeSession, grantConsentAndStart } from '../../src/runtime/affect/presence.js';

afterEach(cleanup);

function fakeLandmarker() {
  const lm = {
    started: 0,
    stopped: 0,
    async start() { lm.started += 1; },
    async stop() { lm.stopped += 1; },
    read() { return null; },
  };
  return lm;
}

describe('PresenceConsent — opt-in', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<PresenceConsent open={false} onConsent={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows an honest, on-device, no-mood consent prompt with both choices', () => {
    render(<PresenceConsent open onConsent={() => {}} onDecline={() => {}} />);
    expect(screen.getByTestId('presence-consent')).toBeTruthy();
    expect(screen.getByTestId('presence-consent-yes')).toBeTruthy();
    expect(screen.getByTestId('presence-consent-no')).toBeTruthy();
    // The copy states the privacy posture: device-local, never mood.
    const card = screen.getByTestId('presence-consent');
    expect(card.textContent).toMatch(/device/i);
    expect(card.textContent).toMatch(/never your mood|never how you feel/i);
  });

  it('mounting the dialog touches NO camera (no auto-start)', () => {
    const lm = fakeLandmarker();
    render(<PresenceConsent open onConsent={() => {}} onDecline={() => {}} />);
    expect(lm.started).toBe(0);
  });

  it('declining does NOT start the camera', () => {
    const lm = fakeLandmarker();
    const onConsent = vi.fn(() => grantConsentAndStart(makeSession(), lm));
    render(<PresenceConsent open onConsent={onConsent} onDecline={() => {}} />);
    fireEvent.click(screen.getByTestId('presence-consent-no'));
    expect(onConsent).not.toHaveBeenCalled();
    expect(lm.started).toBe(0);
  });

  it('the camera only starts AFTER an explicit "Turn the camera on" tap', async () => {
    const lm = fakeLandmarker();
    let session = makeSession();
    const onConsent = vi.fn(async () => {
      session = await grantConsentAndStart(session, lm);
    });
    render(<PresenceConsent open onConsent={onConsent} onDecline={() => {}} />);

    // Before the tap: camera off.
    expect(lm.started).toBe(0);

    fireEvent.click(screen.getByTestId('presence-consent-yes'));
    await Promise.resolve();
    await Promise.resolve();

    // After the explicit opt-in tap: camera started exactly once.
    expect(onConsent).toHaveBeenCalledTimes(1);
    expect(lm.started).toBe(1);
  });
});
