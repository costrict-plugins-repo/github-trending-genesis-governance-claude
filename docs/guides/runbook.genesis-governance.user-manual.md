---
artifact_id: runbook.genesis-governance.user-manual
artifact_class: runbook
title: /genesis-governance — User Manual
class: runbook
status: active
version: 2.0
created: 2026-03-30
updated: 2026-04-17
---

# /genesis-governance — User Manual

A practical guide for using the `/genesis-governance` skill on a Claude Code
project. This document is for **humans**, not for the model.

---

## What this skill does

Sets up a complete governance framework for your Claude Code project in two
sessions:

- **Constitution** — principles and invariants.
- **governance.config.yaml** — check/threshold configuration.
- **CLAUDE.md** — operating instructions for Claude.
- **Document registry** — inventory of governed artifacts.
- **CI pipeline** — automated verification on every push.
- **First governance audit** — confirms everything is wired correctly.
- **6–17 specialized agents** — tailored to your project's actual context.

Every artifact is **derived from a 5-layer business intake**, never from a
generic template.

---

## When to use it

- New project that will actively use Claude Code.
- Existing project that never had formal governance (brownfield mode).
- **Not** for already-governed projects that only need targeted updates —
  use `/genesis-sync` instead.

---

## Installation

Requires Claude Code v2.1 or later.

```
/plugin install genesis-governance
```

The plugin installs two skills: `/genesis-governance` (this one) and
`/genesis-sync` (drift detector). No manual file copy required.

If your project has no `CLAUDE.md` yet, copy the bootstrap template after
install:

```bash
cp ~/.claude/plugins/*/genesis-governance*/skills/genesis-governance/assets/bootstrap.CLAUDE.md CLAUDE.md
```

---

## Invocation

```
/genesis-governance
```

That's it. The skill takes control from there.

---

## The flow at a glance

Two blocks, seven phases, two sessions.

| Phase | What happens | Primary artifact |
|-------|--------------|------------------|
| Intake L1–L5 | Guided conversation about the project | `intake.[project].layers-1-5.md` |
| Phase 2 | Constitution | `docs/core/spec.[project].core.constitution.md` |
| Phase 3 | governance.config.yaml | `governance.config.yaml` |
| Phase 4 | CLAUDE.md + agents | `CLAUDE.md` + `.claude/agents/*.md` |
| Phase 5 | Document registry | `docs/_registry/document-registry.md` |
| *(Session break)* | *Optional pause — resume via checkpoint* | |
| Phase 6 | CI pipeline | `.github/workflows/ci.yml` |
| Phase 7 | First governance audit (inline) | `docs/governance/governance-audit-[date].md` |

**Typical duration:** Session 1 around 45–75 min (depending on brownfield
complexity); Session 2 around 45–60 min.

---

## Block 1 — Intake (L1–L5)

The model asks questions. You answer. No code is written yet.

### L1 — Business context

Foundational questions:

- Project name.
- Problem being solved, who has it, how it's solved today, why that's not enough.
- Sector and industry.
- Business model (B2C, B2B, marketplace, internal tool, …).
- Actors (who uses, who pays, who administers).
- Geographic scope.

> **Note:** Technical stack is **not** asked at L1 — that comes in L5. L1 is
> pure business context.

The model won't proceed unless it can extract the concrete problem, current
solution, and business consequence. If any are missing, it asks specifically
for what's missing.

**Checkpoint written:** `last_completed: "L1"` (allows resume if
interrupted).

### L2 — Actors and critical path

The model derives actor profiles from L1 and presents them for
confirmation:

- Roles and responsibilities.
- Who pays, uses, administers.
- The **critical path**: the sequence of actions that must never fail for
  the project to deliver value.

You confirm or correct the derivation — you don't answer from scratch.

### L3 — Capabilities and structural flags

Identifies system capabilities and sets flags that condition everything
downstream:

- `has_public_api`
- `has_multitenancy`
- `has_rbac`
- `has_notifications`
- `has_ugc`
- `ai_outputs` — enumerated: `none` / `content_generation` /
  `ranking_or_recommendation` / `automated_decision` / `agent_action`

