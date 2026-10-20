## PHASE 2 — CONSTITUTION

> **BROWNFIELD CHECK:** If `brownfield: true` in checkpoint → the constitution file may already exist on disk.
> Before writing: (1) verify existence of `docs/core/*.constitution.md`, (2) create backup if found, (3) announce backup to developer.
> Full brownfield path for Phase 2 is specified in the "Brownfield branch" section below.

> **NAVIGATION FOOTER REMINDER (every confirmation gate):**
> End every gate with: `📍 Phase [N]/7 — [one-liner]`
>   `◀ back to Phase [N-1] (documents may need updating)  ·  ok → Phase [N+1]`
> One-liners: P2=Constitution/rules | P3=Governance config | P4=CLAUDE.md | P5=Doc registry | P6=CI pipeline | P7=Post-install audit
> If `backtrack_origin` is active in session → also show: `skip → [origin]` (omit after reentry from checkpoint)

> **Recovery check (si venís de phase_in_progress):** Verificar si `docs/core/spec.{slug}.core.constitution.md` existe. Si existe → leer y verificar que tiene §1 Propósito, §2 Esto NO es, §3 Risk Profile, §4 System Invariants, §5+ secciones. Si todas presentes → verificar además que §4 System Invariants tiene al menos 3 líneas de contenido (no solo el header). Si §4 tiene solo el header o 1-2 líneas → marcar como incompleta → completar desde §4. Solo si todas presentes Y §4 tiene contenido suficiente → anunciar "Constitución encontrada e íntegra — marcando Phase 2 como completa" → escribir `last_completed: "Phase2"`, `phase_in_progress: null` → saltar a Phase 3. Si incompleta → completar solo esas secciones faltantes.
>
> **[INTERNAL] Before proceeding: verify conditional artifacts were generated:**
> - If `has_ai_outputs != "none"` and no `docs/ai/model-card.[slug].md` exists → generate it now before proceeding to Phase 3
> - If `compliance_risk >= MEDIUM` and no `docs/compliance/dpia.[slug].md` exists → generate it now before proceeding to Phase 3
> - If `security_risk >= MEDIUM` and no `docs/security/threat-model.[slug].md` exists → generate it now before proceeding to Phase 3

> **Posición:** Phase 2 de 7 — Constitution | Completadas: — (primera fase) | Pendientes: 3 (governance.config.yaml), 4 (CLAUDE.md + Agents), 5 (Document Registry), 6 (CI Pipeline), 7 (Post-Install Verification)

**Phase start — escribir phase_in_progress:** Actualizar `docs/intake/genesis-checkpoint.json` — cambiar `phase_in_progress` a `"Phase2"` (mantener todos los otros campos intactos). Esto permite recovery si el contexto se agota antes del checkpoint write final.

> **[INTERNAL] synthesis_accepted check:** If `synthesis_accepted: false` in checkpoint → when presenting sections derived from L1-L5 intake (invariants, risk profile, actors), do NOT paraphrase or re-interpret. Use the developer's original wording verbatim. Do NOT synthesize, reframe, or add inferred context. If a field was left ambiguous in the intake, ask the developer directly rather than inferring.

**Preconditions:**
- [ ] Layer 5 confirmed: `tech_stack` with language, repo_structure, hosting, external_deps[]
- [ ] L4 closing summary confirmed by developer (governance plan approved at Layer 4 close)
- [ ] All 8 governance risk dimensions evaluated — active dimensions identified with severity
- [ ] `has_financial_flow`, `has_multitenancy`, `has_rbac`, `ai_outputs` status confirmed (drive which §sections appear)

After derivation is approved, generate the project constitution.

**Pre-anuncio (mostrar al desarrollador antes de generar):**
```
Tu constitución incluirá:
  §1–§7 (obligatorios) — purpose, scope, non-negotiable constraints, tech stack, architecture, DoD, governance
  [Si data-privacy or regulatory risk: §8 — Data Governance]
  [Si api-quota risk: §9 — External API Governance]
  [Si has_ai_outputs in ["human-reviewed", "autonomous"]: §10 — Algorithmic Output Governance]
  [Si financial-accuracy risk: §11 — Financial and Commerce Governance]
  [Omitir secciones que no aplican con "N/A para este proyecto"]
```

