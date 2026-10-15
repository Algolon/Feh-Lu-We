# POOL-R01 — integrated turquoise mosaic variant

Owner request: pool floor shapes should match turquoise water/tiles and combine white with turquoise; remove DIEP/ONDIEP from large deck labels and retain smaller, subtler numeric depth indications by the rim.

Reference search: inspected repository images docs/iteration-2/after/06-pool.jpg, docs/iteration-3/after/view-conservatory_pool.jpg and docs/dev03/before/d01-copacabana-inside.jpg; checked mosaic source history and searched Library. Did not identify the specific earlier turquoise-only example. Implemented a new variant from the supplied direction.

Changes: shared muted turquoise symbol fill with dark teal contours; four pale white/aqua tessera colours and a thinner double border. Overrides apply only to pool mosaic textures; canonical symbols elsewhere retain their palette. Four shapes and south-to-north order unchanged. No new textures or meshes beyond the existing counts.

Deck labels now read only 1,0 m and 2,0 m. Mesh footprint reduced from 1.6 by 0.5 m to 0.64 by 0.2 m (84% less area); centre sits 0.17 m outside the pool water bounds, on the coping. Raised from GF + 0.012 to GF + 0.045 to sit 5 mm above the actual coping top and avoid embedding/flicker. Cream/teal palette matches the stone. Sauna diagram and notebook depth instructions retained: needed for puzzle direction.

Integration: origin default advanced to 367f838 (serre roof and kitchen exterior glass repairs). Merged cleanly into local recovery branch before pool edits; prior INTERIOR-R01 and Game Master changes retained.

Validation: typecheck and production build pass. Pool browser script confirms all four symbols/order, exact numeric marker texts/dimensions/heights, inspect target and no page errors. Low/high captures at shallow/deep ends visually reviewed. Unit suite passes (290 tests after latest upstream geometry regression). No physical phone claim.

Local changes remain unpublished pending the earlier explicit push/merge/deploy authorization. Recovery patch is updated against 367f838 and includes INTERIOR-R01, content changes and POOL-R01. To resume, fetch default, review any newer overlap, apply/check patch or use local branch fix/interior-r01-recovered, then publish only with authorization.

## Owner refinement — 2026-10-15
Replace flat turquoise fills with six deterministic, irregularly distributed turquoise glaze tones clipped to the shared symbol paths. The light field now alternates six off-white, cream and aqua tones. No random runtime animation or global symbol palette changes. Markers move to the right-hand corner as viewed facing the water at each end (shallow X126.45, deep X119.55), retaining the coping height and 0.64 by 0.2 m size. Browser review asserts these positions; typecheck, build and focused low/high browser capture checks pass. Overview capture includes the shallow right-hand marker for owner review.

## Publication authorization — 2026-10-15
Owner approved live publication in this chat ("Ja top. Deze mag live"). Earlier pending-authorization notes are historical. Integrated current production f9bc76f (approved CARS-R01) before release; prior roof and exterior glass repairs remain included.
