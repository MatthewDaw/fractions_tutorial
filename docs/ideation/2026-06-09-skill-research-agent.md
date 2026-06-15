# Ideation: skill-research agent (skill-scout)  (2026-06-09)

## Grounding context

Designing a new Command HQ agent whose job is to **research new skills worth installing**,
biased toward **improving the agent fleet itself**. It mines a broad set of public sources
(skills.sh is one of *many* — per the user's clarification, breadth of sources beyond
skills.sh is the point) and also **invents net-new skills** by reading official tool/SDK
docs and spotting capability gaps. Output must be actionable: proposals ready to hand to
`/hq-add-skill`.

Key external findings (web research, 2026-06):
- **No public skills.sh API yet** (issue #426 open) — mine via the scrapable web directory,
  `npx skills find`, the badge SVG (`skills.sh/b/<owner>/<repo>`), or replicate via GitHub
  topic search on `agent-skills` (6,435 repos), `claude-skills` (4,083), `claude-code-skills`.
- **Trust tiers exist**: `anthropics/skills` (format authors, canonical) > curated awesome
  lists (ComposioHQ, hesreallyhim/awesome-claude-code, addyosmani, travisvn) > raw
  marketplaces (SkillsMP 800k+ scraped, claudeskills.info, lobehub) which need heavy filtering.
- **Canonical authoring spec**: agentskills.io/specification (SKILL.md frontmatter: `name`,
  `description` required; progressive disclosure ~100 tokens at startup, body <500 lines).
- **Quality rubric is public**: description specificity is the #1 variable; eval-driven
  (≥3 scenarios); scripts-for-determinism; security (no surprise network calls) is
  first-class; "narrow beats broad."

This project (`fractions_tutorial`) already carries ~100 enabled skills (the `ac-*`, `hq-*`,
game-dev, and spec families) — so **duplicate-avoidance against the live HQ catalog is a hard
requirement**, not a nicety.

### Topic axes
1. **Mission/scope** — what it researches and its boundaries
2. **Source roster** — *where* it mines (user's emphasis: many sources, not just skills.sh)
3. **Output format** — proposals actionable by `/hq-add-skill`
4. **Evaluation/ranking** — how candidates are scored and ordered
5. **Dedup & anti-slop** — avoiding what we already have, and junk

## Top ideas (ranked)

### 1. Dual-mode mission: *discover existing* AND *invent net-new* (axis: mission)
Two distinct pipelines under one agent, never conflated. **Discover** = crawl source roster,
extract candidates, dedup, rank. **Invent** = read official tool/SDK docs (MCP, Agent SDK,
Claude Code, REST), diff documented capabilities against our installed skills, and propose
skills for capability gaps no existing skill fills. The invent mode is what turns "tool
documentation guidelines" into net-new SKILL.md drafts.
- basis: `direct:` user — "search places like skills.sh ... along with possibly just
  inventing a skill by looking at tool documentation guidelines."
- why it matters: discovery alone caps at what others have already built; invention is where
  the fleet pulls ahead. Effort: M. Impact: high.

### 2. Broad, trust-tiered source roster maintained as reproducible config (axis: source roster)
The agent owns a versioned source registry (a `references/sources.md` in the skill it pulls
from) listing ~10–15 sources with a **trust tier** and a **how-to-query note** each, e.g.:
T1 `anthropics/skills`, agentskills.io spec; T2 GitHub topics `agent-skills`/`claude-skills`,
ComposioHQ / hesreallyhim / addyosmani / travisvn awesome lists, github/awesome-copilot;
T3 skills.sh (install telemetry), SkillsMP, claudeskills.info, lobehub, the agentskills
Discord. Findings are weighted by tier. New sources are added by editing the registry, so the
investigation is reproducible and auditable.
- basis: `direct:` user — "find a lot of sources like skills.sh but that aren't skills.sh";
  `external:` ranked source list from web research.
- why it matters: breadth-of-source is the user's stated value, and a config-driven roster
  means the agent doesn't silently narrow to one site. Effort: S. Impact: high.

### 3. Output = scaffolded, evidence-linked `/hq-add-skill` proposals (axis: output)
Each surfaced candidate becomes a proposal block under `docs/improvements/` (or a report)
carrying: proposed skill `name` + `description` (spec-compliant, third person, trigger-led),
a 1-paragraph SKILL.md sketch, **source URL + author + license + install/star signal**, a
"what fleet gap it closes" note, and a ready-to-paste `/hq-add-skill` invocation. No bare
reading lists.
- basis: `direct:` user — "proposals ready for /hq-add-skill"; `external:` agentskills.io
  frontmatter spec + best-practices description rules.
- why it matters: collapses research→adoption to one copy-paste; keeps the human gate intact.
  Effort: M. Impact: high.

### 4. Fleet-fit scoring, with telemetry as one axis (not the verdict) (axis: evaluation)
Rank candidates on a small rubric: (a) **fleet-fit** — does it close a gap our agents
actually hit (grounded in `docs/improvements/` + our enabled-agents set)? (b) quality signal
from the public rubric (description specificity, eval coverage, scripts-for-determinism);
(c) community telemetry (skills.sh installs / GitHub stars) — explicitly capped as *one*
input because slop can be popular; (d) maintenance freshness. Output ordered by composite.
- basis: `direct:` user — "focused on improving agents"; `external:` futureagi rubric +
  Anthropic best-practices.
- why it matters: prevents star-chasing and keeps recommendations tied to *our* leverage.
  Effort: M. Impact: med-high.

### 5. Hard dedup gate against the live HQ catalog + local inventory (axis: dedup/anti-slop)
Before any proposal surfaces, the agent reads the org catalog (`GET <HQ>/skills`) and the
local `~/.claude+` / `.claude/skills` set, and fingerprints candidates by **capability**, not
name — so it won't re-propose something the `ac-*` / `hq-*` families already cover. Near-dupes
are reported as "already covered by X" instead of as new finds.
- basis: `direct:` repo reality — ~100 skills already enabled; `reasoned:` name-only matching
  misses functional overlap (e.g. a "PR reviewer" dup of `ac-code-review`).
- why it matters: the single biggest anti-slop lever in a repo this skill-dense. Effort: M.
  Impact: high.

### 6. License & security firewall before proposal (axis: dedup/anti-slop)
A candidate is rejected (or flagged "review-required") if its source skill has unexplained
network calls in scripts, an unclear/again-incompatible license, or operations that don't
match its stated description. Security is treated as a first-class gate, matching the
community consensus that untrusted skills are an exfiltration risk.
- basis: `external:` Anthropic best-practices + travisvn list both lead with this warning.
- why it matters: an agent that recommends installing arbitrary GitHub skills is an attack
  surface; the firewall makes its output safe to act on. Effort: S. Impact: med-high.

### 7. Systematic-review / dependency-audit protocol framing (axis: mission + evaluation)
Run the investigation like a dependency audit (Dependabot analogy) / systematic review:
pre-registered sources, explicit inclusion/exclusion criteria, dedup, then a triaged report
bucketed **new candidates / updates to skills we have / deprecations**. Makes runs comparable
over time and the cut visible (what was excluded and why).
- basis: `external:` cross-domain analogy (dependency scanners, lit-review protocols);
  `reasoned:` reproducibility is what separates a real investigation from a vibes list.
- why it matters: lets the agent run on a cadence and show *delta*, not re-litigate the whole
  field each time. Effort: M. Impact: med.

## Also considered (rejected, with reasons)
- **Auto-install the top-ranked skills** — rejected: violates the human-gated `/hq-add-skill`
  flow and is a security risk; the agent proposes, the human installs.
- **Rank purely by stars/install count** — rejected: slop can be popular; folded into idea 4
  as one capped axis instead.
- **Build a custom skills.sh API client** — rejected: no public API exists yet (issue #426);
  scrape + `npx skills find` + GitHub-topic replication is the durable path.
- **One mega-skill that does discovery + authoring + installation** — rejected: violates
  "narrow beats broad"; this is an *agent* that emits proposals, with authoring delegated to
  `/hq-add-skill`.
