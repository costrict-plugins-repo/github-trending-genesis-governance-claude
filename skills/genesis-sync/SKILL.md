---
name: genesis-sync
description: Detects governance drift in Claude Code projects. Use when the user runs /genesis-sync, when checking for divergence between current project state and the baseline in docs/intake/genesis-checkpoint.json, or after dependency/schema/agent changes. Reports findings by severity (HIGH/MEDIUM/LOW) across 8 drift dimensions (packages, Dockerfile, env vars, agents, constitution path, checkpoint schema, registry, versioning) and offers auto-fixes. Run AFTER /genesis-governance completes, never before.
disable-model-invocation: true
---

# /genesis-sync — Governance Drift Detector

**Detecta divergencia entre el estado actual del proyecto y el baseline generado por `/genesis-governance`.**

Análogo a `terraform plan`: muestra qué cambió, qué necesita ser regenerado, qué puede ser auto-corregido.

---

## Precondiciones

Read: `docs/intake/genesis-checkpoint.json`

- Si no existe: "No se encontró genesis-checkpoint.json. Ejecutá `/genesis-governance` primero para bootstrappear el proyecto."
- Si existe pero el campo `"genesis_version"` no es `"1.1"` ni `"1.2"` (o no existe): "El checkpoint fue generado con genesis v1.0, que no incluye datos de sync estructural. ¿Querés que actualice el checkpoint ahora? (Leeré el estado actual del proyecto para construirlo — s/n)"
  - Si confirma: ejecutar **Checkpoint Migration** al final de este documento y reiniciar desde Phase 1.
  - Si no confirma: abortar con "Correcto. Cuando estés listo, ejecutá `/genesis-sync` de nuevo."
- Si checkpoint es válido (v1.1+): anunciar "Ejecutando drift detection para {project_name}..."

---

## PHASE 1 — READ BASELINE

Anunciar `"[1/5] Leyendo baseline del checkpoint..."`

Read `docs/intake/genesis-checkpoint.json`. Extraer:

```
packages[]          — paquetes esperados en packages/
stack.*             — language, backend_framework, frontend_framework, database, hosting
paths.*             — backend, frontend, health_endpoint, constitution
env_vars[]          — variables de entorno declaradas en genesis
agents_generated[]  — agentes generados en Phase 4b
boundary_rules[]    — reglas de imports prohibidos
```

Si algún campo está ausente → anotar como `UNKNOWN` para esa dimensión (no abortar).

---

## PHASE 2 — SNAPSHOT CURRENT STATE

Anunciar `"[2/5] Snapshotting estado actual del proyecto..."`

Correr estos checks en paralelo:

**Paquetes en disco:**
`ls packages/ 2>/dev/null`

**Cobertura Dockerfile:**
`grep "COPY packages/" Dockerfile 2>/dev/null`

**Env vars activas:**
`grep -E "requireEnv|assertEnv|process\.env\." server/env-validator.ts 2>/dev/null | grep -oE '[A-Z_]{3,}' | sort -u`
Si `server/env-validator.ts` no existe: `grep -rE "process\.env\." src/ 2>/dev/null | grep -oE "'[A-Z_]{3,}'" | tr -d "'" | sort -u`

**Agentes en disco:**
`ls .claude/agents/ 2>/dev/null`

**Constitución en disco:**
Check if `paths.constitution` from checkpoint exists: `ls {paths.constitution} 2>/dev/null`

**Agent scopes (primeras 3 líneas de cada agent file para detectar path changes):**
For each agent in `agents_generated[]`: Read first 10 lines of `.claude/agents/{name}.md` (description line contains scope paths).

---

## PHASE 3 — DIFF (5 dimensiones)

Anunciar `"[3/5] Calculando drift en 8 dimensiones (D-SYNC-1 a D-SYNC-8)..."`

Clasificar cada dimensión como:
- 🔴 HIGH — producción afectada (Dockerfile incompleto, constitución perdida)
- ⚠️ MEDIUM — deuda técnica (env var no documentada, paquete sin agente)
- ℹ️ LOW — hygiene (agente agregado/eliminado manualmente, checkpoint stale)

