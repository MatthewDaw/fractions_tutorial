// ConceptMap.jsx — the "Concepts" screen (route "concepts").
//
// The VISUAL CONNECTION to the content-measurement / mastery engine. The TOP is a
// navigation bar across the high-level math CONCEPTS; selecting one opens its
// detailed breakdown of every subconcept (skill node → atomic cards) in the panel
// below. There is NO grade level anywhere — the app is pace-agnostic; anyone moves
// through whatever concept they like, in whatever order.
//
//   Concept (top nav) → Skill node → Atomic card
//
// Mastery is measured at the smallest atomic detail (each scaffold-ladder form +
// transfer form) and ROLLS UP: every level above shows the average of the atomic
// cards beneath it.
//
// Data + the mastery seam live in conceptTree.js (getMastery / buildConceptTree).
// This file is pure presentation — match the Soviet/old-paper palette (tokens.css).
import { useMemo, useState } from "react";
import { buildConceptTree, levelName, isLiveMastery } from "./conceptTree.js";
import "./styles/conceptmap.css";

// ---------------------------------------------------------------------------
// Mastery ring (rolled-up indicator used at concept + node level)
// ---------------------------------------------------------------------------
function Ring({ value, size = 46 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const dash = c * pct;
  return (
    <svg className="cm-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-3)" strokeWidth="5" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--red)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dy="0.35em" textAnchor="middle" className="cm-ring-num">
        {Math.round(pct * 100)}
      </text>
    </svg>
  );
}

// Small inline mastery bar for the atomic cards (the measured leaves).
function CardBar({ value }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="cm-bar" title={`${pct}% mastered`}>
      <div className="cm-bar-fill" style={{ width: pct + "%" }} />
      <span className="cm-bar-num">{pct}</span>
    </div>
  );
}

function masteryClass(value) {
  if (value >= 0.85) return "strong";
  if (value >= 0.5) return "partial";
  if (value >= 0.15) return "weak";
  return "empty";
}

// ---------------------------------------------------------------------------
// Atomic cards (the measured leaves)
// ---------------------------------------------------------------------------
function AtomicCards({ cards }) {
  return (
    <div className="cm-cards">
      {cards.map((card) => (
        <div key={card.id} className={"cm-card " + masteryClass(card.mastery)}>
          <div className="cm-card-top">
            <span className={"cm-chip " + (card.isTransfer ? "transfer" : "scaffold")}>
              {card.isTransfer ? "Transfer" : levelName(card.level)}
            </span>
            <span className="cm-card-lv">L{card.level}</span>
          </div>
          <div className="cm-card-id">{card.formId}</div>
          <CardBar value={card.mastery} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skill node (a subconcept) — collapsible → reveals atomic cards + prereqs
// ---------------------------------------------------------------------------
function NodeRow({ node, titleById }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={"cm-node " + masteryClass(node.mastery)}>
      <button className="cm-node-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={"cm-caret" + (open ? " open" : "")}>▸</span>
        <Ring value={node.mastery} size={42} />
        <span className="cm-node-titles">
          <span className="cm-node-title">
            {node.title}
            <span className="cm-node-id">{node.id}</span>
          </span>
          <span className="cm-node-concept">{node.concept}</span>
        </span>
        <span className="cm-node-meta">
          {node.example ? <span className="cm-node-ex">{node.example}</span> : null}
          <span className="cm-leafcount">{node.cards.length} cards</span>
        </span>
      </button>

      {open && (
        <div className="cm-node-body">
          <div className="cm-node-subhead">
            {node.prereqs.length > 0 && (
              <div className="cm-prereqs">
                <span className="cm-prereqs-label">Builds on</span>
                {node.prereqs.map((p) => (
                  <span key={p} className="cm-prereq-pill">
                    {titleById[p] || p}
                  </span>
                ))}
              </div>
            )}
            {node.codes && node.codes.length > 0 && (
              <span className="cm-node-ccss" title="Common Core alignment">
                aligned to {node.codes.join(" · ")}
              </span>
            )}
          </div>
          <AtomicCards cards={node.cards} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Corner filigree (shared with other scenes)
// ---------------------------------------------------------------------------
function Corner() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="#1c1612" strokeWidth="1.8" />
      <path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="#a32a22" strokeWidth="1.2" opacity="0.7" />
      <circle cx="6" cy="6" r="2.4" fill="#a32a22" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function ConceptMap({ onBack }) {
  const tree = useMemo(() => buildConceptTree(), []);
  const live = isLiveMastery();
  const [activeId, setActiveId] = useState(tree.concepts[0] ? tree.concepts[0].id : null);
  const concept = tree.concepts.find((c) => c.id === activeId) || tree.concepts[0];

  return (
    <div className="scene cm-scene" data-vox-speaker="cook">
      <div className="paper-fill" style={{ position: "absolute", inset: 0 }} />
      <div className="foxing" />
      <div className="frame" />
      <div className="corner tl"><Corner /></div>
      <div className="corner tr"><Corner /></div>
      <div className="corner bl"><Corner /></div>
      <div className="corner br"><Corner /></div>

      <div className="cm-inner">
        {/* header */}
        <div className="cm-head">
          <div className="cm-head-l">
            <div className="cm-kicker"><span className="cm-k-dot" />Babushka&rsquo;s Fractions</div>
            <h1 className="cm-h-title">Concept Mastery Map</h1>
            <div className="cm-h-sub">
              Pick a concept up top to open its subconcepts. Mastery is measured at the smallest
              card and rolls up — explore in any order, at your own pace.
            </div>
          </div>
          <div className="cm-head-r">
            <span className={"cm-source " + (live ? "live" : "placeholder")}>
              {live ? "● Live engine data" : "○ Placeholder data"}
            </span>
            <button className="cm-back" onClick={onBack}>
              <span className="ar">&lsaquo;</span> Done
            </button>
          </div>
        </div>

        {/* legend */}
        <div className="cm-legend">
          <span className="cm-legend-item"><i className="sw strong" />Mastered (85%+)</span>
          <span className="cm-legend-item"><i className="sw partial" />Partial (50%+)</span>
          <span className="cm-legend-item"><i className="sw weak" />Weak (15%+)</span>
          <span className="cm-legend-item"><i className="sw empty" />Not started</span>
        </div>

        {/* TOP NAV — the high-level concepts */}
        <nav className="cm-nav" role="tablist" aria-label="Math concepts">
          {tree.concepts.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={concept && c.id === concept.id}
              className={"cm-nav-tab " + masteryClass(c.mastery) + (concept && c.id === concept.id ? " is-active" : "")}
              onClick={() => setActiveId(c.id)}
            >
              <Ring value={c.mastery} size={34} />
              <span className="cm-nav-tx">
                <span className="cm-nav-title">{c.title}</span>
                <span className="cm-nav-count">
                  {c.children.length} skill{c.children.length === 1 ? "" : "s"}
                </span>
              </span>
            </button>
          ))}
        </nav>

        {/* MAIN — the selected concept's subconcept breakdown */}
        {concept && (
          <div className="cm-detail">
            <div className="cm-detail-head">
              <Ring value={concept.mastery} size={50} />
              <div className="cm-detail-tx">
                <h2 className="cm-detail-title">{concept.title}</h2>
                {concept.blurb ? <p className="cm-detail-blurb">{concept.blurb}</p> : null}
              </div>
            </div>
            <div className="cm-scroll">
              {concept.children.map((node) => (
                <NodeRow key={node.id} node={node} titleById={tree.titleById} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
