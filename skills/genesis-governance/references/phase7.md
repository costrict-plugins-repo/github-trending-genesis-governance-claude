## PHASE 7 — FIRST GOVERNANCE AUDIT

> **NAVIGATION FOOTER REMINDER (every confirmation gate):**
> End every gate with: `📍 Phase [N]/7 — [one-liner]`
>   `◀ back to Phase [N-1] (documents may need updating)  ·  ok → Phase [N+1]`
> One-liners: P2=Constitution/rules | P3=Governance config | P4=CLAUDE.md | P5=Doc registry | P6=CI pipeline | P7=Post-install audit
> If `backtrack_origin` is active in session → also show: `skip → [origin]` (omit after reentry from checkpoint)

> **Recovery check (si venís de phase_in_progress):** Verificar si `docs/governance/governance-audit-*.md` existe y si Glossary + CODEOWNERS existen.
>
> > [INTERNAL] Recovery branching — apply the first matching case:
> > - **Case 1:** audit ✅ (has `### Verdict:`) AND `docs/core/domain-glossary.[slug].md` ✅ AND `.github/CODEOWNERS` ✅ (file with @handles written) → anunciar "Governance audit found and complete — marking Phase 7 as complete" → escribir `last_completed: "Phase7"`, `phase_in_progress: null` → Session 2 complete.
> > - **Case 2:** audit ✅ (has `### Verdict:`) AND Glossary ❌ OR `.github/CODEOWNERS` ❌ → jump directly to "STOP — Generate Domain Glossary and CODEOWNERS NOW" section below (ask developer for real GitHub handles before generating CODEOWNERS). Generate only the missing artifact(s). Do NOT re-run Steps 1-6.
> > - **Case 3:** audit ❌ (does not exist or has no `### Verdict:`) → resume Phase 7 from Step 1.

> **Posición:** Phase 7 de 7 — Post-Install Verification | Completadas: 2 (Constitution), 3 (governance.config.yaml), 4 (CLAUDE.md + Agents), 5 (Document Registry), 6 (CI Pipeline) | Pendientes: —

> **Si `genesis-checkpoint.json` tiene `"brownfield": true`:**
> ⚠️ **MODO BROWNFIELD ACTIVO** — Esta fase opera en modo INSERT/APPEND únicamente. Nada se sobreescribe sin backup previo y confirmación explícita. Backups en `*.backup-YYYY-MM-DD`.

**Phase start — escribir phase_in_progress:** Actualizar `docs/intake/genesis-checkpoint.json` — cambiar `phase_in_progress` a `"Phase7"` (mantener todos los otros campos intactos). Esto permite recovery si el contexto se agota antes del checkpoint write final.

**Preconditions:**
- [ ] Phase 6 CI pipeline YAML written to disk and developer approved
- [ ] All Session 1 artifacts exist on disk: constitution, governance.config.yaml, CLAUDE.md, docs/_registry/document-registry.md (Phases 2-5)
- [ ] All Session 2 artifacts so far exist on disk: ci.yml (Phase 6)
- [ ] Developer has staged or committed the files (uncommitted files are expected and acceptable at this stage — just note them)

Run the following checks using tool calls directly. This is a self-contained audit — no external skill required.

---

### Step 1 — Artifact presence

Use the Read or Glob tool to verify each artifact exists on disk:

| Artifact | Expected path | Status |
|----------|--------------|--------|
| Constitution | `docs/core/spec.[project-slug].core.constitution.md` | — |
| governance.config.yaml | `governance.config.yaml` (project root) | — |
| CLAUDE.md | `CLAUDE.md` (project root) | — |
| Document registry | `docs/_registry/document-registry.md` | — |
| CI pipeline | `.github/workflows/ci.yml` (or equivalent) | — |
| Intake file | `docs/intake/intake.[project-slug].layers-1-5.md` | — |

Mark each as ✅ found or ❌ missing. Any missing artifact is a HIGH finding — fix before continuing.

---

### Step 2 — CLAUDE.md structure check

Read `CLAUDE.md` and verify:
- [ ] Contains at least one `[FRAMEWORK]` section
- [ ] Contains at least one `[PROJECT-SPECIFIC]` section
- [ ] Git discipline is explicit (commit/push require separate instructions)
- [ ] Delivery checklist is present (build + tests before "done")

---

