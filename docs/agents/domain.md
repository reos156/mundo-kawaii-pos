# Domain Documentation

## Layout

Use a single-context domain documentation layout:

- `CONTEXT.md` at the repository root describes the repository-wide domain context and glossary.
- `docs/adr/` contains repository-wide architecture decision records.

Absence is silent: do not create placeholder domain documentation or warn merely because `CONTEXT.md` or `docs/adr/` does not exist. Create either lazily, only when domain-modeling work requires it.

## Domain modeling

Use the domain-modeling skill to create or refine the context document, glossary, and ADRs. Keep domain vocabulary in the `CONTEXT.md` glossary so repository terminology has one canonical definition.

Surface conflicts explicitly when a proposed ADR contradicts an existing ADR, domain rule, or glossary term. Do not silently overwrite, reinterpret, or supersede an established decision; identify the conflict and require an explicit resolution.
