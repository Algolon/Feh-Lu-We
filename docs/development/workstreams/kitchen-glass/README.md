# Kitchen exterior glass visibility repair

Recovered on production base `ed23229` after the original unpushed local checkpoint was lost between sessions. Only the kitchen portal flag and its regression test are changed; recent compass and environment work is retained.

The kitchen back door uses clear glass and already allows visual rays through its collider. Its portal omitted `seeThrough`, causing outdoor geometry to be hidden when the saved door state became closed, including during closing. The pale sky then appeared as an opaque white pane. Mark `door.kitchenBack` as see-through using the existing visibility path. Collision, picking, materials and animation remain unchanged.

Validation: 290 tests, typecheck and production build pass. The regression verifies closed/open/closing state garden visibility, solid glass collision and opaque wall rejection.

Run `node scripts/kitchen-glass-review.mjs` for ten fixed-step portrait browser captures. The before case disables the portal and aperture flags at runtime to reproduce the original symptom. Both low and high quality retain the garden in closed/open/opening/closing states. No browser errors. Low quality: 67 calls / 236,681 triangles; high including shadow passes: 153 / 502,895. Closed-door rendering now equals the existing open-door cost. These software-rendered checks do not measure phone frame rate.
