# VEG-R02 — recovery audit, 2026-10-15

Status: **BLOCKED: original source checkpoint not recovered. Not a review candidate.**

This is a new recovery record, not the original work document. No vegetation implementation was reconstructed or replaced.

## Verified repository state

- Isolated recovery branch: `recovery/veg-r02-missing-checkpoint`.
- Recovery base: production/default `ccr-75ef4113-kfkimm`, observed HEAD `ee72f3e06c15fc2cf5289c0f30d4b69b7947085d`.
- GitHub file lookup on `veg-r02-reference-style` returned 404, "No commit found for the ref". Full remote head listing also lacks that branch.
- A fresh bare clone of the advertised remote branches was searched. No reachable commit changes `docs/development/workstreams/VEG-R02.md`. Commit subject search for VEG-R02/reference-style/birch/vegetation visual found no R02 checkpoint.
- Original checkout location, recovered from conversation context: `/workspace/scratch/c1bbbda816b1/Feh-Lu-We`. That checkout is absent in this runtime. Its parent exists, but contains no project files.
- Available local repository `/workspace/scratch/ad63f100ed5d/feh` belongs to Mushroom Grove. It was inspected read-only, including refs/reflog and unreachable-object inventory. No R02 branch or commit was identified. It was not checked out, reset, committed, or modified.
- GitHub VEG search found PR #22 (R01 activation) and #31 (rejected oak experiment), no original Work R02 PR.
- Persistent-file searches for VEG-R02, its branch and document did not resolve an original source archive or work document.

Search scope is the current filesystem, advertised remote history, returned PR search results and available persistent-file/context search. Absence here does not prove the original work is irretrievably lost elsewhere.

## Historical reports — not reproduced evidence

The user confirms three approved birches are the style anchor. Conversation retrieval reports locally saved work on `veg-r02-reference-style`, blocked push, no deployment. Early reports mention typecheck/build/296 tests, then extension to trees, shrubs, ground plants, stumps and branches. Later reports mention seven low-quality scenes up to about 351k triangles/139 calls, two rendering paths and four light phases; portrait QA and documentation remained incomplete.

No original model files, commit SHA, screenshot set or raw test results for those reports have been recovered. They cannot be promoted to verified passes.

## Preserved decisions

- Crafted stylized European woodland manor; sculpted/painterly forms, intentional asymmetry, layered readable crowns and controlled authored colour/shading.
- Preserve approved birches and successful models. Do not begin again from production vegetation.
- `veg-art-r02-oak-sculpt` / PR #31 is explicitly rejected. Do not copy or integrate it.
- Preserve VEG-R01 Hybrid architecture, object identity, placements, gameplay and PB01 policy.
- Mushroom Grove, EXT-R02 and setpieces are separate streams. No integrations performed.
- No remote push, merge or deployment authorized by this recovery task.

## Reliable predecessor

VEG-R01 is recoverable at branch `veg-r01-vegetation-lod`, observed remote head `9d427f40e57b1a6c889a475e3d44216820cef336`. Production includes its workstream record, assessment scripts and evidence in `docs/veg-r01/`. It is a technical predecessor, not the missing approved R02 artwork. Its record explicitly retains physical-device and browser limitations; do not inherit its results as R02 validation.

## Validation in this recovery

Repository/ref/path/history checks only. No runtime code changed. Typecheck, build, unit/browser tests, screenshots, LOD/performance comparisons and physical Android testing were not run: without the candidate they would validate a different implementation. No completion/performance claim is made.

## Required input and next action

Recover the original checkout as a Git bundle or full archive including `.git`, uncommitted/untracked source and `docs/development/workstreams/VEG-R02.md`; include its screenshots/test outputs if present. A reachable original commit with all source would also unblock recovery. A SHA alone is insufficient if the commit is inaccessible or later changes were uncommitted.

Verify the recovered branch/HEAD/status and preserve its exact content before changes. Then inspect the approved birch pixels and existing family; complete portrait and moving LOD QA, matched baseline counts under unchanged PB01 policy, targeted corrections, tests and documentation. Keep physical Android validation pending if unavailable. Submit the original-quality candidate for owner review; do not publish.

Only this recovery document and the observed ref snapshot are changed by the recovery checkpoint.

## Final directed recovery pass

The owner explicitly authorized publishing the isolated documentation branch on 2026-10-15, with no merge or changes to other branches. Original commit `ee5b5e847c38bd80e91325e7a355f2ff921e8a7a` exists: exactly two added documentation files, 107 insertions, no runtime or workflow changes. The publication extends that commit with this final audit, machine-readable search summaries and a reconstruction proposal.

- Examined 340 unreachable commits in the recovery object database, including each root file listing and subject. No original R02 document; the only birch/reference search match was historical `0159007`, already known. This historical object being unreachable from the current branch snapshot does not make it R02.
- Inspected the available repos/worktree lists/reflogs and local archive/patch/bundle/snapshot filenames. No original checkout, export or R02 snapshot found. The available preview repo and `mushroom-r03-preview.tar.gz` are explicitly Mushroom Grove R03, not R02 vegetation. The nominal `/workspace/.git` is not a usable Git repository.
- GitHub commit search for `VEG-R02` returned no results.
- Queried all 380 available Actions runs (four pages) and all 81 current artifact registrations. No branch/title/artifact metadata matched `veg-r02`, `reference-style` or `birch`. No candidate R02 build artifact was identified for download. This does not claim inspection of unrelated artifact payloads or deleted/expired records unavailable from the API.
- Original Work-session access available here supplies conversation context, including the former path and historical reports, but no raw source/export or exact R02 SHA. It does not expose the former filesystem. No verifiable additional source-retrieval route was found.
- Both owner-supplied historical commit objects and their relevant source files are readable. Findings and the staged proposal are in `VEG-R02-RECONSTRUCTION.md`; neither historical commit is treated as the missing approved style.

**Recovery investigation closed: the original VEG-R02 implementation is not recoverable through the currently available sources.** This conclusion is scoped to available sources, not proof of deletion from every possible account/session backup.

No models were implemented. No new render, test or physical-device validation is claimed. Next action is owner review of the reconstruction proposal, beginning with only the three-birch artistic gate while retaining VEG-R01 architecture and excluding the rejected oak experiment.
