// props.jsx — Babushka's Room kitchen story props (assets 1–12), ported from the
// design contact-sheet bundle to ES modules. Each is prop-driven by `state`,
// self-contained, and draws the shared Ruler so the math reads on a number line.
import { C, useUID, AssetDefs, Ruler, Twine, STAGE } from "./kit.jsx";

const { VB, X0, X1, RY, LEN } = STAGE;

// radial wedge path (angles in radians, 0 = +x, sweep clockwise)
function wedge(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [ax, ay] = p(a0), [bx, by] = p(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${cx} ${cy} L${ax} ${ay} A${r} ${r} 0 ${large} 1 ${bx} ${by} Z`;
}

/* ───────────────── 1. Scored chocolate bar (8 squares) ───────────────── */
// state: 'full' | 'squares_snapped' | 'needed_outline_ghost'
export function ChocolateBar({ state = "full" }) {
  const u = useUID();
  const n = 8, cw = LEN / n, top = 112, h = 50;
  const present = state === "squares_snapped" ? 5 : 8;
  const ghost = state === "needed_outline_ghost" ? 3 : 0;
  const cell = (i) => {
    const x = X0 + i * cw;
    const on = i < present;
    return (
      <g key={i}>
        <rect x={x + 1.5} y={top + 1.5} width={cw - 3} height={h - 3} rx="3"
          fill={C.paper3} stroke={C.ink} strokeWidth="1.2" opacity={on ? 0 : 1} />
        {on && (
          <g>
            <rect x={x + 2} y={top + 2} width={cw - 4} height={h - 4} rx="3"
              fill={C.inkSoft} stroke={C.ink} strokeWidth="2" />
            <rect x={x + 2} y={top + 2} width={cw - 4} height={h - 4} rx="3" fill={`url(#lh-${u})`} />
            <rect x={x + 7} y={top + 7} width={cw - 14} height={h - 14} rx="2"
              fill="none" stroke="#000" strokeOpacity="0.28" strokeWidth="2" />
            <rect x={x + 6} y={top + 6} width={cw - 14} height={h - 14} rx="2"
              fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.4" />
          </g>
        )}
      </g>
    );
  };
  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      {state === "squares_snapped" && (
        <g className="anim-snap">
          {[0, 1, 2].map((k) => {
            const x = X0 + (present + k) * cw + 6;
            return (
              <g key={k} transform={`translate(${x},${top - 64}) rotate(${-8 + k * 7})`}>
                <rect x="0" y="0" width={cw - 8} height={h - 8} rx="3" fill={C.inkSoft} stroke={C.ink} strokeWidth="2" />
                <rect x="0" y="0" width={cw - 8} height={h - 8} rx="3" fill={`url(#lh-${u})`} />
                <rect x="4" y="4" width={cw - 16} height={h - 16} rx="2" fill="none" stroke="#000" strokeOpacity="0.28" strokeWidth="1.8" />
              </g>
            );
          })}
        </g>
      )}
      <rect x={X0 - 4} y={top - 6} width={LEN + 8} height={h + 12} rx="5" fill={C.paper2} stroke={C.ink} strokeWidth="2.6" />
      {Array.from({ length: n }, (_, i) => cell(i))}
      {Array.from({ length: n - 1 }, (_, i) => (
        <line key={i} x1={X0 + (i + 1) * cw} y1={top} x2={X0 + (i + 1) * cw} y2={top + h}
          stroke={C.ink} strokeWidth="1.2" opacity="0.5" />
      ))}
      {ghost > 0 && (
        <rect className="anim-pulse" x={X0 + 1} y={top - 2} width={cw * ghost - 2} height={h + 4} rx="4"
          fill="none" stroke={C.red} strokeWidth="2.4" strokeDasharray="7 5" />
      )}
      <Ruler x0={X0} x1={X1} y={RY} n={n} />
    </svg>
  );
}

