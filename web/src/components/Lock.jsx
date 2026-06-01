// Lock.jsx — a small engraved padlock (shared). Used for R1's locked denominator
// and R4's locked leftover size. Pure inline SVG, sized/colored by props.
export default function Lock({ size = 13, color = "var(--ink)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
      <rect x="4" y="11" width="16" height="11" rx="2" fill="none" stroke={color} strokeWidth="2" />
      <path d="M8 11 V8 a4 4 0 0 1 8 0 V11" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="16" r="1.6" fill={color} />
    </svg>
  );
}
