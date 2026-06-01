// Rosette.jsx — engraved star rating (the "marks" awarded for the answer).
// count of 3 = best, biggest cuts; fewer for over-slicing.
export default function Rosette({ count = 0, total = 3, size = 30 }) {
  const star = (filled, key) => (
    <svg key={key} width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path
        d="M12 2.6 L14.7 9.2 L21.8 9.7 L16.3 14.2 L18.1 21.1 L12 17.2 L5.9 21.1 L7.7 14.2 L2.2 9.7 L9.3 9.2 Z"
        fill={filled ? "var(--red)" : "transparent"}
        stroke={filled ? "var(--red-deep)" : "var(--ink-mute)"}
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity={filled ? 1 : 0.4}
      />
    </svg>
  );
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => star(i < count, i))}
    </div>
  );
}
