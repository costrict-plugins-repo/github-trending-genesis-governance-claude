## PHASE 5 — DOCUMENT REGISTRY (Session 1 — MANDATORY)

> **NAVIGATION FOOTER REMINDER (every confirmation gate):**
> End every gate with: `📍 Phase [N]/7 — [one-liner]`
>   `◀ back to Phase [N-1] (documents may need updating)  ·  ok → Phase [N+1]`
> One-liners: P2=Constitution/rules | P3=Governance config | P4=CLAUDE.md | P5=Doc registry | P6=CI pipeline | P7=Post-install audit
> If `backtrack_origin` is active in session → also show: `skip → [origin]` (omit after reentry from checkpoint)

> **Recovery check (si venís de phase_in_progress):** Verificar si `docs/_registry/document-registry.md` existe. Si existe → leer y verificar que tiene al menos una fila por cada artifact generado en Phases 2-4. Contar filas de datos (no headers, no separadores). Si 0 filas → marcar como incompleto → completar el registro completo. Si ≥1 fila pero falta algún artifact de Phase 2-4 → completar solo las filas faltantes. Solo si todas las filas esperadas están presentes → anunciar "Document registry encontrado e íntegro — marcando Phase 5 como completa" → escribir `last_completed: "Phase5"`, `phase_in_progress: null` → saltar a Phase 6.
>
> **[INTERNAL] Also verify scripts exist before proceeding to Phase 6:**
> - If `scripts/validate-doc-registry.ts` not found → generate it now (using the script template from this phase)
> - If `scripts/constitution-checks.ts` not found → generate it now (using the script template from Phase 2)

> **Posición:** Phase 5 de 7 — Document Registry | Completadas: 2 (Constitution), 3 (governance.config.yaml), 4 (CLAUDE.md + Agents) | Pendientes: 6 (CI Pipeline), 7 (Post-Install Verification)

**Phase start — escribir phase_in_progress:** Actualizar `docs/intake/genesis-checkpoint.json` — cambiar `phase_in_progress` a `"Phase5"` (mantener todos los otros campos intactos). Esto permite recovery si el contexto se agota antes del checkpoint write final.

> **BROWNFIELD CHECK:** Si `genesis-checkpoint.json` tiene `"brownfield": true` → estás en modo brownfield. Cada write en esta fase es INSERT/APPEND únicamente — nunca overwrite sin backup previo. Ver sección "Brownfield safeguard" de esta fase.

> **Si `genesis-checkpoint.json` tiene `"brownfield": true`:**
> ⚠️ **MODO BROWNFIELD ACTIVO** — Esta fase opera en modo INSERT/APPEND únicamente. Nada se sobreescribe sin backup previo y confirmación explícita. Backups en `*.backup-YYYY-MM-DD`.

