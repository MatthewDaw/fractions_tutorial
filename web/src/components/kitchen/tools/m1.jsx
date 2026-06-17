/* tools/m1.jsx — №1 Equal Groups helper tool (INTERACTIVE).
 *
 * "Drop the same number of plums into each jar, then count them all up."
 *
 * Four jars + a tray of plums. The child DRAGS a plum from the tray onto a jar
 * (HTML5 drag-and-drop) OR simply TAPS a jar to drop one in; tapping a filled
 * jar with a modifier / right-click is avoided — instead each jar shows a small
 * "−" affordance to take one back out. When every jar holds the SAME positive
 * count k (so the groups are equal and the total is determinate, total = jars×k),
 * we surface the integer answer via onChange({ int: total }).
 *
 * Reuses the ported string primitives jar()/plum()/tray()/rep() so styles in
 * styles/kitchen.css apply (kq-jars / kq-jar / kq-plum / kq-tray). The jar SVG
 * only draws up to 4 clustered plums, so we cap a jar at 4 plums (matches the
 * wireframe's TOOLS.m1 which seeds 3 each → 12 total).
 *
 * Props: see KitchenTool.jsx contract — { room, value, onChange, onProgress, disabled }.
 * Self-contained: owns all interaction state; never imports from MomsRoom.
 */
import { useState, useCallback, useRef } from "react";
import { jar, plum, tray, rep } from "../../../kitchen/primitives.jsx";
import { prepHtmlSafe } from "../../../kitchen/prepHtml.js";
import "../../../styles/kitchen.css";

const JAR_COUNT = 4;     // four jars, per the m1 room story
const TRAY_SIZE = 12;    // plums shown in the source pile (constant — never depletes)
const JAR_CAP = 4;       // the jar SVG clusters at most 4 plums

const HINT = "Drop the same number of plums into each jar, then count them all up.";

/* render a primitive HTML string into the tree (same trick as KitchenHtml). */
function Html({ html, className, ...rest }) {
  return <span className={className} {...rest} dangerouslySetInnerHTML={{ __html: prepHtmlSafe(html) }} />;
}

export default function M1Tool({ onProgress, disabled = false }) {
  // counts[i] = how many plums are in jar i. Start empty (child fills them).
  // This tool is a PURE MANIPULATIVE: it never writes to the answer space — the
  // child reads what they build here and types the total themselves.
  const [counts, setCounts] = useState(() => Array(JAR_COUNT).fill(0));
  const [dragOver, setDragOver] = useState(-1);
  const dragging = useRef(false);

  const placed = counts.reduce((a, b) => a + b, 0);

  // equal groups iff every jar has the same positive count
  const k = counts[0];
  const equal = k > 0 && counts.every((c) => c === k);
  const total = equal ? JAR_COUNT * k : null;

  const addTo = useCallback((i) => {
    if (disabled) return;
    setCounts((prev) => {
      // The pile is a constant source — it never runs out. Jars still cap at
      // JAR_CAP because the jar SVG only clusters that many plums.
      if (prev[i] >= JAR_CAP) return prev;
      const next = prev.slice();
      next[i] = prev[i] + 1;
      onProgress && onProgress({ kind: "manip_step", tool: "m1", jar: i, count: next[i] });
      return next;
    });
  }, [disabled, onProgress]);

  const removeFrom = useCallback((i) => {
    if (disabled) return;
    setCounts((prev) => {
      if (prev[i] <= 0) return prev;
      const next = prev.slice();
      next[i] = prev[i] - 1;
      onProgress && onProgress({ kind: "manip_step", tool: "m1", jar: i, count: next[i] });
      return next;
    });
  }, [disabled, onProgress]);

  // ── drag handlers (drag a plum from the tray onto a jar) ──────────────────
  const onTrayDragStart = (e) => {
    if (disabled) { e.preventDefault(); return; }
    dragging.current = true;
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", "plum"); } catch { /* IE noop */ }
  };
  const onTrayDragEnd = () => { dragging.current = false; setDragOver(-1); };

  const onJarDragOver = (i) => (e) => {
    if (disabled || counts[i] >= JAR_CAP) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver !== i) setDragOver(i);
  };
  const onJarDragLeave = (i) => () => { if (dragOver === i) setDragOver(-1); };
  const onJarDrop = (i) => (e) => {
    e.preventDefault();
    setDragOver(-1);
    addTo(i);
  };

  const resetAll = () => { if (!disabled) setCounts(Array(JAR_COUNT).fill(0)); };

  // ── render ────────────────────────────────────────────────────────────────
  const status = equal
    ? `Equal groups! ${JAR_COUNT} jars × ${k} = ${total} plums in all.`
    : placed === 0
      ? "Drag a plum onto a jar, or tap a jar to drop one in."
      : "Keep going — each jar needs the same number of plums.";

  return (
    <div className={"kq-tool kq-m1" + (disabled ? " is-disabled" : "")} data-tool="m1">
      <div className="kq-tool-hint">{HINT}</div>

      <div className="kq-jars" role="group" aria-label="four jars">
        {counts.map((c, i) => {
          const full = c >= JAR_CAP;
          return (
            <div
              key={i}
              className={"kq-m1-jar" + (dragOver === i ? " is-over" : "")}
              onDragOver={onJarDragOver(i)}
              onDragLeave={onJarDragLeave(i)}
              onDrop={onJarDrop(i)}
            >
              <span className="kq-m1-jarcount" aria-hidden="true">{c}</span>
              <button
                type="button"
                className="kq-m1-jarbtn"
                onClick={() => addTo(i)}
                disabled={disabled || full}
                aria-label={`jar ${i + 1}, holds ${c} ${c === 1 ? "plum" : "plums"}. Tap to add one.`}
              >
                <Html html={jar(c)} />
              </button>
              <button
                type="button"
                className="kq-m1-minus"
                onClick={() => removeFrom(i)}
                disabled={disabled || c <= 0}
                aria-label={`take one plum out of jar ${i + 1}`}
              >−</button>
            </div>
          );
        })}
      </div>

      <Html
        className="kq-m1-traywrap"
        html={tray(
          // A constant source pile — always TRAY_SIZE plums, never depletes as
          // the child drops them into jars.
          rep(TRAY_SIZE, () =>
            `<span class="kq-m1-plumwrap"${disabled ? "" : ' draggable="true"'}>${plum()}</span>`
          )
        )}
        // attach drag handlers to the rendered draggable plums via delegation
        onDragStart={onTrayDragStart}
        onDragEnd={onTrayDragEnd}
      />

      <div className="kq-m1-status" role="status" aria-live="polite">{status}</div>

      <button
        type="button"
        className="kq-m1-reset"
        onClick={resetAll}
        disabled={disabled || placed === 0}
      >Empty the jars</button>
    </div>
  );
}
