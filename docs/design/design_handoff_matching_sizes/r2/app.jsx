// app.jsx — The Baker's Lesson (R2): slice to same-size blocks → join → write the total.
const { useState, useEffect, useRef, useLayoutEffect, useCallback } = React;

const ORIGIN = 60, UNIT = 600, CW = 720, CH = 360, LINE_Y = 322, BAR_H = 72;
const HOME = { A: { x: ORIGIN, y: 250 }, B: { x: ORIGIN, y: 86 } };
const TICKW = UNIT / 12;
const STORAGE = "bakers.lesson.r2.v3";
const GOAL = "Mom needs 1/2 of a dough strip plus 1/3 of a dough strip. " +
  "The blocks are different sizes — slice them until every block is the same size, join them, then write the total.";

const RED_HATCH = "repeating-linear-gradient(45deg, rgba(40,12,8,0.20) 0 1px, transparent 1px 6px)";
const INK_HATCH = "repeating-linear-gradient(45deg, rgba(28,22,18,0.28) 0 1px, transparent 1px 6px)," +
  "repeating-linear-gradient(-45deg, rgba(28,22,18,0.28) 0 1px, transparent 1px 6px)";

const barW = (id) => (id === "A" ? 0.5 : 1 / 3) * UNIT;

// ---- the joined strip + the plate ----
function Combined({ mA, mB, D }) {
  const pieceW = UNIT / D;
  const total = mA + mB;
  const cells = [];
  for (let i = 0; i < mA; i++) cells.push("red");
  for (let i = 0; i < mB; i++) cells.push("ink");
  return (
    <div className="plank lit" style={{ width: total * pieceW }}>
      <div className="plank-body">
        {cells.map((c, i) => (
          <div key={i} className="piece" style={{
            width: pieceW, background: c === "red" ? "var(--red)" : "var(--paper-1)",
            borderRight: i < total - 1 ? "1.5px solid var(--ink)" : "none",
          }}>
            <div className="piece-hatch" style={{ backgroundImage: c === "red" ? RED_HATCH : INK_HATCH }} />
            <span className="piece-lab" style={{ color: c === "red" ? "var(--paper-1)" : "var(--ink)", fontSize: pieceW < 58 ? 13 : 15 }}>{i + 1}/{D}</span>
          </div>
        ))}
        <div className="sweep" />
      </div>
    </div>
  );
}

function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
function slice(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}
function Plate({ solved, D, num }) {
  const sz = 80, cx = sz / 2, cy = sz / 2, r = sz / 2 - 6;
  const d = solved ? D : 6, fn = solved ? num : 5;
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ display: "block" }}>
      <defs>
        <pattern id="pl-h" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(40,12,8,0.28)" strokeWidth="1" /></pattern>
      </defs>
      <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" opacity="0.6" />
      {Array.from({ length: d }).map((_, i) => {
        const filled = i < fn;
        return (
          <g key={i}>
            <path d={slice(cx, cy, r, i * 360 / d, (i + 1) * 360 / d)}
              fill={filled ? "var(--red)" : "var(--paper-1)"} stroke="var(--ink)" strokeWidth="1.4"
              opacity={solved ? 1 : (filled ? 0.5 : 1)} />
            {filled && <path d={slice(cx, cy, r, i * 360 / d, (i + 1) * 360 / d)} fill="url(#pl-h)" stroke="none" opacity={solved ? 1 : 0.4} />}
          </g>
        );
      })}
    </svg>
  );
}

function BigFrac({ num, den }) {
  return <div className="bignum"><span className="n">{num}</span><span className="bar" /><span className="d">{den}</span></div>;
}

