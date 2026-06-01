// InkPad.jsx — a stylus cell the child WRITES a number into. The only place the
// child draws; per the stylus pivot, drawing is numerals only (objects are
// manipulated by touch elsewhere). Strokes are captured, inked on a canvas, and
// passed to the on-device digit recognizer; the recognized text is reported up
// via onChange AND shown back as a faint badge so a wrong read is recoverable by
// re-drawing rather than fatal. See memory: stylus-handwriting-decision.
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { recognizeNumber } from "../ink/recognizer.js";

const INK = "#1c1612";       // the child's own handwriting ink
const RECOGNIZE_DELAY = 550; // ms of stillness after a stroke before we read it

const InkPad = forwardRef(function InkPad({ value, onChange, disabled, ariaLabel, placeholder = "?", want = false }, ref) {
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);   // [[ [x,y], ... ], ...] in canvas css px
  const curRef = useRef(null);     // the in-progress stroke
  const drawingRef = useRef(false);
  const timerRef = useRef(null);
  const recogTokenRef = useRef(0); // drops stale async results (redraw/clear mid-flight)
  const lastResRef = useRef({ text: "", digits: [], confident: false }); // for Check-time capture
  const [read, setRead] = useState({ text: "", confident: true });

  // Crisp drawing on HiDPI + under the stage's CSS scale transform.
  function setupCanvas() {
    const c = canvasRef.current; if (!c) return null;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== w * dpr || c.height !== h * dpr) { c.width = w * dpr; c.height = h * dpr; }
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.lineWidth = 3.2;
    return ctx;
  }
  useEffect(() => { setupCanvas(); }, []);

  function redraw() {
    const ctx = setupCanvas(); if (!ctx) return;
    const c = canvasRef.current;
    ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
    for (const s of strokesRef.current) {
      if (s.length < 2) { if (s.length === 1) { ctx.beginPath(); ctx.arc(s[0][0], s[0][1], 1.7, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); } continue; }
      ctx.beginPath(); ctx.moveTo(s[0][0], s[0][1]);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1]);
      ctx.stroke();
    }
  }

  // External clear: when the parent resets value to "" (new problem / reset),
  // wipe our ink too — but ignore the empty value we ourselves emit while blank.
  useEffect(() => {
    if ((value === "" || value == null) && strokesRef.current.length) {
      recogTokenRef.current++;
      lastResRef.current = { text: "", digits: [], confident: false };
      strokesRef.current = []; setRead({ text: "", confident: true }); redraw();
    }
  }, [value]);

  function toLocal(e) {
    const c = canvasRef.current; const r = c.getBoundingClientRect();
    const sx = c.clientWidth / r.width || 1, sy = c.clientHeight / r.height || 1;
    return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
  }

  function scheduleRecognize() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const token = ++recogTokenRef.current;
      recognizeNumber(strokesRef.current).then((res) => {
        if (token !== recogTokenRef.current) return; // superseded by a newer stroke/clear
        lastResRef.current = res;
        setRead({ text: res.text, confident: res.confident });
        onChange(res.text);
      });
    }, RECOGNIZE_DELAY);
  }

  // Expose this cell's current sample (strokes + a PNG of the ink + the last
  // guess) so the parent can capture the WRITTEN answer when "Check" is pressed.
  useImperativeHandle(ref, () => ({
    getSample() {
      const c = canvasRef.current;
      return {
        label: ariaLabel,
        w: c ? c.clientWidth : 0,
        h: c ? c.clientHeight : 0,
        strokes: strokesRef.current,
        recognized: lastResRef.current,
        png: c ? c.toDataURL("image/png") : null,
      };
    },
  }), [ariaLabel]);

  function onDown(e) {
    if (disabled) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    if (timerRef.current) clearTimeout(timerRef.current);
    drawingRef.current = true;
    curRef.current = [toLocal(e)];
    strokesRef.current = [...strokesRef.current, curRef.current];
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

  function clear() {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    recogTokenRef.current++; // invalidate any in-flight recognition
    lastResRef.current = { text: "", digits: [], confident: false };
    strokesRef.current = []; setRead({ text: "", confident: true });
    redraw(); onChange("");
  }

  const hasInk = strokesRef.current.length > 0;
  return (
    <span className={"inkpad" + (disabled ? " is-disabled" : "") + (want && !hasInk ? " want" : "")}>
      <canvas
        ref={canvasRef}
        className="inkpad-canvas"
        role="img"
        aria-label={ariaLabel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      {!hasInk && !disabled && <span className="inkpad-ph">{placeholder}</span>}
      {/* what the recognizer read, so the child can confirm or re-draw */}
      {read.text !== "" && (
        <span className={"inkpad-read" + (read.confident ? "" : " unsure")} title="What I read — tap ✕ to redraw">{read.text}</span>
      )}
      {hasInk && !disabled && (
        <button type="button" className="inkpad-clear" title="Redraw" onPointerDown={(e) => e.stopPropagation()} onClick={clear}>✕</button>
      )}
    </span>
  );
});

export default InkPad;
