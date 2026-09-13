---
schema: gentle-ai.sdd-research/v1
revision: 2
outcome: blocked
change: define-mvp-foundations
---

# Historical printing research record: blocked

## Outcome

This research run is **blocked** and is retained as a historical audit record. The corrective request supplied bounded parent-fetched passages and a first-party observation, but this runtime's evidence contract explicitly granted neither documentation nor open-web evidence and required admission denial. The supplied material therefore did not support validated claims, a comparison, or a dependency recommendation in this run.

This blocked outcome no longer blocks proposal readiness. The later planning premise also supersedes the earlier mandatory proof-of-concept gate: printing remains planned but may be deferred and must never block MVP implementation, acceptance, or delivery. The absence of validated provider research or actual-hardware evidence must be reported honestly and prevents a claim that printing works; it does not stop remaining work.

## Research questions

1. How do QZ Tray, an Electron wrapper using `webContents.print`, and Neodynamic JSPrintManager compare for silent USB thermal printing from an offline-first web POS on one Windows terminal?
2. Which approaches continue to operate fully offline after installation and initial configuration?
3. What trust, signing, certificate, and local security controls does each approach require?
4. What installation, update, printer compatibility, raw ESC/POS, licensing/cost, failure-recovery, implementation, and operational constraints apply?
5. Why do the browser print dialog and cloud print services fail the silent/offline requirement, if admitted evidence supports that conclusion?
6. Is a bounded architecture direction supportable, or must selection remain behind a hardware proof-of-concept and procurement gate?

## Admission

| Field | Value |
|---|---|
| Decision | Denied |
| Reason | The selected research runtime declared no evidence grants and explicitly forbade treating parent-provided evidence as an evidence grant. |
| Requested source classes | User-provided operational evidence; official vendor documentation; official web-platform documentation |
| Observed documentation grants | `[]` |
| Observed open-web grants | `[]` |

## Retained research intent

The retained request compares QZ Tray, an Electron wrapper using `webContents.print`, and Neodynamic JSPrintManager across offline behavior, silent operation, trust and key risk, installation, updates, compatibility and ESC/POS unknowns, licensing unknowns, recovery, and workload. It requests a hardware proof-of-concept gate rather than an unsupported final dependency selection.

The corrective input included a first-party observation about the current Siigo POS and parent-fetched passages attributed to official QZ Tray, Electron, JSPrintManager, and MDN documentation. Their provenance is preserved here as **unadmitted input only**; none is treated as a source or validated claim.

## Sources

No sources were admitted.

## Validated claims

No validated claims were emitted. No provider comparison was validated.

## Historical interpretation and superseding decision

This artifact records only the failed evidence-admission run; it is not the current proposal-readiness decision and must not be cited as successful research or as support for selecting a dependency.

The current planning decision supersedes the earlier pre-proposal printing gate:

- Proposal readiness remains **true** because this blocked comparison is not a readiness gate.
- Silent, direct, offline USB thermal printing remains a planned capability and may be deferred.
- QZ Tray, Electron, JSPrintManager, and any other print-bridge approach remain unselected by this research record.
- Printing implementation and proof-of-concept work must not block MVP implementation, acceptance, or delivery.
- A claim that printing works or is supported requires retained evidence from the actual Windows terminal and USB thermal printer; absent that evidence, printing must be labeled unavailable or unverified.

This non-blocking rule is a product-planning decision, not a recommendation validated by this blocked research run.
