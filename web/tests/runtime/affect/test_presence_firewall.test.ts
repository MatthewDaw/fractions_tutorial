// test_presence_firewall.test.ts — Phase 4 (plan 005): the AFFECT FIREWALL lint for
// the presence gate. This is the auditable-by-inspection check the plan ties Phase 4
// to (Phase 0 firewall): the presence gate (a) never imports the mastery engine /
// gate, (b) carries NO emotion/valence/arousal code path, and (c) emits only inert
// telemetry Signal types that have no static path into gate.ts. A regulator can run
// this test to confirm the camera is presence-only.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRESENCE_SRC = resolve(__dirname, '../../../src/runtime/affect/presence.ts');
const CONSENT_SRC = resolve(__dirname, '../../../src/ui/PresenceConsent.jsx');

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

// Strip line + block comments so the lint inspects CODE, not the doc-comments that
// legitimately *name* the banned concepts to explain their absence.
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

describe('presence firewall — no emotion/valence/arousal CODE path', () => {
  it('the presence module source carries no emotion classifier vocabulary in code', () => {
    const code = stripComments(read(PRESENCE_SRC));
    // None of these emotion-inference concepts may appear as identifiers/strings.
    const banned = /\b(valence|arousal|emotion|FACS|expression|sentiment|mood|happy|sad|angry|frustrated|bored)\b/i;
    expect(code).not.toMatch(banned);
  });

  it('the consent UI carries no emotion vocabulary in code', () => {
    const code = stripComments(read(CONSENT_SRC));
    const banned = /\b(valence|arousal|emotion|FACS|sentiment)\b/i;
    expect(code).not.toMatch(banned);
  });
});

describe('presence firewall — no import path into the mastery engine / gate', () => {
  it('presence.ts does not import gate, mastery, dimensions, or policy', () => {
    const src = read(PRESENCE_SRC);
    const imports = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const spec of imports) {
      expect(spec).not.toMatch(/\/(gate|mastery|dimensions|policy)(\.js)?$/);
    }
    // The only engine import allowed is the shared wire types (Signal/Actor).
    const engineImports = imports.filter((s) => s.includes('/engine/'));
    for (const e of engineImports) {
      expect(e).toMatch(/\/engine\/types(\.js)?$/);
    }
  });
});

describe('presence firewall — Signal types are inert telemetry only', () => {
  it('presence emits only the reserved telemetry types (presence / sensor_unavailable)', () => {
    const code = stripComments(read(PRESENCE_SRC));
    // Collect every `type: '...'` literal used to build a Signal.
    const types = [...code.matchAll(/type:\s*'([a-z_]+)'/g)].map((m) => m[1]);
    expect(types.length).toBeGreaterThan(0);
    const allowed = new Set(['presence', 'sensor_unavailable']);
    for (const t of types) {
      expect(allowed.has(t)).toBe(true);
    }
  });
});
