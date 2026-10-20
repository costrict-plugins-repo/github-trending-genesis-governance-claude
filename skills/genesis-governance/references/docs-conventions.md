# /genesis-governance-docs — Router (Phases 2-7)

**DEPRECATED como archivo monolítico.** El contenido fue dividido en archivos por fase para reducir el contexto activo por sesión. Este archivo solo existe para compatibilidad con tests y herramientas que lo referencian directamente.

---

## Instrucción de carga (para el skill principal)

El skill `/genesis-governance` carga SOLO el archivo de la fase activa:

| Fase | Archivo a cargar |
|------|-----------------|
| Phase 2 — Constitution | `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase2.md` |
| Phase 3 — governance.config.yaml | `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase3.md` |
| Phase 4 — CLAUDE.md + Agents | `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase4.md` |
| Phase 5 — Document Registry | `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase5.md` |
| Phase 6 — CI Pipeline | `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase6.md` |
| Phase 7 — First Governance Audit | `${CLAUDE_PLUGIN_ROOT}/skills/genesis-governance/references/phase7.md` |

**Regla:** leer SOLO el archivo de la fase en curso. No leer fases futuras por adelantado.

---

<!-- CONTENT MIRROR — mantener sincronizado con archivos de fase individuales -->
<!-- Los tests leen este archivo para verificar invariantes. El contenido completo sigue aquí. -->

