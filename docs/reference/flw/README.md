# Feh Lu We stable-ID reference library

Recovered existing image outputs for DEV-04D D0 reconciliation. No artwork was generated, redesigned or reconstructed in this import. No gameplay, code, puzzle or deployment changes.

Start with [MANIFEST.md](MANIFEST.md) for browsing and [MANIFEST.json](MANIFEST.json) for automation. All manifest `path` and `companionPaths` values are relative to repository root. There are 126 known stable-ID records: D2 001–050, S3 001–045, K3 001–004, RSV 001–027. Missing/unknown metadata is null; the full original Master Inventory v0.1 inline table could not be retrieved, so these records do not replace that inventory.

## Recovered sources

The working Git library contains **67 selected reference PNGs: 32 D2, 27 S3, 4 K3 and 4 RSV**, plus **3 unchanged SVG companions** for RSV-007/012/015. It intentionally excludes 179 provenance-only rejected, superseded, ambiguous, unassigned and alternative PNG binaries.

The complete **246-PNG recovery archive master** is separately preserved as three independently extractable ZIP parts plus `FLW_Recovery_Archive_Master.json`. All 246 PNGs, 3 SVGs and original manifests/provenance are included unchanged. Extract all ZIP parts into one directory to restore the original paths. [ARCHIVE_MASTER.json](provenance/ARCHIVE_MASTER.json) records the persistent archive identities, ZIP digests, per-file digests and restoration paths. The historical recovery commit is a source identifier, not the archive retention mechanism.

[SOURCE_INDEX.json](provenance/SOURCE_INDEX.json) retains all 246 source digests, dimensions, aliases and recovery statuses. Schema v2 distinguishes storage: `WORKING_REFERENCE_LIBRARY` has a repository `path`; `RECOVERY_ARCHIVE` has `path: null`, an `archivePath` inside the archive and an `archivePart`. The same convention applies to manifest alternatives. Missing alternative binaries in Git are intentional, not a loss of recovered sources. [RECOVERY_INDEX.md](provenance/RECOVERY_INDEX.md) identifies both storage locations.

Canonical means selected recovered reference path. It does **not** mean production approval. Only `APPROVED_2D`, `APPROVED_3D_REF` and `APPROVED_KEY_REF` have recovered approval evidence; `REVIEW_READY` has a viewable reference and an unresolved approval gate. `canonical: false` assets have no selected production/reference winner; inspect alternatives for reconciliation. Do not choose the most recent timestamp as a substitute for owner approval.

## DEV-04D D0 rules

1. Read the manifest and the notes for each exact stable ID before using an image. Keep asset IDs separate from gameplay/save key mappings.
2. D0 can resume source inspection and placement reconciliation on this branch. Finish ambiguity/approval reconciliation before treating REVIEW_READY imagery as final production art. Do not automatically integrate every recovered source.
3. Use approved D2 images as direct 2D production **candidates** subject to texture/readability checks. D2 previews/crops are not native high-resolution masters. S3/K3 images are modelling references, never delivered meshes or certified orthographic drawings.
4. RSV-019, RSV-020, RSV-021 and RSV-022 remain **PENDING / no usable final source**. Attempted route boards are provenance only. All RESERVED content retains its puzzle/layout release gates; workflow pause is preserved.
5. Exact visible signage remains **Copacabana Room**. A wrong embedded ID in an image never overrides the inventory (including the unassigned globe, wine-cellar reference and FLW-S4-025 ornament).
6. Preserve provenance when adding a later approved revision; update one stable-ID record and identify what it supersedes. Do not discard rejected sources by filename similarity.

The existing [DEV-04 reference pack](../dev04/REFERENCE_INDEX.md) remains the architectural, construction, environment and six-sheet calibration collection. It has not been replaced or copied into this library. The existing [DEV-04C reference manifest](../../dev04c/DEV04C_REFERENCE_MANIFEST.md) is a historical baseline; this new manifest supplies its previously unavailable stable-ID sources.

## Boundaries and missing material

The full conversations and generation attachment IDs are not directly available in Work. Targeted history searches exposed partial owner decisions and summaries; stored image files and existing ZIP source manifests supply byte evidence. Where exact approval/selection could not be established, it remains unverified. Actual unassigned files are preserved in the external recovery archive for manual reconciliation, rather than being renamed into invented stable IDs.

For complete reconciliation, export the original Master Inventory v0.1 table and the short messages surrounding ambiguous generations, identifying the exact selected images. Upload actual original image files for the source gaps below if they exist in the chats. Existing ambiguous source files in the separate archive need selection evidence, not substitutes.

Source-recovery gaps (no usable image conclusively mapped):

FLW-D2-043, FLW-S3-038, FLW-S3-040, FLW-S3-041, FLW-S3-042, FLW-RSV-017, FLW-RSV-019, FLW-RSV-020, FLW-RSV-021, FLW-RSV-022, FLW-RSV-023, FLW-RSV-024, FLW-RSV-025, FLW-RSV-026, FLW-RSV-027.

See [VALIDATION.md](VALIDATION.md) and [provenance notes](provenance/README.md).

## Lean production history

This branch is rebuilt directly from production base `6c5e5c6371d049197b48f47e735eb46c19b6beda`. The earlier three full-recovery commits are not ancestors of the lean branch. Archive-only PNGs are excluded from every commit being merged into production, rather than deleted in a later commit. No Git LFS is introduced. Selections, stable IDs, approvals and holds are unchanged; canonical does not mean approved.