/* ───────────────── 2. Pie in a tin (sliceable into N) ───────────────── */
// state: 'slices_present' | 'slices_missing' | 'target_shaded'
export function Pie({ state = "slices_present", n = 6 }) {
  const u = useUID();
  const cx = 170, cy = 92, r = 62, tin = r + 9;
  const present = state === "slices_missing" ? 4 : n;
  const target = state === "target_shaded" ? 4 : 0;
  const a0 = -Math.PI / 2;
  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      <ellipse cx={cx} cy={cy + 4} rx={tin} ry={tin * 0.92} fill={C.paper3} stroke={C.ink} strokeWidth="2.6" />
      <ellipse cx={cx} cy={cy} rx={tin} ry={tin * 0.92} fill={C.paper2} stroke={C.ink} strokeWidth="2.6" />
      <ellipse cx={cx} cy={cy} rx={tin} ry={tin * 0.92} fill={`url(#lh-${u})`} opacity="0.5" />
      {Array.from({ length: n }, (_, i) => {
        const s = a0 + (i * 2 * Math.PI) / n;
        const e = a0 + ((i + 1) * 2 * Math.PI) / n;
        const here = i < present;
        const shaded = i < target;
        const fill = !here ? C.paper3 : shaded ? `url(#rh-${u})` : `url(#stip-${u})`;
        return (
          <path key={i} className={shaded ? "anim-pulse" : ""} d={wedge(cx, cy, r, s, e)}
            fill={fill} stroke={C.ink} strokeWidth="1.8" strokeLinejoin="round"
            opacity={here ? 1 : 0.85} />
        );
      })}
      <ellipse cx={cx} cy={cy} rx={r + 1} ry={(r + 1) * 0.99} fill="none" stroke={C.redDeep} strokeWidth="2.2" strokeDasharray="5 3" opacity="0.8" />
      <Ruler x0={X0} x1={X1} y={RY} n={n} />
    </svg>
  );
}

/* ───────────────── 3. Tray / sheet-cake, swappable cut lines ───────────────── */
// state: 'uncut' | 'cut_n' | 'merging'.  cuts = denominator shown (2|3|4|6)
export function SheetCake({ state = "cut_n", cuts = 4 }) {
  const u = useUID();
  const n = state === "uncut" ? 1 : cuts;
  const cw = LEN / n;
  const merging = state === "merging";
  const choc = "#5a3a22", sponge = "#d8bc84", cream = "#f4e8c6";
  const ft = 98, fb = 114;
  const bodyTop = 112, baseY = 165;

  let frost = `M${X0} ${ft}`;
  const wn = 7;
  for (let i = 1; i <= wn; i++) {
    const x = X0 + (LEN * i) / wn, cxx = X0 + (LEN * (i - 0.5)) / wn;
    frost += ` Q${cxx} ${ft + (i % 2 ? -5 : -1)} ${x} ${ft}`;
  }
  frost += ` L${X1} ${fb}`;
  const dn = 9, depths = [5, 15, 7, 19, 9, 13, 6, 17, 7];
  for (let i = 0; i < dn; i++) {
    const xc = X1 - (LEN * (i + 0.5)) / dn, xl = X1 - (LEN * (i + 1)) / dn;
    frost += ` Q${xc} ${fb + depths[i]} ${xl} ${fb}`;
  }
  frost += " Z";

  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      <rect x={X0} y={bodyTop} width={LEN} height={baseY - bodyTop} fill={sponge} stroke={C.ink} strokeWidth="2.4" />
      <rect x={X0} y={bodyTop} width={LEN} height={baseY - bodyTop} fill={`url(#lh-${u})`} opacity="0.22" />
      <rect x={X0} y={139} width={LEN} height={9} fill={cream} />
      <line x1={X0} y1={139} x2={X1} y2={139} stroke={C.ink} strokeWidth="1" opacity="0.45" />
      <line x1={X0} y1={148} x2={X1} y2={148} stroke={C.ink} strokeWidth="1" opacity="0.45" />
      {Array.from({ length: 26 }, (_, i) => (
        <circle key={i} cx={X0 + 8 + (i * 53) % (LEN - 16)} cy={122 + ((i * 37) % 38)} r="1.1" fill={C.ink} opacity="0.3" />
      ))}
      <path d={frost} fill={choc} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={frost} fill={`url(#lh-${u})`} opacity="0.35" />
      <path d={`M${X0 + 16} ${ft + 1} Q${X0 + LEN * 0.28} ${ft - 4} ${X0 + LEN * 0.5} ${ft + 1}`}
        stroke="#fff" strokeWidth="2" fill="none" opacity="0.22" strokeLinecap="round" />
      {Array.from({ length: 6 }, (_, i) => {
        const x = X0 + 26 + i * ((LEN - 52) / 5);
        const cherry = i === 1 || i === 4;
        return (
          <g key={i}>
            {cherry ? (
              <g>
                <circle cx={x} cy={89} r="6" fill={C.red} stroke={C.redDeep} strokeWidth="1.8" />
                <circle cx={x - 2} cy={87} r="1.4" fill={C.paper1} opacity="0.6" />
                <path d={`M${x} 83 q3 -6 7 -7`} stroke={C.ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                <circle cx={x} cy={89} r="7.5" fill={choc} stroke={C.ink} strokeWidth="1.8" />
                <path d={`M${x - 4.5} 89 Q${x} 84 ${x + 4.5} 89`} stroke={cream} strokeWidth="1.5" fill="none" opacity="0.65" />
              </g>
            )}
          </g>
        );
      })}
      {n > 1 && Array.from({ length: n - 1 }, (_, i) => {
        const x = X0 + (i + 1) * cw;
        const isMerge = merging && i === 0;
        return (
          <line key={i} className={isMerge ? "anim-merge" : ""} x1={x} y1={86} x2={x} y2={baseY}
            stroke={C.ink} strokeWidth="1.8" strokeDasharray={merging ? "0" : "4 3"} opacity={isMerge ? 0.22 : 0.8} />
        );
      })}
      <Ruler x0={X0} x1={X1} y={RY} n={state === "uncut" ? 2 : cuts} labels={true} />
    </svg>
  );
}

