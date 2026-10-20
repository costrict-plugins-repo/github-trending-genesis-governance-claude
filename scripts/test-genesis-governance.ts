/**
 * test-genesis-governance.ts
 *
 * Validates structural invariants of the /genesis-governance skill.
 * Run: pnpm tsx scripts/test-genesis-governance.ts
 *
 * Checks:
 *   I1 — Archivo principal existe
 *   I2 — Sin "PHASE 2 — DERIVATION" (eliminado en Gen3)
 *   I3 — L4 closing summary presente
 *   I4 — Phase numbering: CONSTITUTION=Phase 2, CI PIPELINE=Phase 6, /governance AUDIT=Phase 7
 *   I5 — Checkpoint write instructions presentes (M1)
 *   I6 — Anti-ritual friction en L4 y Phase 2 (M3)
 *   I7 — Emergency exit es hard gate, no soft warning (M2)
 *   I8 — Quick mode tiene fecha de expiración (M4)
 *   I9 — Cross-reference index presente (M7)
 *   I10 — Reentry checkpoint logic presente (M1)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SKILL_PATH = resolve('skills/genesis-governance/SKILL.md');
const DOCS_PATH = resolve('skills/genesis-governance/references/docs-conventions.md'); // router file (kept for compat)
const PHASE_PATHS = [
  resolve('skills/genesis-governance/references/phase2.md'),
  resolve('skills/genesis-governance/references/phase3.md'),
  resolve('skills/genesis-governance/references/phase4.md'),
  resolve('skills/genesis-governance/references/phase5.md'),
  resolve('skills/genesis-governance/references/phase6.md'),
  resolve('skills/genesis-governance/references/phase7.md'),
];

/** Read all phase docs concatenated — source of truth after split */
function readAllDocs(): string {
  return PHASE_PATHS.map(p => existsSync(p) ? readFileSync(p, 'utf-8') : '').join('\n');
}

interface CheckResult {
  id: string;
  description: string;
  pass: boolean;
  detail?: string;
}

/** Check against main skill file only */
function check(id: string, description: string, fn: (content: string) => boolean | string): CheckResult {
  const content = readFileSync(SKILL_PATH, 'utf-8');
  const result = fn(content);
  if (typeof result === 'string') {
    return { id, description, pass: false, detail: result };
  }
  return { id, description, pass: result };
}

/** Check against combined content (main + all phase files) */
function checkAll(id: string, description: string, fn: (content: string) => boolean | string): CheckResult {
  const main = readFileSync(SKILL_PATH, 'utf-8');
  const docs = readAllDocs();
  const content = main + '\n' + docs;
  const result = fn(content);
  if (typeof result === 'string') {
    return { id, description, pass: false, detail: result };
  }
  return { id, description, pass: result };
}

const results: CheckResult[] = [];

// I1 — Skill file exists
results.push({
  id: 'I1',
  description: 'Archivo principal genesis-governance.md existe',
  pass: existsSync(SKILL_PATH),
  detail: existsSync(SKILL_PATH) ? undefined : `Not found at ${SKILL_PATH}`,
});

// I2 — No "PHASE 2 — DERIVATION" (check both files)
results.push(checkAll('I2', 'Sin "PHASE 2 — DERIVATION" en el skill', (content) => {
  const matches = content.match(/PHASE 2 — DERIVATION/g);
  if (matches) return `Found ${matches.length} occurrence(s) of "PHASE 2 — DERIVATION" — should have been removed in Gen3`;
  return true;
}));

// I3 — L4 closing summary present (main file only)
results.push(check('I3', 'L4 closing summary presente', (content) => {
  if (!content.includes('L4 closing summary')) return 'L4 closing summary block not found in skill';
  return true;
}));

// I4 — Phase numbering correct (check docs file for Phase 2-7)
results.push(checkAll('I4', 'Phase numbering: CONSTITUTION=Phase 2, CI=Phase 6, AUDIT=Phase 7', (content) => {
  const errors: string[] = [];
  if (!content.includes('## PHASE 2 — CONSTITUTION')) errors.push('PHASE 2 — CONSTITUTION not found');
  if (!content.includes('## PHASE 6 — CI PIPELINE')) errors.push('PHASE 6 — CI PIPELINE not found');
  if (!content.includes('## PHASE 7 — FIRST GOVERNANCE AUDIT')) errors.push('PHASE 7 — FIRST GOVERNANCE AUDIT not found');
  if (!content.includes('## PHASE 3 — governance.config.yaml')) errors.push('PHASE 3 not found');
  if (!content.includes('## PHASE 4 — CLAUDE.md')) errors.push('PHASE 4 not found');
  if (!content.includes('## PHASE 5 — DOCUMENT REGISTRY')) errors.push('PHASE 5 not found');
  if (errors.length > 0) return errors.join('; ');
  return true;
}));

// I5 — Checkpoint write instructions present (check both files)
results.push(checkAll('I5', 'Checkpoint write instructions presentes en gates clave', (content) => {
  const expected = [
    'Checkpoint write (L1)',
    'Checkpoint write (L5)',
    'Checkpoint write (Phase 2)',
    'Checkpoint write (Phase 3)',
    'Checkpoint write (Phase 4)',
    'Checkpoint write (Phase 5)',
    'Checkpoint write (Phase 6)',
    'Checkpoint write (Phase 7)',
  ];
  const missing = expected.filter(s => !content.includes(s));
  if (missing.length > 0) return `Missing checkpoint instructions: ${missing.join(', ')}`;
  return true;
}));

// I6 — Anti-ritual friction at L4 and Phase 2 (check both files)
results.push(checkAll('I6', 'Anti-ritual friction presente en L4 y Phase 2', (content) => {
  const errors: string[] = [];
  if (!content.includes('cuál es el riesgo principal que identificamos para')) {
    errors.push('L4 anti-ritual question not found');
  }
  if (!content.includes('What is the most important invariant from §4')) {
    errors.push('Phase 2 anti-ritual question not found');
  }
  if (errors.length > 0) return errors.join('; ');
  return true;
}));

// I7 — Emergency exit is hard gate (not soft warning)
results.push(check('I7', 'Emergency exit es hard gate (no soft warning)', (content) => {
  if (content.includes('Continue with what you have, or pause and return when the business is clearer?')) {
    return 'Old soft warning still present — should be replaced with hard gate (M2)';
  }
  if (!content.includes('hard gate')) return 'Hard gate marker not found in emergency exit';
  if (!content.includes('incomplete.md')) return 'Emergency exit should write incomplete.md file';
  return true;
}));

// I8 — Quick mode has expiry date
results.push(check('I8', 'Quick mode CLAUDE.md tiene fecha de expiración', (content) => {
  if (!content.includes('Gobernanza incompleta')) return 'Quick mode expiry section "Gobernanza incompleta" not found (M4)';
  if (!content.includes('FECHA-ISO + 30 días')) return 'Expiry date placeholder not found in quick mode template';
  return true;
}));

// I9 — Cross-reference index present
results.push(check('I9', 'Cross-reference index presente (M7)', (content) => {
  if (!content.includes('Cross-reference index')) return 'Cross-reference index section not found (M7)';
  if (!content.includes('Consumidores downstream clave')) return 'Cross-reference table missing downstream consumers column';
  return true;
}));

// I10 — Reentry checkpoint logic present
results.push(checkAll('I10', 'Reentry checkpoint logic presente (M1)', (content) => {
  if (!content.includes('genesis-checkpoint.json')) return 'genesis-checkpoint.json not referenced in skill';
  if (!content.includes('last_completed')) return 'Checkpoint last_completed field not defined';
  if (!content.includes('last_completed: "Phase6"')) return 'Phase6 resume rule not found in checkpoint logic';
  return true;
}));

// I11 — M6 lazy-load per-phase: all 6 phase files exist y main file tiene instrucción per-fase
results.push({
  id: 'I11',
  description: 'M6 lazy-load per-fase: 6 phase files existen y main file tiene instrucción de carga por fase',
  pass: (() => {
    if (!PHASE_PATHS.every(p => existsSync(p))) return false;
    const main = readFileSync(SKILL_PATH, 'utf-8');
    return main.includes('references/phase2.md') &&
           main.includes('references/phase3.md') &&
           main.includes('references/phase6.md');
  })(),
  detail: (() => {
    const missing = PHASE_PATHS.filter(p => !existsSync(p));
    if (missing.length > 0) return `Phase files missing: ${missing.join(', ')}`;
    const main = readFileSync(SKILL_PATH, 'utf-8');
    if (!main.includes('references/phase2.md')) return 'Main skill missing per-phase lazy-load reference';
    return undefined;
  })(),
});

// -----------------------------------------------------------------------
// M1 SIMULATION — Checkpoint resume: all last_completed values covered
// -----------------------------------------------------------------------

// I12 — M1: all 10 resume rules present (L1-L4, L5, Phase2-Phase6)
results.push(check('I12', 'M1 sim: todas las reglas de resume presentes (10 valores)', (content) => {
  const resumeRules = [
    'last_completed: "Phase6"',
    'last_completed: "Phase5"',
    'last_completed: "Phase4"',
    'last_completed: "Phase3"',
    'last_completed: "Phase2"',
    'last_completed: "L5"',
    'last_completed: "L4"',
    'last_completed: "L3"',
    'last_completed: "L2"',
    'last_completed: "L1"',
  ];
  const missing = resumeRules.filter(r => !content.includes(r));
  if (missing.length > 0) return `Resume rules missing: ${missing.join(', ')}`;
  return true;
}));

// I13 — M1: resume de Phase6 anuncia Phase 7 (el más crítico — sesión casi completa)
results.push(check('I13', 'M1 sim: Phase6 resume anuncia "Retomo desde Phase 7"', (content) => {
  // The Phase6 rule should mention jumping to Phase 7
  const phase6Block = content.substring(
    content.indexOf('last_completed: "Phase6"'),
    content.indexOf('last_completed: "Phase5"')
  );
  if (!phase6Block.includes('Phase 7')) return 'Phase6 resume rule does not reference Phase 7 jump';
  return true;
}));

// I14 — M1: checkpoint schema tiene los 4 campos requeridos
results.push(check('I14', 'M1 sim: schema checkpoint tiene project_name, last_completed, timestamp, quick_mode', (content) => {
  const schema = ['project_name', 'last_completed', 'timestamp', 'quick_mode'];
  const missing = schema.filter(f => !content.includes(`"${f}"`));
  if (missing.length > 0) return `Checkpoint schema missing fields: ${missing.join(', ')}`;
  return true;
}));

// -----------------------------------------------------------------------
// M6 SIMULATION — Lazy-load separation: clean cut between main and docs
// -----------------------------------------------------------------------

// I15 — M6: main file NO contiene "## PHASE 2" ni "## PHASE 3" (separación limpia)
results.push(check('I15', 'M6 sim: main file no contiene Phase 2-7 como secciones propias', (content) => {
  const forbidden = ['## PHASE 2', '## PHASE 3', '## PHASE 4', '## PHASE 5', '## PHASE 6', '## PHASE 7'];
  // Allow the "## PHASE 2-7 — GOVERNANCE DOCUMENTS" umbrella header (lazy-load section)
  // but NOT individual phase headers that would mean content is present
  const errors: string[] = [];
  for (const header of forbidden) {
    // The main file has "## PHASE 2-7" (combined) — exclude that
    const idx = content.indexOf(header);
    if (idx !== -1) {
      // Check it's not part of "## PHASE 2-7"
      const snippet = content.substring(idx, idx + 30);
      if (!snippet.startsWith('## PHASE 2-7')) {
        errors.push(`Found "${header}" in main file — Phase content leaked into main`);
      }
    }
  }
  if (errors.length > 0) return errors.join('; ');
  return true;
}));

// I16 — M6: lazy-load per-fase instruction is at the END of main file (after all intake layers)
results.push(check('I16', 'M6 sim: instrucción LAZY LOAD PER FASE está al final del main file (post-L5)', (content) => {
  const lazyLoadIdx = content.indexOf('LAZY LOAD — PER FASE');
  const l5Idx = content.indexOf('Checkpoint write (L5)');
  if (lazyLoadIdx === -1) return 'LAZY LOAD — PER FASE instruction not found in main skill';
  if (l5Idx === -1) return 'Checkpoint write (L5) not found — cannot verify ordering';
  if (lazyLoadIdx < l5Idx) return `LAZY LOAD appears BEFORE L5 checkpoint (idx ${lazyLoadIdx} < ${l5Idx}) — ordering wrong`;
  return true;
}));

// I17 — M6: docs file abre con "## PHASE 2" como primer header de fase
results.push({
  id: 'I17',
  description: 'M6 sim: docs file abre con ## PHASE 2 como primer header de implementación',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    // First ## PHASE header in docs file should be PHASE 2
    const firstPhaseHeader = docs.match(/^## PHASE \d/m)?.[0];
    return firstPhaseHeader === '## PHASE 2';
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const firstPhaseHeader = docs.match(/^## PHASE \d/m)?.[0];
    if (!firstPhaseHeader) return 'No ## PHASE N header found in docs file';
    if (firstPhaseHeader !== '## PHASE 2') return `First phase header is "${firstPhaseHeader}" — expected "## PHASE 2"`;
    return undefined;
  })(),
});

// I19 — M1: instrucción Read explícita para checkpoint (no solo "check for")
results.push(check('I19', 'M1 fix: instrucción Read explícita para genesis-checkpoint.json antes del intake', (content) => {
  // Must have an explicit Read: docs/intake/genesis-checkpoint.json instruction
  if (!content.includes('Read: docs/intake/genesis-checkpoint.json')) {
    return 'No explicit Read tool instruction for genesis-checkpoint.json — model may skip the tool call';
  }
  // That Read instruction must appear BEFORE the intake wizard (PHASE 1)
  const readIdx = content.indexOf('Read: docs/intake/genesis-checkpoint.json');
  const phase1Idx = content.indexOf('## PHASE 1 — INTAKE WIZARD');
  if (phase1Idx === -1) return 'PHASE 1 INTAKE WIZARD header not found — cannot verify ordering';
  if (readIdx > phase1Idx) return `Read instruction appears AFTER PHASE 1 (idx ${readIdx} > ${phase1Idx}) — will not trigger on startup`;
  return true;
}));

// I18 — M6: docs file contiene todos los checkpoints Phase 2-7 (separación completa)
results.push({
  id: 'I18',
  description: 'M6 sim: docs file contiene checkpoints Phase 2 hasta Phase 7 (sin gaps)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    // Accept both YAML style (last_completed: "PhaseN") and JSON style ("last_completed": "PhaseN")
    const expected = ['Phase2', 'Phase3', 'Phase4', 'Phase5', 'Phase6', 'Phase7'];
    return expected.every(p => docs.includes(`last_completed: "${p}"`) || docs.includes(`"last_completed": "${p}"`));
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const expected = ['Phase2', 'Phase3', 'Phase4', 'Phase5', 'Phase6', 'Phase7'];
    const missing = expected.filter(p => !docs.includes(`last_completed: "${p}"`) && !docs.includes(`"last_completed": "${p}"`));
    if (missing.length > 0) return `Docs file missing checkpoint writes: ${missing.join(', ')}`;
    return undefined;
  })(),
});

// -----------------------------------------------------------------------
// PHASE 4b — Agent generation: structural invariants
// -----------------------------------------------------------------------

// I20 — Phase 4b section exists in docs file
results.push({
  id: 'I20',
  description: 'Phase 4b — AGENT DEFINITIONS section existe en docs file',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    return readAllDocs().includes('### Phase 4b — AGENT DEFINITIONS');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    !readAllDocs().includes('### Phase 4b — AGENT DEFINITIONS') ?
    'Phase 4b section header not found in docs' : undefined,
});

// I21 — All 6 universal agents listed in Capa 1
results.push({
  id: 'I21',
  description: 'Phase 4b — los 6 agentes universales (Capa 1) están definidos',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    const universalAgents = ['architect', 'backend-engineer', 'frontend-engineer', 'git-ops', 'governance-auditor', 'spec-writer'];
    return universalAgents.every(a => docs.includes(`\`${a}\``));
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const universalAgents = ['architect', 'backend-engineer', 'frontend-engineer', 'git-ops', 'governance-auditor', 'spec-writer'];
    const missing = universalAgents.filter(a => !docs.includes(`\`${a}\``));
    if (missing.length > 0) return `Missing universal agents: ${missing.join(', ')}`;
    return undefined;
  })(),
});

// I22 — Activation table has all 12 Capa 2 agents (11 original + accessibility-reviewer)
results.push({
  id: 'I22',
  description: 'Phase 4b — los 12 agentes opcionales (Capa 2) están en la tabla de activación',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    const optionalAgents = [
      'test-engineer', 'database-engineer', 'devops-engineer',
      'security-reviewer', 'api-contract-reviewer', 'performance-reviewer',
      'compliance-reviewer', 'mobile-qa-reviewer', 'ai-output-reviewer',
      'qa-verification-gate', 'release-smoke-auditor', 'accessibility-reviewer',
    ];
    return optionalAgents.every(a => docs.includes(a));
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const optionalAgents = [
      'test-engineer', 'database-engineer', 'devops-engineer',
      'security-reviewer', 'api-contract-reviewer', 'performance-reviewer',
      'compliance-reviewer', 'mobile-qa-reviewer', 'ai-output-reviewer',
      'qa-verification-gate', 'release-smoke-auditor', 'accessibility-reviewer',
    ];
    const missing = optionalAgents.filter(a => !docs.includes(a));
    if (missing.length > 0) return `Missing optional agents: ${missing.join(', ')}`;
    return undefined;
  })(),
});

// I23 — Domain agent limit of 3 is documented
results.push({
  id: 'I23',
  description: 'Phase 4b — límite de 3 agentes de dominio (Capa 3) documentado',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('maximum 3') || docs.includes('máximo 3');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    'Domain agent limit "maximum 3" or "máximo 3" not found in Phase 4b',
});

// I24 — Checkpoint Phase 4 includes agents_generated field
results.push({
  id: 'I24',
  description: 'Phase 4b — checkpoint Phase 4 incluye campo agents_generated',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    return readAllDocs().includes('"agents_generated"');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    'agents_generated field not found in Phase 4 checkpoint schema',
});

// I25 — Placeholder format {snake_case} is used consistently
results.push({
  id: 'I25',
  description: 'Phase 4b — formato de placeholders {snake_case} presente y consistente',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    // Check key placeholders are present
    return docs.includes('{project}') && docs.includes('{packages.frontend}') && docs.includes('{packages.backend}');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const required = ['{project}', '{packages.frontend}', '{packages.backend}'];
    const missing = required.filter(p => !docs.includes(p));
    if (missing.length > 0) return `Missing placeholders: ${missing.join(', ')}`;
    return undefined;
  })(),
});

// I26 — Phase 4b explicitly notes agent files are NOT added to document registry
results.push({
  id: 'I26',
  description: 'Phase 4b — nota explícita: agent files NO se agregan al document registry',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('agent files are NOT added to document registry') ||
           docs.includes('NOT added to document registry');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    'Explicit note about agents NOT being in document registry not found in Phase 4b',
});

// -----------------------------------------------------------------------
// STANDARDS HARDENING — F1-F5 structural invariants
// -----------------------------------------------------------------------

// I27 — Phase 2 conditional artifacts block present (model card + DPIA)
results.push({
  id: 'I27',
  description: 'Standards F1: Phase 2 conditional artifacts block presente (model card, DPIA)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Phase 2 — Conditional artifacts') &&
           docs.includes('Model card') &&
           docs.includes('DPIA template');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const checks = [
      ['Phase 2 — Conditional artifacts', 'Phase 2 conditional artifacts block missing'],
      ['Model card', 'Model card conditional not found'],
      ['DPIA template', 'DPIA template conditional not found'],
    ] as const;
    const failed = checks.filter(([token]) => !docs.includes(token)).map(([, msg]) => msg);
    if (failed.length > 0) return failed.join('; ');
    return undefined;
  })(),
});

// I28 — Phase 3 conditional artifacts block present (threat model + SLO/SLI)
results.push({
  id: 'I28',
  description: 'Standards F1: Phase 3 conditional artifacts block presente (threat model, SLO/SLI)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Phase 3 — Conditional artifacts') &&
           docs.includes('Threat model') &&
           docs.includes('SLO/SLI document');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const checks = [
      ['Phase 3 — Conditional artifacts', 'Phase 3 conditional artifacts block missing'],
      ['Threat model', 'Threat model conditional not found'],
      ['SLO/SLI document', 'SLO/SLI document conditional not found'],
    ] as const;
    const failed = checks.filter(([token]) => !docs.includes(token)).map(([, msg]) => msg);
    if (failed.length > 0) return failed.join('; ');
    return undefined;
  })(),
});

// I29 — Phase 4 generates PR template
results.push({
  id: 'I29',
  description: 'Standards F2: Phase 4 genera PR template (.github/pull_request_template.md)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('pull_request_template.md') && docs.includes('Pre-merge checklist');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('pull_request_template.md')) return 'pull_request_template.md not found in Phase 4';
    if (!docs.includes('Pre-merge checklist')) return 'Pre-merge checklist not found in PR template';
    return undefined;
  })(),
});

// I30 — Phase 4 generates ADR template
results.push({
  id: 'I30',
  description: 'Standards F2: Phase 4 genera ADR template (docs/adr/adr-000-template.md)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('adr-000-template.md');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    !readAllDocs().includes('adr-000-template.md') ?
    'ADR template (adr-000-template.md) not found in Phase 4' : undefined,
});

// I31 — Phase 6 generates on-call runbook
results.push({
  id: 'I31',
  description: 'Standards F1: Phase 6 genera on-call runbook (oncall-runbook.{project-slug}.md)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('oncall-runbook') && docs.includes('Phase 6 — Operational templates');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Phase 6 — Operational templates')) return 'Phase 6 operational templates block missing';
    if (!docs.includes('oncall-runbook')) return 'On-call runbook not found in Phase 6 operational templates';
    return undefined;
  })(),
});

// I32 — Phase 6 generates post-mortem template
results.push({
  id: 'I32',
  description: 'Standards F2: Phase 6 genera post-mortem template',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('post-mortem-template.md');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    !readAllDocs().includes('post-mortem-template.md') ?
    'Post-mortem template not found in Phase 6 operational templates' : undefined,
});

// I34 — Phase 5 generates validate-doc-registry.ts script
results.push({
  id: 'I34',
  description: 'Standards gap fix: Phase 5 genera scripts/validate-doc-registry.ts',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('validate-doc-registry.ts') &&
           docs.includes('Write: `scripts/validate-doc-registry.ts`') &&
           docs.includes('REGISTRY_PATH_NOT_FOUND') &&
           docs.includes('UNREGISTERED_ARTIFACT');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const checks: [string, string][] = [
      ['Write: `scripts/validate-doc-registry.ts`', 'Write instruction for script not found in Phase 5'],
      ['REGISTRY_PATH_NOT_FOUND', 'Script content missing REGISTRY_PATH_NOT_FOUND check'],
      ['UNREGISTERED_ARTIFACT',   'Script content missing UNREGISTERED_ARTIFACT check'],
    ];
    const failed = checks.filter(([token]) => !docs.includes(token)).map(([, msg]) => msg);
    if (failed.length > 0) return failed.join('; ');
    return undefined;
  })(),
});

// I33 — accessibility-reviewer in Capa 2 with WCAG activation signal
results.push({
  id: 'I33',
  description: 'Standards F5: accessibility-reviewer en Capa 2 con señal de activación frontend',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('accessibility-reviewer') && docs.includes('WCAG');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('accessibility-reviewer')) return 'accessibility-reviewer not found in docs';
    if (!docs.includes('WCAG')) return 'WCAG not mentioned alongside accessibility-reviewer';
    return undefined;
  })(),
});

// -----------------------------------------------------------------------
// FASE 7 — Runtime governance: F7.1-F7.7 structural invariants
// -----------------------------------------------------------------------

// I35 — F7.1: Phase 4b idempotency check-before-write rule
results.push({
  id: 'I35',
  description: 'F7.1: Phase 4b tiene regla de idempotencia (check antes de Write)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Idempotency rule') && docs.includes('already correct, skipped');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Idempotency rule')) return 'Idempotency rule not found in Phase 4b Step 2';
    if (!docs.includes('already correct, skipped')) return 'Skip log message "already correct, skipped" not found';
    return undefined;
  })(),
});

// I36 — F7.2: Phase 7 instructs git tag after audit commit
results.push({
  id: 'I36',
  description: 'F7.2: Phase 7 instruye git tag governance/YYYY-MM-DD tras el audit',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('git tag governance/') && docs.includes('lightweight tag');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('git tag governance/')) return 'git tag governance/ instruction not found in Phase 7';
    if (!docs.includes('lightweight tag')) return 'Explanation of lightweight tag not found — rationale missing';
    return undefined;
  })(),
});

// I37 — F7.3: Phase 4 CLAUDE.md structure includes Governance Cadence section
results.push({
  id: 'I37',
  description: 'F7.3: Phase 4 CLAUDE.md structure incluye sección Governance Cadence',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('[PROJECT-SPECIFIC] Governance Cadence') && docs.toLowerCase().includes('quarterly');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('[PROJECT-SPECIFIC] Governance Cadence')) return 'Governance Cadence section not found in Phase 4 CLAUDE.md structure';
    if (!docs.toLowerCase().includes('quarterly')) return 'Quarterly cadence not mentioned in Governance Cadence section';
    return undefined;
  })(),
});

// I38 — F7.4: Phase 2 generates constitution-checks.ts
results.push({
  id: 'I38',
  description: 'F7.4: Phase 2 genera scripts/constitution-checks.ts (MUST NOT invariants)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('constitution-checks.ts') &&
           docs.includes('Write: `scripts/constitution-checks.ts`') &&
           docs.includes('MUST NOT');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Write: `scripts/constitution-checks.ts`')) return 'Write instruction for constitution-checks.ts not found in Phase 2';
    if (!docs.includes('MUST NOT')) return 'MUST NOT invariant reference not found in constitution-checks block';
    return undefined;
  })(),
});

// I39 — F7.5: Phase 6 on-call runbook has executable commands derived from stack
results.push({
  id: 'I39',
  description: 'F7.5: Phase 6 runbook instruye comandos ejecutables derivados del stack',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Executable commands') && docs.includes('{deployment.url}') && docs.includes('{health.endpoint}');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Executable commands')) return '"Executable commands" instruction not found in on-call runbook block';
    if (!docs.includes('{deployment.url}')) return '{deployment.url} placeholder not found in runbook commands';
    if (!docs.includes('{health.endpoint}')) return '{health.endpoint} placeholder not found in runbook commands';
    return undefined;
  })(),
});

// I40 — F7.6: Phase 6 precondition table has axe-core accessibility step
results.push({
  id: 'I40',
  description: 'F7.6: Phase 6 tabla de precondiciones incluye axe-core (frontend en stack)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('axe-core') && docs.includes('wcag2aa');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('axe-core')) return 'axe-core not found in Phase 6 precondition derivation table';
    if (!docs.includes('wcag2aa')) return 'wcag2aa tag not found in axe-core step';
    return undefined;
  })(),
});

// I41 — F7.7: Phase 2 model card includes sections (9) data lineage, (10) model versioning, (11) FRIA
results.push({
  id: 'I41',
  description: 'F7.7: Phase 2 model card incluye (9) data lineage, (10) model versioning, (11) FRIA',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Data lineage') &&
           docs.includes('Model versioning governance') &&
           docs.includes('FRIA') &&
           docs.includes('EU AI Act Art. 27');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const checks: [string, string][] = [
      ['Data lineage', 'Data lineage section (9) not found in model card'],
      ['Model versioning governance', 'Model versioning governance section (10) not found in model card'],
      ['FRIA', 'FRIA section (11) not found in model card'],
      ['EU AI Act Art. 27', 'EU AI Act Art. 27 reference not found in FRIA section'],
    ];
    const failed = checks.filter(([token]) => !docs.includes(token)).map(([, msg]) => msg);
    if (failed.length > 0) return failed.join('; ');
    return undefined;
  })(),
});

// -----------------------------------------------------------------------
// FASE 8 — genesis-sync: F7.8 structural invariants
// -----------------------------------------------------------------------

// I42 — genesis-sync skill file exists
results.push({
  id: 'I42',
  description: 'F7.8: genesis-sync SKILL.md existe en skills/genesis-sync/',
  pass: existsSync(resolve('skills/genesis-sync/SKILL.md')),
  detail: !existsSync(resolve('skills/genesis-sync/SKILL.md'))
    ? 'genesis-sync.md not found at skills/genesis-sync/SKILL.md'
    : undefined,
});