**Brownfield safeguard — antes de escribir este archivo:**
Si `docs/core/spec.{project-slug}.core.constitution.md` ya existe en disco (verificar con `Read`):
→ Crear backup: `Write: docs/core/spec.{project-slug}.core.constitution.md.backup-YYYY-MM-DD` con el contenido leído.
→ Verificar: `Read: docs/core/spec.{project-slug}.core.constitution.md.backup-YYYY-MM-DD` — si el archivo no existe o está vacío → STOP. Anunciar: "⚠️ Backup failed — cannot overwrite without confirmed backup. Aborting." No proceder.
→ Anunciar: "Backup creado: `docs/core/spec.{project-slug}.core.constitution.md.backup-[date]` — contenido original preservado."
→ Proceder con la escritura normal.
Si el archivo no existe: escribir directamente.

**File:** `docs/core/spec.{project-slug}.core.constitution.md`

**Frontmatter required:**
```yaml
artifact_id: SPEC-{PROJECT}-CORE-CONSTITUTION
title: "{Project Name} — Project Constitution"
artifact_class: spec
status: active
version: 1.0.0
project: {project-slug}
domain: core
slug: constitution
```

**Mandatory sections (always present):**

### §1 — Project Purpose
Derived from: `pain_point`, `current_solution`, `value_prop`. One paragraph of substance.

### §2 — This Project Is NOT
Exception: ask one guided question rather than generating from fields.
Generate 3-4 plausible assumptions about the project from `industry.segment` + `business_model` + `actors[]` and ask the question in `preferred_language`.
> [INTERNAL] Ask the following question in preferred_language (translate if needed):
> - EN: "Which of these is explicitly out of scope for this project?"
> - ES: "¿Cuál de estas está explícitamente fuera del alcance de este proyecto?" <!-- ES reference -->
> Example: if preferred_language = "es" → use the Spanish version above. If "en" → use the English version. If neither → translate the English version.
The developer's exclusions become this section's content.

### §3 — Risk Profile
Derived from L4 closing summary. Written as formal statements.
Example: "The primary risk is data correctness: actors make decisions based on system-shown information. Stale or incorrect data leads to [specific consequence]."

### §4 — System Invariants
4-8 invariants. One per confirmed risk dimension from L4 closing summary.
- Phrased as: "The system MUST/MUST NOT [behavior] under [conditions]"
- Each invariant's breach should require an architectural change (otherwise it's a preference)
- `critical_path.failure_consequence` feeds the availability invariant if applicable

### §5 — Architecture Principles
3-6 principles derived from Layer 5 constraints + Layer 3 structural flags.

### §6 — Authority and Conflict Resolution
Standard hierarchy. Example:
```
1. This constitution
2. Domain glossary and invariants
3. Module boundary specifications
4. API contracts
5. Supporting documentation
```

### §7 — Definition of Done
Derived from: `qa_rigor` (L3) + risk profile (L4). Define the minimum criteria for a change to be "done" in this project.
- Always: build passes · tests pass · relevant docs updated
- If `qa_rigor >= MEDIUM`: code coverage meets threshold
- If `security_risk >= MEDIUM`: "Changes touching authentication, authorization, or data access require security-reviewer sign-off before merge"
- If `compliance_risk >= MEDIUM`: "Changes touching personal data flows, consent, or data retention require compliance-reviewer sign-off before merge"
- If `has_multitenancy = true`: "Changes to multi-tenant queries require RLS isolation test passing before merge"
- If `has_ai_outputs != "none"`: "Anti-lookahead guarantee must be verified before any prediction/recommendation model goes to production"
- If `has_financial_flow = true`: "Audit trail reconciliation test required for all changes to financial transaction flows"
- If `qa_rigor = HIGH`: "Test coverage must not drop below 80% (statements) or 70% (branches) on merge"
- If `has_performance_sla = true`: no regression vs SLO baseline
- If frontend in stack: mobile-first verified (touch targets ≥ 44px, no horizontal overflow)
- If `has_ai_outputs != "none"`: anti-lookahead guarantee verified for affected outputs
Phrase it as: "A change is DONE when all of the following are true: [list tailored to this project]."

