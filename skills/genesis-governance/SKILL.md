---
name: genesis-governance
description: Governance framework genesis protocol for new or existing Claude Code projects. Use when the user runs /genesis-governance, when setting up governance from scratch (greenfield), when re-engineering governance in an existing repo (brownfield), or when resuming a checkpoint at docs/intake/genesis-checkpoint.json. Produces constitution, governance.config.yaml, CLAUDE.md, document registry, CI pipeline, and first audit — all derived from a 5-layer intake.
disable-model-invocation: true
---

# /genesis-governance — Governance Framework Genesis Protocol

When this skill is invoked, run the full genesis protocol to set up the governance framework for a new project. The protocol has two sessions. Do not skip phases or reorder them.

**This skill works with only `bootstrap.CLAUDE.md` configured — no prior governance setup is required.**

---

## CRITICAL RULES — read before anything else

> **[INTERNAL — high priority, applies at all times]**

1. **Checkpoint read first (G2-T4):** `Read: docs/intake/genesis-checkpoint.json` BEFORE asking any question. If it exists → resume from `last_completed`. Never skip this.
2. **Brownfield L5 stack source:** if `brownfield: true` AND `governance.config.yaml` was found → use it as PRIMARY source (Sub-caso A). GEN17-F2 disk commands run for validation only, not as primary source.
3. **Never overwrite without backup:** Read existing file → Write backup → Read backup to verify → if verify empty/fails → ABORT and announce. Do not proceed.
4. **Write intake before announcing it:** `Write: docs/intake/intake.[project-slug].layers-1-5.md` MUST execute before announcing "Documento de Contexto de Negocio listo". Never announce first.
5. **Handler 11 allowlist:** only valid if `last_completed` ∈ `{"L5","Phase2","Phase3","Phase4","Phase5","Phase6","Phase7"}`. Values `"L1"–"L4"` are invalid → request completing intake first.
6. **Batch gate (≥4 brownfield changes):** present ALL proposed changes before applying any. Partial approval response (e.g. "only 1 and 3") → fall back to one-by-one for ALL changes.
7. **MANDATORY READ GATE at phase transitions:** after each phase checkpoint write, `Read` the next phase file before generating any content for that phase.

---

## Meta-regla de auto-gobernanza — OBLIGATORIA

**Este skill se gobierna a sí mismo con las mismas reglas que impone a otros proyectos.**

Toda fase de este skill DEBE cumplir los siguientes 4 puntos. Una fase que no los cumple todos no está terminada:

1. **Precondiciones declaradas** — toda fase tiene un bloque `**Preconditions:**` que lista qué debe ser verdad antes de que la fase pueda empezar (outputs confirmados de fases anteriores, información requerida, decisiones tomadas). Si una precondición no se cumple, la fase no puede iniciar — no se avanza con inputs incompletos.

2. **Acceptance criteria presentes** — toda fase tiene un bloque `**Phase N — Acceptance criteria:**` con ítems verificables antes de declarar la fase completa. Cada ítem debe ser comprobable (no vago). Una fase sin acceptance criteria no está terminada.

3. **Derivación explícita** — si una fase produce un output (YAML, documento, lista), debe existir una tabla o algoritmo que derive ese output de inputs anteriores confirmados. No se permiten outputs "de memoria" o genéricos desconectados de las fases previas.

4. **Gate de aprobación** — toda fase termina con "Wait for approval" o equivalente. El desarrollador confirma el output antes de continuar a la siguiente fase.

**Al modificar este skill:** antes de declarar el cambio completo, verificar que toda fase afectada cumple los 4 puntos. Si alguno falta, completarlo en el mismo cambio — nunca en una sesión posterior.

**Test gate obligatorio:** toda modificación a cualquier archivo dentro de `skills/genesis-governance/` o `scripts/test-genesis-governance.ts` requiere correr el test suite antes de declarar terminado:
```
pnpm tsx scripts/test-genesis-governance.ts 2>&1 | tail -5
```
Si algún test falla, el cambio no está terminado. No hay excepciones aunque el cambio parezca trivial.

---

## Regla de contenido interno — OBLIGATORIA PARA EL MODELO

Este skill distingue dos tipos de contenido:

**INTERNO (nunca mostrar al desarrollador):**
Los siguientes bloques son para verificación interna del modelo. Aplicarlos silenciosamente. No mostrarlos al desarrollador bajo ninguna circunstancia:
- Bloques `**[Layer/Phase N] — Acceptance criteria:**` y sus checklists
- Bloques `**[Layer N] confirmed output:**` con sus tablas de campos y `Downstream consumer`
- Notas `**Internal derivation (not exposed as confirmed output):**`
- Notas de `**Rejection rule:**` y `**Recovery protocol:**` — aplicar, no citar
- Referencias `(G-xx)` y `**P6 abstraction constraint:**` — son notas de diseño
- La sección `## Meta-regla de auto-gobernanza` — es para autores del skill
- `**Layer N closure summary:**` — presentar como frase natural, no como template
- `NAVIGATION FOOTER REMINDER` blocks — INTERNAL (never render the rule text itself to the developer; only render the resulting footer at the appropriate gate)
- `BROWNFIELD CHECK` blocks — INTERNAL (never render to developer; apply silently and announce result only)

**VISIBLE AL DESARROLLADOR:**
- Mensajes de orientación y propuestas
- Preguntas directas y ejemplos de formato de respuesta
- Tablas de datos derivados que el desarrollador debe confirmar
- Feedback sobre sus respuestas

---

## Cross-reference index — consultar antes de editar este skill

| Layer/Phase | Lee | Escribe | Consumidores downstream clave |
|-------------|-----|---------|-------------------------------|
| L1 | — | project_name, pain_point, value_prop, business_model, actors[], data_boundaries, geo_scope, project_scope | L2 (derivación actores), L4 (activación riesgos), todos los frontmatter |
| L2 | L1 output | actor_profiles[], critical_path | L3 (derivación capacidades), L4 (riesgo availability), constitución §3-4 |
| L3 | L2 actor_profiles | capabilities[], structural_flags | L4 (sensibilidad riesgo), L5 (recomendaciones stack), constitución §5 |
| L4 | L3 structural_flags + L1 risk signals | business_risks[], closing summary | Phase 2 (constitución §3-4), Phase 3 (activación config) |
| L5 | L4 closing summary | tech_stack, external_deps[] | Phase 2 (§5-8), Phase 3 (derivación config), Phase 4 (CLAUDE.md) |
| Phase 2 | Todo L1-L5 | constitution file | Phase 3 (hard_constraints), Phase 4 (reuse invariants) |
| Phase 3 | Phase 2 constitution | governance.config.yaml | Phase 4 (referencia config), Phase 6 (CI deriva de él) |
| Phase 4 | L1-L5 + Phase 2-3 | CLAUDE.md | Phase 5 (registry entry), CI (typecheck, forbidden imports) |
| Phase 5 | Todos los artifacts creados | document-registry.md | Phase 7 (D20 audit check) |
| Phase 6 | Phase 3 config | ci.yml, `docs/ops/post-mortem-template.md`, `docs/ops/on-call-runbook.md` (if `has_infra_complexity=true`), `docs/ops/release-checklist.md` (if `has_performance_sla=true`) | Phase 7 (CI debe correr) |
| Phase 7 | Todos los artifacts | governance-audit-[date].md | — |

**Regla de edición:** antes de modificar cualquier layer/phase, identificar en la columna "Consumidores downstream" qué otras secciones se ven afectadas. Editar L4 → verificar Phase 2 §3-4. Editar Phase 2 preconditions → verificar Phase 3.

---

## Backtrack Protocol

> **Aplicar cuando el developer quiere corregir información de una layer anterior, en cualquier momento de la sesión.**

El skill detecta el trigger cuando el developer dice cosas como: "en realidad en L[x]...", "me equivoqué cuando dije...", "necesito cambiar [campo]", "eso no es correcto, [campo] es [valor]" referenciando algo de una layer ya confirmada.

Hay dos sub-casos con costos distintos. Evaluar cuál aplica antes de responder.

---

### Navigation footer — mostrar en todo gate de confirmación (GEN18-F5)

> **[INTERNO — regla transversal]** Al final de **toda** presentación de síntesis o confirmed output que espera confirmación del developer (cierre de layer L1-L5, inicio de cada Phase 2-7, G35 closure summary), agregar un footer de navegación mínimo:

```
---
📍 [posición actual]  ◀ [opción atrás, si existe]  ·  [opción siguiente]
```

Ejemplos según contexto:
- Al cerrar L2: `📍 Layer 2/5  ◀ back to L1  ·  ok → continue to L3`
- Al cerrar L4: `📍 Layer 4/5  ◀ back to L3  ·  ok → continue to L5`
- Al inicio de Phase 3: `📍 Phase 3/7  ◀ back to Phase 2  ·  ok → continue with Phase 3`

**Reglas de navegación:**
- `"yes" / "ok" / "correct" / Enter` → proceed to the next step. Always available.
- `"back"` → invoke Backtrack Protocol Sub-case A (if in intake) or Sub-case B (if in phases). Always available except at L1 (first step) and Phase 2 (first phase).
- **Forward skip** — available ONLY if the developer reached this position via backtrack (i.e., came from a more advanced point in the current session). Show additional option: `"skip → [origin point]"`. The developer CANNOT skip beyond the origin point — only return to where they were before the backtrack. **Never show this option if the developer has never been further ahead.**

**backtrack_origin — simplified tracking rules:**

Rule 1 — SET: When developer initiates backtrack from origin O to an earlier point:
  Set `backtrack_origin: "O"` in checkpoint immediately.
  During intake (L1-L5): O = "L[z]" (the layer being left). During phases: O = "Phase[N]" (the phase being left — Sub-case B).

Rule 2 — SHOW SKIP: Show `skip → [O]` (forward skip option) in every footer UNTIL the developer
  has re-confirmed origin O in the current session.
  Exception: do NOT show the forward skip option if the session was resumed from checkpoint (reentry) —
  the conversation context that established the backtrack is gone.

Rule 3 — CLEAR: Clear `backtrack_origin` (set to null) when EITHER:
  (a) Developer confirms origin O (returned to the point they started from)
  (b) Developer completes L5 and transitions into Phase 2 for the first time in the session
    (intake→phases transition — any intake backtrack_origin is no longer relevant after this point)

Do NOT clear on intermediate layer confirmations between the backtrack start and origin O.
Do NOT clear in checkpoint file — only in session state.

**Checkpoint write:** When the developer backtracks during intake, add `"backtrack_origin": "L[z]"` to the checkpoint (Rule 1). This enables recovery if context is exhausted mid-backtrack.

**Position one-liners (include after `📍` marker) — GEN18-F7:**

| Position | One-liner |
|----------|-----------|
| L1 | What the project is, who it's for, and why it matters |
| L2 | Who uses the system and what's the sequence that must never break |
| L3 | What the system does and what technical signals that implies |
| L4 | What can go wrong and what governance rules are needed |
| L5 | Tech stack, external dependencies, and fixed constraints |
| Phase 2 | Constitution — the rules the system cannot violate |
| Phase 3 | Governance config — thresholds, checks, CI signals |
| Phase 4 | CLAUDE.md — how Claude works in this project |
| Phase 5 | Document registry — inventory of governed artifacts |
| Phase 6 | CI pipeline — automated enforcement on every push |
| Phase 7 | Post-install audit — confirms everything works end-to-end |

Footer format with one-liner (use this format instead of the bare `📍 Layer N/5`):
```
📍 Layer 2/5 — Who uses the system and what's the sequence that must never break (~5 min)
   ◀ back to L1  ·  ok → L3
```

**Cost annotation in footer (Phase 2 onward):**
When showing the footer during Phase 2–7, append `(documents may need updating)` to the back option.
This signals that backtracking from a phase triggers Sub-case B (medium cost).
During intake (L1–L5), no annotation — Sub-case A is low cost.

Example (Phase 4):
```
📍 Phase 4/7 — CLAUDE.md — how Claude works in this project (~15 min)
   ◀ back to Phase 3 (documents may need updating)  ·  ok → Phase 5
```

**Expanded descriptions (use when developer sends `?` or `help` at a position) — GEN18-F7:**

| Position | Expanded description |
|----------|---------------------|
| L1 | **What it covers:** project identity, pain point, value proposition, business model, actors, data boundaries, geographic scope. **What it produces:** `project_name`, `pain_point`, `value_prop`, `business_model`, `actors[]`, `data_boundaries`, `geo_scope`. **Why it matters:** every downstream artifact derives from L1 — constitution, governance config, CLAUDE.md, CI signals. **Estimated time:** ~10 min |
| L2 | **What it covers:** actor profiles derived from L1 actors, critical path — the must-work sequence. **What it produces:** `actor_profiles[]`, `critical_path`. **Why it matters:** L3 derives capabilities from actors; L4 derives availability risks from the critical path. **Estimated time:** ~5 min |
| L3 | **What it covers:** capabilities the system must provide (derived from actor_profiles), structural flags that trigger governance rules. **What it produces:** `capabilities[]`, `structural_flags`. **Why it matters:** structural flags activate specific constitution sections and CI checks. **Estimated time:** ~5 min |
| L4 | **What it covers:** business risks, closing summary. **What it produces:** `business_risks[]`, closing summary. **Why it matters:** risks feed constitution §3-4, Phase 3 config hard_constraints. **Estimated time:** ~8 min |
| L5 | **What it covers:** tech stack, external dependencies, fixed constraints. **What it produces:** `tech_stack`, `external_deps[]`. **Why it matters:** everything in Phases 2-6 derives from the stack. **Estimated time:** ~5 min |
| Phase 2 | **What it covers:** the project constitution — rules that cannot be violated. **What it produces:** `docs/core/[slug].constitution.md`. **Why it matters:** Phase 3 hard_constraints come from here; CLAUDE.md reuses invariants. **Estimated time:** ~15 min |
| Phase 3 | **What it covers:** governance config — thresholds, checks, CI signals. **What it produces:** `docs/governance/governance.config.yaml`. **Why it matters:** CI pipeline derives checks from this file. **Estimated time:** ~10 min |
| Phase 4 | **What it covers:** CLAUDE.md — how Claude works in this project. **What it produces:** `CLAUDE.md`. **Why it matters:** all Claude Code sessions in this project follow this file. **Estimated time:** ~15 min |
| Phase 5 | **What it covers:** document registry — inventory of all governed artifacts. **What it produces:** `docs/_registry/document-registry.md`. **Why it matters:** Phase 7 audit checks this registry. **Estimated time:** ~5 min |
| Phase 6 | **What it covers:** CI pipeline — automated enforcement on every push. **What it produces:** `.github/workflows/governance.yml`. **Why it matters:** this is the enforcement layer; without it governance is manual-only. **Estimated time:** ~10 min |
| Phase 7 | **What it covers:** post-install audit — verifies all artifacts are consistent. **What it produces:** `docs/audits/governance-audit-[date].md`. **Why it matters:** final confirmation that the governance framework is operational. **Estimated time:** ~10 min |

