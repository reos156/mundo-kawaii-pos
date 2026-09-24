# Remove project SDD and OpenSpec configuration

## Goal

Remove every active project-local SDD/OpenSpec instruction and leave Wayfinder with a neutral, explicitly selected downstream handoff.

## Scope

- `AGENTS.md`
- `docs/agents/issue-tracker.md`

No `openspec/`, `openspec/config.yaml`, `.pi/prepare-sdd-work-unit.json`, or project-local SDD preflight assets exist. Global Pi/Gentle runtime assets are outside this project change.

## Tasks

- [x] Inventory project-local SDD/OpenSpec files and references.
- [x] Confirm the replacement policy: resolved Wayfinder maps remain evidence and the next workflow requires explicit selection.
- [x] Remove SDD/OpenSpec opt-in and handoff instructions.
- [x] Verify no active project-local SDD/OpenSpec configuration remains.
- [x] Commit the verified project-instruction change.

## Evidence

- User requested complete removal of project-local SDD/OpenSpec configuration.
- User selected a neutral, explicit downstream handoff for resolved Wayfinder maps.
- Writer self-verification and independent verification passed: no active tracked SDD/OpenSpec references remain outside this evidence document; `openspec/config.yaml` and `.pi/prepare-sdd-work-unit.json` are absent.
- Work-unit commit: `9133ddd` (`docs(workflow): remove SDD project configuration`).