**Optional sections (add based on risk derivation):**
- §8 — Data Governance (if `data-privacy` or `regulatory` risk)
- §9 — External API Governance (if `api-quota` risk)
- §10 — Algorithmic Output Governance (if `algorithmic-output` risk)
- §11 — Financial and Commerce Governance (if `financial-accuracy` risk)

**Antes de aprobar, verificar especialmente:**
  ✓ §1 Project Purpose — ¿el nombre del proyecto y el problem statement son correctos?
  ✓ §4 System Invariants — ¿las reglas que no pueden violarse reflejan lo que describiste?
  ✓ §6 Authority and Conflict Resolution — ¿la jerarquía de documentos es la esperada?

Si algo no es correcto: indicar "corregir §N — [descripción del cambio]"
Solo si todo está correcto: responder "aprobado" o equivalente.

After generating, say: "Revisá cada sección. Prestá especial atención a §4 Invariants — estas son las reglas que el framework de gobernanza va a hacer cumplir. Corregí cualquier cosa que no refleje tu proyecto real.

Antes de continuar a governance.config.yaml: **¿Cuál es el invariant más importante de §4 para este proyecto?** Nombralo con tus propias palabras."
> [INTERNAL] Ask the closing question in preferred_language (translate if needed): "What is the most important invariant from §4 for this project? Name it in your own words."

Wait for the developer to name a §4 invariant in their own words. If they just say "ok" or "bien" without naming one, ask once more: "What would be the most critical invariant for you — the rule that if violated breaks the project?" Only proceed to Phase 3 once they've named one. This confirms they read §4 and it reflects their project.

**Qué cuenta como aprobación:** el desarrollador nombra un invariant específico del proyecto (no genérico).
**Qué NO cuenta:** "ok" sin nombrar invariant · respuesta genérica ("el de seguridad") sin especificar · silencio.

**Phase 2 constitution gate — acceptance criteria:**
Accepts: any phrase that names (a) what must NEVER happen AND (b) in the context of this project.
Examples that pass:
  - "operator A must never see operator B's tenants" [what + who]
  - "commissions must be calculated before the payout runs, not after" [what + when]
  - "an AI recommendation must never reach a user without a human review step" [what + safeguard]
Examples that fail (too generic):
  - "data isolation" [no project context]
  - "the most important invariant" [tautology]
  - "ok" [no content]

**Rejection response template:**
  "Can you be a bit more specific? I'm looking for something like:
   '[what must NEVER happen] in [context or scenario in this project]'."

**Pre-gate checklist (verificar ANTES de mostrar el output):**
- [ ] Output derivado explícitamente de inputs confirmados en esta sesión (no inventado ni genérico)
- [ ] Todos los campos opcionales condicionales generados si el flag aplica (model card, DPIA, threat model, etc.)
- [ ] Sin secciones placeholder vacías — toda sección tiene contenido real o está marcada N/A con razón
- [ ] Acceptance criteria de esta fase cubiertos por el output generado

**Phase 2 — Acceptance criteria (verify before generating governance.config.yaml):**
- [ ] §1 Project Purpose — written from `pain_point` + `current_solution` + `value_prop` (not generic)
- [ ] §2 This Project Is NOT — contains explicit exclusions confirmed by developer (not inferred)
- [ ] §3 Risk Profile — references the specific risks from Layer 4 with project-specific consequence
- [ ] §4 System Invariants — 4–8 invariants; each phrased as "MUST/MUST NOT [behavior] under [conditions]"
- [ ] §4 — every invariant's breach would require an architectural change (not just a preference)
- [ ] §4 — availability invariant references `critical_path.failure_consequence` if applicable
- [ ] §5 Architecture Principles — derived from Layer 5 constraints + Layer 3 structural flags
- [ ] §6 Authority — document hierarchy defined
- [ ] Optional sections present only for activated risks (§8 if data-privacy/regulatory, §9 if api-quota, §10 if algorithmic-output, §11 if financial-accuracy)
- [ ] No implementation details in any section (describes what the system must be, not how to build it)
- [ ] Frontmatter complete: `artifact_id`, `title`, `artifact_class`, `status: active`, `version: 1.0.0`
- [ ] Developer approved each section explicitly