/* ───────────────── 4. Dough strip + bacon strip on the ruler ───────────────── */
// state: 'whole' | 'sliced' | 'joined'
export function DoughBacon({ state = "whole" }) {
  const u = useUID();
  const n = 4, gap = state === "sliced" ? 4 : 0;
  const dY = 92, bY = 132, sh = 30;

  const baconStreaks = (x, y, w, h) => (
    <g>
      {[0.32, 0.6, 0.84].map((f, k) => (
        <path key={k} d={`M${x} ${y + h * f} q${w / 4} ${k % 2 ? 6 : -6} ${w / 2} 0 t${w / 2} 0`}
          fill="none" stroke={C.paper1} strokeWidth="3.4" opacity="0.8" strokeLinecap="round" />
      ))}
    </g>
  );
  const strip = (y, fill, stroke, isBacon) => {
    if (state === "joined") return null;
    const seg = (LEN - gap * (n - 1)) / n;
    return Array.from({ length: state === "whole" ? 1 : n }, (_, i) => {
      const w = state === "whole" ? LEN : seg;
      const x = X0 + i * (seg + gap);
      return (
        <g key={i} className={state === "sliced" ? "anim-snap" : ""}>
          <rect x={x} y={y} width={w} height={sh} rx="4" fill={fill} stroke={stroke} strokeWidth="2.4" />
          {isBacon && baconStreaks(x, y, w, sh)}
        </g>
      );
    });
  };
  const joined = () => {
    const total = 6, seg = LEN / total;
    return Array.from({ length: total }, (_, i) => {
      const x = X0 + i * seg, isB = i >= 3;
      return (
        <g key={i}>
          <rect x={x} y={dY + 18} width={seg} height={sh} rx="2"
            fill={isB ? `url(#rh-${u})` : `url(#stip-${u})`} stroke={C.ink} strokeWidth="2.2" />
          {i < total - 1 && <line x1={x + seg} y1={dY + 18} x2={x + seg} y2={dY + 18 + sh} stroke={C.ink} strokeWidth="1.2" opacity="0.5" />}
        </g>
      );
    });
  };

  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      {state === "joined" ? (
        <g className="anim-merge">{joined()}</g>
      ) : (
        <g>
          {strip(dY, `url(#stip-${u})`, C.ink, false)}
          {strip(bY, C.red, C.redDeep, true)}
        </g>
      )}
      <Ruler x0={X0} x1={X1} y={RY} n={state === "whole" ? 1 : 6} labels={true} />
    </svg>
  );
}

