// Slate.jsx — the STYLUS WRITING surface (the arc's "write" channel).
//
// One Slate renders one or more digit SLOTS (e.g. a single whole box, or a
// numerator box stacked over a denominator box). The child HANDWRITES a numeral
// into a slot with a stylus/finger; strokes are captured per slot, inked live on
// a per-slot canvas, and read by the on-device recognizer (../ink/recognizer.js
// — a pretrained MNIST CNN with a self-contained $P geometric fallback while it
// loads, so the pad is never dead and never needs the network at runtime).
//
// VERIFIER-ASSISTED flow: because the lesson's verifier already knows the
// expected answer, we surface the recognizer's best-guess as a small "I read N —
// keep it?" chip. The child can ACCEPT it (commits the digit) or RE-TRACE (clears
// and writes again). A digit can ONLY be committed by writing a stroke and
// accepting the recognizer's guess — there is no keyboard or tap-digit path.
//
// CONTROLLED COMPONENT. The parent owns the values:
//   props:
//     slots:   [{ key, label?, locked?, fixed?, digit? }]
//                - key    : stable id for the slot (required)
//                - label  : accessibility label for the slot (e.g. "top",
//                           "bottom"); used for aria only, not shown on screen
//                - locked/fixed : non-editable slot showing a fixed digit (a
//                                 locked denominator). `digit` (or values[key])
//                                 supplies what to show.
//     values:  { [key]: digitString }   — the committed digit per slot
//     onChange(key, value)              — fired when a slot's committed digit changes
//     onSubmit()                        — fired on Enter / the slot's commit gesture
//     layout:  "row" | "fraction"       — "fraction" stacks slot[0] over slot[1]
//                                          with a denominator-colored bar between
//     den:     number                   — denominator, for the fraction bar hue
//     disabled, autoFocusKey, ariaLabel
//
// Self-contained: NO external ML libs, no network beyond the (optional) static
// model file the recognizer itself fetches. prefers-reduced-motion respected in
// slate.css. Large targets, denominator colors via the shared palette.
import React, { useEffect, useRef, useState, useCallback } from "react";
import { recognizeDigit } from "../ink/recognizer.js";
import { denomColor } from "../denominatorColors.js";
import "../styles/slate.css";

const INK = "#1c1612";        // the child's own handwriting ink (ROLE_COLORS.childInk)
const RECOGNIZE_DELAY = 500;  // ms of stillness after a stroke before we read it