These flags determine which sections appear in the Constitution, which
checks `governance.config.yaml` activates, and which steps the CI runs.

> **Quick mode:** For prototypes or short-lived MVPs, the model may branch
> into a compact path that generates only a minimal CLAUDE.md +
> governance.config.yaml. The CLAUDE.md includes a 30-day expiry banner as
> a reminder to complete governance later. Quick mode is a context-driven
> fork, not a fixed step in L3.

### L4 — Risk profile

The model evaluates 8 risk dimensions (availability, api-quota,
algorithmic output, financial precision, privacy, regulatory, auth/access,
multitenancy) and presents the ones that apply with severity and a
concrete consequence.

The model asks you to confirm the risk matrix, **then name the primary
risk in your own words**. It does NOT accept a bare "yes" — this is an
anti-ritual gate.

> **Why:** A project that cannot name its primary risk is not ready for
> formal governance. This gate prevents the skill from producing empty
> documents.

### L5 — Technical stack

The model derives a stack proposal from L1–L4 and presents it as default:

- Primary language.
- Repository structure (monorepo / single / multi).
- Hosting.
- External dependencies (third-party APIs, critical services).
- Fixed constraints.

You confirm, correct, or add constraints. On approval, the skill writes
`docs/intake/intake.[project].layers-1-5.md` — the intake source of truth.

**G35 closure summary:** Before closing L5, the model shows a compact
confirmation summary (language / structure / hosting / external deps in
one sentence) to catch stack misunderstandings before they poison every
downstream document.

**Checkpoint written:** `last_completed: "L5"` (covers L4 + L5).

---

## Block 2 — Implementation phases

The model writes real files. You can review each artifact before it
continues.

### Phase 2 — Constitution

Produces `docs/core/spec.[project].core.constitution.md`.

Content derived from the intake: principles, key invariants, operating
rules. The model asks you to confirm the most critical invariants before
closing the phase.

### Phase 3 — governance.config.yaml

Produces `governance.config.yaml` at the project root.

Defines: checks to run in each audit, thresholds (e.g. max MEMORY.md
size), active hooks, artifact versions.

### Phase 4 — CLAUDE.md + agents

Two parts:

**4a — CLAUDE.md:** Creates or replaces `CLAUDE.md`. The operational file
— naming conventions, task management, agent routing, dev commands, git
rules.

**4b — Agent generation:** Generates `.claude/agents/*.md` files based on
the intake. Three tiers:

- **Tier 1 — Universal (always):** `architect`, `backend-engineer`,
  `frontend-engineer`, `git-ops`, `governance-auditor`, `spec-writer`.
- **Tier 2 — Conditional:** activated by L3/L4/L5 signals (e.g.
  `security-reviewer` if security risk ≥ MEDIUM; `database-engineer` if a
  DB is in the stack; `ai-output-reviewer` if `ai_outputs ≠ "none"`).
- **Tier 3 — Domain:** 1–3 agents generated ad-hoc from the critical path
  in L2 (e.g. `payment-engineer` for fintech, `booking-engine` for
  e-commerce).

On close, the skill announces which agents were created and how to use
them. Agents are **not** registered in the document registry — they are
operational configuration, not documentation artifacts.

> For the full agent model (why three tiers, customization, sector
> examples) see `docs/agents.md`.

### Phase 5 — Document registry

Produces `docs/_registry/document-registry.md` — inventory of all
artifacts created in previous phases. From this point on, every new
artifact must register here.

---

> **⚡ Session break** — at the end of Phase 5 the skill announces:
>
> *"Session 1 complete. You have functional governance: constitution,
> governance.config.yaml, CLAUDE.md, document registry. CI pipeline and
> first audit remain. Continue to Session 2 now, or later?"*
>
> If you pause, commit the files. Next invocation resumes from Phase 6
> via the checkpoint.

---

### Phase 6 — CI pipeline

