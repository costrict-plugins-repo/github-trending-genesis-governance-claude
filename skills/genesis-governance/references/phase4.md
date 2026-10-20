## PHASE 4 — CLAUDE.md

> **NAVIGATION FOOTER REMINDER (every confirmation gate):**
> End every gate with: `📍 Phase [N]/7 — [one-liner]`
>   `◀ back to Phase [N-1] (documents may need updating)  ·  ok → Phase [N+1]`
> One-liners: P2=Constitution/rules | P3=Governance config | P4=CLAUDE.md | P5=Doc registry | P6=CI pipeline | P7=Post-install audit
> If `backtrack_origin` is active in session → also show: `skip → [origin]` (omit after reentry from checkpoint)

> **Recovery check (si venís de phase_in_progress):** Verificar si `CLAUDE.md` existe. Si existe → leer y verificar que tiene al menos un `[FRAMEWORK]` y un `[PROJECT-SPECIFIC]` section. **Además, leer `docs/intake/genesis-checkpoint.json` — si `quick_mode: true`:**
> - Buscar el banner `"⚠️ Este es un CLAUDE.md de inicio rápido"` en el CLAUDE.md existente.
> - Si el banner está presente → es la versión minimal de quick mode. NO saltar. Anunciar: "CLAUDE.md de quick mode encontrado — generando la versión completa con todos los campos derivados del intake." Regenerar completo.
> - Si el banner NO está presente pero `quick_mode: true` → el CLAUDE.md ya fue completado en una sesión anterior. Verificar presencia de las 5 secciones [FRAMEWORK] mandatorias (Git & Deploy, Task Management, SDD, Model Routing, Agent Dispatch). Si las 5 están presentes → marcar Phase 4 como completa, proceder a Phase 4b agents. Si alguna falta → completar solo las secciones faltantes.
> [INTERNAL] **Brownfield precedence rule:** If `brownfield: true` in checkpoint → ALWAYS run the Brownfield safeguard (below) regardless of how many [FRAMEWORK] sections exist. The "5 FRAMEWORK sections → skip" rule applies ONLY to greenfield projects (`brownfield: false` or absent).

> **Si `quick_mode: false` o ausente:** verificar presencia de las 5 secciones [FRAMEWORK] mandatorias (Git & Deploy, Task Management, SDD, Model Routing, Agent Dispatch). Solo si todas 5 están presentes → anunciar "CLAUDE.md encontrado e íntegro — marcando Phase 4 como completa".

> **Posición:** Phase 4 de 7 — CLAUDE.md + Agents | Completadas: 2 (Constitution), 3 (governance.config.yaml) | Pendientes: 5 (Document Registry), 6 (CI Pipeline), 7 (Post-Install Verification)

**Phase start — escribir phase_in_progress:** Actualizar `docs/intake/genesis-checkpoint.json` — cambiar `phase_in_progress` a `"Phase4"` (mantener todos los otros campos intactos). Esto permite recovery si el contexto se agota antes del checkpoint write final.

> **BROWNFIELD CHECK:** Si `genesis-checkpoint.json` tiene `"brownfield": true` → estás en modo brownfield. Cada write en esta fase es INSERT/APPEND únicamente — nunca overwrite sin backup previo. Ver sección "Brownfield safeguard" de esta fase.

> **Si `genesis-checkpoint.json` tiene `"brownfield": true`:**
> ⚠️ **MODO BROWNFIELD ACTIVO** — Esta fase opera en modo INSERT/APPEND únicamente. Nada se sobreescribe sin backup previo y confirmación explícita. Backups en `*.backup-YYYY-MM-DD`.

**Preconditions:**
- [ ] Phase 3 `governance.config.yaml` written to disk and developer approved
- [ ] All `hard_constraints` in config have both `rule:` and `implementation:` — these map 1:1 to Domain Rules in CLAUDE.md
- [ ] `stack:` section confirmed — drives Agent Dispatch package paths and `.env keys` section
- [ ] `ai_output_policies` confirmed — maps to AI output policies table in CLAUDE.md

After `governance.config.yaml` is approved, generate the project's `CLAUDE.md`.