/* ───────────────── 5. Mismatched candy bars (4-split vs 6-split) ───────────────── */
// state: 'idle' | 'recut' | 'matched'
export function CandyBars({ state = "idle" }) {
  const u = useUID();
  const topN = state === "matched" ? 6 : 4;
  const botN = 6;
  const ty = 80, by = 132, h = 40;
  const matched = state === "matched";

  const bar = (y, n, fillId, isTop) => {
    const cw = LEN / n;
    return (
      <g className={matched ? "anim-glow" : ""}>
        <rect x={X0} y={y} width={LEN} height={h} rx="5"
          fill={`url(#${fillId}-${u})`} stroke={C.ink} strokeWidth="2.6" />
        <rect x={X0} y={y} width={LEN} height={h} rx="5" fill={`url(#bevelT-${u})`} />
        {Array.from({ length: n - 1 }, (_, i) => (
          <line key={i} x1={X0 + (i + 1) * cw} y1={y} x2={X0 + (i + 1) * cw} y2={y + h}
            stroke={C.ink} strokeWidth="2" opacity="0.8" />
        ))}
        {isTop && state === "recut" && [1, 3, 5].map((k) => (
          <line key={k} className="anim-pulse" x1={X0 + (k * LEN) / 6} y1={y - 4} x2={X0 + (k * LEN) / 6} y2={y + h + 4}
            stroke={C.red} strokeWidth="2" strokeDasharray="4 3" />
        ))}
        <text x={X1 + 6} y={y + h / 2 + 5} style={{ font: "700 15px var(--display)", fill: C.inkMute }}>×{n}</text>
      </g>
    );
  };
  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      {bar(ty, topN, "rh", true)}
      {bar(by, botN, "ih", false)}
      <Ruler x0={X0} x1={X1} y={RY} n={6} labels={true} />
    </svg>
  );
}

/* ───────────────── 6. Cracker sheet (4) ───────────────── */
// state: 'whole' | 'snap_lines' | 'piece_highlight'
export function CrackerSheet({ state = "whole" }) {
  const u = useUID();
  const n = 4, cw = LEN / n, top = 96, h = 62;
  const emph = state === "snap_lines";
  const hi = state === "piece_highlight" ? 2 : -1;
  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      <rect x={X0} y={top} width={LEN} height={h} rx="6" fill={`url(#stip-${u})`} stroke={C.ink} strokeWidth="2.6" />
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          {i === hi && <rect className="anim-pulse" x={X0 + i * cw + 2} y={top + 2} width={cw - 4} height={h - 4} rx="3" fill={`url(#rh-${u})`} stroke={C.red} strokeWidth="2.4" />}
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
            <circle key={r + "-" + c} cx={X0 + i * cw + cw / 2 + (c - 1) * 13} cy={top + h / 2 + (r - 1) * 14} r="1.5"
              fill={i === hi ? C.paper1 : C.ink} opacity={i === hi ? 0.85 : 0.5} />
          )))}
        </g>
      ))}
      {Array.from({ length: n - 1 }, (_, i) => (
        <line key={i} className={emph ? "anim-pulse" : ""}
          x1={X0 + (i + 1) * cw} y1={top - (emph ? 5 : 0)} x2={X0 + (i + 1) * cw} y2={top + h + (emph ? 5 : 0)}
          stroke={emph ? C.red : C.ink} strokeWidth={emph ? 2.2 : 1.4}
          strokeDasharray="3 3" opacity={emph ? 1 : 0.5} />
      ))}
      <Ruler x0={X0} x1={X1} y={RY} n={n} labels={true} />
    </svg>
  );
}