### D-SYNC-1 — Package drift

Comparar `ls packages/` vs checkpoint `packages[]`:

| Caso | Severidad | Descripción |
|------|-----------|-------------|
| Paquete en disco, NO en checkpoint | MEDIUM | Paquete añadido después de genesis — puede necesitar Dockerfile + agente |
| Paquete en checkpoint, NO en disco | LOW | Paquete eliminado — actualizar checkpoint |

### D-SYNC-2 — Dockerfile drift

Para cada paquete en `packages[]` + paquetes añadidos (D-SYNC-1):
- Verificar `COPY packages/<name>` presente en Dockerfile
- Si falta: HIGH (paquete no se despliega)

### D-SYNC-3 — Env var drift

Comparar env vars activas (env-validator) vs checkpoint `env_vars[]`:

| Caso | Severidad | Descripción |
|------|-----------|-------------|
| Var en env-validator, NO en checkpoint | MEDIUM | Var añadida post-genesis — verificar si está en .env.production.example |
| Var en checkpoint, NO en env-validator | LOW | Var eliminada — actualizar checkpoint |

### D-SYNC-4 — Agent drift

Comparar `ls .claude/agents/` vs checkpoint `agents_generated[]`:

| Caso | Severidad | Descripción |
|------|-----------|-------------|
| Agente en checkpoint, archivo NO en disco | MEDIUM | Agente eliminado — CLAUDE.md puede referenciar un agente inexistente |
| Agente en disco, NO en checkpoint | LOW | Agente añadido manualmente — agregar a checkpoint |

### D-SYNC-5 — Constitution drift

- Archivo en `paths.constitution` existe → ✅
- Archivo NO existe → HIGH (CLAUDE.md referencia un archivo que no existe)

### D-SYNC-6 — CLAUDE.md structural drift

Verificar que las secciones esperadas existen como headings en `CLAUDE.md`.

**NO hashear contenido. NO comparar texto. Solo verificar presencia de headings.**

Secciones `[FRAMEWORK]` requeridas (HIGH si falta alguna):
- Buscar headings: `## Git`, `## Task`, `## SDD`, `## Model Routing`, `## Agent Dispatch`

Secciones `[PROJECT-SPECIFIC]` declaradas en `governance.config.yaml` bajo `checks.forbidden_imports` / `domain_audit` (MEDIUM si falta alguna):
- `## Architecture`, `## .env`, `## Key Commands` (o equivalentes)

Si `claude_md_required_headings[]` está presente en el checkpoint (schema v1.2): usar esa lista como fuente de verdad.
Si el checkpoint no tiene `claude_md_required_headings` (schema < v1.2): usar los headings por defecto listados arriba.

| Caso | Severidad |
|------|-----------|
| Sección [FRAMEWORK] faltante | HIGH |
| Sección [PROJECT-SPECIFIC] faltante | MEDIUM |

**N/A:** Si `CLAUDE.md` no existe en disco → anotar como HIGH + sugerir ejecutar Phase 4 de genesis.

### D-SYNC-7 — governance.config.yaml vs constitution consistency

Verificar que `hard_constraints[]` en `governance.config.yaml` tiene al menos una entrada por cada `MUST NOT` en la constitution (`paths.constitution`).

```
1. Read governance.config.yaml → extraer hard_constraints[] (campo description: de cada entrada)
2. Read paths.constitution → grep "MUST NOT" → lista de invariants (texto completo de cada línea)
3. Para cada MUST NOT invariant:
   a. Extraer el sustantivo principal del invariant (ej: "MUST NOT log PII" → "PII", "log")
   b. Si ALGÚN hard_constraint tiene description que contiene al menos uno de esos sustantivos clave → match encontrado → ✅
   c. Si NINGÚN hard_constraint hace match → MEDIUM finding: "MUST NOT sin enforcement: [texto del invariant]"
```