// ---------------- main ----------------
function App() {
  const [mA, setMA] = useState(1);
  const [mB, setMB] = useState(1);
  const [joined, setJoined] = useState(false);
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [histLen, setHistLen] = useState(0);
  const histRef = useRef([]);
  const [tickA, setTickA] = useState(0);
  const [tickB, setTickB] = useState(0);
  const [shakeA, setShakeA] = useState(false);
  const [shakeB, setShakeB] = useState(false);
  const [numStr, setNumStr] = useState("");
  const [denStr, setDenStr] = useState("");
  const [badInput, setBadInput] = useState(false);
  const [hoverBar, setHoverBar] = useState(null);
  const [cook, setCook] = useState("idle");
  const [soundOn, setSoundOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState({ tone: "normal", text: "Two strips, different block sizes. Grab a knife and slice." });
  const [posA, _setPosA] = useState(HOME.A);
  const [posB, _setPosB] = useState(HOME.B);
  const [dragBar, setDragBar] = useState(null);
  const [dragKnife, setDragKnife] = useState(null); // {n,x,y}

  const numA = mA, denA = 2 * mA, numB = mB, denB = 3 * mB;
  const matched = 2 * mA === 3 * mB;
  const D = 2 * mA, answerNum = mA + mB, answerVal = answerNum / D;

  const mARef = useRef(mA), mBRef = useRef(mB), matchedRef = useRef(matched);
  const joinedRef = useRef(joined), solvedRef = useRef(solved), soundRef = useRef(soundOn);
  const posARef = useRef(posA), posBRef = useRef(posB);
  const bodyA = useRef(), bodyB = useRef(), numInput = useRef();
  useEffect(() => { mARef.current = mA; }, [mA]);
  useEffect(() => { mBRef.current = mB; }, [mB]);
  useEffect(() => { matchedRef.current = matched; }, [matched]);
  useEffect(() => { joinedRef.current = joined; }, [joined]);
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
  function hitBar(cx, cy) {
    for (const [id, ref] of [["A", bodyA], ["B", bodyB]]) {
      const el = ref.current; if (!el) continue; const r = el.getBoundingClientRect();
      if (cx >= r.left - 10 && cx <= r.right + 10 && cy >= r.top - 14 && cy <= r.bottom + 14) return id;
    } return null;
  }

  // ---- changing a strip's division (records history so it can be undone) ----
  function setM(bar, val, record = true) {
    if (record) { histRef.current.push({ bar, prev: bar === "A" ? mARef.current : mBRef.current }); setHistLen(histRef.current.length); }
    if (bar === "A") { mARef.current = val; setMA(val); setTickA(t => (val > 1 ? t + 1 : 0)); }
    else { mBRef.current = val; setMB(val); setTickB(t => (val > 1 ? t + 1 : 0)); }
  }

  function applyCut(bar, n) {
    if (joinedRef.current || solvedRef.current) return;
    setM(bar, n);
    const nA = mARef.current, nB = mBRef.current;
    setCook("idle");
    if (2 * nA === 3 * nB) {
      setStatus({ tone: "ok", text: "The blocks are the same size now — drag the two strips together to join them." });
      say("Same size blocks! Drag the strips together.");
    } else {
      setStatus({ tone: "normal", text: `1/2 is now ${nA}/${2 * nA} and 1/3 is now ${nB}/${3 * nB}. Keep slicing until every block is the same size.` });
    }
  }

  function resetBar(bar) {
    if (joinedRef.current || solvedRef.current) return;
    setM(bar, 1);
    setCook("idle"); setStatus({ tone: "normal", text: "Put that strip back together — now try a different knife." });
  }

  function undo() {
    if (solvedRef.current) return;
    if (joinedRef.current) { setJoined(false); joinedRef.current = false; setCook("idle"); setStatus({ tone: "normal", text: "Un-joined the strips — you can keep cutting." }); return; }
    const h = histRef.current;
    if (!h.length) { setStatus({ tone: "normal", text: "Nothing to undo yet." }); return; }
    const e = h.pop(); setHistLen(h.length);
    setM(e.bar, e.prev, false);
    setCook("idle"); setStatus({ tone: "normal", text: "Undid the last cut." });
  }

  function grabKnife(n, e) {
    if (joined || solved) return;
    e.preventDefault(); e.stopPropagation();
    const p = clientToStage(e.clientX, e.clientY); setDragKnife({ n, x: p.x, y: p.y });
    const move = (ev) => { const q = clientToStage(ev.clientX, ev.clientY); setDragKnife({ n, x: q.x, y: q.y }); setHoverBar(hitBar(ev.clientX, ev.clientY)); };
    const up = (ev) => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); const h = hitBar(ev.clientX, ev.clientY); setDragKnife(null); setHoverBar(null); if (h) applyCut(h, n); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  // ---- strips: drag to move / bring together to join ----
  function grabBar(id, e) {
    if (joined || solved) return;
    e.preventDefault();
    const pos = id === "A" ? posARef.current : posBRef.current;
    const canvas = document.getElementById("r2canvas").getBoundingClientRect();
    const k = document.getElementById("stage").getBoundingClientRect().width / 1280 || 1;
    const grab = { x: (e.clientX - canvas.left) / k - pos.x, y: (e.clientY - canvas.top) / k - pos.y };
    setDragBar(id);
    const move = (ev) => {
      let nx = (ev.clientX - canvas.left) / k - grab.x;
      let ny = (ev.clientY - canvas.top) / k - grab.y;
      nx = Math.max(0, Math.min(CW - barW(id), nx));
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
    const dw = barW(id), ow = barW(o);
    const near = Math.abs(dp.y - op.y) < 66 && dp.x <= op.x + ow + 48 && dp.x + dw >= op.x - 48;
    if (near) {
      if (matchedRef.current) { doJoin(); return; }
      // mismatch — bounce back and shake
      setShakeA(true); setShakeB(true); setCook("think");
      setStatus({ tone: "warn", text: "These blocks aren't the same size — they don't fit together. Slice them to match first." });
      say("They don't fit. Make the blocks the same size first.");
      setPosA(HOME.A); setPosB(HOME.B);
      setTimeout(() => { setShakeA(false); setShakeB(false); }, 460);
      setTimeout(() => setCook("idle"), 1500);
      return;
    }
    // snap tidily to its lane + nearest tick
    const lane = HOME[id].y;
    let sx = Math.round((dp.x - ORIGIN) / TICKW) * TICKW + ORIGIN - ORIGIN;
    sx = Math.max(0, Math.min(UNIT - dw, sx));
    (id === "A" ? setPosA : setPosB)({ x: sx, y: lane });
  }

  function doJoin() {
    setJoined(true); joinedRef.current = true; setCook("idle");
    setStatus({ tone: "ok", text: "Joined! Now count the blocks and write the total in the boxes below." });
    say("Joined! Count the blocks and write the total.");
    setTimeout(() => { try { numInput.current && numInput.current.focus(); } catch (e) {} }, 300);
  }

  function checkAnswer() {
    if (solved) { reset(); return; }
    if (!matched) {
      setCook("think"); setStatus({ tone: "warn", text: "Slice both strips into the same-size blocks first — then count them." });
      say("Slice the strips into the same size blocks first."); return;
    }
    const n = parseInt(numStr, 10), d = parseInt(denStr, 10);
    if (!(n > 0 && d > 0)) {
      setBadInput(true); setTimeout(() => setBadInput(false), 460);
      setStatus({ tone: "warn", text: "Write a top number and a bottom number for the total." }); return;
    }
    if (n * 6 !== d * 5) { // not equal to 5/6
      setBadInput(true); setCook("think"); setTimeout(() => setBadInput(false), 460);
      setStatus({ tone: "warn", text: "Not quite — count every block in the joined strip. How many sixths in all?" });
      say("Not quite. Count every block."); return;
    }
    if (!joined) doJoin();
    const st = d === 6 ? 3 : d === 12 ? 2 : 1;
    setSolved(true); setStars(st); setCook("cheer");
    if (st === 3) { setStatus({ tone: "ok", text: "Yes! 1/2 + 1/3 = 5/6. Same-size blocks, counted up — full marks!" }); say("Yes! One half plus one third is five sixths. Full marks!"); }
    else { setStatus({ tone: "ok", text: `Right — ${n}/${d} is the same as 5/6. Fewer, bigger blocks earn more stars.` }); say("Right! That is the same as five sixths."); }
  }

  function reset() {
    mARef.current = 1; mBRef.current = 1; joinedRef.current = false; solvedRef.current = false;
    setMA(1); setMB(1); setJoined(false); setSolved(false); setStars(0); setTickA(0); setTickB(0);
    setNumStr(""); setDenStr(""); setPosA(HOME.A); setPosB(HOME.B); setCook("idle");
    setStatus({ tone: "normal", text: "Fresh strips. Slice them into the same-size blocks." });
  }

  // ruler labels
  const RLAB = [[0, "0"], [4, "1/3"], [6, "1/2"], [8, "2/3"], [10, "5/6"], [12, "1"]];

  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);
  const checkLabel = solved ? "New strips" : "Check";

  return (
    <div className="page">
      <div className="foxing" />

      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num-mark">№2</span>
          <div>
            <div className="puzzle-tag">Lesson 2 · Adding Fractions</div>
            <div className="puzzle-title">Same-Size Pieces</div>
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
        <div className="goal-text">Mom needs <b>1/2</b> of a dough strip and <b>1/3</b> of a strip — add them together.</div>
      </div>

      <div className="play">
        <div className="diagram">
          <div className="canvas" id="r2canvas">
            <div className={"eqstate eqfloat" + (matched ? " ok" : "")}><span className="g">{matched ? "=" : "≠"}</span>{matched ? "blocks match" : "blocks differ"}</div>
            {/* ruler */}
            <div className="nline" style={{ top: LINE_Y }} />
            {Array.from({ length: 13 }).map((_, k) => (
              <span key={k} className="ntick" style={{ left: ORIGIN + (k / 12) * UNIT, top: LINE_Y, height: k % 2 === 0 ? 10 : 6 }} />
            ))}
            {RLAB.map(([k, lab, goal]) => (
              <span key={k} className={"nlab" + (goal ? " ng" : "")} style={{ left: ORIGIN + (k / 12) * UNIT, top: LINE_Y + 12 }}>{lab}</span>
            ))}

            {/* joined result OR the two strips */}
            {joined ? (
              <div className="nbar" style={{ left: HOME.A.x, top: HOME.A.y }}>
                <div className="btag"><BigFrac num={answerNum} den={D} /></div>
                <Combined mA={mA} mB={mB} D={D} />
              </div>
            ) : (
              <React.Fragment>
                <div className={"nbar" + (dragBar === "A" ? " dragging" : "") + (shakeA ? " is-shake" : "")}
                  style={{ left: posA.x, top: posA.y, width: barW("A") }} onPointerDown={(e) => grabBar("A", e)}>
                  <div className="btag">
                    <BigFrac num={numA} den={denA} />
                    {mA > 1 && <span key={tickA} className="xchip pop">×{mA}</span>}
                    {mA > 1 && <button className="mini" title="put it back together" onPointerDown={(e) => e.stopPropagation()} onClick={() => resetBar("A")}>↺</button>}
                  </div>
                  <Plank baseNum={1} baseDen={2} m={mA} unit={UNIT} tone="red" sliceTick={tickA} matched={matched} hoverCut={hoverBar === "A" && !!dragKnife} bodyRef={bodyA} />
                </div>

                <div className={"nbar" + (dragBar === "B" ? " dragging" : "") + (shakeB ? " is-shake" : "")}
                  style={{ left: posB.x, top: posB.y, width: barW("B") }} onPointerDown={(e) => grabBar("B", e)}>
                  <div className="btag">
                    <BigFrac num={numB} den={denB} />
                    {mB > 1 && <span key={tickB} className="xchip pop">×{mB}</span>}
                    {mB > 1 && <button className="mini" title="put it back together" onPointerDown={(e) => e.stopPropagation()} onClick={() => resetBar("B")}>↺</button>}
                  </div>
                  <Plank baseNum={1} baseDen={3} m={mB} unit={UNIT} tone="ink" sliceTick={tickB} matched={matched} hoverCut={hoverBar === "B" && !!dragKnife} bodyRef={bodyB} />
                </div>
              </React.Fragment>
            )}

            {/* join button when matched */}
            {matched && !joined && (
              <button className="joinbtn" style={{ left: ORIGIN + barW("A") + 40, top: HOME.A.y + 22 }} onClick={doJoin}>▸ Join the strips</button>
            )}
          </div>
        </div>

        {/* rail */}
        <div className="rail">
          <div className="panel">
            <h3>The Knives</h3>
            <div className="hint">Drag a knife onto a strip — it cuts every block into that many equal pieces (top &amp; bottom together).</div>
            <div className="knife-rack">
              {[2, 3, 4].map((n) => (
                <div className="knife-row" key={n} style={{ opacity: dragKnife && dragKnife.n === n ? 0.18 : 1 }}>
                  <Knife n={n} onGrab={(e) => grabKnife(n, e)} hint={!dragKnife && mA === 1 && mB === 1} scale={0.48} />
                  <span className="krow-lab">→ {n} pieces</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>On the Plate</h3>
            <div className="plate-wrap">
              <Plate solved={solved} D={D} num={answerNum} />
              <div className="answer">
                1/2 + 1/3 = {solved ? <span className="res">{answerNum}/{D}</span> : <span className="res">?</span>}
                <span className="sub">{solved ? (D === 6 ? "five sixths of a strip" : "the same as 5/6") : "make the blocks match, then count them"}</span>
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
            <span>1/2</span><span className="qop">+</span><span>1/3</span><span className="qop">=</span>
            <span className="frinput">
              <input ref={numInput} value={numStr} onChange={(e) => setNumStr(onlyDigits(e.target.value))} onKeyDown={(e) => e.key === "Enter" && checkAnswer()} disabled={!matched || solved} className={badInput ? "bad" : ""} inputMode="numeric" placeholder="?" aria-label="numerator" />
              <span className="ln" />
              <input value={denStr} onChange={(e) => setDenStr(onlyDigits(e.target.value))} onKeyDown={(e) => e.key === "Enter" && checkAnswer()} disabled={!matched || solved} className={badInput ? "bad" : ""} inputMode="numeric" placeholder="?" aria-label="denominator" />
            </span>
          </div>
          <div className="qcap">{solved ? "full marks — 1/2 + 1/3 = 5/6!" : matched ? "count the blocks and type the total" : "make same-size blocks to unlock the answer"}</div>
        </div>

        <div className="marks">
          {solved && <Rosette count={stars} />}
          <button className={"check" + (solved ? " done" : "")} onClick={checkAnswer}>{checkLabel}</button>
        </div>
      </div>

      {/* floating knife while dragging */}
      <div className="knife-layer">
        {dragKnife && (
          <div className="knife-wrap" style={{ transform: `translate(${dragKnife.x - 40}px, ${dragKnife.y - 48}px)` }}>
            <Knife n={dragKnife.n} dragging={true} />
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