/* ───────────────── 7. Sausage-link chain (same-size links) ───────────────── */
// state: 'idle' | 'counting' | 'wrapped_into_units'
export function SausageChain({ state = "idle" }) {
  const u = useUID();
  const n = 6, cw = LEN / n, cy = 116, hh = 16, hw = cw * 0.55;
  const wrapped = state === "wrapped_into_units";

  const linkPath = (cx) =>
    `M${cx - hw} ${cy}` +
    ` C${cx - hw} ${cy - hh}, ${cx - hw * 0.32} ${cy - hh}, ${cx} ${cy - hh}` +
    ` C${cx + hw * 0.32} ${cy - hh}, ${cx + hw} ${cy - hh}, ${cx + hw} ${cy}` +
    ` C${cx + hw} ${cy + hh}, ${cx + hw * 0.32} ${cy + hh}, ${cx} ${cy + hh}` +
    ` C${cx - hw * 0.32} ${cy + hh}, ${cx - hw} ${cy + hh}, ${cx - hw} ${cy} Z`;

  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      {wrapped && [0, 1].map((g) => (
        <rect key={g} className="anim-snap" x={X0 + g * 3 * cw + 5} y={cy - hh - 9} width={3 * cw - 10} height={2 * hh + 18} rx="11"
          fill="none" stroke={C.redDeep} strokeWidth="2.4" strokeDasharray="8 5" opacity="0.85" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const cx = X0 + cw * (i + 0.5);
        return (
          <g key={i}>
            <path d={linkPath(cx)} fill={`url(#rh-${u})`} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
            <path d={linkPath(cx)} fill={`url(#bevelT-${u})`} />
            <path d={`M${cx - hw * 0.55} ${cy - hh * 0.4} q${hw * 0.55} ${-4} ${hw * 1.1} 0`} stroke={C.paper1} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
            {state === "counting" && (
              <text x={cx} y={cy + 6} textAnchor="middle" className="anim-pop"
                style={{ font: "700 17px var(--display)", fill: C.paper1, textShadow: "0 1px 0 rgba(0,0,0,.3)" }}>{i + 1}</text>
            )}
          </g>
        );
      })}
      {Array.from({ length: n + 1 }, (_, i) => {
        const x = X0 + cw * i;
        const end = i === 0 || i === n;
        return (
          <g key={i}>
            {!end && (
              <g stroke={C.redDeep} strokeWidth="2.2" fill="none" strokeLinecap="round">
                <path d={`M${x - 5} ${cy - hh + 1} Q${x} ${cy} ${x - 5} ${cy + hh - 1}`} />
                <path d={`M${x + 5} ${cy - hh + 1} Q${x} ${cy} ${x + 5} ${cy + hh - 1}`} />
              </g>
            )}
            <ellipse cx={x} cy={cy} rx={end ? 3.4 : 3} ry={end ? 5 : 7} fill={C.red} stroke={C.redDeep} strokeWidth="1.7" />
            {end && <line x1={x} y1={cy} x2={i === 0 ? x - 7 : x + 7} y2={cy} stroke={C.redDeep} strokeWidth="2.2" strokeLinecap="round" />}
          </g>
        );
      })}
      <Ruler x0={X0} x1={X1} y={RY} n={n} labels={true} />
    </svg>
  );
}

/* ───────────────── 8. Egg carton / muffin tin (cells) ───────────────── */
// state: 'cells_full' | 'cell_lifting' | 'fresh_tin_spawned'
export function EggCarton({ state = "cells_full" }) {
  const u = useUID();
  const n = 6, cw = LEN / n, top = 96, h = 60;
  const lifting = state === "cell_lifting";
  const spawn = state === "fresh_tin_spawned";
  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      {spawn && (
        <g className="anim-pop" opacity="0.9">
          <rect x={X0 + 26} y={top - 30} width={LEN} height={h} rx="8" fill={C.paper2} stroke={C.ink} strokeWidth="2.4" strokeDasharray="6 4" />
          {Array.from({ length: n }, (_, i) => (
            <ellipse key={i} cx={X0 + 26 + i * cw + cw / 2} cy={top - 30 + h / 2} rx={cw * 0.32} ry={h * 0.28} fill={C.paper3} stroke={C.ink} strokeWidth="1.6" opacity="0.7" />
          ))}
        </g>
      )}
      <rect x={X0} y={top} width={LEN} height={h} rx="8" fill={C.paper3} stroke={C.ink} strokeWidth="2.6" />
      {Array.from({ length: n }, (_, i) => {
        const x = X0 + i * cw + cw / 2;
        const isLift = lifting && i === n - 1;
        return (
          <g key={i}>
            <ellipse cx={x} cy={top + h * 0.62} rx={cw * 0.36} ry={h * 0.3} fill={C.paper2} stroke={C.ink} strokeWidth="1.8" />
            <ellipse cx={x} cy={top + h * 0.62} rx={cw * 0.36} ry={h * 0.3} fill={`url(#lh-${u})`} opacity="0.5" />
            <g className={isLift ? "anim-lift" : ""}>
              <ellipse cx={x} cy={top + h * 0.4} rx={cw * 0.3} ry={h * 0.36}
                fill={`url(#stip-${u})`} stroke={C.ink} strokeWidth="2.2" />
              <path d={`M${x - cw * 0.16} ${top + h * 0.3} q${cw * 0.16} ${-7} ${cw * 0.32} 0`} stroke={C.paper1} strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round" />
            </g>
          </g>
        );
      })}
      <Ruler x0={X0} x1={X1} y={RY} n={n} labels={true} />
    </svg>
  );
}

