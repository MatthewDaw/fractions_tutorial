// app.jsx — The Cook's Lesson (R1, ADD_SAME_DEN): the pieces are already the same
// size — MERGE the two stacks, COUNT the tops as the running total climbs, and keep
// the bottom (the denominator) LOCKED. Worked example: 2/7 + 3/7 = 5/7.
const { useState, useEffect, useRef, useLayoutEffect } = React;

const ORIGIN = 60, UNIT = 600, CW = 720, CH = 346, LINE_Y = 322, BAR_H = 72;
const HOME = { A: { x: ORIGIN, y: 250 }, B: { x: ORIGIN, y: 86 } };

// --- The problem. R1 keeps ONE denominator for both addends; the four-stage
// progression (R1 §4.5) is reachable by varying these three fields:
//   { op:'+'|'-', a, b, den }  →  add: a+b ; subtract: a-b ; bottom stays `den`.
// This prototype wires stage 1 (addition, blank = answer) fully. Stages 2–4
// (missing addend, subtraction-forward with the REMOVE-pieces move, missing part)
// reuse the same Stack/Combined/merge machinery — only the verb on the final step
// (merge vs. remove) and which slot is blank change.
const PROBLEM = { op: "+", a: 2, b: 3, den: 7 };
const ANSWER = PROBLEM.op === "+" ? PROBLEM.a + PROBLEM.b : PROBLEM.a - PROBLEM.b; // 5
const DEN = PROBLEM.den; // locked bottom — never changes in this room

const TICKW = UNIT / DEN;
const GOAL = `Mom needs ${PROBLEM.a}/${DEN} of a tray of oat cakes and ${PROBLEM.b}/${DEN} of a tray. ` +
  "The pieces are already the same size — just count them up, and keep the bottom number the same.";

const stackW = (n) => (n / DEN) * UNIT;

// ---- a small engraved padlock (the room's signature: the bottom can't change) ----
function Lock({ size = 13, color = "var(--ink)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
      <rect x="4" y="11" width="16" height="11" rx="2" fill="none" stroke={color} strokeWidth="2" />
      <path d="M8 11 V8 a4 4 0 0 1 8 0 V11" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="16" r="1.6" fill={color} />
    </svg>
  );
}

// ---- the merged stack (a red pieces + b cream pieces), labels run 1/den … (a+b)/den ----
function Combined({ a, b, mergeTick }) {
  const pieceW = UNIT / DEN;
  const total = a + b;
  const cells = [];
  for (let i = 0; i < a; i++) cells.push("red");
  for (let i = 0; i < b; i++) cells.push("ink");
  return (
    <div className="plank lit is-matched" style={{ width: total * pieceW }}>
      <div className="plank-body">
        {cells.map((c, i) => (
          <div key={i} className="piece" style={{
            width: pieceW, background: c === "red" ? "var(--red)" : "var(--paper-1)",
            borderRight: i < total - 1 ? "1.5px solid var(--ink)" : "none",
          }}>
            <div className="piece-hatch" style={{ backgroundImage: c === "red" ? window.RED_HATCH : window.INK_HATCH }} />
            <span className="piece-lab" style={{ color: c === "red" ? "var(--paper-1)" : "var(--ink)", fontSize: pieceW < 58 ? 13 : 15 }}>{i + 1}/{DEN}</span>
          </div>
        ))}
        <div key={mergeTick} className="sweep" />
      </div>
    </div>
  );
}

// ---- the pie/tray graphic on the rail ----
function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
function wedge(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}
function Tray({ solved, filled }) {
  const sz = 80, cx = sz / 2, cy = sz / 2, r = sz / 2 - 6;
  const shown = solved ? filled : ANSWER; // shows the goal faintly until solved
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ display: "block" }}>
      <defs>
        <pattern id="tr-h" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(40,12,8,0.28)" strokeWidth="1" /></pattern>
      </defs>
      <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" opacity="0.6" />
      {Array.from({ length: DEN }).map((_, i) => {
        const fill = i < shown;
        return (
          <g key={i}>
            <path d={wedge(cx, cy, r, i * 360 / DEN, (i + 1) * 360 / DEN)}
              fill={fill ? "var(--red)" : "var(--paper-1)"} stroke="var(--ink)" strokeWidth="1.4"
              opacity={solved ? 1 : (fill ? 0.5 : 1)} />
            {fill && <path d={wedge(cx, cy, r, i * 360 / DEN, (i + 1) * 360 / DEN)} fill="url(#tr-h)" stroke="none" opacity={solved ? 1 : 0.4} />}
          </g>
        );
      })}
    </svg>
  );
}