// I43 — genesis-sync has all 5 drift dimensions
results.push({
  id: 'I43',
  description: 'F7.8: genesis-sync tiene las 5 dimensiones de drift (D-SYNC-1 a D-SYNC-5)',
  pass: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return false;
    const content = readFileSync(syncPath, 'utf-8');
    const dimensions = ['D-SYNC-1', 'D-SYNC-2', 'D-SYNC-3', 'D-SYNC-4', 'D-SYNC-5'];
    return dimensions.every(d => content.includes(d));
  })(),
  detail: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return 'genesis-sync.md not found';
    const content = readFileSync(syncPath, 'utf-8');
    const dimensions = ['D-SYNC-1', 'D-SYNC-2', 'D-SYNC-3', 'D-SYNC-4', 'D-SYNC-5'];
    const missing = dimensions.filter(d => !content.includes(d));
    if (missing.length > 0) return `Missing drift dimensions: ${missing.join(', ')}`;
    return undefined;
  })(),
});

// I44 — genesis-sync has checkpoint migration path (v1.0 → v1.1)
results.push({
  id: 'I44',
  description: 'F7.8: genesis-sync tiene Checkpoint Migration (v1.0 → v1.1)',
  pass: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return false;
    const content = readFileSync(syncPath, 'utf-8');
    return content.includes('Checkpoint Migration') && content.includes('genesis_version') && content.includes('1.1');
  })(),
  detail: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return 'genesis-sync.md not found';
    const content = readFileSync(syncPath, 'utf-8');
    if (!content.includes('Checkpoint Migration')) return 'Checkpoint Migration section not found in genesis-sync';
    if (!content.includes('genesis_version')) return 'genesis_version field not referenced in migration';
    if (!content.includes('1.1')) return 'v1.1 version not mentioned in migration';
    return undefined;
  })(),
});

// I45 — Phase 5 checkpoint in docs file writes genesis_version 1.1 or later (1.2+ accepted — R-F6 bumped to 1.2)
results.push({
  id: 'I45',
  description: 'F7.8: Phase 5 checkpoint escribe schema v1.1+ (genesis_version + packages[] + env_vars[])',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return (docs.includes('"genesis_version": "1.1"') || docs.includes('"genesis_version": "1.2"')) &&
           docs.includes('"packages":') &&
           docs.includes('"env_vars":') &&
           docs.includes('"boundary_rules":');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const hasVersion = docs.includes('"genesis_version": "1.1"') || docs.includes('"genesis_version": "1.2"');
    const checks: [boolean, string][] = [
      [hasVersion, 'genesis_version 1.1/1.2 not found in Phase 5 checkpoint schema'],
      [docs.includes('"packages":'), '"packages" field not in Phase 5 checkpoint'],
      [docs.includes('"env_vars":'), '"env_vars" field not in Phase 5 checkpoint'],
      [docs.includes('"boundary_rules":'), '"boundary_rules" field not in Phase 5 checkpoint'],
    ];
    const failed = checks.filter(([pass]) => !pass).map(([, msg]) => msg);
    if (failed.length > 0) return failed.join('; ');
    return undefined;
  })(),
});

// I46 — genesis-sync is referenced in Session 1 and Session 2 complete messages
results.push({
  id: 'I46',
  description: 'F7.8: /genesis-sync mencionado en mensajes Session Complete (S1 + S2)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('/genesis-sync');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('/genesis-sync')) return '/genesis-sync not referenced in genesis-governance-docs.md';
    return undefined;
  })(),
});

// -----------------------------------------------------------------------
// QUALITY AUDIT — F7.1-F7.8 content correctness checks (I47-I50)
// -----------------------------------------------------------------------

// I47 — genesis-sync.md no usa notación YAML (key sin comillas) para genesis_version
results.push({
  id: 'I47',
  description: 'Quality: genesis-sync.md usa notación JSON correcta para genesis_version (no YAML-style key sin comillas)',
  pass: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return false;
    const sync = readFileSync(syncPath, 'utf-8');
    // Must NOT contain `genesis_version: "1.1"` (YAML key without quotes)
    // In JSON code blocks, the key has quotes: "genesis_version": "1.1"
    return !sync.includes('genesis_version: "1.1"');
  })(),
  detail: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return 'genesis-sync.md not found';
    const sync = readFileSync(syncPath, 'utf-8');
    if (sync.includes('genesis_version: "1.1"')) {
      return 'genesis-sync.md contains YAML-style notation `genesis_version: "1.1"` — should use JSON-aware prose ("genesis_version" field)';
    }
    return undefined;
  })(),
});

// I48 — constitution-checks.ts template tiene advertencia de path para monorepos
results.push({
  id: 'I48',
  description: 'Quality: constitution-checks.ts template advierte que path.join(ROOT, \'src\') debe ajustarse para monorepos',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    // Must contain a monorepo advisory comment near the src path
    return docs.toLowerCase().includes('monorepo') && docs.includes("path.join(ROOT, 'src')");
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.toLowerCase().includes('monorepo')) return 'constitution-checks.ts template missing monorepo advisory comment';
    return undefined;
  })(),
});

// I49 — Checkpoint v1.1 schema usa arrays vacíos como default (no texto descriptivo dentro del array)
results.push({
  id: 'I49',
  description: 'Quality: Checkpoint v1.1 schema no tiene texto descriptivo dentro de arrays (usa [] o valores concretos)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    // Must NOT contain descriptive text as array values (the old "[list of..." pattern)
    return !docs.includes('"[list of') && !docs.includes('"[list from Phase 4b');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (docs.includes('"[list of')) return 'Checkpoint schema has descriptive text inside array value: \'"[list of..."\' — JSON-invalid template notation';
    if (docs.includes('"[list from Phase 4b')) return 'agents_generated[] still has descriptive text as array value';
    return undefined;
  })(),
});

// I50 — Checkpoint Migration Step 4 documenta el mapeo hard_constraints → boundary_rules
results.push({
  id: 'I50',
  description: 'Quality: Checkpoint Migration Step 4 especifica mapeo de hard_constraints a boundary_rules[] con import_boundary',
  pass: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return false;
    const sync = readFileSync(syncPath, 'utf-8');
    return sync.includes('hard_constraints') && sync.includes('import_boundary');
  })(),
  detail: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return 'genesis-sync.md not found';
    const sync = readFileSync(syncPath, 'utf-8');
    if (!sync.includes('hard_constraints')) return 'Checkpoint Migration Step 4 does not mention hard_constraints extraction';
    if (!sync.includes('import_boundary')) return 'Checkpoint Migration Step 4 does not specify import_boundary filter for boundary_rules[]';
    return undefined;
  })(),
});

// -----------------------------------------------------------------------
// BROWNFIELD F1 — Backup automático: structural invariants (I51-I56)
// -----------------------------------------------------------------------

// I51 — Phase 2 tiene brownfield safeguard para constitution.md
results.push({
  id: 'I51',
  description: 'Brownfield F1: Phase 2 tiene brownfield safeguard para constitution.md',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Brownfield safeguard') &&
           docs.includes('spec.{project-slug}.core.constitution.md.backup-YYYY-MM-DD');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Brownfield safeguard')) return '"Brownfield safeguard" block not found in docs file';
    if (!docs.includes('spec.{project-slug}.core.constitution.md.backup-YYYY-MM-DD')) return 'Phase 2 backup instruction for constitution.md not found';
    return undefined;
  })(),
});

// I52 — Phase 3 tiene brownfield safeguard para governance.config.yaml
results.push({
  id: 'I52',
  description: 'Brownfield F1: Phase 3 tiene brownfield safeguard para governance.config.yaml',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('governance.config.yaml.backup-YYYY-MM-DD');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    !readAllDocs().includes('governance.config.yaml.backup-YYYY-MM-DD') ?
    'Phase 3 backup instruction for governance.config.yaml not found' : undefined,
});

// I53 — Phase 4 tiene brownfield safeguard para CLAUDE.md
results.push({
  id: 'I53',
  description: 'Brownfield F1: Phase 4 tiene brownfield safeguard para CLAUDE.md',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('CLAUDE.md.backup-YYYY-MM-DD');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    !readAllDocs().includes('CLAUDE.md.backup-YYYY-MM-DD') ?
    'Phase 4 backup instruction for CLAUDE.md not found' : undefined,
});

// I54 — Phase 4b idempotency rule extendida para overwrite con backup
results.push({
  id: 'I54',
  description: 'Brownfield F1: Phase 4b idempotency rule extendida — overwrite path crea backup',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Brownfield safeguard — overwrite path') &&
           docs.includes('.claude/agents/{name}.md.backup-YYYY-MM-DD');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Brownfield safeguard — overwrite path')) return '"Brownfield safeguard — overwrite path" not found in Phase 4b';
    if (!docs.includes('.claude/agents/{name}.md.backup-YYYY-MM-DD')) return 'Phase 4b agent backup instruction not found';
    return undefined;
  })(),
});

// I55 — Phase 5 tiene brownfield safeguard para document-registry.md
results.push({
  id: 'I55',
  description: 'Brownfield F1: Phase 5 tiene brownfield safeguard para document-registry.md',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('document-registry.md.backup-YYYY-MM-DD');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    !readAllDocs().includes('document-registry.md.backup-YYYY-MM-DD') ?
    'Phase 5 backup instruction for document-registry.md not found' : undefined,
});

// I56 — Phase 6 tiene brownfield safeguard para ci.yml
results.push({
  id: 'I56',
  description: 'Brownfield F1: Phase 6 tiene brownfield safeguard para ci.yml',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('ci.yml.backup-YYYY-MM-DD');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    !readAllDocs().includes('ci.yml.backup-YYYY-MM-DD') ?
    'Phase 6 backup instruction for ci.yml not found' : undefined,
});

// -----------------------------------------------------------------------
// BROWNFIELD F5 — Tests negativos + adaptación ecosistema (I71-I75)
// -----------------------------------------------------------------------

// I71 — Phase 2 tiene nota de adaptación para proyectos no-TypeScript
results.push({
  id: 'I71',
  description: 'Brownfield F5: Phase 2 tiene nota de adaptación de constitution-checks.ts para no-TypeScript',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Nota de adaptación para proyectos no-TypeScript') &&
           docs.includes('grep wrapper');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Nota de adaptación para proyectos no-TypeScript')) return 'Non-TypeScript adaptation note not found in Phase 2';
    if (!docs.includes('grep wrapper')) return '"grep wrapper" description not found in adaptation note';
    return undefined;
  })(),
});

// I72 — La instrucción de backup aparece ANTES de la instrucción de write en cada fase
results.push({
  id: 'I72',
  description: 'Brownfield F5: instrucción de backup aparece ANTES de la instrucción write/append en cada fase (ordering)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    // Check that in Phase 2, the backup safeguard appears before the **File:** instruction
    const p2BackupIdx = docs.indexOf('spec.{project-slug}.core.constitution.md.backup-YYYY-MM-DD');
    const p2FileIdx   = docs.indexOf('**File:** `docs/core/spec.{project-slug}.core.constitution.md`');
    if (p2BackupIdx === -1 || p2FileIdx === -1) return false;
    if (p2BackupIdx >= p2FileIdx) return false;
    // Check Phase 3: backup before **File:**
    const p3BackupIdx = docs.indexOf('governance.config.yaml.backup-YYYY-MM-DD');
    const p3FileIdx   = docs.indexOf('**File:** `governance.config.yaml` (root of project)');
    if (p3BackupIdx === -1 || p3FileIdx === -1) return false;
    if (p3BackupIdx >= p3FileIdx) return false;
    // Check Phase 4: backup before **File:** CLAUDE.md
    const p4BackupIdx = docs.indexOf('CLAUDE.md.backup-YYYY-MM-DD');
    const p4FileIdx   = docs.indexOf('**File:** `CLAUDE.md` (root of project)');
    if (p4BackupIdx === -1 || p4FileIdx === -1) return false;
    if (p4BackupIdx >= p4FileIdx) return false;
    return true;
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const checks = [
      ['spec.{project-slug}.core.constitution.md.backup-YYYY-MM-DD', '**File:** `docs/core/spec.{project-slug}.core.constitution.md`', 'Phase 2'],
      ['governance.config.yaml.backup-YYYY-MM-DD', '**File:** `governance.config.yaml` (root of project)', 'Phase 3'],
      ['CLAUDE.md.backup-YYYY-MM-DD', '**File:** `CLAUDE.md` (root of project)', 'Phase 4'],
    ] as const;
    for (const [backup, write, phase] of checks) {
      const bIdx = docs.indexOf(backup);
      const wIdx = docs.indexOf(write);
      if (bIdx === -1) return `${phase}: backup instruction not found`;
      if (wIdx === -1) return `${phase}: write instruction not found`;
      if (bIdx >= wIdx) return `${phase}: backup instruction appears AFTER write instruction (ordering violation)`;
    }
    return undefined;
  })(),
});

// I73 — Checkpoint schema incluye campo brownfield con valor boolean
results.push({
  id: 'I73',
  description: 'Brownfield F5: checkpoint schema incluye campo `brownfield` con valor boolean (false default)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    // Must have "brownfield": false (boolean, not string)
    return docs.includes('"brownfield": false');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    !readAllDocs().includes('"brownfield": false') ?
    '"brownfield": false (boolean) not found in checkpoint schema — must be boolean, not string' : undefined,
});

// I74 — Phase 3 brownfield tiene gate para cambios que modifican valores existentes (individual o batch según cantidad)
results.push({
  id: 'I74',
  description: 'Brownfield F5: Phase 3 brownfield tiene gate para cambios que modifican valores existentes (individual o batch según cantidad)',
  pass: (() => {
    const p3 = existsSync(PHASE_PATHS[1]) ? readFileSync(PHASE_PATHS[1], 'utf-8') : '';
    return (p3.includes('Gate para cambios que modifiquen un valor existente') ||
            p3.includes('gate each change individually') ||
            p3.includes('Gate individual para cada cambio')) &&
           (p3.includes('one confirmation per field') ||
            p3.includes('requiere confirmación separada por campo'));
  })(),
  detail: (() => {
    const p3 = existsSync(PHASE_PATHS[1]) ? readFileSync(PHASE_PATHS[1], 'utf-8') : 'phase3.md not found';
    if (!p3.includes('Gate para cambios') && !p3.includes('gate each change individually') && !p3.includes('Gate individual')) {
      return 'Gate for existing value changes not found in Phase 3 brownfield path';
    }
    if (!p3.includes('one confirmation per field') && !p3.includes('requiere confirmación separada por campo')) {
      return 'Gate scope (per-field confirmation) not specified in Phase 3 brownfield';
    }
    return undefined;
  })(),
});

// I75 — genesis-sync tiene regla de fallback a greenfield path para Phase 4b
results.push({
  id: 'I75',
  description: 'Brownfield F5: genesis-sync Phase 4b brownfield tiene fallback a greenfield cuando agent no existe',
  pass: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return false;
    // The fallback rule is in genesis-governance-docs.md Phase 4b brownfield path
    // (genesis-sync doesn't own Phase 4b — check that docs has the fallback)
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Si el archivo NO existe → generarlo normalmente (greenfield path)');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Si el archivo NO existe → generarlo normalmente (greenfield path)')) {
      return 'Greenfield fallback rule not found in Phase 4b brownfield path (agents that do not exist should use greenfield path)';
    }
    return undefined;
  })(),
});

// I76 — Los 4 golden path test scenarios existen en docs/test-scenarios/ y están registrados
results.push({
  id: 'I76',
  description: 'F6: Los 4 golden path test scenarios existen en disco y están registrados en _registry.md',
  pass: (() => {
    const registryPath = resolve('docs/_registry.md');
    const scenarios = [
      'docs/test-scenarios/scenario-01-greenfield-simple.md',
      'docs/test-scenarios/scenario-02-greenfield-ai-project.md',
      'docs/test-scenarios/scenario-03-brownfield-existing-claude.md',
      'docs/test-scenarios/scenario-04-brownfield-post-genesis.md',
    ];
    for (const s of scenarios) {
      if (!existsSync(resolve(s))) return false;
    }
    if (!existsSync(registryPath)) return false;
    const registry = readFileSync(registryPath, 'utf-8');
    for (const s of ['scenario-01-greenfield-simple', 'scenario-02-greenfield-ai-project', 'scenario-03-brownfield-existing-claude', 'scenario-04-brownfield-post-genesis']) {
      if (!registry.includes(s)) return false;
    }
    return true;
  })(),
  detail: (() => {
    const registryPath = resolve('docs/_registry.md');
    const scenarios = [
      'docs/test-scenarios/scenario-01-greenfield-simple.md',
      'docs/test-scenarios/scenario-02-greenfield-ai-project.md',
      'docs/test-scenarios/scenario-03-brownfield-existing-claude.md',
      'docs/test-scenarios/scenario-04-brownfield-post-genesis.md',
    ];
    for (const s of scenarios) {
      if (!existsSync(resolve(s))) return `Scenario file not found: ${s}`;
    }
    if (!existsSync(registryPath)) return 'docs/_registry.md not found';
    const registry = readFileSync(registryPath, 'utf-8');
    for (const id of ['scenario-01-greenfield-simple', 'scenario-02-greenfield-ai-project', 'scenario-03-brownfield-existing-claude', 'scenario-04-brownfield-post-genesis']) {
      if (!registry.includes(id)) return `Scenario not registered in _registry.md: ${id}`;
    }
    return undefined;
  })(),
});

// I77 — Phase 7 heading present after Phase 6 section
results.push({
  id: 'I77',
  description: 'Phase 7: genesis-governance-phase7.md existe y tiene heading ## PHASE 7',
  pass: (() => {
    const phase7Path = resolve('skills/genesis-governance/references/phase7.md');
    if (!existsSync(phase7Path)) return false;
    const phase7 = readFileSync(phase7Path, 'utf-8');
    return phase7.includes('## PHASE 7') || phase7.includes('# PHASE 7') || phase7.includes('PHASE 7');
  })(),
  detail: (() => {
    const phase7Path = resolve('skills/genesis-governance/references/phase7.md');
    if (!existsSync(phase7Path)) return 'genesis-governance-phase7.md not found';
    const phase7 = readFileSync(phase7Path, 'utf-8');
    if (!phase7.includes('## PHASE 7') && !phase7.includes('# PHASE 7') && !phase7.includes('PHASE 7')) {
      return 'PHASE 7 heading not found in genesis-governance-phase7.md';
    }
    return undefined;
  })(),
});

// I78 — Phase 7 references all 6 conditional artifact checks
results.push({
  id: 'I78',
  description: 'Phase 7: referencia los 6 checks de artifacts condicionales (model-card, dpia, threat-model, slo-sli, constitution-checks, validate-doc-registry)',
  pass: (() => {
    const phase7Path = resolve('skills/genesis-governance/references/phase7.md');
    if (!existsSync(phase7Path)) return false;
    const phase7 = readFileSync(phase7Path, 'utf-8');
    return phase7.includes('model-card') &&
           phase7.includes('dpia') &&
           phase7.includes('threat-model') &&
           phase7.includes('slo-sli') &&
           phase7.includes('constitution-checks') &&
           phase7.includes('validate-doc-registry');
  })(),
  detail: (() => {
    const phase7Path = resolve('skills/genesis-governance/references/phase7.md');
    if (!existsSync(phase7Path)) return 'genesis-governance-phase7.md not found';
    const phase7 = readFileSync(phase7Path, 'utf-8');
    const artifacts = ['model-card', 'dpia', 'threat-model', 'slo-sli', 'constitution-checks', 'validate-doc-registry'];
    const missing = artifacts.filter(a => !phase7.includes(a));
    if (missing.length > 0) {
      return `Missing conditional artifact references in Phase 7: ${missing.join(', ')}`;
    }
    return undefined;
  })(),
});

// I79 — Phase 7 references genesis-sync (Part C)
results.push({
  id: 'I79',
  description: 'Phase 7: referencia genesis-sync en Step 3d (Part C del plan)',
  pass: (() => {
    const phase7Path = resolve('skills/genesis-governance/references/phase7.md');
    if (!existsSync(phase7Path)) return false;
    const phase7 = readFileSync(phase7Path, 'utf-8');
    return phase7.includes('genesis-sync') && (phase7.includes('Step 3d') || phase7.includes('step 3d'));
  })(),
  detail: (() => {
    const phase7Path = resolve('skills/genesis-governance/references/phase7.md');
    if (!existsSync(phase7Path)) return 'genesis-governance-phase7.md not found';
    const phase7 = readFileSync(phase7Path, 'utf-8');
    if (!phase7.includes('genesis-sync')) {
      return 'genesis-sync reference not found in Phase 7';
    }
    if (!phase7.includes('Step 3d') && !phase7.includes('step 3d')) {
      return '"Step 3d" reference not found in Phase 7 genesis-sync section';
    }
    return undefined;
  })(),
});

// -----------------------------------------------------------------------
// BROWNFIELD F4 — genesis-sync D-SYNC-6/7/8: structural invariants (I68-I70)
// -----------------------------------------------------------------------

// I68 — genesis-sync tiene D-SYNC-6 con verificación de headings (no hash)
results.push({
  id: 'I68',
  description: 'Brownfield F4: genesis-sync tiene D-SYNC-6 con verificación de headings (no hash de contenido)',
  pass: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return false;
    const sync = readFileSync(syncPath, 'utf-8');
    return sync.includes('D-SYNC-6') &&
           sync.includes('NO hashear contenido') &&
           sync.includes('claude_md_required_headings');
  })(),
  detail: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return 'genesis-sync.md not found';
    const sync = readFileSync(syncPath, 'utf-8');
    const checks: [string, string][] = [
      ['D-SYNC-6', 'D-SYNC-6 section not found in genesis-sync'],
      ['NO hashear contenido', '"NO hashear contenido" instruction not found — hash approach may have been used'],
      ['claude_md_required_headings', 'claude_md_required_headings field not referenced in D-SYNC-6'],
    ];
    const failed = checks.filter(([t]) => !sync.includes(t)).map(([, m]) => m);
    if (failed.length > 0) return failed.join('; ');
    return undefined;
  })(),
});

// I69 — genesis-sync D-SYNC-7 tiene regla N/A para last_completed < Phase3
results.push({
  id: 'I69',
  description: 'Brownfield F4: genesis-sync D-SYNC-7 tiene regla N/A explícita para last_completed < Phase3',
  pass: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return false;
    const sync = readFileSync(syncPath, 'utf-8');
    return sync.includes('D-SYNC-7') &&
           sync.includes('N/A') &&
           sync.includes('last_completed') &&
           sync.includes('Phase3');
  })(),
  detail: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return 'genesis-sync.md not found';
    const sync = readFileSync(syncPath, 'utf-8');
    const checks: [string, string][] = [
      ['D-SYNC-7', 'D-SYNC-7 section not found'],
      ['N/A', 'N/A exception not found in D-SYNC-7'],
      ['Phase3', 'Phase3 checkpoint threshold not referenced in D-SYNC-7 N/A rule'],
    ];
    const failed = checks.filter(([t]) => !sync.includes(t)).map(([, m]) => m);
    if (failed.length > 0) return failed.join('; ');
    return undefined;
  })(),
});

// I70 — genesis-sync tiene D-SYNC-8 (CI vs governance.config.yaml)
results.push({
  id: 'I70',
  description: 'Brownfield F4: genesis-sync tiene D-SYNC-8 (CI pipeline vs governance.config.yaml)',
  pass: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return false;
    const sync = readFileSync(syncPath, 'utf-8');
    return sync.includes('D-SYNC-8') && sync.includes('ci.yml');
  })(),
  detail: (() => {
    const syncPath = resolve('skills/genesis-sync/SKILL.md');
    if (!existsSync(syncPath)) return 'genesis-sync.md not found';
    const sync = readFileSync(syncPath, 'utf-8');
    if (!sync.includes('D-SYNC-8')) return 'D-SYNC-8 section not found in genesis-sync';
    if (!sync.includes('ci.yml')) return 'ci.yml reference not found in D-SYNC-8';
    return undefined;
  })(),
});

// -----------------------------------------------------------------------
// BROWNFIELD F3 — Brownfield paths Phases 2-6: structural invariants (I59-I67)
// -----------------------------------------------------------------------

// I59 — Phase 2 tiene brownfield path con read-before-write + INSERT semántico
results.push({
  id: 'I59',
  description: 'Brownfield F3: Phase 2 tiene brownfield path con read-before-write + INSERT semántico',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Brownfield path — Phase 2') &&
           docs.includes('INSERT cada sección en su posición semántica') &&
           docs.includes('Glob `docs/core/*.constitution.md`');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    const checks: [string, string][] = [
      ['Brownfield path — Phase 2', '"Brownfield path — Phase 2" block not found'],
      ['INSERT cada sección en su posición semántica', 'INSERT semantic instruction not found in Phase 2 brownfield path'],
      ['Glob `docs/core/*.constitution.md`', 'Read-before-write (Glob for constitution) not found in Phase 2 brownfield path'],
    ];
    const failed = checks.filter(([t]) => !docs.includes(t)).map(([, m]) => m);
    if (failed.length > 0) return failed.join('; ');
    return undefined;
  })(),
});

// I60 — Phase 3 tiene brownfield path con diff + gate (individual o batch) por cambio de valor existente
results.push({
  id: 'I60',
  description: 'Brownfield F3: Phase 3 tiene brownfield path con diff + gate por valor existente',
  pass: (() => {
    const p3 = existsSync(PHASE_PATHS[1]) ? readFileSync(PHASE_PATHS[1], 'utf-8') : '';
    return p3.includes('Brownfield path — Phase 3') &&
           (p3.includes('Gate para cambios que modifiquen un valor existente') ||
            p3.includes('gate each change individually') ||
            p3.includes('Gate individual para cada cambio'));
  })(),
  detail: (() => {
    const p3 = existsSync(PHASE_PATHS[1]) ? readFileSync(PHASE_PATHS[1], 'utf-8') : 'phase3.md not found';
    if (!p3.includes('Brownfield path — Phase 3')) return '"Brownfield path — Phase 3" block not found';
    if (!p3.includes('Gate para cambios') && !p3.includes('gate each change individually') && !p3.includes('Gate individual')) {
      return 'Gate for existing value changes not found in Phase 3 brownfield path';
    }
    return undefined;
  })(),
});

// I61 — Phase 4 tiene brownfield path con read-before-write + INSERT semántico
results.push({
  id: 'I61',
  description: 'Brownfield F3: Phase 4 tiene brownfield path con read-before-write + INSERT semántico para CLAUDE.md',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Brownfield path — Phase 4') &&
           docs.includes('INSERT cada sección aprobada en su posición semántica');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Brownfield path — Phase 4')) return '"Brownfield path — Phase 4" block not found';
    if (!docs.includes('INSERT cada sección aprobada en su posición semántica')) {
      return 'INSERT semantic instruction not found in Phase 4 brownfield path';
    }
    return undefined;
  })(),
});

// I62 — Phase 4b tiene brownfield path con diff de agents (no solo skip/overwrite)
results.push({
  id: 'I62',
  description: 'Brownfield F3: Phase 4b tiene brownfield path con diff de agents (mostrar diferencias antes de sobrescribir)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Brownfield path — Phase 4b agents') &&
           docs.includes('mostrar diff de secciones');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Brownfield path — Phase 4b agents')) return '"Brownfield path — Phase 4b agents" block not found';
    if (!docs.includes('mostrar diff de secciones')) return 'Agent diff instruction not found in Phase 4b brownfield path';
    return undefined;
  })(),
});

// I63 — Phase 5 tiene brownfield path para registry (solo agrega, no sobreescribe)
results.push({
  id: 'I63',
  description: 'Brownfield F3: Phase 5 tiene brownfield path para registry (solo agrega entries nuevas)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Brownfield path — document registry') &&
           docs.includes('Solo agregar entries NUEVAS generadas durante esta sesión de genesis');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Brownfield path — document registry')) return '"Brownfield path — document registry" block not found';
    if (!docs.includes('Solo agregar entries NUEVAS generadas durante esta sesión de genesis')) {
      return 'Add-only rule for registry not found in Phase 5 brownfield path';
    }
    return undefined;
  })(),
});

// I64 — Phase 5 tiene brownfield path para scripts generados (merge, no override)
results.push({
  id: 'I64',
  description: 'Brownfield F3: Phase 5 tiene brownfield path para scripts generados (merge lógica custom)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Brownfield path — scripts generados') &&
           docs.includes('lógica custom preservada + nuevos checks derivados del intake');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Brownfield path — scripts generados')) return '"Brownfield path — scripts generados" block not found';
    if (!docs.includes('lógica custom preservada + nuevos checks derivados del intake')) {
      return 'Merge instruction for custom logic not found in Phase 5 scripts brownfield path';
    }
    return undefined;
  })(),
});

