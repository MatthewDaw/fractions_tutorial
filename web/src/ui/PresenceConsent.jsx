// PresenceConsent.jsx — Phase 4 (plan 005, S2): the OPT-IN camera consent gate.
//
// The camera is OFF until the user (a parent, with the child) explicitly taps
// "Turn the camera on". This component NEVER touches the camera itself — it only
// surfaces the choice and calls onConsent / onDecline. The parent wires onConsent
// to runtime/affect/presence.grantConsentAndStart, which is the ONLY place the
// on-device landmarker is started. No auto-start, no pre-checked box, no camera
// access before a deliberate tap.
//
// Privacy copy is regulator-legible and honest about the on-device, two-boolean,
// no-emotion posture (plan 005 §"Privacy & regulatory posture"):
//   • on-device only — no video leaves the tablet,
//   • the app only learns "is someone there?" (present / sensor_valid), never mood,
//   • can be turned off any time.
//
// Props:
//   open       {boolean}        — render only when true.
//   onConsent  {()=>void}       — called when the user OPTS IN. Parent starts camera.
//   onDecline  {()=>void}       — called when the user declines (default state stands).
//   nickname   {string}         — in-fiction address.

import React from 'react';
import '../styles/presenceconsent.css';

export default function PresenceConsent({ open = false, onConsent, onDecline, nickname = 'solnyshko' }) {
  if (!open) return null;

  return (
    <div
      className="presence-consent"
      role="dialog"
      aria-label="Turn the camera on?"
      data-testid="presence-consent"
    >
      <div className="presence-consent__card">
        <p className="presence-consent__prompt qcap" data-vox-speaker="Babushka">
          {nickname}, may I peek to see if you are still here? The camera stays right
          on this tablet — I only learn if someone is sitting here, never how you feel.
        </p>

        <ul className="presence-consent__facts">
          <li>Stays on this device — no video is saved or sent anywhere.</li>
          <li>Only learns &ldquo;is someone here?&rdquo; — never your mood.</li>
          <li>You can turn it off any time.</li>
        </ul>

        <div className="presence-consent__choices">
          <button
            type="button"
            className="presence-consent__yes"
            onClick={() => onConsent && onConsent()}
            data-testid="presence-consent-yes"
          >
            Turn the camera on
          </button>
          <button
            type="button"
            className="presence-consent__no"
            onClick={() => onDecline && onDecline()}
            data-testid="presence-consent-no"
          >
            No, thank you
          </button>
        </div>
      </div>
    </div>
  );
}