---

### Sub-case A — Backtrack during intake (L1–L5, before Phase 2)

Low cost: no documents written yet. Only the checkpoint and conversation hold the state.

**Protocolo:**
1. Identificar qué layer contiene el campo a corregir.
2. Re-presentar el confirmed output de esa layer con el campo incorrecto marcado.
3. Aplicar la corrección.
4. Consultar el **cross-reference index** (ver tabla al inicio del skill) para identificar qué campos downstream dependen del campo corregido. Dependencias clave:
   - L1 cambia → revisar L2 (actors[], business_model → actor_profiles[]) y L4 (business_model → activación de riesgos)
   - L2 cambia → revisar L3 (actor_profiles[] → capabilities[], structural_flags)
   - L3 cambia → revisar L4 (structural_flags → sensibilidad de riesgos) y L5 (structural_flags → recomendaciones stack)
   - L4 cambia → revisar resumen de riesgos usado en Phase 2 (si ya se entró en fases → ver Sub-caso B)
   - L5 cambia → solo afecta fases (si ya en Phase 2+ → ver Sub-caso B)
5. Para cada layer ya confirmada con campos afectados: mostrar solo el delta y pedir re-confirmación de esos campos específicos. No rehacer la layer entera.
   ```
   Correction in L[x]. This affects L[y]:
     • [downstream_field] — previous derived value: [X]. New derived value: [Y]. Correct?
   ```
6. Si el developer está en L[z] y el backtrack es a L[x] (x < z): re-confirmar deltas de L[x+1]…L[z-1] antes de continuar L[z].
7. Actualizar el intake document (`docs/intake/intake.[slug].layers-1-5.md`) con los valores corregidos.
8. Actualizar checkpoint: si la corrección invalida layers ya confirmadas, retroceder `last_completed` a L[x-1] hasta que las layers afectadas sean re-confirmadas.

---

### Sub-case B — Backtrack during phases (Phase 2–7, documents already written)

Medium cost: generated documents may become inconsistent with the corrected intake.

**Protocolo:**
1. Identificar qué layer contiene la información incorrecta.
2. Usando el **cross-reference index**, construir la lista de documentos ya escritos que dependen de esa layer:
   - L1 → constitution §1, §3-4 (si tocó actores o modelo de negocio)
   - L2 → constitution §3-4, Phase 3 config (availability risk)
   - L3 → constitution §5, Phase 3 config (flags estructurales), CLAUDE.md §Architecture + §Domain Rules (via structural_flags)
   - L4 → constitution §3-4, Phase 3 config (hard_constraints)
   - L5 → constitution §5-8, governance.config.yaml completo, CLAUDE.md §Architecture + §.env keys, ci.yml, `docs/ops/post-mortem-template.md`, `docs/ops/on-call-runbook.md` (if `has_infra_complexity=true`), `docs/ops/release-checklist.md` (if `has_performance_sla=true`)
3. Mostrar advertencia antes de proceder:
   ```
   Correction in L[x]. The following already-generated documents depend on this information:
     • [document] — affected sections: [list of specific sections]
     • [document] — affected sections: [list of specific sections]

   How do you want to proceed?
   A) Edit those sections directly → tell me exactly what changes
   B) Regenerate the affected sections from the corrected intake → give me the correct value and I'll redo them
   ```
4. Si **A** → editar solo las secciones identificadas en cada documento. No tocar el resto. No crear nuevo backup si ya existe uno del mismo día para ese archivo.
5. Si **B** → aplicar corrección al intake document, re-derivar, regenerar solo las secciones afectadas. Aplicar brownfield safeguard si el documento no tiene backup aún (crear `.backup-YYYY-MM-DD`).
6. Actualizar el intake document con los valores corregidos.
7. **No interrumpir la fase en curso** — anunciar: "Correction applied. Continuing with Phase [N]."

**Special case — correction affects the active phase (draft not yet approved):**
If the corrected layer information affects the artifact currently being drafted
(Phase N is in progress but the developer has not yet confirmed the output):
- Apply the correction to the intake document.
- Regenerate the Phase N draft from the corrected intake.
- Present the updated draft at the gate as if generating for the first time.
- Do NOT announce "continuing" — instead announce: "Correction applied. Regenerating Phase [N] draft with updated information."
This avoids presenting a gate where the developer must approve a document they already know is wrong.

**Precedence rule:** The Special case above takes priority over the "Do NOT interrupt the active phase" instruction when the corrected layer directly feeds the artifact being drafted. Example: L3 `has_backoffice` changes during Phase 4 → the CLAUDE.md draft (which includes a Back Office section) must be regenerated, not continued as-is.

---

## Error Handling

> **Fuente autoritativa de estos handlers.** Esta sección está en `genesis-governance.md` (siempre cargado) para que aplique desde el inicio de la sesión — antes de que las fases 2-7 se carguen. `genesis-governance-phase7.md` tiene una copia de referencia con nota de cross-reference.

**Handler 1 — Respuesta vaga o incompleta en Layer 1:**
No avanzar. Nombrar exactamente qué falta y hacer una pregunta dirigida. No generar documentos con información insuficiente.

**Handler 2 — Más de 3 campos sin definir después del emergency exit warning:**
Marcar como `TBD` y anotar el framework generado como incompleto. Estas secciones necesitan completarse antes de que la gobernanza esté operativa.

**Handler 3 — Derivación rechazada múltiples veces:**
Después de dos rondas de corrección, pedirle al developer que diga explícitamente: "Lo más importante que el framework de gobernanza debe proteger es [X]." Usar eso directamente.

**Handler 4 — Documento generado rechazado:**
Preguntar qué está mal específicamente. Corregir solo la sección identificada. No regenerar el documento completo a menos que el developer lo pida.

**Handler 5 — Developer quiere saltear una fase:**
Permitirlo, pero advertir sobre la implicación en cascada. "Skipping the constitution means governance.config.yaml and CLAUDE.md will be less accurate. Are you sure?"

**Handler 6 — Documentos ya generados conflictúan con fases posteriores:**
Volver al documento más temprano que tiene el conflicto. No parchear documentos posteriores para tapar errores anteriores.

**Handler 7 — Developer pega contenido de CLAUDE.md existente como respuesta a L1:**
If the developer pastes content from an existing CLAUDE.md instead of describing the project: respond in `preferred_language` with this message (translate if needed): "I see you pasted an existing CLAUDE.md. For genesis to work correctly, I need you to describe the project in your own words. Can you tell me: what does the system do, what stack does it use, and what is the main technical or business risk?"
<!-- ES example: "Veo que pegaste un CLAUDE.md existente. Para que genesis funcione correctamente, necesito que me describas el proyecto en tus propias palabras. ¿Puedes contarme: qué hace el sistema, qué stack usa, y cuál es el principal riesgo técnico o de negocio?" -->

**Handler 8 — Skill invocado dos veces sin checkpoint del primer run:**
If the developer says "I already ran genesis before" but `genesis-checkpoint.json` does not exist: respond in `preferred_language` with this message (translate if needed): "I couldn't find `docs/intake/genesis-checkpoint.json`. Two possibilities: (a) the file was not committed to the repository, or (b) this is a new project. Can you verify if `docs/intake/genesis-checkpoint.json` exists in your repository? If it existed and was lost, we can reconstruct the state from `CLAUDE.md` and the constitution if they exist."
<!-- ES example: "No encontré `docs/intake/genesis-checkpoint.json`. Hay dos posibilidades: (a) el archivo no fue commiteado al repositorio, o (b) este es un proyecto nuevo..." -->

**Handler 9 — Developer quiere corregir información de una layer ya confirmada:**
Si el developer referencia una corrección a algo ya confirmado en cualquier layer anterior (durante intake o durante fases) → no improvisar la corrección en el contexto de la conversación. Aplicar el **Backtrack Protocol** (sección anterior). Determinar si es Sub-caso A (durante intake) o Sub-caso B (durante fases) y seguir el protocolo correspondiente.

**Handler 10 — Developer sends `?`, `help`, `manual`, or `overview` — GEN18-F7:**

Recognized at any point in the flow (intake or phases).

| Command | Response |
|---------|----------|
| `?` or `help` | Show the **expanded description** for the current position (from the lookup table in Navigation footer section). End with: "Resume: type 'ok' to continue, 'back' to go back." |
| `manual` | Look for the user manual at `docs/guides/runbook.genesis-governance.user-manual.md` relative to the current project. If found → Read it and show the section for the current position, or Quick Start if no position-specific section exists. If NOT found (typical in user projects — the manual lives in the genesis-governance repository, not in the user project) → respond: "The user manual is not installed in this project. You can find it in the genesis-governance repository at: `docs/guides/runbook.genesis-governance.user-manual.md` — or ask me `?` for a description of the current step." End with: "Resume: type 'ok' to continue." |
| `overview` | Show a compact map of the full flow (L1–L5 + Phases 2–7) with the current position marked with `▶`. End with: "Resume: type 'ok' to continue." |

**`overview` response format:**
```
Genesis Governance — Full flow overview

Intake:
  [completed] L1 — What the project is, who it's for, and why it matters
  ▶ [current]  L2 — Who uses the system and what's the sequence that must never break
  [ ] L3 — What the system does and what technical signals that implies
  [ ] L4 — What can go wrong and what governance rules are needed
  [ ] L5 — Tech stack, external dependencies, and fixed constraints

Generation:
  [ ] Phase 2 — Constitution — the rules the system cannot violate
  [ ] Phase 3 — Governance config — thresholds, checks, CI signals
  [ ] Phase 4 — CLAUDE.md — how Claude works in this project
  [ ] Phase 5 — Document registry — inventory of governed artifacts
  [ ] Phase 6 — CI pipeline — automated enforcement on every push
  [ ] Phase 7 — Post-install audit — confirms everything works end-to-end

Resume: type 'ok' to continue, 'back' to go back.
```

**Handler 11 — Developer wants to regenerate CLAUDE.md only:**

Recognized trigger: developer says "regenerate CLAUDE.md", "update CLAUDE.md", "solo CLAUDE.md", "just the CLAUDE.md", or equivalent intent.

1. Check checkpoint: `Read: docs/intake/genesis-checkpoint.json`

   **Valid `last_completed` values (intake complete — proceed to step 2):**
   `"L5"`, `"Phase2"`, `"Phase3"`, `"Phase4"`, `"Phase5"`, `"Phase6"`, `"Phase7"`

   **Invalid values (intake incomplete — do NOT proceed to step 2):**
   `null`, missing field, `"L1"`, `"L2"`, `"L3"`, `"L4"`
   → Announce: "I need the full intake (L1–L5) before generating CLAUDE.md. Let me resume from where you left off." → apply G2-T4 reentry logic.

2. Read intake file to recover L1–L5 context: `Read: docs/intake/intake.[project_slug].layers-1-5.md`
3. Load Phase 4 instructions: `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase4.md`
4. Apply brownfield safeguard for CLAUDE.md (backup before replacing — see Phase 4 safeguard block).
5. Execute Phase 4 only — skip Phases 2, 3, 5, 6, 7.
6. After Phase 4 completes → checkpoint write rule:
   - If current `last_completed` is `"Phase5"`, `"Phase6"`, or `"Phase7"` → **do NOT write** → announce: "✅ CLAUDE.md regenerated. Checkpoint not updated (already at a later phase)."
   - If current `last_completed` is `"L5"`, `"Phase2"`, `"Phase3"`, or `"Phase4"` → write `last_completed: "Phase4"` → announce: "✅ CLAUDE.md regenerated. Constitution, governance.config.yaml, CI pipeline, and document registry were not changed."

---

## Prerequisites check (run before Phase 1)

Verify that the developer has:
- A new (or existing) project directory
- Claude Code running
- `bootstrap.CLAUDE.md` in place as `CLAUDE.md` (or any CLAUDE.md — the genesis will replace/complete it)
- YAML parser available for Phase 3 auto-verification: `node -e "require('js-yaml')" 2>/dev/null && echo ok` — if fails, install with `npm i js-yaml` or ensure Python 3 + PyYAML (`pip install pyyaml`) as fallback

**Execution order (mandatory — follow this sequence):**
1. **Reentry check first:** `Read: docs/intake/genesis-checkpoint.json` — if file exists with `last_completed` set → skip to G2-T4 reentry rules below. If file does not exist → continue to step 2.
2. **Language check:** Apply silently — see the language detection block below.
3. **Disk scan:** Run U9 commands in parallel → classify as greenfield / brownfield.
4. **Proceed:** If no checkpoint and greenfield → Step 1.0 (project name) → ORIENTATION → Layer 1.

**Language detection (apply silently after reentry check, before disk scan):**

Read the developer's first message language:
- If checkpoint exists and has `preferred_language` → use it. Skip detection entirely.
- If the message is in English or no prior message exists → set `preferred_language: "en"`, proceed silently without asking.
- If the message is clearly in another language (Spanish, Portuguese, French, etc.) → confirm:
  "I detected you're writing in [language]. Would you like to continue in [language]? (yes / no — default: yes)"
  If yes (or default) → `preferred_language: "[detected-language-code]"`. If no → `preferred_language: "en"`.
- Write `preferred_language` to `docs/intake/genesis-checkpoint.json` (create file if not exists, add field if exists).

**Clarification — "first message" definition:**
"First message" means the developer's first response AFTER the skill is invoked
(typically their answer to "What is the name of your project?").
If the developer invokes the skill without writing any text, ask "What is the name of your project?"
first — then detect the language of THAT response.
Default to "en" if the response is in English, a single word, or ambiguous.
Only trigger the language confirmation if the response is clearly in a non-English language
(full sentences, non-ASCII characters typical of a specific language, etc.).

**Language rule (apply to every developer-facing response):**

