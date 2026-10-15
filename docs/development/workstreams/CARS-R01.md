# CARS-R01 — arrival vehicles

Base: 367f838e1b47f0f4e0711b4dbc8732b1a84d6752. Branch: cars-r01-stylized-realism.

The old cars used a rectangular glass box, horizontal strips above the wheels and stacked body blocks. Replace their visual builder with three shaped European silhouettes: two estates, a passenger van and a compact hatchback. Actual wheel openings, bevelled continuous bodies, tapered cabins, sloping inset windows, painted pillars, subtle reflection bands, five-spoke rims, lights, grilles, handles and mirrors provide the vehicle read. Reuse existing grounds material batches. No texture downloads or additional transparent surfaces.

Parking positions, colours, empty fifth bay and collision tags/boxes are unchanged. The van is visually taller than the legacy 1.25 m collider; cars remain non-interactive and are blocked horizontally as before.

## Validation

- Typecheck and production build pass. Existing large-bundle warning remains.
- 293 tests pass, including four new checks for finite geometry, open wheel wells (raycasts through body openings), and a 10k-triangle per-car ceiling.
- Exact geometry counts: estate 7,840 triangles each; van 7,624; hatch 7,616. Four vehicles total 30,920.
- Production browser review: rear three-quarter, green estate side and front three-quarter; all four vehicles covered, no page/console errors. Corrected lamps and grille placement after first review so they clear the bevelled body.
- Representative full-scene measurements: rear 51 calls / 214,758 triangles low and 81 / 397,582 high; side 96 / 309,276 low and 130 / 464,080 high; front 57 / 297,955 low and 93 / 451,682 high. These sampled views fit 150 calls and 750k triangles. This is not a Samsung frame-time or whole-estate performance guarantee.
- Evidence and poses: [cars-r01](cars-r01/views.json). Screenshots are from the real production game at the pinned base plus this change. Existing HUD/environment from that base is visible.

[Rear](cars-r01/rear-three-quarter.jpg) · [Side](cars-r01/estate-side.jpg) · [Front](cars-r01/front-three-quarter.jpg)

Prepared as PR #28 for visual review. No merge or deployment performed.
