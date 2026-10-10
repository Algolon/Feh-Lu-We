# Recovery provenance

This directory preserves provenance metadata, checksums, indexes and accessible source-pack notes. The working image sources live in the selected family directories; the complete original recovery set is separately retained in the external archive master. It contains no private chain-of-thought and no new artwork. Source filenames and Library file identities are historical byte/provenance identifiers, not stable gameplay IDs. Repository source paths are public references; no expiring URLs, credentials or full private chat transcripts are stored.

- [SOURCE_INDEX.json](SOURCE_INDEX.json): exact SHA-256, measured dimensions, historical aliases, byte origin, assigned IDs when supportable, canonical path and recovery status.
- [RECOVERY_INDEX.md](RECOVERY_INDEX.md): human-browsable index to all 246 unique PNGs.
- [ARCHIVE_MASTER.json](ARCHIVE_MASTER.json): persistent identities and checksums for the complete 246-PNG recovery archive. The original `recovered/` binaries exist there, intentionally outside production Git history. Their archive entry names do not grant canon or approval; UNASSIGNED files retain their original associations.
- `source-notes/`: unchanged recovered package READMEs/manifests, R00 preproduction contracts/audit, and unassigned-globe register.

## Retrieval limitations

The original inline Master Inventory v0.1 and complete message-by-message generation timeline were not accessible. Targeted history retrieval covered Master inventory ontwerpen; Batch 4; Batch 5; Sleutel Audit En Inventaris / Key Prop Family; and RESERVED workflow. It supplied partial owner decisions rather than full attachment-linked conversations. Approval fields distinguish those recovered decisions from assistant-only claims. Generation-to-file matching uses original stable-ID filenames, source archive assignments and recovered inventory subject descriptions; subject-only candidates are not proof of exact owner selection.

## Preserved decisions

- Calibration v1 / Batch 01 approval: refined FLW-D2-002 and FLW-S3-004, followed by D2-007/026/028/046. Earlier combined-artboard splits are superseded.
- Four consecutive owner key acceptances were retrieved at 2026-10-09 19:45:06Z, 19:47:50Z, 19:50:50Z and 19:52:31Z. K3-001→frontKey, K3-002→studyKey, K3-003→shedKey, K3-004→consKey (both conservatory doors). No K3-005+ is invented.
- Batch02 resolution-pass notes explicitly say enlarged artboard crops, not native detail masters or validated turnarounds. Native later standalones are selected where byte/subject matches exist; original previews and enlargement exports survive as provenance.
- Batch03 S3-014/016/017 combine artistic concept crops with existing coherent technical blockouts. Final modelling must reconcile the two; no GLB is promoted or imported into game assets.
- Batch04 existing manifest says review_candidate. Owner acceptance of exact files was not retrieved, so these are REVIEW_READY rather than silently APPROVED.
- D2-011 owner rejection: extra-limb/badger anatomy errors. REGENERATE; rejected sheets preserved, no canonical output selected.
- S3-001 wrong garden-subject attempts; S3-003 garden arch vs interior sculpture; S3-010 too finished; S3-018 antler/leg simplification; S3-032 oak-leaf planter instead of bosdieren: preserve these holds. Correct later single-subject candidates remain REVIEW_READY when exact owner approval is unknown.
- D2-024/032/033/035 and D2-045 had repeated/wrong-subject attempts. Recovering correct-looking later artwork does not retroactively approve earlier attempts.
- RSV-002 needs exact DS01 text/photo-caption refinement. All route RSV-019–022 production was stopped at owner request; no usable final source is supplied. Wine-cellar/globe/Portugal references with misleading embedded RSV labels remain unassigned.

If future evidence changes a classification, update the manifest against the exact SHA-256 and retained alias, not against the visual subject alone.

## Storage contract

Schema v2 keeps source digests and every recovery/asset status unchanged. A non-null `path` resolves in the working Git checkout. A `RECOVERY_ARCHIVE` source has `path: null`, with `archivePath` and `archivePart` referring to the separately retained ZIP master. Historical source notes retain their original package-specific names and paths; these are provenance records, not current repository path promises. The complete original metadata is also included unchanged in the archive.