Present all conversational messages, questions, announcements, confirmations, error handlers, navigation footer text, and help responses in `preferred_language` from the checkpoint.
The source text in this skill is English — translate when speaking to the developer.

NEVER translate:
- Technical labels: APPEND, REPLACE, CLAUDE.md, ci.yml, genesis-checkpoint.json, etc.
- Generated artifact content (constitution, CLAUDE.md, governance.config.yaml, ci.yml)
- Code blocks and shell commands
- JSON/YAML field names
- Section headings in generated documents
- Internal notes marked [INTERNAL] or with `>` prefix

**U9 — AUTO-DETECTION: run these in parallel before asking anything:**

```bash
ls CLAUDE.md 2>/dev/null && wc -l CLAUDE.md
ls docs/core/*.constitution.md 2>/dev/null
ls docs/intake/genesis-checkpoint.json 2>/dev/null
ls .github/workflows/ 2>/dev/null
ls packages/ 2>/dev/null
cat package.json 2>/dev/null | grep '"name"'
```

**Classification logic (apply silently — do not show to developer):**

| Disk state | Classification | Action |
|-----------|---------------|--------|
| `genesis-checkpoint.json` found | `resume` | Handled by G2-T4 reentry below — skip brownfield check |
| `CLAUDE.md` > 10 lines OR `constitution` file found OR `governance.config.yaml` found | `brownfield` | Announce + confirm before L1 |
| `CLAUDE.md` ≤ 10 lines (bootstrap only) AND none of the above found | `greenfield` | Continue silently to L1 |

**If `brownfield` detected — announce before L1:**

**[INTERNAL] Before showing the brownfield message, evaluate if the project already has complete genesis governance (GEN18-F3):**
If all 3 artifacts are found on disk simultaneously: `CLAUDE.md` (mature) + `*.constitution.md` file + `governance.config.yaml` → this is likely a project already governed by genesis whose checkpoint was deleted or never committed. In that case, show a differentiated message:

```
I found what appears to be a project already governed by genesis:
  ✅ CLAUDE.md — N lines
  ✅ constitution — [filename]
  ✅ governance.config.yaml
  ❌ genesis-checkpoint.json — not found

What happened to the checkpoint?
  A) It was deleted or never committed → I can reconstruct it from the existing files (nothing gets regenerated)
  B) This is a different brownfield project that happens to match the genesis structure → continue with the normal brownfield process
```

- If developer chooses **A** → Read `CLAUDE.md` + constitution file + `governance.config.yaml` to infer `project_name`, `stack` and present artifacts → write `docs/intake/genesis-checkpoint.json` with `last_completed: "Phase7"`, `phase_in_progress: null`, `brownfield: true`, and inferred fields → announce: "✅ Checkpoint reconstructed. Your project already has full governance. You can run `/genesis-sync` to check for drift since the last session." → **do not continue to intake**.
- If the developer chooses **B** → continue with the standard brownfield message below.

If only 1 or 2 of the 3 artifacts are found (partial governance without the complete set) → standard brownfield message:

> [INTERNAL] Translate the following announcement to `preferred_language` before presenting to the developer.

```
Escaneé tu proyecto y encontré:
  [✅ CLAUDE.md — N líneas / ❌ CLAUDE.md — no encontrado]
  [✅ constitución — nombre archivo / ❌ constitución — no encontrada]
  [✅ .github/workflows/ — N archivos / ❌ CI — no encontrado]
  ❌ genesis-checkpoint.json — no encontrado

→ This looks like an existing project with partial governance. I'll run in brownfield mode.

⚠️  Impacto sobre los archivos existentes:
  [Para cada archivo encontrado en disco, listar qué le va a pasar:]
  • CLAUDE.md → se generará uno nuevo completo; el original se preservará en CLAUDE.md.backup-[fecha]
  • .github/workflows/ci.yml → en Phase 6 elegirás: APPEND (agregar jobs de governance al tuyo) o REPLACE (generar nuevo completo; tu original en ci.yml.backup-[fecha])
  • constitución existente → se sobreescribirá en Phase 2; original preservado en [nombre].backup-[fecha]
  • governance.config.yaml (si existe) → Phase 3 mostrará un diff de los campos propuestos — aprobás cada cambio antes de que se aplique
  • governance.config.yaml (si no existe) → se creará desde cero
  • document-registry.md (si no existe) → se creará desde cero

  ¿Confirmás continuar con este plan? Si no querés reemplazar algún archivo, decime cuál y vemos cómo proceder.
```
<!-- EN example: "I scanned your project and found: ..." (translate the Spanish above to preferred_language) -->

- Developer confirms explicitly → set `brownfield: true` for all subsequent checkpoint writes. **Do NOT proceed on silence — wait for an affirmative response.**
- Developer says "nuevo" → override to `greenfield`, proceed normally
- Developer says "no quiero que se toque X" → acknowledge: "Understood. [X] will not be modified. Note that without regenerating [X], the governance may remain partially configured." Continue brownfield with the stated exclusion.

> **[INTERNAL] Brownfield pre-population — run silently after developer confirms brownfield mode:**
> Read the following files in parallel (only the ones found on disk during U9):
> - `governance.config.yaml`
> - `docs/core/*.constitution.md`
> - `CLAUDE.md`
>
> Use the field mapping table below to determine what can be pre-populated vs what must still be asked.
> Do NOT show this extraction to the developer. Use it silently when each layer starts.
>
> **Field mapping — what each file provides and what it does NOT:**
>
> | Source | Key/section | → Layer | Schema field | Pre-populate? |
> |--------|-------------|---------|--------------|---------------|
> | governance.config.yaml | `actors[].name` + `actors[].type` | L2 | `actor_profiles[].name` + `.type` | ✅ Yes — present actor list |
> | governance.config.yaml | (not present) | L2 | `use_moment`, `core_task`, `key_info_needed`, `key_info_produced` | ❌ No — ask for each actor |
> | governance.config.yaml | `stack.language`, `stack.framework`, `stack.database`, `stack.hosting`, `stack.repo_structure`, `stack.queues`, `stack.package_manager` | L5 | direct fields | ✅ Yes — present as full table |
> | governance.config.yaml | (not present) | L5 | `external_deps[]` (integrations, APIs) | ❌ No — always ask |
> | governance.config.yaml | `ai_output_policies[0].mode` | L3 | `ai_outputs` enum | ✅ Yes — use exact mode value |
> | governance.config.yaml | `checks.bundle.enabled: true` | L3 | `has_public_api = true` | ✅ Yes (inferred) |
> | governance.config.yaml | `checks.domain_audit: true` | L3 | confirms `ai_outputs != "none"` | ✅ Yes (cross-check with ai_output_policies) |
> | constitution §2 | capabilities bullet list | L3 | `capabilities[]` | ✅ Yes — present full list |
> | constitution §2 | structural flag mentions | L3 | `has_backoffice`, `has_rbac`, etc. | ⚠️ Partial — confirm, do not assume |
> | constitution §3 | invariants list | L4 | risk categories context only | ⚠️ Partial — present as context; still ask failure_scenario, severity |
> | CLAUDE.md | Architecture/boundaries section | L5 | `boundary_rules[]`, `module_boundaries` | ✅ Yes if section exists |
>
> **Presentation format per layer:**
> - L2: "I found these actors in `governance.config.yaml`: [list name + type]. I'll use them as the base. For each actor I still need: use_moment, core_task, key info. Starting with [first actor]..."
> - L3: "From `governance.config.yaml` I can infer: ai_outputs=[mode], has_public_api=[value]. From the constitution I found these capabilities: [list]. Confirm or correct — then I'll ask about remaining flags (has_backoffice, has_notifications, has_multitenancy, etc.) that can't be inferred."
> - L4: "From the constitution I found these invariants: [list]. These indicate which risk categories were already identified. I still need failure_scenario and severity for each. Starting with [first]..."
> - L5: "From `governance.config.yaml` I found this stack: [table of language/framework/database/hosting/repo_structure/queues]. Confirm or correct. I still need: what external services or third-party APIs does your system call?"
>
> If developer confirms → use recovered value. If corrects → use corrected value.
> If a field has no source data → ask normally.

**Step 1.6 behavior based on scan result:**
- `greenfield` detected → Step 1.6 offers options A (everything) and B (mvp) only. Option C is pre-answered by the scan.
- `brownfield` detected → Step 1.6 pre-selects C (existing project) and only asks whether scope is "everything" or "mvp".

**G2-T4 — Reentry detection (checkpoint + intake):**

**MANDATORY READ — execute before doing anything else:**

```
Read: docs/intake/genesis-checkpoint.json
```

If the file does not exist, proceed to Layer 1. If it exists, use its `last_completed` field to determine where to resume:

```json
{
  "project_name": "[name]",
  "last_completed": "[L1|L2|L3|L4|L5|Phase2|Phase3|Phase4|Phase5|Phase6|Phase7]",
  "phase_in_progress": null,
  "timestamp": "[ISO date]",
  "quick_mode": false,
  "genesis_skill_generation": "Gen28"
}
```

**Expected checkpoint fields (v1.2 — validate on reentry):**
Required: `project_name`, `last_completed`, `genesis_skill_generation`
Optional (present if set): `phase_in_progress`, `quick_mode`, `brownfield`, `preferred_language`, `backtrack_origin`, `synthesis_accepted`
Derived flags (present after L5 — set by the derived-flags computation block in L5): `has_multitenancy`, `has_rbac`, `has_financial_flow`, `has_performance_sla`, `has_infra_complexity`, `security_risk`, `compliance_risk`, `qa_rigor`
Extended (present after Phase 5): `stack`, `paths`, `packages`, `env_vars`, `boundary_rules`, `agents_generated`

If checkpoint has fields not in this list → ignore silently (forward compatibility).
If checkpoint is missing `project_name` or `last_completed` → treat as corrupted: announce "Found checkpoint but required fields are missing. Starting fresh." → proceed as greenfield.

Checkpoint resume rules:
- `last_completed: "Phase6"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase7.md` → announce: "Found checkpoint for [project_name] — the CI pipeline is complete. Resuming from Phase 7 (first governance audit)." If `agents_generated` is present in checkpoint → include in announcement: "Agents already on disk: [agents_generated list]." → jump to Phase 7
- `last_completed: "Phase5"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase6.md` → retomo desde Phase 6. If `agents_generated` is present in checkpoint → include in resume announcement: "Agents already on disk: [agents_generated list]."
- `last_completed: "Phase4"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase5.md` → retomo desde Phase 5. If `agents_generated` is present in checkpoint → include in resume announcement: "Agents already on disk: [agents_generated list]."
- `last_completed: "Phase3"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase4.md` →
  **Before resuming:** check if `quick_mode: true` in checkpoint. If yes →
  <!-- Note: last_completed="Phase3" + quick_mode=true can only occur if the developer manually edited the checkpoint. Treat this as: checkpoint may be partially corrupt — announce to developer and ask whether to continue from Phase3 or restart from L1. -->
  announce: "Checkpoint shows Phase 3 complete with quick_mode active — this is unusual. Would you like to continue from Phase 3, or restart from Layer 1 for a complete session?"
  Wait for developer response: if they choose to continue from Phase 3 → proceed with full Phase 4 generation, do NOT skip because CLAUDE.md exists on disk.
  If they choose to restart → clear `last_completed` and proceed from Layer 1.
  If `quick_mode` is false or absent → normal Phase 4 resume.
- `last_completed: "Phase2"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase3.md` → retomo desde Phase 3
- `last_completed: "L5"` (or intake file L1-L5 found) → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase2.md` → **Before generating Phase 2 content, read `docs/intake/intake.[project_slug].layers-1-5.md` to recover L4 business risks and L3 flags needed for conditional section generation.** → retomo desde Phase 2 (constitution)
- `last_completed: "L1"` (or intake file L1-only found) → retomo desde Layer 2
- `last_completed: "L2"` → retomo desde Layer 3
- `last_completed: "L3"` → retomo desde Layer 4
- `last_completed: "L4"` → retomo desde Layer 5

**Nota para resume desde L2, L3, L4:** Los layers L1-L5 son conversacionales (no escriben archivos individuales). Al retomar desde un layer intermedio, ese layer reinicia desde el inicio. El intake file completo (L1-L5) solo se escribe al completar L5 — el trabajo conversacional parcial de layers previos no se persiste en disco. Esto es esperado y aceptable.

**Artifact inventory (mostrar junto al resume announcement):**
Al retomar desde cualquier phase (L5 o posterior), correr en paralelo:
- `ls docs/core/spec.*.constitution.md 2>/dev/null && echo "✅ Constitution" || echo "❌ Constitution"`
- `ls governance.config.yaml 2>/dev/null && echo "✅ governance.config.yaml" || echo "❌ governance.config.yaml"`
- `ls CLAUDE.md 2>/dev/null && echo "✅ CLAUDE.md" || echo "❌ CLAUDE.md"`
- `ls docs/_registry/document-registry.md 2>/dev/null && echo "✅ Document registry" || echo "❌ Document registry"`
- `ls .github/workflows/ci.yml 2>/dev/null && echo "✅ CI pipeline" || echo "❌ CI pipeline"`
- `ls .claude/agents/ 2>/dev/null | head -20 || echo "❌ Agents (none)"` (only if resuming from Phase4 or later)

Presentar al desarrollador:
```
Retomando [project_name] desde [phase]. Artifacts en disco:
  [resultados del inventory]
