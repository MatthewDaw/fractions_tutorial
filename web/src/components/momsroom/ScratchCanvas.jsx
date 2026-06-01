// ScratchCanvas.jsx — a free-form drawing layer for Babushka's Room. The story
// problems are open-ended, so the child gets a real scratch space to work things
// out (finger / stylus / mouse) right over the prop + ruler. The FINAL answer
// still goes in the HUD answer boxes — this is only for showing work.
//
// Self-contained: own tools (ink pen / red pen / eraser / undo / clear) and undo
// stack. Mount with a `key` that changes per problem so it resets each time.
// Coordinates map through the stage's CSS scale via getBoundingClientRect.
import { useRef, useEffect, useState } from "react";

const COLORS = { ink: "#1c1612", red: "#a32a22" };

export default function ScratchCanvas() {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("ink");     // 'ink' | 'red' | 'eraser'
  const [hasInk, setHasInk] = useState(false);
  const toolRef = useRef(tool);
  const drawing = useRef(false);
  const last = useRef(null);
  const undo = useRef([]);                      // ImageData snapshots
  useEffect(() => { toolRef.current = tool; }, [tool]);

  // Size the backing store to the element's logical box. The stage is CSS-scaled,
  // so clientWidth/Height are logical px; pointer math divides by the scaled rect.
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const fit = () => {
      const w = c.clientWidth, h = c.clientHeight;
      if (w && h && (c.width !== w || c.height !== h)) {
        // preserve any existing ink across a resize
        let prev = null;
        try { prev = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, c.width, c.height); } catch (e) {}
        c.width = w; c.height = h;
        if (prev) { try { c.getContext("2d", { willReadFrequently: true }).putImageData(prev, 0, 0); } catch (e) {} }
      }
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(c);
    return () => ro.disconnect();
  }, []);

  function posOf(e) {
    const c = canvasRef.current, r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }
  function paint(ctx, a, b) {
    const t = toolRef.current;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (t === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 26; ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = t === "red" ? 3.4 : 3; ctx.strokeStyle = COLORS[t] || COLORS.ink;
    }
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  function down(e) {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    try {
      undo.current.push(ctx.getImageData(0, 0, c.width, c.height));
      if (undo.current.length > 24) undo.current.shift();
    } catch (x) {}
    drawing.current = true;
    const p = posOf(e); last.current = p;
    paint(ctx, p, p);          // a dot for a tap
    setHasInk(true);
    e.preventDefault();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  function move(e) {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
    const p = posOf(e); paint(ctx, last.current, p); last.current = p;
  }
  function up() {
    drawing.current = false;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  }

  function undoLast() {
    const c = canvasRef.current, ctx = c.getContext("2d", { willReadFrequently: true });
    const snap = undo.current.pop();
    ctx.clearRect(0, 0, c.width, c.height);
    if (snap) ctx.putImageData(snap, 0, 0);
    setHasInk(undo.current.length > 0 || !!snap);
  }
  function clearAll() {
    const c = canvasRef.current, ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, c.width, c.height);
    undo.current = []; setHasInk(false);
  }

  const ToolBtn = ({ id, title, children }) => (
    <button type="button" className={"mr-tool" + (tool === id ? " on" : "")}
      title={title} aria-pressed={tool === id} onClick={() => setTool(id)}>{children}</button>
  );

  return (
    <>
      <canvas ref={canvasRef} className="mr-scratch" onPointerDown={down} aria-label="scratch space for working out the problem" />
      <div className="mr-tools">
        <ToolBtn id="ink" title="Pencil">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 15 L4 11 L12 3 L15 6 L7 14 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><line x1="11" y1="4" x2="14" y2="7" stroke="currentColor" strokeWidth="1.6" /></svg>
        </ToolBtn>
        <ToolBtn id="red" title="Red pen">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 15 L4 11 L12 3 L15 6 L7 14 Z" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </ToolBtn>
        <ToolBtn id="eraser" title="Eraser">
          <svg width="18" height="18" viewBox="0 0 18 18"><rect x="3" y="9" width="9" height="6" rx="1.5" transform="rotate(-32 7 12)" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        </ToolBtn>
        <span className="mr-tool-sep" />
        <button type="button" className="mr-tool" title="Undo" onClick={undoLast}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M6 5 L3 8 L6 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" /><path d="M3 8 H11 a4 4 0 0 1 0 8 H7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <button type="button" className="mr-tool mr-tool-clear" title="Clear all" onClick={clearAll}>clear</button>
      </div>
      {!hasInk && <div className="mr-scratch-hint">scratch space — show your work here ✎</div>}
    </>
  );
}
