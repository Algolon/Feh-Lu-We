# VFC-01 — owner visual decisions

**Current owner review:** Decision 02 below covers Portugal A/B, Library C and Geometry vs Materials D. **OWNER APPROVED — NO IMPLEMENTATION AUTHORIZED** means approval of the rejection/deferral findings, not approval of the experimental candidate. Decision 01 is retained unchanged below as history. DPR, dynamic LOD and real-device performance remain undecided.

## Owner Decision 01 — Portugal Cottage & Terrace

- Date: 14 October 2026.
- Decision source: the owner's explicit VFC-R01 decision in this session.
- Scope: Comparison A (grounded front view) and B (normal player view).
- Status: **OWNER REVIEWED — NO IMPLEMENTATION AUTHORIZED**.
- Reviewed evidence checkpoint: `631cca1f087a79b1b87cec6e59fd0c3a3d54aaa5` on `vfc01-visual-fidelity-calibration`.
- Calibration baseline: `ae2a036e783400355c8d137f24e16c33bb1a8323`; these are research captures, not the current live ENV-L01/UI-R02 environment.
- Evaluated candidate: selected V3 (`selected=1&tex=512&model=phong&normal=0`), principally equal-DPR 1 comparisons. No DPR or Library decision is implied.

Evidence: [front baseline](compare/baseline-cottage-front.webp), [front selected equal-DPR](compare/selected-equal-cottage-front.webp), [front contact sheet](compare/VFC01_cottage_front_equal_DPR.png), [player baseline](compare/baseline-cottage-player.webp), [player selected equal-DPR](compare/selected-equal-cottage-player.webp).

### 1. Overall decision

**REJECT** the current selected VFC candidate as a production upgrade for the Portugal cottage and terrace.

The demonstrated improvements are insufficiently significant at normal gameplay distance to justify dedicated additional development investment.

Although certain construction details are improved, the overall scene does not become meaningfully better.

This decision applies to the evaluated candidate, not to every underlying technique or future visual-fidelity initiative.

### 2. Construction geometry

Decision: **DEFER further dedicated investment**.

The added structural connections and supports improve constructional plausibility.

However, the perceptual benefit is limited, particularly at the normal player viewpoint.

Preserve constructional coherence as a potentially useful design principle for future asset creation, but do not authorize retroactive geometry upgrades across the estate based on these results.

### 3. Terrace floor

Decision: **REJECT the proposed VFC floor treatment**.

The owner explicitly prefers the original floor appearance.

The VFC treatment reduces perceived visual quality and weakens the desired material and colour character of the Portugal terrace.

Preserve the existing production floor treatment.

Do not adopt the tested VFC floor appearance, and do not interpret its smoother or more restrained appearance as an automatic improvement.

This is a visual design constraint for any future terrace-related work, not an instruction to perform a new floor implementation.

### 4. Other materials

Decision: **NO DECISION — insufficient owner confidence**.

The owner cannot reliably distinguish or judge the value of the remaining material changes from these comparisons.

Do not classify them as approved or rejected solely by association with the floor treatment.

Additional isolated comparisons may be considered if a future design decision requires them, but no supplementary material investigation is currently authorized.

### 5. Investment decision

No further development or dedicated optimization of this Portugal VFC candidate is justified at this stage.

The existing experiment remains valuable as research evidence and as a demonstration of the difference between technical refinement and meaningful perceived quality.

Do not automatically initiate E02 material recovery, additional geometry refinement or production integration as a consequence of this review.

### 6. Implications for future visual development

Future visual-fidelity candidates should demonstrate a noticeable improvement at normal player distance, preserve established material and colour identities, and provide benefits proportionate to implementation and rendering costs.

Prefer improvements in overall perceived scene quality rather than increasing detail for its own sake.

Treat these as evaluation criteria, not authorization for a new development workstream.

### 7. Approval boundary

This owner decision authorizes documentation of the review findings only.

It does not authorize:

- Changes to game source code or materials.
- Replacement or reworking of the existing terrace floor.
- Adoption of the VFC candidate.
- Estate-wide construction refinements.
- New experiments.
- Merge or deployment.