// I65 — Phase 6 tiene brownfield path para CI (INSERT jobs, no reemplazo de archivo)
results.push({
  id: 'I65',
  description: 'Brownfield F3: Phase 6 tiene brownfield path para CI (INSERT jobs, no reemplaza archivo)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Brownfield path — Phase 6 CI pipeline') &&
           docs.includes('NO reemplazar el archivo completo');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Brownfield path — Phase 6 CI pipeline')) return '"Brownfield path — Phase 6 CI pipeline" block not found';
    if (!docs.includes('NO reemplazar el archivo completo')) return '"NO reemplazar el archivo completo" instruction not found in Phase 6 brownfield path';
    return undefined;
  })(),
});

// I66 — Checkpoint schema incluye campo brownfield
results.push({
  id: 'I66',
  description: 'Brownfield F3: checkpoint schema v1.1 incluye campo `brownfield` en Phase 5',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('"brownfield": false');
  })(),
  detail: !existsSync(DOCS_PATH) ? 'Docs file not found' :
    !readAllDocs().includes('"brownfield": false') ?
    '"brownfield" field not found in Phase 5 checkpoint v1.1 schema' : undefined,
});

// I67 — Intake file tiene regla de reutilización en brownfield
results.push({
  id: 'I67',
  description: 'Brownfield F3: intake file tiene regla de reutilización (pre-cargar respuestas previas)',
  pass: (() => {
    if (!existsSync(DOCS_PATH)) return false;
    const docs = readAllDocs();
    return docs.includes('Intake file reuse rule') &&
           docs.includes('pre-cargar respuestas del intake previo');
  })(),
  detail: (() => {
    if (!existsSync(DOCS_PATH)) return 'Docs file not found';
    const docs = readAllDocs();
    if (!docs.includes('Intake file reuse rule')) return '"Intake file reuse rule" block not found';
    if (!docs.includes('pre-cargar respuestas del intake previo')) return 'Pre-load instruction not found in intake file reuse rule';
    return undefined;
  })(),
});

// -----------------------------------------------------------------------
// BROWNFIELD F2 — L5 Reality Check: structural invariants (I57-I58)
// -----------------------------------------------------------------------

// I57 — L5 tiene bloque "L5 Reality Check" con los 6 comandos de validación
results.push(check('I57', 'Brownfield F2: L5 tiene bloque Reality Check con los 6 comandos de validación', (content) => {
  const errors: string[] = [];
  if (!content.includes('L5 Reality Check')) errors.push('"L5 Reality Check" block not found in main skill');
  if (!content.includes('ls packages/')) errors.push('Command 1 (ls packages/) not found in Reality Check');
  if (!content.includes('ls .claude/agents/')) errors.push('Command 3 (ls .claude/agents/) not found in Reality Check');
  if (!content.includes('ls .github/workflows/')) errors.push('Command 4 (ls .github/workflows/) not found in Reality Check');
  if (!content.includes('ls docs/core/*.constitution.md')) errors.push('Command 5 (ls docs/core/*.constitution.md) not found in Reality Check');
  if (!content.includes('ls CLAUDE.md')) errors.push('Command 6 (ls CLAUDE.md) not found in Reality Check');
  if (errors.length > 0) return errors.join('; ');
  return true;
}));

// I58 — L5 Reality Check tiene gate phrase de confirmación de discrepancias
results.push(check('I58', 'Brownfield F2: L5 Reality Check tiene gate phrase de confirmación si hay discrepancias', (content) => {
  if (!content.includes('Gate phrase')) return '"Gate phrase" not found in L5 Reality Check';
  if (!content.includes('I found differences between your answers and the disk state')) {
    return 'Gate confirmation phrase not found in L5 Reality Check';
  }
  return true;
}));

// -----------------------------------------------------------------------
// UX IMPROVEMENTS (M1-M3)
// -----------------------------------------------------------------------

// I80 — Phase 7 Step 3d: invoca genesis-sync correctamente (sin NOT_YET_IMPLEMENTED)
results.push(checkAll('I80', 'UX M1: Phase 7 Step 3d invoca /genesis-sync correctamente (sin NOT_YET_IMPLEMENTED)', (content) => {
  const errors: string[] = [];
  if (content.includes('NOT_YET_IMPLEMENTED')) errors.push('NOT_YET_IMPLEMENTED marker still present — genesis-sync exists, remove this marker');
  if (!content.includes('genesis-sync')) errors.push('genesis-sync reference not found in Phase 7');
  if (!content.includes('D-SYNC')) errors.push('D-SYNC findings not referenced in Phase 7 Step 3d');
  if (errors.length > 0) return errors.join('; ');
  return true;
}));

// I81 — Todos los phase files tienen bloque "Posición" al inicio
results.push({
  id: 'I81',
  description: 'UX M2: Todos los phase files (2-7) tienen bloque "Posición: Phase N de 7"',
  pass: (() => {
    if (!PHASE_PATHS.every(p => existsSync(p))) return false;
    const docs = readAllDocs();
    return PHASE_PATHS.every(p => {
      const content = readFileSync(p, 'utf-8');
      return content.includes('**Posición:**') && content.includes('de 7');
    });
  })(),
  detail: (() => {
    if (!PHASE_PATHS.every(p => existsSync(p))) {
      const missing = PHASE_PATHS.filter(p => !existsSync(p));
      return `Phase files missing: ${missing.join(', ')}`;
    }
    const missing = PHASE_PATHS.filter(p => {
      const content = readFileSync(p, 'utf-8');
      return !content.includes('**Posición:**') || !content.includes('de 7');
    });
    if (missing.length > 0) return `Phase files without Posición header: ${missing.join(', ')}`;
    return undefined;
  })(),
});

// I82 — Phase 3-6 tienen bloque BROWNFIELD CHECK antes de Preconditions
results.push({
  id: 'I82',
  description: 'UX M3: Phase 3-6 tienen bloque BROWNFIELD CHECK antes de Preconditions',
  pass: (() => {
    const phasesForBrownfield = [
      resolve('skills/genesis-governance/references/phase3.md'),
      resolve('skills/genesis-governance/references/phase4.md'),
      resolve('skills/genesis-governance/references/phase5.md'),
      resolve('skills/genesis-governance/references/phase6.md'),
    ];
    return phasesForBrownfield.every(p => {
      if (!existsSync(p)) return false;
      const content = readFileSync(p, 'utf-8');
      return content.includes('BROWNFIELD CHECK') && content.includes('INSERT/APPEND');
    });
  })(),
  detail: (() => {
    const phasesForBrownfield = [
      resolve('skills/genesis-governance/references/phase3.md'),
      resolve('skills/genesis-governance/references/phase4.md'),
      resolve('skills/genesis-governance/references/phase5.md'),
      resolve('skills/genesis-governance/references/phase6.md'),
    ];
    const missing = phasesForBrownfield.filter(p => {
      if (!existsSync(p)) return true;
      const content = readFileSync(p, 'utf-8');
      return !content.includes('BROWNFIELD CHECK') || !content.includes('INSERT/APPEND');
    });
    if (missing.length > 0) return `Phase files without BROWNFIELD CHECK: ${missing.join(', ')}`;
    return undefined;
  })(),
});

// I83 — Gen6: Todos los phase files tienen criterios de aprobación definidos
results.push({
  id: 'I83',
  description: 'Gen6: criterios de aprobación explícitos en todos los phase files',
  pass: (() => {
    return PHASE_PATHS.every(p => {
      if (!existsSync(p)) return false;
      const content = readFileSync(p, 'utf-8');
      return content.includes('Qué cuenta como aprobación') && content.includes('Qué NO cuenta');
    });
  })(),
  detail: (() => {
    const missing = PHASE_PATHS.filter(p => {
      if (!existsSync(p)) return true;
      const content = readFileSync(p, 'utf-8');
      return !content.includes('Qué cuenta como aprobación') || !content.includes('Qué NO cuenta');
    });
    if (missing.length > 0) return `Phase files without approval criteria: ${missing.join(', ')}`;
    return undefined;
  })(),
});

// I84 — Gen6: Todos los phase files tienen pre-gate checklist
results.push({
  id: 'I84',
  description: 'Gen6: pre-gate checklist presente en todos los phase files',
  pass: (() => {
    return PHASE_PATHS.every(p => {
      if (!existsSync(p)) return false;
      const content = readFileSync(p, 'utf-8');
      return content.includes('Pre-gate checklist');
    });
  })(),
  detail: (() => {
    const missing = PHASE_PATHS.filter(p => {
      if (!existsSync(p)) return true;
      const content = readFileSync(p, 'utf-8');
      return !content.includes('Pre-gate checklist');
    });
    if (missing.length > 0) return `Phase files without pre-gate checklist: ${missing.join(', ')}`;
    return undefined;
  })(),
});

// I85 — Recovery: checkpoint schema tiene phase_in_progress field
results.push({
  id: 'I85',
  description: 'Recovery: checkpoint schema v1.3 tiene campo phase_in_progress',
  pass: (() => {
    const skillPath = resolve('skills/genesis-governance/SKILL.md');
    if (!existsSync(skillPath)) return false;
    const content = readFileSync(skillPath, 'utf-8');
    return content.includes('"phase_in_progress": null');
  })(),
  detail: (() => {
    const skillPath = resolve('skills/genesis-governance/SKILL.md');
    if (!existsSync(skillPath)) return 'genesis-governance.md not found';
    const content = readFileSync(skillPath, 'utf-8');
    return content.includes('"phase_in_progress": null') ? undefined : 'phase_in_progress field not found in checkpoint schema';
  })(),
});

// I86 — Recovery: resume rules cubren caso phase_in_progress != null
results.push({
  id: 'I86',
  description: 'Recovery: resume rules cubren caso phase_in_progress != null',
  pass: (() => {
    const skillPath = resolve('skills/genesis-governance/SKILL.md');
    if (!existsSync(skillPath)) return false;
    const content = readFileSync(skillPath, 'utf-8');
    return content.includes('phase_in_progress') && content.includes('Recovery mode');
  })(),
  detail: (() => {
    const skillPath = resolve('skills/genesis-governance/SKILL.md');
    if (!existsSync(skillPath)) return 'genesis-governance.md not found';
    const content = readFileSync(skillPath, 'utf-8');
    if (!content.includes('phase_in_progress')) return 'phase_in_progress case not found in resume rules';
    if (!content.includes('Recovery mode')) return 'Recovery mode announcement not found';
    return undefined;
  })(),
});

// I87 — Recovery: phase files 2-6 tienen bloque Recovery check al inicio
results.push({
  id: 'I87',
  description: 'Recovery: phase files 2-6 tienen bloque Recovery check al inicio',
  pass: (() => {
    const targetPhases = [
      resolve('skills/genesis-governance/references/phase2.md'),
      resolve('skills/genesis-governance/references/phase3.md'),
      resolve('skills/genesis-governance/references/phase4.md'),
      resolve('skills/genesis-governance/references/phase5.md'),
      resolve('skills/genesis-governance/references/phase6.md'),
    ];
    return targetPhases.every(p => {
      if (!existsSync(p)) return false;
      const content = readFileSync(p, 'utf-8');
      return content.includes('Recovery check');
    });
  })(),
  detail: (() => {
    const targetPhases = [
      resolve('skills/genesis-governance/references/phase2.md'),
      resolve('skills/genesis-governance/references/phase3.md'),
      resolve('skills/genesis-governance/references/phase4.md'),
      resolve('skills/genesis-governance/references/phase5.md'),
      resolve('skills/genesis-governance/references/phase6.md'),
    ];
    const missing = targetPhases.filter(p => {
      if (!existsSync(p)) return true;
      const content = readFileSync(p, 'utf-8');
      return !content.includes('Recovery check');
    });
    if (missing.length > 0) return `Phase files without Recovery check: ${missing.map(p => p.split('/').pop()).join(', ')}`;
    return undefined;
  })(),
});

// I88 — genesis-sync tiene 8 dimensiones D-SYNC numeradas
const GENESIS_SYNC_PATH = resolve('skills/genesis-sync/SKILL.md');
results.push({
  id: 'I88',
  description: 'genesis-sync: tiene 8 dimensiones D-SYNC (D-SYNC-1 a D-SYNC-8)',
  pass: (() => {
    if (!existsSync(GENESIS_SYNC_PATH)) return false;
    const content = readFileSync(GENESIS_SYNC_PATH, 'utf-8');
    for (let i = 1; i <= 8; i++) {
      if (!content.includes(`D-SYNC-${i}`)) return false;
    }
    return true;
  })(),
  detail: (() => {
    if (!existsSync(GENESIS_SYNC_PATH)) return 'genesis-sync.md not found';
    const content = readFileSync(GENESIS_SYNC_PATH, 'utf-8');
    const missing = [];
    for (let i = 1; i <= 8; i++) {
      if (!content.includes(`D-SYNC-${i}`)) missing.push(`D-SYNC-${i}`);
    }
    return missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined;
  })(),
});

// I89 — genesis-sync precondiciones: aborta si no existe checkpoint
results.push({
  id: 'I89',
  description: 'genesis-sync: precondiciones incluyen aborto si no existe genesis-checkpoint.json',
  pass: (() => {
    if (!existsSync(GENESIS_SYNC_PATH)) return false;
    const content = readFileSync(GENESIS_SYNC_PATH, 'utf-8');
    return content.includes('genesis-checkpoint.json') && content.includes('/genesis-governance');
  })(),
  detail: existsSync(GENESIS_SYNC_PATH) ? undefined : 'genesis-sync.md not found',
});

// I90 — genesis-sync tiene Checkpoint Migration v1.0→v1.1
results.push({
  id: 'I90',
  description: 'genesis-sync: tiene Checkpoint Migration v1.0→v1.1',
  pass: (() => {
    if (!existsSync(GENESIS_SYNC_PATH)) return false;
    const content = readFileSync(GENESIS_SYNC_PATH, 'utf-8');
    return content.includes('v1.0') && content.includes('v1.1') && content.includes('Migration');
  })(),
  detail: existsSync(GENESIS_SYNC_PATH) ? undefined : 'genesis-sync.md not found',
});

// I91 — genesis-sync tiene Phase 5 fix routing
results.push({
  id: 'I91',
  description: 'genesis-sync: tiene Phase 5 fix routing con agentes (git-ops / main instance)',
  pass: (() => {
    if (!existsSync(GENESIS_SYNC_PATH)) return false;
    const content = readFileSync(GENESIS_SYNC_PATH, 'utf-8');
    return content.includes('PHASE 5') && content.includes('git-ops') && content.includes('main instance');
  })(),
  detail: existsSync(GENESIS_SYNC_PATH) ? undefined : 'genesis-sync.md not found',
});

// I92 — genesis-sync tiene severidades HIGH/MEDIUM/LOW definidas
results.push({
  id: 'I92',
  description: 'genesis-sync: severidades HIGH/MEDIUM/LOW definidas en Phase 3',
  pass: (() => {
    if (!existsSync(GENESIS_SYNC_PATH)) return false;
    const content = readFileSync(GENESIS_SYNC_PATH, 'utf-8');
    return content.includes('HIGH') && content.includes('MEDIUM') && content.includes('LOW');
  })(),
  detail: existsSync(GENESIS_SYNC_PATH) ? undefined : 'genesis-sync.md not found',
});

// I93 — genesis-sync tiene Phase 4 Report con formato ¿Aplicar correcciones?
results.push({
  id: 'I93',
  description: 'genesis-sync: Phase 4 Report incluye confirmación antes de Phase 5',
  pass: (() => {
    if (!existsSync(GENESIS_SYNC_PATH)) return false;
    const content = readFileSync(GENESIS_SYNC_PATH, 'utf-8');
    return content.includes('PHASE 4') && (content.includes('s/n') || content.includes('confirmación'));
  })(),
  detail: existsSync(GENESIS_SYNC_PATH) ? undefined : 'genesis-sync.md not found',
});

// -----------------------------------------------------------------------
// GEN9 UX IMPROVEMENTS — U1/U3/U4/U5/U6/U7/U8/U9 structural invariants
// -----------------------------------------------------------------------

// I94 — U1: Step 1.1 Rejection rule incluye instrucción de calibración sector-aware
results.push(check('I94', 'U1: Step 1.1 Rejection rule incluye instrucción sector-aware (U1)', (content) => {
  if (!content.includes('Sector-aware clarification')) {
    return '"Sector-aware clarification" instruction not found in Step 1.1 Rejection rule';
  }
  // Must include at least one sector-specific example (Health, Finance, or Logistics)
  const hasSectorExample = content.includes('Health:') || content.includes('Finance:') || content.includes('Logistics:');
  if (!hasSectorExample) return 'No sector-specific examples found (Health/Finance/Logistics) in Rejection rule';
  return true;
}));

// I96 — U3: Quick fork muestra rangos de tiempo (no valores únicos)
results.push(check('I96', 'U3: Quick fork muestra rangos de tiempo (no valores únicos)', (content) => {
  if (!content.includes('15–30 min')) return '"~15–30 min" range not found in quick mode fork';
  if (!content.includes('1.5–3h')) return '"~1.5–3h" range not found in full mode fork';
  return true;
}));

// I97 — U4: L2 incluye tabla de ejemplo con datos ficticios antes de la tabla derivada
results.push(check('I97', 'U4: L2 incluye tabla de ejemplo con datos ficticios (Agente inmobiliario)', (content) => {
  if (!content.includes('Agente inmobiliario')) return '"Agente inmobiliario" example table not found in L2';
  if (!content.includes('Inquilino')) return '"Inquilino" row not found in L2 example table';
  return true;
}));

// I98 — U5A: fallback ai_outputs incluye ejemplos por opción A/B/C
results.push(check('I98', 'U5A: fallback ai_outputs incluye ejemplos por opción A/B/C', (content) => {
  if (!content.includes('match predictions') && !content.includes('product recommendations')) {
    return 'ai_outputs option A example (recomendaciones) not found';
  }
  if (!content.includes('contract draft') && !content.includes('diagnosis suggestion')) {
    return 'ai_outputs option B example (borrador de contrato) not found';
  }
  return true;
}));

// I98b — U5B: pregunta api-quota incluye ejemplos de función crítica vs no-crítica
results.push(check('I98b', 'U5B: pregunta api-quota incluye ejemplos de función crítica vs no-crítica', (content) => {
  if (!content.includes('OpenAI') && !content.includes('real-time financial data')) {
    return 'api-quota option A example (OpenAI predicciones) not found';
  }
  if (!content.includes('Google Maps') && !content.includes('news API')) {
    return 'api-quota option B example (Google Maps) not found';
  }
  return true;
}));

// I99 — U6: L4 closing summary incluye preview de áreas de constitución en lenguaje de negocio
results.push(check('I99', 'U6: L4 closing summary incluye preview de áreas de constitución en lenguaje negocio', (content) => {
  if (!content.includes('Con este perfil de riesgo, tus documentos de gobernanza van a incluir')) {
    return 'L4 constitution preview line not found in closing summary';
  }
  if (!content.includes('protección de pagos')) {
    return 'L4 closing preview missing business-language examples';
  }
  return true;
}));

// I100 — U7: cierre de L5 incluye mini-roadmap con Session 1 y Session 2
results.push(check('I100', 'U7: cierre de L5 incluye mini-roadmap con Session 1 y Session 2', (content) => {
  if (!content.includes('Session 1')) return '"Session 1" not found in L5 closing mini-roadmap';
  if (!content.includes('Session 2')) return '"Session 2" not found in L5 closing mini-roadmap';
  if (!content.includes('¿Continuamos con Session 1?')) {
    return 'Confirmation gate "¿Continuamos con Session 1?" not found';
  }
  return true;
}));

// I101 — U8A: Step 1.1 incluye formato guía Quién / Cómo / Por qué
results.push(check('I101', 'U8A: Step 1.1 incluye formato guía Quién / Cómo / Por qué', (content) => {
  if (!content.includes('Quién lo tiene:')) return '"Quién lo tiene:" guided field not found in Step 1.1';
  if (!content.includes('Cómo lo resuelven hoy:')) return '"Cómo lo resuelven hoy:" guided field not found in Step 1.1';
  if (!content.includes('Por qué eso no alcanza:')) return '"Por qué eso no alcanza:" guided field not found in Step 1.1';
  return true;
}));

// I102 — U8B: L1 tiene bloque de Síntesis con opciones A/B/C antes del Checkpoint write
results.push(check('I102', 'U8B: L1 tiene bloque de Síntesis con opciones A/B/C antes del Checkpoint write L1', (content) => {
  if (!content.includes('Antes de continuar, esto es lo que voy a usar como base para toda la gobernanza')) {
    return 'L1 synthesis gate opening line not found';
  }
  if (!content.includes('synthesis_accepted')) {
    return '"synthesis_accepted" field not found — option C must write this to checkpoint';
  }
  // Synthesis gate must appear BEFORE the Checkpoint write (L1)
  const synthIdx = content.indexOf('Antes de continuar, esto es lo que voy a usar');
  const checkpointIdx = content.indexOf('Checkpoint write (L1)');
  if (synthIdx === -1 || checkpointIdx === -1) return 'Cannot verify ordering — synthesis or checkpoint marker not found';
  if (synthIdx >= checkpointIdx) return `Synthesis gate appears AFTER Checkpoint write L1 (${synthIdx} >= ${checkpointIdx}) — gate must come first`;
  return true;
}));

// I103 — U9: Prerequisites check incluye bloque de scan automático
results.push(check('I103', 'U9: Prerequisites check incluye bloque de scan automático (ls CLAUDE.md, constitution, checkpoint, CI)', (content) => {
  if (!content.includes('ls CLAUDE.md 2>/dev/null && wc -l CLAUDE.md')) {
    return 'Auto-scan "ls CLAUDE.md + wc -l" not found in Prerequisites check';
  }
  if (!content.includes('ls docs/core/*.constitution.md 2>/dev/null')) {
    return 'Auto-scan for constitution not found in Prerequisites check';
  }
  if (!content.includes('Escaneé tu proyecto y encontré')) {
    return 'Brownfield announcement "Escaneé tu proyecto" not found';
  }
  return true;
}));

// I104 — U9: lógica de clasificación brownfield/greenfield derivada del scan (no solo del self-report)
results.push(check('I104', 'U9: lógica de clasificación brownfield/greenfield derivada del scan automático', (content) => {
  // Must have a classification table with greenfield and brownfield
  if (!content.includes('greenfield')) return '"greenfield" classification not found in scan logic';
  if (!content.includes('brownfield')) return '"brownfield" classification not found in scan logic';
  // Must have the scan-based brownfield detection rule (CLAUDE.md > 10 lines)
  if (!content.includes('10 lines') && !content.includes('10 líneas')) {
    return 'CLAUDE.md line count threshold (10 lines) not found in brownfield detection rule';
  }
  return true;
}));

// I105 — U9: Step 1.6 tiene comportamiento diferenciado según clasificación previa del scan
results.push(check('I105', 'U9: Step 1.6 tiene comportamiento diferenciado según clasificación del scan (greenfield / brownfield)', (content) => {
  if (!content.includes('greenfield detected')) {
    // Also check Spanish variant
    if (!content.includes('`greenfield` detected') && !content.includes('greenfield.*Step 1.6')) {
      // Check for the exact phrasing in the skill
      if (!content.includes('greenfield')) return '"greenfield" classification not referenced near Step 1.6 behavior';
    }
  }
  if (!content.includes('Option C is pre-answered by the scan') &&
      !content.includes('Option C.*scan') &&
      !content.includes('pre-seleccionado')) {
    return 'Step 1.6 pre-answered behavior for brownfield not found — scan result should pre-select option C';
  }
  return true;
}));

// ===== Gen10 — UX Improvements Phases 2-7 =====

// I106 — V1: Phase 3 traza de derivación
results.push(checkAll('I106', 'V1: Phase 3 incluye instrucción de traza de derivación antes del YAML', (content) => {
  if (!content.includes('Traza de derivación') && !content.includes('Derivado de tus respuestas')) return 'No derivation trace instruction found in phase3';
  return true;
}));

// I107 — V1: Phase 5 traza de derivación para checkpoint
results.push(checkAll('I107', 'V1: Phase 5 incluye instrucción de traza de derivación antes del checkpoint v1.1', (content) => {
  if (!content.includes('Traza de derivación') && !content.includes('Derivado de tus respuestas') && !content.includes('Checkpoint derivado')) return 'No derivation trace instruction found in phase5';
  return true;
}));

// I108 — V2: Phase 2 pre-anuncia secciones de constitución
results.push(checkAll('I108', 'V2: Phase 2 incluye pre-anuncio de secciones de constitución antes de generar', (content) => {
  if (!content.includes('Pre-anuncio') && !content.includes('incluirá')) return 'No pre-announcement of constitution sections found in phase2';
  if (!content.includes('§1') || !content.includes('§7')) return 'Constitution sections §1-§7 not mentioned in pre-announcement';
  return true;
}));

// I109 — V2: Phase 4b pre-anuncia agentes con gate antes de escribir
results.push(checkAll('I109', 'V2: Phase 4b incluye pre-anuncio de agentes con gate de confirmación antes de escribir archivos', (content) => {
  if (!content.includes('Agentes a generar') && !content.includes('agentes a generar')) return 'No agents pre-announcement found in phase4';
  return true;
}));

// I110 — V2: Phase 6 estima cantidad de steps
results.push(checkAll('I110', 'V2: Phase 6 Step 2 incluye estimación de cantidad de steps en el pipeline', (content) => {
  if (!content.includes('steps') || (!content.includes('aproximadamente') && !content.includes('~'))) return 'No step count estimate found in phase6 Step 2';
  return true;
}));

// I111 — V3: Session 1 Complete incluye comando git explícito
results.push(checkAll('I111', 'V3: Session 1 Complete incluye bloque con comando git add derivado de archivos creados', (content) => {
  if (!content.includes('git add')) return 'No explicit git add command found in Session 1 Complete';
  if (!content.includes('git commit')) return 'No git commit command found in Session 1 Complete';
  return true;
}));

// I112 — V4: Phase 4b tiene header de sub-fase con posición
results.push(checkAll('I112', 'V4: Phase 4b tiene header de posición explícita como sub-fase', (content) => {
  if (!content.includes('Phase 4b') || (!content.includes('Agent Definitions') && !content.includes('Agents'))) return 'No Phase 4b sub-phase header found';
  return true;
}));

// I113 — V4: Phase 4b gate de confirmación antes de escribir agentes
results.push(checkAll('I113', 'V4: Phase 4b tiene gate de confirmación antes de escribir archivos de agentes', (content) => {
  if (!content.includes('¿Procedo') && !content.includes('Esperar confirmación') && !content.includes('Wait for confirmation') && !content.includes('esperar confirmación'))
    return 'No confirmation gate before writing agent files found in phase4b';
  return true;
}));

// I114 — V5: Session 2 Complete tiene next steps priorizados por flags
results.push(checkAll('I114', 'V5: Session 2 Complete genera next steps priorizados por flags activos', (content) => {
  if (!content.includes('security_risk') && !content.includes('has_ai_outputs') && !content.includes('compliance_risk'))
    return 'Next steps in Session 2 Complete are not conditioned on project flags';
  return true;
}));

// I115 — V6: Phase 6 tiene paso explícito de registro de artifacts antes del checkpoint write
results.push(checkAll('I115', 'V6: Phase 6 tiene paso de registro en document registry antes del Checkpoint write', (content) => {
  const registryStepIdx = content.indexOf('validate-doc-registry');
  const checkpointIdx = content.indexOf('Checkpoint write (Phase 6)');
  if (registryStepIdx === -1) return 'No validate-doc-registry step found before Phase 6 checkpoint write';
  if (checkpointIdx === -1) return 'No Checkpoint write (Phase 6) marker found';
  if (!content.includes('antes del checkpoint write') && !content.includes('before checkpoint write') && !content.includes('Paso obligatorio'))
    return 'Registry step exists but is not explicitly required before checkpoint write';
  return true;
}));

// I116 — V7: Phase 7 Step 3d incluye fallback para /genesis-sync
results.push(checkAll('I116', 'V7: Phase 7 Step 3d incluye instrucción de fallback cuando /genesis-sync no está disponible', (content) => {
  if (!content.includes('genesis-sync')) return 'No genesis-sync mention in phase7';
  if (!content.includes('no está disponible') && !content.includes('not available') && !content.includes('skip'))
    return 'No fallback instruction for /genesis-sync not available case';
  return true;
}));

