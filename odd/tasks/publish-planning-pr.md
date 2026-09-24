# Publish planning workspace pull request

Issue: [Consolidar herramientas y evidencia de planificación](https://github.com/reos156/mundo-kawaii-pos/issues/37)

## Goal

Commit the pending local skill installation, publish `feat/planning`, and open a policy-compliant pull request to `main` for the complete planning workspace.

## Delivery

- Strategy: single pull request with maintainer-approved `size:exception`.
- Forecast: approximately 2,056 changed lines against `main`, dominated by vendored upstream skill assets.
- PR type: `type:chore`.

## Tasks

- [x] Audit pending files and review workload.
- [x] Create and approve the required base-repository issue.
- [x] Verify and commit the pending local skills and lockfile.
- [ ] Push `feat/planning` and create the pull request.
- [ ] Apply exactly one `type:*` label and `size:exception`.
- [ ] Observe and report automated checks.

## Verification evidence

- Lockfile JSON shape passed.
- Eleven new lock entries and skill roots matched.
- Both shell templates passed `bash -n`.
- ShellCheck ran transiently through `npx`: default mode reported only upstream `SC2034` for the unused `RED` color constant; the documented vendored-template run with `-e SC2034` passed without diagnostics.
- Work-unit commit: `c4d727b` (`chore(skills): install planning workflow toolkit`).
