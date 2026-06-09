// harness/cli.js — vite-node entry. `npm run harness -- <subcommand> [flags]`.
//
// vite-node reuses Vite's TS pipeline, so the engine's .ts imports resolve with
// zero config (KTD10). Subcommands drive the REAL harness and emit artifacts under
// docs/harness/ (tape projections + the signed tapes themselves).
//
//   baseline  — full seeded sweep (all personas × all skills) → tapes + reports +
//               backlog + verdict cards + limitations memo. Verifies determinism.
//   search    — adversarial nearest-decision-flip search → frozen champion fixtures.
//   loop      — runs the recursive loop with plan-002's flags as the canonical change
//               + the flags-off→on certification matrix → decision log. Confirms the
//               sealed held-out seal holds under REAL (non-perturbMetrics) conditions.
//   report    — RE-PROJECTS every doc from the committed baseline tapes (proving the
//               docs are pure projections that reproduce byte-for-byte).
//
// fs is allowed here (Node-only via vite-node); the pure cores never touch it.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

import { makeRun, defaultFlags, paramsHash } from './config.js';
import { allNodes, generatorSkills } from './engineApi.js';
import { runSweep } from './sessionRunner.js';
import { aggregate } from './metrics.js';
import { buildBacklog, renderBacklogMarkdown } from './findings.js';
import { tapesToJsonl, jsonlToTapes } from './tape.js';
import { runLoop, distillChampions } from './recursiveLoop.js';
import { searchNearestFlip } from './search.js';
import { runExpectedFindings } from './oracle/expectedFindings.js';
import {
  buildBaselineReport,
  renderBaselineReportMarkdown,
  buildVerdictCards,
  renderVerdictCardsMarkdown,
  buildDecisionLog,
  renderDecisionLogMarkdown,
  buildLimitationsMemo,
  renderLimitationsMemoMarkdown,
  renderResearchNotesMarkdown,
} from './report.js';

// docs/harness lives at the repo root (../../../docs/harness from this file).
const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, '..', '..', '..', 'docs', 'harness');
const TAPES_DIR = join(DOCS, 'tapes');
const CHAMPIONS_DIR = join(DOCS, 'champions');

const STEP_CAP = 40;

function parseArgs(argv) {
  const args = argv.slice(2).filter((a) => a !== '--');
  const opts = { _: [] };
  let sub = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next === undefined || next.startsWith('--')) opts[key] = true;
      else {
        opts[key] = next;
        i++;
      }
    } else if (sub === null) sub = a;
    else opts._.push(a);
  }
  return { sub, opts };
}

async function writeDoc(name, contents) {
  await mkdir(DOCS, { recursive: true });
  await writeFile(join(DOCS, name), contents.endsWith('\n') ? contents : contents + '\n', 'utf8');
  console.log(`  wrote docs/harness/${name}`);
}

function flagsFrom(opts) {
  return opts['flags-on'] ? { fluencyHardMode: true, frustrationScaffold: true, delayedProbe: true, unifiedTaxonomy: true } : defaultFlags();
}

// ---------------------------------------------------------------------------
// baseline — the full seeded sweep + every projection.
// ---------------------------------------------------------------------------