// I117 — V8: Phase 2 incluye guía "qué verificar" antes del approval gate
results.push(checkAll('I117', 'V8: Phase 2 incluye lista de puntos críticos a verificar antes del approval gate de constitución', (content) => {
  if (!content.includes('verificar') && !content.includes('Verificar')) return 'No verification guide found in phase2 approval gate';
  if (!content.includes('§4') && !content.includes('§6')) return 'Verification guide does not mention specific constitution sections to check (§4, §6)';
  return true;
}));

// I118 — V9: Phases 3-7 incluyen instrucción de anuncio brownfield prominente
results.push(checkAll('I118', 'V9: Phases 3-7 incluyen instrucción de anuncio prominente de modo brownfield', (content) => {
  if (!content.includes('MODO BROWNFIELD') && !content.includes('BROWNFIELD ACTIVO'))
    return 'No prominent brownfield mode announcement found in phases 3-7';
  // Count occurrences — should appear in 5 phases (3, 4, 5, 6, 7)
  const matches = content.match(/MODO BROWNFIELD ACTIVO/g);
  if (!matches || matches.length < 5) return `BROWNFIELD ACTIVO found only ${matches?.length ?? 0} times — expected 5 (phases 3-7)`;
  return true;
}));

// ===== Recovery & Resume Fixes (R-F1 a R-F7) =====

// I119 — R-F1: Phases 2-6 tienen instrucción de escribir phase_in_progress al inicio
results.push(check('I119', 'R-F1: Phases 2-6 tienen instrucción de phase_in_progress write al inicio de cada fase', (_content) => {
  const phases = ['phase2', 'phase3', 'phase4', 'phase5', 'phase6'];
  for (const phase of phases) {
    const content = readFileSync(resolve(`skills/genesis-governance/references/${phase}.md`), 'utf-8');
    if (!content.includes('phase_in_progress') || (!content.includes('Phase start') && !content.includes('phase start') && !content.includes('phase_in_progress: "Phase'))) {
      return `Phase ${phase} no tiene instrucción de phase_in_progress write al inicio`;
    }
  }
  return true;
}));

// I120 — R-F2: Phase 4 recovery check tiene condición quick_mode
results.push(check('I120', 'R-F2: Phase 4 recovery check distingue CLAUDE.md de quick mode', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  if (!p4.includes('quick_mode')) return 'Phase 4 recovery check no tiene condición quick_mode';
  return true;
}));

// I121 — R-F3: Recovery checks tienen verificación de contenido (no solo presencia)
results.push(check('I121', 'R-F3: Phase 2 y 3 recovery checks verifican contenido, no solo presencia de secciones', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  if (!p2.includes('§4') || (!p2.includes('contenido') && !p2.includes('content') && !p2.includes('líneas') && !p2.includes('lines')))
    return 'Phase 2 recovery check no verifica contenido de §4';
  if (!p3.includes('hard_constraints') || (!p3.includes('vacía') && !p3.includes('empty') && !p3.includes('al menos una')))
    return 'Phase 3 recovery check no verifica contenido de hard_constraints';
  return true;
}));

// I122 — R-F4: Resume announcement incluye artifact inventory
results.push(check('I122', 'R-F4: G2-T4 resume rules incluyen artifact inventory', (_content) => {
  if (!_content.includes('Artifact inventory') && !_content.includes('artifact inventory') && !_content.includes('Artifacts en disco'))
    return 'G2-T4 no incluye artifact inventory en el resume announcement';
  return true;
}));

// I123 — R-F5: Cross-phase consistency check presente en resume rules
results.push(check('I123', 'R-F5: G2-T4 tiene cross-phase consistency check', (_content) => {
  if (!_content.includes('Cross-phase consistency') && !_content.includes('cross-phase') && !_content.includes('artifact de Phase N'))
    return 'G2-T4 no tiene cross-phase consistency check';
  return true;
}));

// I124 — R-F6: Checkpoint schema incluye phase_in_progress en Phase 5
results.push(check('I124', 'R-F6: Checkpoint schema en Phase 5 incluye field phase_in_progress', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  if (!p5.includes('phase_in_progress')) return 'Phase 5 checkpoint schema no incluye phase_in_progress';
  return true;
}));

// I125 — R-F7: genesis-governance.md tiene nota de resume para layers L2-L4
results.push(check('I125', 'R-F7: Resume rules incluyen nota sobre comportamiento de layers L2-L4 (reinicio desde inicio)', (_content) => {
  if (!_content.includes('conversacional') && !_content.includes('conversational') &&
      !_content.includes('reinicia') && !_content.includes('restart'))
    return 'genesis-governance.md no tiene nota sobre el comportamiento de resume en layers L2-L4';
  return true;
}));

// ===== Gen11 — genesis-sync fixes (S-F1 a S-F6) =====

// I126 — S-F1: Precondición acepta v1.2 además de v1.1
results.push(check('I126', 'S-F1: genesis-sync precondición acepta genesis_version v1.1 y v1.2', (_content) => {
  const syncPath = resolve('skills/genesis-sync/SKILL.md');
  if (!existsSync(syncPath)) return 'genesis-sync.md not found';
  const syncContent = readFileSync(syncPath, 'utf-8');
  // Should NOT have exclusive check for only "1.1"
  if (syncContent.includes('no es `"1.1"` o no existe') && !syncContent.includes('ni `"1.2"') && !syncContent.includes('ni "1.2"'))
    return 'Precondición solo acepta v1.1 — regresión: v1.2 sería rechazado';
  // Should explicitly mention v1.2 as valid
  if (!syncContent.includes('"1.2"'))
    return 'genesis-sync no menciona v1.2 como versión válida';
  return true;
}));

// I127 — S-F2: Phase 5 no baja la versión del checkpoint a "1.1"
results.push(check('I127', 'S-F2: genesis-sync Phase 5 no hardcodea genesis_version a "1.1"', (_content) => {
  const syncPath = resolve('skills/genesis-sync/SKILL.md');
  if (!existsSync(syncPath)) return 'genesis-sync.md not found';
  const syncContent = readFileSync(syncPath, 'utf-8');
  // Must not have instruction to set version back to 1.1
  if (syncContent.includes('genesis_version') && syncContent.includes('"1.1"')) {
    // Check if there's a dangerous "set to 1.1" instruction (not just a reference)
    const lines = syncContent.split('\n');
    for (const line of lines) {
      if (line.includes('genesis_version') && line.includes('"1.1"') &&
          (line.includes('es `"1.1"') || line.includes('= "1.1"') || line.includes('a "1.1"'))) {
        // Check if it's the problematic "Asegurarse que es 1.1" pattern
        if (!line.includes('ni') && !line.includes('mayor') && !line.includes('nunca bajar')) {
          return 'Phase 5 puede estar bajando genesis_version a "1.1" — verificar instrucción de checkpoint update';
        }
      }
    }
  }
  return true;
}));

// I128 — S-F3: Migration v1.1→v1.2 cubre el caso v1.2 sin claude_md_required_headings
results.push(check('I128', 'S-F3: Migration v1.1→v1.2 también cubre v1.2 sin claude_md_required_headings', (_content) => {
  const syncPath = resolve('skills/genesis-sync/SKILL.md');
  if (!existsSync(syncPath)) return 'genesis-sync.md not found';
  const syncContent = readFileSync(syncPath, 'utf-8');
  if (!syncContent.includes('claude_md_required_headings'))
    return 'genesis-sync no menciona claude_md_required_headings en la migración';
  // Should cover the case of v1.2 without the field
  if (!syncContent.includes('"1.2"') ||
      (!syncContent.includes('claude_md_required_headings') ))
    return 'Migration condition does not cover v1.2 without claude_md_required_headings';
  return true;
}));

// I129 — S-F4: Phase 4 gate permite selección parcial de fixes
results.push(check('I129', 'S-F4: genesis-sync Phase 4 gate permite aplicar fixes seleccionados por número', (_content) => {
  const syncPath = resolve('skills/genesis-sync/SKILL.md');
  if (!existsSync(syncPath)) return 'genesis-sync.md not found';
  const syncContent = readFileSync(syncPath, 'utf-8');
  if (!syncContent.includes('[número') && !syncContent.includes('[number') && !syncContent.includes('número(s)'))
    return 'Phase 4 gate no tiene opción de selección parcial por número';
  return true;
}));

// I130 — S-F5: Phase 4 incluye "Próxima sync recomendada"
results.push(check('I130', 'S-F5: genesis-sync Phase 4 incluye guidance de próxima sync recomendada', (_content) => {
  const syncPath = resolve('skills/genesis-sync/SKILL.md');
  if (!existsSync(syncPath)) return 'genesis-sync.md not found';
  const syncContent = readFileSync(syncPath, 'utf-8');
  // Should appear in Phase 4 section (before Phase 5)
  const phase4Idx = syncContent.indexOf('## PHASE 4');
  const phase5Idx = syncContent.indexOf('## PHASE 5');
  if (phase4Idx === -1) return 'No se encontró PHASE 4 en genesis-sync.md';
  const phase4Content = syncContent.slice(phase4Idx, phase5Idx === -1 ? undefined : phase5Idx);
  if (!phase4Content.includes('Próxima sync') && !phase4Content.includes('proxima sync') &&
      !phase4Content.includes('next sync') && !phase4Content.includes('sync recomendada'))
    return 'Phase 4 no incluye guidance de próxima sync recomendada';
  return true;
}));

// I131 — S-F6: genesis-sync tiene progress indicators en phases 1-4
results.push(check('I131', 'S-F6: genesis-sync tiene indicadores de progreso [N/5] en phases 1-4', (_content) => {
  const syncPath = resolve('skills/genesis-sync/SKILL.md');
  if (!existsSync(syncPath)) return 'genesis-sync.md not found';
  const syncContent = readFileSync(syncPath, 'utf-8');
  if (!syncContent.includes('[1/5]') || !syncContent.includes('[2/5]') ||
      !syncContent.includes('[3/5]') || !syncContent.includes('[4/5]'))
    return 'genesis-sync no tiene indicadores de progreso [N/5] en las phases';
  return true;
}));

// ===== Gen12 — Brownfield fixes (B-F1 a B-F3) =====

// I132 — B-F1: Brownfield Phase 2 tiene conditional artifact check como Paso 8
results.push(check('I132', 'B-F1: Brownfield Phase 2 verifica conditional artifacts ausentes (model card, DPIA, scripts)', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  // Must have conditional artifact check in brownfield path
  if (!p2.includes('Conditional artifact check') && !p2.includes('conditional artifact'))
    return 'Brownfield Phase 2 no tiene conditional artifact check';
  // Must check for model card
  if (!p2.includes('model-card') && !p2.includes('model card'))
    return 'Brownfield Phase 2 no verifica model card ausente';
  // Must check for scripts
  if (!p2.includes('constitution-checks.ts') || !p2.includes('validate-doc-registry.ts'))
    return 'Brownfield Phase 2 no verifica scripts ausentes';
  return true;
}));

// I133 — B-F2: §7 DoD incluye las 4 derivaciones de flags (compliance, RLS, anti-lookahead, financial)
results.push(check('I133', 'B-F2: §7 DoD template incluye compliance-reviewer, RLS, anti-lookahead y financial flow derivations', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  if (!p2.includes('compliance_risk') || !p2.includes('compliance-reviewer'))
    return '§7 DoD no tiene regla compliance-reviewer para compliance_risk';
  if (!p2.includes('has_multitenancy') || (!p2.includes('RLS') && !p2.includes('rls')))
    return '§7 DoD no tiene regla RLS para has_multitenancy';
  if (!p2.includes('has_ai_outputs') || !p2.includes('anti-lookahead'))
    return '§7 DoD no tiene regla anti-lookahead para has_ai_outputs';
  if (!p2.includes('has_financial_flow') || (!p2.includes('audit trail') && !p2.includes('reconciliation')))
    return '§7 DoD no tiene regla audit trail para has_financial_flow';
  return true;
}));

// I134 — B-F3: Phase 5 define registry class para archivos no-markdown
results.push(check('I134', 'B-F3: Phase 5 define registry class para archivos JSON/TS/YAML (checkpoint, script, config)', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  if (!p5.includes('checkpoint') || (!p5.includes('class: `checkpoint`') && !p5.includes("class: 'checkpoint'") && !p5.includes('class: checkpoint')))
    return 'Phase 5 no define class "checkpoint" para archivos JSON gobernados';
  if (!p5.includes('class: `script`') && !p5.includes("class: 'script'") && !p5.includes('class: script'))
    return 'Phase 5 no define class "script" para scripts TypeScript';
  return true;
}));

// --- Gen13: Quick Mode + Error Handling fixes ---

// I135 — QM-F1: G2-T3 tiene Checkpoint write (Quick Mode) con quick_mode: true
results.push(check('I135', 'QM-F1: G2-T3 tiene "Checkpoint write (Quick Mode)" que escribe quick_mode: true', (content) => {
  if (!content.includes('Checkpoint write (Quick Mode)'))
    return 'G2-T3 no tiene bloque "Checkpoint write (Quick Mode)"';
  if (!content.includes('quick_mode: true'))
    return 'Checkpoint write no establece quick_mode: true';
  return true;
}));

// I136 — QM-F1: Checkpoint write aparece después de "write both files to disk" y antes de "End of quick path"
results.push(check('I136', 'QM-F1: Checkpoint write (Quick Mode) está ubicado entre "write both files to disk" y "End of quick path"', (content) => {
  const writeIdx = content.indexOf('write both files to disk');
  const checkpointIdx = content.indexOf('Checkpoint write (Quick Mode)');
  const endIdx = content.indexOf('End of quick path');
  if (writeIdx === -1) return '"write both files to disk" no encontrado';
  if (checkpointIdx === -1) return '"Checkpoint write (Quick Mode)" no encontrado';
  if (endIdx === -1) return '"End of quick path" no encontrado';
  if (!(writeIdx < checkpointIdx && checkpointIdx < endIdx))
    return 'Checkpoint write no está entre "write both files to disk" y "End of quick path"';
  return true;
}));

// I137 — QM-F2: Exit message de G2-T3 incluye git add con genesis-checkpoint.json
results.push(check('I137', 'QM-F2: Exit message de G2-T3 incluye "git add" con genesis-checkpoint.json', (content) => {
  if (!content.includes('git add') || !content.includes('genesis-checkpoint.json'))
    return 'Exit message no incluye git add con genesis-checkpoint.json';
  // Verify git add appears inside the G2-T3 section (before "End of quick path")
  const endIdx = content.indexOf('End of quick path');
  const gitAddIdx = content.lastIndexOf('git add', endIdx);
  if (gitAddIdx === -1)
    return 'git add no aparece antes de "End of quick path"';
  return true;
}));

// I138 — E-F1: genesis-governance.md tiene ## Error Handling con al menos 6 handlers
results.push(check('I138', 'E-F1: genesis-governance.md tiene ## Error Handling con los 6 handlers base', (content) => {
  if (!content.includes('## Error Handling'))
    return 'genesis-governance.md no tiene sección ## Error Handling';
  // Must have at least 6 handlers (Handler 1 through Handler 6 or their equivalents)
  const handlerCount = (content.match(/\*\*Handler \d+/g) || []).length;
  if (handlerCount < 6)
    return `Solo ${handlerCount} handlers encontrados, se esperaban al menos 6`;
  return true;
}));

// I139 — E-F1: Error handlers están en genesis-governance.md (siempre cargado), no solo en phase7.md
results.push(check('I139', 'E-F1: Error handlers presentes en genesis-governance.md (always-loaded), no solo en phase7.md', (content) => {
  // Handler for vague answers must be in genesis-governance.md (content = main file)
  if (!content.includes('vague or incomplete') && !content.includes('Respuesta vaga') && !content.includes('vaga o incompleta'))
    return 'Handler de respuesta vaga/incompleta no está en genesis-governance.md';
  if (!content.includes('skip a phase') && !content.includes('saltear una fase'))
    return 'Handler de "saltear fase" no está en genesis-governance.md';
  return true;
}));

// I140 — E-F2: Handler para developer que pega CLAUDE.md como respuesta L1
results.push(check('I140', 'E-F2: Handler para developer que pega CLAUDE.md existente como respuesta L1', (content) => {
  if (!content.includes('CLAUDE.md existente') && !content.includes('pegaste un CLAUDE.md'))
    return 'No hay handler para el caso de developer pegando CLAUDE.md en L1';
  return true;
}));

// I141 — E-F2: Handler para doble invocación del skill sin checkpoint del primer run
results.push(check('I141', 'E-F2: Handler para skill invocado dos veces sin genesis-checkpoint.json', (content) => {
  if (!content.includes('genesis antes') && !content.includes('ya corrí genesis') && !content.includes('invocado dos veces'))
    return 'No hay handler para doble invocación sin checkpoint';
  // Must reference genesis-checkpoint.json in the handler context
  const errorSection = content.split('## Error Handling')[1] || '';
  if (!errorSection.includes('genesis-checkpoint.json'))
    return 'Handler de doble invocación no referencia genesis-checkpoint.json';
  return true;
}));

// I142 — E-F1: phase7.md mantiene sus handlers + nota de cross-reference a genesis-governance.md
results.push(check('I142', 'E-F1: phase7.md mantiene Error Handling + nota de cross-reference a genesis-governance.md', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  if (!p7.includes('## Error Handling'))
    return 'phase7.md perdió la sección ## Error Handling';
  if (!p7.includes('genesis-governance.md') || (!p7.includes('fuente autoritativa') && !p7.includes('cross-reference') && !p7.includes('siempre cargado')))
    return 'phase7.md no tiene nota de cross-reference a genesis-governance.md';
  return true;
}));

// --- Gen14: constitution-checks __dirname, checkpoint v1.2 headings, commit commands, genesis-sync fixes ---

// I143 — GEN14-F1: constitution-checks.ts NO asigna __dirname a ROOT (roto en ESM/tsx)
results.push(check('I143', 'GEN14-F1: constitution-checks.ts template no asigna ROOT = __dirname', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  // Check for the actual broken assignment pattern, not just any mention of the word
  if (p2.includes('resolve(__dirname') || p2.includes('= __dirname') || p2.match(/ROOT\s*=\s*path\.resolve\(__dirname/))
    return 'constitution-checks.ts template aún asigna ROOT desde __dirname (roto en ESM/tsx)';
  return true;
}));

// I144 — GEN14-F1: constitution-checks.ts usa process.cwd() en su lugar
results.push(check('I144', 'GEN14-F1: constitution-checks.ts template usa process.cwd()', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  if (!p2.includes('process.cwd()'))
    return 'constitution-checks.ts template no usa process.cwd()';
  return true;
}));

// I145 — GEN14-F2: Phase 5 checkpoint v1.2 template incluye claude_md_required_headings
results.push(check('I145', 'GEN14-F2: checkpoint v1.2 template incluye claude_md_required_headings', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  if (!p5.includes('claude_md_required_headings'))
    return 'Phase 5 checkpoint template no tiene campo claude_md_required_headings';
  return true;
}));

// I146 — GEN14-F2: Phase 5 explica cómo derivar claude_md_required_headings desde CLAUDE.md de Phase 4
results.push(check('I146', 'GEN14-F2: Phase 5 tiene instrucción de derivar claude_md_required_headings desde CLAUDE.md', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  if (!p5.includes('claude_md_required_headings') || !p5.includes('Phase 4'))
    return 'Phase 5 no explica que claude_md_required_headings se deriva de Phase 4 CLAUDE.md';
  return true;
}));

// I147 — GEN14-F3: Phase 7 / Session 2 COMPLETE tiene bloque git add con ci.yml
results.push(check('I147', 'GEN14-F3: Session 2 COMPLETE tiene git add con ci.yml', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  const session2 = p7.split('SESSION 2 COMPLETE')[1] || p7;
  if (!session2.includes('ci.yml') || !session2.includes('git add'))
    return 'Session 2 COMPLETE no tiene git add que incluya ci.yml';
  return true;
}));

// I148 — GEN14-F3: Session 2 commit command menciona el audit file
results.push(check('I148', 'GEN14-F3: Session 2 commit command incluye governance-audit', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  const session2 = p7.split('SESSION 2 COMPLETE')[1] || p7;
  if (!session2.includes('governance-audit'))
    return 'Session 2 commit command no menciona el archivo governance-audit';
  return true;
}));

// I149 — GEN14-F4: Phase 7 Step 3d incluye instrucción de Read genesis-sync.md (no solo "Invoke")
results.push(check('I149', 'GEN14-F4: Step 3d dice Read skills/genesis-sync/SKILL.md antes de ejecutar', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  const step3d = p7.split('Step 3d')[1]?.split('Step 4')[0] || '';
  if (!step3d.includes('genesis-sync/SKILL.md') || !step3d.includes('Read'))
    return 'Step 3d no incluye instrucción de Read genesis-sync/SKILL.md';
  return true;
}));

// I150 — GEN14-F5: D-SYNC-7 tiene criterio de matching explícito (sustantivo clave)
results.push(check('I150', 'GEN14-F5: D-SYNC-7 tiene algoritmo de matching definido (sustantivo clave)', (_content) => {
  const gs = readFileSync(resolve('skills/genesis-sync/SKILL.md'), 'utf-8');
  const d7 = gs.split('D-SYNC-7')[1]?.split('D-SYNC-8')[0] || '';
  if (!d7.includes('sustantivo') && !d7.includes('key noun') && !d7.includes('match'))
    return 'D-SYNC-7 no tiene criterio de matching explícito entre MUST NOT y hard_constraints';
  return true;
}));

// I151 — GEN14-F6: genesis-sync Phase 4 skipea confirmación cuando N=0 y M=0
results.push(check('I151', 'GEN14-F6: genesis-sync Phase 4 skipea gate de confirmación cuando 0 findings', (_content) => {
  const gs = readFileSync(resolve('skills/genesis-sync/SKILL.md'), 'utf-8');
  const phase4area = gs.split('PHASE 4')[1]?.split('PHASE 5')[0] || '';
  if (!phase4area.includes('N=0') && !phase4area.includes('nada que aplicar'))
    return 'genesis-sync Phase 4 no tiene lógica de skip cuando N=0 y M=0';
  return true;
}));

// I152 — GEN14-F7: Session 1 commit command menciona artefactos condicionales (model-card, dpia, threat-model)
results.push(check('I152', 'GEN14-F7: Session 1 commit incluye nota de artefactos condicionales', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  const commitSection = p5.split('Para commitear')[1] || '';
  if (!commitSection.includes('model-card') && !commitSection.includes('model card'))
    return 'Session 1 commit no menciona model-card como artefacto condicional';
  if (!commitSection.includes('dpia') && !commitSection.includes('DPIA'))
    return 'Session 1 commit no menciona dpia como artefacto condicional';
  if (!commitSection.includes('threat-model') && !commitSection.includes('threat model'))
    return 'Session 1 commit no menciona threat-model como artefacto condicional';
  return true;
}));

// I153 — GEN14-F8: Phase 5 derivación trace dice "checkpoint v1.2" (no v1.1 stale)
results.push(check('I153', 'GEN14-F8: Phase 5 traza de derivación dice "checkpoint v1.2" (no stale v1.1)', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  if (p5.includes('checkpoint v1.1'))
    return 'Phase 5 aún dice "checkpoint v1.1" en la traza de derivación — stale';
  if (!p5.includes('checkpoint v1.2'))
    return 'Phase 5 no dice "checkpoint v1.2" en la traza de derivación';
  return true;
}));

// -----------------------------------------------------------------------
// Gen15 — Functional Gaps (I154–I159)
// -----------------------------------------------------------------------

// I154 — Phase 5 checkpoint template incluye genesis_skill_generation
results.push(check('I154', 'Phase 5 checkpoint template incluye genesis_skill_generation', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  if (!p5.includes('genesis_skill_generation'))
    return 'Phase 5 checkpoint template no incluye campo genesis_skill_generation';
  return true;
}));

// I155 — G2-T3 Quick Mode checkpoint write incluye genesis_skill_generation
results.push(check('I155', 'G2-T3 Quick Mode checkpoint write incluye genesis_skill_generation', (content) => {
  // G2-T3 appears twice: first as a reference "(G2-T3)" then as a section header "G2-T3 — QUICK PATH"
  // Use the section header (second occurrence) as anchor
  const parts = content.split('QUICK PATH');
  const quickPathSection = parts.slice(1).join('QUICK PATH'); // everything from the section header onward
  if (!quickPathSection.includes('genesis_skill_generation'))
    return 'G2-T3 Checkpoint write (in QUICK PATH section) no menciona genesis_skill_generation';
  return true;
}));

// I156 — G2-T4 tiene anuncio explícito para upgrade de quick_mode a full
results.push(check('I156', 'G2-T4 tiene anuncio de upgrade explícito cuando quick_mode=true', (content) => {
  // G2-T4 is the reentry section — search for the upgrade announcement phrase
  if (!content.includes('quick bootstrap') && !content.includes('bootstrap rápido'))
    return 'G2-T4 no tiene anuncio diferenciado para upgrade quick→full (debería mencionar "bootstrap rápido")';
  if (!content.includes('quick_mode'))
    return 'G2-T4 no menciona quick_mode en el flujo de reentry';
  return true;
}));

// I157 — phase7.md genera domain glossary con instrucción de derivación desde intake (antes de SESSION 2 COMPLETE)
results.push(check('I157', 'SESSION 2 COMPLETE genera domain-glossary con derivación desde intake', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  // Glossary instructions may be before SESSION 2 COMPLETE (Gen24: moved before checkpoint write)
  if (!p7.includes('domain-glossary'))
    return 'phase7.md no genera domain-glossary.[project-slug].md';
  // Check that L1/L2/L3 derivation instruction exists anywhere in phase7
  if (!p7.includes('L1') || !p7.includes('L2') || !p7.includes('L3'))
    return 'domain-glossary no tiene instrucción de derivación desde intake (L1/L2/L3)';
  return true;
}));

// I158 — phase7.md genera CODEOWNERS con paths derivados de L5 (antes de SESSION 2 COMPLETE)
results.push(check('I158', 'SESSION 2 COMPLETE genera CODEOWNERS con paths derivados de L5', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  // CODEOWNERS instructions may be before SESSION 2 COMPLETE (Gen24: moved before checkpoint write)
  if (!p7.includes('CODEOWNERS'))
    return 'phase7.md no genera .github/CODEOWNERS';
  if (!p7.includes('L5') && !p7.includes('paths.backend') && !p7.includes('packages.backend'))
    return 'CODEOWNERS no tiene instrucción de derivar paths desde L5';
  return true;
}));

// I159 — Session 2 commit command incluye domain-glossary y CODEOWNERS
results.push(check('I159', 'Session 2 commit command incluye domain-glossary y CODEOWNERS', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  const commitArea = p7.split('Para commitear los artifacts de Session 2')[1]?.split('git commit')[0] || '';
  if (!commitArea.includes('CODEOWNERS'))
    return 'Session 2 commit git add no incluye .github/CODEOWNERS';
  if (!commitArea.includes('domain-glossary'))
    return 'Session 2 commit git add no incluye domain-glossary.[project-slug].md';
  return true;
}));

// -----------------------------------------------------------------------
// Gen16 — Simulation Findings (I160–I167)
// -----------------------------------------------------------------------

// I160 — GEN16-F1: Prerequisites check tiene execution order explícito (reentry antes de U9)
results.push(check('I160', 'GEN16-F1: Prerequisites check tiene execution order explícito', (content) => {
  const prereqArea = content.split('Prerequisites check')[1]?.split('U9 — AUTO-DETECTION')[0] || '';
  if (!prereqArea.includes('Execution order') && !prereqArea.includes('execution order'))
    return 'Prerequisites check no tiene bloque de Execution order explícito';
  if (!prereqArea.includes('Reentry') && !prereqArea.includes('reentry') && !prereqArea.includes('G2-T4'))
    return 'Execution order no menciona G2-T4 reentry check como primer paso';
  return true;
}));

// I161 — GEN16-F2: ORIENTATION sección tiene nota interna de secuencia (mostrar después de Step 1.0)
results.push(check('I161', 'GEN16-F2: ORIENTATION tiene nota para mostrar solo después de Step 1.0', (content) => {
  // Search for the section header "### ORIENTATION" specifically
  const orientArea = content.split('### ORIENTATION')[1]?.split('### LAYER 1')[0] || '';
  if (!orientArea.includes('Step 1.0') && !orientArea.includes('step 1.0'))
    return 'ORIENTATION no tiene nota de secuencia referenciando Step 1.0';
  if (!orientArea.includes('INTERNO') && !orientArea.includes('interno') && !orientArea.includes('no mostrar'))
    return 'ORIENTATION nota no está marcada como INTERNO para el modelo';
  return true;
}));