**Phase 2 — Gobernanza: verificación automática (ejecutar antes de mostrar al desarrollador)**

Run in parallel — corregir cualquier ❌ antes de pedir confirmación:

1. `grep -c "^## §" docs/core/spec.{project-slug}.core.constitution.md` → esperado ≥ 6
2. `grep -c "MUST\|MUST NOT" docs/core/spec.{project-slug}.core.constitution.md` → esperado ≥ 4
3. `grep -q "artifact_id\|status: active\|version: 1.0.0" docs/core/spec.{project-slug}.core.constitution.md && echo "✅ frontmatter" || echo "❌ frontmatter incompleto"`
4. `grep -q "Definition of Done" docs/core/spec.{project-slug}.core.constitution.md && echo "✅ DoD" || echo "❌ Definition of Done ausente"`
5. Si `has_ai_outputs != "none"`: `ls docs/ai/model-card.*.md 2>/dev/null && echo "✅ model card" || echo "❌ model card ausente — generarlo ahora"`
6. Si `compliance_risk >= MEDIUM` + personal data: `ls docs/compliance/dpia.*.md 2>/dev/null && echo "✅ DPIA" || echo "❌ DPIA ausente — generarlo ahora"`
7. Si `security_risk >= MEDIUM`: `ls docs/security/threat-model.*.md 2>/dev/null && echo "✅ threat model" || echo "❌ threat model ausente — generarlo ahora"`

Presentar tabla al desarrollador:
```
Phase 2 — Verificación
| Check                          | Resultado |
|--------------------------------|-----------|
| Secciones constitution (≥6)    | ✅/❌ N   |
| Invariants MUST/MUST NOT (≥4)  | ✅/❌ N   |
| Definition of Done presente    | ✅/❌     |
| Frontmatter completo           | ✅/❌     |
| Model card [si aplica]         | ✅/❌/N/A |
| DPIA [si aplica]               | ✅/❌/N/A |
| Threat model [si aplica]       | ✅/❌/N/A |
```

Si hay ❌ en artifacts condicionales: generarlos antes de pasar a Phase 3.

> [INTERNAL] Si el check de Invariants MUST/MUST NOT (≥4) falla (resultado < 4):
> → No esperar que el desarrollador lo corrija. Agregar invariants derivados de §3 Risk Profile hasta cumplir ≥4 MUST/MUST NOT.
> → Para cada risk dimension activa en el L4 closing summary que no tenga ya un invariant en §4: generar el invariant faltante y agregarlo.
> → Mostrar los invariants agregados al desarrollador con la nota: "Agregué [N] invariant(s) para alcanzar el mínimo de 4. Revisá y corregí si no reflejan tu proyecto."

**Phase 2 — Conditional artifacts** (generate immediately after Constitution is approved, before checkpoint):

**[Model card]** — when `has_ai_outputs != "none"` (i.e., `has_ai_outputs` is `"human-reviewed"` or `"autonomous"`)
Path: `docs/ai/model-card.{project-slug}.md`
Sections: (1) system description + intended use · (2) training data origin, coverage, known limitations · (3) evaluation metrics + success criteria · (4) anti-lookahead guarantees + temporal validation methodology · (5) fairness considerations — relevant protected groups for this use case · (6) known limitations + unsupported use cases · (7) EU AI Act classification if EU deployment OR `compliance_risk >= MEDIUM` (minimal/limited/high/unacceptable risk + required technical controls; add ISO 42001 alignment checklist) · (8) bias audit process (groups to monitor, fairness metrics, remediation trigger criteria) · (9) Data lineage: training data sources with origin URL/name + license (commercial use permitted?), date range covered, geographic/demographic coverage gaps known, anti-lookahead guarantee method (how future data leakage is prevented in validation) · (10) Model versioning governance: promotion criteria from shadow to production (volume gates, accuracy gates, how conflicts are resolved), rollback process if metrics degrade, recommended retraining cadence, who approves a promotion decision · (11) FRIA — Fundamental Rights Impact Assessment (only when EU deployment OR `compliance_risk >= MEDIUM` per EU AI Act Art. 27): fundamental rights potentially affected by the system, impact analysis per affected group, mitigation measures implemented, residual risks acknowledged

