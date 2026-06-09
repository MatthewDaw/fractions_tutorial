import { describe, it, expect } from 'vitest';
import { runSession } from '../../src/harness/sessionRunner.js';
import { heldOutFamily } from '../../src/harness/personas/families.js';
import { aggregate } from '../../src/harness/metrics.js';
import { runLoop } from '../../src/harness/recursiveLoop.js';

describe('T07 debug held-out transfer_after_fade', () => {
  it('compare held-out flags-off vs flags-on transfer_after_fade', () => {
    const skills = ['ADD_SAME_DEN', 'ADD_UNLIKE_COPRIME'];
    const seed = 1;
    
    const tapesOff = [];
    for (const p of heldOutFamily()) {
      for (const sk of skills) {
        tapesOff.push(runSession({ persona: p, skillId: sk, seed, stepCap: 24, flags: {} }));
      }
    }
    
    const tapesOn = [];
    for (const p of heldOutFamily()) {
      for (const sk of skills) {
        tapesOn.push(runSession({ persona: p, skillId: sk, seed, stepCap: 24, flags: { fluencyHardMode: true } }));
      }
    }
    
    const mOff = aggregate(tapesOff);
    const mOn = aggregate(tapesOn);
    
    console.log('OFF transfer_after_fade:', mOff.transfer_after_fade);
    console.log('ON  transfer_after_fade:', mOn.transfer_after_fade);
    console.log('OFF false_mastery_rate:', mOff.false_mastery_rate);
    console.log('ON  false_mastery_rate:', mOn.false_mastery_rate);
    
    // Per-tape analysis
    for (let i = 0; i < tapesOff.length; i++) {
      const off = tapesOff[i];
      const on = tapesOn[i];
      const offFade = off.steps.some(s => s.decision?.kind === 'FadeScaffold');
      const onFade = on.steps.some(s => s.decision?.kind === 'FadeScaffold');
      const offGate = off.steps.some(s => s.gate === true);
      const onGate = on.steps.some(s => s.gate === true);
      if (offGate !== onGate || offFade !== onFade) {
        console.log(`Tape ${off.run_id}: fade=${offFade}->${onFade}, gate=${offGate}->${onGate}`);
        // Check last step fluency
        const lastGateStep = on.steps.findLastIndex(s => s.gate === true);
        if (lastGateStep >= 0) {
          console.log('  ON last gate step:', lastGateStep);
        } else {
          console.log('  ON no gate open');
        }
      }
    }
  });
});

describe('T07 debug with actual loop seeds', () => {
  it('held-out family with loop hoSeed', () => {
    const skills = ['ADD_SAME_DEN', 'ADD_UNLIKE_COPRIME'];
    const seed = 1;
    const hoSeed = ((seed ^ 0x5ea1ed) >>> 0);
    console.log('hoSeed:', hoSeed);
    
    const tapesOff = [];
    for (const p of heldOutFamily()) {
      for (const sk of skills) {
        tapesOff.push(runSession({ persona: p, skillId: sk, seed: hoSeed, stepCap: 24, flags: {} }));
      }
    }
    
    const tapesOn = [];
    for (const p of heldOutFamily()) {
      for (const sk of skills) {
        tapesOn.push(runSession({ persona: p, skillId: sk, seed: hoSeed, stepCap: 24, flags: { fluencyHardMode: true } }));
      }
    }
    
    const mOff = aggregate(tapesOff);
    const mOn = aggregate(tapesOn);
    
    console.log('OFF transfer_after_fade:', mOff.transfer_after_fade);
    console.log('ON  transfer_after_fade:', mOn.transfer_after_fade);
    
    for (let i = 0; i < tapesOff.length; i++) {
      const off = tapesOff[i];
      const on = tapesOn[i];
      const offFadeGate = off.steps.some(s => s.decision?.kind === 'FadeScaffold') && off.steps.some(s => s.gate === true);
      const onFadeGate = on.steps.some(s => s.decision?.kind === 'FadeScaffold') && on.steps.some(s => s.gate === true);
      if (offFadeGate !== onFadeGate) {
        const off_gateStep = off.steps.findIndex(s => s.gate === true);
        const on_gateStep = on.steps.findIndex(s => s.gate === true);
        const off_fadeStep = off.steps.findIndex(s => s.decision?.kind === 'FadeScaffold');
        const on_fadeStep = on.steps.findIndex(s => s.decision?.kind === 'FadeScaffold');
        console.log(`Diff tape ${off.run_id}: fade[${off_fadeStep}/${on_fadeStep}] gate[${off_gateStep}/${on_gateStep}]`);
      }
    }
  });
});