Produces `.github/workflows/ci.yml` (or the equivalent for your CI).

Checks on every push: tests, build, typecheck, forbidden imports,
document registry integrity. If the project has no CI configured, the
skill proposes a minimal structure.

### Phase 7 — First governance audit

Runs an **inline audit** of everything created so far — no external skill,
no `/governance` dependency. Phase 7 is self-contained.

Verdict at the end:

- **CONFORME** — all checks pass; session ends cleanly.
- **PARCIALMENTE_CONFORME** — minor findings recorded; skill offers to
  fix them in place.
- **NO_CONFORME** — blocking findings; must be resolved before the session
  can close.

Findings surface get fixed inline. The session only ends cleanly on
CONFORME.

---

## CRITICAL RULES (applied throughout)

The skill enforces 7 always-on rules visible at the top of its
instructions:

1. **Checkpoint first** — `docs/intake/genesis-checkpoint.json` is read
   before any question.
2. **Brownfield precedence** — if `governance.config.yaml` exists, it wins
   over disk-inferred values (Sub-case A).
3. **Never overwrite without backup** — Read → write backup → read back to
   verify → proceed. If any step fails, abort and announce.
4. **Write intake before announcing** — no "document ready" announcements
   until the file is on disk.
5. **Handler 11 resume allowlist** — resume only valid from
   `{L5, Phase2, Phase3, Phase4, Phase5, Phase6, Phase7}`. Values `L1–L4`
   are invalid → the skill asks to complete intake first.
6. **Batch gate for ≥4 brownfield changes** — present ALL proposed changes
   before applying any. Partial approval falls back to one-by-one for the
   full set.
7. **MANDATORY READ GATE at phase transitions** — after each phase
   checkpoint write, the skill must read the next phase file before
   generating any content for that phase. If the Read fails or returns
   empty, the skill stops and announces the failure.

These rules are enforced across the full session, not just at the point
of first reading.

---

## Active state recap

After each phase write, the skill emits a compact working-memory block:

```
[ACTIVE STATE — Phase N complete]
project: [name] | brownfield: [true/false] | lang: [language]
actors: [list] | risks: [list]
stack: [lang]/[repo_structure]/[hosting]
next: Phase [N+1]
```

This serves as a semantic anchor in the chat history. In long sessions
(20+ turns), the model re-reads it to verify it hasn't drifted from
decisions made earlier.

---

## Handler system

The skill supports 11 handlers that manage deviations from the main flow.

| Handler | Trigger | Behavior |
|---------|---------|----------|
| H1 | Vague or incomplete answer in L1 | Records the gap; asks specifically for missing data |
| H2 | More than 3 undefined fields after emergency-exit warning | Triggers emergency exit (see below) |
| H3 | Derivation rejected multiple times | Asks you to provide values directly; stops re-deriving |
| H4 | Generated document rejected | Backs out and re-runs the relevant phase's derivation |
| H5 | Developer wants to skip a phase | Warns about downstream cascade; proceeds if confirmed (marks phase as NON-COMPLIANT in audit) |
| H6 | Generated docs conflict with later phase | Goes back to earliest conflicting doc; fixes there — no downstream patches |
| H7 | Developer pastes existing CLAUDE.md as answer to L1 | Detects the paste; treats it as brownfield signal; re-asks L1 in business-context terms |
| H8 | Skill invoked twice without checkpoint from first run | Asks whether the first run was abandoned; offers to restart or resume from where indicated |
| H9 | Developer wants to correct info from an already-confirmed layer | Activates **Backtrack Protocol** (see below) |
| H10 | Developer sends `?`, `help`, `manual`, or `overview` | Navigation help (see next section) |
| H11 | Developer wants to regenerate CLAUDE.md only | Restricted flow: re-runs Phase 4a only, preserves everything else |

---

## Backtrack Protocol (Handler 9)

You can correct confirmed information at any time. Say: *"actually at
L2..."*, *"I made a mistake when I said..."*, *"I need to change
[field]"*.