**Brownfield safeguard — antes de escribir este archivo:**
Si `CLAUDE.md` ya existe en disco (verificar con `Read`):
→ Crear backup: `Write: CLAUDE.md.backup-YYYY-MM-DD` con el contenido leído.
→ Verificar: `Read: CLAUDE.md.backup-YYYY-MM-DD` — si el archivo no existe o está vacío → STOP. Anunciar: "⚠️ Backup failed — cannot overwrite without confirmed backup. Aborting." No proceder.
→ Anunciar: "Backup creado: `CLAUDE.md.backup-[date]` — contenido original preservado."
→ **Brownfield — merge de secciones PROJECT-SPECIFIC (GEN17-F3):**
  1. Leer el CLAUDE.md original del backup.
  2. Extraer todas las secciones `## [PROJECT-SPECIFIC]` que contiene y presentarlas al developer:
     ```
     Tu CLAUDE.md actual tiene estas secciones PROJECT-SPECIFIC:
       • [nombre sección] — [N líneas]
       • [nombre sección] — [N líneas]
     El nuevo CLAUDE.md las reemplazará con versiones derivadas del intake.
     ¿Hay alguna sección que quieras preservar TAL CUAL en el nuevo archivo? (nombre/s o 'ninguna')
     ```
  3. Si el developer nombra secciones → copiarlas al final del nuevo CLAUDE.md generado, bajo el encabezado `## [PROJECT-SPECIFIC] [nombre] — Preservado del original`. No modificar su contenido.
  4. Si dice "ninguna" → proceder con la escritura normal sin merge.

**Brownfield Phase 4 — handling custom FRAMEWORK sections:**
After identifying PROJECT-SPECIFIC sections, check if any FRAMEWORK section has content that
significantly diverges from the standard template.

Detection criteria:
Count only lines with ≥10 words of content (not headings, not blank lines, not single-sentence bullet points).
If any FRAMEWORK section has ≥5 such lines → flag it as potentially custom.
Present the flagged sections to the developer with line count for confirmation — do not decide autonomously.

If yes:
  "I found these FRAMEWORK sections with substantial content (≥5 content lines of ≥10 words):
   • ## [Section name] — [N] content lines
   Do you want to preserve any of these as-is?
   A) Keep them (they will appear under a 'Preserved framework customizations' heading)
   B) Replace with genesis standard (original backed up in CLAUDE.md.backup-YYYY-MM-DD)"

If no FRAMEWORK sections have ≥5 content lines of ≥10 words: proceed without asking.

**[INTERNAL] Gate before replacing any flagged FRAMEWORK section:**
For each [FRAMEWORK] section flagged as potentially custom (≥5 content lines):
1. Show the diff: existing content vs standard template content
2. Ask: "Section `[FRAMEWORK] {section-name}` has custom content. Replace with standard version? (yes / no — keep custom)"
3. If yes → replace with standard content from the Standard Content Reference below
4. If no → preserve existing content exactly as-is — do NOT mark as incomplete or warn
Gate each section separately. Do NOT batch these confirmations into a single question.

Si el archivo no existe: escribir directamente.

**File:** `CLAUDE.md` (root of project) — replaces `bootstrap.CLAUDE.md`

**Structure:**

```markdown
## Project Overview
[From constitution §1 — what the project is, stack, key patterns]

## [FRAMEWORK] Git & Deploy Rules — DO NOT MODIFY
[standard framework git rules]

## [FRAMEWORK] Task Management
[standard framework task rules]

## [FRAMEWORK] Methodology: Spec-Driven Development (SDD)
[standard SDD stages]

## [FRAMEWORK] Model Routing
[Standard Opus/Sonnet/Haiku table]

## [FRAMEWORK] Agent Dispatch
[Standard dispatch rules with project-specific package paths]

## [PROJECT-SPECIFIC] Domain Rules
[From constitution §4 invariants + optional sections]

## [PROJECT-SPECIFIC] Architecture
[Package structure from governance.config.yaml]

## [PROJECT-SPECIFIC] Git Strategy
[Branching approach: trunk-based (simple projects, no formal releases) or GitFlow (projects with release cadence) — derived from deployment.platform and project complexity · Branch naming convention (e.g., feat/, fix/, chore/) · Merge policy (squash for feature branches, merge commit for releases) · Branch protection recommendation (require PR review, require CI green)]

## [PROJECT-SPECIFIC] Observability
[Only if deployment.platform != local: structured log format (JSON required fields: timestamp, level, service, traceId) · Metrics to expose + alert thresholds (reference SLO/SLI doc if generated) · Instrumentation approach derived from L5 stack]

## [PROJECT-SPECIFIC] .env keys
[From Layer 5 — known environment variables]

## [PROJECT-SPECIFIC] Governance Cadence
[Quarterly checklist — review at the start of each quarter or after any major scope change]
- [ ] SLOs still reflect the current state of the product (check docs/ops/slo-sli.{project}.md)
- [ ] Secret rotation executed according to schedule in governance.config.yaml `checks.secret_rotation`
- [ ] Dependency audit: `{package-manager} audit --audit-level=high`
- [ ] License check: verify new dependencies have compatible licenses
- [ ] Forbidden imports check still passes: `{boundary-check-command}`
- [ ] Constitution reviewed: are §4 invariants still correct given current product scope?
[Add: if has_ai_outputs=true] - [ ] Model card updated if underlying model changed
[Add: if has_ai_outputs=true] - [ ] Anti-lookahead guarantees still hold for latest training window
[Add: if compliance_risk≥MEDIUM] - [ ] DPIA reviewed for any new personal data processing added this quarter
```

