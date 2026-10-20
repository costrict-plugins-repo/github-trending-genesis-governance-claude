# genesis-governance

A governance framework genesis protocol for [Claude Code](https://claude.ai/code) projects.

Run `/genesis-governance` once on a new project. Walk out with a constitution, CLAUDE.md, governance.config.yaml, document registry, CI pipeline, and a passing first audit — all derived from your actual project context.

---

## What it produces

| Artifact | What it is |
|----------|-----------|
| `docs/core/spec.[project].core.constitution.md` | Project principles, system invariants, architecture rules |
| `governance.config.yaml` | Parameterizes automated checks: packages, thresholds, risk flags |
| `CLAUDE.md` | AI operating instructions — how Claude Code should behave in this repo |
| `docs/_registry/document-registry.md` | Inventory of all governed artifacts |
| `.github/workflows/ci.yml` | CI pipeline derived from your governance profile |
| `docs/governance/governance-audit-[date].md` | Result of the first governance audit |

Everything is derived from your answers in the intake — not from a generic template.

---

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and running
- A project directory with `git init` done
- A `CLAUDE.md` file (can be empty, or copy `bootstrap.CLAUDE.md` as a starting point)

---

## Installation

### Via Claude Code plugin (recommended)

Requires Claude Code v2.1 or later.

```
/plugin install genesis-governance
```

The plugin installs both `/genesis-governance` and `/genesis-sync`, plus the
`bootstrap.CLAUDE.md` template as an asset. No further setup required.

If your project doesn't have a `CLAUDE.md` yet, copy the bootstrap template
after install:

```bash
cp ~/.claude/plugins/*/genesis-governance*/skills/genesis-governance/assets/bootstrap.CLAUDE.md CLAUDE.md
```

### Manual install (legacy, pre-v3.0.0)

Older Claude Code versions can still clone this repo and copy the skills
directly into `.claude/skills/` — see the v2.1.0 branch for that layout.
New users should prefer the plugin flow above.

---

## Usage

Open Claude Code in your project directory and run:

```
/genesis-governance
```

The protocol runs in two sessions:

**Session 1 (~45-75 min):** Intake (5 layers) → Constitution → governance.config.yaml → CLAUDE.md → Document registry

**Session 2 (~45-60 min):** CI pipeline → First governance audit

You can stop after Session 1 and continue later — the checkpoint system resumes from where you left off.

### Resuming an interrupted session

If a session was interrupted:

```
/genesis-governance
```

Same command. The skill automatically reads `docs/intake/genesis-checkpoint.json` and resumes from the last completed phase.

### Quick mode

For prototypes or short-lived projects, answer "quick" when the skill asks. Produces a minimal CLAUDE.md and governance.config.yaml in ~15 minutes. The generated CLAUDE.md includes a 30-day expiry reminder to complete governance later.

### Drift detection (post-genesis)

After the initial genesis run, use `/genesis-sync` to detect divergence between the baseline recorded in `docs/intake/genesis-checkpoint.json` and the current project state:

```
/genesis-sync
```

Checks 8 dimensions: package drift, Dockerfile parity, env var drift, agent drift, constitution path, registry integrity, MUST NOT invariants in code, and checkpoint schema version. Reports findings by severity (HIGH/MEDIUM/LOW) and offers auto-fixes. Analogous to `terraform plan` — shows what changed since genesis.

---

## How it works

The protocol collects business context through 5 intake layers before writing a single file:

| Layer | What it collects |
|-------|-----------------|
| L1 | Business problem, sector, model, actors, scope |
| L2 | Actor profiles, critical path |
| L3 | System capabilities, structural flags (multitenancy, RBAC, AI outputs, etc.) |
| L4 | Risk profile across 8 dimensions — requires naming primary risk in your own words |
| L5 | Technical stack, constraints, external dependencies |

Everything written in Phases 2-7 is derived from this intake. The constitution's invariants come from L4 risks. The governance.config.yaml activates checks based on L3 flags. The CI pipeline derives from the config. No generic boilerplate.

### Safeguards and flow control

- **CRITICAL RULES** — 7 always-on rules enforced throughout (checkpoint-first, brownfield precedence, never-overwrite-without-backup, write-before-announce, Handler 11 resume allowlist, batch gate, MANDATORY READ GATE at phase transitions).
- **Brownfield detection** — invoking on a repo with existing governance artifacts auto-activates brownfield mode with impact announcement, backups before overwrites, and APPEND vs REPLACE options for existing CI.
- **Backtrack Protocol** — correct confirmed info at any time (Sub-case A during intake; Sub-case B once phases wrote docs, with option to regenerate only affected sections).
- **Handler system** — 11 handlers cover deviations: vague answers, rejected derivations, phase skips, conflicts, resume with lost checkpoint, help/manual/overview navigation.
- **Active state recap** — compact working-memory block after each phase so long sessions (20+ turns) stay anchored to earlier decisions.
- **Emergency exit** — hard gate that stops the session (not a warning) if the project isn't ready for formal governance, writing `[project].incomplete.md` with what to resolve first.

See the [user manual](docs/guides/runbook.genesis-governance.user-manual.md) for the full flow.

---

## Self-test

Verify the skill is correctly installed:

```bash
npm install      # or pnpm install / yarn
npm test         # runs scripts/test-genesis-governance.ts
```

Expected: `328/328 passed — All invariants PASS ✅`

Also run the integration smoke test:

```bash
npx tsx scripts/smoke-test-genesis.ts
```

Expected: `9/9 passed — All smoke tests PASS ✅`

---

## Compatibility

**Claude Code:** full support (native).

**Other tools (Cursor, Windsurf, Copilot):** partial or none. See [docs/compatibility.md](docs/compatibility.md).

---

## License

MIT