- **Sub-case A — during intake, no docs written yet.** Low cost. The skill
  identifies affected downstream fields, shows a delta, and asks you to
  re-confirm only what changed.
- **Sub-case B — during phases, docs already exist.** Docs may be
  inconsistent. The skill lists exactly which docs and sections are
  affected, then offers two options:
  - **A) Edit directly** — you manually fix the doc.
  - **B) Regenerate affected sections** — the skill regenerates only what
    is dirty.

You can backtrack to any earlier layer. If you're in L4 and need to fix
L2, the skill rewinds, applies the change, shows the L3 delta for
re-confirm, and resumes from where you were.

---

## Navigation

At the close of each layer and the start of each phase, the skill shows a
navigation footer:

```
📍 Layer 2/5 — Who uses the system and what's the sequence that must never break (~5 min)
   ◀ back to L1  ·  ok → L3
```

At any time, send:

| Command | Effect |
|---------|--------|
| `?` or `help` | Expanded description of the current position (what it covers, what it produces, why it matters, estimated time) |
| `manual` | Show this manual's section for the current position |
| `overview` | Full flow map with your current position marked `▶` |

The `overview` layout:

```
Genesis Governance — Full flow overview

Intake:
  [completed] L1 — What the project is, who it's for, and why it matters
  ▶ [current]  L2 — Who uses the system and what's the sequence that must never break
  [ ] L3 — ...
  ...
```

These commands work mid-question — the skill answers, then tells you how
to resume (typically `ok`).

---

## Brownfield mode

Invoking `/genesis-governance` in a repo that already has artifacts
(CLAUDE.md, constitution, CI, etc.) triggers brownfield mode
automatically.

### Sub-case A — governance.config.yaml present

If `governance.config.yaml` is found upfront (U9 detection), it becomes
the **primary source** for stack and configuration. Disk commands
(inspect `package.json`, `Dockerfile`, `.github/workflows`) run **only for
validation** — they never override config.yaml values.

### Sub-case B — no config, artifacts on disk

If no `governance.config.yaml` exists but other governance artifacts are
found, the skill infers stack and context from disk and treats those as
the primary source.

### Existing CI

