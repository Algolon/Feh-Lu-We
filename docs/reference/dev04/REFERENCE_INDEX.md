# Feh Lu We — DEV-04 Reference Pack

This folder is the visual reference source for the next Feh Lu We art/model iterations.

## Purpose

References are used to improve:
- construction logic;
- silhouette and proportion;
- stylized model language;
- material behaviour and texture treatment;
- furnishing/composition;
- landmark staging;
- close-up credibility.

They are **not** instructions to copy a single real-world object literally.

The production target remains the Feh Lu We visual language: a crafted stylized European woodland manor. BOSLUST is the strongest current in-game calibration target. The Portugal exterior is a second strong benchmark. The current living room is an owner-designated candidate reference, but still needs separate close-up validation.

## Reference hierarchy

Use filenames with one of these tags:

- `PRIMARY` — strongest target for shape/style/composition.
- `SUPPORT` — useful for construction, material or another view.
- `AVOID` — explicitly shows an unwanted direction.

Examples:

```
wickerman_structure_PRIMARY_01.jpg
wickerman_binding_SUPPORT_02.jpg
chair_too_blocky_AVOID_01.jpg
```

## What makes a useful reference

For an important 3D asset, try to cover three things:

1. **Silhouette / proportion** — overall shape from a useful angle.
2. **Construction** — how pieces connect, carry weight and meet the ground/wall.
3. **Material / surface** — edges, thickness, fabric, grain, paper, ceramic, metal, etc.

A single image can cover more than one purpose.

## Minimum rule

Every leaf folder has a minimum of **1 useful image** before it can be considered populated.

For DEV-04A/B, prioritize folders marked **NOW** in `REFERENCE_CHECKLIST.md`. Do not wait for every later folder to be complete before starting implementation.

## Naming

Prefer descriptive names:

```
attic_partition_roof_PRIMARY_01.jpg
book_hardcover_paperblock_SUPPORT_02.jpg
conservatory_double_door_PRIMARY_01.jpg
```

Avoid:

```
image1.jpg
coolchair.png
pinterest_123.jpg
```

## Practical notes

- JPEG, PNG and WEBP are fine.
- Keep the original image when possible; avoid tiny thumbnails.
- Crop only when it makes the relevant construction/detail clearer.
- Do not add dozens of near-duplicates. 2–6 strong references are usually better than 20 weak ones.
- When a current-build screenshot is the best calibration reference, put that screenshot in the relevant calibration folder.
- The `99_avoid` folders are useful: showing what *not* to do reduces style drift.