Sections marked `[FRAMEWORK]` are identical across all projects. Sections marked `[PROJECT-SPECIFIC]` are unique to this project.

---

## [FRAMEWORK] Standard Content Reference — use verbatim for FRAMEWORK sections

> [INTERNAL] When generating CLAUDE.md FRAMEWORK sections: use the Standard Content Reference as the base. Copy the content literally — EXCEPT replace any `[From constitution §N — ...]` placeholders with actual content derived from the corresponding section of the constitution generated in Phase 2. All other text in FRAMEWORK sections must remain word-for-word as in the reference (no paraphrasing, no additions, no omissions).

### Standard: Git & Deploy Rules
```
[FRAMEWORK] Git & Deploy Rules — DO NOT MODIFY
- NEVER commit without explicit user instruction. List changed files → wait for instruction.
- NEVER push without explicit user instruction. Push deploys to production automatically.
- Each action (commit, push) is a separate step requiring its own confirmation.
- Never skip hooks (--no-verify) or force-push to main/master unless user explicitly requests.
```

### Standard: Task Management
```
[FRAMEWORK] Task Management — DO NOT MODIFY
- Feature or UX improvement requested → create task with TaskCreate BEFORE implementing.
- Mark task completed with TaskUpdate immediately when done.
- Every task must have metadata.tier (opus/sonnet/haiku) and metadata.agent.
- Skip task creation only for trivial one-line bug fixes with no UX impact.
```

### Standard: Model Routing
```
[FRAMEWORK] Model Routing — DO NOT MODIFY
| Tier   | Model                    | When                                                                                   |
|--------|--------------------------|----------------------------------------------------------------------------------------|
| Opus   | claude-opus-4-6          | Architecture, spec conflicts, complex debugging, design decisions (Stage 0-2)          |
| Sonnet | claude-sonnet-4-6        | Implementation, tests, moderate logic (Stage 3-4)                                      |
| Haiku  | claude-haiku-4-5-20251001| Configs, deps, CI YAML, git commits (100% explicit instructions)                       |
```

### Standard: SDD (Spec-Driven Development)
```
[FRAMEWORK] Methodology: SDD — DO NOT MODIFY
Stage 0 — Intake: classify (spec change / impl / test / refactor / bug)
Stage 1 — Spec alignment: governing specs, invariants, affected versions
Stage 2 — Design: approach, module, outputs, acceptance checks. NO code until Stage 2 approved.
Stage 3 — Implementation
Stage 4 — Verification: tests, determinism, no forbidden deps
Stage 5 — Delivery: files, tests, versions, fixtures
```

### Standard: Agent Dispatch
```
[FRAMEWORK] Agent Dispatch — DO NOT MODIFY (update package paths for this project)
| Situation | Required action |
|-----------|----------------|
| Edit in `{packages.frontend}/` | `frontend-engineer` agent |
| Edit in `{packages.backend}/` or `server/` | `backend-engineer` agent |
| Commits, docs, CI YAML, configs | `git-ops` agent |
| Architecture, spec conflicts, complex debugging | `architect` agent |
Two or more independent tasks → launch in parallel (single message with multiple tool calls).
Anti-pattern: ❌ Main instance does work that belongs to an agent.
```
> Replace `{packages.frontend}` and `{packages.backend}` with the actual package paths from L5 stack architecture.

---

Wait for approval before continuing.

**Qué cuenta como aprobación:** respuesta afirmativa explícita ("done", "go ahead", "yes", "good", "approved", "listo" (any affirmative), o equivalente sin correcciones pendientes).
**Qué NO cuenta:** "ok pero [corrección]" (procesar corrección primero) · silencio (preguntar) · pregunta sobre el contenido (responder y volver al gate).

**Pre-gate checklist (verificar ANTES de mostrar el output):**
- [ ] Output derivado explícitamente de inputs confirmados en esta sesión (no inventado ni genérico)
- [ ] Todos los campos opcionales condicionales generados si el flag aplica (model card, DPIA, threat model, etc.)
- [ ] Sin secciones placeholder vacías — toda sección tiene contenido real o está marcada N/A con razón
- [ ] Acceptance criteria de esta fase cubiertos por el output generado