```

**Cross-phase consistency (verificar antes de saltar a la fase target):**
Cuando `last_completed: "PhaseN"`, verificar que el artifact de Phase N también existe en disco antes de saltar a Phase N+1. Si el artifact de Phase N falta en disco pero el checkpoint dice que está completa → anunciar:
  "⚠️ El checkpoint dice que [Phase N] está completa pero el artifact no se encuentra en disco ([path esperado]). Do you want to regenerate it or continue anyway?"
  Esperar respuesta antes de continuar.

Artifacts por fase para la verificación:
  Phase2 → docs/core/spec.*.constitution.md
  Phase3 → governance.config.yaml
  Phase4 → CLAUDE.md
  Phase5 → docs/_registry/document-registry.md
  Phase6 → .github/workflows/ci.yml

If this skill was invoked with the argument `full`, or the developer says they want the full governance path on an existing project, also check if `docs/intake/` contains a file matching `intake.*.layers-1-5.md` in the project directory (legacy reentry for projects without checkpoint file).
- **If found and contains L1–L5 data** (all five layers complete) → announce:
  > "Found existing Business Context Document (`docs/intake/intake.[project].layers-1-5.md`, v[version]). You don't need to repeat the intake. Resuming from Layer 3."
  Then jump directly to Layer 3, loading the confirmed L1+L2 outputs from the existing intake file.
- **If found but contains only L1 data** (quick mode intake — `quick_mode: true` in checkpoint, or intake without L2-L5) → announce:
  > "Found your quick bootstrap for [project_name] — you have the initial CLAUDE.md and Layer 1 complete. Now activating full governance: we'll go through Layers 2-5 to capture actors, risks, constraints and stack, then generate the constitution, ci.yml and document registry."
  Then jump to Layer 2, loading the confirmed L1 output from the existing intake file. Do NOT re-ask any question already answered in Layer 1.
- **If not found** → run full genesis from Layer 1.

**Recovery — si `phase_in_progress` no es null:**
- `phase_in_progress: "Phase2"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase2.md` → Recovery mode Phase 2 (ver bloque Recovery check en ese archivo)
- `phase_in_progress: "Phase3"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase3.md` → Recovery mode Phase 3
- `phase_in_progress: "Phase4"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase4.md` → Recovery mode Phase 4
- `phase_in_progress: "Phase5"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase5.md` → Recovery mode Phase 5
- `phase_in_progress: "Phase6"` → Read: `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase6.md` → Recovery mode Phase 6

**Recovery mode announcement:** "Found an interrupted session for [project_name] — Phase [N] started but did not complete. Checking what was completed..."

---

## PHASE 1 — INTAKE WIZARD (FIVE LAYERS)

**Invariant rule:** Each layer can only collect information at its own level of abstraction. A question that presupposes architecture, permissions, security, or technical risk before business and actors are validated is a design defect. Do not violate this rule even for efficiency.

**Protocol for every layer:**
```
INPUT   → developer writes freely or responds to a proposal
PROCESS → model structures, extracts, derives, proposes what is missing
OUTPUT  → confirmed set of fields before the next layer begins
```

**Cognitive load rule:** The developer works hard only in Layer 1. From Layer 2 onward, the model proposes derived structures and the developer confirms or corrects. Standard patterns (auth, admin roles, audit, security) are applied automatically — they are not asked.

**Closure rule:** No layer can remain open. If a field is not defined, the model proposes a reasoned default and waits for confirmation. Silence is not a valid output.

**Emergency exit (hard gate):** If more than 3 fields across Layers 1-3 remain undefined:
1. Write whatever has been confirmed so far to `docs/intake/intake.[project-slug].incomplete.md` (use `TBD` for undefined fields).
2. Stop the session with this message (do NOT ask "continue?" — this is a hard stop):
> Respond in `preferred_language` with this message (translate if needed): "Too many business aspects are undefined to generate a useful governance framework. I've saved the progress to `docs/intake/intake.[project-slug].incomplete.md`. Come back when the business context is clearer — the process will resume from where it left off."
> <!-- ES example: "Hay demasiados aspectos del negocio sin definir para generar un framework de gobernanza útil. Guardé el progreso en `docs/intake/intake.[project-slug].incomplete.md`. Volvé cuando el contexto de negocio esté más claro — el proceso retoma desde donde quedó." -->
Do not generate any governance documents from insufficient inputs.

---

### ORIENTATION (show before starting Layer 1)

> **[INTERNO — no mostrar hasta que Step 1.0 esté respondido]** Mostrar este mensaje INMEDIATAMENTE después de recibir el nombre del proyecto en Step 1.0. No antes.

> "Al terminar este proceso, vas a tener:
>
> **1. Un Documento de Contexto de Negocio** — la única fuente de verdad de qué es tu proyecto y por qué existe. Todo lo que sigue se deriva de él automáticamente.
> **2. Una Constitución** — las reglas que el sistema no puede violar.
> **3. Un CLAUDE.md** — instrucciones operativas para cualquier instancia de Claude Code.
> **4. Un CI pipeline** — automatización de los checks de gobernanza.
>
> Empezamos por el contexto de negocio. La primera parte es la más importante — todo lo demás se deriva de lo que describís acá. Cada paso es corto. Algunos presentan opciones para elegir, otros piden una descripción breve."

---

### LAYER 1 — BUSINESS

**Preconditions** *(verify as already completed — not instructions to re-execute now):*
- [ ] Prerequisite check passed (developer has a project directory and Claude Code running)
- [ ] `docs/intake/genesis-checkpoint.json` does not exist OR was checked and `last_completed` is null (new session)
- [ ] Language detection applied — `preferred_language` set in session state
- [ ] U9 disk scan completed — project classified as greenfield or brownfield
- [ ] If brownfield: developer confirmed before L1 (explicit affirmative required)

**Goal:** Understand the business, problem, model, actors, and scope. No architecture, no stack, no technical constraints yet.

---

#### Step 1.0 — Project name

Ask before the orientation message:
> "What is the name of your project?"

(Free text, one line. Used in frontmatter of all generated documents.)

Output: `project_name`

---

#### Step 1.1 — The problem

Ask:
> "Describí el problema que resuelve tu proyecto. Podés escribir libremente o usar este formato:
>
> - **Quién lo tiene:** [tipo de persona o empresa específica — no 'usuarios']
> - **Cómo lo resuelven hoy:** [herramienta o proceso concreto — no 'manualmente' o 'nada']
> - **Por qué eso no alcanza:** [consecuencia de negocio concreta — no 'es lento' o 'es difícil']
>
> Ejemplo:
> - Quién lo tiene: Coordinadores logísticos de empresas de última milla
> - Cómo lo resuelven hoy: Planillas Excel compartidas por email con los transportistas
> - Por qué no alcanza: Pierden visibilidad cuando el envío cambia de manos — el cliente llama a reclamar y nadie sabe dónde está el paquete"

**Extraction (model applies after receiving the response):**
- `pain_point` → first concrete business consequence. If the text contradicts itself, use the most specific claim and discard the vague one.
- `current_solution` → explicitly named tool or process. Does not accept "nothing", "manually", or "it varies".
- `value_prop` → new capability that the current solution cannot provide. Must reference something concretely impossible or prohibitively costly today.

**Rejection rule:** If any of the three cannot be extracted, do not advance. Name exactly what is missing and ask a specific targeted question:
- Missing who: "You described the problem but not who has it. What type of person or company experiences this daily?"
- Missing current solution: "You described the problem but not how they solve it today. What tool or process do they currently use?"
- Missing why it fails: "You described the current solution but not why it's not enough. What is the concrete consequence — what do they lose or fail to do?"

**Sector-aware clarification (U1):** If Step 1.2 sector is already known when asking for clarification, use a sector-specific example:
- Health: "Ej: coordinadores de enfermería usan planillas para asignar turnos, pero cometen errores de doble asignación — pacientes quedan sin cobertura"
- Finance: "Ej: analistas de crédito revisan solicitudes en PDF manualmente, tardan 3 días y pierden clientes que van a otro banco"
- Legal: "Ej: abogados rastrean plazos en calendarios compartidos, pero se pierden notificaciones — el cliente pierde el caso"
- E-commerce: "Ej: operadores de tienda actualizan stock en dos sistemas distintos — las discrepancias generan ventas de productos sin existencia"

---

#### Step 1.2 — Industry and segment

After extracting from 1.1, present options with context:

> "What sector does your project belong to?"

```
A) Real estate — buying, selling, renting, property management
B) Health — clinics, hospitals, telemedicine, pharmacies
C) Education — learning platforms, school administration, tutoring
D) Finance — payments, investments, lending, accounting
E) Logistics — transportation, supply chain, last-mile delivery
F) Legal — case management, documentation, compliance
G) Entertainment — content, events, communities
H) E-commerce — physical or digital product sales
I) Technology B2B — tools for developers or tech companies
J) Other: ___
```

After sector is selected, present segment options derived from that sector:

> "What specific segment within [sector]?"

Generate the list from the sector. Examples:
```
Real estate → residential rental / buying and selling / institutional assets /
              listing portals / premium market / commercial
Health      → private clinics / hospitals / telemedicine /
              appointment scheduling / pharmacies / health insurance
Finance     → retail payments / lending / investment platforms /
              accounting tools / insurance / crypto
```

If the developer's segment is not in the list, accept free text.

Output: `industry.sector`, `industry.segment`

---

#### Step 1.3 — Business model and monetization

> "How does the business work? Choose the model closest to yours:"

```
A) B2C — you sell directly to individuals
   Ex: an app where anyone searches for properties to rent

B) B2B — you sell to businesses or professionals
   Ex: a system that real estate agencies contract to manage their portfolio

C) B2B2C — you sell to businesses that serve their end clients
   Ex: agencies publish on your platform, their clients search there

D) Marketplace — you connect two sides and earn from the connection
   Ex: owners publish, buyers contact, you charge a commission

E) Internal tool — no external customers, built for your own team
   Ex: an internal operations dashboard

F) Other: ___
```

> "How does it generate revenue or justify its investment? (select all that apply, ordered from primary to secondary)"

```
A) Monthly / annual subscription
   Ex: agencies pay /month to access the platform

B) Transaction commission
   Ex: you charge a % each time a rental or sale closes

C) Publication fee
   Ex: each listed property has a cost

D) Freemium
   Ex: listing is free, featuring or analytics access is paid

E) Enterprise license
   Ex: each agency pays an annual license per N users

F) Lead generation
   Ex: the business captures interested buyers and sells leads to agencies

G) Operational savings (no direct billing)
   Ex: internal tool that reduces team work hours

H) No model defined yet

I) Other: ___

Example answer: "B, D — commission first, then freemium for small agencies"
```

**Consistency check:** Cross-reference `business_model` with `monetization`. If there is a contradiction (e.g., "internal tool" + "transaction commission"), show both conflicting statements and ask which is correct before continuing.

**Conditional question — only if `monetization[]` includes `commission` or `transaction`:**

> "Does money actually flow through your system, or do you connect parties and they transact outside the platform?"
>
> ```
> A) Money flows through the system
>    Ex: the platform processes the payment, holds funds, or manages transfers
> B) We connect parties — the transaction happens outside
>    Ex: we send a lead to the agency, they close the deal directly with the client
> C) Both — some transactions go through the system, some don't
> ```

This distinction drives `financial-accuracy` risk activation and §10 of the constitution. "Commission" that goes outside the system does not require financial transaction governance.

Output: `business_model`, `monetization[]` (ordered list), `financial_flow` (conditional: `through-system` / `outside-system` / `mixed` / `not-applicable`)

---

#### Step 1.4 — Geographic and regulatory scope

> "Where does your project operate?"

```
A) One specific country → which? ___
B) Multiple countries in the same region → which? ___
C) Global, no geographic restrictions
D) Internal use only (no external users)
```

The model activates regulatory implications automatically — do not ask the developer about them:
- Any European country → note GDPR awareness in constitution
- Health + any country → note sector-specific regulatory constraints
- Finance + any country → note financial regulatory awareness
- Internal only → deactivate external regulatory checks entirely

Output: `geo_scope`

---

#### Step 1.5 — Actors and data boundaries

With Steps 1.1–1.4 confirmed, the model derives and proposes the actor list. Do not ask the developer to list actors — propose and wait for confirmation.

> "Based on what you described, the system's actors are:
>
> 1. [name in business language] — [functional categories]
> 2. [name] — [functional categories]
> 3. [name] — [functional categories]
>
> Is this correct? Is any actor missing or incorrect?"

**Functional category enum** (an actor may have multiple):

| Category | Meaning |
|---|---|
| `creates-content` | publishes, uploads, generates data others consume |
| `consumes-content` | searches, reads, uses data created by others |
| `operates-business` | manages their own portfolio within the platform |
| `pays-for-service` | has a commercial relationship with the platform |
| `administers-system` | configures, moderates, has cross-tenant access |
| `integrates-via-api` | external system that consumes or produces data programmatically |

After actors are confirmed, ask data boundaries:

> "Are each [operator]'s data private from one another?
> Ex: Can one agency see another agency's portfolio?
>
> A) No — each actor only sees their own data (full isolation)
> B) Yes — certain data is shared between actors of the same type
> C) Depends — describe which data is shared and which is not"

**Internal tool path:** If `business_model = internal`, collapse actors to `internal-user` + `internal-admin`, skip `data_boundaries`, and notify:
> "I detected this is an internal tool. Data isolation between tenants and external regulatory questions do not apply. Continuing with simplified configuration."

Output: `actors[]` `{name, roles[], is_primary}`, `data_boundaries`

---

#### Step 1.6 — Project scope

> "What part of what you described are you building now?"

```
A) Everything described is the current scope
B) I am building an MVP — the scope is smaller
   → "Describe in one sentence the minimum you will build first"
C) This is an existing project to which I am adding governance
```

Output: `project_scope`

---

#### Layer 1 — Confirmed output (13 fields)

| Field | Type | Source | Downstream consumer |
|---|---|---|---|
| `project_name` | string | 1.0 | all document frontmatter |
| `pain_point` | string | extracted from 1.1 | constitution §1, §3 |
| `current_solution` | string | extracted from 1.1 | constitution §1 |
| `value_prop` | string | extracted from 1.1 | constitution §1 |
| `industry.sector` | enum | 1.2 | Layer 4 risk activation, constitution §1 |
| `industry.segment` | string | 1.2 | constitution §1, Layer 2 derivation |
| `business_model` | enum | 1.3 | user profile derivation, Layer 4 |
| `monetization[]` | enum[] ordered | 1.3 | Layer 4 risk activation |
| `financial_flow` | enum (conditional) | 1.3 | `financial-accuracy` activation, constitution §10 |
| `geo_scope` | enum + string | 1.4 | regulatory context, constitution §7 |
| `actors[]` | {name, roles[], is_primary}[] | 1.5 | Layer 2, user profile derivation |
| `data_boundaries` | enum + string | 1.5 | constitution §4 invariants, §7 |
| `project_scope` | enum + string | 1.6 | governance sizing, constitution §2 |

`financial_flow` is present only when `monetization[]` includes `commission` or `transaction`. Otherwise `not-applicable`.

**Layer 1 — Acceptance criteria (verify before proceeding to Layer 2):**
- [ ] `project_name` — non-empty string
- [ ] `pain_point` — references a specific actor and a concrete business consequence
- [ ] `current_solution` — names a specific tool or process (not "manually" or "nothing")
- [ ] `value_prop` — describes something the current solution cannot do
- [ ] `industry.sector` — one of the enum values (not "Other" unless free text provided)
- [ ] `business_model` — one of the enum values
- [ ] `monetization[]` — at least one item; ordered by primary→secondary
- [ ] `financial_flow` — set if monetization includes commission/transaction; otherwise `not-applicable`
- [ ] `geo_scope` — country/region named (not left blank)
- [ ] `actors[]` — at least one actor with `name`, `roles[]`, `is_primary`
- [ ] `data_boundaries` — one of full-isolation / partial-sharing / shared (with description if partial)
- [ ] `project_scope` — one of: everything / mvp / existing-project

Do not proceed to Layer 2 until all applicable fields are confirmed.

**U8B — L1 Synthesis confirmation (run before Checkpoint write):**

Present the following synthesis to the developer:

```
Antes de continuar, esto es lo que voy a usar como base para toda la gobernanza:

───────────────────────────────────────────────
[project_name] es una plataforma [business_model] del sector [industry.sector].

El problema: [actor primario] hoy [current_solution] pero [pain_point].
La solución: [value_prop].

Actores:
  • [actor 1] — [roles resumidos]
  • [actor 2] — [roles resumidos]  (si aplica)

Monetización: [monetization[], ordenada primario → secundario]
Geografía: [geo_scope]
Alcance actual: [project_scope]
───────────────────────────────────────────────

¿Esto refleja correctamente tu proyecto?

  A) ✅ [Yes — use this synthesis as the basis for everything that follows]
  B) ✏️  [I want to correct something — tell me what to change]
  C) 💬 [I prefer you use my original responses exactly as I wrote them]

[Present options A/B/C in `preferred_language`. Translate the labels above if needed.]
<!-- ES labels: A) "Sí — usar esta síntesis como base de todo lo que sigue" · B) "Quiero corregir algo — indicá qué cambiar" · C) "Prefiero que uses mis respuestas textuales tal cual las escribí" -->
```

**Behavior by option:**
- **A)** Use synthesis as canonical source for L2-L5 and Phase 2-7. Set `synthesis_accepted: true` in the checkpoint write at end of L1. Proceed to Checkpoint write.
- **B)** Show synthesis as editable. Developer names what to change. Model regenerates only affected fields and re-presents. Gate repeats. When developer finally confirms → set `synthesis_accepted: true`.
- **C)** Use developer's original responses. Proceed to Checkpoint write with `"synthesis_accepted": false` added to checkpoint.

**Checkpoint write (L1):** Write `docs/intake/genesis-checkpoint.json` with `last_completed: "L1"`, `project_name` from the confirmed L1 output, and `"genesis_skill_generation": "Gen28"`. Si el scan de U9 detectó brownfield O `project_scope = "existing-project"`, incluir `"brownfield": true`. Si opción C elegida, incluir `"synthesis_accepted": false`. Este campo persiste en todos los checkpoint writes subsiguientes (Phase 2-7) y determina qué path sigue cada fase.

---

### G2 — QUICK MODE FORK (evaluate silently after Layer 1 is confirmed)

**[INTERNO — derivar silenciosamente de los campos de L1. No mostrar la lógica al desarrollador.]**

After all L1 fields are confirmed, evaluate these risk flags before proceeding:

**Full-mode triggers (any one present → quick mode is insufficient, do not offer it):**
- `financial_flow = through-system` or `mixed`
- `data_boundaries = full-isolation` AND `actors[]` has more than one type (multi-tenant)
- `industry.sector = Finance` or `Health`

**Quick-mode indicators (all must be true for quick mode to be appropriate):**
- `financial_flow = not-applicable`
- `business_model = internal` OR `actors[]` has a single type
- `industry.sector` is NOT Finance or Health

**If ANY full-mode trigger is present:**
Skip the fork entirely. Proceed directly to Layer 2 without presenting the choice. The full path is the only safe option — do not offer quick mode to the developer.

**When full-mode triggers are active — announce before L2:**
Do not silently skip the fork. Show a brief one-liner explaining why quick mode is not available.
Format:
  "Note: quick mode is not available for this project — [reason]. Proceeding with full governance."
Reasons by trigger:
  - financial_flow=through-system → "financial transactions flow through the system"
  - multitenancy=true → "multi-tenant data isolation requires full governance"
  - sector=Finance or Health → "sector-specific compliance requirements apply"

**If quick mode is appropriate (no full-mode triggers):**
Present the following fork to the developer:

```
Tenés dos caminos:

──────────────────────────────────────────────────────
INICIO RÁPIDO  (~15–30 min más)
──────────────────────────────────────────────────────
Genero ahora un CLAUDE.md funcional con lo que ya sé:
  ✓ Reglas Git, SDD, model routing (estándar)
  ✓ Visión del proyecto y actores
  ✗ Sin invariants de seguridad/negocio
  ✗ Sin CI pipeline
  ✗ Sin constitution

Ideal para: herramientas internas, prototipos, exploración.
Podés hacer la gobernanza completa después con `/genesis-governance full`.

──────────────────────────────────────────────────────
GOBERNANZA COMPLETA  (~1.5–3h según complejidad)
──────────────────────────────────────────────────────
Continuing with the remaining 4 layers and generating:
  ✓ Constitution con invariants irrompibles
  ✓ governance.config.yaml
  ✓ CLAUDE.md completo con todas las reglas de dominio
  ✓ CI pipeline derivado de tu perfil de riesgo

Ideal para: producción, multi-developer, compliance.

¿Cuál elegís?
```

**If developer chooses GOBERNANZA COMPLETA:** Proceed to Layer 2 normally. No changes to the full path.

**If developer chooses INICIO RÁPIDO:** Execute the quick path below (G2-T3). Do NOT proceed to Layer 2.

---

#### G2-T3 — QUICK PATH (execute only when developer chose INICIO RÁPIDO)

Generate a quick CLAUDE.md from the confirmed L1 fields. This is a functional but deliberately incomplete CLAUDE.md — it contains all framework sections and placeholders for project-specific sections that require full governance.

**File:** `CLAUDE.md` (root of project)

**Content template:**

```markdown
> ⚠️ **Este es un CLAUDE.md de inicio rápido.** No contiene invariants ni reglas de dominio.
> Ejecutá `/genesis-governance full` cuando el proyecto esté listo para gobernanza completa.
>
> **Gobernanza incompleta** — generado el [FECHA-ISO]. Sin constitución, sin invariants, sin CI pipeline.
> Fecha sugerida para completar: **[FECHA-ISO + 30 días]**.
> Comando: `/genesis-governance full` (retoma desde Layer 2 — no repite Layer 1).

---

# CLAUDE.md — [project_name]

## Project Overview

[project_name] — [value_prop derived from L1 pain_point + value_prop, one sentence].

**Actors:**
[list actors[] from L1, one per line: "- [actor.name] — [actor.roles joined as comma-separated list]"]

**Stack:** TBD — run `/genesis-governance full` to define architecture.

---

## [FRAMEWORK] Git & Deploy Rules — DO NOT MODIFY

- **NUNCA hacer `git push` sin instrucción explícita.**
- **NUNCA hacer `git commit` sin instrucción explícita.** Commit y push son dos pasos separados.
- Al terminar tarea: listar archivos modificados → ESPERAR instrucción.

---

## [FRAMEWORK] Task Management

- **Feature nueva o mejora solicitada** → `TaskCreate` con subject, description, criterios, `metadata.tier` y `metadata.agent` — ANTES de implementar.
- Al terminar → `TaskUpdate` a `completed` inmediatamente.
- Bugs triviales de una línea: no requieren tarea.

---

## [FRAMEWORK] Methodology: Spec-Driven Development (SDD)

**El código implementa specs, nunca al revés.**

Workflow por tarea: Stage 0 (classify) → Stage 1 (spec alignment) → Stage 2 (design, no code yet) → Stage 3 (implement) → Stage 4 (verify) → Stage 5 (deliver).

**Delivery checklist (OBLIGATORIO antes de decir "listo"):**
1. Build — sin errores
2. Tests — todos pasan
3. Declarar agente que ejecutó

---

## [FRAMEWORK] Model Routing

| Tier | Modelo | Cuándo |
|------|--------|--------|
| **Opus** | claude-opus-4-6 | Diseño (Stage 0-2), conflictos specs, debugging complejo |
| **Sonnet** | claude-sonnet-4-6 | Implementación, tests, lógica moderada |
| **Haiku** | claude-haiku-4-5-20251001 | Configs, deps, CI YAML, git commits |

Toda tarea DEBE tener `metadata.tier` al crearla.

---

## [FRAMEWORK] Agent Dispatch

- Main instance NO hace trabajo de implementación. Delegar después de ≤3 reads.
- Frontend code (derived from governance.config.yaml `packages` + `repo_structure`): `frontend-engineer`
- Backend code (derived from governance.config.yaml `packages` + `repo_structure`): `backend-engineer`
- Commits, configs, docs: `git-ops`
- Paralelismo: 2+ tareas independientes → lanzar en paralelo.

---

## [PROJECT-SPECIFIC] Domain Rules

> ⚠️ Sección pendiente — ejecutá `/genesis-governance full` para derivar invariants y reglas de dominio desde tu perfil de riesgo.

---

## [PROJECT-SPECIFIC] Architecture

**Actors:** [same actor list as Project Overview]

**Package structure:** TBD — run `/genesis-governance full` to define module boundaries.

**Forbidden imports:** TBD — run `/genesis-governance full` to enforce boundary rules.

---

## [PROJECT-SPECIFIC] .env keys

> ⚠️ Sección pendiente — ejecutá `/genesis-governance full` para derivar desde tus integraciones y servicios externos.
```

**Generation rules:**
- Replace all `[project_name]` with the confirmed `project_name` from L1
- Replace `[value_prop derived...]` with a one-sentence summary from `pain_point` + `value_prop`
- Replace actor list with actual `actors[]` entries from L1
- Replace `[FECHA-ISO]` with today's date in ISO format (YYYY-MM-DD)
- Replace `[FECHA-ISO + 30 días]` with today's date + 30 days in ISO format
- Do NOT invent package names, stack choices, or domain rules — leave placeholders

**Also create the intake file** with only the L1 confirmed output:

**File:** `docs/intake/intake.[project-slug].layers-1-5.md`

```markdown
---
artifact_id: INTAKE-[PROJECT-SLUG-UPPER]-LAYERS-1-5
title: [project_name] Intake — Layer 1 (Quick Mode)
artifact_class: intake
status: active
version: 1.0.0
quick_mode: true
note: "L2-L5 pending. Run /genesis-governance full to complete."
---

# [project_name] — Business Context (Layer 1)

> ⚠️ Quick mode intake — only Layer 1 is complete. Layers 2-5 pending.

## Layer 1 — Business

| Field | Value |
|-------|-------|
| `project_name` | [value] |
| `pain_point` | [value] |
| `current_solution` | [value] |
| `value_prop` | [value] |
| `industry.sector` | [value] |
| `industry.segment` | [value] |
| `business_model` | [value] |
| `monetization[]` | [value] |
| `financial_flow` | [value] |
| `geo_scope` | [value] |
| `data_boundaries` | [value] |
| `project_scope` | [value] |

## Actors

[actors[] table from L1: name, roles, is_primary]
```

Present the full generated content of both files to the developer as code blocks. Wait for explicit confirmation ("ok", "yes", "correct", or equivalent affirmative). Only then write both files to disk.
If the developer requests changes before confirming: apply corrections, re-show the affected sections, and wait for re-confirmation. Do not write until the developer explicitly confirms the final version.

**Checkpoint write (Quick Mode):** Update `docs/intake/genesis-checkpoint.json` — set `quick_mode: true` and `genesis_skill_generation: "Gen24"` (keep all other fields intact: `project_name`, `last_completed: "L1"`, `timestamp`, `brownfield` if present).

After files are confirmed and written, announce:

```
✅ CLAUDE.md listo — podés empezar a trabajar.

Archivos creados:
  CLAUDE.md
  docs/intake/intake.[project-slug].layers-1-5.md (Layer 1 solamente)
  docs/intake/genesis-checkpoint.json (quick_mode: true)

Para commitear:
  git add CLAUDE.md docs/intake/intake.[project-slug].layers-1-5.md docs/intake/genesis-checkpoint.json
  git commit -m "chore(governance): quick mode bootstrap — CLAUDE.md + Layer 1 intake"

Cuando el proyecto esté listo para gobernanza completa, invocá `/genesis-governance full` — el proceso retoma desde Layer 2 usando el intake existente, sin repetir lo que ya hiciste.
```

**Quick path — fases omitidas (NO ejecutar):**
- ❌ Layer 2 (Actors) — omitida
- ❌ Layer 3 (Capabilities) — omitida
- ❌ Layer 4 (Risks) — omitida
- ❌ Layer 5 (Tech Stack) — omitida
- ❌ Phase 2 (Constitution) — omitida
- ❌ Phase 3 (governance.config.yaml) — omitida
- ❌ Phase 4 (CLAUDE.md completo + Agents) — reemplazada por CLAUDE.md mínimo
- ❌ Phase 5 (Document Registry) — omitida
- ❌ Phase 6 (CI Pipeline) — omitida
- ❌ Phase 7 (Post-Install Verification) — omitida

**Lo que SÍ se generó:** CLAUDE.md mínimo + intake Layer 1 solamente.
**Para completar:** `/genesis-governance full` retoma desde Layer 2 usando el intake existente, sin repetir lo que ya hiciste.

End of quick path. Do NOT proceed further.

---

### LAYER 2 — ACTORS

> **Layer 2/5 — Actores** (~5 min)
> Ahora mapeamos qué hace cada actor y cómo se relacionan entre sí. Propongo la estructura derivada de lo que describiste — confirmás o corregís.
> **[INTERNAL] Brownfield fast path:** if `actors:` were pre-loaded from `governance.config.yaml` → present them as a pre-filled confirmation table instead of asking "what actors does your system have?".

**Preconditions:**
- [ ] L1 confirmed output present: `project_name`, `pain_point`, `value_prop`, `business_model`, `actors[]`, `geo_scope`, `project_scope` all set
- [ ] L1 synthesis confirmed (option A or C in U8B gate)
- [ ] Checkpoint written with `last_completed: "L1"`
- [ ] Quick mode fork evaluated (shown or skipped with announcement if full-mode triggers active)

**Goal:** For each actor confirmed in Layer 1, understand what they do, when, and what information they need or produce. Not how the system is built — what each actor needs from it.

**Protocol:** Model proposes actor profiles derived from Layer 1 output. Developer confirms or corrects. Model does not ask open-ended questions — it proposes a complete table and waits for corrections.

**Presentation format:** Present all actor profiles as a single markdown table, one row per actor, before asking for confirmation.

Show this example first so the developer knows the expected abstraction level (business actions, not technical operations):

```
Por ejemplo, para una plataforma de gestión inmobiliaria:

| Actor | When they engage | Core task | Info they need | Info they produce |
|-------|-----------------|-----------|----------------|-------------------|
| Agente inmobiliario | Al recibir consulta de cliente | Hacer match entre cliente e inmueble disponible | Perfil del cliente, disponibilidad de unidades | Propuesta de visita |
| Inquilino | Al buscar vivienda | Encontrar inmueble que se ajuste a sus criterios y presupuesto | Fotos, precio, ubicación, condiciones | Solicitud de contacto |

Ahora con tu proyecto:

| Actor | When they engage | Core task | Info they need | Info they produce |
|-------|-----------------|-----------|----------------|-------------------|
| [name] | [use_moment] | [core_task] | [key_info_needed] | [key_info_produced] |
```

After presenting the table, ask:
> "Does each row reflect how this actor actually uses the system? Correct anything that doesn't fit — you can also add a row if an actor is missing."

**Rejection rule:** If a row has an empty `core_task` or the model cannot derive it, do not leave it blank. Mark it as `TBD` and note: "I couldn't determine the core task for [actor] from what you described. What is the one thing this actor must be able to do?"

**`key_info_produced` fallback for secondary actors (G23):** Secondary actors (non-primary) may not produce information consumed by other actors. If the model cannot derive a meaningful `key_info_produced` for a secondary actor from Layer 1, default to `"configuration and preferences"` and note it in the table. Do not invent outputs. If the actor genuinely produces nothing the system stores, mark as `"none — read-only actor"`.

**Recovery protocol (G7):** If the developer rejects more than half the proposed table, or says the proposals are fundamentally wrong, do not attempt to patch individual rows. Stop and ask two targeted questions:
> "Which actors are in your system? List them one per line."
> "For [primary actor]: what is the single most important thing they must be able to do?"
Re-derive the entire table from those answers. This is the only scenario where the model asks open questions in Layer 2.

**P6 abstraction constraint on `key_info_produced` (G24):** This field must be stated at the business information level, not the data schema level. Correct: "client contact details", "match prediction", "property listing". Wrong: "JSON object with fields name/email/phone", "database record with columns team_id/score". If derivation reaches schema level, restate it one abstraction higher: what is the business meaning of that data?

**Internal derivation (not exposed as confirmed output):** The model uses inter-actor relationships (who serves whom) internally to derive the critical path. This context is NOT a confirmed output field — it is a PROCESS artifact.

After the table is confirmed, the model proposes the critical path:

> "The critical path — the single interaction that must work for this product to deliver its core value — appears to be:
>
> **[Actor A] → [Actor B]:** [description]
> If this fails: [failure_consequence derived from pain_point + confirmed actor profiles]
>
> Is this correct? If the product has two equally critical paths, describe both."

`failure_consequence` is derived from `pain_point` and the confirmed actor profiles. It must name a concrete business consequence, not a technical failure.

Example: pain_point = "agencies lose leads because they can't match properties to clients" + critical path tenant → agency → `failure_consequence = "agencies don't receive client inquiries — the platform's primary value doesn't exist"`.

**Single actor path (G8):** If `business_model = internal` or only one actor type exists:
- Still present the actor profile table (use_moment, core_task, key_info_needed, key_info_produced)
- `key_info_produced` for a single-actor internal tool = outputs the system generates or stores (reports, records, audit logs) — not consumed by another actor but still has data integrity implications
- Skip the critical path interaction entirely. Set `critical_path = null` and note: "Internal tools have no inter-actor critical path — availability and data-correctness risks will be derived from core_task instead."
- The L4 `availability` risk (if activated) derives from `core_task` directly: if the system is unavailable, the actor cannot complete their core task.

### Layer 2 confirmed output

| Field | Type | Source | Downstream consumer |
|-------|------|--------|---------------------|
| `actor_profiles[].use_moment` | string per actor | proposed from actors[] + business_model | L3 capability derivation, constitution §3 |
| `actor_profiles[].core_task` | string per actor | proposed from actors[] + pain_point + value_prop | **L3 primary input** for capability derivation, constitution §3 |
| `actor_profiles[].key_info_needed` | string per actor | proposed from core_task + current_solution | L3 structural_flags (has_backoffice if admin needs separate interface), constitution §4 data access |
| `actor_profiles[].key_info_produced` | string per actor | proposed from actors[].roles[] + value_prop | L4 `data-correctness` risk activation, constitution §4 data integrity |
| `critical_path.from_actor` | string | derived from actor profiles | L4 `availability` risk derivation |
| `critical_path.to_actor` | string | derived from actor profiles | L4 `availability` risk derivation |
| `critical_path.description` | string | derived from pain_point + actor profiles | constitution §4 availability invariant |
| `critical_path.failure_consequence` | string | derived from pain_point + actor profiles | **constitution §4 availability invariant** (primary consumer) |

`critical_path` is `null` for single-actor or internal-tool projects. Layer 4 derives `availability` risk from `core_task` instead.

**Layer 2 closure summary (G25):** Before proceeding to Layer 3, present a two-sentence consolidation:
> "Layer 2 confirmed. [N] actors: [actor names]. The critical path is [from_actor] → [to_actor]: [description]. If it fails: [failure_consequence]."
> (For single-actor: "Layer 2 confirmed. [N] actors. No inter-actor critical path — availability derives from [actor]'s core task: [core_task].")

Wait for the developer to say "ok" or correct anything. Only after confirmation proceed to Layer 3.

**Layer 2 — Acceptance criteria (verify before proceeding to Layer 3):**
- [ ] Every actor from Layer 1 `actors[]` has a row in the profile table
- [ ] Every row has a non-empty `use_moment`, `core_task`, `key_info_needed`, `key_info_produced` (or explicit "none — read-only actor")
- [ ] No row has a `core_task` that is a technical operation (must be a user-visible action)
- [ ] `critical_path` is defined (from_actor, to_actor, description, failure_consequence) — OR explicitly `null` for internal/single-actor projects
- [ ] `failure_consequence` references a concrete business consequence, not a technical failure
- [ ] Developer has confirmed the table (said "ok" or corrected and re-confirmed)

---

### LAYER 3 — FUNCTIONAL

> **Layer 3/5 — Capacidades** (~5 min)
> Ahora mapeamos qué puede hacer el sistema, derivado de los actores y el critical path que confirmamos. Propongo la lista completa — confirmás, reclasificás (core ↔ secundaria), o agregás lo que falta.
> **[INTERNAL] Brownfield fast path:** if capabilities were pre-loaded from the constitution file → present them as a proposed list for confirmation instead of deriving from scratch.

**Preconditions:**
- [ ] L2 confirmed output present: `actor_profiles[]` with `core_task` for all actors, `critical_path` (or null with reason)
- [ ] L2 closure summary confirmed ("ok" or correction applied and re-confirmed)
- [ ] Checkpoint updated with `last_completed: "L2"`

**Goal:** Understand what the system can do. Not how it works — what capabilities it has.

**Protocol:** Model derives capability candidates from Layers 1+2 and presents the full proposed list **before asking any question**. Developer adjusts grouping or adds missing capabilities — they do not generate the initial list.

**Opening message format (G33 — explicit derivation trace):**

When entering Layer 3, the model MUST present a pre-filled proposed list derived from actor profiles:

```
Based on your actors and critical path, here are the capabilities I derived:

**CORE** (required for [critical_path.description] to work):
- [capability] ← derived from [actor]'s core_task: "[core_task]"
- [capability] ← derived from pain_point: "[pain_point]"
- [capability] ← derived from [actor]'s key_info_needed: "[key_info_needed]"

**SECONDARY** (adds value, not required for critical path):
- [capability] ← derived from [actor]'s key_info_produced: "[key_info_produced]"
- [capability] ← derived from value_prop: "[value_prop]"

