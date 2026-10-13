# VFC-01 — real-phone handoff

**No physical-device results have been collected.** SwiftShader and viewport emulation are not mobile performance. All software data remains a separate category.

## Open locally

Check out `vfc01-visual-fidelity-calibration` on the owner's computer, run `npm ci`, then:

```sh
npm run dev -- --host 0.0.0.0
```

On the same Wi-Fi, open `http://<computer-LAN-IP>:5173/Feh-Lu-We/vfc01.html` on the primary Samsung, landscape. This is a local review server, not a production deployment. An isolated build is available through `npx vite build --config vite.vfc01.config.ts`; preserve the `/Feh-Lu-We/` base path when serving it. Do not publish this branch to production Pages.

Target 915×412 CSS where practical; if browser chrome differs, keep the actual viewport constant and record it. Keep browser/power mode/brightness/temperature/charging state consistent. Disable battery saver, keep the tab foreground, and settle for ~2 minutes before sampling. Use the review memory sandbox; original save/settings remain untouched.

Select Start calibration and a fixed View. Omit `auto=1` on phone. Collapse the toolbar for visual inspection. During stationary comparisons do not walk/look, change FOV, open panels or change the normal game's quality setting. Use lab URLs/controls instead; the normal quality setting can override the experimental DPR/shadow policy.

## Minimum comparison, both player cameras

| Step | Parameters | Purpose |
|---:|---|---|
| 1 | `v=V0&dpr=1` | Production content at the same lab cadence |
| 2 | `v=V3&dpr=1` | Full combined candidate cost/defects |
| 3 | `v=V3&dpr=1.25&tex=512&model=phong&normal=0&selected=1` | Smaller successful-family candidate |
| 4 | Same candidate at DPR 1.5 | Crispness versus pixel cost |
| 5 | Repeat V0 DPR 1 | Heating/background drift control |
| 6 | `v=V4&dpr=1.25` | Walking/visibility continuity, separately from stationary sampling |

Use Library-player and Cottage-player. **60s phone sample** warms 10 seconds, then records real RAF intervals for 60 seconds. Export last result writes median, p95, FPS, frames, actual viewport/DPR/buffer, submitted calls/triangles, texture/material/mesh accounting, camera and UA. Existing Game frameStats is unpopulated in the isolated lab RAF loop; the top-level exported sample timing is the actual lab cadence. It includes normal Game.tick/render plus the lab adapter, not a certified exact production-loop overhead measurement.

Re-run backgrounded/interrupted samples. Record whether any visual difference is visible during play, without enlarging screenshots. If useful, compare `shadow=1&aa=1&dpr=1.5` on **both V0 and V3**. AA is chosen at context creation; this quality-context control also has four fixture pool lights versus three in low, so do not credit all appearance/cost differences to AA alone. The high-shadow configuration is not recommended before its rafter striping is fixed.

## Triangle guide calibration

Cottage-player, chosen DPR, shadows off. Compare actual native load and requested 250k / 350k / 500k / optional 700k with the Triangles control. The same tiny opaque panel, shader, coverage and one draw remain; only tessellation changes. Record actual submitted counts, which slightly overshoot due regular grid subdivision. Library native is already above 250k, so its 250k request is unattainable.

350k is a **first phone test guide**, 500k a stress probe, 700k optional. None is an approved permanent production cap. Choose a 30 or 60Hz target (33.3 or 16.7ms/frame), examine p95 and thermal margin, then walk/play for several minutes. Stationary regular vertices do not certify foliage overdraw, state changes, shader compilation, interaction, GC or sustained thermal behaviour.

## Visibility checklist

- Cottage architecture: approach/retreat and watch the visible silhouette near 86–90m. V4 preserves it through the tested 105m ray.
- Hero fixture: optional `hero-test=1` puts the same lantern on the terrace post in both variants; compare the old 30m cutoff with V4's full small mesh. Original room/door occlusion is different from a distance defect.
- Large trees: approach/retreat around 16/26/48m, with existing 3m hysteresis; judge branch loss, silhouette/value changes and shimmer.
- Micro card: optional `lodtest=1`, approach to ~6–10m and retreat through 12–24m. Judge projected fade/re-entry and temporal alpha-hash noise. This added diagnostic has an authored 24m hard-cut control; the new projected thresholds are not equivalent fixed distances.
- Turn quickly; cross open/closed portals. Valid occlusion must remain. Check that no furniture/supports reappear through walls or float without their architectural parent.

## Return a compact result

Device/browser, actual viewport, power/temperature notes; exported JSON; one normal player screenshot; observations on crispness, construction, material identity, contact depth, aliasing, popping and any defects. Preserve software results separately. Store owner-supplied data in `phone-results/` later; no production budget revision or estate-wide rollout before review/device evidence.
