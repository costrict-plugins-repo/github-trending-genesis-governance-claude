# Compatibility

## Claude Code (native — full support)

`genesis-governance` is built for [Claude Code](https://claude.ai/code) and
distributed as an official plugin. Requires **Claude Code v2.1 or later**.

Install with:

```
/plugin install genesis-governance
```

All features work as designed under Claude Code:

- `/genesis-governance` and `/genesis-sync` slash command invocation.
- Tool calls executed from skill instructions (Read, Write, Edit, Bash).
- Checkpoint resume via `docs/intake/genesis-checkpoint.json`.
- Progressive disclosure: `SKILL.md` entrypoint + lazy-loaded `references/`
  files (phase2–phase7) triggered by MANDATORY READ GATE at phase transitions.
- `${CLAUDE_PLUGIN_ROOT}` path resolution for internal Read operations.
- Anti-ritual friction gates at L4 and Phase 2.
- Full handler system (H1–H11), Backtrack Protocol, Active state recap,
  and Emergency exit.

## Other AI coding tools (experimental)

| Tool | Status | Notes |
|------|--------|-------|
| Cursor | ⚠️ Experimental | No slash commands and no plugin system. The skill can be used as a guided mega-prompt by pasting `SKILL.md` content into chat, but tool calls from context files are not guaranteed — checkpoint/resume, progressive disclosure, and MANDATORY READ GATE will not trigger reliably. |
| GitHub Copilot | ❌ Not compatible | No mechanism for tool calls from context files. |
| Windsurf | ⚠️ Experimental | Similar to Cursor. Partial functionality possible via custom rules. |
| Continue (VS Code) | ⚠️ Experimental | Custom prompts supported. Tool call execution from prompts is model-dependent. |

### Using with Cursor / Windsurf (degraded mode)

You can use the skill as a guided mega-prompt by copying the content of
`skills/genesis-governance/SKILL.md` into the chat. In this mode:

- The intake protocol (L1–L5) works — it's just a structured conversation.
- Constitution, `governance.config.yaml`, `CLAUDE.md`, document registry, and
  CI pipeline are generated as file content for you to copy manually.
- **Checkpoint resume does NOT work** — the model won't automatically read
  the checkpoint file.
- **Progressive disclosure does NOT work** — you must paste each of the
  `references/phaseN.md` files manually when the skill announces the next
  phase transition.
- **Handler 11 allowlist, MANDATORY READ GATE, and Active state recap** will
  not fire automatically — the model sees their instructions in `SKILL.md`
  but cannot execute the underlying Read operations.

For full functionality, use Claude Code v2.1 or later with the plugin
installed.