// I162 — GEN16-F3: LAYER 2 tiene mensaje de transición con "Layer 2/5"
results.push(check('I162', 'GEN16-F3: LAYER 2 tiene mensaje de transición con progreso', (content) => {
  const l2area = content.split('LAYER 2')[1]?.split('LAYER 3')[0] || '';
  if (!l2area.includes('Layer 2/5') && !l2area.includes('2/5'))
    return 'LAYER 2 no tiene indicador de progreso "Layer 2/5"';
  return true;
}));

// I163 — GEN16-F3: LAYER 3 tiene mensaje de transición con "Layer 3/5"
results.push(check('I163', 'GEN16-F3: LAYER 3 tiene mensaje de transición con progreso', (content) => {
  const l3area = content.split('LAYER 3')[1]?.split('LAYER 4')[0] || '';
  if (!l3area.includes('Layer 3/5') && !l3area.includes('3/5'))
    return 'LAYER 3 no tiene indicador de progreso "Layer 3/5"';
  return true;
}));

// I164 — GEN16-F3: LAYER 4 tiene mensaje de transición con "Layer 4/5"
results.push(check('I164', 'GEN16-F3: LAYER 4 tiene mensaje de transición con progreso', (content) => {
  const l4area = content.split('LAYER 4')[1]?.split('LAYER 5')[0] || '';
  if (!l4area.includes('Layer 4/5') && !l4area.includes('4/5'))
    return 'LAYER 4 no tiene indicador de progreso "Layer 4/5"';
  return true;
}));

// I165 — GEN16-F3: LAYER 5 tiene mensaje de transición con "Layer 5/5"
results.push(check('I165', 'GEN16-F3: LAYER 5 tiene mensaje de transición con progreso', (content) => {
  const l5area = content.split('LAYER 5')[1]?.split('L5 Reality Check')[0] || '';
  if (!l5area.includes('Layer 5/5') && !l5area.includes('5/5'))
    return 'LAYER 5 no tiene indicador de progreso "Layer 5/5"';
  return true;
}));

// I166 — GEN16-F4: G30 boundary check referencia la conversación previa de api-quota
results.push(check('I166', 'GEN16-F4: G30 boundary check referencia servicios ya mencionados', (content) => {
  const g30area = content.split('G30')[1]?.split('This check prevents')[0] || '';
  if (!g30area.includes('ya mencionamos') && !g30area.includes('Ya mencionamos') && !g30area.includes('already'))
    return 'G30 boundary check no referencia los servicios ya mencionados en la pregunta de api-quota';
  return true;
}));

// I167 — GEN16-F5: L5 tiene closure summary (G35) antes del Reality Check
results.push(check('I167', 'GEN16-F5: L5 tiene closure summary (G35) antes del Reality Check', (content) => {
  const beforeRC = content.split('L5 Reality Check')[0] || '';
  if (!beforeRC.includes('G35') && !beforeRC.includes('L5 closure summary'))
    return 'L5 no tiene closure summary (G35) antes del Reality Check';
  if (!beforeRC.includes('Layer 5 confirmado') && !beforeRC.includes('Layer 5 confirmed'))
    return 'L5 closure summary no tiene mensaje de confirmación "Layer 5 confirmado"';
  return true;
}));

// -----------------------------------------------------------------------
// Gen17 — Brownfield Simulation Findings (I168–I174)
// -----------------------------------------------------------------------

// I168 — GEN17-F1: Brownfield announcement incluye aviso explícito de impacto (qué archivos se reemplazarán)
results.push(check('I168', 'GEN17-F1: Brownfield announcement incluye aviso de impacto sobre archivos existentes', (content) => {
  const brownfieldAnnouncement = content.split('If `brownfield` detected — announce before L1')[1]?.split('Step 1.6 behavior')[0] || '';
  if (!brownfieldAnnouncement.includes('Impacto') && !brownfieldAnnouncement.includes('impacto'))
    return 'Brownfield announcement no tiene bloque de impacto (⚠️ Impacto sobre los archivos existentes)';
  if (!brownfieldAnnouncement.includes('backup'))
    return 'Brownfield announcement no menciona que se creará un backup';
  return true;
}));

// I169 — GEN17-F1: Brownfield announcement espera confirmación explícita (no avanza en silencio)
results.push(check('I169', 'GEN17-F1: Brownfield announcement requiere confirmación explícita antes de proceder', (content) => {
  const brownfieldAnnouncement = content.split('If `brownfield` detected — announce before L1')[1]?.split('Step 1.6 behavior')[0] || '';
  if (!brownfieldAnnouncement.includes('Confirmás') && !brownfieldAnnouncement.includes('confirmás') && !brownfieldAnnouncement.includes('Confirm'))
    return 'Brownfield announcement no pide confirmación explícita al developer';
  if (!brownfieldAnnouncement.includes('Do NOT proceed on silence') && !brownfieldAnnouncement.includes('no proceder en silencio') && !brownfieldAnnouncement.includes('not proceed on silence') && !brownfieldAnnouncement.includes('Do NOT proceed') && !brownfieldAnnouncement.includes('wait for an affirmative'))
    return 'Brownfield announcement no dice explícitamente que no se avanza en silencio';
  return true;
}));

// I170 — GEN17-F2: LAYER 5 tiene brownfield branch que invierte orden (Reality Check primero, omite G34)
results.push(check('I170', 'GEN17-F2: LAYER 5 tiene brownfield branch que corre Reality Check primero y omite G34', (content) => {
  const l5area = content.split('LAYER 5 — TECHNICAL')[1]?.split('L5 Reality Check')[0] || '';
  if (!l5area.includes('brownfield') && !l5area.includes('Brownfield'))
    return 'LAYER 5 no tiene brownfield branch';
  if (!l5area.includes('Reality Check') && !l5area.includes('reality check'))
    return 'LAYER 5 brownfield branch no menciona correr Reality Check primero';
  if (!l5area.includes('G34') || (!l5area.includes('Omitir G34') && !l5area.includes('omitir G34') && !l5area.includes('Omitir') && !l5area.includes('omitir')))
    return 'LAYER 5 brownfield branch no indica omitir G34 (propuesta hipotética)';
  return true;
}));

// I171 — GEN17-F3: Phase 4 brownfield tiene bloque de merge PROJECT-SPECIFIC sections
results.push(check('I171', 'GEN17-F3: Phase 4 brownfield tiene bloque merge PROJECT-SPECIFIC', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  if (!p4.includes('PROJECT-SPECIFIC'))
    return 'Phase 4 no tiene referencia a secciones PROJECT-SPECIFIC';
  if (!p4.includes('merge') && !p4.includes('preservar') && !p4.includes('Preservado'))
    return 'Phase 4 brownfield no tiene instrucción de merge/preservación de secciones PROJECT-SPECIFIC';
  return true;
}));

// I172 — GEN17-F3: Phase 4 pregunta al developer qué secciones PROJECT-SPECIFIC preservar antes de escribir
results.push(check('I172', 'GEN17-F3: Phase 4 pregunta qué secciones PROJECT-SPECIFIC preservar antes de escribir', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  // Join all splits from first "Brownfield" onward to capture both the safeguard and merge blocks
  const brownfieldMerge = p4.split('Brownfield').slice(1).join('Brownfield') || '';
  if (!brownfieldMerge.includes('ninguna') && !brownfieldMerge.includes('Ninguna'))
    return 'Phase 4 merge block no ofrece la opción "ninguna" al developer';
  if (!brownfieldMerge.includes('TAL CUAL') && !brownfieldMerge.includes('tal cual') && !brownfieldMerge.includes('preservar'))
    return 'Phase 4 merge block no pregunta qué secciones preservar tal cual';
  return true;
}));

// I173 — GEN17-F4: Phase 6 brownfield ofrece APPEND vs REPLACE para CI
results.push(check('I173', 'GEN17-F4: Phase 6 brownfield ofrece APPEND vs REPLACE para el CI existente', (_content) => {
  const p6 = readFileSync(resolve('skills/genesis-governance/references/phase6.md'), 'utf-8');
  if (!p6.includes('APPEND') || !p6.includes('REPLACE'))
    return 'Phase 6 no ofrece opción APPEND vs REPLACE para el CI brownfield';
  return true;
}));

// I174 — GEN17-F4: Phase 6 brownfield identifica jobs CUSTOM vs GOVERNANCE antes de preguntar
results.push(check('I174', 'GEN17-F4: Phase 6 brownfield clasifica jobs CUSTOM vs GOVERNANCE', (_content) => {
  const p6 = readFileSync(resolve('skills/genesis-governance/references/phase6.md'), 'utf-8');
  if (!p6.includes('CUSTOM') || !p6.includes('GOVERNANCE'))
    return 'Phase 6 brownfield no clasifica jobs como CUSTOM vs GOVERNANCE';
  return true;
}));

// -----------------------------------------------------------------------
// Gen18 — F1: User manual (I175–I178)
// -----------------------------------------------------------------------

// I175 — GEN18-F1: User manual versión ≥ 1.1 y fecha 2026-04-
results.push({
  id: 'I175',
  description: 'GEN18-F1: User manual actualizado a v1.1+ y fecha 2026-04',
  ...(() => {
    const manual = existsSync(resolve('docs/guides/runbook.genesis-governance.user-manual.md'))
      ? readFileSync(resolve('docs/guides/runbook.genesis-governance.user-manual.md'), 'utf-8')
      : '';
    const manualMatch = manual.match(/version:\s*([\d.]+)/);
    if (!manualMatch) return { pass: false, detail: 'User manual no tiene campo version en frontmatter' };
    const [major, minor] = manualMatch[1].split('.').map(Number);
    if (major < 1 || (major === 1 && minor < 1))
      return { pass: false, detail: `User manual version ${manualMatch[1]} — debe ser ≥ 1.1` };
    if (!manual.includes('2026-04'))
      return { pass: false, detail: 'User manual fecha no fue actualizada a 2026-04' };
    return { pass: true };
  })(),
});

// I176 — GEN18-F1: User manual tiene sección brownfield con sub-casos
results.push({
  id: 'I176',
  description: 'GEN18-F1: User manual tiene sección brownfield (governance parcial, sin checkpoint, APPEND/REPLACE)',
  ...(() => {
    const manual = existsSync(resolve('docs/guides/runbook.genesis-governance.user-manual.md'))
      ? readFileSync(resolve('docs/guides/runbook.genesis-governance.user-manual.md'), 'utf-8')
      : '';
    if (!manual.includes('brownfield') && !manual.includes('Brownfield'))
      return { pass: false, detail: 'User manual no tiene sección brownfield' };
    if (!manual.includes('APPEND') || !manual.includes('REPLACE'))
      return { pass: false, detail: 'User manual brownfield no explica APPEND vs REPLACE para CI' };
    if (!manual.includes('reconstruct') && !manual.includes('Reconstruct'))
      return { pass: false, detail: 'User manual brownfield no menciona reconstrucción de checkpoint' };
    return { pass: true };
  })(),
});

// I177 — GEN18-F1: User manual tiene sección de navegación con comandos ? / manual / overview
results.push({
  id: 'I177',
  description: 'GEN18-F1: User manual tiene sección "Navigation & corrections" con comandos ?/manual/overview',
  ...(() => {
    const manual = existsSync(resolve('docs/guides/runbook.genesis-governance.user-manual.md'))
      ? readFileSync(resolve('docs/guides/runbook.genesis-governance.user-manual.md'), 'utf-8')
      : '';
    if (!manual.includes('Navigation') && !manual.includes('navigation'))
      return { pass: false, detail: 'User manual no tiene sección Navigation' };
    if (!manual.includes('overview'))
      return { pass: false, detail: 'User manual Navigation no menciona comando "overview"' };
    if (!manual.includes('backtrack') && !manual.includes('Backtrack'))
      return { pass: false, detail: 'User manual Navigation no menciona backtrack protocol' };
    return { pass: true };
  })(),
});

// I178 — GEN18-F1: User manual menciona G35 closure summary y quick mode upgrade
results.push({
  id: 'I178',
  description: 'GEN18-F1: User manual menciona G35 closure summary y upgrade a full mode',
  ...(() => {
    const manual = existsSync(resolve('docs/guides/runbook.genesis-governance.user-manual.md'))
      ? readFileSync(resolve('docs/guides/runbook.genesis-governance.user-manual.md'), 'utf-8')
      : '';
    if (!manual.includes('G35') && !manual.includes('closure summary') && !manual.includes('stack confirmation'))
      return { pass: false, detail: 'User manual no menciona G35 closure summary (confirmación de stack en L5)' };
    if (!manual.includes('full') && !manual.includes('upgrade'))
      return { pass: false, detail: 'User manual no menciona upgrade de quick mode a full mode' };
    return { pass: true };
  })(),
});

// -----------------------------------------------------------------------
// Gen18 — F2 + F3 (I179–I181)
// -----------------------------------------------------------------------

// I179 — GEN18-F2: genesis-sync D-SYNC-8 tiene manejo de APPEND mode con ci_integration_mode
results.push(check('I179', 'GEN18-F2: genesis-sync D-SYNC-8 maneja ci_integration_mode APPEND (no reporta jobs CUSTOM como drift)', (_content) => {
  const gs = readFileSync(resolve('skills/genesis-sync/SKILL.md'), 'utf-8');
  const d8area = gs.split('D-SYNC-8 —')[1]?.split('PHASE 4')[0] || '';
  if (!d8area.includes('ci_integration_mode'))
    return 'D-SYNC-8 no lee ci_integration_mode del checkpoint';
  if (!d8area.includes('APPEND') || !d8area.includes('EXCLUDED_FROM_SYNC') && !d8area.includes('genesis-governance'))
    return 'D-SYNC-8 no tiene lógica para excluir jobs CUSTOM en APPEND mode';
  return true;
}));

// I180 — GEN18-F2: Phase 6 escribe ci_integration_mode en el checkpoint según elección del developer
results.push(check('I180', 'GEN18-F2: Phase 6 checkpoint write incluye ci_integration_mode (append/replace)', (_content) => {
  const p6 = readFileSync(resolve('skills/genesis-governance/references/phase6.md'), 'utf-8');
  const checkpointArea = p6.split('Checkpoint write (Phase 6)')[1] || '';
  if (!checkpointArea.includes('ci_integration_mode'))
    return 'Phase 6 checkpoint write no incluye campo ci_integration_mode';
  if (!checkpointArea.includes('"append"') && !checkpointArea.includes("'append'") && !checkpointArea.includes('append'))
    return 'Phase 6 no escribe ci_integration_mode: "append" cuando el developer elige APPEND';
  return true;
}));

// I181 — GEN18-F3: Brownfield announcement detecta proyecto ya gobernado (CLAUDE.md + constitución + config) y ofrece reconstrucción de checkpoint
results.push(check('I181', 'GEN18-F3: Brownfield announcement detecta governance completa sin checkpoint y ofrece reconstrucción', (content) => {
  const brownfieldArea = content.split('If `brownfield` detected')[1]?.split('Step 1.6 behavior')[0] || '';
  if (!brownfieldArea.includes('governance.config.yaml') || !brownfieldArea.includes('constitution'))
    return 'Brownfield detection no verifica la presencia de governance.config.yaml + constitución como señal de proyecto ya gobernado';
  if (!brownfieldArea.includes('reconstruct') && !brownfieldArea.includes('Reconstruct'))
    return 'Brownfield announcement no ofrece reconstrucción del checkpoint (opción A)';
  if (!brownfieldArea.includes('last_completed') && !brownfieldArea.includes('Phase7'))
    return 'Reconstrucción de checkpoint no establece last_completed: Phase7';
  return true;
}));

// -----------------------------------------------------------------------
// Gen18 — F4: Backtrack Protocol (I182–I184)
// -----------------------------------------------------------------------

// I182 — GEN18-F4: genesis-governance.md tiene sección ## Backtrack Protocol
results.push(check('I182', 'GEN18-F4: genesis-governance.md tiene sección Backtrack Protocol', (content) => {
  if (!content.includes('## Backtrack Protocol'))
    return 'No existe sección ## Backtrack Protocol en genesis-governance.md';
  if (!content.includes('Sub-caso A') && !content.includes('Sub-caso B'))
    return 'Backtrack Protocol no define sub-casos A (intake) y B (fases)';
  return true;
}));

// I183 — GEN18-F4: Backtrack Protocol referencia el cross-reference index para propagación downstream
results.push(check('I183', 'GEN18-F4: Backtrack Protocol usa cross-reference index para campos downstream', (content) => {
  const backtrackArea = content.split('## Backtrack Protocol')[1]?.split('## Error Handling')[0] || '';
  if (!backtrackArea.includes('cross-reference'))
    return 'Backtrack Protocol no referencia el cross-reference index para determinar campos downstream afectados';
  if (!backtrackArea.includes('L1') || !backtrackArea.includes('L2') || !backtrackArea.includes('L3'))
    return 'Backtrack Protocol no especifica las dependencias downstream por layer (L1→L2, L2→L3, etc.)';
  return true;
}));

// I184 — GEN18-F4: Backtrack Protocol tiene manejo diferenciado intake vs fases (con lista de docs afectados en Sub-caso B)
results.push(check('I184', 'GEN18-F4: Backtrack Protocol diferencia intake (A) de fases (B) con lista de documentos afectados', (content) => {
  const backtrackArea = content.split('## Backtrack Protocol')[1]?.split('## Error Handling')[0] || '';
  // Sub-caso A must mention no documents written yet (low cost)
  if (!backtrackArea.includes('ningún documento') && !backtrackArea.includes('ningún doc') && !backtrackArea.includes('no documents') && !backtrackArea.includes('ningún') && !backtrackArea.includes('Costo bajo'))
    return 'Sub-caso A no indica que no hay documentos escritos (costo bajo)';
  // Sub-caso B must mention document list and A/B choice for developer
  if (!backtrackArea.includes('documentos ya escritos') && !backtrackArea.includes('documentos ya generados') && !backtrackArea.includes('documentos generados'))
    return 'Sub-caso B no menciona la lista de documentos ya escritos afectados';
  if ((!backtrackArea.includes('A)') || !backtrackArea.includes('B)')) && (!backtrackArea.includes('opción A') || !backtrackArea.includes('opción B')))
    return 'Sub-caso B no ofrece elección A/B al developer (editar directamente vs regenerar)';
  return true;
}));

// -----------------------------------------------------------------------
// Gen18 — F5: Navigation footer (I185–I187)
// -----------------------------------------------------------------------

// I185 — GEN18-F5: Backtrack Protocol define navigation footer para todo gate de confirmación
results.push(check('I185', 'GEN18-F5: Backtrack Protocol tiene Navigation footer como regla transversal', (content) => {
  const backtrackArea = content.split('## Backtrack Protocol')[1]?.split('## Error Handling')[0] || '';
  if (!backtrackArea.includes('Navigation footer') && !backtrackArea.includes('navigation footer'))
    return 'Backtrack Protocol no define Navigation footer como regla transversal';
  if (!backtrackArea.includes('ok') || (!backtrackArea.includes('back') && !backtrackArea.includes('atrás') && !backtrackArea.includes('volver')))
    return 'Navigation footer no define las opciones "ok" y "atrás/volver"';
  return true;
}));

// I186 — GEN18-F5: Navigation footer restringe salto hacia adelante solo al punto de origen del backtrack
results.push(check('I186', 'GEN18-F5: Navigation footer limita salto forward al backtrack_origin (no más allá)', (content) => {
  const backtrackArea = content.split('## Backtrack Protocol')[1]?.split('## Error Handling')[0] || '';
  if (!backtrackArea.includes('backtrack_origin') && !backtrackArea.includes('punto de origen'))
    return 'Navigation footer no define la restricción de salto al backtrack_origin';
  if (!backtrackArea.includes('nunca') && !backtrackArea.includes('Nunca') && !backtrackArea.includes('NO puede') && !backtrackArea.includes('no puede') && !backtrackArea.includes('CANNOT') && !backtrackArea.includes('cannot') && !backtrackArea.includes('Never'))
    return 'Navigation footer no prohíbe saltar más allá del punto de origen';
  return true;
}));

// I187 — GEN18-F5: backtrack_origin se persiste en checkpoint para recovery
results.push(check('I187', 'GEN18-F5: backtrack_origin se escribe en checkpoint para recovery mid-backtrack', (content) => {
  const backtrackArea = content.split('## Backtrack Protocol')[1]?.split('## Error Handling')[0] || '';
  if (!backtrackArea.includes('backtrack_origin'))
    return 'backtrack_origin no está definido en el Backtrack Protocol';
  if (!backtrackArea.includes('checkpoint') || (!backtrackArea.includes('recovery') && !backtrackArea.includes('Recovery')))
    return 'backtrack_origin no se persiste en checkpoint para recovery';
  return true;
}));

// -----------------------------------------------------------------------
// Gen18 — F6: Language policy (I188–I190)
// -----------------------------------------------------------------------

// I188 — GEN18-F6: Language detection block presente y default English
results.push(check('I188', 'GEN18-F6: Language detection block presente con default English y silent para inglés', (content) => {
  const langArea = content.split('Language detection')[1]?.split('U9')[0] || '';
  if (!langArea.includes('preferred_language'))
    return 'Language detection no establece preferred_language en checkpoint';
  if (!langArea.includes('"en"') && !langArea.includes("'en'"))
    return 'Language detection no establece default "en" para inglés';
  if (!langArea.includes('silently') && !langArea.includes('silent') && !langArea.includes('without asking'))
    return 'Language detection no indica que el default es silencioso (sin preguntar)';
  return true;
}));

// I189 — GEN18-F6: Language rule cross-cutting presente con NEVER translate list
results.push(check('I189', 'GEN18-F6: Language rule cross-cutting presente con lista NEVER translate', (content) => {
  const ruleArea = content.split('Language rule')[1]?.split('U9')[0] || '';
  if (!ruleArea.includes('preferred_language'))
    return 'Language rule no referencia preferred_language del checkpoint';
  if (!ruleArea.includes('NEVER translate') && !ruleArea.includes('Never translate'))
    return 'Language rule no define lista NEVER translate';
  if (!ruleArea.includes('CLAUDE.md') || !ruleArea.includes('ci.yml'))
    return 'Language rule NEVER translate no incluye CLAUDE.md y ci.yml como labels técnicos';
  return true;
}));

// I190 — GEN18-F6: Phase 5 checkpoint schema incluye preferred_language
results.push(check('I190', 'GEN18-F6: Phase 5 checkpoint schema incluye preferred_language', (_content) => {
  const docs = readAllDocs();
  if (!docs.includes('preferred_language'))
    return 'preferred_language no está en el schema del checkpoint (buscar en Phase 5)';
  return true;
}));

// -----------------------------------------------------------------------
// Gen18 — F7: Context help (I191–I193)
// -----------------------------------------------------------------------

// I191 — GEN18-F7: Navigation footer tiene lookup table de one-liners por posición
results.push(check('I191', 'GEN18-F7: Navigation footer tiene lookup table de one-liners (L1–L5, Phase 2–7)', (content) => {
  const footerArea = content.split('Navigation footer')[1]?.split('## Error Handling')[0] || '';
  if (!footerArea.includes('One-liner') && !footerArea.includes('one-liner') && !footerArea.includes('one liner'))
    return 'Navigation footer no tiene lookup table de one-liners por posición';
  if (!footerArea.includes('L1') || !footerArea.includes('L5') || !footerArea.includes('Phase 7'))
    return 'Lookup table de one-liners no cubre L1–L5 y Phase 2–7';
  return true;
}));

// I192 — GEN18-F7: Error Handling tiene Handler 10 para comandos ? / help / manual / overview
results.push(check('I192', 'GEN18-F7: Handler 10 define respuestas para ?, help, manual, overview', (content) => {
  const errorArea = content.split('## Error Handling')[1]?.split('## Prerequisites')[0] || '';
  if (!errorArea.includes('Handler 10') && !errorArea.includes('handler 10'))
    return 'No existe Handler 10 en Error Handling';
  if (!errorArea.includes('overview'))
    return 'Handler 10 no define respuesta para "overview"';
  if (!errorArea.includes('manual'))
    return 'Handler 10 no define respuesta para "manual"';
  return true;
}));

// I193 — GEN18-F7: Handler 10 overview muestra mapa completo L1-L5 + Phase 2-7
results.push(check('I193', 'GEN18-F7: Handler 10 overview format muestra flujo completo con posición actual marcada', (content) => {
  const errorArea = content.split('## Error Handling')[1]?.split('## Prerequisites')[0] || '';
  const handler10Area = errorArea.split('Handler 10')[1]?.split('Handler 11')[0] || errorArea.split('Handler 10')[1] || '';
  if (!handler10Area.includes('L1') || !handler10Area.includes('Phase 7'))
    return 'Handler 10 overview no muestra flujo completo L1–Phase7';
  if (!handler10Area.includes('▶') && !handler10Area.includes('[current]') && !handler10Area.includes('current'))
    return 'Handler 10 overview no marca la posición actual';
  return true;
}));

// -----------------------------------------------------------------------
// Gen19 — Interaction Clarity (I194–I203)
// -----------------------------------------------------------------------

// I194 — GEN19-F1: Navigation footer tiene cost annotation para fases (Phase 2+)
results.push(check('I194', 'GEN19-F1: Navigation footer tiene cost annotation para back en Phase 2+', (content) => {
  const footerArea = content.split('Navigation footer')[1]?.split('## Error Handling')[0] || '';
  if (!footerArea.includes('documents may need updating'))
    return 'Navigation footer no tiene cost annotation "(documents may need updating)" para fases';
  return true;
}));

// I195 — GEN19-F1: Cost annotation solo aplica en fases (no en intake)
results.push(check('I195', 'GEN19-F1: Cost annotation explica que solo aplica en Phase 2+ (no en intake)', (content) => {
  const footerArea = content.split('Navigation footer')[1]?.split('## Error Handling')[0] || '';
  if (!footerArea.includes('Phase 2') || !footerArea.includes('intake'))
    return 'Cost annotation no especifica que aplica en Phase 2+ y no en intake';
  return true;
}));

// I196 — GEN19-F2: Sub-case B especifica comportamiento cuando corrección afecta la fase activa
results.push(check('I196', 'GEN19-F2: Sub-case B define regeneración del draft cuando corrección afecta fase activa', (content) => {
  // Check the backtrack section by finding the Sub-case B heading and scanning to Error Handling
  const subcaseBHeading = '### Sub-case B';
  const subcaseBArea = content.split(subcaseBHeading)[1]?.split('## Error Handling')[0] || '';
  if (!subcaseBArea.includes('active phase') && !subcaseBArea.includes('fase activa') && !subcaseBArea.includes('currently being drafted'))
    return 'Sub-case B no especifica qué pasa cuando la corrección afecta la fase activa (draft no aprobado)';
  if (!subcaseBArea.includes('Regenerat') && !subcaseBArea.includes('regenerat'))
    return 'Sub-case B no indica regenerar el draft cuando la corrección afecta la fase activa';
  return true;
}));

// I197 — GEN19-F3: Skill anuncia razón cuando full-mode triggers descartan el quick mode fork
results.push(check('I197', 'GEN19-F3: Quick mode fork anuncia razón cuando full-mode triggers están activos', (content) => {
  // Look for quick mode / full mode triggers section
  const quickArea = content.split('quick')[1]?.split('quick')[0] || content;
  if (!content.includes('quick mode is not available') && !content.includes('quick mode not available'))
    return 'Skill no anuncia razón cuando full-mode triggers descartan el quick mode fork';
  return true;
}));

// I198 — GEN19-F4: Gate L4 tiene criterio explícito con ejemplos pass/fail
results.push(check('I198', 'GEN19-F4: Gate L4 tiene acceptance criteria con ejemplos pass/fail y rejection template', (content) => {
  if (!content.includes('L4 Risk gate') && !content.includes('L4 risk gate'))
    return 'No existe bloque "L4 Risk gate — acceptance criteria"';
  const gateArea = content.split('L4 Risk gate')[1]?.split('Layer 5')[0] || content.split('L4 Risk gate')[1]?.split('L5')[0] || '';
  if (!gateArea.includes('Rejection response') && !gateArea.includes('rejection response'))
    return 'Gate L4 no tiene Rejection response template';
  return true;
}));

// I199 — GEN19-F5: Gate Phase 2 tiene criterio explícito con ejemplos pass/fail
results.push(checkAll('I199', 'GEN19-F5: Gate Phase 2 tiene acceptance criteria con ejemplos pass/fail y rejection template', (content) => {
  if (!content.includes('Phase 2 constitution gate') && !content.includes('constitution gate'))
    return 'No existe bloque "Phase 2 constitution gate — acceptance criteria"';
  const gateArea = content.split('constitution gate')[1]?.split('Phase 3')[0] || content.split('constitution gate')[1] || '';
  if (!gateArea.includes('Rejection response') && !gateArea.includes('rejection response'))
    return 'Gate Phase 2 no tiene Rejection response template';
  return true;
}));