**Nota de matching:** La comparación es semántica por sustantivo clave, no literal. Ejemplos de match correcto:
- MUST NOT: "MUST NOT log fields containing PII (email, password, token)" ↔ hard_constraint: `{description: "no PII in logs"}` → match por "PII"
- MUST NOT: "MUST NOT allow cross-tenant data access" ↔ hard_constraint: `{description: "tenant isolation — no cross-tenant queries"}` → match por "tenant"
- MUST NOT: "MUST NOT import scoring logic in frontend" ↔ hard_constraint: `{check: "import_boundary", from: "packages/web"}` → match por "import" (check type)

**EXCEPCIÓN — N/A** si checkpoint muestra `last_completed` anterior a `"Phase3"`: la constitution existe pero el config aún no fue derivado — estado intermedio válido, no reportar como drift.

### D-SYNC-8 — CI pipeline vs governance.config.yaml

Verificar que los checks activados en `governance.config.yaml` tienen un step correspondiente en `.github/workflows/ci.yml`.

**Detección de modo APPEND (GEN18-F2):** Antes de analizar el ci.yml, leer `genesis-checkpoint.json` → campo `ci_integration_mode`:
- `"append"` → el ci.yml tiene jobs CUSTOM del developer mezclados con jobs de governance. **Solo analizar los jobs que contienen el comentario `# genesis-governance`**. Los jobs sin ese comentario son CUSTOM — marcarlos internamente como `EXCLUDED_FROM_SYNC` y no reportarlos como drift. Si un job de governance no tiene el comentario → finding LOW: `governance-comment-missing` (cosmético, no bloqueante).
- `"replace"` o campo ausente → analizar el ci.yml completo normalmente.

```
1. Read genesis-checkpoint.json → verificar ci_integration_mode
2. Read governance.config.yaml → identificar checks con valor true (e.g., domain_audit, forbidden_imports, server_typecheck)
3. Read .github/workflows/ci.yml → identificar steps por nombre
   - Si ci_integration_mode = "append": filtrar solo steps con comentario # genesis-governance
   - Si ci_integration_mode = "replace" o ausente: analizar todos los steps
4. Por cada check activado sin step correspondiente (en el scope aplicable) → MEDIUM finding
```

| Caso | Severidad |
|------|-----------|
| Check activado en config, sin step en CI (scope aplicable) | MEDIUM |
| Job de governance sin comentario `# genesis-governance` (solo en APPEND mode) | LOW |

**N/A:** Si `.github/workflows/ci.yml` no existe → anotar como LOW ("CI no configurado aún — ejecutar Phase 6 de genesis para generarlo").

---

## PHASE 4 — REPORT

Anunciar `"[4/5] Generando reporte de drift..."`

Mostrar en este formato:

```
## genesis-sync — Drift Report: {project_name}
Baseline: genesis v{genesis_version} — {timestamp}
Sync run: {today}

### Drift findings ({N} total)
[icon + severity + dimension + descripción]
🔴 [HIGH]   D-SYNC-2 — Dockerfile missing: packages/payments sin COPY line
⚠️ [MEDIUM] D-SYNC-1 — Paquete nuevo: packages/workers añadido post-genesis
⚠️ [MEDIUM] D-SYNC-3 — Env var nueva: STRIPE_KEY en env-validator, no en baseline
⚠️ [MEDIUM] D-SYNC-4 — Agente eliminado: .claude/agents/devops-engineer.md no encontrado
ℹ️ [LOW]    D-SYNC-4 — Agente nuevo (manual): analytics-agent.md no registrado en checkpoint

Si sin findings: "✅ Sin drift — proyecto alineado con baseline genesis v{genesis_version}."

### Auto-fixes disponibles
1. [D-SYNC-2] Agregar a Dockerfile (antes de RUN pnpm install):
   COPY packages/payments/package.json ./packages/payments/
   COPY packages/payments ./packages/payments
2. [D-SYNC-3] Agregar STRIPE_KEY a .env.production.example + actualizar checkpoint
3. [D-SYNC-4] Eliminar devops-engineer de checkpoint agents_generated[]
4. [D-SYNC-4] Agregar analytics-agent a checkpoint agents_generated[]
5. [D-SYNC-1] Agregar workers a checkpoint packages[]

[N] correcciones automáticas. [M] requieren intervención manual.

**Si N=0 y M=0:** No hay nada que aplicar. Saltar la pregunta de confirmación e ir directamente al anuncio final de sync completo.

**Si N>0 o M>0:**
¿Aplicar las correcciones automáticas?
  s         — aplicar todas
  n         — no aplicar ninguna
  [número(s)] — aplicar solo esas (ej: "1 3" aplica la corrección #1 y la #3)
```