Confirm, re-classify (core ↔ secondary), or remove. Add any I missed.
```

Rules for this opening:
1. Every capability must cite its source field (`actor.core_task`, `pain_point`, `value_prop`, `key_info_needed`, `key_info_produced`)
2. Capability phrasing must be a user-visible business verb (not "call API", "query DB") — apply P6 constraint before presenting
3. If `project_scope = mvp` and secondary capabilities exist: mark them `[post-mvp]` in the opening list
4. If critical_path exists: at least one core capability must directly enable it — flag if none does

Do NOT ask questions in the opening. Present the list and wait for the developer's response.

**Derivation algorithm (G12 + G26 — P6 abstraction constraint):** Capabilities must be expressed as business verbs at the user-visible action level. P6 rule: Layer 3 captures **what the system does**, not **how it does it**. Correct: "search listings", "publish match results", "track athlete performance". Wrong: "query database", "call REST endpoint", "render React component", "run cron job". If a candidate capability is technical, ask: "what does the user accomplish with this?" — that answer is the capability. Derive from:
1. `actors[].core_task` → one or more capabilities per actor (the system enables each core task)
2. `actors[].key_info_needed` → data access capabilities (what the actor needs to see or find)
3. `actors[].key_info_produced` → data write capabilities (what the actor creates or updates)
4. `pain_point` → the primary problem being solved = the most important core capability
5. `value_prop` → secondary capabilities that differentiate from the current solution

Grouping rules:
- **Core** = required for the system's primary value to exist (if absent, `critical_path.failure_consequence` occurs)
- **Secondary** = adds value but the system still delivers its core promise without them
- Maximum 7 core capabilities. If derivation produces more, ask developer to cut to 7.

**Why different caps for general vs. MVP:**
The general cap of 7 core capabilities reflects the maximum manageable governance scope
for a full-scope project. For MVPs (project_scope = "mvp"), the threshold is 5 — not because
fewer capabilities are allowed, but because a developer building an MVP who declares more
than 5 core capabilities is likely conflating "nice to have" with "core". The lower threshold
forces a conversation about what truly must work for the MVP to have value.
These are not contradictory rules — they serve different purposes.
**Cap de capacidades secundarias:** Si la derivación produce más de 10 capacidades secundarias, mostrar solo las 10 más relevantes (derivadas de `value_prop` y `actor_profiles` de actores primarios). Generar el resto silenciosamente como parte del intake document bajo una sección "Capacidades secundarias adicionales (candidatos V2)". Al finalizar L3 agregar: "Found [N] additional capabilities beyond the [K] shown. Documented them as V2 candidates in the intake — do you want to review them now or proceed to risks?" (Si dice no: continuar. Si dice sí: mostrar lista completa y esperar confirmación.)

**MVP scope constraint (G18):** If `project_scope = mvp`, apply:
- Mark any secondary capability as `[post-mvp]` automatically
- If more than 5 capabilities are core, flag: "You have [N] core capabilities for an MVP. Should any move to post-mvp?"
- `[post-mvp]` capabilities are documented but excluded from constitution §3 MVP invariants

The model also identifies structural presence (yes/no flags derived from Layer 2):
- `has_backoffice` → any actor with role = 'operator' or 'admin' in `actors[]` who needs a separate management interface
- `has_public_api` → `integrates-via-api` actor type present, or `business_model` implies developer integration
- `has_notifications` → any actor has `use_moment` that is time-sensitive AND the system must proactively push information (vs. actor pulling)
- `has_ugc` → any actor produces content that other actors consume via the platform
- `ai_outputs` → derived from L1/L2 mentions of AI, ML, recommendations, scoring, predictions, rankings

These are derived, not asked — the model shows its reasoning for each flag. Developer corrects if wrong.

For `ai_outputs` specifically: if the model cannot derive it from Layers 1-2 context (no mention of AI, ML, recommendations, or scoring), fall back to a direct question:
> "Does your system use AI, machine learning, or algorithms that produce outputs users see and act on?
>
> A) Yes — outputs reach the user without human review
>    E.g.: product recommendations, match predictions, credit score, automatic ranking, dynamic pricing
>
> B) Yes — AI is used internally but a human always reviews before it reaches the user
>    E.g.: contract draft a lawyer signs, diagnosis suggestion a doctor confirms, generated summary an editor publishes
>
> C) No — the system shows or processes data but does not generate AI-derived outputs"

`ai_outputs` drives `algorithmic-output` risk activation in Layer 4 and §9 of the constitution.

### Layer 3 confirmed output

`capabilities[]` (grouped core/secondary, with `[post-mvp]` tags if applicable), `structural_flags`:

| Flag | Type | Derived from | Downstream consumer |
|------|------|-------------|---------------------|
| `has_backoffice` | boolean | actors[].roles (operator/admin with separate interface) | constitution §3 backoffice invariants, L4 `auth-access` activation |
| `has_public_api` | boolean | integrates-via-api actor or developer business model | constitution §3 API contract invariants, L4 `auth-access` activation |
| `has_notifications` | boolean | time-sensitive use_moment + system must push proactively | constitution §3 notification delivery invariants |
| `has_ugc` | boolean | actor produces content consumed by other actors | L4 `data-privacy` activation, constitution §7 UGC rules |
| `ai_outputs` | enum (autonomous/human-reviewed/none) | AI/ML/scoring/prediction context in L1-L2 | L4 `algorithmic-output` activation, constitution §9 |

<!-- CANONICAL NAME NOTE (FIX-8): The canonical field name is `ai_outputs` (enum: none/human-reviewed/autonomous). Phase files may reference it as `has_ai_outputs=true` — treat this as `ai_outputs != "none"` (i.e., autonomous OR human-reviewed). When evaluating conditionals in Phase 2-7 that use `has_ai_outputs=true`, apply them whenever `ai_outputs` is either "autonomous" or "human-reviewed". -->

**P6 note — no layer contamination:** `has_notifications` is a functional capability flag only. It drives capability derivation and constitution §3. It does NOT activate `api-quota` risk in Layer 4 — that is asked explicitly in Layer 4 as a direct question.

**Layer 3 consistency check (G11):** After capabilities[] and structural_flags are confirmed, run this internal validation silently and surface only failures:
- Does at least one core capability directly address `pain_point` from Layer 1? If no → flag: "None of the core capabilities maps to the pain point you described ('[pain_point]'). Which capability is the direct solution to it?"
- Are all core capabilities expressible as actions the primary actor takes? If any is phrased as a technical operation → flag with the business-verb rewrite.
- Is `value_prop` from Layer 1 represented in either core or secondary capabilities? If no → ask: "You described your value prop as '[value_prop]' — I don't see a capability for it. Should it be added?"

This check is model-driven. Present it as a brief validation note, not a new round of questions.

**Layer 3 — Acceptance criteria (verify before proceeding to Layer 4):**
- [ ] `capabilities[]` has at least one core capability that directly addresses `pain_point`
- [ ] All core capabilities are expressed as user-visible business verbs (not technical operations)
- [ ] `value_prop` from Layer 1 is represented in at least one capability (core or secondary)
- [ ] `has_backoffice` — derived and confirmed (true if any actor needs a separate management interface)
- [ ] `has_public_api` — derived and confirmed
- [ ] `has_notifications` — derived and confirmed
- [ ] `has_ugc` — derived and confirmed
- [ ] `ai_outputs` — set to autonomous / human-reviewed / none (confirmed, not assumed)
- [ ] If `project_scope = mvp`: secondary capabilities marked `[post-mvp]`, core capped at 7
- [ ] The Layer 3 consistency check ran and any failures were resolved

*The acceptance criteria above are internal model checks — not shown to the developer. G26b (below) is the developer-visible confirmation gate. Verify acceptance criteria internally first, then proceed to G26b and wait for explicit confirmation.*

**Layer 3 closure summary (G26b):**
Present a brief confirmation to the developer before proceeding to L4:

  Layer 3 confirmed. [N] core capabilities, [M] secondary.
  Structural flags: has_backoffice=[T/F] · has_public_api=[T/F] · has_notifications=[T/F] · has_ugc=[T/F] · ai_outputs=[none/reviewed/autonomous]
  These flags will activate specific governance sections in the constitution and CI pipeline.

Then: **Wait for the developer to say "ok" or correct a flag.** Only proceed to L4 once confirmed.

**What counts as approval:** "ok", "yes", "correct", or equivalent affirmative.
**What does NOT count:** silence.

---

### LAYER 4 — BUSINESS RISKS

> **Layer 4/5 — Riesgos de negocio** (~10 min)
> Ahora identificamos qué puede fallar y qué debe proteger la gobernanza. Propongo los riesgos relevantes para tu perfil de proyecto — confirmás, rechazás o agregás. Cada riesgo que confirmás activa secciones específicas en la constitución y el CLAUDE.md.
> **[INTERNAL] Brownfield fast path:** if `hard_constraints:` were pre-loaded from `governance.config.yaml` → use them as seed for risk discussion, presenting them as "I found these existing constraints — are they still accurate?".

**Preconditions:**
- [ ] L3 confirmed output present: `capabilities[]` with CORE/SECONDARY split, `structural_flags` (all 5 flags evaluated)
- [ ] L3 closure gate confirmed ("ok" after G11 consistency check)
- [ ] Checkpoint updated with `last_completed: "L3"`

**Layer distinction (G10):** Layer 3 captured **what the system can do** (capabilities, structural flags). Layer 4 captures **what can go wrong** when the system does those things, and what governance must protect against. These are different abstractions: a capability is neutral ("users can pay"), a risk is a failure mode ("payments fail silently, reconciliation breaks"). Do not re-derive capabilities here — start from the confirmed L3 output and identify failure modes.

**Goal:** Identify the failure modes that governance must protect against. These come from the business, not from the technology.

**Protocol:** Model derives risk candidates from Layers 1+2+3 and presents them. Developer does not generate risks — they confirm, reject, or add. The model explains why each risk is relevant to this specific project.

Risk dimensions to evaluate (from the project's profile, not a generic checklist):

| Risk Dimension | Activate if... | What governance adds |
|---|---|---|
| `availability` | B2C product, paying subscribers, or critical_path exists | §4 availability invariant + uptime SLO |
| `data-correctness` | `key_info_produced` by any actor is consumed by another actor's decisions | §4 data integrity rules + audit trail |
| `financial-accuracy` | `financial_flow = through-system` (from Layer 1) | §10 financial transaction governance + reconciliation |
| `algorithmic-output` | `structural_flags.ai_outputs = autonomous` (from Layer 3) | §9 algorithmic output governance + model cards |
| `api-quota` | developer confirms at least one critical function depends on a third-party API with rate limits or quotas | API budget rules + sentinel patterns in CLAUDE.md |
| `data-privacy` | `has_ugc = true` or actors upload personal data | §7 data privacy rules + retention policy |
| `regulatory` | `geo_scope` includes EU, or sector = health/finance/legal | §7 regulatory compliance section |
| `auth-access` | multiple actor types with different data permissions (`data_boundaries ≠ shared`) | §5 auth architecture principles + role enforcement rules |

**Traducción para el desarrollador (usar estos nombres al presentar riesgos, no los nombres internos):**

| Nombre interno | Presentar al desarrollador como |
|----------------|--------------------------------|
| `availability` | "Disponibilidad del servicio" |
| `data-correctness` | "Datos que afectan decisiones de otros usuarios" |
| `financial-accuracy` | "Transacciones y pagos que fluyen por el sistema" |
| `algorithmic-output` | "Decisiones automatizadas que los usuarios ven y actúan" |
| `api-quota` | "APIs externas que pueden fallar o cortar el servicio" |
| `data-privacy` | "Datos personales de usuarios" |
| `regulatory` | "Obligaciones legales o regulatorias" |
| `auth-access` | "Control de acceso entre tipos de usuarios" |

**Regla para `governance_implication` al presentar al desarrollador:**
No mostrar referencias a secciones del documento (§9, §4, etc.). Reemplazar por descripción de consecuencia en lenguaje de negocio. Ejemplos:
- ❌ `§9 Constitution + model cards`
- ✅ "Agrego reglas que definen cuándo la IA puede decidir sin revisión humana y qué debe informarse al usuario"
- ❌ `§5 auth architecture principles + role enforcement`
- ✅ "Agrego reglas que definen qué datos puede ver cada tipo de usuario y cómo se aíslan entre sí"
- ❌ `§10 financial transaction governance + reconciliation`
- ✅ "Agrego reglas que protegen la integridad de pagos y comisiones que fluyen por el sistema"
- ❌ `§8 API budget rules + sentinel/fallback patterns`
- ✅ "Agrego reglas que protegen el sistema cuando una API externa falla o alcanza su límite"

**Special case — `api-quota`:** This is the only risk dimension that cannot be reliably derived from Layers 1-3. `has_notifications` (L3) signals a functional capability but says nothing about whether it uses an external API with quota limits. Before presenting the risk table, ask:
> "Does any critical function of your system depend on a third-party API with usage limits or quotas?
>
> A) Yes — and if the limit is reached, something the user needs to operate breaks
>    E.g.: OpenAI to generate predictions the user sees, Stripe to process payments, SendGrid for transaction confirmations, real-time financial data API
>
> B) Yes — but I have a fallback or the degradation is acceptable
>    E.g.: Google Maps for address enrichment (could show without map), news API (could show cache), automatic translation (could be omitted)
>
> C) I don't depend on external APIs with quota limits
> D) I don't know yet"

If A → activate `api-quota` at severity high. If B → activate at severity medium. If C or D → `api-quota` does not activate. Do not re-derive this from any other signal.

For each risk the model determines relevant (plus `api-quota` if activated), present it with full context so the developer can make an informed decision:

```
⚠ [risk dimension]
   Why relevant: [specific reason from THIS project — reference confirmed fields]
   If this fails: [concrete business consequence for THIS project]
   What governance adds: [exactly what sections/rules appear in the constitution and CLAUDE.md]
   Severity: [high / medium / low — with brief justification]
```

After presenting all relevant risks, ask:
> "These are the risks I identified for your project, and what governance each one activates. Confirm, reject, or add any. If you reject a risk, the corresponding governance sections will not be generated."

**Custom risk dimensions:** If the developer adds a risk not in the table, ask: "What governance do you want to add for this risk? Describe it in one sentence." The model will generate a custom §N section in the constitution based on the description.

**Minimum viable check:** If the developer rejects all risks, warn:
> "No risks confirmed. The generated constitution will have no specific invariants — it will be a generic template. Continue or reconsider?"

### Layer 4 confirmed output

Each entry in `business_risks[]` conforms to this schema:

```
{
  dimension: string           // from the 8 predefined dimensions, or custom
  severity: 'high'|'medium'|'low'
  reason: string              // why relevant to THIS project (references confirmed L1-L3 fields)
  failure_scenario: string    // concrete business consequence if this risk materializes
  governance_implication: string  // what sections/rules appear in constitution + CLAUDE.md
}
```

| Field | Type | Downstream consumer |
|-------|------|---------------------|
| `dimension` | string | L4 governance summary, governance.config.yaml risk flags |
| `severity` | enum | constitution §4 invariant strength, SLO targets |
| `reason` | string | constitution preamble, audit trail |
| `failure_scenario` | string | constitution §4 invariants (availability, data-correctness) |
| `governance_implication` | string | Phase 2 constitution section activation |

**Layer 4 boundary check (G30):** Before confirming Layer 4 as complete, ask:
> "Antes de cerrar la capa de riesgos: ¿hay algún servicio externo del que dependa tu sistema que no hayamos mencionado todavía?
> (Ya mencionamos: [lista los servicios que el developer nombró en la respuesta a la pregunta api-quota, o "ninguno hasta ahora" si eligió C o D].)
> Otros ejemplos: procesador de pagos, servicio de email, proveedor de autenticación, gateway de SMS, proveedor de datos con términos comerciales."
> (Texto libre — o "ninguno" para continuar.)

If the developer names a service that implies a risk not yet confirmed:
- Stripe / payment processor → prompt `financial-accuracy` if not already confirmed
- Email service / SMS / push → do NOT activate `api-quota` automatically (already asked as direct question)
- Auth provider (Auth0, Clerk) → prompt `auth-access` if not already confirmed
- Data provider with commercial terms → note for `constraints[]` in Layer 5

This check prevents retroactive risk discovery in Layer 5 (`external_deps[]`).

**After the developer confirms the risk table and the boundary check completes**, run the derivation internally and present the closing summary before proceeding to L5.

<!-- INTERNAL DERIVATION RULES (not shown to developer — apply silently to derive the L4 closing summary):

Primary risk: the single most important failure mode from `business_risks[]`. Choose highest business impact.
Secondary risk: second most important (or "none").

User profile — derived from `business_model` + `actors[]`:
  - any `pays-for-service` individual actor → includes b2c
  - any `pays-for-service` company actor → includes b2b
  - business_model = internal → internal
  - integrates-via-api present → includes developers
  - multiple → mixed

Regulatory context — from `geo_scope` + `industry.sector`:
  - European geography + any sector → GDPR awareness
  - Health sector → sector-specific regulatory note
  - Finance sector → financial regulatory note
  - Internal only → no external regulatory context

Governance implications per risk:
  availability         → SLO definition, DR/BCP Scenario A, uptime invariant
  api-quota            → API consumption control section in CLAUDE.md, sentinel/fallback rules
  algorithmic-output   → Model cards requirement, audit trail, promotion gate
  financial-accuracy   → Payment invariants, 3-month secret rotation cadence
  data-privacy         → Data isolation invariant, PII inventory, breach notification
  regulatory           → Compliance calendar, data processing register
  auth-access          → Auth invariants, session governance, tenant isolation

Governance implications per user profile:
  b2c         → Rate limiting invariant, GDPR awareness, auth invariants
  b2b         → Data isolation invariant, service agreement awareness
  internal    → Simplified auth, no SLO for Tier 0-1
  developers  → API versioning invariant, backwards compatibility policy
-->

**L4 closing summary (show to developer after confirming risk table):**

```
Con este perfil de riesgo, tus documentos de gobernanza van a incluir:
  ✓ [área en lenguaje de negocio] — porque [razón específica de este proyecto]
  ✓ [área] — porque [razón]
  ○ [área] — NO incluida ([por qué no aplica])

Esto va a generar reglas específicas en la constitución para:
  [lista derivada de riesgos activados, en lenguaje de negocio — sin referencias §N]
  Ej activados: "protección de pagos y comisiones", "cuándo la IA puede decidir sin revisión humana",
                "qué datos puede ver cada tipo de usuario y cómo se aíslan entre sí",
                "qué pasa cuando una API externa falla o alcanza su límite"

