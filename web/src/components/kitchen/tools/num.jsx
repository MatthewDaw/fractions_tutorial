/* tools/num.jsx — №4 The Top Number (INTERACTIVE).
 *
 * One wide sheet cake of N equal slices spans the stage. The child "holds" the
 * spatula and TAPS slices to frost them (chocolate + cherry) or unfrost them; a
 * ruler under the cake counts the slices out (1 … N). The fraction the child is
 * building is  frosted / total  — surfaced through onChange as { num, den }.
 *
 * Self-contained: owns its own frosted-set state, renders the wireframe markup
 * and classes (kq-cakewide / kq-caketools / kq-cakerow / kq-cakecell /
 * kq-cakeruler / kq-spatula) so styles/kitchen.css applies, and surfaces the
 * result only through onChange / onProgress. No MomsRoom import.
 *
 * Props (KitchenTool.jsx contract): { room, value, onChange, onProgress, disabled }
 */
import { useState, useCallback, useMemo } from "react";
import { cakeVisual, KitchenHtml } from "../../../kitchen/primitives.jsx";

/* How many equal slices the cake is cut into. The num story is 7 slices; honour
 * an explicit answer.den if a room ever supplies one, else fall back to 7. */
function totalSlices(room) {
  const d = Number(room?.answer?.den);
  return Number.isFinite(d) && d > 0 ? d : 7;
}

/* Seed the frosted count from a controlled value (so the tool mirrors the written
 * answer), else start from nothing frosted. */
function seedFrosted(value, total) {
  const n = Number(value?.num);
  if (Number.isFinite(n)) return Math.max(0, Math.min(total, n));
  return 0;
}

export default function NumTool({ room, value, onProgress, disabled = false }) {
  const total = totalSlices(room);

  // which slices are frosted, kept as a boolean array of length `total`.
  const [frostedAt, setFrostedAt] = useState(() => {
    const seed = seedFrosted(value, total);
    return Array.from({ length: total }, (_, i) => i < seed);
  });

  const frostedCount = useMemo(() => frostedAt.filter(Boolean).length, [frostedAt]);

  const toggle = useCallback(
    (i) => {
      if (disabled) return;
      setFrostedAt((prev) => {
        const next = prev.slice();
        next[i] = !next[i];
        const count = next.filter(Boolean).length;
        // NOTE: this is a pure manipulative — it never writes the answer. The
        // child reads the frosted count here and types the fraction themselves.
        onProgress &&
          onProgress({ kind: "manip_step", tool: "num", slice: i, frosted: next[i], num: count, den: total });
        return next;
      });
    },
    [disabled, onProgress, total]
  );

  const hint = "Take the spatula and frost the slices — the ruler counts them out below.";

  return (
    <div className="kq-tool" data-tool="num">
      <div className="kq-tool-hint">{hint}</div>
      <div className="kq-cakewide">
        <div className="kq-caketools">
          {/* the spatula the child "holds"; purely indicative — slices are tapped directly */}
          <button
            type="button"
            className="kq-spatula"
            title="Frost or unfrost a slice"
            aria-hidden="true"
            tabIndex={-1}
            disabled={disabled}
          >
            <svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
              <g transform="rotate(-15 20 20)">
                <path
                  d="M3 31 L25 23 L13 5 Z"
                  fill="var(--paper-1)"
                  stroke="var(--ink)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path d="M8 27 L18 15" stroke="#5a3a22" strokeWidth="3.4" strokeLinecap="round" />
                <line x1="19" y1="11" x2="35" y2="3" stroke="var(--ink)" strokeWidth="3.6" strokeLinecap="round" />
              </g>
            </svg>
            <span>frost / unfrost</span>
          </button>
        </div>

        <div className="kq-cakerow" role="group" aria-label="cake slices — tap to frost or unfrost">
          {frostedAt.map((on, i) => (
            <button
              key={i}
              type="button"
              className={"kq-cakecell" + (on ? " is-frosted" : "")}
              aria-pressed={on}
              aria-label={
                "slice " + (i + 1) + " of " + total + (on ? " — frosted, tap to remove" : " — plain, tap to frost")
              }
              disabled={disabled}
              onClick={() => toggle(i)}
            >
              <KitchenHtml html={cakeVisual(on)} />
            </button>
          ))}
        </div>

        <div className="kq-cakeruler" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className="kq-cakeruler-tick">
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      <p className="kq-tool-cap" aria-live="polite">
        {frostedCount} of {total} slices frosted — that's {frostedCount}/{total}
      </p>
    </div>
  );
}