// ── one writable / fixed slot ────────────────────────────────────────────────
// Captures strokes, inks them, and offers the recognizer's guess for accept /
// re-trace. A locked/fixed slot is read-only and just paints its digit.
function SlateSlot({
  slotKey, label, locked, value, onCommit, onSubmit, disabled, autoFocus,
}) {
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);     // [[ [x,y], ... ], ...] in canvas css px
  const curRef = useRef(null);
  const drawingRef = useRef(false);
  const timerRef = useRef(null);
  const tokenRef = useRef(0);        // drops stale async reads (clear/redraw mid-flight)
  const [guess, setGuess] = useState({ digit: null, confident: false });
  const [hasInk, setHasInk] = useState(false);

  const isLocked = locked || disabled;

  // Crisp drawing on HiDPI and under the stage's CSS scale transform.
  const setupCanvas = useCallback(() => {
    const c = canvasRef.current; if (!c) return null;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return null;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 4;
    return ctx;
  }, []);

  const redraw = useCallback(() => {
    const ctx = setupCanvas(); if (!ctx) return;
    const c = canvasRef.current;
    ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
    for (const s of strokesRef.current) {
      if (s.length === 1) { ctx.beginPath(); ctx.arc(s[0][0], s[0][1], 2, 0, Math.PI * 2); ctx.fill(); continue; }
      ctx.beginPath(); ctx.moveTo(s[0][0], s[0][1]);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1]);
      ctx.stroke();
    }
  }, [setupCanvas]);

  useEffect(() => { setupCanvas(); }, [setupCanvas]);

  // Clear our ink whenever the committed value is reset to "" externally (new
  // problem / reset) AND we currently hold ink — but ignore the blank we emit
  // ourselves while empty.
  useEffect(() => {
    if ((value === "" || value == null) && strokesRef.current.length) {
      wipe(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function wipe(emit) {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    tokenRef.current++;
    strokesRef.current = [];
    setHasInk(false);
    setGuess({ digit: null, confident: false });
    redraw();
    if (emit) onCommit("");
  }

  function toLocal(e) {
    const c = canvasRef.current; const r = c.getBoundingClientRect();
    const sx = c.clientWidth / r.width || 1, sy = c.clientHeight / r.height || 1;
    return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
  }

  function scheduleRecognize() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const token = ++tokenRef.current;
      // The recognizer reads the whole pad as ONE digit (a slot is one numeral).
      recognizeDigit(strokesRef.current).then((res) => {
        if (token !== tokenRef.current) return; // superseded by a newer stroke / clear
        setGuess({ digit: res.digit, confident: !!res.confident });
      }).catch(() => {});
    }, RECOGNIZE_DELAY);
  }

  function onDown(e) {
    if (isLocked) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    if (timerRef.current) clearTimeout(timerRef.current);
    drawingRef.current = true;
    curRef.current = [toLocal(e)];
    strokesRef.current = [...strokesRef.current, curRef.current];
    setHasInk(true);
    redraw();
  }
  function onMove(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    curRef.current.push(toLocal(e));
    redraw();
  }
  function onUp(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    drawingRef.current = false; curRef.current = null;
    scheduleRecognize();
  }

  // Accept the recognizer's best-guess → commit it as this slot's digit.
  function accept() {
    if (guess.digit == null) return;
    onCommit(String(guess.digit));
  }
  // Re-trace: wipe the ink and the guess so the child writes again.
  function retrace() { wipe(true); }

  // A slot is "committed" when values[key] holds a digit.
  const committed = value != null && value !== "";

  // Locked / fixed slot: paint the digit, no canvas.
  if (locked) {
    return (
      <div className="slate-slot is-locked">
        <div className="slate-cell" aria-label={label ? `${label}: ${value}` : `${value}`}>
          <span className="slate-fixed">{value}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={"slate-slot" + (committed ? " is-committed" : "") + (disabled ? " is-disabled" : "")}>
      <div className={"slate-cell" + (committed ? " committed" : "")}>
        {/* the committed digit sits on top of (and hides) the writing canvas */}
        {committed && (
          <button
            type="button"
            className="slate-committed-digit"
            title="Tap to rewrite"
            disabled={disabled}
            onClick={() => { if (!disabled) wipe(true); }}
          >
            {value}
          </button>
        )}

        {!committed && (
          <>
            <canvas
              ref={canvasRef}
              className="slate-canvas"
              role="img"
              aria-label={label ? `write the ${label} digit` : "write a digit"}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            />
            {!hasInk && <span className="slate-ph" aria-hidden="true">{autoFocus ? "✎" : ""}</span>}
            {hasInk && !disabled && (
              <button
                type="button"
                className="slate-clear"
                title="Erase and rewrite"
                aria-label="erase and rewrite"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => wipe(true)}
              >✕</button>
            )}
          </>
        )}
      </div>

      {/* verifier-assisted: the recognizer's best guess → accept or re-trace */}
      {!committed && hasInk && guess.digit != null && (
        <div className={"slate-guess" + (guess.confident ? "" : " unsure")}>
          <span className="slate-guess-read">I read <b>{guess.digit}</b></span>
          <button type="button" className="slate-guess-yes" onClick={accept} title="Yes, that's right">✓</button>
          <button type="button" className="slate-guess-no" onClick={retrace} title="No — let me write it again">↺</button>
        </div>
      )}
    </div>
  );
}

export default function Slate({
  slots = [],
  values = {},
  onChange = () => {},
  onSubmit = () => {},
  layout = "row",
  den,
  disabled = false,
  autoFocusKey,
  ariaLabel,
  className = "",
}) {
  const renderSlot = (slot) => {
    const locked = !!(slot.locked || slot.fixed);
    const value = locked ? (slot.digit != null ? String(slot.digit) : (values[slot.key] ?? "")) : (values[slot.key] ?? "");
    return (
      <SlateSlot
        key={slot.key}
        slotKey={slot.key}
        label={slot.label}
        locked={locked}
        value={value}
        disabled={disabled}
        autoFocus={autoFocusKey === slot.key}
        onCommit={(v) => onChange(slot.key, v)}
        onSubmit={onSubmit}
      />
    );
  };

  if (layout === "fraction") {
    const [top, bottom, ...rest] = slots;
    const barColor = den != null ? denomColor(den) : INK;
    return (
      <div
        className={"slate slate-fraction" + (disabled ? " is-disabled" : "") + (className ? " " + className : "")}
        role="group"
        aria-label={ariaLabel || "write the fraction"}
      >
        {top && renderSlot(top)}
        <span className="slate-bar" style={{ background: barColor }} aria-hidden="true" />
        {bottom && renderSlot(bottom)}
        {rest.map(renderSlot)}
      </div>
    );
  }

  return (
    <div
      className={"slate slate-row" + (disabled ? " is-disabled" : "") + (className ? " " + className : "")}
      role="group"
      aria-label={ariaLabel || "write your answer"}
    >
      {slots.map(renderSlot)}
    </div>
  );
}