### Step 3 — Document registry completeness

Read `docs/_registry/document-registry.md` and verify:
- [ ] Every artifact generated in Phases 2-6 has a row
- [ ] Each row has: artifact_id, title, class, status, version, canonical_path
- [ ] All canonical_paths point to files that actually exist on disk

If any artifact is unregistered → add it now. Registry gaps are a HIGH finding.

---

### Step 3b — Conditional artifact coverage

Read `docs/intake/genesis-checkpoint.json` (or equivalent). For each active flag, verify the expected artifact exists:

Run in parallel:
- Si `has_ai_outputs=true`: `ls docs/ai/model-card.*.md 2>/dev/null && echo "✅ model card" || echo "❌ MISSING — HIGH"`
- Si `compliance_risk >= MEDIUM` + personal data: `ls docs/compliance/dpia.*.md 2>/dev/null && echo "✅ DPIA" || echo "❌ MISSING — MEDIUM"`
- Si `security_risk >= MEDIUM`: `ls docs/security/threat-model.*.md 2>/dev/null && echo "✅ threat model" || echo "❌ MISSING — MEDIUM"`
- Si `has_performance_sla=true`: `ls docs/ops/slo-sli.*.md 2>/dev/null && echo "✅ SLO/SLI" || echo "❌ MISSING — MEDIUM"`
- Siempre: `ls scripts/constitution-checks.ts 2>/dev/null && echo "✅ script" || echo "❌ MISSING — MEDIUM"`
- Siempre: `ls scripts/validate-doc-registry.ts 2>/dev/null && echo "✅ script" || echo "❌ MISSING — MEDIUM"`

Severity rules:
- model card ausente cuando `has_ai_outputs=true` → HIGH (bloquea cierre de Phase 7 — generar antes de continuar)
- DPIA / threat model / SLO/SLI ausentes → MEDIUM (agregar a `pending_artifacts[]` en checkpoint)
- Scripts ausentes → MEDIUM (CI usa `continue-on-error` pero queda no-funcional)

---

### Step 3c — Definition of Done derivation check

Read the constitution's DoD section. Verify it includes the criteria implied by the project flags:

| Flag activo | Criterio requerido en DoD |
|-------------|--------------------------|
| `security_risk >= MEDIUM` | Mención explícita de sign-off de security-reviewer |
| `compliance_risk >= MEDIUM` | Mención explícita de sign-off de compliance-reviewer |
| `has_ai_outputs=true` | Garantía anti-lookahead verificada |
| `has_financial_flow=true` | Audit trail / reconciliación en test |
| `has_multitenancy=true` | Aislamiento RLS / tenant isolation verificado |
| `qa_rigor=HIGH` | Umbral de cobertura ≥ 80% (o equivalente) |

Finding si falta cualquier criterio → MEDIUM. Proponer el criterio a insertar.

---

### Step 3d — genesis-sync run

**Nota:** genesis-sync es parte del mismo plugin — siempre disponible cuando este skill está activo. No hay que verificar existencia en disco.

**Cómo ejecutar genesis-sync desde Phase 7:**
1. **Read `${CLAUDE_PLUGIN_ROOT}/skills/genesis-sync/SKILL.md`** para cargarlo en el contexto de esta sesión.
2. Una vez cargado, ejecutar sus phases 1-5 inline (no saltar a una nueva sesión — ejecutar directamente aquí).

genesis-sync lee el checkpoint y verifica 8 dimensiones de drift (D-SYNC-1 a D-SYNC-8).

**Expected result after a clean install:** 0 findings. Una instalación nueva no debe tener drift.

- 0 findings → ✅ instalación internamente consistente
- Cualquier HIGH finding → BLOCKS. Corregir antes de cerrar sesión.
- MEDIUM/LOW findings → WARNS. Documentar en `pending_artifacts[]` del checkpoint.

**Precondición:** `docs/intake/genesis-checkpoint.json` debe existir con `genesis_version: "1.1"` o superior. Si el checkpoint es v1.0, genesis-sync ofrece migración automática antes de correr.

---

### Step 4 — Build and tests

Run the project's build and test commands (from governance.config.yaml `stack` section):

```
[build command from governance.config.yaml — e.g. npm run build / pnpm build / cargo build]
[test command — e.g. npm test / pnpm -r test / pytest]
```

