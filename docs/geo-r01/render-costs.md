# GEO-R01 measured rendering costs

Chromium SwiftShader, normal renderer, low quality, portrait 412×820 DPR1. Same final capture harness on baseline and repair; doors settle away from the camera before capture. Counts are submitted rendering work, not GPU timing or physical Android validation.

| View | Before calls / triangles | After calls / triangles | Delta triangles |
| --- | ---: | ---: | ---: |
| service-threshold-east | 118 / 252,423 | 118 / 252,423 | +0 |
| service-threshold-west | 51 / 130,660 | 72 / 200,900 | +70,240 |
| corridor-west | 75 / 201,696 | 75 / 201,696 | +0 |
| kitchen-east | 122 / 250,458 | 122 / 250,458 | +0 |
| cons-threshold-west | 105 / 270,438 | 147 / 331,722 | +61,284 |
| cons-threshold-east | 98 / 193,608 | 98 / 193,608 | +0 |
| cons-closed-west | 79 / 148,520 | 109 / 273,366 | +124,846 |
| corridor-closed-east | 41 / 122,418 | 102 / 226,113 | +103,695 |
| kitchen-closed-east | 23 / 96,072 | 23 / 96,072 | +0 |
| corridor-closed-west | 34 / 141,460 | 35 / 141,520 | +60 |
| wing-floor-gap | 36 / 152,388 | 36 / 152,388 | +0 |
| wing-wall-gap | 55 / 157,657 | 42 / 130,884 | -26,773 |
| wing-join-up | 86 / 237,843 | 86 / 237,843 | +0 |
| kitchen-dining | 39 / 134,380 | 39 / 134,380 | +0 |
| dining-kitchen | 57 / 179,148 | 57 / 179,148 | +0 |
| garden-kitchen | 102 / 264,202 | 102 / 264,202 | +0 |
| garden-cons | 91 / 138,173 | 122 / 263,021 | +124,848 |

## Existing reference views

1280×720, low quality, existing DEV-04A capture routine in a fresh browser for each build.

| View | Before calls / triangles | After calls / triangles |
| --- | ---: | ---: |
| atticNook | 41 / 106,020 | 41 / 106,020 |
| atticCommon | 39 / 108,298 | 39 / 108,298 |
| conservatoryInside | 74 / 128,668 | 74 / 128,668 |
| conservatoryDoorDeck | 140 / 206,548 | 170 / 307,740 |
| wellnessDeck | 65 / 156,535 | 65 / 156,535 |
| saunaAccess | 145 / 226,184 | 145 / 226,184 |
| wickermanClearing | 31 / 160,593 | 31 / 160,593 |
| wickermanPath | 35 / 211,057 | 35 / 211,057 |
| frontForecourt | 134 / 207,234 | 134 / 207,234 |
| arrivalCourt | 128 / 203,776 | 128 / 203,776 |
| portugalTerrace | 31 / 93,007 | 31 / 93,007 |
| portugalApproach | 33 / 120,623 | 33 / 120,623 |
| golfVicinity | 55 / 198,999 | 55 / 198,999 |
| golfSpur | 90 / 263,048 | 90 / 263,048 |