/* ───────────── 9. Carrots→twine bundles & cookies→clusters ───────────── */
// kind: 'carrots' | 'cookies'   state: 'loose' | 'bundling' | 'bundled'
export function Bundles({ kind = "carrots", state = "loose" }) {
  const u = useUID();
  const n = 5, cy = 116;
  const spread = state === "loose" ? 1 : state === "bundling" ? 0.55 : 0.26;
  const center = X0 + LEN / 2;
  const slot = (i) => center + (i - (n - 1) / 2) * (LEN / n) * spread;

  const carrot = (x, i) => {
    const tilt = state === "loose" ? (i - 2) * 9 : (i - 2) * 3;
    return (
      <g key={i} className={state === "bundling" ? "anim-bob" : ""}>
        <g transform={`translate(${x},${cy}) rotate(${tilt})`}>
          <g stroke={C.ink} strokeWidth="2.2" fill="none" strokeLinecap="round">
            <path d="M0 -34 q-7 -14 -3 -26" />
            <path d="M0 -34 q0 -16 0 -30" />
            <path d="M0 -34 q7 -14 3 -26" />
          </g>
          <path d="M-11 -34 Q0 -40 11 -34 L2 36 Q0 42 -2 36 Z" fill={`url(#rh-${u})`} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
          {[-20, -4, 12].map((yy, k) => (
            <path key={k} d={`M${-9 + k} ${yy} q9 4 ${16 - 2 * k} 0`} stroke={C.redDeep} strokeWidth="1.4" fill="none" opacity="0.6" />
          ))}
        </g>
      </g>
    );
  };

  const cookie = (x, i) => (
    <g key={i} className={state === "bundling" ? "anim-bob" : ""}>
      <g transform={`translate(${x},${cy})`}>
        <circle r="28" fill={`url(#stip-${u})`} stroke={C.ink} strokeWidth="2.4" />
        <circle r="28" fill={`url(#bevelT-${u})`} />
        {[[-10, -6], [9, -8], [12, 7], [-6, 11], [2, 2]].map((p, k) => (
          <circle key={k} cx={p[0]} cy={p[1]} r="3.2" fill={C.ink} opacity="0.78" />
        ))}
      </g>
    </g>
  );

  const cookieBag = () => {
    const cx = center, neckY = cy - 30, baseY = cy + 40;
    return (
      <g className="anim-pop">
        {[0, 1, 2, 3].map((i) => {
          const yy = cy - 14 + i * 13;
          return (
            <g key={i}>
              <circle cx={cx} cy={yy} r="21" fill={`url(#stip-${u})`} stroke={C.ink} strokeWidth="2.2" />
              {[[-9, -5], [8, -6], [10, 6], [-5, 8]].map((p, k) => (
                <circle key={k} cx={cx + p[0]} cy={yy + p[1]} r="2.6" fill={C.ink} opacity="0.72" />
              ))}
            </g>
          );
        })}
        <path d={`M${cx - 30} ${cy - 22} Q${cx - 38} ${cy + 8} ${cx - 26} ${baseY} Q${cx} ${baseY + 9} ${cx + 26} ${baseY} Q${cx + 38} ${cy + 8} ${cx + 30} ${cy - 22} L${cx + 15} ${neckY} Q${cx} ${neckY + 5} ${cx - 15} ${neckY} Z`}
          fill={C.paper1} fillOpacity="0.15" stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
        <path d={`M${cx - 17} ${cy - 12} Q${cx - 22} ${cy + 14} ${cx - 13} ${baseY - 6}`} stroke={C.paper1} strokeWidth="2.4" fill="none" opacity="0.55" strokeLinecap="round" />
        <path d={`M${cx - 15} ${neckY} L${cx - 17} ${neckY - 13} L${cx - 8} ${neckY - 5} L${cx} ${neckY - 15} L${cx + 8} ${neckY - 5} L${cx + 17} ${neckY - 13} L${cx + 15} ${neckY} Z`}
          fill={`url(#stip-${u})`} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
        <rect x={cx - 16} y={neckY - 3} width="32" height="8" rx="3" fill={C.red} stroke={C.redDeep} strokeWidth="1.6" />
      </g>
    );
  };

  const isCookieBag = kind === "cookies" && state === "bundled";
  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      {isCookieBag
        ? cookieBag()
        : Array.from({ length: n }, (_, i) => (kind === "carrots" ? carrot(slot(i), i) : cookie(slot(i), i)))}
      {kind === "carrots" && state === "bundled" && (
        <g className="anim-pop">
          <Twine x={center - 34} y={cy + 4} w={68} h={14} />
        </g>
      )}
      <Ruler x0={X0} x1={X1} y={RY} n={5} labels={true} />
    </svg>
  );
}