// I200 — GEN19-F6: Phase 4 brownfield safeguard tiene instrucción para FRAMEWORK sections custom
results.push(checkAll('I200', 'GEN19-F6: Phase 4 brownfield safeguard cubre secciones FRAMEWORK con contenido custom', (content) => {
  if (!content.includes('FRAMEWORK section') && !content.includes('FRAMEWORK sections'))
    return 'Phase 4 brownfield safeguard no menciona secciones FRAMEWORK con contenido custom';
  if (!content.includes('more than 3 lines') && !content.includes('significantly diverge'))
    return 'Phase 4 no define cuándo una sección FRAMEWORK tiene "contenido custom significativo"';
  return true;
}));

// I201 — GEN19-F7: Language detection especifica que detecta el primer mensaje del developer
results.push(check('I201', 'GEN19-F7: Language detection define "first message" como respuesta del developer post-invocación', (content) => {
  const langArea = content.split('Language detection')[1]?.split('U9')[0] || '';
  if (!langArea.includes('first response') && !langArea.includes('first message') && !langArea.includes('first'))
    return 'Language detection no define qué es el "first message" a detectar';
  if (!langArea.includes('invok') && !langArea.includes('invoc'))
    return 'Language detection no diferencia entre mensaje de invocación y primera respuesta del developer';
  return true;
}));

// I202 — GEN19-F8: L3 caps tienen nota explicando diferencia 7 general vs 5 MVP
results.push(check('I202', 'GEN19-F8: L3 caps tienen nota explicando diferencia entre cap general (7) y cap MVP (5)', (content) => {
  if (!content.includes('Why different caps') && !content.includes('different cap'))
    return 'L3 no tiene nota explicando la diferencia entre cap general y cap MVP';
  if (!content.includes('MVP') || (!content.includes('7') && !content.includes('five')))
    return 'Nota de caps no menciona MVP ni los valores 7/5';
  return true;
}));

// I203 — GEN19-F9: Phase 7 verifica git tag o documenta LOW finding
results.push(checkAll('I203', 'GEN19-F9: Phase 7 verifica existencia del git tag post-audit o documenta LOW finding', (content) => {
  // git tag instruction is in phase7
  if (!content.includes('git tag | grep') && !content.includes('tag verification') && !content.includes('Tag verification'))
    return 'Phase 7 no verifica la existencia del git tag después de instruirlo';
  return true;
}));

// -----------------------------------------------------------------------
// Gen20 — Edge Case Resolution (I204–I206)
// -----------------------------------------------------------------------

// I204 — GEN20-F1: Handler 10 especifica ruta del user manual y Read antes de responder
results.push(check('I204', 'GEN20-F1: Handler 10 manual especifica ruta canónica del user manual y Read instruction', (content) => {
  const handler10Area = content.split('Handler 10')[1]?.split('Handler 11')[0] || content.split('Handler 10')[1] || '';
  if (!handler10Area.includes('runbook.genesis-governance.user-manual'))
    return 'Handler 10 no especifica la ruta canónica del user manual';
  if (!handler10Area.includes('Read:') && !handler10Area.includes('Read '))
    return 'Handler 10 no incluye instrucción de cargar el archivo antes de responder';
  return true;
}));

// I205 — GEN20-F2: Backtrack Protocol especifica que backtrack_origin en checkpoint no activa forward skip en reentry
results.push(check('I205', 'GEN20-F2: Backtrack Protocol define que backtrack_origin en reentry no activa forward skip', (content) => {
  const backtrackArea = content.split('## Backtrack Protocol')[1]?.split('## Error Handling')[0] || '';
  if (!backtrackArea.includes('reentry') && !backtrackArea.includes('G2-T4'))
    return 'Backtrack Protocol no tiene instrucción para backtrack_origin en reentry';
  if (!backtrackArea.includes('forward skip') && !backtrackArea.includes('skip option'))
    return 'Instrucción de reentry no menciona la restricción de forward skip';
  return true;
}));

// I206 — GEN20-F3: Phase 4 brownfield FRAMEWORK usa criterio objetivo (líneas con ≥10 palabras)
results.push(checkAll('I206', 'GEN20-F3: Phase 4 brownfield FRAMEWORK detection usa criterio objetivo de líneas con contenido', (content) => {
  if (!content.includes('≥10 words') && !content.includes('10 words') && !content.includes('ten words'))
    return 'Phase 4 FRAMEWORK detection no usa criterio objetivo de líneas con ≥10 palabras';
  if (!content.includes('≥5') && !content.includes('5 such lines') && !content.includes('five'))
    return 'Phase 4 FRAMEWORK detection no especifica el umbral de 5 líneas de contenido';
  return true;
}));

// ─── Gen21 ───────────────────────────────────────────────────────────────────

// I207 — GEN21-F1: phase7.md tiene referencia a Handler 9 (Backtrack Protocol)
results.push(checkAll('I207', 'GEN21-F1: phase7.md tiene Handler 9 referenciando Backtrack Protocol', (content) => {
  const phase7 = existsSync(PHASE_PATHS[5]) ? readFileSync(PHASE_PATHS[5], 'utf-8') : '';
  if (!phase7.includes('Handler 9')) return 'phase7.md must have Handler 9';
  if (!phase7.includes('Backtrack Protocol')) return 'phase7.md Handler 9 must reference Backtrack Protocol';
  return true;
}));

// I208 — GEN21-F2: Handler 10 manual tiene fallback con indicación de dónde encontrar el manual
results.push(check('I208', 'GEN21-F2: Handler 10 manual tiene fallback con referencia al genesis-governance repository', (content) => {
  // Find the manual row in the Handler 10 table specifically
  const manualRowMatch = content.match(/\|\s*`manual`\s*\|([^|]+)\|/);
  if (!manualRowMatch) return 'Handler 10 must have a `manual` row in the command table';
  const manualCell = manualRowMatch[1];
  if (!manualCell.includes('genesis-governance repository')) return 'Handler 10 `manual` row must reference genesis-governance repository as fallback';
  return true;
}));

// I209 — GEN21-F3: L1 tiene bloque Preconditions antes de Goal
results.push(check('I209', 'GEN21-F3: L1 tiene bloque Preconditions antes del Goal', (content) => {
  const l1PreconIdx = content.indexOf('Prerequisite check passed');
  const l1GoalIdx = content.indexOf('**Goal:** Understand the business, problem, model');
  if (l1PreconIdx === -1) return 'L1 must have Preconditions block with "Prerequisite check passed"';
  if (l1GoalIdx === -1) return 'L1 Goal not found';
  if (l1PreconIdx > l1GoalIdx) return 'L1 Preconditions must appear before Goal';
  return true;
}));

// I210 — GEN21-F3: L2 tiene bloque Preconditions
results.push(check('I210', 'GEN21-F3: L2 tiene bloque Preconditions', (content) => {
  if (!content.includes('L1 confirmed output present')) return 'L2 must have Preconditions with "L1 confirmed output present"';
  if (!content.includes('Checkpoint written with')) return 'L2 must have Preconditions with "Checkpoint written with"';
  return true;
}));

// I211 — GEN21-F3: L3 tiene bloque Preconditions
results.push(check('I211', 'GEN21-F3: L3 tiene bloque Preconditions', (content) => {
  if (!content.includes('L2 confirmed output present')) return 'L3 must have Preconditions with "L2 confirmed output present"';
  if (!content.includes('L2 closure summary confirmed')) return 'L3 must have Preconditions with "L2 closure summary confirmed"';
  return true;
}));

// I212 — GEN21-F3: L4 tiene bloque Preconditions
results.push(check('I212', 'GEN21-F3: L4 tiene bloque Preconditions', (content) => {
  if (!content.includes('L3 confirmed output present')) return 'L4 must have Preconditions with "L3 confirmed output present"';
  if (!content.includes('L3 closure gate confirmed')) return 'L4 must have Preconditions with "L3 closure gate confirmed"';
  return true;
}));

// I213 — GEN21-F3: L5 tiene bloque Preconditions
results.push(check('I213', 'GEN21-F3: L5 tiene bloque Preconditions', (content) => {
  if (!content.includes('L4 confirmed output present')) return 'L5 must have Preconditions with "L4 confirmed output present"';
  if (!content.includes('L4 risk gate passed')) return 'L5 must have Preconditions with "L4 risk gate passed"';
  return true;
}));

// I214 — GEN21-F4: L3 tiene closure summary G26b con gate explícito
results.push(check('I214', 'GEN21-F4: L3 tiene closure summary G26b con gate explícito', (content) => {
  if (!content.includes('G26b')) return 'L3 must have G26b closure summary';
  if (!content.includes('Wait for the developer to say')) return 'L3 G26b must have explicit gate that waits for developer confirmation';
  return true;
}));

// I215 — GEN21-F5: G2-T4 tiene instrucción para quick_mode en Phase3→4 (Gen24: texto actualizado)
results.push(check('I215', 'GEN21-F5: G2-T4 tiene instrucción para quick_mode override en Phase3→4', (content) => {
  // Gen24 changed the text: now explicitly handles the "impossible state" case
  // Anchor on the actual G2-T4 section header to avoid collision with Handler 11
  const g2t4Idx = content.indexOf('G2-T4 — Reentry detection');
  const g2t4Section = g2t4Idx !== -1 ? content.slice(g2t4Idx, g2t4Idx + 3000) : '';
  const phase3Section = g2t4Section.split('"Phase3"')[1]?.split('"Phase2"')[0] || '';
  if (!phase3Section.includes('quick_mode')) return 'quick_mode check must be in the last_completed: "Phase3" resume section (within G2-T4 — Reentry detection)';
  // Must have either the old text OR the Gen24 disambiguation message
  const hasOldText = content.includes('replacing the minimal version from quick mode');
  const hasNewText = content.includes('quick_mode active') && content.includes('restart from Layer 1');
  if (!hasOldText && !hasNewText) return 'G2-T4 must have quick_mode override/disambiguation instruction for Phase3→4';
  return true;
}));

// I216 — GEN21-M1: Todos los phase files tienen NAVIGATION FOOTER REMINDER
results.push({
  id: 'I216',
  description: 'GEN21-M1: Todos los phase files (phase2–7) tienen NAVIGATION FOOTER REMINDER con cost annotation',
  ...(() => {
    for (const p of PHASE_PATHS) {
      const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
      if (!content.includes('NAVIGATION FOOTER REMINDER')) {
        return { pass: false, detail: `${p} must have NAVIGATION FOOTER REMINDER` };
      }
      if (!content.includes('documents may need updating')) {
        return { pass: false, detail: `${p} NAVIGATION FOOTER REMINDER must include cost annotation "(documents may need updating)"` };
      }
    }
    return { pass: true };
  })(),
});

// I217 — GEN21-F6: phase7.md Handler 5 está en inglés
results.push(checkAll('I217', 'GEN21-F6: phase7.md Handler 5 está en inglés (sin texto en español hardcodeado)', (content) => {
  const phase7 = existsSync(PHASE_PATHS[5]) ? readFileSync(PHASE_PATHS[5], 'utf-8') : '';
  if (phase7.includes('Saltear')) return 'phase7.md Handler 5 must not contain Spanish hardcoded text ("Saltear")';
  if (!phase7.includes('Skipping a phase')) return 'phase7.md Handler 5 must be in English ("Skipping a phase")';
  return true;
}));

// I218 — GEN21-F7: G2-T4 referencia schema v1.2 con campos preferred_language y genesis_skill_generation
results.push(check('I218', 'GEN21-F7: G2-T4 referencia schema v1.2 con campos preferred_language y genesis_skill_generation co-ubicados', (content) => {
  // All three must appear in the G2-T4 section specifically (use bold header to skip earlier references)
  const g2t4Block = content.split('**G2-T4')[1] || '';
  if (!g2t4Block.includes('v1.2')) return 'G2-T4 section must reference schema v1.2';
  if (!g2t4Block.includes('preferred_language')) return 'G2-T4 schema block must include preferred_language field';
  if (!g2t4Block.includes('genesis_skill_generation')) return 'G2-T4 schema block must include genesis_skill_generation field';
  return true;
}));

// I219 — GEN21-F8: phase2.md tiene BROWNFIELD CHECK header al inicio
results.push({
  id: 'I219',
  description: 'GEN21-F8: phase2.md tiene BROWNFIELD CHECK header cerca del inicio',
  ...(() => {
    const p = PHASE_PATHS[0];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    if (!content.slice(0, 600).includes('BROWNFIELD CHECK')) {
      return { pass: false, detail: 'phase2.md must have BROWNFIELD CHECK header in the first 600 chars' };
    }
    return { pass: true };
  })(),
});

// I220 — GEN21-M2: Backtrack Protocol tiene las 3 reglas simplificadas
results.push(check('I220', 'GEN21-M2: Backtrack Protocol tiene las 3 reglas simplificadas con cláusula session-only', (content) => {
  if (!content.includes('Rule 1 — SET')) return 'Backtrack Protocol must have Rule 1 — SET';
  if (!content.includes('Rule 2 — SHOW SKIP')) return 'Backtrack Protocol must have Rule 2 — SHOW SKIP';
  if (!content.includes('Rule 3 — CLEAR')) return 'Backtrack Protocol must have Rule 3 — CLEAR';
  if (!content.includes('Do NOT clear in checkpoint file')) return 'Backtrack Protocol must specify "Do NOT clear in checkpoint file — only in session state"';
  return true;
}));

// ─── Gen22 ───────────────────────────────────────────────────────────────────

// I221 — GA21-1: Backtrack Rules usan notación generalizada (cubre fases + layers)
results.push(check('I221', 'GA21-1: Backtrack Rules usan notación generalizada "origin O" que cubre layers y fases', (content) => {
  if (!content.includes('backtrack from origin O')) return 'Backtrack Rule 1 must use generalized "origin O" notation';
  if (!content.includes('During intake (L1-L5): O = "L[z]"')) return 'Backtrack Rule 1 must specify L[z] notation for intake context';
  if (!content.includes('During phases: O = "Phase[N]"')) return 'Backtrack Rule 1 must specify Phase[N] notation for phases context (Sub-case B)';
  return true;
}));

// I222 — GA21-2: L3 acceptance criteria tiene nota de relación con G26b
results.push(check('I222', 'GA21-2: L3 acceptance criteria tiene nota que conecta con G26b como gate externo', (content) => {
  if (!content.includes('internal model checks — not shown to the developer')) return 'L3 acceptance criteria must note they are internal model checks';
  if (!content.includes('G26b (below) is the developer-visible confirmation gate')) return 'L3 must note that G26b is the developer-visible gate';
  return true;
}));

// I223 — GA21-3: L1 Preconditions tiene nota de verificación vs ejecución
results.push(check('I223', 'GA21-3: L1 Preconditions tiene nota de que son verificación, no instrucciones de ejecución', (content) => {
  if (!content.includes('verify as already completed — not instructions to re-execute now')) return 'L1 Preconditions must note they are verification, not execution instructions';
  return true;
}));

// I224 — GA21-4: NAVIGATION FOOTER REMINDER incluye forward skip condicional en todos los phase files
results.push({
  id: 'I224',
  description: 'GA21-4: NAVIGATION FOOTER REMINDER incluye forward skip condicional en todos los phase files',
  ...(() => {
    for (const p of PHASE_PATHS) {
      const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
      if (!content.includes('backtrack_origin') || !content.includes('skip → [origin]')) {
        return { pass: false, detail: `${p} NAVIGATION FOOTER REMINDER must include forward skip conditional` };
      }
    }
    return { pass: true };
  })(),
});

// ─── Gen23 ───────────────────────────────────────────────────────────────────

// I225 — A1: Handler 7 no tiene "Veo que pegaste" como instrucción activa (no en comentario)
results.push(check('I225', 'Gen23-A1: Handler 7 no tiene mensaje en español como instrucción activa (sólo como ES example comment)', (content) => {
  // The Spanish text should NOT appear as an active instruction — only inside a <!-- ES example: ... --> comment
  // Check: Handler 7 section uses preferred_language instruction, not raw Spanish
  const handler7Block = content.split('Handler 7')[1]?.split('Handler 8')[0] || '';
  if (!handler7Block.includes('preferred_language')) return 'Handler 7 must reference preferred_language for the response message';
  // The active instruction line (non-comment) should NOT start with the Spanish text
  const activeLines = handler7Block.split('\n').filter(l => !l.trim().startsWith('<!--') && !l.trim().startsWith('>') && l.includes('Veo que pegaste'));
  if (activeLines.length > 0) return 'Handler 7 must not have Spanish as active instruction line ("Veo que pegaste")';
  return true;
}));

// I226 — A2: Handler 8 no tiene "No encontré" como instrucción activa (no en comentario)
results.push(check('I226', 'Gen23-A2: Handler 8 no tiene mensaje en español como instrucción activa', (content) => {
  const handler8Block = content.split('Handler 8')[1]?.split('Handler 9')[0] || '';
  // Check the active instruction (non-comment) does not start with Spanish
  const activeLines = handler8Block.split('\n').filter(l => !l.trim().startsWith('<!--') && l.includes('No encontré `docs/intake/genesis-checkpoint.json`'));
  if (activeLines.length > 0) return 'Handler 8 must not have Spanish as active instruction ("No encontré")';
  return true;
}));

// I227 — A3: Emergency exit no tiene español hardcodeado como instrucción activa
results.push(check('I227', 'Gen23-A3: Emergency exit no tiene mensaje en español como instrucción activa', (content) => {
  if (!content.includes('Too many business aspects are undefined')) return 'Emergency exit must have English reference message';
  // Check that the emergency exit active instruction is NOT the Spanish text (it should be the English one or preferred_language)
  // Skip lines that are HTML comments (<!-- ... -->) or blockquote comment lines (> <!-- ... -->)
  const emergencyBlock = content.split('Emergency exit (hard gate)')[1]?.split('---')[0] || '';
  const activeLines = emergencyBlock.split('\n').filter(l => {
    const trimmed = l.trim();
    if (trimmed.startsWith('<!--')) return false; // plain HTML comment
    if (trimmed.startsWith('> <!--') || trimmed.startsWith('><!--')) return false; // blockquote comment
    return l.includes('Hay demasiados aspectos del negocio sin definir');
  });
  if (activeLines.length > 0) return 'Emergency exit must not have Spanish as active instruction ("Hay demasiados aspectos")';
  return true;
}));

// I228 — A4: U8B synthesis options no tienen español hardcodeado
results.push(check('I228', 'Gen23-A4: U8B synthesis options no tienen español hardcodeado en los labels A/B/C', (content) => {
  // The Spanish labels should not appear literally as the option text
  if (content.includes('A) ✅ Sí — usar esta síntesis')) return 'U8B synthesis options must not have Spanish hardcoded option A';
  if (content.includes('B) ✏️  Quiero corregir algo')) return 'U8B synthesis options must not have Spanish hardcoded option B';
  return true;
}));

// I229 — B1: Phase7 tiene phase_in_progress write al inicio
results.push({
  id: 'I229',
  description: 'Gen23-B1: phase7.md tiene phase_in_progress: "Phase7" write al inicio',
  ...(() => {
    const p = PHASE_PATHS[5];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    if (!content.includes('phase_in_progress') || !content.includes('"Phase7"')) {
      return { pass: false, detail: 'phase7.md must have phase_in_progress: "Phase7" write instruction' };
    }
    return { pass: true };
  })(),
});

// I230 — B2: Phase7 tiene Recovery check
results.push({
  id: 'I230',
  description: 'Gen23-B2: phase7.md tiene Recovery check para reentry mid-Phase7',
  ...(() => {
    const p = PHASE_PATHS[5];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    if (!content.includes('Recovery check') || !content.includes('governance-audit')) {
      return { pass: false, detail: 'phase7.md must have Recovery check that looks for governance-audit file' };
    }
    return { pass: true };
  })(),
});

// I231 — B3: Phase7 Step 6 no tiene duplicado (Step 6a y Step 6b en vez de dos "Step 6")
results.push({
  id: 'I231',
  description: 'Gen23-B3: phase7.md tiene Step 6a y Step 6b (sin Step 6 duplicado)',
  ...(() => {
    const p = PHASE_PATHS[5];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    const step6aCount = (content.match(/Step 6a/g) || []).length;
    const step6bCount = (content.match(/Step 6b/g) || []).length;
    const step6ContCount = (content.match(/Step 6 \(continued\)/g) || []).length;
    if (step6ContCount > 0) return { pass: false, detail: 'phase7.md must not have "Step 6 (continued)" — rename to Step 6b' };
    if (step6aCount === 0 || step6bCount === 0) return { pass: false, detail: 'phase7.md must have Step 6a and Step 6b' };
    return { pass: true };
  })(),
});

// I232 — B4: Phase7 Glossary+CODEOWNERS deben generarse antes del checkpoint write (Gen24: STOP block)
results.push({
  id: 'I232',
  description: 'Gen23-B4: phase7.md instruye generar Glossary+CODEOWNERS antes del checkpoint write',
  ...(() => {
    const p = PHASE_PATHS[5];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    const checkpointIdx = content.indexOf('Checkpoint write (Phase 7)');
    if (checkpointIdx === -1) return { pass: false, detail: 'phase7.md must have Checkpoint write (Phase 7)' };
    // Gen24: instruction is a STOP block before checkpoint write, or a [Generate before checkpoint write] note
    const hasStopBlock = content.includes('STOP') && content.includes('before writing checkpoint');
    const hasOldNote = content.includes('Generate before checkpoint write');
    if (!hasStopBlock && !hasOldNote) return { pass: false, detail: 'phase7.md must instruct generating Glossary+CODEOWNERS before checkpoint write (STOP block or note)' };
    // Verify the STOP block or note appears BEFORE the checkpoint write
    const stopIdx = content.indexOf('STOP');
    const noteIdx = content.indexOf('Generate before checkpoint write');
    const instrIdx = Math.min(...[stopIdx, noteIdx].filter(i => i !== -1));
    if (instrIdx > checkpointIdx) return { pass: false, detail: 'Glossary+CODEOWNERS instruction must appear BEFORE Checkpoint write section' };
    return { pass: true };
  })(),
});

// I233 — C1: Phase2 Pre-anuncio tiene números de sección correctos
results.push({
  id: 'I233',
  description: 'Gen23-C1: phase2.md Pre-anuncio tiene números de sección correctos (§10 para algorithmic/ai_outputs)',
  ...(() => {
    const p = PHASE_PATHS[0];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    // Old wrong: §8 for AI outputs
    if (content.includes('has_ai_outputs=true: §8')) return { pass: false, detail: 'phase2.md Pre-anuncio has wrong section number for ai_outputs (should be §10, not §8)' };
    return { pass: true };
  })(),
});

// I234 — C2: Phase2 acceptance criteria tiene números de sección correctos
results.push({
  id: 'I234',
  description: 'Gen23-C2: phase2.md acceptance criteria tiene números §8-§11 correctos',
  ...(() => {
    const p = PHASE_PATHS[0];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    if (content.includes('§7 if data-privacy')) return { pass: false, detail: 'phase2.md acceptance criteria has wrong section number (should be §8 for data-privacy, not §7)' };
    if (!content.includes('§8 if data-privacy')) return { pass: false, detail: 'phase2.md acceptance criteria must say §8 for data-privacy/regulatory' };
    return { pass: true };
  })(),
});

// I235 — C3: Phase3 recovery check verifica campo correcto del YAML
results.push({
  id: 'I235',
  description: 'Gen23-C3: phase3.md Recovery check no verifica campo "project:" inexistente en YAML generado',
  ...(() => {
    const p = PHASE_PATHS[1];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    const recoveryBlock = content.split('Recovery check')[1]?.split('Phase start')[0] || '';
    if (recoveryBlock.includes('`project:`') && !recoveryBlock.includes('`actors:`')) {
      return { pass: false, detail: 'phase3.md Recovery check must verify "actors:" not "project:" (project: may not exist in generated YAML)' };
    }
    return { pass: true };
  })(),
});

// I236 — F5/F8: Phase2 y Phase3 checkpoint write incluyen phase_in_progress: null
results.push({
  id: 'I236',
  description: 'Gen23-F5/F8: phase2.md y phase3.md checkpoint write incluyen phase_in_progress: null',
  ...(() => {
    for (const p of [PHASE_PATHS[0], PHASE_PATHS[1]]) {
      const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
      const cpBlock = content.split('Checkpoint write')[1] || '';
      const firstLine = cpBlock.split('\n').slice(0, 3).join('\n');
      if (!firstLine.includes('phase_in_progress')) {
        return { pass: false, detail: `${p} checkpoint write must include phase_in_progress: null` };
      }
    }
    return { pass: true };
  })(),
});

// I237 — D2: Phase4 recovery check tiene discriminador CLAUDE.md mínimo vs completo
results.push({
  id: 'I237',
  description: 'Gen23-D2: phase4.md Recovery check discrimina CLAUDE.md mínimo vs completo vía banner',
  ...(() => {
    const p = PHASE_PATHS[2];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    if (!content.includes('inicio rápido') && !content.includes('inicio rapido') && !content.includes('minimal version')) {
      return { pass: false, detail: 'phase4.md Recovery check must discriminate minimal vs complete CLAUDE.md using the quick-start banner' };
    }
    return { pass: true };
  })(),
});

// I238 — D3: Phase6 recovery check verifica constitution-checks no hard_constraints
results.push({
  id: 'I238',
  description: 'Gen23-D3: phase6.md Recovery check no verifica "hard_constraints" (string que no aparece en YAML generado)',
  ...(() => {
    const p = PHASE_PATHS[4];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    const recoveryBlock = content.split('Recovery check')[1]?.split('Phase start')[0] || '';
    if (recoveryBlock.includes('referenciando `hard_constraints`')) {
      return { pass: false, detail: 'phase6.md Recovery check must not verify "hard_constraints" — use "constitution-checks" or "validate-doc-registry" instead' };
    }
    return { pass: true };
  })(),
});

// I239 — F13: Phase5 genesis_skill_generation no es "Gen14"
results.push({
  id: 'I239',
  description: 'Gen23-F13: phase5.md genesis_skill_generation no es "Gen14" (valor obsoleto)',
  ...(() => {
    const p = PHASE_PATHS[3];
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '';
    if (content.includes('"genesis_skill_generation": "Gen14"')) {
      return { pass: false, detail: 'phase5.md genesis_skill_generation must not be "Gen14" — update to current generation' };
    }
    return { pass: true };
  })(),
});

// I240 — E1: Sub-case B tiene precedence rule para Special case
results.push(check('I240', 'Gen23-E1: Sub-case B tiene Precedence rule para Special case', (content) => {
  if (!content.includes('Precedence rule')) return 'Sub-case B must have Precedence rule clarifying Special case takes priority over "Do NOT interrupt"';
  return true;
}));

// I241 — A3: Emergency exit tiene instrucción en inglés (not hardcoded Spanish)
results.push(check('I241', 'Gen23-A3b: Emergency exit tiene mensaje en inglés como referencia', (content) => {
  if (!content.includes('Too many business aspects are undefined')) return 'Emergency exit must have English reference message for preferred_language translation';
  return true;
}));

// I242 — E2: Quick Mode gate dice "full generated content as code blocks"
results.push(check('I242', 'Gen23-E2: Quick Mode gate instruye mostrar contenido completo como code blocks', (content) => {
  if (!content.includes('full generated content') && !content.includes('code blocks')) return 'Quick Mode gate must instruct to show full generated content as code blocks before writing';
  return true;
}));

// ==========================================
// Gen24 Tests — I243-I263
// ==========================================

// I243 — Gen24-1: genesis-governance.md tiene tabla de derivación de flags huérfanos
results.push(check('I243', 'Gen24-1: genesis-governance.md tiene derivación explícita de qa_rigor, security_risk, compliance_risk', (content) => {
  if (!content.includes('Derived flags')) return 'Must have "Derived flags" derivation block before L5 checkpoint write';
  if (!content.includes('qa_rigor')) return 'qa_rigor must be in derived flags table';
  if (!content.includes('security_risk')) return 'security_risk must be in derived flags table';
  if (!content.includes('compliance_risk')) return 'compliance_risk must be in derived flags table';
  return true;
}));

// I244 — Gen24-2: Brownfield announcement tiene instrucción de traducción a preferred_language
results.push(check('I244', 'Gen24-2: Brownfield announcement tiene instrucción explícita de traducir a preferred_language', (content) => {
  if (!content.includes('Translate the following announcement to') && !content.includes('translate') )
    return 'Brownfield announcement must have explicit translation instruction to preferred_language';
  return true;
}));