¿Correcto? Si es así, antes de continuar: **¿cuál es el riesgo principal que identificamos para [project_name]?** (respondé con tus palabras — no necesitás citar el nombre técnico, solo describirlo brevemente).
```

Wait for the developer to name the primary risk in their own words. If they just say "sí" or "s" without naming it, ask again: "¿Y cuál sería el riesgo principal específicamente para tu proyecto?" Only proceed to L5 once they've named it. If the developer corrects anything in the summary, update the derivation and show the corrected summary before asking.

**L4 Risk gate — acceptance criteria:**
Accepts: any phrase that names BOTH (a) the risk category AND (b) what fails in the project.
Examples that pass:
  - "the dashboard going down when agents need to respond" [availability + specific failure]
  - "wrong commission calculations reaching operators" [financial-accuracy + who is affected]
  - "tenant data leaking to other tenants" [data-privacy + specific scenario]
Examples that fail (too generic):
  - "availability" [no project context]
  - "data problems" [no specific failure mode]
  - "yes" / "ok" [no content]

**Rejection response template:**
  "I need a bit more detail — what specifically breaks in [project_name] if this risk materializes?
   Example: '[risk category] when [specific failure scenario]'."

**Layer 4 — Acceptance criteria (verify before proceeding to L5):**
- [ ] Every risk in `business_risks[]` has: `dimension`, `severity`, `reason` (specific to THIS project), `failure_scenario`, `governance_implication`
- [ ] `api-quota` was explicitly asked (direct question) — not inferred
- [ ] The Layer 4 boundary check ran (external services asked explicitly)
- [ ] If developer rejected all risks: warning was shown and confirmed
- [ ] At least one risk is confirmed (or developer explicitly acknowledged "no governance" consequence)
- [ ] Developer confirmed the final risk table
- [ ] L4 closing summary confirmed by developer

---

### LAYER 5 — TECHNICAL

> **Layer 5/5 — Stack técnico** (~5 min)
> Last layer before generating documents. I'll propose the recommended stack for your profile — confirm or override each item. I also need to know the critical external APIs and technical decisions already made.
> **[INTERNAL] Brownfield fast path:** if `stack:` was pre-loaded from `governance.config.yaml` → present it as proposed stack for confirmation instead of deriving from scratch. **This takes priority over the disk-derived values in GEN17-F2 below** — when governance.config.yaml was found, use it as primary source. GEN17-F2 disk commands still run, but only to validate consistency, not to replace config values.

**Preconditions:**
- [ ] L4 confirmed output present: `business_risks[]` with at least 1 risk confirmed, `closing_summary`
- [ ] L4 risk gate passed: developer named the primary risk in their own words (not just "yes")
- [ ] Checkpoint updated with `last_completed: "L4"`

**Goal:** Understand the technical context that parameterizes `governance.config.yaml`. This layer informs configuration, not the risk derivation (which is already complete after Layer 4).

**Brownfield branch (GEN17-F2 — execute this path if `brownfield: true` in checkpoint):**

> **[INTERNO — no mostrar al developer]** Si el checkpoint tiene `brownfield: true`, hay dos sub-casos según si `governance.config.yaml` fue pre-cargado en la pre-population block:
>
> **Sub-caso A — governance.config.yaml fue encontrado (ver Brownfield fast path note arriba):**
> 1. Presentar stack de `governance.config.yaml` como tabla confirmada (Gen28 fast path — ver nota arriba). El stack de config tiene precedencia.
> 2. Correr los 6 comandos del Reality Check para validación (no como fuente primaria). Si disco y config.yaml divergen en algún campo → mostrar discrepancia y pedir confirmación al developer.
> 3. Solo preguntar por gaps que ninguna fuente tiene: hosting (si no está en config), APIs externas críticas, constraints.
> 4. **Omitir G34** — stack ya está disponible.
>
> **Sub-caso B — governance.config.yaml NO fue encontrado (partial governance o project sin config):**
> 1. Correr los 6 comandos del Reality Check **primero** (ver sección de Reality Check a continuación).
> 2. Presentar al developer: "Found on disk: language=[X] (inferred from package.json/Gemfile/etc.), repo=[Y] (folder structure), packages=[Z] (ls packages/). Is this stack correct?" — usar esto como punto de partida confirmado.
> 3. Solo preguntar por los gaps que el disco no puede revelar: hosting, APIs externas críticas, constraints organizacionales/financieros/regulatorios.
> 4. **Omitir G34** (propuesta hipotética de stack) en brownfield — el stack ya existe y el disco es la fuente de verdad.
>
> Continuar con L5 closure summary (G35) y checkpoint write normalmente en ambos sub-casos.

**Opening message format (G34 — context-aware stack proposal — greenfield only):**

Before asking questions, the model MUST derive a recommended stack profile from the context already established in Layers 1-4 and present it as a default proposal:

```
Based on your project profile ([business_model], team_size=[N], domain=[domain], flags=[relevant structural_flags]):

**Recommended stack** (confirm or override each):
- Language/runtime: [recommendation + brief reason]
- Repo structure:   [recommendation + brief reason]
- Hosting:         [recommendation + brief reason]
- Database:        [recommendation + brief reason, if derivable from risk profile]
- Queue/async:     [recommendation if api-quota or algorithmic-output risks confirmed, else "none needed"]

Confirm this profile or override individual items below.
```

**Derivation rules for the recommendation:**

| Context signal | Derived recommendation |
|----------------|------------------------|
| `team_size ≤ 2` | TypeScript/Node.js (fastest iteration), monorepo (one lockfile), Railway or Render (zero infra ops) |
| `team_size 3–8` | TypeScript or Python, monorepo or multi-repo per domain boundary |
| `team_size > 8` | Multi-repo likely, language per team expertise |
| `has_public_api = true` AND `team_size ≤ 3` | Next.js (SSR) for public surface, Fastify for API |
| `financial_flow = through-system` | PostgreSQL (ACID) — name it explicitly |
| `algorithmic-output` risk confirmed | BullMQ + Redis or equivalent async queue — recommend it |
| `api-quota` risk confirmed AND `has_notifications` | Flag: "A queue is needed for async notification delivery — include BullMQ or a job runner" |
| `domain = real-estate` | Mapbox or Google Maps for geographic search |
| `domain = sports / media` | CDN + low-latency reads; avoid heavy ORM |
| `domain = health / finance / legal` | PostgreSQL + strict migrations + audit log by default |

If the model cannot derive a recommendation for a field (not enough context): write `"[needs input]"` for that item only.

After presenting the proposal, ask for overrides and then fill in details:

**Key external dependencies:**
> "Does your project depend on any third-party APIs or services that are critical to its operation? List them briefly."
(Free text — examples: "Stripe for payments", "OpenAI for embeddings", "SendGrid for email")

**Already-made technical decisions (G32):**
> "What technical decisions are already fixed and not up for discussion? List any constraints that would affect how the governance framework is configured."

**Hosting undecided path (G17):** If the developer overrides hosting to "not decided yet": output `hosting: "undecided"` in governance.config.yaml and flag: "Hosting is not decided. Deployment runbook sections will be generated as placeholders — fill them in once hosting is confirmed. No governance blocker."

Constraint types (model uses these to categorize responses, not shown to developer):
- `technical` — stack, database, framework (e.g. "TypeScript only", "PostgreSQL already deployed", "no new frameworks")
- `organizational` — team capabilities, process rules (e.g. "team has no iOS experience", "all changes require 2-person review")
- `financial` — budget, vendor rules (e.g. "no new paid vendor contracts", "must stay under $500/mo infra")
- `regulatory` — pre-existing compliance obligations (e.g. "SOC 2 audit in 6 months", "GDPR DPA already signed")

Examples to show if developer is unsure:
> "E.g.: 'TypeScript only (team expertise)', 'PostgreSQL (already deployed)', 'No new vendor contracts (budget freeze)', 'Must pass SOC 2 by Q4'"

Output: `tech_stack` {language, repo_structure, hosting, external_deps[], constraints[{type, description}]}

**Layer 5 — Acceptance criteria (verify before proceeding to Phase 2 — constitution):**
- [ ] `language` — confirmed (not left as "Other" without specification)
- [ ] `repo_structure` — confirmed (monorepo / single / multi)
- [ ] If monorepo: package list provided (even if approximate)
- [ ] `hosting` — confirmed or explicitly `undecided` (with placeholder note)
- [ ] `external_deps[]` — complete (cross-checked against all integrations mentioned in Layers 1-4)
- [ ] `constraints[]` — any fixed decisions documented (technical, organizational, financial, regulatory)
- [ ] No service named in Layers 1-4 was left out of `external_deps[]`

---

**L5 closure summary (G35):** After stack, deps, and constraints are confirmed, present this synthesis and wait for developer confirmation before running the Reality Check:

> "Layer 5 confirmado.
>
> Stack: [language] / [repo_structure] / hosted on [hosting]
> Dependencias externas ([N]): [external_deps[] names, comma-separated — or "ninguna"]
> Constraints ([N]): [constraint descriptions, comma-separated — or "ninguno"]
>
> ¿Correcto?"

Wait for "ok", "sí", "correcto", or equivalent. If the developer corrects anything, update the field and re-present only the corrected line. Only after confirmation proceed to Reality Check.

---

### L5 Reality Check

Antes de mostrar el summary de L5, ejecutar estos 6 comandos en paralelo para validar que el estado del disco sea consistente con las respuestas del intake:

```bash
1. ls packages/ 2>/dev/null          # comparar con repo_structure declarado en L1
2. cat package.json 2>/dev/null | grep '"name"'   # comparar con project_slug declarado en L1
3. ls .claude/agents/ 2>/dev/null    # informar si ya hay agents (afecta Phase 4b)
4. ls .github/workflows/ 2>/dev/null # informar si ya hay CI (afecta Phase 6)
5. ls docs/core/*.constitution.md 2>/dev/null   # informar si ya hay constitution
6. ls CLAUDE.md 2>/dev/null && wc -l CLAUDE.md 2>/dev/null  # informar si hay CLAUDE.md y tamaño
```

Si hay discrepancias entre lo declarado y lo encontrado (por ejemplo: se declaró `monorepo` pero no existe carpeta `packages/`, o existe `CLAUDE.md` maduro pero se declaró proyecto nuevo), mostrar tabla y pedir confirmación:

| Campo | Declarado en intake | Encontrado en disco |
|-------|--------------------|--------------------|
| repo_structure | [valor L1] | [resultado ls packages/] |
| project_slug | [valor L1] | [resultado package.json] |
| agents existentes | — | [resultado ls .claude/agents/] |
| CI existente | — | [resultado ls .github/workflows/] |
| constitution existente | — | [resultado ls docs/core/] |
| CLAUDE.md existente | — | [resultado ls CLAUDE.md + líneas] |

**Gate phrase:** "I found differences between your answers and the disk state. Can you confirm that the intake information reflects the current state of the project? If the project already has partial governance, brownfield mode (option C in Step 1.6) will protect it from overwrites."

Si no hay discrepancias: continuar sin interrumpir al developer.

---

After Layer 5 is confirmed:

**[INTERNAL] Brownfield intake backup:** If `brownfield: true` in the checkpoint AND `docs/intake/intake.[project-slug].layers-1-5.md` already exists on disk → Read the existing file first → Write backup at `docs/intake/intake.[project-slug].layers-1-5.md.backup-[YYYY-MM-DD]` → Read the backup to verify it exists. If backup Read fails or returns empty → STOP. Announce: "⚠️ Intake backup failed — cannot overwrite previous intake without confirmed backup. Aborting." Do not proceed with the Write below until backup is confirmed.

**Write the intake document:** `Write: docs/intake/intake.[project-slug].layers-1-5.md` — include all confirmed outputs from L1-L5: project_name, pain_point, value_prop, business_model, actors[], actor_profiles[], capabilities[], structural_flags, business_risks[], tech_stack, external_deps[], constraint_list[]. This file is the source of truth that Phase 2-7 and G2-T4 reentry depend on.

Then announce:

> "✅ **Documento de Contexto de Negocio listo:**
> `docs/intake/intake.[project-slug].layers-1-5.md`
>
> Este archivo es tu fuente de verdad. Cualquier desarrollador nuevo al proyecto debería leerlo primero.

```
📋 Session 1 — lo que vamos a generar ahora (~30 min):
  ▸ Constitución — las reglas que el sistema no puede violar
  ▸ governance.config.yaml — parametriza todos los checks automáticos
  ▸ CLAUDE.md — instrucciones operativas para Claude Code
  ▸ Document Registry — índice de todos los artifacts gobernados

Session 2 — podés hacerla ahora o en otra sesión (~30 min):
  ▸ CI Pipeline — automatización de checks en cada PR
  ▸ Primer audit de gobernanza — verificación de coherencia entre todos los artifacts

¿Continuamos con Session 1?
```

**[INTERNAL] Derived flags — compute before checkpoint write:**

Before writing the L5 checkpoint, derive the following flags from confirmed intake fields and include them in the checkpoint JSON:

| Flag | Derivation |
|------|-----------|
| `has_multitenancy` | True if L2 actors include multiple tenant types or org-level isolation |
| `has_rbac` | True if L2 actors have different permission levels |
| `has_financial_flow` | True if L2 actors/capabilities mention payments, billing, or financial transactions |
| `has_performance_sla` | True if L4 business_risks[] include latency, throughput, or availability |
| `has_infra_complexity` | True if L5 hosting = multi-cloud, kubernetes, or edge-distributed |
| `security_risk` | MEDIUM if L4 business_risks[] include "breach", "unauthorized", "auth" / HIGH if data is PII or financial |
| `compliance_risk` | MEDIUM if L4 business_risks[] include regulatory terms (GDPR, HIPAA, SOC2, PCI) |
| `qa_rigor` | LOW if no automated testing mentioned in L3 / MEDIUM if CI/CD present / HIGH if data_criticality=high or financial/health data |

Write these derived flags to the checkpoint JSON (include them in the confirmed output section of L5).

**Checkpoint write (L5):** Write `docs/intake/genesis-checkpoint.json` with `last_completed: "L5"`.

Wait for confirmation before proceeding to Phase 2. Accept: "yes", "ok", "correct", "go ahead", "sí" (any affirmative), or equivalent.

**[INTERNAL — MANDATORY READ GATE]:** After writing the checkpoint above, immediately run: `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase2.md`. Do NOT present any Phase 2 content or announce Session 1 to the developer until this Read completes. This is required — not optional. If the Read returns empty or fails → STOP. Do NOT generate any Phase 2 content. Announce: "⚠️ Cannot load phase file `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase2.md`. Verify the file exists and retry /genesis-governance."

**[INTERNAL] Active state recap — output this block in your response after the checkpoint write:**

```
[ACTIVE STATE — Intake complete]
project: [project_name] | brownfield: [true/false] | lang: [language]
actors: [actor names, comma-sep] | risks: [risk categories, comma-sep]
stack: [language]/[repo_structure]/[hosting]
next: Phase 2 — Constitution
```

---

## PHASE 2-7 — GOVERNANCE DOCUMENTS

**LAZY LOAD — PER FASE — MANDATORY:**

Cargar SOLO el archivo de la fase activa. No leer fases futuras por adelantado.

| Fase | Instrucción |
|------|-------------|
| Phase 2 — Constitution | `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase2.md` |
| Phase 3 — governance.config.yaml | `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase3.md` |
| Phase 4 — CLAUDE.md + Agents | `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase4.md` |
| Phase 5 — Document Registry | `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase5.md` |
| Phase 6 — CI Pipeline | `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase6.md` |
| Phase 7 — First Governance Audit | `Read: ${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase7.md` |

**Antes de Phase 2:** leer `genesis-governance-phase2.md`. Seguir sus instrucciones. Al terminar Phase 2 y antes de Phase 3, leer `genesis-governance-phase3.md`. Continuar así fase por fase.

**No intentar generar ningún documento sin leer primero el archivo de esa fase.**