/* ───────────── 10. Lunchbox with a hinged lid ───────────── */
// state: 'open' | 'pieces_in' | 'lid_closed'
export function Lunchbox({ state = "open" }) {
  const u = useUID();
  const bx = 70, bw = 200, bTop = 108, bh = 58;
  const hinge = `${bx} ${bTop}`;
  const closed = state === "lid_closed";
  const lidAngle = closed ? 0 : -118;
  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      <rect x={bx} y={bTop} width={bw} height={bh} rx="7" fill={C.paper2} stroke={C.ink} strokeWidth="2.8" />
      <rect x={bx} y={bTop} width={bw} height={bh} rx="7" fill={`url(#lh-${u})`} opacity="0.4" />
      <line x1={bx + 6} y1={bTop + 12} x2={bx + bw - 6} y2={bTop + 12} stroke={C.ink} strokeWidth="1.4" opacity="0.4" />
      {state === "pieces_in" && (
        <g className="anim-pop">
          {[0, 1, 2, 3].map((i) => {
            const pw = (bw - 24) / 4, x = bx + 12 + i * pw;
            return (
              <g key={i}>
                <rect x={x + 2} y={bTop + 18} width={pw - 4} height={bh - 26} rx="3"
                  fill={i % 2 ? `url(#stip-${u})` : `url(#rh-${u})`} stroke={C.ink} strokeWidth="2" />
              </g>
            );
          })}
        </g>
      )}
      <g className={closed ? "anim-lidclose" : ""} style={{ transformOrigin: `${bx}px ${bTop}px` }}>
        <g transform={`rotate(${lidAngle} ${hinge})`}>
          <rect x={bx} y={bTop - 16} width={bw} height={18} rx="6" fill={C.red} stroke={C.redDeep} strokeWidth="2.8" />
          <rect x={bx} y={bTop - 16} width={bw} height={18} rx="6" fill={`url(#rh-${u})`} opacity="0.5" />
          <path d={`M${bx + bw / 2 - 16} ${bTop - 16} q16 -16 32 0`} fill="none" stroke={C.redDeep} strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
      <circle cx={bx} cy={bTop} r="3.4" fill={C.paper1} stroke={C.ink} strokeWidth="1.8" />
      <rect x={bx + bw - 16} y={bTop + bh - 14} width="12" height="12" rx="2" fill={C.redDeep} stroke={C.ink} strokeWidth="1.6" />
      <Ruler x0={X0} x1={X1} y={RY} n={4} labels={true} />
    </svg>
  );
}

