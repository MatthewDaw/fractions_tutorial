// harness/cli.js — vite-node entry. `npm run harness -- <subcommand> [flags]`.
//
// vite-node reuses Vite's TS pipeline, so the engine's .ts imports resolve with
// zero config (KTD10). Subcommands are dispatched to later units; U1 ships the
// dispatcher + a `--dry` smoke path that proves the engine imports in Node.
import { makeRun, paramsHash } from './config.js';
import { allNodes, generatorSkills } from './engineApi.js';

function parseArgs(argv) {
  // Drop node + script path, and any literal `--` separators (npm/vite-node pass-through).
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

async function main() {
  const { sub, opts } = parseArgs(process.argv);
  const run = makeRun({ seed: opts.seed ? Number(opts.seed) : 1 });

  if (opts.dry) {
    // Smoke: prove the engine + generators import and resolve in Node.
    const nodes = allNodes();
    const skills = generatorSkills();
    console.log(
      `[harness] dry run ok — ${nodes.length} skill nodes, ${skills.length} generators, params_hash=${paramsHash()}`
    );
    return;
  }

  switch (sub) {
    case 'baseline':
    case 'search':
    case 'loop':
    case 'report':
      console.log(`[harness] "${sub}" not yet wired (run_id=${run.run_id}). See plan U6–U11.`);
      break;
    default:
      console.log('usage: harness <baseline|search|loop|report> [--seed N] [--dry]');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
