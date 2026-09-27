# POS05-C6 Stock Movement UI — ODD Feature

## Objective
Complete the POS05-C6 child slice by integrating administrator-only stock receipts and adjustments into the POS route, using the existing C2 RPC adapter and preserving an auditable inventory history.

## Problem
The POS05-C5 route can administer products and read inventory, but it does not yet expose the authorized stock receipt/adjustment operations. The existing C6 component and integration-test drafts are untracked and must be preserved while completed.

## Why
Store operators need a safe UI for recording stock receipts and signed adjustments without bypassing Postgres authorization or confusing on-hand stock with reservation-adjusted availability.

## Scope
- Integrate `StockMovementForm` into the existing `HomeRoute` for administrators only.
- Use the existing `receiveStock` and `adjustStock` C2 adapter functions and their database-enforced RPCs.
- Refresh the catalog and movement history after a successful stock mutation.
- Preserve the existing C6 component and test drafts; complete them only within their named paths.
- Add behavior tests for role denial, request payloads, validation/duplicate submission, mutation errors, refresh outcomes, and stale responses after logout as appropriate to the route's existing contracts.
- Keep user-facing UI copy in Spanish (Colombia); technical artifacts remain English.

## Non-goals
- No migration, database/RPC, adapter, authentication-provider, or permission-policy changes.
- No cashier stock writes, reservation logic, purchasing workflow, or changes to POS05-C5 product administration.
- No push, PR creation, merge, or live Supabase project configuration in this work unit.

## Constraints and decisions
- The project-selected workflow is Organic Driven Development; SDD/OpenSpec was not requested.
- Strict TDD is enabled by explicit user choice. UI tests use Vitest; the root runner is `bun run test`. The focused app-package command is recorded below.
- Stock receipt quantity is a positive safe integer. Adjustment delta is a non-zero signed safe integer. Empty notes are normalized by the existing adapter.
- The route must enforce the administrator/session boundary and suppress stale asynchronous feedback after logout; Postgres RPC authorization remains authoritative.
- Treat mutation success and subsequent catalog/history refresh failure as distinct outcomes; do not imply that a persisted stock movement failed or invite a duplicate retry.
- Parent worktree is `/home/reos156/proyectos/mundo-kawaii-pos/code/worktrees/mvp`.
- C6 branch: `feat/pos05-06-stock-movements`, created from the C5 child branch at `8153118` (`feat/pos05-05-product-admin`). Preserve both pre-existing untracked C6 drafts.
- Delivery strategy is the already-selected POS05 `feature-branch-chain`. The old pre-refactor estimate of ~168 lines is stale; measure the exact C6 child diff. The user explicitly approved a `size:exception` for the exact 632-line C6 child slice after the measured overage was presented. Do not extend this exception to other changes.
- No push, PR, or merge is part of this task. The user explicitly requested no merge now; the size exception authorizes only this exact slice.

## Acceptance criteria
1. Administrators can choose receipt or adjustment, select a product, enter valid whole-unit quantities/deltas, and submit an optional note.
2. Receipt calls only `receiveStock`; adjustment calls only `adjustStock`, with the selected product, amount, and note.
3. Cashiers and users without administrator membership see no stock-write controls and cannot invoke the mutation handlers; the database remains the final authorization boundary.
4. Invalid input and duplicate submission are blocked; RPC errors are visible and preserve a retryable draft.
5. A successful mutation refreshes the current inventory and movement history; a refresh failure is reported as a stale view, not as a failed mutation.
6. Once sign-out starts, new stock mutations are blocked; pending responses cannot repopulate the prior session's route state or show stale feedback after logout.
7. The existing C6 test draft fails before integration (observed RED), then the focused behavior suite passes after implementation (GREEN); applicable full-suite/typecheck/build outcomes are recorded honestly.
8. The C6 work-unit commit contains the behavior and its tests, has a clear Conventional Commit message, and does not include unrelated changes or publish/merge the branch.

## Tasks
- [x] **C6-IMPLEMENT — Integrate and test administrator stock movements.** Work-unit commit `490590c` (`feat(pos): add admin stock movement controls`), exactly 632 changed lines across `home.tsx`, `stock-movement-form.tsx`, and its test; the user approved a `size:exception` for this exact slice. Strict TDD observed RED/GREEN, and the corrected candidate passed independent full-suite, typecheck, build, and parent spot-check evidence recorded below.
- [~] **C6-CLOSE — Verify and record C6 completion.** Verification is complete; record exact evidence and commit identity in this feature file and the POS MVP ledger, then close with a scoped documentation/evidence commit.

## Allowed implementation surfaces
- `apps/pos-web/src/routes/home.tsx`
- `apps/pos-web/src/routes/stock-movement-form.tsx`
- `apps/pos-web/src/routes/stock-movement-form.test.tsx`

