// icons.jsx — shared woodcut icon registry for standalone scenes. Centralises the
// SVGs the Settings screen uses (and that other scenes can reuse), so the muted-
// state icon logic lives in ONE place instead of being duplicated per scene.
//
// VoiceIcon / MusicIcon take a `muted` flag → adds the diagonal "off" slash.
// StylusIcon / TypingIcon are the input-mode card glyphs. Check is the little
// "Selected" tick. All pure presentation.

export function VoiceIcon({ muted }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 6 H26 Q29 6 29 9 V18 Q29 21 26 21 H15 L9 26 V21 H6 Q3 21 3 18 V9 Q3 6 6 6 Z"
        fill="#e3d4b1" stroke="#1c1612" strokeWidth="2.1" strokeLinejoin="round" />
      <g stroke="#a32a22" strokeWidth="2" strokeLinecap="round"><path d="M7 11 H25" /><path d="M7 16 H19" /></g>
      {muted && <path d="M5 5 L27 25" stroke="#6b5a47" strokeWidth="2.4" strokeLinecap="round" />}
    </svg>
  );
}

export function MusicIcon({ muted }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M13 22 V8 L25 5 V19" fill="none" stroke="#1c1612" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M13 8 L25 5" stroke="#1c1612" strokeWidth="2.1" strokeLinecap="round" />
      <ellipse cx="10" cy="23" rx="4" ry="3" fill="#a32a22" stroke="#1c1612" strokeWidth="2" transform="rotate(-18 10 23)" />
      <ellipse cx="22" cy="20" rx="4" ry="3" fill="#a32a22" stroke="#1c1612" strokeWidth="2" transform="rotate(-18 22 20)" />
      {muted && <path d="M5 6 L29 27" stroke="#6b5a47" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
}

export function TypingIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 56 56" aria-hidden="true">
      <rect x="8" y="26" width="40" height="20" rx="3" fill="none" stroke="#1c1612" strokeWidth="2.4" />
      <rect x="16" y="10" width="24" height="13" rx="2" fill="#e3d4b1" stroke="#1c1612" strokeWidth="2.2" />
      <line x1="13" y1="23" x2="43" y2="23" stroke="#1c1612" strokeWidth="2.2" />
      <g fill="#a32a22" stroke="#1c1612" strokeWidth="1.4">
        <circle cx="16" cy="34" r="2.6" /><circle cx="24" cy="34" r="2.6" /><circle cx="32" cy="34" r="2.6" /><circle cx="40" cy="34" r="2.6" />
      </g>
      <rect x="20" y="40" width="16" height="3.4" rx="1.7" fill="#1c1612" />
    </svg>
  );
}

export function StylusIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 56 56" aria-hidden="true">
      <path d="M40 8 L48 16 L24 40 L14 42 L16 32 Z" fill="#e3d4b1" stroke="#1c1612" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M40 8 L48 16" stroke="#1c1612" strokeWidth="2.4" />
      <path d="M16 32 L24 40" stroke="#1c1612" strokeWidth="2" />
      <path d="M14 42 L16 38 L18 40 Z" fill="#a32a22" stroke="#1c1612" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 48 Q20 44 30 48 T50 48" fill="none" stroke="#a32a22" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Check() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M1 6 L4.5 10 L11 1.5" fill="none" stroke="#6e1c16" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