**Phase 4 — Acceptance criteria (verify before declaring Session 1 complete):**
- [ ] A Claude Code instance with no prior context could operate the project reading only this file
- [ ] `[FRAMEWORK]` sections present: Git & Deploy, Task Management, SDD methodology, Model Routing, Agent Dispatch
- [ ] `[PROJECT-SPECIFIC]` sections present: Domain Rules, Architecture, .env keys
- [ ] Every hard constraint from `governance.config.yaml` has a corresponding rule in Domain Rules — marked as CRÍTICO if security/data-isolation related
- [ ] Model routing table present (Opus/Sonnet/Haiku with when-to-use criteria)
- [ ] Git discipline explicit: commit and push require separate explicit instructions
- [ ] Task closure protocol present (build ✅ + tests ✅ + agent declaration)
- [ ] Delivery checklist present (build command + test command before "done")
- [ ] All AI output policies visible as quick-reference table with mode per output type
- [ ] Package boundary rules explicit (what package can import what — forbidden imports named)
- [ ] `.env` keys section present with all variables from Layer 5 `external_deps[]`
- [ ] If project has multiple timezones or locale-sensitive data: timezone handling documented with correct/incorrect code example
- [ ] Artifact naming convention documented
- [ ] Developer approved the CLAUDE.md

**Phase 4 — Gobernanza: verificación automática**

Run in parallel:

1. `grep -q "Git & Deploy\|Git.*Deploy" CLAUDE.md && echo "✅ Git & Deploy" || echo "❌ falta Git & Deploy"`
2. `grep -q "Gestión de Tareas\|Task Management" CLAUDE.md && echo "✅ Task Management" || echo "❌ falta Task Management"`
3. `grep -q "Spec-Driven Development\|SDD" CLAUDE.md && echo "✅ SDD" || echo "❌ falta SDD methodology"`
4. `grep -q "Model Routing" CLAUDE.md && echo "✅ Model Routing" || echo "❌ falta Model Routing"`
5. `grep -q "Agent Dispatch" CLAUDE.md && echo "✅ Agent Dispatch" || echo "❌ falta Agent Dispatch"`
6. `grep -q "\.env\|env keys\|environment" CLAUDE.md && echo "✅ .env keys" || echo "❌ falta .env section"`
7. `grep -q "forbidden\|boundary\|NEVER import" CLAUDE.md && echo "✅ boundary rules" || echo "❌ falta boundary rules"`

Presentar tabla al desarrollador:
```
Phase 4 — Verificación CLAUDE.md
| Sección [FRAMEWORK]     | Resultado |
|-------------------------|-----------|
| Git & Deploy            | ✅/❌     |
| Task Management         | ✅/❌     |
| SDD methodology         | ✅/❌     |
| Model Routing           | ✅/❌     |
| Agent Dispatch          | ✅/❌     |
| .env keys               | ✅/❌     |
| Boundary rules          | ✅/❌     |
```

### Phase 4 — Additional generated files

**PR template** (always) — `.github/pull_request_template.md`

Content:
```markdown
## Type of change
- [ ] Feature  - [ ] Bug fix  - [ ] Refactor  - [ ] Docs  - [ ] Infra

## Summary
[What and why — not how]

## Key files changed
[3-5 most important]

## How to test
[Steps for reviewer to verify the change works]

## Pre-merge checklist
- [ ] Build passes
- [ ] Tests pass
- [ ] Relevant docs updated
[add project-specific items derived from §7 Definition of Done in the constitution]
```

**ADR template** (always) — `docs/adr/adr-000-template.md`

Content: `# ADR-NNN — [Title]` | Date | Status: proposed / accepted / deprecated / superseded | Context + problem | Options considered (min 3) | Decision taken + rationale | Consequences (positive + negative) | Discarded alternatives

Add to CLAUDE.md `[FRAMEWORK]` sections: "For every non-obvious architectural decision, create `docs/adr/adr-NNN-{slug}.md`. An architectural decision is non-obvious if a competent engineer would not immediately choose it without explanation."

Register ADR template in document registry at Phase 5.

**Phase 4 additional files — acceptance criteria:**
- [ ] `.github/pull_request_template.md` created with Type, Summary, Key files, How to test, Pre-merge checklist
- [ ] Pre-merge checklist includes at least the project-specific items from constitution §7 Definition of Done
- [ ] `docs/adr/adr-000-template.md` created with all required sections
- [ ] ADR directive present in CLAUDE.md
- [ ] Developer approved both files

---

### Phase 4b — AGENT DEFINITIONS