// ---- a big stacked fraction; the denominator wears the padlock ----
function BigFrac({ num, den, locked }) {
  return (
    <div className="bignum">
      <span className="n">{num}</span>
      <span className="bar" />
      <span className="d-wrap"><span className="d">{den}</span>{locked && <span className="lockmark"><Lock size={12} /></span>}</span>
    </div>
  );
}

// ---------------- main ----------------
function App() {
  const [merged, setMerged] = useState(false);
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [mergeTick, setMergeTick] = useState(0);
  const [shakeA, setShakeA] = useState(false);
  const [shakeB, setShakeB] = useState(false);
  const [numStr, setNumStr] = useState("");
  const [badInput, setBadInput] = useState(false);
  const [cook, setCook] = useState("idle");
  const [soundOn, setSoundOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState({ tone: "normal", text: "Two stacks of the same-size pieces. Drag them together to count them up." });
  const [posA, _setPosA] = useState(HOME.A);
  const [posB, _setPosB] = useState(HOME.B);
  const [dragBar, setDragBar] = useState(null);

  const mergedRef = useRef(merged), solvedRef = useRef(solved), soundRef = useRef(soundOn);
  const posARef = useRef(posA), posBRef = useRef(posB);
  const bodyA = useRef(), bodyB = useRef(), numInput = useRef();
  useEffect(() => { mergedRef.current = merged; }, [merged]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  const setPosA = (p) => { posARef.current = p; _setPosA(p); };
  const setPosB = (p) => { posBRef.current = p; _setPosB(p); };

  useLayoutEffect(() => {
    const stage = document.getElementById("stage");
    function fit() { const s = Math.min(window.innerWidth / 1280, window.innerHeight / 800); stage.style.transform = `scale(${s})`; }
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, []);

  function say(text) {
    if (!soundRef.current || typeof speechSynthesis === "undefined") return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.96; u.pitch = 1.06;
      u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); speechSynthesis.speak(u); } catch (e) {}
  }
  function toggleSound() { setSoundOn(v => { const nv = !v; if (!nv && typeof speechSynthesis !== "undefined") { try { speechSynthesis.cancel(); } catch (e) {} setSpeaking(false); } return nv; }); }

  function clientToStage(cx, cy) { const s = document.getElementById("stage").getBoundingClientRect(); const k = s.width / 1280 || 1; return { x: (cx - s.left) / k, y: (cy - s.top) / k }; }

  // ---- the mechanic: merge the two same-size stacks into one ----
  function doMerge() {
    if (mergedRef.current || solvedRef.current) return;
    setMerged(true); mergedRef.current = true;
    setMergeTick(t => t + 1);
    setCook("idle");
    setStatus({ tone: "ok", text: `Same-size pieces, all counted up — that's ${ANSWER} pieces. The bottom stays ${DEN}. Write the top number below.` });
    say(`Count them up — ${ANSWER} sevenths. The bottom stays the same. Write the top number.`);
    setTimeout(() => { try { numInput.current && numInput.current.focus(); } catch (e) {} }, 300);
  }

  function unmerge() {
    if (solvedRef.current) return;
    setMerged(false); mergedRef.current = false;
    setPosA(HOME.A); setPosB(HOME.B);
    setCook("idle"); setStatus({ tone: "normal", text: "Split them back apart — drag them together when you're ready to count." });
  }

  // ---- strips: drag to move / bring together to merge (pieces always match here) ----
  function grabBar(id, e) {
    if (merged || solved) return;
    e.preventDefault();
    const pos = id === "A" ? posARef.current : posBRef.current;
    const canvas = document.getElementById("r1canvas").getBoundingClientRect();
    const k = document.getElementById("stage").getBoundingClientRect().width / 1280 || 1;
    const grab = { x: (e.clientX - canvas.left) / k - pos.x, y: (e.clientY - canvas.top) / k - pos.y };
    setDragBar(id);
    const move = (ev) => {
      let nx = (ev.clientX - canvas.left) / k - grab.x;
      let ny = (ev.clientY - canvas.top) / k - grab.y;
      nx = Math.max(0, Math.min(CW - stackW(id === "A" ? PROBLEM.a : PROBLEM.b), nx));
      ny = Math.max(0, Math.min(CH - BAR_H, ny));
      (id === "A" ? setPosA : setPosB)({ x: nx, y: ny });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); setDragBar(null); dropBar(id); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  function dropBar(id) {
    const o = id === "A" ? "B" : "A";
    const dp = id === "A" ? posARef.current : posBRef.current;
    const op = o === "A" ? posARef.current : posBRef.current;
    const dw = stackW(id === "A" ? PROBLEM.a : PROBLEM.b), ow = stackW(o === "A" ? PROBLEM.a : PROBLEM.b);
    const near = Math.abs(dp.y - op.y) < 66 && dp.x <= op.x + ow + 48 && dp.x + dw >= op.x - 48;
    if (near) { doMerge(); return; }
    // snap tidily back to its lane, clamped to the ruler and aligned to a seventh tick
    const lane = HOME[id].y;
    let sx = Math.round((dp.x - ORIGIN) / TICKW) * TICKW + ORIGIN;
    sx = Math.max(ORIGIN, Math.min(ORIGIN + UNIT - dw, sx));
    (id === "A" ? setPosA : setPosB)({ x: sx, y: lane });
  }

  function checkAnswer() {
    if (solved) { reset(); return; }
    if (!merged) {
      setCook("think");
      setStatus({ tone: "warn", text: "Bring the two stacks together and count the pieces first." });
      say("Bring the stacks together and count the pieces first."); return;
    }
    const n = parseInt(numStr, 10);
    if (!(n > 0)) {
      setBadInput(true); setTimeout(() => setBadInput(false), 460);
      setStatus({ tone: "warn", text: "Write the top number — how many pieces in all?" }); return;
    }
    if (n !== ANSWER) {
      setBadInput(true); setCook("think"); setTimeout(() => setBadInput(false), 460);
      const wrongDen = n === PROBLEM.a + PROBLEM.b + DEN || n === DEN * 2; // a hint if they reached for the bottom
      setStatus({ tone: "warn", text: wrongDen
        ? "Careful — the bottom number is locked. We only count the tops. How many sevenths in all?"
        : `Not quite — count every piece in the joined stack. How many ${DEN}ths in all?` });
      say("Not quite. Count every piece. The bottom stays the same."); return;
    }
    const st = 3; // a clean, direct count earns full marks; star tuning lives in the mastery model
    setSolved(true); setStars(st); setCook("cheer");
    setStatus({ tone: "ok", text: `Yes! ${PROBLEM.a}/${DEN} + ${PROBLEM.b}/${DEN} = ${ANSWER}/${DEN}. Add the tops, keep the bottom — full marks!` });
    say(`Yes! ${PROBLEM.a} sevenths plus ${PROBLEM.b} sevenths is ${ANSWER} sevenths. Full marks!`);
  }

  function reset() {
    mergedRef.current = false; solvedRef.current = false;
    setMerged(false); setSolved(false); setStars(0); setMergeTick(0);
    setNumStr(""); setPosA(HOME.A); setPosB(HOME.B); setCook("idle");
    setStatus({ tone: "normal", text: "Fresh stacks. Drag them together to count them up." });
  }

  // ruler labels — every seventh
  const RLAB = Array.from({ length: DEN + 1 }).map((_, k) => [k, k === 0 ? "0" : k === DEN ? "1" : `${k}/${DEN}`]);

  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);
  const checkLabel = solved ? "New stacks" : "Check";

  return (
    <div className="page">
      <div className="foxing" />

      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num-mark">№1</span>
          <div>
            <div className="puzzle-tag">Lesson 1 · Adding Fractions</div>
            <div className="puzzle-title">Counting the Pieces</div>
          </div>
        </div>
        <div />
        <div className="controls">
          <button className={"ctrl-btn" + (soundOn ? " on" : "")} title={soundOn ? "Turn sound off" : "Turn sound on"} onClick={toggleSound}>
            {soundOn ? (
              <svg width="18" height="16" viewBox="0 0 18 16"><path d="M2 6 H5 L9 2 V14 L5 10 H2 Z" fill="currentColor" /><path d="M12 5 Q15 8 12 11" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M13.5 3 Q18 8 13.5 13" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
            ) : (
              <svg width="18" height="16" viewBox="0 0 18 16"><path d="M2 6 H5 L9 2 V14 L5 10 H2 Z" fill="currentColor" /><line x1="12" y1="5" x2="17" y2="11" stroke="currentColor" strokeWidth="1.6" /><line x1="17" y1="5" x2="12" y2="11" stroke="currentColor" strokeWidth="1.6" /></svg>
            )}
          </button>
          <button className="ctrl-btn" title="Start over" onClick={reset}>⟲</button>
        </div>
      </div>

      <div className="goal">
        <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say(GOAL)}>
          <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
          Read aloud
        </button>
        <div className="goal-text">Mom needs <b>{PROBLEM.a}/{DEN}</b> of a tray and <b>{PROBLEM.b}/{DEN}</b> of a tray — the pieces are the same size, so add them up.</div>
      </div>

      <div className="play">
        <div className="diagram">
          <div className="canvas" id="r1canvas">
            <div className="eqstate eqfloat locked"><span className="g"><Lock size={16} color="var(--ink)" /></span>bottom stays /{DEN}</div>
            {/* ruler */}
            <div className="nline" style={{ top: LINE_Y }} />
            {Array.from({ length: DEN + 1 }).map((_, k) => (
              <span key={k} className="ntick" style={{ left: ORIGIN + (k / DEN) * UNIT, top: LINE_Y, height: 10 }} />
            ))}
            {RLAB.map(([k, lab]) => (
              <span key={k} className="nlab" style={{ left: ORIGIN + (k / DEN) * UNIT, top: LINE_Y + 12 }}>{lab}</span>
            ))}

            {/* merged result OR the two stacks */}
            {merged ? (
              <div className="nbar" style={{ left: HOME.A.x, top: HOME.A.y }}>
                <div className="btag">
                  <BigFrac num={ANSWER} den={DEN} locked />
                  {!solved && <button className="mini" title="split them back apart" onClick={unmerge}>↺</button>}
                </div>
                <Combined a={PROBLEM.a} b={PROBLEM.b} mergeTick={mergeTick} />
              </div>
            ) : (
              <React.Fragment>
                <div className={"nbar" + (dragBar === "A" ? " dragging" : "") + (shakeA ? " is-shake" : "")}
                  style={{ left: posA.x, top: posA.y, width: stackW(PROBLEM.a) }} onPointerDown={(e) => grabBar("A", e)}>
                  <div className="btag"><BigFrac num={PROBLEM.a} den={DEN} locked /></div>
                  <Stack n={PROBLEM.a} den={DEN} unit={UNIT} tone="red" bodyRef={bodyA} />
                  <div className="grip"><i /><i /><i /></div>
                </div>

                <div className={"nbar" + (dragBar === "B" ? " dragging" : "") + (shakeB ? " is-shake" : "")}
                  style={{ left: posB.x, top: posB.y, width: stackW(PROBLEM.b) }} onPointerDown={(e) => grabBar("B", e)}>
                  <div className="btag"><BigFrac num={PROBLEM.b} den={DEN} locked /></div>
                  <Stack n={PROBLEM.b} den={DEN} unit={UNIT} tone="ink" bodyRef={bodyB} />
                  <div className="grip"><i /><i /><i /></div>
                </div>
              </React.Fragment>
            )}

            {/* merge button (the pieces always match — merging is always allowed) */}
            {!merged && (
              <button className="joinbtn" style={{ left: ORIGIN + stackW(PROBLEM.a) + 40, top: HOME.A.y + 22 }} onClick={doMerge}>▸ Count them up</button>
            )}
          </div>
        </div>

        {/* rail */}
        <div className="rail">
          <div className="panel">
            <h3>Keep the Bottom</h3>
            <div className="hint">Both stacks are cut into {DEN}ths — the pieces are the same size, so you just count how many. The bottom number is locked.</div>
            <div className="lockcard">
              <BigFrac num={<span style={{ color: "var(--red)" }}>+</span>} den={DEN} locked />
              <div className="lockcard-note">add the tops<br />keep the {DEN}</div>
            </div>
          </div>

          <div className="panel">
            <h3>On the Tray</h3>
            <div className="plate-wrap">
              <Tray solved={solved} filled={ANSWER} />
              <div className="answer">
                {PROBLEM.a}/{DEN} + {PROBLEM.b}/{DEN} = {solved ? <span className="res">{ANSWER}/{DEN}</span> : <span className="res">?</span>}
                <span className="sub">{solved ? `${ANSWER} pieces, each a ${DEN}th` : "count the pieces, keep the bottom"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HUD */}
      <div className="hud">
        <div className="cook-zone">
          <div className="cook-stage"><Cook expr={cook} width={118} /></div>
          <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        </div>

        <div className="hud-eq">
          <div className="qeq">
            <span>{PROBLEM.a}/{DEN}</span><span className="qop">+</span><span>{PROBLEM.b}/{DEN}</span><span className="qop">=</span>
            <span className="frinput">
              <input ref={numInput} value={numStr} onChange={(e) => setNumStr(onlyDigits(e.target.value))} onKeyDown={(e) => e.key === "Enter" && checkAnswer()} disabled={!merged || solved} className={badInput ? "bad" : ""} inputMode="numeric" placeholder="?" aria-label="numerator" />
              <span className="ln" />
              <span className="lockden" title="the bottom number is locked"><span>{DEN}</span><Lock size={15} color="var(--ink-mute)" /></span>
            </span>
          </div>
          <div className="qcap">{solved ? `full marks — ${PROBLEM.a}/${DEN} + ${PROBLEM.b}/${DEN} = ${ANSWER}/${DEN}!` : merged ? "count the pieces and type the top number" : "count the pieces to unlock the answer"}</div>
        </div>

        <div className="marks">
          {solved && <Rosette count={stars} />}
          <button className={"check" + (solved ? " done" : "")} onClick={checkAnswer}>{checkLabel}</button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