**[DPIA template]** — when `compliance_risk >= MEDIUM` AND personal data identified in L3
Path: `docs/compliance/dpia.{project-slug}.md` — `status: draft` (to be completed with DPO/legal)
Sections: (1) processing description: what data, purpose, retention period · (2) necessity + proportionality (GDPR Art. 35) · (3) risk identification for data subjects' rights · (4) mitigation measures · (5) data classification schema: Public/Internal/Confidential/Restricted — which data falls in each level, controls per level (encryption, access, retention) · (6) consent management if `has_ugc = true`: capture mechanism, audit trail, revocation process

**[Privacy by Design checklist]** — when personal data identified AND `compliance_risk >= LOW`
Path: `docs/compliance/privacy-by-design.{project-slug}.md`
Content: data minimization · purpose limitation · storage limitation + retention policy · encryption in transit + at rest · consent capture + revocation if `has_ugc = true`

**[Constitution enforcement script]** — always (enables hard-fail CI enforcement of §4 invariants)

Write: `scripts/constitution-checks.ts` with this content:

```typescript
/**
 * constitution-checks.ts
 * Translates §4 MUST NOT invariants from the project constitution into
 * executable grep-based CI checks. Hard-fails on any violation.
 * Usage: npx tsx scripts/constitution-checks.ts
 * CI: add as a step after build — no continue-on-error.
 */
import { execSync } from 'child_process';
import * as path from 'path';

// process.cwd() is compatible with both CommonJS and ESM (tsx/ts-node). Do NOT use path.resolve() with the CJS-only dir variable.
const ROOT = process.cwd();

interface Check {
  id: string;
  description: string;
  command: string;
  failIfMatch: boolean; // true = fail if grep finds anything (MUST NOT); false = fail if grep finds nothing (MUST)
}

// ── Customize: one check per §4 invariant marked MUST NOT ─────────────────
// These are starter patterns — replace with your project's actual invariants.
// Pattern: grep for the forbidden code pattern; if found → violation.
const CHECKS: Check[] = [
  {
    id: 'C1',
    description: '§4 — MUST NOT log fields that may contain PII (email, password, token, secret)',
    // Single-repo: 'src' is correct. Monorepo: replace 'src' with 'packages' or a specific package path
    // e.g. path.join(ROOT, 'packages/api/src') or path.join(ROOT, 'packages')
    command: `grep -rn --include="*.ts" --include="*.js" -E "console\\.(log|info|warn|error).*\\b(email|password|token|secret|ssn|creditCard)\\b" ${path.join(ROOT, 'src')} 2>/dev/null || true`,
    failIfMatch: true,
  },
  // Add one entry per MUST NOT invariant in §4 of your constitution.
  // Example for boundary rule (adapt package paths to your project):
  // {
  //   id: 'C2',
  //   description: '§4 — MUST NOT import scoring logic in frontend package',
  //   command: `grep -rn --include="*.ts" "from.*scoring" ${path.join(ROOT, 'packages/web/src')} 2>/dev/null || true`,
  //   failIfMatch: true,
  // },
];
// ──────────────────────────────────────────────────────────────────────────

let failures = 0;
for (const check of CHECKS) {
  try {
    const output = execSync(check.command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const hasMatch = output.trim().length > 0;
    const violated = check.failIfMatch ? hasMatch : !hasMatch;
    if (violated) {
      console.error(`❌ [${check.id}] VIOLATION: ${check.description}`);
      if (hasMatch) console.error(`   Found:\n${output.trim().split('\n').slice(0, 5).join('\n')}`);
      failures++;
    } else {
      console.log(`✅ [${check.id}] OK: ${check.description}`);
    }
  } catch {
    console.log(`✅ [${check.id}] OK (no matches): ${check.description}`);
  }
}

console.log(`\nConstitution checks: ${CHECKS.length - failures} passed, ${failures} failed.`);
if (failures > 0) process.exit(1);
```