async function cmdBaseline(opts) {
  const seed = opts.seed ? Number(opts.seed) : 1;
  const flags = flagsFrom(opts);
  const flagLabel = opts['flags-on'] ? 'flags-ON (002 activated)' : 'flags-OFF (baseline)';
  console.log(`[harness] baseline sweep — seed=${seed}, ${flagLabel}, all personas × all skills…`);

  const tapes = runSweep({ seed, stepCap: STEP_CAP, flags });

  // determinism: a second identical sweep must be byte-identical.
  const tapes2 = runSweep({ seed, stepCap: STEP_CAP, flags });
  const deterministic = tapesToJsonl(tapes) === tapesToJsonl(tapes2);
  console.log(`  ${tapes.length} sessions · determinism: ${deterministic ? 'OK (byte-identical re-run)' : 'FAILED'}`);
  if (!deterministic) process.exitCode = 1;

  const metrics = aggregate(tapes);
  const backlog = buildBacklog(tapes, { flags });
  const baselineReport = buildBaselineReport(tapes);
  const cards = buildVerdictCards(tapes);
  const limitations = buildLimitationsMemo(tapes, { llmAvailable: false });

  console.log(
    `  false_mastery_rate=${metrics.false_mastery_rate} · missed_escalation_rate=${metrics.missed_escalation_rate} · ` +
      `backlog items=${backlog.items.length} · human-audit agreement=${(backlog.humanAgreementWith * 100).toFixed(0)}%`
  );
  console.log(`  top verdict card: ${cards[0] ? `${cards[0].metricLabel} — ${cards[0].persona_id}/${cards[0].skill}` : '(none)'}`);

  if (opts.dry) return;

  await mkdir(TAPES_DIR, { recursive: true });
  await writeFile(join(TAPES_DIR, `baseline-seed${seed}.jsonl`), tapesToJsonl(tapes), 'utf8');
  console.log(`  wrote docs/harness/tapes/baseline-seed${seed}.jsonl`);

  await writeDoc('baseline-report.md', renderBaselineReportMarkdown(baselineReport));
  await writeDoc('improvement-backlog.md', renderBacklogMarkdown(backlog));
  await writeDoc('verdict-cards.md', renderVerdictCardsMarkdown(cards));
  await writeDoc('limitations-memo.md', renderLimitationsMemoMarkdown(limitations));
  await writeDoc('research-notes.md', renderResearchNotesMarkdown());
}

// ---------------------------------------------------------------------------
// search — nearest decision-flip adversaries → frozen champion fixtures.
// ---------------------------------------------------------------------------

async function cmdSearch(opts) {
  const seed = opts.seed ? Number(opts.seed) : 1;
  const skillId = opts.skill || 'ADD_SAME_DEN';
  console.log(`[harness] search — nearest false-mastery flip on ${skillId} (seed=${seed})…`);

  // A deliberately weak baseline the engine tends to over-credit.
  const baseSpec = {
    id: 'cli-weak-baseline', klass: 'red-team:weak',
    latent: { truePknownDefault: 0.2, learnRate: 0.01, pSlip: 0.1, pGuess: 0.2, misconceptionStrength: 0.7, hintAppetite: 0.05 },
    meta: { approximates: 'a low-knowledge guesser', mightMiss: 'n/a' },
  };
  const found = searchNearestFlip({ baseSpec, skillId, objective: 'falseMastery', seed, generations: 8, mu: 4, lambda: 12, stepCap: STEP_CAP });
  console.log(`  found=${found.found}${found.found ? ` · distance-to-honest=${found.distanceToHonest?.toFixed?.(4)} · replay seed=${found.seed}` : ' (no flip within the plausibility box)'}`);

  if (!found.found || opts.dry) return;

  const corpus = [{ latent: found.latent, seed: found.seed, flip: true, flipKind: 'falseMastery', distance: found.distanceToHonest, run_id: 'cli-champ-0', tuples: [] }];
  const fixtures = distillChampions({ searchResults: corpus, n: Number(opts.n) || 5, skillId });
  await mkdir(CHAMPIONS_DIR, { recursive: true });
  await writeFile(join(CHAMPIONS_DIR, `champions-${skillId}-seed${seed}.json`), JSON.stringify(fixtures, null, 2), 'utf8');
  console.log(`  wrote docs/harness/champions/champions-${skillId}-seed${seed}.json (${fixtures.length} fixture(s))`);
}

// ---------------------------------------------------------------------------
// loop — recursive loop + plan-002 certification matrix → decision log.
// ---------------------------------------------------------------------------