Parent-owned tracking surfaces:
- `odd/tasks/pos05-c6-stock-movements.md`
- `odd/tasks/mundo-kawaii-pos-mvp.md`

## Routing and verification
- Read-only exploration was delegated to `gentle-ai-explore` because understanding C6 required mapping 4+ files. It found that the C6 form/test drafts already describe receipt, signed adjustment, and cashier-denial behavior; route wiring is missing. No product decision blocks implementation.
- Implementation is delegated to a single `gentle-ai-worker` because at least three non-trivial application files are in scope. A second bounded writer added a deferred-sign-out regression and synchronous guard after the independent verifier found an in-scope pending-sign-out race. Writers read this feature file and do not commit or edit parent-owned tracking surfaces.
- Strict-TDD focused command (from `apps/pos-web`):
  `bun run test src/routes/stock-movement-form.test.tsx src/routes/home.test.tsx src/routes/product-admin-form.test.tsx src/routes/inventory-view.test.tsx src/lib/catalog-inventory.test.ts`
- The worker must run the exact focused command first against the unmodified draft to capture RED, then again after integration to capture GREEN. No RED/GREEN result is assumed before it is observed.
- Receipt-driven development is off. After the writer returns, the parent will run native ASSESS and follow its risk-gated verification plan. A separate verifier will be delegated if that plan requires one.
- Final checks: full app test suite, `bun run typecheck --force`, `bun run build --force`, and scope/diff checks as prescribed by the verifier plan. No live Supabase project check is authorized/configured by this task; report it as pending if unavailable.

## Progress
- [x] Reconciled the POS MVP task ledger and Engram mirror with the current checkout and prior C5 evidence.
- [x] Confirmed current parent state: branch `feat/pos05-05-product-admin`, HEAD `8153118`; only the two C6 draft files were untracked.
- [x] Mapped the C6 form, test, route integration, adapter/RPC contracts, and checks with a read-only scout.
- [x] Created branch `feat/pos05-06-stock-movements` from the current C5 branch; no source files were modified by branch creation.
- [x] Created and read back this feature document and its full Engram mirror (observation `1547`).
- [x] Rebuilt the visible TODO projection from the two feature tasks.
- [~] C6-IMPLEMENT — Integrate and test administrator stock movements.
- [x] The bounded writer observed TDD RED before production integration (27/28 focused tests passed with the missing route behavior failing), corrected one adjustment-input test expectation, then observed focused GREEN (5 files, 34 tests passed). The first post-integration run was 33/34 and failed only on that expectation; the corrected rerun passed.
- [x] Initial independent verification (before the race correction) passed `bun run test --force` (7 files, 36 tests), `bun run typecheck --force`, and `bun run build --force`; build emitted the non-fatal React list-key warning in `home.test.tsx`. No live Supabase integration was run.
- [x] Native ASSESS returned `unassessable` because the candidate contains untracked files. With RDD off, its plan treats the candidate as high risk and requires a separate independent verifier; the writer's focused self-verification and independent checks are recorded above.
- [x] Corrected the sign-out race with a synchronous in-progress guard and deferred-sign-out regressions for receipt and adjustment. Strict TDD observed RED (34 passed, 2 failed because both RPCs started while sign-out was pending), then GREEN (5 files, 36 tests passed); the existing pending-write-after-logout case also passes.
- [x] Native ASSESS after the correction again returned `unassessable` because the candidate contains untracked files. With RDD off, its plan again requires independent verification.
- [x] Independent verification of the corrected candidate passed `bun run test --force` (7 files, 38 tests), `bun run typecheck --force`, and `bun run build --force`. A non-fatal React list-key warning appeared in `home.test.tsx`; no live Supabase integration was run. The verifier found no in-scope functional issue and source-checked sign-out failure behavior; it did not separately exercise a rejected sign-out.
- [x] Measured the application slice at 632 authored diff lines: `home.tsx` +150/-1 (151), new `stock-movement-form.tsx` (123), and new `stock-movement-form.test.tsx` (358).
- [x] The user approved a `size:exception` for this exact 632-line C6 child slice; no additional paths or work are covered.
- [x] Parent spot-check reran `bun run test --force`; 7 files and 38 tests passed. The non-fatal `InventoryView` React key warning remains.
- [x] Committed the verified application work unit as `490590c` (`feat(pos): add admin stock movement controls`); the commit contains only the three authorized C6 application paths (631 insertions, 1 deletion). The scoped staged-diff check passed.
- [~] C6-CLOSE — Update the POS MVP ledger with C6 evidence and commit both ODD task records. No push, PR, or merge occurred.

## Next step
Record commit `490590c`, verification outcomes, and the exact size exception in `odd/tasks/mundo-kawaii-pos-mvp.md`; then commit the two ODD task records as a documentation/evidence work unit. Do not push, open a PR, or merge.
