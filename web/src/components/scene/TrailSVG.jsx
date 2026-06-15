// TrailSVG.jsx — the ink "recipe trail" overlay used on the world map. Extracted
// from WorldMap so both the TOP-LEVEL spokes (kitchen → each shelf) and the
// SUBMENU chain (lesson → lesson, left→right) share one trail renderer.
//
// Pure presentation. The caller supplies the list of {a:{x,y}, b:{x,y}} segments
// plus the bezier `lift` and the per-segment opacities; the magic numbers that
// used to live inline in WorldMap now live here in ONE place.

/**
 * A soft quadratic "recipe trail" path between two points.
 */
export function trailPath(ax, ay, bx, by, lift = 28) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 - lift;
  return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
}

/**
 * One double-stroked trail spoke (solid ink under a dashed red).
 * @param {{ d: string, inkOpacity?: number, redOpacity?: number }} props
 */
export function TrailSpoke({ d, inkOpacity = 0.8, redOpacity = 0.85 }) {
  return (
    <g>
      <path d={d} fill="none" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" opacity={inkOpacity} />
      <path d={d} fill="none" stroke="var(--red)" strokeWidth="1.3" strokeDasharray="1 8" strokeLinecap="round" opacity={redOpacity} />
    </g>
  );
}

/**
 * The full trail overlay (an absolutely-positioned, pointer-transparent SVG).
 *
 * @param {{
 *   segments: { a:{x:number,y:number}, b:{x:number,y:number} }[],
 *   lift?: number,
 *   inkOpacity?: number,
 *   redOpacity?: number,
 *   hub?: { x:number, y:number } | null,   // optional centre dot (kitchen hub)
 * }} props
 */
export default function TrailSVG({ segments, lift = 28, inkOpacity = 0.8, redOpacity = 0.85, hub = null }) {
  return (
    <svg className="wedges" viewBox="0 0 1280 800" preserveAspectRatio="none" aria-hidden="true">
      {segments.map((s, i) => (
        <TrailSpoke
          key={i}
          d={trailPath(s.a.x, s.a.y, s.b.x, s.b.y, lift)}
          inkOpacity={inkOpacity}
          redOpacity={redOpacity}
        />
      ))}
      {hub && <circle cx={hub.x} cy={hub.y} r="5" fill="var(--ink)" />}
    </svg>
  );
}