In Phase 6, the skill classifies existing jobs as **CUSTOM** (your
project's own) or **GOVERNANCE** (genesis checks). Then offers:

- **APPEND** — add GOVERNANCE jobs, preserve CUSTOM. Original backed up.
- **REPLACE** — generate a fresh CI. Original backed up with date.

### Existing governance, no checkpoint

If `CLAUDE.md` (mature) + `*.constitution.md` + `governance.config.yaml`
all exist but `genesis-checkpoint.json` is missing, the skill infers the
project was previously governed and the checkpoint was lost. Two options:

- **Reconstruct checkpoint** — infer `project_name`, `stack`, and other
  fields from the existing artifacts; write a checkpoint with
  `last_completed: "Phase7"`. Nothing is regenerated. You can then run
  `/genesis-sync` to check drift.
- **Continue as brownfield** — run the full flow, using the existing
  artifacts as brownfield inputs.

### Batch gate

For ≥4 proposed changes in brownfield, the skill presents all changes at
once before applying any. Partial approval (e.g. "only #1 and #3") falls
back to one-by-one for the full set.

### Impact announcement

Before starting the brownfield flow, the skill announces exactly what
will happen to each existing file (back up, replace, preserve, merge) so
you know the blast radius up front.

---

## Emergency exit

If at any point during intake the project isn't ready for governance
(unclear business, scope shifting, missing critical info), the skill
triggers the **emergency exit**:

- Writes `docs/intake/[project].incomplete.md` with context up to that
  point.
- Stops the session with clear instructions on what to resolve before
  retrying.

This is a **hard gate**, not a warning. The skill does not continue.

---

## Resuming an interrupted session

Just invoke `/genesis-governance` again. The skill:

1. Reads `docs/intake/genesis-checkpoint.json`.
2. Announces: *"Found checkpoint for [project] — resuming from [phase]"*.
3. If Phase 4+ is complete, lists agents already on disk
   (`ls .claude/agents/`).
4. Jumps to the next phase.

No re-intake, no redundant questions. If the checkpoint references an
invalid state (Handler 11 allowlist violation), the skill explains the
issue and offers to restart from L1 or advance to L5 by completing the
intake.

---

## Drift detection post-genesis — `/genesis-sync`

After genesis completes, use `/genesis-sync` to detect divergence between
the baseline recorded in `genesis-checkpoint.json` and the current
project state.

```
/genesis-sync
```

Analogous to `terraform plan`. Checks 8 dimensions:

| ID | Dimension |
|----|-----------|
| D-SYNC-1 | Package drift (`package.json` vs baseline) |
| D-SYNC-2 | Dockerfile parity |
| D-SYNC-3 | Environment variable drift |
| D-SYNC-4 | Agent drift (`.claude/agents/`) |
| D-SYNC-5 | Constitution path |
| D-SYNC-6 | Registry integrity |
| D-SYNC-7 | MUST NOT invariants present in code (grep-based) |
| D-SYNC-8 | Checkpoint schema version |

Findings are reported by severity (HIGH / MEDIUM / LOW) with auto-fixes
offered where safe.

`genesis-sync` is part of the same plugin as `genesis-governance` — always
available when `genesis-governance` is installed. No separate install.

---

## Upgrading from quick mode to full mode

If the skill selected quick mode (prototype, short MVP) and produced only
a minimal CLAUDE.md + governance.config.yaml, you can activate the full
flow at any time:

```
/genesis-governance full
```

Resumes from the last checkpoint and runs the remaining phases
(constitution, registry, CI, audit). The existing checkpoint is preserved
and extended — no work is lost.

---

## Artifacts produced (full mode)

| File | Description |
|------|-------------|
| `docs/intake/genesis-checkpoint.json` | Internal progress state |
| `docs/intake/intake.[project].layers-1-5.md` | Intake source of truth |
| `docs/intake/[project]-l4-closing-summary.md` | Identified risks |
| `docs/core/spec.[project].core.constitution.md` | Principles and rules |
| `governance.config.yaml` | Checks and thresholds |
| `CLAUDE.md` | Operational instructions |
| `.claude/agents/*.md` | Specialized agents (6–17 files depending on project) |
| `docs/_registry/document-registry.md` | Inventory of governed artifacts |
| `.github/workflows/ci.yml` | CI pipeline |
| `docs/governance/governance-audit-[date].md` | First audit result |

---

## Quick reference

```
# Start or resume (same command for both)
/genesis-governance

# Upgrade quick mode to full
/genesis-governance full

# Check drift after genesis
/genesis-sync

# Verify plugin install (for maintainers)
npm install
npm test                               # expects 328/328 passed
npx tsx scripts/smoke-test-genesis.ts  # expects 9/9 passed
```

---

## Maintainer reference

Relevant paths inside this plugin:

| Path | Purpose |
|------|---------|
| `skills/genesis-governance/SKILL.md` | Entry point — intake L1–L5 + dispatcher + CRITICAL RULES |
| `skills/genesis-governance/references/phase{2..7}.md` | Phase-specific instructions (lazy-loaded via MANDATORY READ GATE) |
| `skills/genesis-governance/references/docs-conventions.md` | Phase router / document conventions |
| `skills/genesis-governance/assets/bootstrap.CLAUDE.md` | CLAUDE.md template for new projects |
| `skills/genesis-sync/SKILL.md` | Drift detector (8 dimensions) |
| `scripts/test-genesis-governance.ts` | Static test suite — 328 invariants |
| `scripts/smoke-test-genesis.ts` | Smoke tests — 9 I-GAP scenarios |
| `scripts/test-genesis-integration.ts` | Behavioral tests — 15 LLM scenarios (INT-01..15) |
| `docs/plans/` | Generation history (Gen1–Gen32) and improvement plans |
| `docs/audits/` | Validation audits (plugin validate, conformance checks) |