**Próxima sync recomendada:**
  — Al agregar un paquete nuevo al workspace
  — Al agregar variables de entorno requeridas al servidor
  — Al cambiar el stack (nueva base de datos, nuevo proveedor de deployment)
  — Trimestralmente como parte de la Governance Cadence

Esperar confirmación antes de Phase 5.

---

## PHASE 5 — FIX

Solo ejecutar después de confirmación ("s", "si", "sí", "yes", o lista de números separados por espacio).
Si el developer ingresó números → aplicar solo las correcciones correspondientes a esos números.

### Fix routing

| Finding | Agente | Acción |
|---------|--------|--------|
| D-SYNC-2 — Dockerfile missing | git-ops | Mostrar líneas exactas a agregar. Pedir confirmación antes de editar. |
| D-SYNC-3 — Env var nueva, no en .env.production.example | git-ops | Agregar `NEW_VAR=` a `.env.production.example` |
| D-SYNC-3 — Var eliminada (en checkpoint, no en código) | git-ops | Actualizar `env_vars[]` en genesis-checkpoint.json |
| D-SYNC-4 — Agente eliminado | git-ops | Eliminar de `agents_generated[]` en checkpoint |
| D-SYNC-4 — Agente nuevo manual | git-ops | Agregar a `agents_generated[]` en checkpoint |
| D-SYNC-1 — Paquete nuevo | git-ops | Agregar a `packages[]` en checkpoint |
| D-SYNC-1 — Paquete eliminado | git-ops | Eliminar de `packages[]` en checkpoint |
| D-SYNC-5 — Constitution no encontrada | main instance | Preguntar: "¿La constitución fue movida? ¿Cuál es la ruta actual?" → actualizar `paths.constitution` |
| D-SYNC-6 — Sección [FRAMEWORK] faltante en CLAUDE.md | main instance | Anunciar sección faltante. Sugerir ejecutar Phase 4 brownfield path de genesis para insertarla. |
| D-SYNC-6 — Sección [PROJECT-SPECIFIC] faltante | git-ops | Agregar heading faltante y contenido mínimo en posición semántica correcta |
| D-SYNC-7 — MUST NOT sin hard_constraint correspondiente | main instance | Mostrar invariant sin enforcement. Sugerir agregar entrada en `hard_constraints[]` de governance.config.yaml. |
| D-SYNC-8 — Check activado sin step en CI | git-ops | Agregar step faltante en .github/workflows/ci.yml (mostrar step exacto, pedir confirmación) |

### Después de todas las correcciones

Actualizar `genesis-checkpoint.json`:
- Agregar `last_sync: "{ISO date}"`
- Asegurarse que el campo `"genesis_version"` es `"1.2"` (o el valor actual si es mayor — nunca bajar la versión del checkpoint)

Anunciar:
```
✅ Sync completo. genesis-checkpoint.json actualizado.

Resumen:
  [N] findings resueltos automáticamente
  [M] findings requieren intervención manual (listados arriba)
  Último sync: {today}

Próxima sync recomendada:
  — Al agregar un paquete nuevo al workspace
  — Al agregar variables de entorno requeridas al servidor
  — Al cambiar el stack (nueva base de datos, nuevo proveedor de deployment)
  — Trimestralmente como parte de la Governance Cadence
```

---

## Checkpoint Migration (v1.0 → v1.1)