// I245 — Gen24-3: genesis_skill_generation "Gen24" en checkpoint write de L1 (no solo Phase5)
results.push(check('I245', 'Gen24-4: genesis_skill_generation "Gen24" está en el checkpoint write de L1', (content) => {
  // Find L1 checkpoint write section
  const l1cpIdx = content.indexOf('Checkpoint write (L1)');
  if (l1cpIdx === -1) return 'Must have "Checkpoint write (L1)" section';
  const l1cp = content.substring(l1cpIdx, l1cpIdx + 500);
  if (!l1cp.includes('Gen24') && !l1cp.includes('genesis_skill_generation')) return 'genesis_skill_generation must be set in L1 checkpoint write';
  return true;
}));

// I246 — Gen24-4: Quick Mode checkpoint write usa Gen24 (no Gen14)
results.push(check('I246', 'Gen24-4b: Quick Mode checkpoint write usa genesis_skill_generation Gen24', (content) => {
  const qmCpIdx = content.indexOf('Checkpoint write (Quick Mode)');
  if (qmCpIdx === -1) return 'Must have "Checkpoint write (Quick Mode)" section';
  const qmCp = content.substring(qmCpIdx, qmCpIdx + 300);
  if (qmCp.includes('Gen14')) return 'Quick Mode checkpoint must NOT use "Gen14" — should be Gen24';
  if (!qmCp.includes('Gen24')) return 'Quick Mode checkpoint must include genesis_skill_generation Gen24';
  return true;
}));

// I247 — Gen24-5: NAVIGATION FOOTER REMINDER y BROWNFIELD CHECK marcados INTERNAL en content rules
results.push(check('I247', 'Gen24-5: NAVIGATION FOOTER REMINDER y BROWNFIELD CHECK marcados como INTERNAL en reglas de contenido', (content) => {
  if (!content.includes('NAVIGATION FOOTER REMINDER') || !content.includes('[INTERNAL]'))
    return 'Content rules must mark NAVIGATION FOOTER REMINDER as INTERNAL';
  return true;
}));

// I248 — Gen24-6: synthesis_accepted se escribe en checkpoint tras opción A de U8B
results.push(check('I248', 'Gen24-6: synthesis_accepted se escribe en checkpoint tras opción A de U8B', (content) => {
  const u8bIdx = content.indexOf('U8B');
  if (u8bIdx === -1) return 'U8B section not found';
  // synthesis_accepted may be in the checkpoint write section following U8B — use wider window
  const u8bArea = content.substring(u8bIdx, u8bIdx + 3000);
  if (!u8bArea.includes('synthesis_accepted')) return 'synthesis_accepted must be set in U8B option A handler or L1 checkpoint write';
  return true;
}));

// I249 — Gen24-7: Cross-reference index incluye artifacts operacionales de Phase 6
results.push(check('I249', 'Gen24-7: Cross-reference index incluye artifacts operacionales de Phase 6 (post-mortem, runbook)', (content) => {
  if (!content.includes('post-mortem') && !content.includes('on-call-runbook') && !content.includes('runbook'))
    return 'Cross-reference index must include Phase 6 operational templates (post-mortem, on-call runbook)';
  return true;
}));

// I250 — Gen24-8: Phase2 no tiene has_ai_outputs=true (enum incorrecto)
results.push(check('I250', 'Gen24-8: phase2.md no usa has_ai_outputs=true (incorrecto — es enum, no bool)', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  if (p2.includes('has_ai_outputs=true') || p2.includes('has_ai_outputs = true'))
    return 'phase2.md must NOT use has_ai_outputs=true — use enum check (!=none or in ["human-reviewed","autonomous"])';
  return true;
}));

// I251 — Gen24-9: L5→Phase2 resume instruye leer intake file
results.push(check('I251', 'Gen24-9: L5→Phase2 resume instruye leer el intake file antes de generar Phase 2', (content) => {
  const l5resumeIdx = content.indexOf('"L5"');
  if (l5resumeIdx === -1) return 'L5 resume section not found';
  const l5area = content.substring(l5resumeIdx, l5resumeIdx + 800);
  if (!l5area.includes('intake') && !l5area.includes('layers-1-5'))
    return 'L5 resume must instruct reading intake file before generating Phase 2 content';
  return true;
}));

// I252 — Gen24-P2-1: Phase2 gate questions tienen nota de traducción a preferred_language
results.push(check('I252', 'Gen24-P2-1: phase2.md gate questions tienen nota de traducción a preferred_language', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  if (!p2.includes('preferred_language') || !p2.includes('translate'))
    return 'phase2.md gate questions must have translation notes for preferred_language';
  return true;
}));

// I253 — Gen24-P2-3: Phase2 Recovery check verifica conditional artifacts (DPIA, threat model, model card)
results.push(check('I253', 'Gen24-P2-3: phase2.md Recovery check verifica conditional artifacts', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  const recoveryIdx = p2.indexOf('Recovery check');
  if (recoveryIdx === -1) return 'phase2.md must have Recovery check';
  const recoveryArea = p2.substring(recoveryIdx, recoveryIdx + 1500);
  if (!recoveryArea.includes('dpia') && !recoveryArea.includes('DPIA') && !recoveryArea.includes('threat-model'))
    return 'phase2.md Recovery check must verify conditional artifacts (DPIA, threat model)';
  return true;
}));

// I254 — Gen24-P3-2: Phase3 brownfield tiene opción de batch gate para 4+ cambios
results.push(check('I254', 'Gen24-P3-2: phase3.md brownfield path tiene opción de batch gate para 4+ cambios', (_content) => {
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  if (!p3.includes('4 or more') && !p3.includes('4+') && !p3.includes('consolidated'))
    return 'phase3.md brownfield must have batch gate option for 4+ changes';
  return true;
}));

// I255 — Gen24-P4-1: Phase4 tiene FRAMEWORK Standard Content Reference con contenido literal
results.push(check('I255', 'Gen24-P4-1: phase4.md tiene FRAMEWORK Standard Content Reference block con contenido literal', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  if (!p4.includes('Standard Content Reference') && !p4.includes('[FRAMEWORK] Standard'))
    return 'phase4.md must have FRAMEWORK Standard Content Reference block';
  if (!p4.includes('Git & Deploy') || !p4.includes('Task Management') || !p4.includes('Model Routing'))
    return 'FRAMEWORK Standard Content Reference must include Git & Deploy, Task Management, Model Routing sections';
  return true;
}));

// I256 — Gen24-P5-1: Phase5 tiene instrucción explícita de Read phase6 en sección SESSION 1 COMPLETE
results.push(check('I256', 'Gen24-P5-1: phase5.md transición SESSION 1 COMPLETE tiene instrucción explícita de Read phase6', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  if (!p5.includes('SESSION 1 COMPLETE')) return 'phase5.md must have SESSION 1 COMPLETE block';
  // The Read instruction appears at the end of SESSION 1 COMPLETE — search in full file after that marker
  const afterS1 = p5.substring(p5.indexOf('SESSION 1 COMPLETE'));
  if (!afterS1.includes('genesis-governance-phase6') && !afterS1.includes('phase6'))
    return 'SESSION 1 COMPLETE must have explicit Read instruction for genesis-governance-phase6.md';
  return true;
}));

// I257 — Gen24-P5-2: Phase5 Recovery check verifica scripts en disco
results.push(check('I257', 'Gen24-P5-2: phase5.md Recovery check verifica que scripts existen en disco', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  const recoveryIdx = p5.indexOf('Recovery check');
  if (recoveryIdx === -1) return 'phase5.md must have Recovery check';
  const recoveryArea = p5.substring(recoveryIdx, recoveryIdx + 1200);
  if (!recoveryArea.includes('validate-doc-registry') || !recoveryArea.includes('constitution-checks'))
    return 'phase5.md Recovery check must verify scripts exist on disk';
  return true;
}));

// I258 — Gen24-P6-1: Phase6 forbidden imports step tiene comando concreto
results.push(check('I258', 'Gen24-P6-1: phase6.md forbidden imports step tiene comando concreto (grep o similar)', (_content) => {
  const p6 = readFileSync(resolve('skills/genesis-governance/references/phase6.md'), 'utf-8');
  if (!p6.includes('forbidden') && !p6.includes('Forbidden'))
    return 'phase6.md must have forbidden imports step';
  if (!p6.includes('grep') && !p6.includes('eslint') && !p6.includes('bash'))
    return 'phase6.md forbidden imports must have a concrete command (grep, eslint, bash script)';
  return true;
}));

// I259 — Gen24-P6-2: Phase6 APPEND mode no agrega bloque on: adicional
results.push(check('I259', 'Gen24-P6-2: phase6.md APPEND mode tiene regla de no agregar bloque on: adicional', (_content) => {
  const p6 = readFileSync(resolve('skills/genesis-governance/references/phase6.md'), 'utf-8');
  if (!p6.includes("NEVER add a new `on:`") && !p6.includes('NEVER add a new on:') && !p6.includes("no agregar.*on:"))
    return 'phase6.md APPEND mode must prohibit adding a new on: block to ci.yml';
  return true;
}));

// I260 — Gen24-P7-1: Phase7 Glossary tiene reglas de calidad (criterios de selección, 8-12 términos)
results.push(check('I260', 'Gen24-P7-1: phase7.md Glossary tiene reglas de calidad y target de 8-12 términos', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  if (!p7.includes('8-12') && !p7.includes('8 to 12') && !p7.includes('8–12'))
    return 'phase7.md Glossary must specify target of 8-12 terms';
  if (!p7.includes('codebase') && !p7.includes('verbatim'))
    return 'phase7.md Glossary quality rules must mention term presence in codebase';
  return true;
}));

// I261 — Gen24-P7-2: Phase7 pregunta GitHub handles antes de generar CODEOWNERS
results.push(check('I261', 'Gen24-P7-2: phase7.md pregunta handles reales antes de generar CODEOWNERS', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  const coIdx = p7.indexOf('CODEOWNERS');
  if (coIdx === -1) return 'phase7.md must have CODEOWNERS section';
  const coArea = p7.substring(coIdx - 200, coIdx + 500);
  if (!coArea.includes('handles') && !coArea.includes('@') && !coArea.includes('GitHub'))
    return 'phase7.md must ask for real GitHub handles before generating CODEOWNERS';
  return true;
}));

// I262 — Gen24-P7-4: Phase7 tiene STOP block que instruye generar Glossary+CODEOWNERS ANTES del checkpoint write
results.push(check('I262', 'Gen24-P7-4: phase7.md tiene STOP block para generar Glossary+CODEOWNERS antes del checkpoint write', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  if (!p7.includes('STOP'))
    return 'phase7.md must have STOP block before checkpoint write for Glossary+CODEOWNERS generation';
  const stopIdx = p7.indexOf('STOP');
  const cpIdx = p7.indexOf('Checkpoint write (Phase 7)');
  if (cpIdx !== -1 && stopIdx > cpIdx)
    return 'STOP block must appear BEFORE Checkpoint write (Phase 7) section';
  return true;
}));

// I263 — Gen24-P3-1: Phase3 Recovery check verifica conditional artifacts (threat model, SLO/SLI)
results.push(check('I263', 'Gen24-P3-1: phase3.md Recovery check verifica conditional artifacts (threat model, SLO/SLI)', (_content) => {
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  const recoveryIdx = p3.indexOf('Recovery check');
  if (recoveryIdx === -1) return 'phase3.md must have Recovery check';
  const recoveryArea = p3.substring(recoveryIdx, recoveryIdx + 1200);
  if (!recoveryArea.includes('threat') && !recoveryArea.includes('SLO'))
    return 'phase3.md Recovery check must verify Phase 3 conditional artifacts (threat model, SLO/SLI)';
  return true;
}));

// ==========================================
// Gen25 Tests — I264-I277
// ==========================================

// I264 — Gen25-H1: phase3.md forbidden_imports NO depende de CLAUDE.md (usa boundary_rules/L5)
results.push(check('I264', 'Gen25-H1: phase3.md forbidden_imports derivado de L5/boundary_rules, no de CLAUDE.md', (_content) => {
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  const forbiddenIdx = p3.indexOf('forbidden_imports');
  if (forbiddenIdx === -1) return 'phase3.md must reference forbidden_imports in derivation';
  const area = p3.substring(forbiddenIdx - 50, forbiddenIdx + 400);
  if (area.includes('CLAUDE.md') && !area.includes('boundary_rules') && !area.includes('L5'))
    return 'forbidden_imports must NOT depend on CLAUDE.md — use boundary_rules or L5 structural flags';
  return true;
}));

// I265 — Gen25-H2: phase7.md Glossary+CODEOWNERS son pasos numerados (Step 6c/6d) o instrucciones explícitas
results.push(check('I265', 'Gen25-H2: phase7.md Glossary+CODEOWNERS son pasos explícitos en el flujo (no solo STOP)', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  const hasStep6c = p7.includes('Step 6c') || p7.includes('6c —') || p7.includes('6c:');
  const hasStep6d = p7.includes('Step 6d') || p7.includes('6d —') || p7.includes('6d:');
  // Alternative: STOP block before checkpoint OR numbered steps
  if (!hasStep6c && !hasStep6d && !p7.includes('STOP'))
    return 'phase7.md must have explicit steps (6c/6d) or STOP block for Glossary+CODEOWNERS generation';
  // Verify they appear before checkpoint write
  const cpIdx = p7.indexOf('Checkpoint write (Phase 7)');
  const glossaryIdx = p7.indexOf('Domain Glossary');
  if (cpIdx !== -1 && glossaryIdx !== -1 && glossaryIdx > cpIdx)
    return 'Glossary instruction must appear BEFORE Checkpoint write (Phase 7)';
  return true;
}));

// I266 — Gen25-H3: phase4.md brownfield FRAMEWORK diff gate antes de reemplazar secciones custom
results.push(check('I266', 'Gen25-H3: phase4.md brownfield tiene gate individual antes de reemplazar FRAMEWORK sections custom', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  if (!p4.includes('Gate before replacing') && !p4.includes('Replace with standard version') && !p4.includes('replace.*standard'))
    return 'phase4.md must have gate before replacing custom FRAMEWORK sections in brownfield';
  return true;
}));

// I267 — Gen25-H4: phase7.md Recovery check tiene branching explícito para audit+artifacts parcial
results.push(check('I267', 'Gen25-H4: phase7.md Recovery check tiene branching para audit-exists-but-artifacts-missing', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  const recoveryIdx = p7.indexOf('Recovery check');
  if (recoveryIdx === -1) return 'phase7.md must have Recovery check';
  const recoveryArea = p7.substring(recoveryIdx, recoveryIdx + 1500);
  // Must handle the partial case: audit exists but glossary/CODEOWNERS missing
  if (!recoveryArea.includes('6c') && !recoveryArea.includes('6d') && !recoveryArea.includes('STOP') && !recoveryArea.includes('missing'))
    return 'phase7.md Recovery check must handle case where audit exists but Glossary/CODEOWNERS are missing';
  return true;
}));

// I268 — Gen25-H5: phase4.md aclara que brownfield=true siempre corre safeguard (no skip)
results.push(check('I268', 'Gen25-H5: phase4.md Recovery check tiene precedencia brownfield=true siempre corre safeguard', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  if (!p4.includes('brownfield') || (!p4.includes('ALWAYS') && !p4.includes('always')))
    return 'phase4.md Recovery check must state that brownfield=true ALWAYS runs the safeguard';
  return true;
}));

// I269 — Gen25-M1: phase2.md §2 pregunta tiene traducción explícita (ES/EN o preferred_language)
results.push(check('I269', 'Gen25-M1: phase2.md §2 pregunta tiene referencia de traducción explícita ES/EN', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  // Use the specific §2 section header, not the first mention of §2 (which appears in Recovery check)
  const s2idx = p2.indexOf('§2 — This Project Is NOT') !== -1
    ? p2.indexOf('§2 — This Project Is NOT')
    : p2.indexOf('This Project Is NOT');
  if (s2idx === -1) return 'phase2.md must have §2 — This Project Is NOT section';
  const s2area = p2.substring(s2idx, s2idx + 1500);
  if ((!s2area.includes('ES:') && !s2area.includes('preferred_language')) || !s2area.includes('out of scope'))
    return 'phase2.md §2 question must have explicit translation reference (ES/EN or preferred_language)';
  return true;
}));

// I270 — Gen25-M2: phase3.md define "cambio" para el batch gate
results.push(check('I270', 'Gen25-M2: phase3.md define qué cuenta como "cambio" para el batch gate brownfield', (_content) => {
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  if (!p3.includes('top-level') && !p3.includes('top level') && !p3.includes('Definition of') && !p3.includes('definition of'))
    return 'phase3.md must define what counts as a "change" for the brownfield batch gate';
  return true;
}));

// I271 — Gen25-M3: phase3.md tiene validación YAML antes del gate de aprobación
results.push(check('I271', 'Gen25-M3: phase3.md tiene validación YAML (sintaxis) antes de mostrar al developer', (_content) => {
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  if (!p3.includes('YAML syntax') && !p3.includes('yaml syntax') && !p3.includes('parse') && !p3.includes('sintaxis'))
    return 'phase3.md must have YAML syntax validation step before showing to developer';
  return true;
}));

// I272 — Gen25-M4: phase4.md FRAMEWORK instruction clarifica "verbatim" vs placeholders reemplazables
results.push(check('I272', 'Gen25-M4: phase4.md FRAMEWORK instruction clarifica que placeholders sí se reemplazan (no verbatim puro)', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  // Should have the clarified instruction
  if (!p4.includes('EXCEPT replace') && !p4.includes('except replace') && !p4.includes('placeholders'))
    return 'phase4.md must clarify that [From constitution §N] placeholders ARE replaced (not verbatim)';
  return true;
}));

// I273 — Gen25-M5: phase4.md FRAMEWORK Standard Content Reference incluye Agent Dispatch
results.push(check('I273', 'Gen25-M5: phase4.md Standard Content Reference incluye Agent Dispatch con tabla de routing', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  if (!p4.includes('Agent Dispatch'))
    return 'phase4.md Standard Content Reference must include Agent Dispatch section';
  if (!p4.includes('frontend-engineer') || !p4.includes('backend-engineer'))
    return 'Agent Dispatch section must include frontend-engineer and backend-engineer routing';
  return true;
}));

// I274 — Gen25-M6: phase6.md tiene instrucción explícita de on: triggers para greenfield
results.push(check('I274', 'Gen25-M6: phase6.md tiene instrucción explícita de on: triggers para CI greenfield', (_content) => {
  const p6 = readFileSync(resolve('skills/genesis-governance/references/phase6.md'), 'utf-8');
  if (!p6.includes('on:') || (!p6.includes('push') && !p6.includes('pull_request')))
    return 'phase6.md must have explicit on: triggers instruction for greenfield CI';
  return true;
}));

// I275 — Gen25-M7: phase7.md Glossary tiene instrucción para greenfield (derivar de intake)
results.push(check('I275', 'Gen25-M7: phase7.md Glossary tiene instrucción para greenfield (L1/L2/L3 intake, no codebase)', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  // The Glossary generation rules block is the STOP section — search for the INTERNAL tag near Domain Glossary generation
  const generationIdx = p7.indexOf('Domain Glossary generation rules') !== -1
    ? p7.indexOf('Domain Glossary generation rules')
    : p7.indexOf('[INTERNAL] Domain Glossary');
  if (generationIdx === -1) return 'phase7.md must have Domain Glossary generation rules block';
  const glossaryArea = p7.substring(generationIdx, generationIdx + 2000);
  if (!glossaryArea.includes('greenfield') && !glossaryArea.includes('codebase does not') && !glossaryArea.includes('no codebase'))
    return 'phase7.md Glossary must have greenfield-specific instructions (derive from intake when codebase does not exist)';
  return true;
}));

// I276 — Gen25-M8: phase7.md tiene closure rule explícita por verdict
results.push(check('I276', 'Gen25-M8: phase7.md tiene closure rule explícita por verdict (CONFORME→close, NON_CONFORME→esperar)', (_content) => {
  const p7 = readFileSync(resolve('skills/genesis-governance/references/phase7.md'), 'utf-8');
  if (!p7.includes('NON_CONFORME') && !p7.includes('NON CONFORME') && !p7.includes('cannot be closed') && !p7.includes('no puede cerrarse'))
    return 'phase7.md must have explicit closure rule: NON_CONFORME blocks Phase 7 closure';
  return true;
}));

// I277 — Gen25-M9: phase2.md auto-verification tiene instrucción de corrección cuando falla invariants check
results.push(check('I277', 'Gen25-M9: phase2.md auto-verification tiene instrucción explícita de corrección si invariants < 4', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  if (!p2.includes('< 4') && !p2.includes('fewer than 4') && !p2.includes('menos de 4'))
    return 'phase2.md auto-verification must have correction instruction when invariant count < 4';
  return true;
}));

// ==========================================
// Gen26 Tests — I278-I284
// ==========================================

// I278 — Gen26-F1: genesis-governance.md tabla U9 incluye governance.config.yaml como señal brownfield
results.push(check('I278', 'Gen26-F1: U9 classification incluye governance.config.yaml como señal brownfield', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const tableIdx = main.indexOf('Classification logic');
  if (tableIdx === -1) return 'genesis-governance.md: Classification logic section not found';
  const tableArea = main.slice(tableIdx, tableIdx + 600);
  if (!tableArea.includes('governance.config.yaml'))
    return 'U9 classification table must include governance.config.yaml as brownfield signal';
  return true;
}));

// I279 — Gen26-F1: fila greenfield usa AND (no OR) — evita false greenfield cuando solo governance.config.yaml existe
results.push(check('I279', 'Gen26-F1: fila greenfield usa "AND none of the above found" (no OR)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const tableIdx = main.indexOf('Classification logic');
  if (tableIdx === -1) return 'genesis-governance.md: Classification logic section not found';
  const tableArea = main.slice(tableIdx, tableIdx + 600);
  if (!tableArea.includes('AND none of the above found') && !tableArea.includes('AND none of the above'))
    return 'greenfield row must use AND condition (not OR) to prevent false greenfield classification';
  return true;
}));

// I280 — Gen26-F2: phase3.md batch gate tiene instrucción de fallback para aprobación parcial
results.push(check('I280', 'Gen26-F2: phase3.md batch gate tiene fallback one-by-one para respuesta parcial', (_content) => {
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  if (!p3.includes('fall back to one-by-one mode for ALL changes'))
    return 'phase3.md batch gate must have explicit fallback to one-by-one for partial approval responses';
  return true;
}));

// I281 — Gen26-F2: el fallback de batch gate está marcado [INTERNAL]
results.push(check('I281', 'Gen26-F2: fallback batch gate marcado [INTERNAL]', (_content) => {
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  const batchIdx = p3.indexOf('fall back to one-by-one mode for ALL changes');
  if (batchIdx === -1) return 'phase3.md: batch fallback instruction not found';
  const surrounding = p3.slice(Math.max(0, batchIdx - 200), batchIdx + 50);
  if (!surrounding.includes('[INTERNAL]'))
    return 'phase3.md batch gate fallback must be marked [INTERNAL]';
  return true;
}));

// I282 — Gen26-F3: phase2.md backup safeguard tiene verificación post-Write con mensaje de abort
results.push(check('I282', 'Gen26-F3: phase2.md backup safeguard verifica el Write antes de proceder', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  if (!p2.includes('Backup failed — cannot overwrite without confirmed backup'))
    return 'phase2.md brownfield safeguard must verify backup Write succeeded before proceeding';
  return true;
}));

// I283 — Gen26-F3: phase4.md backup safeguard tiene verificación post-Write con mensaje de abort
results.push(check('I283', 'Gen26-F3: phase4.md backup safeguard verifica el Write antes de proceder', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  if (!p4.includes('Backup failed — cannot overwrite without confirmed backup'))
    return 'phase4.md brownfield safeguard must verify backup Write succeeded before proceeding';
  return true;
}));

// I284 — Gen26-F3: phase5.md backup safeguard tiene verificación post-Write con mensaje de abort
results.push(check('I284', 'Gen26-F3: phase5.md backup safeguard verifica el Write antes de proceder', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  if (!p5.includes('Backup failed — cannot overwrite without confirmed backup'))
    return 'phase5.md brownfield safeguard must verify backup Write succeeded before proceeding';
  return true;
}));

// ==========================================
// Gen27 Tests — I285-I293
// ==========================================

// I285 — Gen27-F1: genesis-governance.md tiene bloque brownfield pre-population después de confirmación
results.push(check('I285', 'Gen27-F1: brownfield pre-population block presente en main file', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  if (!main.includes('Brownfield pre-population'))
    return 'genesis-governance.md must have brownfield pre-population block after confirmation';
  return true;
}));

// I286 — Gen27-F1: L2 goal announcement tiene nota de brownfield fast path
results.push(check('I286', 'Gen27-F1: L2 goal tiene brownfield fast path note', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const l2Idx = main.indexOf('Layer 2/5 — Actores');
  if (l2Idx === -1) return 'genesis-governance.md: Layer 2/5 section not found';
  const l2Area = main.slice(l2Idx, l2Idx + 400);
  if (!l2Area.includes('Brownfield fast path') && !l2Area.includes('brownfield fast path'))
    return 'L2 goal must have brownfield fast path note for pre-populated actors';
  return true;
}));

// I287 — Gen27-F1: L3 goal tiene nota de brownfield fast path
results.push(check('I287', 'Gen27-F1: L3 goal tiene brownfield fast path note', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const l3Idx = main.indexOf('Layer 3/5 — Capacidades');
  if (l3Idx === -1) return 'genesis-governance.md: Layer 3/5 section not found';
  const l3Area = main.slice(l3Idx, l3Idx + 400);
  if (!l3Area.includes('Brownfield fast path') && !l3Area.includes('brownfield fast path'))
    return 'L3 goal must have brownfield fast path note for pre-populated capabilities';
  return true;
}));

// I288 — Gen27-F1: L4 goal tiene nota de brownfield fast path
results.push(check('I288', 'Gen27-F1: L4 goal tiene brownfield fast path note', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const l4Idx = main.indexOf('Layer 4/5 — Riesgos');
  if (l4Idx === -1) return 'genesis-governance.md: Layer 4/5 section not found';
  const l4Area = main.slice(l4Idx, l4Idx + 400);
  if (!l4Area.includes('Brownfield fast path') && !l4Area.includes('brownfield fast path'))
    return 'L4 goal must have brownfield fast path note for pre-populated risks/constraints';
  return true;
}));

// I289 — Gen27-F2: Handler 11 presente con trigger de CLAUDE.md only
results.push(check('I289', 'Gen27-F2: Handler 11 presente con trigger regenerate CLAUDE.md', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  if (!main.includes('Handler 11'))
    return 'genesis-governance.md must have Handler 11 for CLAUDE.md-only regeneration';
  return true;
}));

// I290 — Gen27-F2: Handler 11 verifica checkpoint antes de saltar a Phase 4
results.push(check('I290', 'Gen27-F2: Handler 11 verifica checkpoint (last_completed >= L5) antes de Phase 4', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const h11Idx = main.indexOf('Handler 11');
  if (h11Idx === -1) return 'genesis-governance.md: Handler 11 not found';
  const h11Area = main.slice(h11Idx, h11Idx + 1500);
  if (!h11Area.includes('last_completed'))
    return 'Handler 11 must check checkpoint last_completed';
  if (!h11Area.includes('Phase 4') && !h11Area.includes('Phase4'))
    return 'Handler 11 must reference Phase 4 (jump to or execute)';
  return true;
}));

// I291 — Gen27-F3: phase6.md tabla de derivación tiene snippet concreto de mock para AI outputs
results.push(check('I291', 'Gen27-F3: phase6.md AI mock row tiene ejemplo concreto de env vars', (_content) => {
  const p6 = readFileSync(resolve('skills/genesis-governance/references/phase6.md'), 'utf-8');
  const aiRow = p6.indexOf('ai_output_policies');
  if (aiRow === -1) return 'phase6.md: ai_output_policies row not found in derivation table';
  const aiArea = p6.slice(aiRow, aiRow + 400);
  if (!aiArea.includes('AI_PROVIDER') && !aiArea.includes('AI_MODEL') && !aiArea.includes('mock'))
    return 'phase6.md AI mock row must have concrete env var example (AI_PROVIDER or equivalent)';
  return true;
}));

// I292 — Gen27-F3: phase6.md AI mock incluye comentario "real keys must NEVER appear in CI"
results.push(check('I292', 'Gen27-F3: phase6.md AI mock row tiene comentario explícito anti-real-keys', (_content) => {
  const p6 = readFileSync(resolve('skills/genesis-governance/references/phase6.md'), 'utf-8');
  if (!p6.includes('real keys must NEVER') && !p6.includes('never real keys') && !p6.includes('NEVER appear in CI'))
    return 'phase6.md AI mock row must have explicit warning against real keys in CI';
  return true;
}));