async function cmdLoop(opts) {
  const seed = opts.seed ? Number(opts.seed) : 1;
  console.log(`[harness] loop — canonical change = plan-002 flags (flags-off → flags-on), seed=${seed}…`);

  // Primary certification: frustrationScaffold flag alone (T20).
  // This is the target change that T20's new held-out persona certifies.
  // The all-flags canonical change remains GAMING due to a pre-existing
  // fluencyHardMode/bimodal-persona TAF interaction (bimodal latency exceeds
  // the 8000ms fluency ceiling under hard mode, blocking the gate within stepCap=24).
  // That interaction is a separate known issue; T20 is specifically about
  // certifying frustrationScaffold, which this dedicated run confirms as REAL.
  const verdict = runLoop({
    change: { id: 'disengaged-fix-T20 (frustrationScaffold)', flags: { frustrationScaffold: true }, engineSha: 'dev' },
    seed,
  });
  console.log(`  verdict: ${verdict.verdict} (held-out net improvement=${verdict.heldOutDelta.netImprovement})`);
  if (verdict.verdict === 'NO_CHANGE') console.log('  seal holds: inert flags do not spuriously read REAL.');
  else if (verdict.verdict === 'REAL') console.log('  ✓ a flag genuinely improved the sealed held-out family.');

  // All-flags canonical change: documents the combined plan-002 activation.
  // GAMING here is a known pre-existing issue: fluencyHardMode causes bimodal
  // persona TAF to degrade (median latency > 8000ms ceiling in hard mode).
  const verdictAllFlags = runLoop({
    change: { id: 'plan-002-flags', flags: { fluencyHardMode: true, frustrationScaffold: true, delayedProbe: true, unifiedTaxonomy: true }, engineSha: 'dev' },
    seed,
  });
  console.log(`  all-flags verdict: ${verdictAllFlags.verdict} (held-out net improvement=${verdictAllFlags.heldOutDelta.netImprovement})`);

  const flagsOff = runExpectedFindings({ flags: defaultFlags() });
  const flagsOn = runExpectedFindings({ flags: { fluencyHardMode: true, frustrationScaffold: true, delayedProbe: true, unifiedTaxonomy: true } });
  console.log(`  audit reproduction (flags-off): ${(flagsOff.humanAgreement * 100).toFixed(0)}% of 6 defects present`);

  if (opts.dry) return;
  const log = buildDecisionLog({ loopVerdicts: [verdict, verdictAllFlags], flagsOff, flagsOn });
  await writeDoc('decision-log.md', renderDecisionLogMarkdown(log));
}

// ---------------------------------------------------------------------------
// report — RE-PROJECT every doc from the committed baseline tapes.
// ---------------------------------------------------------------------------

async function cmdReport(opts) {
  const seed = opts.seed ? Number(opts.seed) : 1;
  const path = join(TAPES_DIR, `baseline-seed${seed}.jsonl`);
  let tapes;
  try {
    tapes = jsonlToTapes(await readFile(path, 'utf8'));
  } catch {
    console.log(`[harness] no committed tapes at docs/harness/tapes/baseline-seed${seed}.jsonl — run \`baseline --seed ${seed}\` first.`);
    process.exitCode = 1;
    return;
  }
  console.log(`[harness] report — re-projecting ${tapes.length} committed tapes (seed=${seed})…`);

  const baselineReport = buildBaselineReport(tapes);
  const backlog = buildBacklog(tapes);
  const cards = buildVerdictCards(tapes);
  const limitations = buildLimitationsMemo(tapes, { llmAvailable: false });

  if (opts.dry) return;
  await writeDoc('baseline-report.md', renderBaselineReportMarkdown(baselineReport));
  await writeDoc('improvement-backlog.md', renderBacklogMarkdown(backlog));
  await writeDoc('verdict-cards.md', renderVerdictCardsMarkdown(cards));
  await writeDoc('limitations-memo.md', renderLimitationsMemoMarkdown(limitations));
  await writeDoc('research-notes.md', renderResearchNotesMarkdown());
}

// ---------------------------------------------------------------------------

async function main() {
  const { sub, opts } = parseArgs(process.argv);

  if (opts.dry && !sub) {
    const nodes = allNodes();
    const skills = generatorSkills();
    console.log(`[harness] dry run ok — ${nodes.length} skill nodes, ${skills.length} generators, params_hash=${paramsHash()}`);
    return;
  }

  switch (sub) {
    case 'baseline': await cmdBaseline(opts); break;
    case 'search': await cmdSearch(opts); break;
    case 'loop': await cmdLoop(opts); break;
    case 'report': await cmdReport(opts); break;
    default:
      console.log('usage: harness <baseline|search|loop|report> [--seed N] [--flags-on] [--skill ID] [--dry]');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
