// harness/dashboard/FailureHeatmap.jsx — persona (rows) × skill (cols) grid.
//
// Each cell is THREE vertical strips — false-mastery | false-transfer | missed-
// escalation — so a cell that carries more than one failure shows all of them at
// once (the same taxonomy/colors as the verdict cards + recursive panel). Clicking
// a cell selects it; the parent opens the matching verdict cards.

import React from 'react';
import { FAILURE_STRIPS, SKILL_SHORT } from './data.js';

export default function FailureHeatmap({ heatmap, selected, onSelect }) {
  const { personas, skills, cells } = heatmap;

  return (
    <div className="hd-heatmap-wrap" role="region" aria-label="Failure heatmap">
      <table className="hd-heatmap">
        <thead>
          <tr>
            <th className="hd-corner" scope="col">persona ╲ skill</th>
            {skills.map((sk) => (
              <th key={sk} scope="col" title={sk}>{SKILL_SHORT[sk] || sk}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {personas.map((p) => (
            <tr key={p}>
              <th scope="row" className="hd-rowhead" title={p}>{p}</th>
              {skills.map((sk) => {
                const key = `${p}|${sk}`;
                const cell = cells[key];
                const isSel = selected && selected.persona_id === p && selected.skill === sk;
                return (
                  <td key={key} className="hd-cellwrap">
                    <button
                      type="button"
                      className={`hd-cell ${cell && cell.anyLabel ? 'has-label' : ''} ${isSel ? 'sel' : ''}`}
                      title={cellTitle(p, sk, cell)}
                      aria-label={cellTitle(p, sk, cell)}
                      data-testid={`cell-${key}`}
                      onClick={() => onSelect && onSelect({ persona_id: p, skill: sk })}
                    >
                      {FAILURE_STRIPS.map((strip) => (
                        <span
                          key={strip.key}
                          className={`hd-strip ${cell && cell[strip.key] ? `on on-${strip.key}` : ''}`}
                          title={strip.label}
                        />
                      ))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Legend />
    </div>
  );
}

function cellTitle(persona, skill, cell) {
  if (!cell || !cell.anyLabel) return `${persona} · ${skill}: no failure`;
  const fired = FAILURE_STRIPS.filter((s) => cell[s.key]).map((s) => s.label);
  if (cell.falseEscalation) fired.push('False escalation');
  return `${persona} · ${skill}: ${fired.join(', ')}`;
}

function Legend() {
  return (
    <div className="hd-legend">
      {FAILURE_STRIPS.map((s) => (
        <span key={s.key} className="hd-legend-item">
          <span className={`hd-strip on on-${s.key}`} /> {s.label}
        </span>
      ))}
    </div>
  );
}