// I293 — Gen27-F4: genesis-governance.md Prerequisites menciona YAML parser (js-yaml o PyYAML)
results.push(check('I293', 'Gen27-F4: Prerequisites menciona YAML parser (js-yaml/PyYAML) para Phase 3', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const prereqIdx = main.indexOf('Prerequisites check');
  if (prereqIdx === -1) return 'genesis-governance.md: Prerequisites check section not found';
  const prereqArea = main.slice(prereqIdx, prereqIdx + 600);
  if (!prereqArea.includes('js-yaml') && !prereqArea.includes('PyYAML') && !prereqArea.includes('YAML parser'))
    return 'Prerequisites must mention YAML parser requirement for Phase 3 auto-verification';
  return true;
}));

// ==========================================
// Gen28 Tests — I294-I300
// ==========================================

// I294 — Gen28-F1: pre-population block tiene tabla de mapeo con columna de pre-populate explícita
results.push(check('I294', 'Gen28-F1: pre-population block tiene tabla con columna Pre-populate?', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const ppIdx = main.indexOf('Brownfield pre-population');
  if (ppIdx === -1) return 'genesis-governance.md: Brownfield pre-population block not found';
  const ppArea = main.slice(ppIdx, ppIdx + 2500);
  if (!ppArea.includes('Pre-populate') && !ppArea.includes('Pre-pop'))
    return 'pre-population block must have explicit Pre-populate column in mapping table';
  return true;
}));

// I295 — Gen28-F1: pre-population block especifica que use_moment/core_task NO están en el YAML
results.push(check('I295', 'Gen28-F1: pre-population block explicita que L2 detail fields deben preguntarse', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const ppIdx = main.indexOf('Brownfield pre-population');
  if (ppIdx === -1) return 'genesis-governance.md: Brownfield pre-population block not found';
  const ppArea = main.slice(ppIdx, ppIdx + 2500);
  if (!ppArea.includes('use_moment') || !ppArea.includes('core_task'))
    return 'pre-population block must explicitly list use_moment/core_task as fields that cannot be pre-populated from YAML';
  if (!ppArea.includes('❌') && !ppArea.includes('No —') && !ppArea.includes('always ask'))
    return 'pre-population block must mark L2 detail fields as not pre-populatable';
  return true;
}));

// I296 — Gen28-F1: pre-population block especifica que external_deps siempre debe preguntarse
results.push(check('I296', 'Gen28-F1: pre-population block explicita external_deps como campo no-pre-populable', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const ppIdx = main.indexOf('Brownfield pre-population');
  if (ppIdx === -1) return 'genesis-governance.md: Brownfield pre-population block not found';
  const ppArea = main.slice(ppIdx, ppIdx + 2500);
  if (!ppArea.includes('external_deps'))
    return 'pre-population block must mention external_deps as a field that cannot be pre-populated';
  return true;
}));

// I297 — Gen28-F1: pre-population block menciona ai_output_policies como fuente del modo ai_outputs
results.push(check('I297', 'Gen28-F1: pre-population block usa ai_output_policies[0].mode para ai_outputs enum', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const ppIdx = main.indexOf('Brownfield pre-population');
  if (ppIdx === -1) return 'genesis-governance.md: Brownfield pre-population block not found';
  const ppArea = main.slice(ppIdx, ppIdx + 2500);
  if (!ppArea.includes('ai_output_policies'))
    return 'pre-population block must reference ai_output_policies as source for ai_outputs mode';
  return true;
}));

// I298 — Gen28-F2: Handler 11 tiene allowlist explícita de valores válidos de last_completed
results.push(check('I298', 'Gen28-F2: Handler 11 tiene allowlist explícita de valores válidos (L5, Phase2...Phase7)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const h11Idx = main.indexOf('Handler 11');
  if (h11Idx === -1) return 'genesis-governance.md: Handler 11 not found';
  const h11Area = main.slice(h11Idx, h11Idx + 1200);
  const hasValidList = h11Area.includes('"L5"') && h11Area.includes('"Phase2"') && h11Area.includes('"Phase7"');
  if (!hasValidList)
    return 'Handler 11 must have explicit allowlist: "L5", "Phase2"..."Phase7"';
  return true;
}));

// I299 — Gen28-F2: Handler 11 tiene lista explícita de valores inválidos (L1-L4)
results.push(check('I299', 'Gen28-F2: Handler 11 tiene lista explícita de valores inválidos (L1-L4)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const h11Idx = main.indexOf('Handler 11');
  if (h11Idx === -1) return 'genesis-governance.md: Handler 11 not found';
  const h11Area = main.slice(h11Idx, h11Idx + 1200);
  const hasInvalidList = h11Area.includes('"L1"') && h11Area.includes('"L4"');
  if (!hasInvalidList)
    return 'Handler 11 must have explicit invalid list including "L1" and "L4"';
  return true;
}));

// I300 — Gen28-F2: Handler 11 checkpoint write menciona Phase5/Phase6/Phase7 como no-downgrade set
results.push(check('I300', 'Gen28-F2: Handler 11 checkpoint write tiene set explícito de no-downgrade (Phase5/6/7)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const h11Idx = main.indexOf('Handler 11');
  if (h11Idx === -1) return 'genesis-governance.md: Handler 11 not found';
  const h11Area = main.slice(h11Idx, h11Idx + 1500);
  const hasNoDowngrade = h11Area.includes('"Phase5"') && h11Area.includes('"Phase6"') && h11Area.includes('"Phase7"');
  if (!hasNoDowngrade)
    return 'Handler 11 checkpoint write must explicitly list Phase5/Phase6/Phase7 as values that block downgrade';
  return true;
}));

// ==========================================
// Gen29 Tests — I301-I303
// ==========================================

// I301 — Gen29-F1: L5 tiene instrucción explícita Write del intake file antes de anunciarlo
results.push(check('I301', 'Gen29-F1: L5 tiene Write explícito del intake file antes del anuncio', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const l5Idx = main.indexOf('After Layer 5 is confirmed');
  if (l5Idx === -1) return 'genesis-governance.md: "After Layer 5 is confirmed" section not found';
  const l5Area = main.slice(l5Idx, l5Idx + 600);
  if (!l5Area.includes('Write:') && !l5Area.includes('Write the intake'))
    return 'L5 must have explicit Write instruction for intake file before announcing it';
  if (!l5Area.includes('layers-1-5'))
    return 'L5 Write instruction must reference the layers-1-5 intake file path';
  return true;
}));

// I302 — Gen29-F1: Write del intake file menciona los campos L1-L5 que debe incluir
results.push(check('I302', 'Gen29-F1: Write del intake file especifica campos a incluir (L1-L5 outputs)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const writeIdx = main.indexOf('Write the intake document');
  if (writeIdx === -1) return 'genesis-governance.md: "Write the intake document" instruction not found';
  const writeArea = main.slice(writeIdx, writeIdx + 400);
  const hasFields = writeArea.includes('actor_profiles') || writeArea.includes('business_risks') || writeArea.includes('tech_stack');
  if (!hasFields)
    return 'Write intake instruction must list the L1-L5 fields to include';
  return true;
}));

// I303 — Gen29-F2: genesis_skill_generation actualizado a Gen28 (no Gen24)
results.push(check('I303', 'Gen29-F2: genesis_skill_generation hardcoded value es Gen28 (no Gen24)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  if (main.includes('"genesis_skill_generation": "Gen24"') || main.includes("genesis_skill_generation: 'Gen24'"))
    return 'genesis_skill_generation must be updated to Gen28 — found stale Gen24 reference';
  if (!main.includes('"genesis_skill_generation": "Gen28"') && !main.includes('genesis_skill_generation: "Gen28"'))
    return 'genesis_skill_generation must reference Gen28 in the checkpoint spec';
  return true;
}));

// ==========================================
// Gen30 Tests — I304-I308
// ==========================================

// I304 — Gen30-F1: L5 fast path note menciona precedencia sobre GEN17-F2 disk derivation
results.push(check('I304', 'Gen30-F1: L5 fast path note dice que toma precedencia sobre GEN17-F2 disk values', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const l5Idx = main.indexOf('LAYER 5 — TECHNICAL');
  if (l5Idx === -1) return 'genesis-governance.md: LAYER 5 section not found';
  const l5Area = main.slice(l5Idx, l5Idx + 600);
  const hasFastPath = l5Area.includes('Brownfield fast path') || l5Area.includes('brownfield fast path');
  if (!hasFastPath) return 'L5 must have brownfield fast path note';
  if (!l5Area.includes('takes priority') && !l5Area.includes('precedence') && !l5Area.includes('prioridad'))
    return 'L5 fast path note must state it takes priority over GEN17-F2 disk-derived values';
  return true;
}));

// I305 — Gen30-F1: GEN17-F2 tiene fork explícito Sub-caso A (config.yaml present) y Sub-caso B (disk only)
results.push(check('I305', 'Gen30-F1: GEN17-F2 tiene fork Sub-caso A (config.yaml → validation only) y Sub-caso B (disk primary)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  // Use the specific section header to avoid matching the CRITICAL RULES summary mention of GEN17-F2
  const gen17Idx = main.indexOf('GEN17-F2 — execute this path');
  if (gen17Idx === -1) return 'genesis-governance.md: GEN17-F2 section header ("GEN17-F2 — execute this path") not found';
  const gen17Area = main.slice(gen17Idx, gen17Idx + 1800);
  if (!gen17Area.includes('Sub-caso A') && !gen17Area.includes('Sub-case A'))
    return 'GEN17-F2 must have Sub-caso A for governance.config.yaml present path';
  if (!gen17Area.includes('Sub-caso B') && !gen17Area.includes('Sub-case B'))
    return 'GEN17-F2 must have Sub-caso B for disk-only path';
  if (!gen17Area.includes('validación') && !gen17Area.includes('validation') && !gen17Area.includes('validar'))
    return 'GEN17-F2 Sub-caso A must specify disk commands run for validation only, not primary source';
  return true;
}));

// I306 — Gen30-F2: brownfield intake backup block existe antes del Write en L5
results.push(check('I306', 'Gen30-F2: brownfield intake backup block existe antes del Write del intake file', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const backupIdx = main.indexOf('Brownfield intake backup');
  if (backupIdx === -1) return 'genesis-governance.md: "Brownfield intake backup" block not found before intake Write';
  const writeIdx = main.indexOf('Write the intake document');
  if (writeIdx === -1) return 'genesis-governance.md: "Write the intake document" instruction not found';
  if (backupIdx > writeIdx) return 'Brownfield intake backup block must appear BEFORE the Write instruction';
  const backupArea = main.slice(backupIdx, backupIdx + 600);
  if (!backupArea.includes('Intake backup failed') && !backupArea.includes('backup failed'))
    return 'Brownfield intake backup must have abort announcement if backup fails';
  return true;
}));

// I307 — Gen30-F3: brownfield impact announcement menciona governance.config.yaml (si existe) con Phase 3 diff
results.push(check('I307', 'Gen30-F3: brownfield impact announcement menciona governance.config.yaml (si existe) → Phase 3 diff', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const impactIdx = main.indexOf('Impacto sobre los archivos existentes');
  if (impactIdx === -1) return 'genesis-governance.md: impact announcement block not found';
  const impactArea = main.slice(impactIdx, impactIdx + 700);
  if (!impactArea.includes('governance.config.yaml'))
    return 'impact announcement must mention governance.config.yaml';
  if (!impactArea.includes('Phase 3') && !impactArea.includes('phase 3'))
    return 'impact announcement must mention Phase 3 diff gate for governance.config.yaml when it exists';
  return true;
}));

// I308 — Gen30-F3: brownfield impact announcement tiene caso "si no existe → se creará desde cero" para governance.config.yaml
results.push(check('I308', 'Gen30-F3: brownfield impact announcement tiene caso "si no existe → se creará desde cero" para governance.config.yaml', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const impactIdx = main.indexOf('Impacto sobre los archivos existentes');
  if (impactIdx === -1) return 'genesis-governance.md: impact announcement block not found';
  const impactArea = main.slice(impactIdx, impactIdx + 700);
  const configYamlCount = (impactArea.match(/governance\.config\.yaml/g) || []).length;
  if (configYamlCount < 2)
    return 'impact announcement must have both "exists" and "not exists" cases for governance.config.yaml';
  if (!impactArea.includes('desde cero') && !impactArea.includes('from scratch') && !impactArea.includes('created new'))
    return 'impact announcement must specify governance.config.yaml is created from scratch if not present';
  return true;
}));

// ==========================================
// Gen31 Tests — I309-I315 (ordering + context-window)
// ==========================================

// I309 — Gen31-F1: G2-T4 reentry check aparece ANTES de LAYER 1 en el archivo
results.push(check('I309', 'Gen31-F1: G2-T4 reentry detection aparece antes de LAYER 1 (ordering)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const reentryPos = main.indexOf('G2-T4 — Reentry detection');
  const layer1Pos = main.indexOf('### LAYER 1 — BUSINESS');
  if (reentryPos === -1) return 'G2-T4 — Reentry detection section not found';
  if (layer1Pos === -1) return '### LAYER 1 — BUSINESS section not found';
  if (reentryPos >= layer1Pos) return `G2-T4 (pos ${reentryPos}) must appear BEFORE LAYER 1 (pos ${layer1Pos}) — reentry check must precede layer questions`;
  return true;
}));

// I310 — Gen31-F1: Brownfield pre-population aparece ANTES de LAYER 2 (datos disponibles antes de que L2 empiece)
results.push(check('I310', 'Gen31-F1: Brownfield pre-population aparece antes de ### LAYER 2 (ordering)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const ppPos = main.indexOf('Brownfield pre-population');
  const l2Pos = main.indexOf('### LAYER 2 — ACTORS');
  if (ppPos === -1) return 'Brownfield pre-population block not found';
  if (l2Pos === -1) return '### LAYER 2 — ACTORS section not found';
  if (ppPos >= l2Pos) return `Brownfield pre-population (pos ${ppPos}) must appear BEFORE LAYER 2 (pos ${l2Pos}) — pre-population must be loaded before layer questions start`;
  return true;
}));

// I311 — Gen31-F1: Brownfield intake backup aparece ANTES de Write intake document (ordering)
results.push(check('I311', 'Gen31-F1: Brownfield intake backup aparece antes de Write intake document (ordering)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const backupPos = main.indexOf('Brownfield intake backup');
  const writePos = main.indexOf('Write the intake document');
  if (backupPos === -1) return 'Brownfield intake backup block not found';
  if (writePos === -1) return 'Write the intake document instruction not found';
  if (backupPos >= writePos) return `Brownfield intake backup (pos ${backupPos}) must appear BEFORE Write intake (pos ${writePos})`;
  return true;
}));

// I312 — Gen31-F1: L5 closure summary (G35) aparece ANTES de Write intake document (ordering)
results.push(check('I312', 'Gen31-F1: L5 closure summary (G35) aparece antes de Write intake document (ordering)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const g35Pos = main.indexOf('L5 closure summary (G35)');
  const writePos = main.indexOf('Write the intake document');
  if (g35Pos === -1) return 'L5 closure summary (G35) not found';
  if (writePos === -1) return 'Write the intake document instruction not found';
  if (g35Pos >= writePos) return `G35 closure (pos ${g35Pos}) must appear BEFORE Write intake (pos ${writePos}) — developer must confirm before file is written`;
  return true;
}));

// I313 — Gen31-F1: GEN17-F2 aparece ANTES de L5 Reality Check section (ordering)
results.push(check('I313', 'Gen31-F1: GEN17-F2 brownfield branch aparece antes de L5 Reality Check (ordering)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const gen17Pos = main.indexOf('GEN17-F2 — execute this path');
  const rcPos = main.indexOf('### L5 Reality Check');
  if (gen17Pos === -1) return 'GEN17-F2 block not found';
  if (rcPos === -1) return '### L5 Reality Check section not found';
  if (gen17Pos >= rcPos) return `GEN17-F2 (pos ${gen17Pos}) must appear BEFORE L5 Reality Check (pos ${rcPos})`;
  return true;
}));

// I314 — Gen31-F1: GEN17-F2 Sub-caso A y Sub-caso B están dentro de 2000 chars (mismo context window)
results.push(check('I314', 'Gen31-F1: GEN17-F2 Sub-casos A y B están dentro de 2000 chars entre sí (mismo window)', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const subAPos = main.indexOf('Sub-caso A — governance.config.yaml fue encontrado');
  const subBPos = main.indexOf('Sub-caso B — governance.config.yaml NO fue encontrado');
  if (subAPos === -1) return 'GEN17-F2 Sub-caso A not found';
  if (subBPos === -1) return 'GEN17-F2 Sub-caso B not found';
  const distance = Math.abs(subBPos - subAPos);
  if (distance > 2000) return `Sub-caso A (pos ${subAPos}) and Sub-caso B (pos ${subBPos}) are ${distance} chars apart — must be within 2000 chars for the model to see both in context`;
  return true;
}));

// I315 — Gen31-F1: L5 fast path precedence note y GEN17-F2 están dentro de 800 chars (no hay instrucción intermedia que los separe)
results.push(check('I315', 'Gen31-F1: L5 fast path precedence note y GEN17-F2 están dentro de 800 chars', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const fastPathPos = main.indexOf('This takes priority over the disk-derived values in GEN17-F2');
  const gen17Pos = main.indexOf('GEN17-F2 — execute this path');
  if (fastPathPos === -1) return 'Fast path precedence note ("This takes priority over the disk-derived values in GEN17-F2") not found';
  if (gen17Pos === -1) return 'GEN17-F2 block not found';
  const distance = Math.abs(gen17Pos - fastPathPos);
  if (distance > 800) return `Fast path note (pos ${fastPathPos}) and GEN17-F2 (pos ${gen17Pos}) are ${distance} chars apart — must be within 800 chars so model sees precedence rule next to the instruction it governs`;
  return true;
}));

// ==========================================
// Gen32 Tests — I316-I325 (mandatory gates + active state recap)
// ==========================================

// I316 — Gen32-F1: L5 → Phase 2 tiene MANDATORY READ GATE para phase2.md
results.push(check('I316', 'Gen32-F1: L5 → Phase 2 transition tiene MANDATORY READ GATE', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const l5CheckpointIdx = main.indexOf('Checkpoint write (L5)');
  if (l5CheckpointIdx === -1) return 'Checkpoint write (L5) not found';
  const afterCheckpoint = main.slice(l5CheckpointIdx, l5CheckpointIdx + 800);
  if (!afterCheckpoint.includes('MANDATORY READ GATE') && !afterCheckpoint.includes('MANDATORY'))
    return 'L5 checkpoint write must be followed by a MANDATORY READ GATE for phase2.md';
  if (!afterCheckpoint.includes('references/phase2.md'))
    return 'MANDATORY gate after L5 must reference references/phase2.md';
  return true;
}));

// I317 — Gen32-F1: phase2.md checkpoint write tiene MANDATORY READ GATE para phase3.md
results.push(check('I317', 'Gen32-F1: phase2.md checkpoint write tiene MANDATORY READ GATE para phase3.md', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  const cpIdx = p2.indexOf('Checkpoint write (Phase 2)');
  if (cpIdx === -1) return 'phase2.md: Checkpoint write (Phase 2) not found';
  const afterCp = p2.slice(cpIdx, cpIdx + 600);
  if (!afterCp.includes('MANDATORY')) return 'phase2.md: checkpoint write must be followed by MANDATORY READ GATE';
  if (!afterCp.includes('phase3.md')) return 'phase2.md: MANDATORY gate must reference phase3.md';
  return true;
}));

// I318 — Gen32-F1: phase3.md checkpoint write tiene MANDATORY READ GATE para phase4.md
results.push(check('I318', 'Gen32-F1: phase3.md checkpoint write tiene MANDATORY READ GATE para phase4.md', (_content) => {
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  const cpIdx = p3.indexOf('Checkpoint write (Phase 3)');
  if (cpIdx === -1) return 'phase3.md: Checkpoint write (Phase 3) not found';
  const afterCp = p3.slice(cpIdx, cpIdx + 600);
  if (!afterCp.includes('MANDATORY')) return 'phase3.md: checkpoint write must be followed by MANDATORY READ GATE';
  if (!afterCp.includes('phase4.md')) return 'phase3.md: MANDATORY gate must reference phase4.md';
  return true;
}));

// I319 — Gen32-F1: phase4.md checkpoint write tiene MANDATORY READ GATE para phase5.md
results.push(check('I319', 'Gen32-F1: phase4.md checkpoint write tiene MANDATORY READ GATE para phase5.md', (_content) => {
  const p4 = readFileSync(resolve('skills/genesis-governance/references/phase4.md'), 'utf-8');
  const cpIdx = p4.indexOf('Checkpoint write (Phase 4)');
  if (cpIdx === -1) return 'phase4.md: Checkpoint write (Phase 4) not found';
  const afterCp = p4.slice(cpIdx, cpIdx + 600);
  if (!afterCp.includes('MANDATORY')) return 'phase4.md: checkpoint write must be followed by MANDATORY READ GATE';
  if (!afterCp.includes('phase5.md')) return 'phase4.md: MANDATORY gate must reference phase5.md';
  return true;
}));

// I320 — Gen32-F1: phase5.md checkpoint write tiene MANDATORY READ GATE para phase6.md
results.push(check('I320', 'Gen32-F1: phase5.md checkpoint write tiene MANDATORY READ GATE para phase6.md', (_content) => {
  const p5 = readFileSync(resolve('skills/genesis-governance/references/phase5.md'), 'utf-8');
  const cpIdx = p5.indexOf('Checkpoint write (Phase 5)');
  if (cpIdx === -1) return 'phase5.md: Checkpoint write (Phase 5) not found';
  // Phase 5 checkpoint has a large JSON block (~1500 chars) — use wider window
  const afterCp = p5.slice(cpIdx, cpIdx + 2500);
  if (!afterCp.includes('MANDATORY')) return 'phase5.md: checkpoint write must be followed by MANDATORY READ GATE';
  if (!afterCp.includes('phase6.md')) return 'phase5.md: MANDATORY gate must reference phase6.md';
  return true;
}));

// I321 — Gen32-F1: phase6.md checkpoint write tiene MANDATORY READ GATE para phase7.md
results.push(check('I321', 'Gen32-F1: phase6.md checkpoint write tiene MANDATORY READ GATE para phase7.md', (_content) => {
  const p6 = readFileSync(resolve('skills/genesis-governance/references/phase6.md'), 'utf-8');
  const cpIdx = p6.indexOf('Checkpoint write (Phase 6)');
  if (cpIdx === -1) return 'phase6.md: Checkpoint write (Phase 6) not found';
  const afterCp = p6.slice(cpIdx, cpIdx + 800);
  if (!afterCp.includes('MANDATORY')) return 'phase6.md: checkpoint write must be followed by MANDATORY READ GATE';
  if (!afterCp.includes('phase7.md')) return 'phase6.md: MANDATORY gate must reference phase7.md';
  return true;
}));

// I322 — Gen32-F2: L5 checkpoint write section tiene active state recap instruction
results.push(check('I322', 'Gen32-F2: L5 checkpoint write section tiene active state recap instruction', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const l5CpIdx = main.indexOf('Checkpoint write (L5)');
  if (l5CpIdx === -1) return 'Checkpoint write (L5) not found';
  const afterCp = main.slice(l5CpIdx, l5CpIdx + 1000);
  if (!afterCp.includes('ACTIVE STATE') && !afterCp.includes('Active state recap'))
    return 'L5 checkpoint write must be followed by active state recap instruction';
  return true;
}));

// I323 — Gen32-F2: phase2.md tiene active state recap después del checkpoint write
results.push(check('I323', 'Gen32-F2: phase2.md tiene active state recap después del checkpoint write', (_content) => {
  const p2 = readFileSync(resolve('skills/genesis-governance/references/phase2.md'), 'utf-8');
  const cpIdx = p2.indexOf('Checkpoint write (Phase 2)');
  if (cpIdx === -1) return 'phase2.md: Checkpoint write (Phase 2) not found';
  const afterCp = p2.slice(cpIdx, cpIdx + 800);
  if (!afterCp.includes('ACTIVE STATE') && !afterCp.includes('Active state recap'))
    return 'phase2.md: checkpoint write must be followed by active state recap';
  return true;
}));

// I324 — Gen32-F2: active state recap incluye campos mínimos: project, brownfield, lang, next
results.push(check('I324', 'Gen32-F2: active state recap incluye campos: project, brownfield, lang, next', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const recapIdx = main.indexOf('ACTIVE STATE');
  if (recapIdx === -1) return 'genesis-governance.md: ACTIVE STATE block not found';
  const recapArea = main.slice(recapIdx, recapIdx + 300);
  if (!recapArea.includes('project:')) return 'active state recap must include "project:" field';
  if (!recapArea.includes('brownfield:')) return 'active state recap must include "brownfield:" field';
  if (!recapArea.includes('lang:')) return 'active state recap must include "lang:" field';
  if (!recapArea.includes('next:')) return 'active state recap must include "next:" field';
  return true;
}));

// I325 — Gen32-F2: phase3.md tiene active state recap después del checkpoint write
results.push(check('I325', 'Gen32-F2: phase3.md tiene active state recap después del checkpoint write', (_content) => {
  const p3 = readFileSync(resolve('skills/genesis-governance/references/phase3.md'), 'utf-8');
  const cpIdx = p3.indexOf('Checkpoint write (Phase 3)');
  if (cpIdx === -1) return 'phase3.md: Checkpoint write (Phase 3) not found';
  const afterCp = p3.slice(cpIdx, cpIdx + 800);
  if (!afterCp.includes('ACTIVE STATE') && !afterCp.includes('Active state recap'))
    return 'phase3.md: checkpoint write must be followed by active state recap';
  return true;
}));

// ==========================================
// Gen32-FM1 Tests — I326-I328 (Critical Rules Summary)
// ==========================================

// I326 — Gen32-FM1: CRITICAL RULES block existe en las primeras 2000 chars del main file
results.push(check('I326', 'Gen32-FM1: CRITICAL RULES block existe en las primeras 2000 chars del main file', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const summaryPos = main.indexOf('CRITICAL RULES');
  if (summaryPos === -1) return 'genesis-governance.md: CRITICAL RULES block not found';
  if (summaryPos > 2000) return `CRITICAL RULES block is at position ${summaryPos} — must be within first 2000 chars for primacy effect`;
  return true;
}));

// I327 — Gen32-FM1: CRITICAL RULES menciona G2-T4 / checkpoint read como primera regla
results.push(check('I327', 'Gen32-FM1: CRITICAL RULES menciona checkpoint read (G2-T4) como regla crítica', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const summaryIdx = main.indexOf('CRITICAL RULES');
  if (summaryIdx === -1) return 'CRITICAL RULES block not found';
  const summaryArea = main.slice(summaryIdx, summaryIdx + 1000);
  if (!summaryArea.includes('G2-T4') && !summaryArea.includes('checkpoint') && !summaryArea.includes('genesis-checkpoint.json'))
    return 'CRITICAL RULES must mention checkpoint read (G2-T4) as a critical rule';
  return true;
}));

// I328 — Gen32-FM1: CRITICAL RULES menciona la regla de backup/overwrite
results.push(check('I328', 'Gen32-FM1: CRITICAL RULES menciona la regla de backup verify antes de overwrite', (_content) => {
  const main = readFileSync(resolve('skills/genesis-governance/SKILL.md'), 'utf-8');
  const summaryIdx = main.indexOf('CRITICAL RULES');
  if (summaryIdx === -1) return 'CRITICAL RULES block not found';
  const summaryArea = main.slice(summaryIdx, summaryIdx + 1000);
  if (!summaryArea.includes('backup') && !summaryArea.includes('overwrite') && !summaryArea.includes('ABORT'))
    return 'CRITICAL RULES must mention the backup/overwrite rule with abort condition';
  return true;
}));

// --- Report ---
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass);

console.log('\n/genesis-governance Skill Invariant Tests\n');
console.log('='.repeat(50));

for (const r of results) {
  const icon = r.pass ? '✅' : '❌';
  console.log(`${icon} ${r.id} — ${r.description}`);
  if (!r.pass && r.detail) console.log(`      → ${r.detail}`);
}

console.log('='.repeat(50));
console.log(`\nResults: ${passed}/${results.length} passed\n`);

if (failed.length > 0) {
  console.error(`FAILED: ${failed.map(r => r.id).join(', ')}`);
  process.exit(1);
}

console.log('All invariants PASS ✅');