Ejecutar cuando genesis-checkpoint.json existe pero el campo `"genesis_version"` tiene valor distinto de `"1.1"` o no existe.

**Leer el estado actual del proyecto para construir los campos faltantes:**

1. `ls packages/ 2>/dev/null` → `packages[]`
2. `grep -E "requireEnv|assertEnv|process\.env\." server/env-validator.ts 2>/dev/null | grep -oE '[A-Z_]{3,}' | sort -u` → `env_vars[]`
3. `ls .claude/agents/ 2>/dev/null` → para completar `agents_generated[]` si está vacío
4. Read `governance.config.yaml` para extraer:
   - `stack.*` → copiar directamente al campo `stack.*` del checkpoint
   - `paths.*` → copiar directamente al campo `paths.*` del checkpoint
   - `boundary_rules[]` → derivar desde `hard_constraints[]` donde `check: "import_boundary"`: usar `from:` como `boundary_rules[n].from` y `forbidden:` (o `must_not_import:`) como `boundary_rules[n].must_not_import[]`. Si no hay constraints con ese check → `[]`.
5. Read `CLAUDE.md` para extraer los path de packages del agente dispatch

**Escribir la versión migrada de genesis-checkpoint.json:**

Preservar todos los campos existentes. Agregar los campos nuevos. Escribir `genesis_version` con valor `"1.1"` (esta migración es específicamente v1.0 → v1.1).
Agregar comentario en la siguiente línea: `"_migration_note": "Migrado de v1.0 a v1.1 por genesis-sync el {date}"`.

Anunciar: "Checkpoint migrado a v1.1. Re-ejecutando drift detection..."

## Checkpoint Migration (v1.1 → v1.2)

Ejecutar cuando:
- El checkpoint tiene `genesis_version` con valor `"1.1"`, O
- El checkpoint tiene `genesis_version` igual a `"1.2"` Y el campo `claude_md_required_headings` no existe o es null.

En ambos casos, el objetivo es asegurar que `claude_md_required_headings` esté poblado en el checkpoint.

**Campo nuevo: `claude_md_required_headings[]`**

Derivar desde el template de CLAUDE.md generado en Phase 4 de genesis. Si Phase 4 ya fue ejecutada:
1. Read `CLAUDE.md` existente
2. Extraer todos los headings `## ` presentes
3. Clasificar como `[FRAMEWORK]` (headings estándar del skill) o `[PROJECT-SPECIFIC]` (headings del proyecto)
4. Escribir ambas listas en el checkpoint

```json
{
  "genesis_version": "1.2",
  "claude_md_required_headings": {
    "framework": ["## Git & Deploy", "## Task Management", "## SDD", "## Model Routing", "## Agent Dispatch"],
    "project_specific": []
  }
}
```

Si Phase 4 aún no fue ejecutada (last_completed < "Phase4"): dejar `claude_md_required_headings` como `null` hasta que Phase 4 complete.

Anunciar: "Checkpoint migrado a v1.2. D-SYNC-6 ahora usa lista de headings requeridos del checkpoint."

---

## Error handling

**Si `packages/` no existe:** Proyecto es single-repo (no monorepo) — D-SYNC-1 y D-SYNC-2 no aplican. Anotar como N/A.

**Si `Dockerfile` no existe:** D-SYNC-2 no aplica (proyecto sin containerización). Anotar como N/A.

**Si `server/env-validator.ts` no existe:** D-SYNC-3 usa fallback grep en `src/`. Si fallback también vacío, anotar D-SYNC-3 como LOW ("No se pudo detectar env vars — validar manualmente").

**Si `.claude/agents/` vacío:** D-SYNC-4 no aplica. Anunciar: "No hay agentes en .claude/agents/ — considera ejecutar Phase 4b de genesis-governance para generarlos."

**Si genesis-checkpoint.json tiene `packages` vacío (`[]`):** Marcar D-SYNC-1 como WARN (`"genesis_version": "1.1"` presente pero `packages[]` incompleto). Sugerir migration manual.