describe('T07 debug frustrationScaffold', () => {
  it('frustrationScaffold changes held-out family metrics', () => {
    const skills = ['ADD_SAME_DEN', 'ADD_UNLIKE_COPRIME'];
    const hoSeed = ((1 ^ 0x5ea1ed) >>> 0);
    
    const tapesOff = [];
    for (const p of heldOutFamily()) {
      for (const sk of skills) {
        tapesOff.push(runSession({ persona: p, skillId: sk, seed: hoSeed, stepCap: 24, flags: {} }));
      }
    }
    
    const tapesOn = [];
    for (const p of heldOutFamily()) {
      for (const sk of skills) {
        tapesOn.push(runSession({ persona: p, skillId: sk, seed: hoSeed, stepCap: 24, flags: { frustrationScaffold: true } }));
      }
    }
    
    const mOff = aggregate(tapesOff);
    const mOn = aggregate(tapesOn);
    
    console.log('OFF transfer_after_fade:', mOff.transfer_after_fade);
    console.log('ON  transfer_after_fade:', mOn.transfer_after_fade);
    console.log('OFF false_mastery_rate:', mOff.false_mastery_rate);
    console.log('ON  false_mastery_rate:', mOn.false_mastery_rate);
    
    for (let i = 0; i < tapesOff.length; i++) {
      const off = tapesOff[i];
      const on = tapesOn[i];
      const offDecisions = off.steps.map(s => s.decision?.kind).filter(Boolean);
      const onDecisions = on.steps.map(s => s.decision?.kind).filter(Boolean);
      const offGate = off.steps.findIndex(s => s.gate === true);
      const onGate = on.steps.findIndex(s => s.gate === true);
      const hasDiff = JSON.stringify(offDecisions) !== JSON.stringify(onDecisions);
      if (hasDiff) {
        console.log(`Diff tape ${off.run_id}: offGate=${offGate}, onGate=${onGate}`);
        // check disengagedScaffoldCount trace
        console.log('  off decisions:', offDecisions.slice(0, 15).join(','));
        console.log('  on  decisions:', onDecisions.slice(0, 15).join(','));
      }
    }
  });
});

describe('T07 debug with lower nDisengScaffold', () => {
  it('frustrationScaffold + nDisengScaffold=1 changes held-out metrics', () => {
    const skills = ['ADD_SAME_DEN', 'ADD_UNLIKE_COPRIME'];
    const hoSeed = ((1 ^ 0x5ea1ed) >>> 0);
    
    const tapesOff = [];
    for (const p of heldOutFamily()) {
      for (const sk of skills) {
        tapesOff.push(runSession({ persona: p, skillId: sk, seed: hoSeed, stepCap: 24, flags: {} }));
      }
    }
    
    const tapesOn = [];
    for (const p of heldOutFamily()) {
      for (const sk of skills) {
        tapesOn.push(runSession({ persona: p, skillId: sk, seed: hoSeed, stepCap: 24, flags: { frustrationScaffold: true, 'escalation.nDisengScaffold': 1 } }));
      }
    }
    
    const mOff = aggregate(tapesOff);
    const mOn = aggregate(tapesOn);
    
    console.log('OFF transfer_after_fade:', mOff.transfer_after_fade);
    console.log('ON  transfer_after_fade:', mOn.transfer_after_fade);
    console.log('OFF false_mastery_rate:', mOff.false_mastery_rate);
    console.log('ON  false_mastery_rate:', mOn.false_mastery_rate);
    
    for (let i = 0; i < tapesOff.length; i++) {
      const off = tapesOff[i];
      const on = tapesOn[i];
      const offGate = off.steps.findIndex(s => s.gate === true);
      const onGate = on.steps.findIndex(s => s.gate === true);
      const hasDiff = offGate !== onGate;
      if (hasDiff) {
        console.log(`Diff tape ${off.run_id}: offGate=${offGate}, onGate=${onGate}`);
        const onDecisions = on.steps.map(s => `${s.decision?.kind}${s.decision?.kind==='RaiseScaffold'?'(w)':''}`);
        console.log('  on decisions:', onDecisions.slice(0, 15).join(','));
      }
    }
  });
});

