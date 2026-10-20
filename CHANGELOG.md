# Changelog

## v3.0.0 — 2026-04-17

### Breaking

- **Distribution format changed from manual skill copy to Claude Code plugin.**
  The project is now packaged as an official Anthropic Claude Code plugin.
  Users on Claude Code < v2.1 must keep using the legacy manual install.
- **Skills moved** from `.claude/skills/<file>.md` flat layout to
  `skills/<name>/SKILL.md` + `references/` + `assets/` canonical plugin
  structure required by Anthropic's plugin spec.
- Path references inside skills now use `${CLAUDE_PLUGIN_ROOT}` for
  cross-file `Read` ops (resolved by the plugin runtime).

### Added

- `.claude-plugin/plugin.json` manifest (name, version, author, license,
  homepage, repository).
- `LICENSE` file (MIT, Copyright 2026 Andres Saavedra).
- YAML frontmatter on both SKILL.md files (genesis-governance and
  genesis-sync) with `disable-model-invocation: true` (explicit user
  invocation only — skills have side effects).
- **Gen22-Gen32 hardening rounds** (accumulated between 2.1.0 and 3.0.0):
  - CRITICAL RULES block at the top of the main skill — 7 always-apply
    rules (checkpoint-first, brownfield precedence, never-overwrite-without-
    backup, write-before-announce, Handler 11 allowlist, batch gate,
    MANDATORY READ GATE).
  - MANDATORY READ GATE at every phase transition with STOP-on-empty-read
    fallback to prevent silent phase-skipping.
  - `synthesis_accepted` check in Phase 2/3 — developer's verbatim wording
    preserved when synthesized interpretation of intake was rejected.
  - Resume announcement surfaces `agents_generated[]` when resuming from
    Phase 4/5/6 + runs `ls .claude/agents/` for on-disk visibility.
  - Brownfield `governance.config.yaml` precedence rule over disk-derived
    values (Sub-caso A vs Sub-caso B).
  - Intake backup safeguard before overwriting an existing intake file.
  - Active state recap at every phase close (working memory for long
    sessions, addresses FM-4 semantic drift).
- Test suite expanded from 50 → 328 invariants (static) + 9 smoke tests
  + 15 behavioral integration scenarios (INT-01..15).

### Fixed

- `ai-output-reviewer` activation condition in Phase 4: `has_ai_outputs=true`
  → `ai_outputs ≠ "none"` (broader coverage).
- Haiku model ID updated to `claude-haiku-4-5-20251001` in tier table.
- `.gitignore`: removed erroneous `package-lock.json` entry; added
  `.DS_Store`, `*.log`, `.env`, `.env.local` as defensive defaults.

### Migration

- Users coming from the 2.x manual-install flow: remove old
  `.claude/skills/genesis-governance*.md` from your project, then install
  via `/plugin install genesis-governance`.
- Existing `docs/intake/genesis-checkpoint.json` remains fully compatible —
  the plugin resumes from any Gen2+ checkpoint without migration.

---

## v2.1.0 — 2026-03-30

### Added

- **`/genesis-sync` skill** (`genesis-sync.md`) — Drift detector analogous to `terraform plan`. Reads `docs/intake/genesis-checkpoint.json` (v1.1) and checks 5 dimensions: D-SYNC-1 Package drift, D-SYNC-2 Dockerfile parity, D-SYNC-3 Env var drift, D-SYNC-4 Agent drift, D-SYNC-5 Constitution path. Reports findings with severity (HIGH/MEDIUM/LOW) and offers auto-fixes. Includes checkpoint migration from v1.0 to v1.1.
- **Checkpoint v1.1 schema** — Phase 5 checkpoint extended with `genesis_version`, `stack.*`, `paths.*`, `packages[]`, `env_vars[]`, `boundary_rules[]`. Enables `/genesis-sync` drift detection.
- **F7.1 — Phase 4b idempotency rule** — Agent file writes now check-before-write: if file already exists with correct content, skip with log message.
- **F7.2 — git tag after Phase 7 audit** — `git tag governance/YYYY-MM-DD` instruction added post-audit confirmation.
- **F7.3 — Governance Cadence in CLAUDE.md** — Generated CLAUDE.md now includes a `## Governance Cadence` section with a quarterly checklist.
- **F7.4 — `scripts/constitution-checks.ts`** — Phase 2 generates an executable CI script that translates §4 MUST NOT invariants into grep-based hard-fail checks. Includes monorepo path advisory comment.
- **F7.5 — Executable on-call commands** — Phase 6 runbook derives platform-specific commands (curl health, logs, restart) from the project stack.
- **F7.6 — axe-core in Phase 6 CI** — Projects with a frontend now get axe-core accessibility audit as a CI step.
- **F7.7 — Expanded model card** — Sections (9) data lineage, (10) model versioning governance, and (11) FRIA (EU AI Act) added.
- **Self-tests expanded to 50** — I35-I50 cover F7.1-F7.8 structural invariants and quality correctness checks.

### Fixed

- Constitution-checks.ts template: added `// Monorepo: replace 'src'` advisory comment to prevent silent false negatives on monorepo layouts.
- Checkpoint v1.1 schema: replaced descriptive text inside array values with empty arrays `[]` + explicit Note explaining population source.
- Checkpoint Migration Step 4: added explicit `hard_constraints → boundary_rules[]` mapping with `import_boundary` filter.
- genesis-sync.md: standardized `"genesis_version"` field references to JSON notation (not YAML-style `genesis_version:` key without quotes).

---

## v2.0.0 — 2026-03-30

Initial public release. Extracted from the SportsPulse project where the skill was developed and validated over 4 generations.

### What's included

- **Intake protocol (L1-L5):** Systematic business context collection with rejection rules and derivation tables. Cannot produce governance documents from insufficient inputs.
- **Phase 2-7:** Constitution → governance.config.yaml → CLAUDE.md → Document registry → CI pipeline → First governance audit.
- **M1 — Checkpoint resume:** Sessions can be interrupted and resumed. `docs/intake/genesis-checkpoint.json` tracks progress across all 10 possible states.
- **M2 — Hard emergency exit:** If business context is too undefined, writes `intake.[project].incomplete.md` and stops. No soft warnings.
- **M3 — Anti-ritual friction:** L4 requires naming the primary risk in own words. Phase 2 requires naming the most critical §4 invariant. Prevents paraphrase-and-continue.
- **M4 — Quick mode expiry:** Quick-mode CLAUDE.md includes a 30-day expiry banner as a reminder to complete governance.
- **M5 — Self-test:** `scripts/test-genesis-governance.ts` — 34 structural invariants at launch (expanded to 50 in v2.1.0).
- **M6 — Lazy-load split:** Main file (intake) + docs file (phases 2-7) loaded on demand. Reduces context pressure.
- **M7 — Cross-reference index:** Table of downstream consumers per section, prevents edits that break downstream phases.
- **Phase 7 standalone:** First governance audit runs inline with tool calls — no external skill dependency.

### Validated in production

- PropAI Session 1 (2026-03-29): Full L1-L7 intake + Phase 2-5 → CONFORME ✅
- PropAI Session 2 (2026-03-30): Phase 6-7 (CI pipeline + first audit) → CONFORME ✅