> **Posición:** Phase 4b de 7 — Agent Definitions | Capa 1: 6 agentes universales | Capa 2: N condicionales (según activación) | Capa 3: 0-3 domain-specific

Immediately after CLAUDE.md is approved, generate `.claude/agents/` files for this project.

**These files define which specialized agents Claude Code will invoke for different types of work.** A project without agent definitions relies on the main instance for everything — no specialization, no model routing, no scope enforcement.

#### Step 1 — Determine agent set

Read from the intake checkpoint:
- `structural_flags` (L3): `qa_rigor`, `has_public_api`, `has_performance_sla`, `has_ai_outputs`, `has_infra_complexity`
- `business_risks` (L4): `security_risk`, `compliance_risk` severity
- `tech_stack` (L5): database, mobile, deployment platform

**Activation table:**

| Signal | Agent |
|--------|-------|
| Always — Capa 1 | architect, backend-engineer, frontend-engineer, git-ops, governance-auditor, spec-writer |
| L3: `qa_rigor = HIGH` | test-engineer |
| L5: stack includes DB (postgres, mysql, mongo, redis, sqlite, supabase, dynamo) | database-engineer |
| L3: `has_infra_complexity = true` OR L5: docker/k8s/terraform/cloud infra | devops-engineer |
| L4: `security_risk >= MEDIUM` | security-reviewer |
| L3: `has_public_api = true` | api-contract-reviewer |
| L3: `has_performance_sla = true` | performance-reviewer |
| L4: `compliance_risk >= MEDIUM` OR sector in [fintech, health, legal, insurance, gov] | compliance-reviewer |
| L5: mobile in stack (React Native, Flutter, iOS, Android, Expo) | mobile-qa-reviewer |
| L3: `ai_outputs ≠ "none"` | ai-output-reviewer |
| L3: `qa_rigor >= MEDIUM` | qa-verification-gate |
| L5: has production deployment (Render, Vercel, Railway, AWS, GCP, Azure) | release-smoke-auditor |
| L5: frontend web or mobile in stack (React, Vue, Angular, Next.js, React Native, Flutter, Expo) | accessibility-reviewer |

**Pre-anuncio de agentes (mostrar al desarrollador y esperar confirmación antes de escribir):**
```
Agentes a generar (derivados de tu perfil):
| Capa | Nombre | Activado por |
|------|--------|--------------|
| 1    | architect | universal |
| 1    | backend-engineer | universal |
| 1    | frontend-engineer | universal |
| 1    | git-ops | universal |
| 1    | governance-auditor | universal |
| 1    | spec-writer | universal |
[Capa 2 y 3: agregar solo los activados según tabla de activación]

¿Procedo a generar estos N agentes?
```
Esperar confirmación antes de escribir los archivos.

#### Step 2 — Write agent files

**Idempotency rule:** Before writing each `.claude/agents/{name}.md`, check if the file already exists with the `Read` tool. If it exists and its content is structurally correct (has frontmatter with `name:`, `description:`, `model:` and a non-empty body), skip the write and log: "⏭ {name}.md — already correct, skipped." Only write if the file is missing or its frontmatter is incomplete. This makes re-running Phase 4b safe after interruptions.

Si el archivo ya existe → anunciar: "⚠️ .claude/agents/[nombre].md ya existe ([N] líneas) — saltando (modo brownfield/idempotency)."

**[INTERNAL] After checking all agents: present a single summary table to the developer showing the status of every agent — do NOT announce each individually:**
```
| Agent                  | Status              |
|------------------------|---------------------|
| architect              | ✅ Written          |
| backend-engineer       | ⏭️ Skipped (exists) |
| ...                    | ...                 |
```
One table, one message. Skipped agents are shown in the table — not announced one by one.

**Brownfield safeguard — overwrite path:**
Si el archivo existe pero su frontmatter está incompleto o incorrecto:
→ Crear backup: `Write: .claude/agents/{name}.md.backup-YYYY-MM-DD` con el contenido leído.
→ Verificar: `Read: .claude/agents/{name}.md.backup-YYYY-MM-DD` — si el archivo no existe o está vacío → STOP. Anunciar: "⚠️ Backup failed — cannot overwrite without confirmed backup. Aborting." No proceder.
→ Anunciar: "Backup creado: `.claude/agents/{name}.md.backup-[date]` — contenido original preservado."
→ Proceder con la escritura corregida.

For each selected agent, `Write: .claude/agents/{name}.md`. Replace all `{placeholders}` with values from the intake before writing.