Next review: Evaluate the remaining VFC evidence separately. No decisions about Library, DPR or other rendering techniques are implied by this Portugal review.

### Record interpretation

This owner decision supersedes preliminary agent adoption/testing recommendations for the evaluated Portugal candidate. Existing research reports, measurements, experiments and media remain intact as historical evidence; their recommendation labels are not owner approval.

VFC-01 remains **RESEARCH COMPLETE / PARTIAL EVIDENCE / OWNER REVIEW PENDING** overall: Portugal A/B is now reviewed, while the remaining review scopes are undecided. Evidence completeness is unchanged (130/201 expected files present; 71 missing). This new decision document is outside the original 201-file evidence inventory.

Only this decision record, its index reference and necessary current-manifest bookkeeping are authorized by this documentation step. No follow-up package starts automatically.

---

## Owner Decision 02 — Geometry & Materials

- Date: 14 October 2026.
- Decision source: the owner's explicit VFC-R01 Owner Decision 02 in this session.
- Status: **OWNER APPROVED — NO IMPLEMENTATION AUTHORIZED**.
- Scope: Portugal A/B, Library C and Geometry vs Materials D.
- Reviewed evidence checkpoint: `631cca1f087a79b1b87cec6e59fd0c3a3d54aaa5`; Decision 01 documentation checkpoint: `155e0d0034d1ab0bcc7d82738ae141a76e6f2e5f`.
- Original calibration baseline: `ae2a036e783400355c8d137f24e16c33bb1a8323`; research evidence is separate from current production.

Evidence: the Portugal images linked in Decision 01; [Library baseline](compare/baseline-library-player.webp) and [selected equal-DPR](compare/selected-equal-library-player.webp); [V1 materials](material-only/cottage-player.webp), [V2 geometry](geometry-only/cottage-player.webp), [V3 combined](combined/cottage-player.webp), [V0 clay](clay/V0-cottage-player.webp), [V2 clay](clay/V2-cottage-player.webp) and neutral controls in the [review index](README.md).

### Overall decision

**REJECT** the evaluated VFC geometry/material candidates as production upgrades.

The perceptual improvement at normal gameplay distance is insufficient to justify further dedicated development investment.

### Specific decisions

- **Portugal A/B: REJECT** the evaluated candidate. Constructional plausibility improves, but overall visual quality improves insufficiently.
- **Library C: REJECT** the evaluated candidate. No meaningful visual improvement is noticeable to the owner.
- **Geometry refinement: DEFER** further investment in retroactive detailing of existing assets.
- **Material treatment: REJECT** the tested broad material package as a production upgrade. Individual unassessed techniques remain undecided.
- **Portugal terrace floor: REJECT** the VFC treatment explicitly. Preserve the existing production appearance and its material/colour identity.
- **Construction coherence and UV/material orientation: RETAIN AS DESIGN LEARNINGS**, without authorizing implementation.
- **Broad bevel, PBR and normal-map adoption: NOT JUSTIFIED** by current evidence.

### Strategic implication

Future visual development must prioritize demonstrable improvement in overall scene quality, perceptual readability and ART-01 coherence over additional geometric or material complexity.

Technical refinement alone is not sufficient evidence of player-facing value.

### Approval boundary

This decision authorizes documentation of the findings only.

No source changes, new experiments, production adoption, merge or deployment are authorized.

DPR, dynamic LOD and real-device performance remain separate, undecided topics.

### Relationship to prior records

Decision 02 extends Decision 01 to Library C and Geometry vs Materials D. It retains the Portugal rejection, floor constraint and deferred geometry investment. Rejection of the broad material package does not decide every individual unassessed technique; retained design learnings do not become approved implementation standards.

For these evaluated candidates, this owner decision supersedes preliminary agent recommendations in the historical reports. Reports, experiments, measurements and media remain preserved. No E01/E02/M01/D01 package or production work is started by this record.

The research closeout remains **RESEARCH COMPLETE / PARTIAL EVIDENCE / OWNER REVIEW PENDING** overall, with A/B/C/D now reviewed and the separate remaining topics undecided. Original expected evidence completeness remains 130/201 present and 71 missing; this decision record is outside that inventory.
