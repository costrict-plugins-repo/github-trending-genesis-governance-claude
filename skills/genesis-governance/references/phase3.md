## PHASE 3 — governance.config.yaml

> **NAVIGATION FOOTER REMINDER (every confirmation gate):**
> End every gate with: `📍 Phase [N]/7 — [one-liner]`
>   `◀ back to Phase [N-1] (documents may need updating)  ·  ok → Phase [N+1]`
> One-liners: P2=Constitution/rules | P3=Governance config | P4=CLAUDE.md | P5=Doc registry | P6=CI pipeline | P7=Post-install audit
> If `backtrack_origin` is active in session → also show: `skip → [origin]` (omit after reentry from checkpoint)

> **Recovery check (si venís de phase_in_progress):** Verificar si `governance.config.yaml` existe. Si existe → leer y verificar que tiene `actors:`, `hard_constraints:`, `checks:`, `stack:`. Si todos presentes → verificar además que `hard_constraints:` tiene al menos una entrada (no lista vacía `[]`). Si vacía → marcar como incompleto → completar hard_constraints. Solo si todos presentes Y `hard_constraints` tiene al menos una entrada → anunciar "governance.config.yaml encontrado e íntegro — marcando Phase 3 como completa" → escribir `last_completed: "Phase3"`, `phase_in_progress: null` → saltar a Phase 4. Si incompleto → completar solo los campos faltantes.
>
> **[INTERNAL] Check conditional Phase 3 artifacts before proceeding to Phase 4:**
> - If `security_risk >= MEDIUM` and no threat model exists in `docs/security/` → generate now (using the threat model template from this phase's Conditional artifacts section)
> - If `has_performance_sla = true` and no SLO/SLI doc exists in `docs/ops/` → generate now (using the SLO/SLI template from this phase's Conditional artifacts section)

> **Posición:** Phase 3 de 7 — governance.config.yaml | Completadas: 2 (Constitution) | Pendientes: 4 (CLAUDE.md + Agents), 5 (Document Registry), 6 (CI Pipeline), 7 (Post-Install Verification)

**Phase start — escribir phase_in_progress:** Actualizar `docs/intake/genesis-checkpoint.json` — cambiar `phase_in_progress` a `"Phase3"` (mantener todos los otros campos intactos). Esto permite recovery si el contexto se agota antes del checkpoint write final.

> **[INTERNAL] synthesis_accepted check:** If `synthesis_accepted: false` in checkpoint → when populating `governance.config.yaml` fields derived from intake (actors, hard_constraints, checks), use the developer's original wording verbatim. Do NOT paraphrase, synthesize, or infer values. If a field is ambiguous, ask the developer directly rather than inferring.

> **BROWNFIELD CHECK:** Si `genesis-checkpoint.json` tiene `"brownfield": true` → estás en modo brownfield. Cada write en esta fase es INSERT/APPEND únicamente — nunca overwrite sin backup previo. Ver sección "Brownfield safeguard" de esta fase.

> **Si `genesis-checkpoint.json` tiene `"brownfield": true`:**
> ⚠️ **MODO BROWNFIELD ACTIVO** — Esta fase opera en modo INSERT/APPEND únicamente. Nada se sobreescribe sin backup previo y confirmación explícita. Backups en `*.backup-YYYY-MM-DD`.

**Preconditions:**
- [ ] Phase 2 Constitution file written to disk at correct path (`docs/core/spec.{project}.core.constitution.md`)
- [ ] Developer explicitly approved the constitution (not just reviewed it)
- [ ] All invariants (I-x) numbered and complete — governance.config.yaml `hard_constraints` derives directly from them
- [ ] `actors[]` confirmed in L2 — maps to `actors:` section of config

After constitution is approved, derive `governance.config.yaml` from it.

**Brownfield safeguard — antes de escribir este archivo:**
Si `governance.config.yaml` ya existe en disco (verificar con `Read`):
→ Crear backup: `Write: governance.config.yaml.backup-YYYY-MM-DD` con el contenido leído.
→ Verificar: `Read: governance.config.yaml.backup-YYYY-MM-DD` — si el archivo no existe o está vacío → STOP. Anunciar: "⚠️ Backup failed — cannot overwrite without confirmed backup. Aborting." No proceder.
→ Anunciar: "Backup creado: `governance.config.yaml.backup-[date]` — contenido original preservado."
→ Proceder con la escritura normal.
Si el archivo no existe: escribir directamente.

**File:** `governance.config.yaml` (root of project)

Use the schema defined in §6 of the spec. Derivation mapping (G16):

| tech_stack field | governance.config.yaml field | Rule |
|---|---|---|
| `language = TypeScript` + separate server dir | `server_typecheck: true` | TypeScript projects with a server directory get typecheck |
| `language = TypeScript` + `repo_structure = monorepo` | `packages: [list]` | Packages from L5 monorepo listing |
| `structural_flags.has_public_api = true` OR frontend SPA in stack | `bundle: { enabled: true }` | Web frontend or public API gets bundle tracking |
| any env variables required at startup | `env_parity: true` | Flag enabled if project uses required env vars |
| `structural_flags.ai_outputs ≠ none` | `domain_audit: true`, `semantic_version_vars: [...]` | Algorithmic output risk activates audit + version gates |
| `financial_flow = through-system` | `checks.secret_rotation: true` | Financial projects get secrets rotation cadence |
| `data_boundaries = isolated` | `checks.forbidden_imports: true` | Isolation enforced via import boundaries — derive patterns from L5 `structural_flags` and package boundary declarations (NOT from CLAUDE.md, which doesn't exist yet at Phase 3). Note: Phase 4 will refine these patterns after CLAUDE.md is generated. |
| `hosting = undecided` | placeholder values + flag comment | Note: fill in once hosting is confirmed |
| Always (universal) | `checks.secret_rotation: true` + `rotation_cadence` block listing each secret from L5 with recommended rotation interval (API keys: 90d, DB passwords: 30d, webhook secrets: 180d) | Every project defines a secret rotation policy |
| `qa_rigor >= MEDIUM` | `checks.coverage_thresholds: { statements: 70, branches: 60 }` | `qa_rigor = HIGH` → `{ statements: 80, branches: 70 }` | Coverage gates enforced in CI |

- **packages**: list from L5 monorepo declaration; for single-repo set to `["."]`
- **semantic_version_vars**: if `algorithmic-output` → ask for version var names; else omit
- **checks**: enable/disable based on the mapping above

**Traza de derivación** — mostrar al desarrollador antes del YAML:
```
Derivado de tus respuestas:
  [L3/L4/L5 signal → campo yaml] — uno por campo no-trivial
  Ej: "L4 financial_flow=through-system → financial_flow: through-system"
  Ej: "L3 qa_rigor=HIGH → test_coverage_threshold: 80%"
  Solo campos donde la derivación no es 1:1 obvia. Omitir defaults triviales.
```

> [INTERNAL] **YAML validation before showing to developer:** Before presenting governance.config.yaml, validate syntax:
> `node -e "require('js-yaml').load(require('fs').readFileSync('governance.config.yaml','utf8')); console.log('valid')" 2>&1`
> Fallback if node/js-yaml unavailable: `python3 -c "import yaml, sys; yaml.safe_load(open('governance.config.yaml')); print('valid')" 2>&1`
> If syntax error → fix the YAML before proceeding to the developer gate. Do NOT show invalid YAML.

Show generated config. Ask for corrections. Wait for approval.

**Qué cuenta como aprobación:** respuesta afirmativa explícita ("ok", "listo", "adelante", "sí", "bien", "aprobado", o equivalente sin correcciones pendientes).
**Qué NO cuenta:** "ok pero [corrección]" (procesar corrección primero) · silencio (preguntar) · pregunta sobre el contenido (responder y volver al gate).

**Pre-gate checklist (verificar ANTES de mostrar el output):**
- [ ] Output derivado explícitamente de inputs confirmados en esta sesión (no inventado ni genérico)
- [ ] Todos los campos opcionales condicionales generados si el flag aplica (model card, DPIA, threat model, etc.)
- [ ] Sin secciones placeholder vacías — toda sección tiene contenido real o está marcada N/A con razón
- [ ] Acceptance criteria de esta fase cubiertos por el output generado

**Phase 3 — Acceptance criteria (verify before generating CLAUDE.md):**
- [ ] All actors from Layer 2 `actor_profiles[]` present under `actors:` key
- [ ] All `structural_flags` from Layer 3 mapped (at minimum: has_backoffice, has_public_api, has_notifications, has_ugc)
- [ ] All `ai_outputs` policies present with explicit `mode:` (autonomous / assisted / generative) for each AI output type
- [ ] All risks from Layer 4 `business_risks[]` present with `severity:` and `mitigation:`
- [ ] All items from Layer 5 `tech_stack` present (language, repo_structure, hosting, external_deps)
- [ ] Every hard constraint has both `rule:` (what) and `implementation:` (how to enforce)
- [ ] Every risk has both `severity:` and `mitigation:` (not just a description)
- [ ] At least one entity lifecycle modeled (states + valid transitions) — derived from core capabilities
- [ ] MVP exclusions present under `v2_candidates:` or equivalent
- [ ] File parses as valid YAML (no syntax errors)
- [ ] Developer approved the config

**Phase 3 — Gobernanza: verificación automática**

Run in parallel — corregir cualquier ❌ antes de pedir confirmación:

1. `node -e "require('js-yaml').load(require('fs').readFileSync('governance.config.yaml','utf8')); console.log('✅ YAML válido')" 2>&1`
2. `grep -q "^actors:" governance.config.yaml && echo "✅ actors" || echo "❌ actors ausente"`
3. `grep -q "^checks:" governance.config.yaml && echo "✅ checks block" || echo "❌ checks block ausente"`
4. `grep -q "forbidden_imports" governance.config.yaml && echo "✅ forbidden_imports" || echo "❌ forbidden_imports ausente"`
5. Si `has_ai_outputs ≠ none`: `grep -q "domain_audit: true" governance.config.yaml && echo "✅ domain_audit" || echo "❌ domain_audit ausente"`
6. Si `has_performance_sla=true`: `ls docs/ops/slo-sli.*.md 2>/dev/null && echo "✅ SLO/SLI" || echo "❌ SLO/SLI ausente — generarlo ahora"`

Presentar tabla al desarrollador:
```
Phase 3 — Verificación
| Check                       | Resultado |
|-----------------------------|-----------|
| YAML válido                 | ✅/❌     |
| actors: presente            | ✅/❌     |
| checks: block presente      | ✅/❌     |
| forbidden_imports definido  | ✅/❌     |
| domain_audit [si aplica]    | ✅/❌/N/A |
| SLO/SLI doc [si aplica]     | ✅/❌/N/A |
```

**Phase 3 — Conditional artifacts** (generate after governance.config.yaml is approved, before checkpoint):

**[Threat model]** — when `security_risk >= MEDIUM`
Path: `docs/security/threat-model.{project-slug}.md`
Sections: (1) critical assets from L3+L4 · (2) threat actors + attack vectors specific to this context and sector · (3) existing controls + identified gaps · (4) relevant CWE list for this stack (derived from L5: e.g., TypeScript web → CWE-79 XSS, CWE-89 SQLi, CWE-307 brute force, CWE-522 weak credentials) · (5) OWASP LLM Top 10 section if `has_ai_outputs = true` AND project generates LLM outputs (at minimum: LLM01 prompt injection, LLM02 insecure output handling, LLM06 sensitive info disclosure, LLM09 overreliance)
**Important:** this is the reference document the `security-reviewer` agent uses. Without it, the agent operates by intuition rather than by defined criteria.

**[SLO/SLI document]** — when `has_performance_sla = true`
Path: `docs/ops/slo-sli.{project-slug}.md`
Sections: (1) SLI definitions: what to measure (latency p50/p95/p99, error rate %, availability %) · (2) SLO targets derived from intake: specific thresholds + measurement windows (e.g., p95 latency < 500ms over 30-day rolling window) · (3) error budget definition + consumption policy (what happens when 50%/80%/100% budget consumed) · (4) Four Golden Signals with per-signal targets for this project: Latency / Traffic (req/s normal + peak) / Errors (acceptable rate) / Saturation (CPU/memory targets) · (5) measurement tooling derived from L5 stack
**Important:** this is the reference document the `performance-reviewer` agent uses.

Register any generated artifacts in document registry at Phase 5.

**Brownfield path — Phase 3 (cuando `brownfield: true` en checkpoint):**
1. Read `governance.config.yaml` existente.
2. Derivar config completo desde intake.
3. Mostrar diff: campos nuevos vs campos que cambiarían un valor existente.
4. Gate para cambios que modifiquen un valor existente:
   > [INTERNAL] What counts as one "change": each top-level key modified = 1 change. Modifications to multiple subkeys within the same top-level key = 1 change total (not N subkeys). Example: updating `checks.secret_rotation` + `checks.coverage_thresholds` = 2 changes (both under `checks:` → 1 change).
   - If 3 or fewer changes: gate each change individually (one confirmation per field).
   - If 4 or more changes: present a diff table with ALL proposed changes → single consolidated gate: "I found [N] changes to governance.config.yaml. Shown above. Proceed with all? Or review one by one? (all / one-by-one)"
   > [INTERNAL] If developer responds with partial approval (e.g., "only 1, 3 and 5" or "not the last one"): fall back to one-by-one mode for ALL changes. Present each change individually in sequence and gate each one. Do not attempt to parse which items were approved or rejected from an ambiguous batch response.
5. Campos nuevos: agregar sin gate adicional.
6. Escribir versión merged: campos existentes preservados + campos nuevos aprobados.

**Checkpoint write (Phase 3):** Write `docs/intake/genesis-checkpoint.json` with `last_completed: "Phase3"`, `phase_in_progress: null`.

**[INTERNAL — MANDATORY READ GATE]:** Immediately after writing the checkpoint above, run: `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase4.md`. Do NOT present any Phase 4 content to the developer until this Read completes. This is required — not optional. If the Read returns empty or fails → STOP. Do NOT generate any Phase 4 content. Announce: "⚠️ Cannot load phase file `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase4.md`. Verify the file exists and retry /genesis-governance."

**[INTERNAL] Active state recap — output this block in your response after the checkpoint write:**

```
[ACTIVE STATE — Phase 3 complete]
project: [project_name] | brownfield: [true/false] | lang: [language]
actors: [actor names, comma-sep] | risks: [risk categories, comma-sep]
stack: [language]/[repo_structure]/[hosting]
next: Phase 4 — CLAUDE.md + Agents
```

---
