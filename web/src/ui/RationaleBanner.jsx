// RationaleBanner.jsx — U12: "Why did this change?" banner (KTD8).
//
// Shows the latest Decision's rationale string as a thin dismissible bar.
// Appears whenever the rationale changes (a non-empty string); disappears when
// the rationale is empty or when the child dismisses it.
//
// USAGE:
//   <RationaleBanner rationale={rationale} />
//
// Props:
//   rationale  {string}  — The rationale from the latest Decision (from
//                          useLessonEngine). Empty string = banner hidden.
//
// The component does NOT import from the engine — it is a pure display layer
// that receives rationale as a prop. The caller (lesson or shell) passes the
// rationale from useLessonEngine().rationale.

import React, { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * RationaleBanner — displays the most recent engine-decision rationale.
 *
 * @param {object}  props
 * @param {string}  props.rationale  — The current rationale string. Empty = hidden.
 * @param {string}  [props.className] — Optional additional CSS class.
 */
export default function RationaleBanner({ rationale = '', className = '' }) {
  // Track whether the user has manually dismissed the current rationale.
  const [dismissed, setDismissed] = useState(false);
  // Track the rationale we last showed — when it changes, un-dismiss.
  const [lastRationale, setLastRationale] = useState(rationale);

  // When a new (non-empty) rationale arrives, un-dismiss the banner.
  useEffect(() => {
    if (rationale && rationale !== lastRationale) {
      setDismissed(false);
      setLastRationale(rationale);
    } else if (!rationale) {
      setLastRationale('');
    }
  }, [rationale, lastRationale]);

  // Hidden when empty or dismissed.
  const visible = Boolean(rationale) && !dismissed;

  if (!visible) return null;

  return (
    <div
      className={['rationale-banner', className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="rationale-banner"
    >
      <span className="rationale-banner__text">{rationale}</span>
      <button
        className="rationale-banner__dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        type="button"
      >
        ×
      </button>
    </div>
  );
}
