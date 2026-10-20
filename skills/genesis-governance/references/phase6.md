## PHASE 6 — CI PIPELINE (Session 2)

> **NAVIGATION FOOTER REMINDER (every confirmation gate):**
> End every gate with: `📍 Phase [N]/7 — [one-liner]`
>   `◀ back to Phase [N-1] (documents may need updating)  ·  ok → Phase [N+1]`
> One-liners: P2=Constitution/rules | P3=Governance config | P4=CLAUDE.md | P5=Doc registry | P6=CI pipeline | P7=Post-install audit
> If `backtrack_origin` is active in session → also show: `skip → [origin]` (omit after reentry from checkpoint)

> **Recovery check (si venís de phase_in_progress):** Verificar si `.github/workflows/ci.yml` existe. Si existe → leer y verificar que tiene al menos un job con un step referenciando `constitution-checks` o `validate-doc-registry`. Si completo → anunciar "CI pipeline encontrado e íntegro — marcando Phase 6 como completa" → escribir `last_completed: "Phase6"`, `phase_in_progress: null` → saltar a Phase 7. Si incompleto → completar solo los jobs/steps faltantes.
>
> **[INTERNAL] Also check before proceeding to Phase 7:**
> - `docs/_registry/document-registry.md` updated with Phase 6 artifacts (ci.yml, operational templates) → if not, update now
> - If `has_infra_complexity = true` (from governance.config.yaml) and no `docs/ops/oncall-runbook.*.md` exists → generate now (using the on-call runbook template from this phase's Operational templates section)

> **Posición:** Phase 6 de 7 — CI Pipeline | Completadas: 2 (Constitution), 3 (governance.config.yaml), 4 (CLAUDE.md + Agents), 5 (Document Registry) | Pendientes: 7 (Post-Install Verification)

**Phase start — escribir phase_in_progress:** Actualizar `docs/intake/genesis-checkpoint.json` — cambiar `phase_in_progress` a `"Phase6"` (mantener todos los otros campos intactos). Esto permite recovery si el contexto se agota antes del checkpoint write final.

> **BROWNFIELD CHECK:** Si `genesis-checkpoint.json` tiene `"brownfield": true` → estás en modo brownfield. Cada write en esta fase es INSERT/APPEND únicamente — nunca overwrite sin backup previo. Ver sección "Brownfield safeguard" de esta fase.

> **Si `genesis-checkpoint.json` tiene `"brownfield": true`:**
> ⚠️ **MODO BROWNFIELD ACTIVO** — Esta fase opera en modo INSERT/APPEND únicamente. Nada se sobreescribe sin backup previo y confirmación explícita. Backups en `*.backup-YYYY-MM-DD`.

**Preconditions:**
- [ ] Phase 5 document registry approved and file exists on disk
- [ ] `governance.config.yaml` confirmed and on disk — it is the primary derivation input for this phase
- [ ] Developer has a GitHub repository (or equivalent CI target: GitLab, Bitbucket, etc.) — if not, note that the YAML is a template to be wired later
- [ ] All `hard_constraints` from governance.config.yaml read — each one maps to a CI enforcement step or a comment

**Brownfield safeguard — modo de integración CI (GEN17-F4):**
Si `.github/workflows/ci.yml` ya existe en disco (verificar con `Read`):
→ Crear backup: `Write: .github/workflows/ci.yml.backup-YYYY-MM-DD` con el contenido leído.
→ Verificar: `Read: .github/workflows/ci.yml.backup-YYYY-MM-DD` — si el archivo no existe o está vacío → STOP. Anunciar: "⚠️ Backup failed — cannot overwrite without confirmed backup. Aborting." No proceder.
→ Anunciar: "Backup creado: `.github/workflows/ci.yml.backup-[date]` — contenido original preservado."
→ **Brownfield — identificar jobs y preguntar modo de integración:**
  1. Leer el ci.yml original del backup y listar sus jobs:
     ```
     Tu ci.yml actual tiene estos jobs:
       • [job_name]: [descripción breve] — [CUSTOM / GOVERNANCE]
       • [job_name]: [descripción breve] — [CUSTOM / GOVERNANCE]
     (Los jobs CUSTOM no fueron generados por genesis — pueden tener steps de deploy, notificaciones, secrets específicos.)
     ```
     Clasificar como GOVERNANCE si el job contiene comentarios de genesis o steps de governance (validate-doc-registry, forbidden-imports, constitution-checks). Todo lo demás = CUSTOM.
  2. Preguntar al developer:
     ```
     ¿Cómo integramos el governance al CI?
     A) APPEND — agregar los steps de governance al ci.yml existente (preserva todos tus jobs actuales)
     B) REPLACE — generar un ci.yml nuevo completo desde cero (tu original está en el backup)
     ```
  3. Si A (APPEND) → agregar los jobs de governance derivados del intake al final del ci.yml existente. No modificar los jobs CUSTOM. Escribir el archivo resultante.
     > [INTERNAL] APPEND mode rule: NEVER add a new `on:` block. Only add `jobs:` entries to the existing workflow. If the existing ci.yml has its own `on:` triggers, those remain unchanged — governance jobs run under the same triggers.
     Si B (REPLACE) → proceder con la escritura normal del YAML completo derivado del intake.
Si el archivo no existe: escribir directamente sin preguntar.

Generate `.github/workflows/ci.yml` from `governance.config.yaml`.

**Step 1 — Derive preconditions BEFORE writing the YAML.**

Run through this derivation table using the confirmed governance.config.yaml. Each signal that is true adds a required CI component. Do not skip this step — an incomplete precondition table produces a CI that passes silently when it should fail.

### Precondition derivation table

| Signal | Required CI component |
|--------|-----------------------|
| `stack.database = PostgreSQL` OR `has_multitenancy = true` | `services.postgres` block + `DATABASE_URL` secret + migrations step before tests |
| `hard_constraints.C2_rls_multitenancy` present | Postgres service must have RLS extensions enabled; at least one test must verify tenant isolation |
| `stack.queues = BullMQ + Redis` OR `has_notifications = true` | `services.redis` block + `REDIS_URL` env var |
| `financial_flow = through-system` | Stripe test mode secret (`STRIPE_SECRET_KEY` test key) + `STRIPE_WEBHOOK_SECRET` test value |
| `has_rbac = true` | Test fixture setup for multiple roles; seed script or migration that creates test users per role |
| `ai_output_policies` has any entry with `mode != none` | External AI APIs (OpenAI, Replicate, etc.) MUST be mocked in CI — never real calls. Add to `env:` block: `AI_PROVIDER: mock` (or framework equivalent) + `OPENAI_API_KEY: sk-test-mock-not-real` (placeholder — never a real key). Add comment: `# AI APIs are mocked — real keys must NEVER appear in CI`. Adapt variable names to the actual AI provider used in the stack. |
| `integrations[]` contains API with `risk: C3` or rate-limit risk | That API MUST be stubbed/mocked in CI; add note in YAML comment |
| `has_notifications = true` with email | Email delivery must be mocked (no real sends); add `EMAIL_PROVIDER=mock` or equivalent |
| `has_ugc = true` | Storage service must be mocked or use a test bucket; add storage env vars |
| `structural_flags.has_public_api = true` | Smoke test step against a local server startup (not just unit tests) |
| `docs/_registry/document-registry.md` exists | `pnpm tsx scripts/validate-doc-registry.ts` step (hard-fail, no continue-on-error) |
| `methodology.name = SDD` | Forbidden imports check (boundary rules from architecture section of CLAUDE.md) — use grep-based enforcement by default: `if grep -rn "from '@package-a'" packages/package-b/src/ 2>/dev/null; then echo "FORBIDDEN IMPORT DETECTED"; exit 1; fi` — adapt package names from `boundary_rules` in `governance.config.yaml` |
| Any `hard_constraint` marked CRÍTICO | Add a comment in the YAML step that enforces it, citing the constraint ID |
| L5: frontend web or mobile in stack (React, Vue, Angular, Next.js, React Native, Flutter, Expo) | Accessibility check step: `npx axe-core-cli http://localhost:3000 --tags wcag2aa` — `continue-on-error: true` until baseline is established; add comment `# continue-on-error: remove once accessibility baseline is set` |

**[INTERNAL] Forbidden imports step — implementation guidance:**
Use grep-based enforcement by default (works without additional deps). Adapt the package names from `boundary_rules` in `governance.config.yaml`:
```bash
#!/bin/bash
# Check forbidden imports — adapt patterns from CLAUDE.md Architecture section
if grep -rn "from '@package-a'" packages/package-b/src/ 2>/dev/null; then
  echo "FORBIDDEN IMPORT DETECTED"
  exit 1
fi
```
For TypeScript monorepos: use the package scope names (e.g., `from '@myproject/scoring'`). For single-repo: use relative import patterns or module names. Generate one `grep` check per `boundary_rule` entry in `governance.config.yaml`.

**`continue-on-error` policy:** Only allowed on steps whose prerequisite (config file, script, lint setup) does not yet exist. Every step must have an explicit comment: `# continue-on-error: remove once [X] exists`. Steps that enforce governance invariants (RLS tests, forbidden imports, registry validation) MUST fail hard — no `continue-on-error` ever.

**Step 2 — Present the derived precondition list** to the developer before writing the YAML:

```
Before generating the CI YAML, I need to confirm the required infrastructure:

Services needed (derived from your governance profile):
  [list each service and why]

Secrets needed:
  [list each secret, which constraint requires it, and whether it's a test/mock value]

Steps that will be continue-on-error initially (and what removes that flag):
  [list each, with the prerequisite]

Tu pipeline tendrá aproximadamente [N] steps (derivado de: [lista de flags que agregan steps]).

Anything missing from this list?
```

Wait for confirmation before writing the YAML.

**Qué cuenta como aprobación:** respuesta afirmativa explícita ("ok", "listo", "adelante", "sí", "bien", "aprobado", o equivalente sin correcciones pendientes).
**Qué NO cuenta:** "ok pero [corrección]" (procesar corrección primero) · silencio (preguntar) · pregunta sobre el contenido (responder y volver al gate).

**[INTERNAL] Always include `on:` triggers in the generated CI YAML.**

Default triggers for greenfield (use unless L5 specifies a different branch strategy):
```yaml
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
```
For brownfield APPEND mode: do NOT add a new `on:` block — use the existing triggers from the ci.yml.

**Step 3 — Generate the YAML** using the confirmed precondition list.

The pipeline runs these steps in order (adapt package manager commands to your stack — shown as npm equivalents; substitute pnpm/yarn/bun/cargo/pip as needed):

1. Install dependencies with frozen lockfile (always — lockfile divergence = deploy failure)
   `npm ci` / `pnpm install --frozen-lockfile` / `yarn install --frozen-lockfile`
2. Security audit (always)
   `npm audit --audit-level=high` / `pnpm audit --audit-level=high`
3. Database migrations (if `services.postgres` required)
4. Build (hard-fail)
   `npm run build` / `pnpm build` / `cargo build --release`
5. Typecheck if TypeScript (`tsc --noEmit` — `continue-on-error` until tsconfig exists)
6. Lint (`continue-on-error` until lint config exists)
7. Tests (hard-fail)
   `npm test` / `pnpm -r test` / `pytest` / `cargo test`
8. Forbidden imports check (hard-fail — boundary enforcement from CLAUDE.md Architecture section)
9. Document registry validation (hard-fail once script exists; `continue-on-error` until then)
   `npx tsx scripts/validate-doc-registry.ts` or equivalent
10. Constitution enforcement checks (hard-fail; `continue-on-error` until script is customized)
    `npx tsx scripts/constitution-checks.ts`
11. Accessibility check (if frontend in stack — `continue-on-error: true` until baseline is set)
    `npx axe-core-cli http://localhost:3000 --tags wcag2aa`
12. Smoke test against local server (if `has_public_api = true`)

Show generated YAML. Wait for approval.

**Qué cuenta como aprobación:** respuesta afirmativa explícita ("ok", "listo", "adelante", "sí", "bien", "aprobado", o equivalente sin correcciones pendientes).
**Qué NO cuenta:** "ok pero [corrección]" (procesar corrección primero) · silencio (preguntar) · pregunta sobre el contenido (responder y volver al gate).

**Pre-gate checklist (verificar ANTES de mostrar el output):**
- [ ] Output derivado explícitamente de inputs confirmados en esta sesión (no inventado ni genérico)
- [ ] Todos los campos opcionales condicionales generados si el flag aplica (model card, DPIA, threat model, etc.)
- [ ] Sin secciones placeholder vacías — toda sección tiene contenido real o está marcada N/A con razón
- [ ] Acceptance criteria de esta fase cubiertos por el output generado

**Phase 6 — Acceptance criteria (verify before declaring Phase 6 complete):**
- [ ] Precondition derivation table was run — not skipped
- [ ] Derived precondition list was shown to developer and confirmed before writing YAML
- [ ] Every `services:` block derived from the table is present (postgres if has_multitenancy, redis if queues=BullMQ)
- [ ] Every required secret is declared in `env:` (database, payments if financial_flow=through-system, AI mocks if ai_outputs present)
- [ ] AI API keys are mock values — never real keys in CI env block (BIZ-1 / I-7)
- [ ] External integrations with rate-limit risk (Tokko, WhatsApp, etc.) are mocked or absent
- [ ] Migrations step present and runs BEFORE tests (if database service present)
- [ ] Forbidden imports check covers ALL boundary rules from CLAUDE.md Architecture section
- [ ] Every `continue-on-error: true` has a comment naming the prerequisite that removes it
- [ ] No governance invariant step (RLS tests, boundary check, registry validation) uses `continue-on-error`
- [ ] `validate-doc-registry.ts` step present (may be continue-on-error if script doesn't exist yet)
- [ ] Smoke test present if `has_public_api = true`
- [ ] Developer approved the YAML

**Phase 6 — Gobernanza: verificación automática**

Run antes de presentar al desarrollador:

1. `grep -c "name:" .github/workflows/ci.yml` → contar steps
2. `grep -q "constitution-checks" .github/workflows/ci.yml && echo "✅ constitution-checks" || echo "❌ constitution-checks ausente"`
3. `grep -q "validate-doc-registry\|registry-validation" .github/workflows/ci.yml && echo "✅ registry step" || echo "❌ registry step ausente"`
4. `grep -q "forbidden-imports\|forbidden_imports" .github/workflows/ci.yml && echo "✅ forbidden-imports" || echo "❌ forbidden-imports ausente"`
5. Si `has_ai_outputs=true`: `grep -q "AI_MODEL_VERSION\|ai.*mock\|openai.*mock" .github/workflows/ci.yml && echo "✅ AI mock en CI" || echo "❌ AI keys no mockeadas en CI"`
6. Si `has_multitenancy=true`: `grep -q "rls\|RLS\|tenant" .github/workflows/ci.yml && echo "✅ RLS tests referenciados" || echo "⚠️ RLS tests no referenciados en CI"`
7. Verificar que ningún governance step usa `continue-on-error` sin comentario: `grep -B2 "continue-on-error: true" .github/workflows/ci.yml | grep -v "#\|name:" | head -5`

Presentar tabla al desarrollador:
```
Phase 6 — Verificación CI
| Check                        | Resultado  |
|------------------------------|------------|
| constitution-checks step     | ✅/❌      |
| registry-validation step     | ✅/❌      |
| forbidden-imports step       | ✅/❌      |
| AI keys mockeadas [si aplica]| ✅/❌/N/A  |
| continue-on-error comentados | ✅/❌      |
| Total steps                  | N steps    |
```

**Phase 6 — Operational templates** (generate after CI YAML is approved, before checkpoint):

**[Post-mortem template]** — when `deployment.platform != none` (all projects with deployment)
Path: `docs/ops/post-mortem-template.md`
Sections: (1) incident summary: date, duration, user impact · (2) timeline of events · (3) root cause analysis (5 Whys) · (4) corrective actions with owner + target date · (5) lessons learned · (6) metrics: MTTR (Mean Time to Recover), MTTD (Mean Time to Detect)

**[On-call runbook]** — when `deployment.platform != none`
Path: `docs/ops/oncall-runbook.{project-slug}.md`
Sections: (1) on-call rotation: who + how to hand off · (2) first 15 minutes of any incident (step-by-step checklist) · (3) incident severity definitions P0/P1/P2/P3 tailored to this project's L4 risks (P0 = {critical_path.failure_consequence}, P1 = partial degradation, P2 = non-critical feature down, P3 = cosmetic/low-impact) · (4) escalation chain · (5) access checklist: logs, metrics, dashboards + how to reach each (derive tool names from L5 stack) · (6) per-type playbooks derived from L4 risk dimensions · (7) post-mortem trigger: all P0 and P1 automatically require one · (8) change management: database migrations, infra changes, and production config changes require explicit confirmation before executing

**Executable commands — derive from stack (not free-form text):** The first 15 minutes checklist (Section 2) MUST include literal, runnable commands derived from the project's stack and `governance.config.yaml`. Examples:
- Health endpoint: `curl -sf https://{deployment.url}{health.endpoint} && echo "OK" || echo "FAIL"`
- Recent logs (Node.js/Render): `render logs --app {project-slug} --tail 100`
- Recent logs (Docker): `docker logs --tail 100 {container-name}`
- Recent logs (GCP Cloud Run): `gcloud run services logs read {service} --limit=100`
- DB connection check (PostgreSQL): `psql $DATABASE_URL -c "SELECT 1;" 2>&1 | head -5`
- Cache connection check (Redis): `redis-cli -u $REDIS_URL PING`
- Restart service (Render): `render restart --service {project-slug}`
Do NOT write these as narrative paragraphs — write them as a numbered checklist with the actual command on each line, adapted to the confirmed `deployment.platform` and `stack.backend`.
**Important:** this is the reference document the `release-smoke-auditor` agent uses.

**[Release management checklist]** — when `deployment.platform != none`
Add as a section in CLAUDE.md `[PROJECT-SPECIFIC]`:
- Release process: branch → tag → changelog entry → smoke test → promote
- Hotfix process: branch from main → emergency fix → expedited review → promote
- Release freeze conditions (if applicable)
- Semantic versioning policy if `has_public_api = true`

**Paso obligatorio antes del checkpoint write (Phase 6):**

Para cada artifact generado en esta fase (ci.yml, post-mortem template, on-call runbook, release management checklist):

1. Actualizar `docs/_registry/document-registry.md` — agregar una fila por cada artifact generado.
   No omitir artifacts opcionales que sí fueron generados durante esta fase.

2. Correr verificación (usar el package manager del stack del proyecto — ver nota en Phase 5):
   `[package-manager] tsx scripts/validate-doc-registry.ts 2>&1 | grep -E "Errors|PASS"`
   → Esperado: Errors : 0

3. Solo si validate-doc-registry pasa sin errores → proceder al checkpoint write.
   Si hay errores → resolver antes de continuar. No bypasear con continue-on-error.

**Brownfield path — Phase 6 CI pipeline (cuando `brownfield: true` en checkpoint):**
1. Read `.github/workflows/ci.yml` existente.
2. Identificar jobs que ya existen (por campo `name:`).
3. Derivar jobs nuevos desde `governance.config.yaml` (solo los que NO están ya presentes).
4. Mostrar solo los jobs nuevos a agregar, con su posición en el YAML.
5. Gate: confirmar antes de agregar.
6. INSERT jobs nuevos en la sección correcta del YAML existente — NO reemplazar el archivo completo.

**Checkpoint write (Phase 6):** Write `docs/intake/genesis-checkpoint.json` with `last_completed: "Phase6"`. Si el proyecto es brownfield, incluir también `"ci_integration_mode": "append"` o `"ci_integration_mode": "replace"` según la elección del developer en el paso anterior (GEN18-F2). Si el proyecto es greenfield (sin ci.yml previo), incluir `"ci_integration_mode": "replace"`. Este campo es leído por `/genesis-sync` para determinar qué parte del ci.yml pertenece a governance y qué parte es CUSTOM del developer.

**[INTERNAL — MANDATORY READ GATE]:** Immediately after writing the checkpoint above, run: `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase7.md`. Do NOT present any Phase 7 content to the developer until this Read completes. This is required — not optional.

**[INTERNAL] Active state recap — output this block in your response after the checkpoint write:**

```
[ACTIVE STATE — Phase 6 complete]
project: [project_name] | brownfield: [true/false] | lang: [language]
actors: [actor names, comma-sep] | risks: [risk categories, comma-sep]
stack: [language]/[repo_structure]/[hosting]
ci_mode: [append | replace]
next: Phase 7 — First Governance Audit
```

---

