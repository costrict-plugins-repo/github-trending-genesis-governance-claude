# CLAUDE.md (Bootstrap)

This is a **temporary** bootstrap configuration for running the governance genesis protocol.
It will be replaced by the generated `CLAUDE.md` at the end of Session 1.

---

## Git & Deploy Rules — DO NOT MODIFY

- **NEVER `git commit` without explicit user instruction.**
- **NEVER `git push` without explicit user instruction.**
- These are two separate steps, each requiring its own confirmation.
- When a task is done: list modified files → wait for instruction. Do not commit independently.

---

## Getting Started

Run `/genesis-governance` to set up the governance framework for this project.

The genesis protocol runs in two sessions:

**Session 1 (~45 min):** Constitution → governance.config.yaml → CLAUDE.md → Document registry
**Session 2 (~60 min):** CI pipeline → First governance audit

Session 1 produces a functional governance framework. Session 2 makes it fully operational.
You can stop after Session 1 and continue later.

---

## What genesis-governance will do

1. Ask you 4 discovery questions about your project (answer freely, no format required)
2. Derive a risk profile and show you its reasoning — you correct what's wrong
3. Generate a project constitution tailored to your risk profile
4. Generate `governance.config.yaml` from the constitution
5. Replace this file with a complete `CLAUDE.md`

Each step waits for your approval before continuing.
Nothing is committed automatically.

---

*Remove this file after `/genesis-governance` Session 1 is complete.*