**Key placeholders:**
- `{project}` — L1 project name
- `{packages.frontend}` — L5 frontend source path (e.g., `src/app`, `packages/web/src`)
- `{packages.backend}` — L5 backend paths (e.g., `src/`, `packages/api`)
- `{stack.frontend}` — L5 frontend framework (e.g., "React/Vite", "Next.js")
- `{stack.backend}` — L5 backend framework (e.g., "Node.js/Fastify", "Python/FastAPI")
- `{stack.db}` — L5 database (e.g., "PostgreSQL", "MongoDB")
- `{deployment.platform}` — L5 deployment target (e.g., "Render", "Vercel", "AWS ECS")
- `{risk.primary}` — L4 primary risk named by developer in their own words
- `{compliance.standard}` — derived from L1 sector + L4 (e.g., "GDPR", "SOC2", "HIPAA", "PCI")
- `{health.endpoint}` — from L5 or governance.config.yaml (e.g., "/health", "/api/status")

**Capa 1 — Universal agents (always write all 6):**

For each agent, generate a file with: frontmatter (name, description with examples, model) + body (scope, what agent does/doesn't do, key constraints, delivery checklist).

| Agent | Model | Scope | Key constraints |
|-------|-------|-------|----------------|
| `architect` | claude-opus-4-6 | Reads all; writes only `memory/plans/` and `docs/specs/` | Never writes code. Never runs build/test. Stage 0-2 design only. Produces plan before any implementation. |
| `backend-engineer` | claude-sonnet-4-6 | `{packages.backend}` + server entry points | Cannot touch `{packages.frontend}`, `.env`, CI YAML, package.json. Build + tests must pass before done. |
| `frontend-engineer` | claude-sonnet-4-6 | `{packages.frontend}` | Cannot touch backend packages. Mobile-first. Touch targets ≥ 44px. No backend/scoring logic in frontend. |
| `git-ops` | claude-haiku-4-5-20251001 | `.env`, `package.json`, docs files, CI YAML, git commits | Never push without explicit instruction. Never commit without explicit instruction. Zero ambiguity required for every action. |
| `governance-auditor` | claude-sonnet-4-6 | All files (read-only for audit) + build/test runner | Checks: build health, test health, spec coverage, document registry, constitution present, git status. Saves audit to `docs/governance/governance-audit-[date].md`. Waits for confirmation before fixing. |
| `spec-writer` | claude-sonnet-4-6 | `docs/specs/`, `docs/core/` | Every spec must have: frontmatter (artifact_id, status, version), §1 Purpose, §2 Scope, §3 Invariants (MUST/MUST NOT), §4 Acceptance criteria. Must add entry to document registry after writing. |

**Capa 2 — Optional agents (write only if activated per Step 1):**

| Agent | Model | Activation | Scope | Key constraints |
|-------|-------|-----------|-------|----------------|
| `test-engineer` | claude-sonnet-4-6 | qa_rigor=HIGH | `test/`, `*.test.*`, `*.spec.*` | Maps tests to acceptance criteria IDs. Never updates expected outputs to make a test pass — classify diff first (bug / intentional+versioned / fixture defect). |
| `database-engineer` | claude-sonnet-4-6 | DB in stack | Migration files, ORM models, schema files | Never DROP without user confirmation. Every schema change needs a migration. Verify backward compat. |
| `devops-engineer` | claude-sonnet-4-6 | infra complexity OR cloud in stack | Dockerfile, docker-compose, CI/CD pipelines, IaC files | No `terraform apply` / `kubectl apply` without explicit user confirmation. Changes to infra require smoke test post-apply. |
| `security-reviewer` | claude-sonnet-4-6 | security_risk≥MEDIUM | All files (read-only for review) | Emits formal verdict PASS/FAIL/WARN with CWE references. Checks OWASP top 10, injection, auth flows, secrets exposure. FAIL blocks merge. |
| `api-contract-reviewer` | claude-sonnet-4-6 | has_public_api=true | API schema files, route definitions, OpenAPI/GraphQL schemas | Detects breaking changes (removed fields, changed types, auth changes). Requires version bump for any breaking change. Blocks merge on breaking change without bump. |
| `performance-reviewer` | claude-sonnet-4-6 | has_performance_sla=true | All files (read-only) | Compares against SLA defined in L3. Reports N+1, missing indexes, bundle size regressions, unnecessary re-renders. |
| `compliance-reviewer` | claude-sonnet-4-6 | compliance_risk≥MEDIUM OR regulated sector | All files (read-only) | Checks `{compliance.standard}` requirements: data retention, consent flows, audit trails, encryption at rest/transit. Emits PASS/FAIL with section references. |
| `mobile-qa-reviewer` | claude-sonnet-4-6 | mobile in stack | `{packages.frontend}`, mobile source dirs | Touch targets ≥ 44px, no horizontal overflow, landscape/portrait behavior, iOS Safari compat, Android WebView quirks. |
| `ai-output-reviewer` | claude-sonnet-4-6 | has_ai_outputs=true | All files (read-only) | Verifies AI outputs are: auditable, deterministic with same inputs+version, don't expose model internals to frontend, have null/NOT_ELIGIBLE fallback. |
| `qa-verification-gate` | claude-sonnet-4-6 | qa_rigor≥MEDIUM | All files (read-only) | Gate before merge. Requires Verification Package (acceptance criteria, tests, regression statement). Emits APPROVED / NEEDS_WORK / BLOCKED. Never approves without evidence. |
| `release-smoke-auditor` | claude-sonnet-4-6 | production deployment | Read-only + smoke test runner | Post-merge pre-prod. Verifies: health endpoint `{health.endpoint}`, smoke flows, rollback readiness. Does NOT auto-promote. Requires all checks green before authorizing. |
| `accessibility-reviewer` | claude-sonnet-4-6 | frontend web/mobile in stack | `{packages.frontend}` | Verifies WCAG 2.1 AA: color contrast ≥4.5:1 (normal text) / ≥3:1 (large text), interactive elements have aria-label or visible text, images have alt text, keyboard nav (focus order + visible), touch targets ≥44px, heading hierarchy (h1→h2→h3), form labels associated. Emits PASS/WARN/FAIL with WCAG criterion reference (e.g., "FAIL WCAG 1.4.3 — contrast 2.8:1"). Reviews PRs — does NOT generate code. |

#### Step 3 — Generate domain agents (Capa 3)

After writing Capa 1 and Capa 2 agents, determine if domain-specific agents are warranted.

**Criterion:** a subsystem is in the critical path (L2) AND has specialized domain logic not covered by backend-engineer + frontend-engineer alone.

**Limit: maximum 3 domain agents.** If more than 3 subsystems qualify, prioritize by critical path position.

For each domain agent, write `.claude/agents/{domain-slug}-engineer.md` with:
- `name`: kebab-case derived from subsystem (e.g., `payment-engineer`, `booking-engine`, `valuation-engine`)
- `model`: claude-sonnet-4-6
- `description`: "Use this agent when implementing or modifying [{subsystem from L2}] in {project}. Scope: [{specific paths}]. NOT for: [{what other agents handle}]."
- Body: scope, domain invariants from constitution §4 that apply here, delivery checklist

**Examples by sector:**
- Fintech (transactions → reconciliation → reporting): `transaction-engineer`
- E-commerce (catalog → cart → checkout → fulfillment): `checkout-engineer`, `catalog-engineer`
- SaaS B2B (tenant setup → billing → usage): `billing-engineer`
- Healthtech (intake → clinical logic → records): `clinical-logic-engineer`
- PropTech (search → valuation → contracts): `valuation-engineer`

If no subsystem in L2 qualifies (project is simple or well-covered by Capa 1+2), skip Capa 3. Note: "No domain agents needed — Capa 1+2 covers all subsystems."

**Pre-gate checklist (verificar ANTES de mostrar el output):**
- [ ] Output derivado explícitamente de inputs confirmados en esta sesión (no inventado ni genérico)
- [ ] Todos los campos opcionales condicionales generados si el flag aplica (model card, DPIA, threat model, etc.)
- [ ] Sin secciones placeholder vacías — toda sección tiene contenido real o está marcada N/A con razón
- [ ] Acceptance criteria de esta fase cubiertos por el output generado

**Phase 4b — Acceptance criteria:**
- [ ] `.claude/agents/` directory created with all 6 Capa 1 agents (minimum)
- [ ] All activated Capa 2 agents are written (per activation table)
- [ ] 0-3 Capa 3 domain agents written or explicitly skipped
- [ ] All `{placeholders}` resolved — no file contains unresolved `{snake_case}` patterns
- [ ] Each file has: name, description (with at least 1 example), model in frontmatter + scope + constraints in body
- [ ] Developer confirmed the agent list matches their project
- [ ] Note: agent files are NOT added to document registry — they are operational config, not documentary artifacts

**Phase 4b — Gobernanza: verificación automática**

Run antes de anunciar al desarrollador:

1. `ls .claude/agents/*.md | wc -l` → esperado ≥ 6 (Capa 1 mínimo)
2. `grep -rh "{[a-z_-]*}" .claude/agents/ 2>/dev/null | grep -v "^---\|^name:\|^description:" | grep "{" | head -5` → esperado 0 líneas (placeholders sin resolver)
3. `grep -rL "^model:" .claude/agents/ 2>/dev/null` → agentes sin model en frontmatter (esperado: vacío)
4. Si `has_ai_outputs=true`: `ls .claude/agents/ai-output-reviewer.md 2>/dev/null && echo "✅" || echo "❌ ai-output-reviewer ausente"`
5. Si `security_risk >= MEDIUM`: `ls .claude/agents/security-reviewer.md 2>/dev/null && echo "✅" || echo "❌ security-reviewer ausente"`

Presentar tabla al desarrollador:
```
Phase 4b — Verificación Agentes
| Check                              | Resultado      |
|------------------------------------|----------------|
| Agentes Capa 1 (≥6)               | ✅/❌ N creados |
| Placeholders sin resolver          | ✅ 0 / ❌ N    |
| Todos con model: en frontmatter    | ✅/❌          |
| ai-output-reviewer [si aplica]     | ✅/❌/N/A      |
| security-reviewer [si aplica]      | ✅/❌/N/A      |
```

After writing all agent files, announce:

```
✅ Agentes generados para {project}:

  Capa 1 (universales):
    architect · backend-engineer · frontend-engineer · git-ops · governance-auditor · spec-writer

  Capa 2 (activados por tu stack/riesgos):
    [lista de agentes de Capa 2 generados, o "ninguno" si no aplica]

  Capa 3 (dominio del negocio):
    [lista de agentes de dominio generados, o "ninguno" si no aplica]

Cómo funcionan:
- Claude Code los invoca automáticamente según el tipo de tarea.
- El main instance decide CUÁNDO invocar cada agente (reglas en CLAUDE.md § Agent Dispatch).
- Cada archivo en .claude/agents/ define QUÉ puede hacer ese agente y QUÉ no.

Para agregar un agente nuevo:
1. Creá .claude/agents/{nombre}.md usando cualquier archivo existente como plantilla.
2. Agregá la regla de routing en CLAUDE.md § Agent Dispatch.
3. No es necesario registrarlo en document-registry.md (son config operacional, no artifacts documentales).

Para entender el modelo completo de agentes → ver docs/agents.md en este repositorio.
```

**Brownfield path — Phase 4 (cuando `brownfield: true` en checkpoint):**
1. Read `CLAUDE.md` existente.
2. Identificar secciones `[FRAMEWORK]` del template que NO están presentes como headings en el documento actual.
3. Proponer SOLO las secciones faltantes (no regenerar secciones que ya existen).
4. Para cada sección faltante: identificar posición semántica correcta en el documento existente.
5. Gate: mostrar cada sección propuesta con su posición de inserción, pedir s/n/editar.
6. INSERT cada sección aprobada en su posición semántica — NO APPEND al final.

**Brownfield path — Phase 4b agents (cuando `brownfield: true` en checkpoint):**
Para cada agente en `agents_generated[]`:
  - Si el archivo NO existe → generarlo normalmente (greenfield path).
  - Si el archivo existe:
    - Read agente existente.
    - Comparar scope, model, descripción y anti-patrones vs template derivado del intake.
    - Si idéntico → skip (idempotency rule existente: "⏭ {name}.md — already correct, skipped").
    - Si hay diferencias → mostrar diff de secciones, gate: "¿Actualizar estas secciones? (s/n)"
    - Solo sobrescribir tras confirmación explícita del developer.

**Checkpoint write (Phase 4):** Write `docs/intake/genesis-checkpoint.json` with:
```json
{
  "project_name": "[name]",
  "last_completed": "Phase4",
  "phase_in_progress": null,
  "timestamp": "[ISO date]",
  "quick_mode": false,
  "agents_generated": ["architect", "backend-engineer", "frontend-engineer", "git-ops", "governance-auditor", "spec-writer"]
}
```
(add any Capa 2 and Capa 3 agents to the `agents_generated` array)

**[INTERNAL — MANDATORY READ GATE]:** Immediately after writing the checkpoint above, run: `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase5.md`. Do NOT present any Phase 5 content to the developer until this Read completes. This is required — not optional. If the Read returns empty or fails → STOP. Do NOT generate any Phase 5 content. Announce: "⚠️ Cannot load phase file `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase5.md`. Verify the file exists and retry /genesis-governance."

**[INTERNAL] Active state recap — output this block in your response after the checkpoint write:**

```
[ACTIVE STATE — Phase 4 complete]
project: [project_name] | brownfield: [true/false] | lang: [language]
actors: [actor names, comma-sep] | risks: [risk categories, comma-sep]
stack: [language]/[repo_structure]/[hosting]
agents: [agents_generated list, comma-sep]
next: Phase 5 — Document Registry
```

---

