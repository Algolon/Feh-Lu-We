# VFC-01 — Visual Fidelity Calibration

Isolated research branch: `vfc01-visual-fidelity-calibration`. Verified production base: `ccr-75ef4113-kfkimm` at `ae2a036e783400355c8d137f24e16c33bb1a8323`. Exactly two zones: Library and Portugal cottage + terrace. ART-01 remains the direction.

**VFC-01 — RESEARCH COMPLETE / PARTIAL EVIDENCE / OWNER REVIEW PENDING.** The owner closed this research iteration on 14 October 2026. At verified evidence HEAD `106f68c`, **130/201 expected files are present and 71 missing**: seven MP4s, 24 LOD keyframes and 40 supporting images. All 90 main frames and nine selected frames are available, plus the committed V3 vegetation video. See [formal closeout](VFC01_CLOSEOUT.md), [bounded next work packages](VFC01_NEXT_WORK_PACKAGES.md) and [actual availability](UPLOAD_AVAILABILITY.json). Historical recovery records remain provenance; no production adoption or complete-media acceptance is implied.

**Owner Decision 01 — Portugal A/B reviewed:** [decision record](VFC01_OWNER_VISUAL_DECISIONS.md). **REJECT** the evaluated selected candidate and floor treatment; **DEFER** dedicated geometry investment; other materials **NO DECISION**. Documentation only; no implementation or supplementary investigation authorized. Library, DPR and other rendering scopes remain undecided.

[The offline evidence viewer](index.html) marks unavailable assets explicitly and exposes [the available V3 vegetation video](combined-lod/V3-vegetation.mp4). `EVIDENCE_MANIFEST_ORIGINAL.json` and `RECOVERY_CAPTURES.json` preserve expected-package and reproduction provenance. GitHub shows HTML source; open the viewer from a checkout or local server. [The recommendation](VFC01_RECOMMENDATION.md) is retained, but its experimental visual evidence is incomplete. Frames retain 915×412 content; video encoding pads the width to 916. Video playback is four presentation frames/s, not measured gameplay FPS.

| Report | Contents |
|---|---|
| [Baseline audit](VFC01_BASELINE_AUDIT.md) | Actual renderer, materials, batching, texture and visibility architecture |
| [Experiment matrix](VFC01_EXPERIMENT_MATRIX.md) | Isolation, cameras, variants, controls, reproduction commands |
| [Materials](VFC01_MATERIAL_REPORT.md) | Selected families, rejected plaster, UV scale, licensing and KTX2 limitations |
| [Geometry](VFC01_GEOMETRY_REPORT.md) | Six objects, construction, edge/normal treatment and cost |
| [Visibility/LOD](VFC01_VISIBILITY_LOD_REPORT.md) | Four classes, current bands, continuity and rejected/deferred transitions |
| [Performance](VFC01_PERFORMANCE_REPORT.md) | Counts/bytes, DPR, triangle/shadow/material controls and timing limits |
| [Recommendation](VFC01_RECOMMENDATION.md) | Explicit decisions and proposed standards for owner review |
| [Phone protocol](VFC01_PHONE_PROTOCOL.md) | Compact real-device checklist and export instructions |
| [Recovery history](VFC01_RECOVERY_STATUS.md) | Separates the lost initial run from freshly rebuilt evidence |

Raw JSON: [main matrix](compare/matrix.json), [broad controls](compare/sweeps.json), [selected follow-up](compare/selected.json), [KTX2](compare/ktx.json), [LOD sequences](combined-lod/sequences.json). [Evidence manifest](EVIDENCE_MANIFEST.json) records hashes, dimensions and decoder checks. Broad controls/most LOD clips were captured on recovery revision 62e6ab7; final main, selected and small-card captures incorporate the documented final corrections. Counts and methods accompany each run; historical numbers are not substituted.

Validation covers typecheck, both builds, 267 unit tests, save/ID/checkpoint isolation, phone-loop control flow and the existing DEV-04D browser suite. Physical-device results are [pending](phone-results/README.md). No production performance guarantee, merge or deployment is implied. Open the viewer directly or serve the repository locally; test the game using the isolated Vite entry as described in the phone protocol.