**Important:** After generating this file, instruct the developer:
"Este script tiene un check starter (C1 — no PII en logs). Revisá `§4` de tu constitución y agregá un `Check` por cada invariant marcado como MUST NOT. Los boundary rules del §5 Architecture Principles también se pueden codificar aquí como checks de imports."

**Nota de adaptación para proyectos no-TypeScript:** Si el proyecto no usa TypeScript, adaptar `constitution-checks.ts` al lenguaje del stack. El script es un grep wrapper de ~30 líneas — la lógica es idéntica en cualquier lenguaje. Ejemplo: Python → `subprocess.run(['grep', ...])`, Go → `exec.Command('grep', ...)`, Bash → `grep -rn ...`.

Register any generated artifacts in document registry at Phase 5.

**Brownfield path — Phase 2 (cuando `brownfield: true` en checkpoint):**
1. Glob `docs/core/*.constitution.md` para encontrar el archivo existente. Read el archivo.
2. Derivar template completo desde intake — NO escribir aún.
3. Comparar sección por sección: identificar secciones ausentes en el documento existente.
4. Mostrar SOLO las secciones propuestas nuevas (no el documento completo).
5. Para cada sección nueva: identificar posición semántica correcta leyendo el índice de secciones existente (e.g., §4 MUST NOT va después de §3 Risk Profile).
6. Gate: "¿Agregar estas secciones en las posiciones indicadas? (s/n/editar)"
7. Si s: INSERT cada sección en su posición semántica — NO APPEND al final del archivo.
8. **Conditional artifact check (brownfield):** Verificar artifacts condicionales independientemente de las secciones de la constitución. Para cada flag activo en el checkpoint, verificar si el artifact existe en disco:

   Correr en paralelo:
   - Si `has_ai_outputs != "none"`: `ls docs/ai/model-card.*.md 2>/dev/null && echo "✅ model card" || echo "❌ AUSENTE"`
   - Si `compliance_risk≥MEDIUM` + personal data: `ls docs/compliance/dpia.*.md 2>/dev/null && echo "✅ DPIA" || echo "❌ AUSENTE"`
   - Siempre: `ls scripts/constitution-checks.ts 2>/dev/null && echo "✅ script" || echo "❌ AUSENTE"`
   - Siempre: `ls scripts/validate-doc-registry.ts 2>/dev/null && echo "✅ script" || echo "❌ AUSENTE"`

   Para cada artifact ausente → generarlo usando el proceso del greenfield path de esta fase.
   Anunciar: "Artifact condicional ausente detectado → generando [nombre]..."

**Intake file reuse rule (brownfield):**
Si `docs/intake/intake.*.layers-1-5.md` existe al iniciar genesis:
→ Anunciar: "Found a prior intake from [date]. Use it as a starting point?"
→ Si s: pre-cargar respuestas del intake previo, pedir confirmación de cada layer en L1-L5.
→ Si n: comenzar intake desde cero (el backup de F1 preservará el intake previo).

**Checkpoint write (Phase 2):** Write `docs/intake/genesis-checkpoint.json` with `last_completed: "Phase2"`, `phase_in_progress: null`.

**[INTERNAL — MANDATORY READ GATE]:** Immediately after writing the checkpoint above, run: `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase3.md`. Do NOT present any Phase 3 content to the developer until this Read completes. This is required — not optional. If the Read returns empty or fails → STOP. Do NOT generate any Phase 3 content. Announce: "⚠️ Cannot load phase file `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase3.md`. Verify the file exists and retry /genesis-governance."

**[INTERNAL] Active state recap — output this block in your response after the checkpoint write:**

```
[ACTIVE STATE — Phase 2 complete]
project: [project_name] | brownfield: [true/false] | lang: [language]
actors: [actor names, comma-sep] | risks: [risk categories, comma-sep]
stack: [language]/[repo_structure]/[hosting]
next: Phase 3 — governance.config.yaml
```

---
