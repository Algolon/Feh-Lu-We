# CARS-R02 — reference detail and four vehicle types

Base: 7b1285710e81fdf03fa7809eb95682d5a4856c28. Branch: cars-r02-reference-detail. PR: #30.

## Result

The owner requested detail matching the orange and green low-poly hatchback references, explicitly a VW bus, hatchback, SUV and station wagon, and better rims.

- car.1: blue station wagon; long rear side glazing, roof rails and eight-spoke alloys.
- car.2: VW T3-style passenger bus; high upright cabin, short nose, two-tone cream/teal body, centred VW badge and eight-spoke steel-style rims.
- car.3: red compact hatchback; shorter wheelbase, sloping rear, two side windows and six-spoke rims.
- car.4: green SUV; taller beltline/roof, larger tyres, broad dark wheel lips, rocker trim and roof rails.

Windows now have open apertures, thin rubber seals and shared lightly tinted glazing. Seats, headrests, dashboard and steering wheel are visible inside; painted opaque window backing has been removed. Door seams align with pillars, bonnet seams follow the bonnet, wheel lips follow the actual openings, and headlights/grilles fit into front housings. Wheels have proper tyre cross-sections, recessed dark bowls, outer metallic rings, tapered radial spokes, hubs and five-bolt circles. Neutral metal avoids the old brass tint. No external model/texture downloads.

Parking positions, bay occupancy and collision boxes are unchanged. Visual heights differ (bus/SUV): the legacy 1.25 m collision/occlusion box remains; this is a visual asset pass, not a vehicle interaction feature. Bus colour deliberately changes from beige to cream/teal to make its two-tone design readable.

## Verification

- Typecheck, production build and 293 tests pass. Existing large-bundle warning remains.
- Four geometry tests validate finite coordinates, genuine empty wheel openings, no opaque backing at side-window centres on both sides, and <10k triangles per vehicle.
- Exact model triangles: station 9,324; bus 9,336; hatch 8,700; SUV 9,524. Total 36,884 (+5,964 versus R01).
- Five production browser views at 1536×864 cover front/rear, SUV side, bus front and station details. The verified final bundle is index-Cezn9Y8Z.js; the earlier default dist retained an old entrypoint, so final review uses an isolated output directory/port and explicit bundle verification. Earlier stale screenshots are excluded from the delivered evidence.
- Shared glazing and neutral metal add render calls. Sampled full-scene maxima: low 100 calls / 327,234 triangles; high 136 calls / 515,132 triangles. These five views fit the 150-call / 750k-triangle budget; mobile frame-time and the whole-estate worst case are not measured here.
- Final poses, render measurements and browser error list: [evidence](cars-r02/views.json).

[Front](cars-r02/front-three-quarter.jpg) · [SUV](cars-r02/suv-side.jpg) · [Rear](cars-r02/rear-three-quarter.jpg) · [Bus](cars-r02/bus-front.jpg) · [Station](cars-r02/estate-detail.jpg)

No merge or deployment: visual review of the concrete revision comes first.
