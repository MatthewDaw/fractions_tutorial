// U12 — dashboard render smoke. Light: no engine behavior is asserted here (that is
// U4–U6/U11); we verify the dashboard MOUNTS from injected tapes, renders a heatmap
// cell per persona×skill, opens the matching verdict cards on click, shows the empty
// state, surfaces the recursive verdict, and that the in-browser replay path runs.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import React from 'react';
import HarnessDashboard from '../../src/harness/dashboard/HarnessDashboard.jsx';
import { runSession } from '../../src/harness/sessionRunner.js';
import { personaById } from '../../src/harness/personas/library.js';

afterEach(cleanup);

// --- fabricated sweep tapes (deterministic; no engine run needed) ---------------
function gateTape(persona, skill, seed, latent) {
  return {
    run_id: `r-${persona}-${skill}`, seed, persona_id: persona, persona_latents: { pGuess: 0.3 },
    params_hash: 'h', engine_sha: 'dev', flags: {}, skillId: skill,
    steps: [{ decision: { kind: 'PresentProblem', rationale: '' }, observation: { correct: true, scaffold_level: 3, hint_max_rung: 0, latency: 300 }, gate: true, latent, pknown: 0.97 }],
    terminal: { kind: 'ReturnToKitchen', step: 1 },
  };
}

// p-guess false-masters on Same-Den (latent 0.5 < τ); everything else clean.
const FIXTURE = [
  gateTape('p-guess', 'ADD_SAME_DEN', 1, 0.5),  // false mastery
  gateTape('p-guess', 'SIMPLIFY', 2, 0.95),     // clean
  gateTape('p-honest', 'ADD_SAME_DEN', 3, 0.95),// clean
  gateTape('p-honest', 'SIMPLIFY', 4, 0.95),    // clean
];

describe('HarnessDashboard — render smoke', () => {
  it('mounts and renders a heatmap cell per persona × skill', () => {
    render(<HarnessDashboard tapes={FIXTURE} autoRun={false} />);
    expect(screen.getByText(/Synthetic-learner red-team/i)).toBeInTheDocument();
    for (const p of ['p-guess', 'p-honest']) {
      for (const s of ['ADD_SAME_DEN', 'SIMPLIFY']) {
        expect(screen.getByTestId(`cell-${p}|${s}`)).toBeInTheDocument();
      }
    }
  });

  it('opens the matching verdict card(s) when a failing cell is clicked', () => {
    render(<HarnessDashboard tapes={FIXTURE} autoRun={false} />);
    fireEvent.click(screen.getByTestId('cell-p-guess|ADD_SAME_DEN'));
    // the false-mastery claim copy appears in the detail panel.
    expect(screen.getByText(/declared "p-guess" a master/i)).toBeInTheDocument();
    // "False mastery" appears both in the legend and the card pill — both is fine.
    expect(screen.getAllByText(/False mastery/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows "no failure" for a clean cell', () => {
    render(<HarnessDashboard tapes={FIXTURE} autoRun={false} />);
    fireEvent.click(screen.getByTestId('cell-p-honest|SIMPLIFY'));
    expect(screen.getByText(/no oracle-labeled failure/i)).toBeInTheDocument();
  });

  it('shows the empty state with a Run button when no tapes are loaded', () => {
    render(<HarnessDashboard tapes={null} autoRun={false} />);
    expect(screen.getByText(/Run demo sweep/i)).toBeInTheDocument();
  });

  it('renders the recursive panel verdict + held-out guard when a verdict is supplied', () => {
    const verdict = {
      verdict: 'REAL',
      trainDelta: { false_mastery_rate: { before: 0.4, after: 0.1 }, transfer_after_fade: { before: 0, after: 0 }, netImprovement: 0.3 },
      heldOutDelta: { false_mastery_rate: { before: 0.33, after: 0 }, transfer_after_fade: { before: 1, after: 1 }, netImprovement: 0.33 },
      guardrail: { degraded: false },
      regressions: [],
    };
    render(<HarnessDashboard tapes={FIXTURE} autoRun={false} verdict={verdict} />);
    expect(screen.getByText('REAL')).toBeInTheDocument();
    expect(screen.getByText(/improved/i)).toBeInTheDocument();
  });

  it('greys the tuned column when no verdict is supplied (un-run loop)', () => {
    render(<HarnessDashboard tapes={FIXTURE} autoRun={false} />);
    expect(screen.getByText(/Run the improvement loop/i)).toBeInTheDocument();
  });

  it('runs the in-browser replay for a REAL persona/skill cell', () => {
    // Build a real tape so personaById(...) can rebuild the persona for replay.
    const persona = personaById('fam-held-fluency-spoofer');
    const tape = runSession({ persona, skillId: 'ADD_SAME_DEN', seed: (3 ^ 0x5ea1ed) >>> 0, stepCap: 18 });
    render(<HarnessDashboard tapes={[tape]} autoRun={false} />);
    fireEvent.click(screen.getByTestId(`cell-${tape.persona_id}|ADD_SAME_DEN`));
    // a false-mastery card exists → click Replay → a step row appears.
    fireEvent.click(screen.getByText(/Replay this session/i));
    expect(screen.getByText(/terminal:/i)).toBeInTheDocument();
    expect(screen.getByText(/step 1\//i)).toBeInTheDocument();
  });
});