- Build fails → HIGH finding (fix before closing)
- Tests fail → HIGH finding (fix before closing)
- No build/test script yet → LOW finding (expected for new projects, not blocking)

---

### Step 5 — Uncommitted changes

Run: `git status --short`

- Uncommitted files → LOW finding (expected at this stage — remind developer to commit)
- This check is informational, not blocking

---

### Step 6a — Audit summary (present and gate)

After presenting the audit summary, wait for developer confirmation before writing the audit file to disk.

**Qué cuenta como aprobación:** respuesta afirmativa explícita ("ok", "listo", "adelante", "sí", "bien", "aprobado", o equivalente sin correcciones pendientes).
**Qué NO cuenta:** "ok pero [corrección]" (procesar corrección primero) · silencio (preguntar) · pregunta sobre el contenido (responder y volver al gate).

---

### Step 6b — Audit summary (write to disk)

After all checks complete, write the audit result to:
`docs/governance/governance-audit-[YYYY-MM-DD].md`

(Create `docs/governance/` if it doesn't exist.)

Format:
```markdown
# Governance Audit — [YYYY-MM-DD]
## Session: First audit (post-genesis Phase 7)

### Findings
[list findings with: ID, severity HIGH/MEDIUM/LOW, description, status FIXED/OPEN]

### Verdict: CONFORME / PARCIALMENTE_CONFORME / NO_CONFORME
- CONFORME: 0 HIGH findings open
- PARCIALMENTE_CONFORME: MEDIUM findings open, no HIGH
- NO_CONFORME: 1+ HIGH findings open (must fix before concluding)
```

> [INTERNAL] Phase 7 closure rule based on verdict:
> - **CONFORME** → Phase 7 is complete. Proceed to checkpoint write.
> - **PARCIALMENTE_CONFORME** (MEDIUM findings open, no HIGH) → Phase 7 can be closed. Document open findings with owner and target date. Proceed to checkpoint write.
> - **NON_CONFORME** (any HIGH finding open) → Phase 7 CANNOT be closed. Announce: "HIGH findings must be resolved before closing Phase 7. Fix the issues and re-run the audit (re-run Steps 1–6b)." Do NOT write the checkpoint.

Show the audit summary to the developer and wait for confirmation.

After the developer confirms the audit result and has committed the audit file, instruct:

```
Para anclar este audit al historial de git, ejecutá:
  git tag governance/[YYYY-MM-DD]

Esto crea un lightweight tag que vincula el resultado del audit al SHA del commit exacto en que fue producido. Es recuperable con `git show governance/[YYYY-MM-DD]`. Requerido para compliance audits externos (GDPR, SOC2, ISO 42001).
```

**Git tag verification:**
After instructing the git tag, verify:
  git tag | grep "governance/"
- If found: ✅ "Tag governance/[date] confirmed."
- If not found (developer hasn't run it yet): add a LOW finding to the audit document:
  "Git tag governance/[date] not verified — run manually to anchor this audit to git history
   (recommended for compliance traceability: GDPR, SOC2, ISO 42001)."

**Pre-gate checklist (verificar ANTES de mostrar el output):**
- [ ] Output derivado explícitamente de inputs confirmados en esta sesión (no inventado ni genérico)
- [ ] Todos los campos opcionales condicionales generados si el flag aplica (model card, DPIA, threat model, etc.)
- [ ] Sin secciones placeholder vacías — toda sección tiene contenido real o está marcada N/A con razón
- [ ] Acceptance criteria de esta fase cubiertos por el output generado

**Phase 7 — Acceptance criteria (verify before declaring Session 2 complete):**
- [ ] All 6 steps ran — none silently skipped
- [ ] All Session 1+2 artifacts exist on disk (Step 1 fully green)
- [ ] Document registry has all Phase 2-6 artifacts registered (Step 3 passes)
- [ ] All HIGH findings resolved before closing (build/tests pass or explicitly N/A for new project)
- [ ] MEDIUM findings either fixed or documented as OPEN with explicit owner
- [ ] Audit file written to `docs/governance/governance-audit-[date].md`
- [ ] Developer confirmed the audit result
- [ ] `docs/core/domain-glossary.[project-slug].md` written to disk
- [ ] `.github/CODEOWNERS` written to disk (with real or explicitly-placeholder handles)
- [ ] Both artifacts added to `docs/_registry/document-registry.md`

**STOP — Generate Domain Glossary and CODEOWNERS NOW, before writing checkpoint.**

**Domain Glossary** — generate and write to disk before checkpoint write:

Write: `docs/core/domain-glossary.[project-slug].md`
```markdown
---
artifact_id: GLOSSARY-[PROJECT]-CORE-DOMAIN
title: [Project] — Domain Glossary
class: glossary
status: active
version: 1.0.0
---

# [Project] — Domain Glossary

> Derivado del intake: L1 (value_prop, sector), L2 (actor profiles), L3 (system boundary).
> Actualizar cuando el modelo de dominio cambie. Fuente autoritativa para nombres en código y specs.

| Término | Definición | Usado en |
|---------|-----------|----------|
[Generate 8-12 rows — see [INTERNAL] generation rules below]
```

> [INTERNAL] Domain Glossary — term selection:
> **If codebase exists (brownfield or late-stage greenfield with code written):**
> Select terms that appear or are expected to appear in the codebase as class names, function names, or module names (not generic words like "user", "system", "data").
>
> **If codebase does not yet exist (early greenfield — no code written):**
> Derive terms exclusively from intake:
> - L1 value_prop: nouns describing the domain entities the product manages (these will become models or DB tables)
> - L2 actors: names of actor types that will become service interfaces or API consumers
> - L3 capabilities: action names that will become service method names or API endpoints
> - L5 package names (if specified): these become module names in the glossary
>
> In both cases — additional rules:
> - Include: entities from L2 actors that will become TypeScript interfaces or DB tables, domain verbs from L3 capabilities that become service method names, bounded context names from L3 system_boundary
> - Exclude: generic technical terms (API, database, server), generic business terms not specific to THIS domain
> - Definitions must be 1 sentence max, written in preferred_language
> - "Module" / "Usado en" column: use the actual package or module name from L5 stack architecture
> - Target: 8-12 terms (fewer if domain is small, more only if genuinely needed)

**CODEOWNERS** — ask for real GitHub handles BEFORE generating:

> [INTERNAL] Before generating CODEOWNERS: ask the developer:
> "For CODEOWNERS, I need the GitHub handles of the primary owners. Who are the reviewers for: (1) general files / governance, (2) backend/core packages, (3) frontend packages? (You can provide @handles or team names like @org/team-name)"
> Wait for response. Use those handles in the CODEOWNERS file instead of the placeholder names.
> If developer says "skip" or "just use placeholders" → use @owner, @team-backend, @team-frontend and add a comment: `# TODO: replace with real GitHub handles`

Write: `.github/CODEOWNERS`
```
# CODEOWNERS — generado por /genesis-governance
# Actualizar con los GitHub handles reales de tu equipo.
# Formato: <path> <@owner1> <@owner2>

# Backend packages (derivado de L5 paths.backend)
[L5 packages.backend path, e.g. packages/api/] @team-backend

# Frontend (derivado de L5 paths.frontend, omitir si no aplica)
[L5 paths.frontend path, e.g. packages/web/] @team-frontend

# Governance artifacts — requieren review de al menos un tech lead
docs/core/ @tech-lead
docs/_registry/ @tech-lead
.github/workflows/ @tech-lead
```

After writing both files, add entries to `docs/_registry/document-registry.md`:
- `GLOSSARY-[PROJECT]-CORE-DOMAIN` — Domain Glossary — class: glossary — active — 1.0.0 — docs/core/domain-glossary.[project-slug].md

**Checkpoint write (Phase 7):** Write `docs/intake/genesis-checkpoint.json` with `last_completed: "Phase7"`, `phase_in_progress: null`.

---

## SESSION 2 COMPLETE

```
Session 2 complete. Your governance framework is fully operational.

What you now have:
  ✅ Constitution
  ✅ governance.config.yaml
  ✅ CLAUDE.md
  ✅ Document registry
  ✅ CI pipeline (automated checks on every PR)
  ✅ First governance audit passed

**Tus próximos pasos prioritarios** (derivados de tu perfil de riesgo):

[Si security_risk=HIGH: "🔴 Penetration testing cadence (OWASP TG) — requerido antes del primer usuario real"]
[Si has_ai_outputs=true: "🔴 Anti-lookahead validation — verificar que los modelos no leen datos futuros antes del primer deploy"]
[Si compliance_risk≥MEDIUM: "🟡 DPIA — completar antes de onboarding de usuarios con datos personales"]
[Si has_performance_sla=true: "🟡 SLO/SLI baseline — establecer métricas antes de primer deploy"]
[Si ningún flag crítico: omitir sección de "🔴/🟡" y mostrar solo la lista estándar]

**Domain glossary + CODEOWNERS** — these were generated before the checkpoint write above. Verify they exist on disk before announcing Session 2 complete. If missing, generate them now using the instructions in the "STOP — Generate Domain Glossary" section.

**Para commitear los artifacts de Session 2:**
```bash
git add .github/workflows/ci.yml \
        .github/CODEOWNERS \
        docs/core/domain-glossary.[project-slug].md \
        docs/governance/governance-audit-[YYYY-MM-DD].md \
        docs/intake/genesis-checkpoint.json \
        docs/_registry/document-registry.md
# Artefactos operacionales (incluir si fueron generados):
# git add docs/ops/post-mortem-template.md docs/ops/oncall-runbook.[project-slug].md
git commit -m "chore(governance): Session 2 — CI pipeline + first governance audit + glossary + CODEOWNERS"
```

Recommended: Commit everything now with message:
  "chore(governance): initial governance framework setup via /genesis-governance"

If security_risk = HIGH OR compliance_risk = HIGH — advanced maturity recommendations
(not generated by genesis — require dedicated engagement):
  □ Formal penetration testing cadence (OWASP Testing Guide)
  □ ISO 27001 ISMS program (6-12 months, requires dedicated InfoSec lead)
  □ OWASP SAMM maturity assessment (organizational-level evaluation)
  □ Chaos engineering program (when SRE maturity ≥ Level 3)
  □ Data lineage tracking if data-heavy platform (DAMA DMBOK)
```

---

## Error Handling

> **Nota:** Esta sección es una copia de referencia. La fuente autoritativa de los error handlers está en `genesis-governance.md` (siempre cargado). Los handlers de esta copia aplican si se necesita consulta durante las fases 2-7. En caso de conflicto, prevalece `genesis-governance.md`.

**Handler 1 — Respuesta vaga o incompleta:**
No avanzar. Nombrar exactamente qué falta y hacer una pregunta dirigida. No generar documentos con información insuficiente.

**Handler 2 — Más de 3 campos sin definir después del emergency exit warning:**
Marcar como `TBD` y anotar el framework generado como incompleto. Estas secciones necesitan completarse antes de que la gobernanza esté operativa.

**Handler 3 — Derivación rechazada múltiples veces:**
Después de dos rondas de corrección, pedirle al developer que diga explícitamente: "Lo más importante que el framework de gobernanza debe proteger es [X]." Usar eso directamente.

**Handler 4 — Documento generado rechazado:**
Preguntar qué está mal específicamente. Corregir solo la sección identificada. No regenerar el documento completo a menos que el developer lo pida.

**Handler 5 — Developer wants to skip a phase:**
Allow it, but warn about the cascade implication. "Skipping a phase means that downstream artifacts (governance.config.yaml, CLAUDE.md) will be less accurate. Are you sure you want to skip?"

**Handler 6 — Documentos ya generados conflictúan con fases posteriores:**
Volver al documento más temprano que tiene el conflicto. No parchear documentos posteriores para tapar errores anteriores.

**Handler 9 — Developer wants to correct information from a previously confirmed layer:**
→ See full Backtrack Protocol in `genesis-governance.md` (always loaded). Apply Sub-case A (intake) or Sub-case B (phases) per that protocol. Do not improvise corrections outside the protocol.
If `genesis-governance.md` is not in active context: `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/SKILL.md` then apply the Backtrack Protocol.

**Handler 10 — Developer sends `?`, `help`, `manual`, or `overview`:**
→ See full Handler 10 spec in `genesis-governance.md` (always loaded). Summary:
If `genesis-governance.md` is not in active context: `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/SKILL.md` then apply Handler 10.
- `?` / `help` → show expanded description of current position (Phase 7: Post-install audit — confirms everything works end-to-end)
- `manual` → Look for `docs/guides/runbook.genesis-governance.user-manual.md` in current project; fallback to genesis-governance repository if not found.
- `overview` → show full flow map with Phase 7 marked as current.
