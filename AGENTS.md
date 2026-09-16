# Project Agent Instructions

## Project workflows

- This project opts into the global prepare-only `prepare-sdd-work-unit` skill via `.pi/prepare-sdd-work-unit.json`, only when explicitly invoked as `/skill:prepare-sdd-work-unit WU-XX`.

## Agent skills
### Issue tracker
Issues and Wayfinder decision maps live in GitHub Issues. See `docs/agents/issue-tracker.md`.
### Triage labels
Use the five default Matt Pocock triage labels. See `docs/agents/triage-labels.md`.
### Domain docs
Use the single-context layout. See `docs/agents/domain.md`.
### Wayfinder and Gentle SDD
Wayfinder only resolves decision maps. A resolved map is input evidence for Gentle SDD/OpenSpec, which remains the source of truth. Do not use `to-spec`, `to-tickets`, or `implement` for this flow.