**Preconditions:**
- [ ] Phase 4 CLAUDE.md written to disk and developer approved
- [ ] Constitution file exists on disk at its declared path
- [ ] Intake file exists on disk at its declared path
- [ ] Any additional spec files created during genesis exist on disk
- [ ] `docs/_registry/` directory available (create if it doesn't exist — no blocker)

**This phase is part of Session 1 and is NOT optional.** A project without a document registry cannot run a passing governance audit (D20 check fails).

**Brownfield safeguard — antes de escribir este archivo:**
Si `docs/_registry/document-registry.md` ya existe en disco (verificar con `Read`):
→ Crear backup: `Write: docs/_registry/document-registry.md.backup-YYYY-MM-DD` con el contenido leído.
→ Verificar: `Read: docs/_registry/document-registry.md.backup-YYYY-MM-DD` — si el archivo no existe o está vacío → STOP. Anunciar: "⚠️ Backup failed — cannot overwrite without confirmed backup. Aborting." No proceder.
→ Anunciar: "Backup creado: `docs/_registry/document-registry.md.backup-[date]` — contenido original preservado."
→ Proceder con la escritura (merge de los entries existentes con los nuevos generados durante la sesión).
Si el archivo no existe: escribir directamente.

Create `docs/_registry/document-registry.md` for the project.

**File location:** `docs/_registry/document-registry.md` (create directory if it doesn't exist)

**Initial entries to register** (one row per artifact generated during this session):

| artifact_id | title | class | status | version | canonical_path |
|-------------|-------|-------|--------|---------|----------------|
| `[PROJECT-SPEC-CORE-CONSTITUTION]` | [Project] — Project Constitution | spec | active | 1.0.0 | docs/core/spec.[project].core.constitution.md |
| `[PROJECT-INTAKE-LAYERS-1-5]` | [Project] Intake — Layers 1-5 | intake | active | [version] | docs/intake/intake.[project].layers-1-5.md |
| `[PROJECT-CONFIG-GOVERNANCE]` | governance.config.yaml | config | active | 1.0.0 | governance.config.yaml |
| `[PROJECT-CONFIG-CLAUDE-MD]` | CLAUDE.md — AI Operating Instructions | config | active | 1.0.0 | CLAUDE.md |
| `[PROJECT-SCRIPT-CONSTITUTION-CHECKS]` | Constitution Enforcement Script | script | active | 1.0.0 | scripts/constitution-checks.ts |
| `[PROJECT-SCRIPT-VALIDATE-REGISTRY]` | Document Registry Validation Script | script | active | 1.0.0 | scripts/validate-doc-registry.ts |

> [INTERNAL] Conditional artifacts — add a row for each one generated in Phase 2/3:
> - If `has_ai_outputs != "none"`: add row for `docs/ai/model-card.[slug].md` (class: spec)
> - If `compliance_risk >= MEDIUM` with personal data: add row for `docs/compliance/dpia.[slug].md` (class: spec) and `docs/compliance/privacy-by-design.[slug].md` (class: spec)
> - If `security_risk >= MEDIUM`: add row for `docs/security/threat-model.[slug].md` (class: spec)
> - If `has_performance_sla = true`: add row for `docs/ops/slo-sli.[slug].md` (class: spec)

**Class para tipos de archivo no-markdown:**
- Archivos JSON gobernados (genesis-checkpoint.json): usar `class: checkpoint`
- Scripts TypeScript (validate-doc-registry.ts, constitution-checks.ts): usar `class: script`
- Archivos YAML gobernados (governance.config.yaml, ci.yml): usar `class: config`

Naming rules for `artifact_id`:
- Format: `[TYPE]-[PROJECT]-[DOMAIN]-[SLUG]` — all uppercase, hyphens
- Example: `SPEC-PROPAI-CORE-CONSTITUTION`, `INTAKE-PROPAI-LAYERS-1-5`

Show the generated registry. Wait for approval before proceeding.

**Qué cuenta como aprobación:** respuesta afirmativa explícita ("ok", "listo", "adelante", "sí", "bien", "aprobado", o equivalente sin correcciones pendientes).
**Qué NO cuenta:** "ok pero [corrección]" (procesar corrección primero) · silencio (preguntar) · pregunta sobre el contenido (responder y volver al gate).

**[Registry validation script]** — always (enables D20 governance check and CI hard-fail step)

Write: `scripts/validate-doc-registry.ts` with this content:

```typescript
/**
 * validate-doc-registry.ts
 * Validates consistency between docs/_registry/document-registry.md and
 * governed artifacts in docs/ (files with YAML frontmatter + artifact_id).
 * Usage: npx tsx scripts/validate-doc-registry.ts [--fix-hints]
 * CI: hard-fails on errors (exit code 1).
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd(); // Compatible with both CommonJS and ESM (no __dirname needed)
const REGISTRY = path.join(ROOT, 'docs/_registry/document-registry.md');
const DOCS = path.join(ROOT, 'docs');
const SKIP = new Set(['docs/archive', 'docs/_governance', 'docs/_registry', 'docs/intake']);

type Severity = 'ERROR' | 'WARN';
interface Entry { artifact_id: string; class: string; status: string; version: string | null; canonical_path: string; }
interface FM { artifact_id?: string; version?: string; status?: string; canonical_path?: string; }
interface Finding { sev: Severity; type: string; msg: string; }

function parseRegistry(raw: string): Entry[] {
  return raw.split('\n').flatMap(line => {
    const t = line.trim();
    if (!t.startsWith('|') || t.startsWith('| artifact_id') || t.startsWith('|---')) return [];
    const c = t.split('|').map(x => x.trim()).filter(Boolean);
    if (c.length === 6) return [{ artifact_id: c[0], class: c[2], status: c[3], version: c[4], canonical_path: c[5] }] as Entry[];
    if (c.length === 5) return [{ artifact_id: c[0], class: c[2], status: c[3], version: null, canonical_path: c[4] }] as Entry[];
    return [];
  });
}

function parseFM(raw: string): FM | null {
  if (!raw.startsWith('---')) return null;
  const end = raw.indexOf('\n---', 3); if (end === -1) return null;
  const fm: FM = {};
  for (const line of raw.slice(4, end).split('\n')) {
    const m = line.match(/^(\w+):\s*"?([^"]+)"?\s*$/);
    if (m) {
      if (m[1] === 'artifact_id')    fm.artifact_id    = m[2].trim();
      if (m[1] === 'version')        fm.version        = m[2].trim();
      if (m[1] === 'status')         fm.status         = m[2].trim();
      if (m[1] === 'canonical_path') fm.canonical_path = m[2].trim();
    }
  }
  return fm;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    const rel  = path.relative(ROOT, full).replace(/\\/g, '/');
    if (e.isDirectory() && !Array.from(SKIP).some(s => rel.startsWith(s))) walk(full, out);
    else if (e.isFile() && e.name.endsWith('.md')) out.push(rel);
  }
  return out;
}

function main() {
  if (!fs.existsSync(REGISTRY)) { console.error(`ERROR: Registry not found at ${REGISTRY}`); process.exit(1); }
  const entries = parseRegistry(fs.readFileSync(REGISTRY, 'utf-8'));
  const byPath  = new Map(entries.map(e => [e.canonical_path, e]));
  const byId    = new Map(entries.map(e => [e.artifact_id,    e]));
  const F: Finding[] = [];

  for (const e of entries)
    if (!fs.existsSync(path.join(ROOT, e.canonical_path)))
      F.push({ sev: 'ERROR', type: 'REGISTRY_PATH_NOT_FOUND', msg: `'${e.artifact_id}' → '${e.canonical_path}' not on disk` });

  for (const rel of walk(DOCS)) {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
    const fm = parseFM(content);
    if (!fm?.artifact_id) continue;
    const reg = byPath.get(rel) ?? byId.get(fm.artifact_id);
    if (!reg) {
      F.push({ sev: 'ERROR', type: 'UNREGISTERED_ARTIFACT', msg: `'${rel}' (${fm.artifact_id}) not in registry` });
      continue;
    }
    if (fm.version && reg.version && fm.version !== reg.version)
      F.push({ sev: 'WARN', type: 'VERSION_MISMATCH',       msg: `'${rel}': fm=${fm.version} reg=${reg.version}` });
    if (fm.status  && reg.status  && fm.status  !== reg.status)
      F.push({ sev: 'WARN', type: 'STATUS_MISMATCH',        msg: `'${rel}': fm=${fm.status} reg=${reg.status}` });
    if (fm.canonical_path && fm.canonical_path !== rel)
      F.push({ sev: 'WARN', type: 'CANONICAL_PATH_STALE',   msg: `'${rel}': fm says '${fm.canonical_path}'` });
  }

  const errors = F.filter(f => f.sev === 'ERROR');
  const warns  = F.filter(f => f.sev === 'WARN');
  console.log('\n── Document Registry Validation ─────────────────');
  console.log(`   Registry entries : ${entries.length}  |  Errors : ${errors.length}  |  Warnings : ${warns.length}`);
  console.log('─────────────────────────────────────────────────\n');
  if (errors.length) { console.log('ERRORS (must fix):'); errors.forEach(f => console.log(`  [${f.type}] ${f.msg}`)); console.log(); }
  if (warns.length)  { console.log('WARNINGS:');          warns.forEach(f  => console.log(`  [${f.type}] ${f.msg}`));  console.log(); }
  if (!F.length)     console.log('✓ Registry consistent. No findings.\n');
  if (errors.length) process.exit(1);
}

main();
```

**Pre-gate checklist (verificar ANTES de mostrar el output):**
- [ ] Output derivado explícitamente de inputs confirmados en esta sesión (no inventado ni genérico)
- [ ] Todos los campos opcionales condicionales generados si el flag aplica (model card, DPIA, threat model, etc.)
- [ ] Sin secciones placeholder vacías — toda sección tiene contenido real o está marcada N/A con razón
- [ ] Acceptance criteria de esta fase cubiertos por el output generado

**Phase 5 — Acceptance criteria:**
- [ ] `docs/_registry/document-registry.md` created
- [ ] Every artifact generated during Phases 2-4 has a row (constitution, intake, any additional specs)
- [ ] Each row has: artifact_id, title, class, status, version, canonical_path
- [ ] canonical_path matches the actual file location on disk
- [ ] `scripts/validate-doc-registry.ts` written to disk
- [ ] Developer approved the registry

**Phase 5 — Gobernanza: verificación automática**

> [INTERNAL] Use the package manager from L5 stack detection (or `governance.config.yaml` `stack.package_manager`) to run verification commands:
> - pnpm: `pnpm tsx scripts/validate-doc-registry.ts`
> - npm: `npx tsx scripts/validate-doc-registry.ts`
> - yarn: `yarn tsx scripts/validate-doc-registry.ts`
> - bun: `bun scripts/validate-doc-registry.ts`
> If package manager is unknown, default to `npx tsx`.

Run antes de presentar al desarrollador:

1. `[package-manager] tsx scripts/validate-doc-registry.ts 2>&1 | grep -E "ERRORS|PASS|Errors"` → esperado: 0 errors
2. `grep -c "^|" docs/_registry/document-registry.md` → contar entradas registradas
3. `ls scripts/validate-doc-registry.ts 2>/dev/null && echo "✅ script presente" || echo "❌ validate-doc-registry.ts ausente"`
4. `ls scripts/constitution-checks.ts 2>/dev/null && echo "✅ script presente" || echo "❌ constitution-checks.ts ausente"`
5. Verificar que cada artifact creado en Phases 2-4b tiene entrada: `grep -c "canonical_path" docs/_registry/document-registry.md`

Presentar tabla al desarrollador:
```
Phase 5 — Verificación Registry
| Check                              | Resultado       |
|------------------------------------|-----------------|
| validate-doc-registry pasa         | ✅/❌           |
| Scripts creados en disco           | ✅/❌           |
| constitution-checks.ts             | ✅/❌           |
| Entradas en registry               | N entradas      |
```

**Brownfield path — document registry (cuando `brownfield: true` en checkpoint):**
1. Read `docs/_registry/document-registry.md` existente.
2. Identificar entries que ya existen (por `artifact_id` o `canonical_path`).
3. Solo agregar entries NUEVAS generadas durante esta sesión de genesis.
4. NO sobreescribir ni eliminar entries existentes.
5. Escribir versión merged: entries existentes + entries nuevas al final de la tabla.

**Brownfield path — scripts generados (cuando `brownfield: true` en checkpoint):**
Para `constitution-checks.ts` y `validate-doc-registry.ts`:
  - Si el script NO existe → generarlo normalmente.
  - Si el script existe:
    1. Read el archivo existente.
    2. Identificar lógica custom (checks más allá del template base de genesis).
    3. Proponer versión merged: lógica custom preservada + nuevos checks derivados del intake.
    4. Gate: mostrar la versión merged completa, confirmar antes de escribir.

**Traza de derivación (checkpoint v1.2)** — mostrar al desarrollador antes del JSON:
```
Checkpoint derivado de:
  project_name: [L1] · project_slug: [L1] · stack.language: [L5] · stack.hosting: [L5]
  paths.backend: [L5 packages.backend] · agents_generated: [Phase 4b archivos escritos]
```

**Checkpoint write (Phase 5):** Write `docs/intake/genesis-checkpoint.json` with the **v1.2 extended schema**:

```json
{
  "project_name": "[name from L1]",
  "project_slug": "[slug from L1]",
  "genesis_version": "1.2",
  "brownfield": false,
  "preferred_language": "en",
  "last_completed": "Phase5",
  "phase_in_progress": null,
  "timestamp": "[ISO date]",
  "quick_mode": false,
  "agents_generated": [],
  "stack": {
    "language": "[L5 language]",
    "repo_structure": "[L5 repo_structure: monorepo | single-repo]",
    "backend_framework": "[L5 backend framework, e.g. Node.js/Fastify]",
    "frontend_framework": "[L5 frontend framework or null if none]",
    "database": "[L5 database or null]",
    "hosting": "[L5 hosting platform]"
  },
  "paths": {
    "backend": "[L5 packages.backend path, e.g. packages/api/src]",
    "frontend": "[L5 packages.frontend path or null]",
    "health_endpoint": "[from governance.config.yaml or /health default]",
    "constitution": "docs/core/spec.[project-slug].core.constitution.md"
  },
  "packages": [],
  "env_vars": [],
  "boundary_rules": [],
  "claude_md_required_headings": {
    "framework": ["## Git & Deploy", "## Task Management", "## SDD", "## Model Routing", "## Agent Dispatch"],
    "project_specific": []
  },
  "genesis_skill_generation": "Gen23" // Update genesis_skill_generation when upgrading the skill to a new generation
}
```

**[INTERNAL — MANDATORY READ GATE]:** Immediately after writing the checkpoint above, run: `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase6.md`. Do NOT present any Phase 6 content to the developer until this Read completes. This is required — not optional.

**[INTERNAL] Active state recap — output this block in your response after the checkpoint write:**

```
[ACTIVE STATE — Phase 5 complete]
project: [project_name] | brownfield: [true/false] | lang: [language]
actors: [actor names, comma-sep] | risks: [risk categories, comma-sep]
stack: [language]/[repo_structure]/[hosting]
next: Phase 6 — CI Pipeline
```

**Note:** This v1.2 schema enables `/genesis-sync` drift detection. The `phase_in_progress` field (new in v1.2) supports recovery when a session is interrupted mid-phase.
- `packages[]` — nombres de carpeta de paquetes bajo `packages/` (e.g. `["api", "web", "shared"]`; `[]` para single-repo)
- `env_vars[]` — nombres de variables requeridas al startup (e.g. `["STRIPE_SECRET_KEY", "DATABASE_URL"]`); extraer de L5 `external_deps[]`
- `boundary_rules[]` — derivar desde `hard_constraints[]` de governance.config.yaml con `check: "import_boundary"` (formato: `{"from": "packages/web/src", "must_not_import": ["@project/scoring"]}`)
- `agents_generated[]` — lista de nombres de archivo de agentes generados en Phase 4b (sin extensión .md; e.g. `["backend-engineer", "frontend-engineer"]`)
- `claude_md_required_headings` — derivar leyendo el CLAUDE.md generado en Phase 4: extraer todos los `## ` headings y clasificarlos como `framework` (headings estándar del skill) o `project_specific` (headings propios del proyecto). Reemplazar el `project_specific: []` del template con los headings reales encontrados.

---

## SESSION 1 COMPLETE

After Phase 5 is approved, announce:

```
Session 1 complete.

Your project now has functional governance:
  ✅ Constitution — the project's highest-authority document
  ✅ governance.config.yaml — parameterizes all automated checks
  ✅ CLAUDE.md — AI operating instructions
  ✅ Agent definitions — .claude/agents/ populated for your project
  ✅ Document registry — all artifacts tracked (D20 passes)
  ✅ Git commit/push discipline active

What's not set up yet (Session 2):
  - CI pipeline (automated checks on every PR)
  - First governance audit (verifying everything is coherent)

Available at any time after Session 1:
  /genesis-sync — detects drift between genesis baseline and current project state
                  (run it when you add packages, change env vars, or modify the stack)

Continue to Session 2 now, or come back later?
(Session 2 takes approximately 60 minutes)
```

If developer chooses to stop: remind them to commit the files created.

**Para commitear los artifacts de Session 1:**
```bash
git add docs/core/spec.[project-slug].core.constitution.md \
        governance.config.yaml \
        CLAUDE.md \
        .claude/agents/ \
        docs/_registry/document-registry.md \
        docs/intake/genesis-checkpoint.json \
        scripts/validate-doc-registry.ts \
        scripts/constitution-checks.ts
git commit -m "chore(governance): Session 1 — constitution, config, CLAUDE.md, registry"
```
(Listar solo los archivos efectivamente escritos durante esta sesión. Si Phase 4b no generó agentes, omitir `.claude/agents/`.)

**Artefactos condicionales — incluir si fueron generados durante esta sesión:**
```bash
# Si has_ai_outputs=true:
git add docs/ai/model-card.[project-slug].md
# Si compliance_risk >= MEDIUM con datos personales:
git add docs/compliance/dpia.[project-slug].md
git add docs/compliance/privacy-by-design.[project-slug].md
# Si security_risk >= MEDIUM:
git add docs/security/threat-model.[project-slug].md
# Si has_performance_sla=true:
git add docs/ops/slo-sli.[project-slug].md
```

If developer chooses to continue: proceed to Phase 6.
> [INTERNAL] If developer continues to Session 2 now: Read `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase6.md` — do NOT proceed without loading that file first.

---