/* ───────────── 11. Cupcake / pie boxes that fill & stack ───────────── */
// state: 'empty' | 'filling' | 'full' | 'leftover'
export function Boxes({ state = "empty" }) {
  const u = useUID();
  const filled = state === "empty" ? 0 : state === "filling" ? 2 : 4;

  const box = (ox, oy, count, ghostStack, anim) => (
    <g transform={`translate(${ox},${oy})`}>
      {ghostStack && <rect x="2" y="-12" width="148" height="14" rx="3" fill={C.paper3} stroke={C.ink} strokeWidth="2" />}
      <rect x="0" y="0" width="152" height="60" rx="6" fill={C.paper2} stroke={C.ink} strokeWidth="2.6" />
      {[0, 1, 2, 3].map((i) => {
        const cx = 38 + (i % 2) * 76, cy = 20 + Math.floor(i / 2) * 24;
        const has = i < count;
        return (
          <g key={i} className={anim && i === count - 1 ? "anim-pop" : ""}>
            <ellipse cx={cx} cy={cy} rx="22" ry="11" fill={C.paper3} stroke={C.ink} strokeWidth="1.6" />
            {has && (
              <g>
                <path d={`M${cx - 16} ${cy + 2} L${cx - 12} ${cy - 14} L${cx + 12} ${cy - 14} L${cx + 16} ${cy + 2} Z`} fill={`url(#stip-${u})`} stroke={C.ink} strokeWidth="1.8" />
                <path d={`M${cx - 14} ${cy - 12} q14 -16 28 0`} fill={`url(#rh-${u})`} stroke={C.ink} strokeWidth="1.8" />
                <circle cx={cx} cy={cy - 16} r="2.6" fill={C.redDeep} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );

  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      {state === "leftover" ? (
        <g>
          {box(54, 86, 4, true, false)}
          <g className="anim-pop" transform="translate(232,128)">
            <path d="M-16 2 L-12 -14 L12 -14 L16 2 Z" fill={`url(#stip-${u})`} stroke={C.ink} strokeWidth="2" />
            <path d="M-14 -12 q14 -16 28 0" fill={`url(#rh-${u})`} stroke={C.ink} strokeWidth="2" />
            <circle cx="0" cy="-16" r="3" fill={C.redDeep} />
            <text x="0" y="30" textAnchor="middle" style={{ font: "italic 11px var(--serif)", fill: C.inkMute }}>leftover</text>
          </g>
        </g>
      ) : (
        box(94, 96, filled, false, state === "filling")
      )}
      <Ruler x0={X0} x1={X1} y={RY} n={4} labels={true} />
    </svg>
  );
}

/* ───────────── 12. Cooling rack (holds whole units) ───────────── */
// state: 'empty' | 'holding_wholes'
export function CoolingRack({ state = "empty" }) {
  const u = useUID();
  const rTop = 120, rW = LEN, rx0 = X0;
  const holding = state === "holding_wholes";
  return (
    <svg viewBox={VB} width="100%" style={{ display: "block" }}>
      <AssetDefs uid={u} />
      {holding && [0, 1, 2].map((i) => {
        const cx = rx0 + 50 + i * 92;
        return (
          <g key={i} className="anim-pop">
            <ellipse cx={cx} cy={rTop - 4} rx="40" ry="14" fill={C.paper3} stroke={C.ink} strokeWidth="2" />
            <path d={`M${cx - 40} ${rTop - 4} a40 22 0 0 1 80 0 Z`} fill={`url(#stip-${u})`} stroke={C.ink} strokeWidth="2.4" />
            <path d={`M${cx - 26} ${rTop - 16} l52 0 M${cx - 18} ${rTop - 22} l36 0 M${cx - 8} ${rTop - 26} l16 0`} stroke={C.redDeep} strokeWidth="1.6" opacity="0.6" />
            <text x={cx} y={rTop + 30} textAnchor="middle" style={{ font: "700 13px var(--display)", fill: C.inkMute }}>1</text>
          </g>
        );
      })}
      <g stroke={C.ink} strokeLinecap="round">
        <rect x={rx0} y={rTop} width={rW} height="10" rx="5" fill={C.paper2} strokeWidth="2.6" />
        {[3, 6].map((yy, k) => (
          <line key={"l" + k} x1={rx0 + 4} y1={rTop + yy * 1.0 + 1} x2={rx0 + rW - 4} y2={rTop + yy + 1} strokeWidth="1.2" opacity="0.5" />
        ))}
        {Array.from({ length: 13 }, (_, i) => {
          const x = rx0 + 8 + i * ((rW - 16) / 12);
          return <line key={"c" + i} x1={x} y1={rTop} x2={x} y2={rTop + 10} strokeWidth="1.6" opacity="0.7" />;
        })}
        <line x1={rx0 + 16} y1={rTop + 10} x2={rx0 + 16} y2={rTop + 24} strokeWidth="2.6" />
        <line x1={rx0 + rW - 16} y1={rTop + 10} x2={rx0 + rW - 16} y2={rTop + 24} strokeWidth="2.6" />
      </g>
      <Ruler x0={X0} x1={X1} y={RY} n={3} labels={true} />
    </svg>
  );
}

// Name → component map, used by MomsRoom to render a problem's prop by id.
export const PROPS = {
  ChocolateBar, Pie, SheetCake, DoughBacon, CandyBars, CrackerSheet,
  SausageChain, EggCarton, Bundles, Lunchbox, Boxes, CoolingRack,
};