describe('T07 debug idle signals in held-out family', () => {
  it('check idle signal frequency', () => {
    const skills = ['ADD_SAME_DEN', 'ADD_UNLIKE_COPRIME'];
    const hoSeed = ((1 ^ 0x5ea1ed) >>> 0);
    
    for (const p of heldOutFamily()) {
      for (const sk of skills) {
        const tape = runSession({ persona: p, skillId: sk, seed: hoSeed, stepCap: 24, flags: {} });
        // Count idle signals and scaffold changes
        let idleCount = 0;
        let scaffoldChanges = [];
        // We can't directly inspect idle signals from tape steps... let's look at step metadata
        for (const s of tape.steps) {
          if (s.observation) {
            // idle signals manifest as high latency
            if (s.observation.latency > 10000) idleCount++;
          }
        }
        const fades = tape.steps.filter(s => s.decision?.kind === 'FadeScaffold').length;
        const raises = tape.steps.filter(s => s.decision?.kind === 'RaiseScaffold').length;
        console.log(`${p.id}:${sk}: idleSignalHeuristic=${idleCount}, fades=${fades}, raises=${raises}, gate=${tape.steps.findIndex(s=>s.gate)}`);
      }
    }
  });
});

describe('T07 debug direct bimodal trace', () => {
  it('trace bimodal ADD_UNLIKE_COPRIME with nDisengScaffold=1', () => {
    const hoSeed = ((1 ^ 0x5ea1ed) >>> 0);
    const family = heldOutFamily();
    const bimodal = family.find(p => p.id === 'fam-held-bimodal');
    
    // Patch to trace idle signals
    const origEmit = bimodal.emit.bind(bimodal);
    const signals = [];
    bimodal.emit = function(problem, ctx) {
      const result = origEmit(problem, ctx);
      signals.push({ step: ctx.step, hasIdle: result.signals?.some(s=>s.type==='idle'), correct: null }); // we'll fill correct later
      return result;
    };
    
    const tape = runSession({ persona: bimodal, skillId: 'ADD_UNLIKE_COPRIME', seed: hoSeed, stepCap: 24, flags: { frustrationScaffold: true, 'escalation.nDisengScaffold': 1 } });
    
    console.log('Steps:', tape.steps.length, 'gate at:', tape.steps.findIndex(s=>s.gate===true));
    for (let i = 0; i < Math.min(tape.steps.length, 15); i++) {
      const s = tape.steps[i];
      const sig = signals[i];
      console.log(`  Step ${i}: ${s.decision?.kind}, correct=${s.observation?.correct}, hasIdle=${sig?.hasIdle}`);
    }
    
    const hasWarmRaise = tape.steps.some(s => s.decision?.kind === 'RaiseScaffold' && s.decision?.preserveWork);
    console.log('hasWarmRaise:', hasWarmRaise);
  });
  
  it('trace bimodal ADD_UNLIKE_COPRIME flags-off for comparison', () => {
    const hoSeed = ((1 ^ 0x5ea1ed) >>> 0);
    const family = heldOutFamily();
    const bimodal = family.find(p => p.id === 'fam-held-bimodal');
    
    const tape = runSession({ persona: bimodal, skillId: 'ADD_UNLIKE_COPRIME', seed: hoSeed, stepCap: 24, flags: {} });
    
    console.log('Steps:', tape.steps.length, 'gate at:', tape.steps.findIndex(s=>s.gate===true));
    for (let i = 0; i < Math.min(tape.steps.length, 15); i++) {
      const s = tape.steps[i];
      console.log(`  Step ${i}: ${s.decision?.kind}, correct=${s.observation?.correct}`);
    }
  });
});

describe('T07 find a seed that gives REAL verdict', () => {
  it('try multiple seeds', () => {
    for (const seed of [1, 2, 3, 5, 7, 11, 13, 17, 42]) {
      const verdict = runLoop({
        change: {
          id: 'frustrationScaffold-diseng',
          flags: { frustrationScaffold: true, 'escalation.nDisengScaffold': 1 },
          engineSha: 'dev',
        },
        seed,
      });
      if (verdict.verdict !== 'NO_CHANGE') {
        console.log(`seed=${seed} verdict=${verdict.verdict} heldOut:`, JSON.stringify(verdict.heldOutDelta));
      } else {
        console.log(`seed=${seed} NO_CHANGE`);
      }
    }
  });
});

describe('T07 debug fluencyLatencyTargetMs', () => {
  it('fluencyHardMode + tight latency target', () => {
    const verdict = runLoop({
      change: {
        id: 'fluency-hard-tight',
        flags: { fluencyHardMode: true, fluencyLatencyTargetMs: 1200, frustrationScaffold: true },
        engineSha: 'dev',
      },
      seed: 1,
    });
    console.log('verdict:', verdict.verdict);
    console.log('trainDelta:', JSON.stringify(verdict.trainDelta));
    console.log('heldOutDelta:', JSON.stringify(verdict.heldOutDelta));
    console.log('guardrail:', JSON.stringify(verdict.guardrail));
    console.log('regressions:', verdict.regressions);
  });
});
