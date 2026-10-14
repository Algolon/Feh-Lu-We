# VFC-01 — controlled closeout (VFC-C01)

**VFC-01 — RESEARCH COMPLETE / PARTIAL EVIDENCE / OWNER REVIEW PENDING**  
Closed 14 October 2026 at the owner's request. No remaining media recovery or follow-up package is executed by this closeout. No production adoption, merge, deployment or permanent budget change occurred.

## Scope and durable checkpoint

Bounded Visual Fidelity Calibration in exactly two zones: Library and Portugal cottage + terrace. ART-01 — Crafted Stylized European Woodland Manor — remains approved. This closes the research iteration, not its outstanding evidence or approval gates.

- Repository/assigned branch: `Algolon/Feh-Lu-We` / `vfc01-visual-fidelity-calibration`.
- Remote source/evidence HEAD verified: [`106f68cf261bd2585fc783a7c683e22b04a459e4`](https://github.com/Algolon/Feh-Lu-We/commit/106f68cf261bd2585fc783a7c683e22b04a459e4); tree `2b75ad95d9930555b18394ed49a07384bcdd87d0`. The C01 documentation commit is its child; use the branch's C01 commit for this handover.
- Original calibration production base: `ae2a036e783400355c8d137f24e16c33bb1a8323`.
- Production observed at startup: `ccr-75ef4113-kfkimm` at `fe74db0b471d7816d840e6c223b92950adf5639f` (newer ENV-L01/UI baseline). It was not incorporated into the calibration or modified by C01.
- No checkout/local HEAD or uncommitted VFC work existed in this session's task workspace. The remote tree is authoritative; lost temporary assets are not reconstructed. Other sessions' local-only material is inaccessible and is not counted as delivered.
- FLW-PDI-01 v0.1 was read from the named project source; no AGENTS/PDI file was found in the audited VFC tree. This task explicitly applies its checkpoint and isolation rules.

## Completed and incomplete

Source, deterministic capture methods, measurements, recommendation, reports, viewer and prior validation records are remote-committed. All **90 main frames** (six cameras × five variants × colour/clay/neutral), **nine selected frames**, twelve retained baseline images and the grounded front contact sheet are reachable. These overlapping frame categories must not be added together as a file total.

The actual remote tree contains **130 of the original 201 expected files; 71 are missing**. The 201 includes reports/JSON/viewer as well as media; it excludes recovery bookkeeping and these new handover documents. C01 documentation does not complete any missing media.

| Outstanding category | Files | What remains unproven visually |
|---|---:|---|
| Dynamic MP4s | 7 | Paired V3/V4 architecture, hero, vegetation and small-object continuity; V3 vegetation alone cannot establish a comparative gain |
| LOD posters/keyframes | 24 | Inspectable boundary states for each of those eight sequences; static endpoints cannot alone establish temporal smoothness |
| KTX2/WebP views | 4 | The specific format-control appearance; original-source encoding fidelity remains unavailable even after round-trip views are restored |
| Rendering/quality sweeps | 36 | Independent visual attribution across DPR, shadows/quality contexts, normals, anisotropy and material controls; existing measurements remain retained |

The previous 129-present/72-missing inventory predated attachment of `combined-lod/V3-vegetation.mp4`. Its committed blob is `acdfca49a7b90d327869817dbc3272026695afeb`, **1,426,084 bytes**, at the checkpoint above. All previously recorded present-file sizes/Git blob SHAs match the audited tree. The MP4's original expected SHA-256/codec metadata is retained, but C01 does not download, decode or newly verify those binary claims. It has no reproduction entry in `RECOVERY_CAPTURES.json`; C01 does not invent one. Recover exact video provenance before using it as matched dynamic evidence.

[UPLOAD_AVAILABILITY.json](UPLOAD_AVAILABILITY.json) lists every missing path. [Original manifest](EVIDENCE_MANIFEST_ORIGINAL.json), [capture provenance](RECOVERY_CAPTURES.json) and historical recovery records are preserved. Missing assets remain a failed evidence-completeness gate, not waived work.

## Review now

Use the [main index](README.md) and [offline comparison viewer](index.html). GitHub displays HTML source; open the viewer from a normal checkout or serve it locally as already documented. No new hosted deployment is provided.

1. Selected → equal DPR 1 → cottage-front, cottage-player, library-player. Inspect at normal player scale; use the [grounded front contact sheet](compare/VFC01_cottage_front_equal_DPR.png) and [selected files](compare/) directly if preferred.
2. Selected → DPR 1.25 on the same cameras; separate resolution from construction/material benefit.
3. V1 materials, V2 geometry, V3 combined and V4 visibility: colour, clay and neutral controls across Library and cottage/terrace cameras. Full material variants include rejected plaster.
4. [Available V3 vegetation video](combined-lod/V3-vegetation.mp4): a deterministic illustration only, with its V4 partner and all posters still unavailable.

C01 makes only availability/status corrections to the existing viewer: it exposes the committed video, removes unavailable posters and labels the seven missing clips. One bounded static/reference and script smoke check covers all 78 comparison selections and eight video slots. This is not browser playback, fresh visual approval or a new full regression.

## Findings and limits

[Recommendation](VFC01_RECOMMENDATION.md): selective support construction/silhouette improvements and directional timber/coherent UV treatment are promising; Library-wide gains are modest compared with the stronger Portugal terrace view. Broad plaster replacement failed. Universal PBR/normal mapping and maximal DPR are unjustified. DPR 1.25 is a phone-test candidate, not an approved default. Shadow striping remains unresolved. Type-specific visibility/LOD principles merit review; the diagnostic micro fade is deferred.

[Performance](VFC01_PERFORMANCE_REPORT.md): the old 250k triangle guide is a soft reference, not a universal hard engine limit or permission for a new budget. Measure camera triangles, shadow geometry, draw calls, texture memory, pixels and actual phone frame pacing separately. SwiftShader render/readPixels timings, host drift and favourable regular-grid probes do not forecast device FPS or sustained thermal behaviour.

[LOD report](VFC01_VISIBILITY_LOD_REPORT.md): 172 recorded deterministic poses are not collision-walk gameplay. Four presentation frames/s is not measured FPS. Diagnostics move the hero fixture/add a small card; they are not ordinary production scenes. Camera visit order and vegetation hysteresis affect counts. Broad controls predate final corrections; each recovery must preserve explicit source/build provenance rather than silently attaching historical timings to new media. Private-field adapters are research tools, not integration interfaces.

Existing [validation records](validation/README.md) remain historical results for their documented runs (267 unit tests, builds, isolation and browser checks). C01 reruns none of them. Physical-device results and owner visual judgement remain absent.

## Approval gates and next work

- **Owner visual selection:** [VFC-R01](VFC01_NEXT_WORK_PACKAGES.md#vfc-r01--owner-visual-review) may start from current static evidence. Report decision labels are research recommendations, not owner approvals.
- **Dynamic claims:** the relevant [E01 subpackage](VFC01_NEXT_WORK_PACKAGES.md#vfc-e01--dynamic-lod-evidence) must establish matched movement evidence before continuity/transition conclusions are accepted.
- **Control-dependent claims:** [E02](VFC01_NEXT_WORK_PACKAGES.md#vfc-e02--supplementary-comparison-evidence) restores or explicitly dispositions controls; an essential missing control blocks its specific claim, not all research review.
- **Phone fidelity/cost:** [M01](VFC01_NEXT_WORK_PACKAGES.md#vfc-m01--real-phone-performance-and-fidelity) follows relevant visual selections and the [existing phone protocol](VFC01_PHONE_PROTOCOL.md).
- **Adoption planning:** [D01](VFC01_NEXT_WORK_PACKAGES.md#vfc-d01--adoption-and-dev-04d-planning) requires separate authorization and sufficient visual/device/dynamic evidence; it produces a brief only. Implementation, merge and deployment require later explicit owner approval.

All follow-up work remains planning only. C01 ends with a documentation commit and remote ref/tree verification on the existing isolated branch. **VFC-01 research iteration closed with partial evidence; owner review pending.**
