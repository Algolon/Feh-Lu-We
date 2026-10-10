# Lean working reference library validation

**PASS** — 1976 / 1976 package checks.

- Exactly 67 selected PNG reference files and 3 unchanged SVG companions remain in Git. Every selected path resolves, full PNG decoding succeeds and retained checksums match the full-recovery version.
- All 126 asset records retain their canonical selections, approval statuses, holds and metadata. No rejected or superseded source becomes canonical; RSV-019–022 remain PENDING.
- All 246 source digests and every alternative record remain indexed. Archive-only records have intentional null repository paths and verifiable archivePath/archivePart locators.
- The full 246-PNG + 3-SVG collection and original provenance were verified inside three ZIP parts and saved separately with a master index. ZIP and master digests are recorded in provenance/ARCHIVE_MASTER.json.
- Only docs/reference/flw/** and the cross-link in docs/reference/dev04/REFERENCE_INDEX.md are staged. No gameplay/code changes.
- Local npm ci, typecheck, unit tests and production build pass. The GitHub build on the exact rewritten branch HEAD is a separate merge gate.
- The lean branch is rebuilt directly from production base 6c5e5c6371d049197b48f47e735eb46c19b6beda, so the 179 archive-only PNG binaries never enter its import history. No Git LFS.

Canonical does not mean approved. This pass changes storage and history only; it does not resolve outstanding art or puzzle approval gates. See VALIDATION.json for exact gap lists and sizes.
