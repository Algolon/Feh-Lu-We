# VEG-R01 — owner-authorized Hybrid activation

14 October 2026. Following the published comparison and its explicit costs/limitations, the owner instructed: **“Geweldig, merge en deploy”**. Hybrid is selected as the ordinary-game default for live testing. This supersedes the conservative pre-authorization baseline decision in REPORT.md and recovery/CLOSEOUT.json; those measurements remain historical evidence.

## Scope

Only the default profile changes from baseline to Hybrid. All reviewed prototype geometry and fallback repairs remain unchanged. `?veglod=baseline` remains available for a controlled comparison/rollback of LOD selection. The merge includes the inherited GEO-R01 baseline repairs and preserves current PB01, SKY-C01 and TUT-R01/TUT-R02 work through ordinary merge integration. No production budget threshold, quality setting, gameplay state or puzzle logic is altered by activation.

## Checks

Latest production `3a12a69` + VEG Hybrid-default combination: typecheck/build pass; 289/289 units pass. Normal default entry (no veglod parameter), low 768×432 DPR1: BOSLUST, dense woodland and conservatory deck complete without page errors on both multi-draw and forced instanced fallback. Scene metadata confirms Hybrid on both paths. Camera submissions: 301,408 / 268,126 / 337,897 triangles; multi calls 89 / 57 / 170 and fallback 140 / 117 / 182. Evidence: `activation/qa/`.

## Accepted live-test limitations

This is authorization for live evaluation of the disclosed quality/cost tradeoff, not a claim that all release acceptance gates have passed. Hybrid's recovered moving geometry increment is median +29.7%, maximum +38.5%; inherited call-guide failures remain. Earlier browser navigation timeouts and incomplete wider regressions remain documented. Physical Samsung cadence, sustained heat and capacity are untested. The owner sees and accepts proceeding to live testing with these known limitations; no relative allowance or failed assertion is silently changed.

Before deployment, the default production branch was `3a12a69`; the feature activation commit and merge/deployment outcome are traceable through GitHub PR and Actions history. Baseline remains selectable to compare tree behavior on the same live build.
