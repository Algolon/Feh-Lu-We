// Authored estate layout (plan metres: X east, Z north). Single source for world builders, the map,
// clue texts that mention places, placement keepouts and tests. DEV-02: the estate is the fixed v0.2 footprint
// 200 × 180 (docs/design/v0.2/LEVEL_LAYOUT.json `proposal`): forest in the south (Z 0–72), the manor with its social
// garden in the middle, the lake and the Portugal cottage on a +4 m plateau in the north-west, wooded ridges along
// the north and east edges. The origin, axes and every retained footprint are unchanged from the 180 × 150 estate.

export const ESTATE = { w: 200, d: 180, forestEdge: 72 };

/** Points of interest. */
export const SITES = {
  gate: { x: 90, z: 0.3 },
  forecourt: { x: 90, z: 70 },
  shed: { x: 42, z: 39 },
  fire: { x: 21, z: 18 },
  well: { x: 144, z: 39 },
  sideGate: { x: 162, z: 18 },
  hill: { x: 63, z: 31 }, // BOSLUST hill centre
  boslust: { x: 63, z: 18.2 }, // the door in the hill's south face
  fork: { x: 55.5, z: 8.6 }, // signpost where the side path leaves the southern loop
  lanterns: { x: 90, z: 128 },
  cottage: { x: 25, z: 161 }, // v0.2: COTTAGE moved to X 20–30 / Z 157–165 on the +4 plateau
  lake: { x: 54, z: 146 },
  lakeView: { x: 79, z: 139.5 },
  sauna: { x: 134, z: 102 },
  jacuzzi: { x: 140.8, z: 102.8 },
  golf: { x: 63, z: 51 },
  wickerman: { x: 167, z: 54 },
  eastGlade: { x: 163, z: 128 },
};

export const HILL = { x: SITES.hill.x, z: SITES.hill.z, r: 16, h: 7.5 };
/** Flat cut in the hill's south face in front of the BOSLUST door (retaining walls on both sides). */
export const HILL_CUT = { x0: 60, x1: 66, z0: 8, z1: 18 }; // grid-aligned (2 m terrain cells)

export const DRIVEWAY: [number, number][] = [[90, 0.3], [90, 26], [90.6, 48], [90, 62]];

// Forest paths (Chaikin-smoothed by the builders). Looping network with a side path to the hill.
export const FOREST_PATH_KEYS: [number, number][][] = [
  [[82, 67.5], [71, 62], [58, 51], [48, 42]], // forecourt (west) → shed
  [[38, 35.5], [31, 27], [24.5, 21]], // shed → fire clearing
  [[23.5, 14.5], [36, 9], [55.5, 8.4], [76, 9.4], [87.5, 10.5]], // fire → southern loop → driveway
  [[92.5, 11.5], [114, 13], [138, 16], [158.5, 18]], // driveway → side gate
  [[151, 17], [149, 26], [146.5, 34]], // side gate → well
  [[141.5, 43.5], [131, 52.5], [113, 62.5], [98.5, 68]], // well → forecourt (east)
  [[55.5, 8.4], [59.5, 10.4], [63, 12.4], [63, 17.6]], // fork → into the cut → BOSLUST door
];

export const CLEARINGS = [
  { x: 42, z: 39, r: 9.5 }, { x: 21, z: 18, r: 9 }, { x: 144, z: 39, r: 9 }, { x: 162, z: 18, r: 7.5 },
  { x: 90, z: 70, r: 12 }, { x: 90, z: 3, r: 5 },
];

// Buildings (outer footprints). Main block + service wing + conservatory form the manor complex.
export const MANOR = { x0: 72, x1: 108, z0: 80, z1: 110 };
export const WING = { x0: 108, x1: 116, z0: 92, z1: 110 };
export const CONS = { x0: 116, x1: 130, z0: 94, z1: 112 };
export const POOL = { x0: 119, x1: 127, z0: 97, z1: 109 }; // shallow south → deep north
export const TERRACE = { x0: 78, x1: 102, z0: 110, z1: 117 };
export const SHED = { x0: 39.5, x1: 44.5, z0: 37.2, z1: 40.8 };

// Heights
export const GF = 0.15, CEIL = 3.15, UF = 3.35, UCEIL = 6.2, TOP = 6.4, BF = -3.2, BCEIL = -0.25;
/** Underground (BOSLUST) floor and ceiling. */
export const UG = -3.4, UGCEIL = -0.55;

// =====================================================================================================================
// DEV-02 (v0.2 variant A) descriptors. Bounds are x0, x1, z0, z1 like LEVEL_LAYOUT. Every builder, the terrain, the map,
// the room classification and the placement keepouts read these records; nothing below is repeated as a literal.
export type Rect = { x0: number; x1: number; z0: number; z1: number };

/** Attic floor (new v0.2 storey) and the roof anchors it lives under. */
export const AF = 6.65, ROOF_EAVE = 6.4, ROOF_RIDGE = 14.6;

/** Underside of the hip roof (36 × 30 m, eave +6.4 at 0.7 m overhang, rise 8.2) at a plan point, minus its skin. */
export function roofUnderside(x: number, z: number) {
  const ax = 18.7, az = 15.7; // half extents incl. overhang, about the roof centre (90, 95)
  return ROOF_EAVE + (8.2 * Math.max(0, Math.min(az - Math.abs(z - 95), ax - Math.abs(x - 90), az))) / az - 0.25;
}
/** S03 (LEVEL_LAYOUT vertical_connections): two 1.2 m flights side by side with a middle landing at +5.00. */
export const S03 = {
  flight1: { x0: 96.6, x1: 97.8, z0: 99.8, z1: 102.32 }, // rises north from the lower landing (+3.35 → +5.00)
  flight2: { x0: 95.2, x1: 96.4, z0: 99.8, z1: 102.32 }, // rises south from the middle landing (+5.00 → +6.65)
  mid: { x0: 95.2, x1: 97.8, z0: 102.32, z1: 103.52, y: 5.0 },
  landing: { x0: 95, x1: 99, z0: 98.6, z1: 99.8 }, // lower landing at +3.35, upper landing above it at +6.65
  lane: { x0: 97.8, x1: 99, z0: 99.8, z1: 105.6 }, // return lane at +3.35 to the rear door
  hole: { x0: 95, x1: 99, z0: 99.8, z1: 105.6 },
};


/** Portugal cottage: same 10 × 8 m house moved to the plateau; covered terrace in front, ramp from the path. */
export const COTTAGE_PAD_Y = 4.0, COTTAGE_FLOOR = 4.15, COTTAGE_CANOPY = 6.85;
export const COTTAGE: Rect = { x0: 20, x1: 30, z0: 157, z1: 165 };
export const COTTAGE_TERRACE: Rect = { x0: 20, x1: 30, z0: 152, z1: 157 };
export const COTTAGE_PAD: Rect = { x0: 18, x1: 32, z0: 150, z1: 167 };
export const COTTAGE_RAMP: Rect = { x0: 18, x1: 20, z0: 151.4, z1: 152.6 };
/** DEV-04A: the path junction in front of the terrace — one tiled landing that owns the ground where both cottage
 * routes meet (south / north mouths along X 18) and carries the ramp (COTTAGE_RAMP, X 18–20) up to the terrace. */
export const COTTAGE_LANDING: Rect = { x0: 16.8, x1: 20, z0: 151.0, z1: 153.6 };

/** The lake (ellipse; water is never walkable, the basin is real terrain). */
export const LAKE = { x: 54, z: 146, rx: 22, rz: 12, water: -0.35, bottom: -1.8 };
export const lakeQ = (x: number, z: number) => ((x - LAKE.x) / LAKE.rx) ** 2 + ((z - LAKE.z) / LAKE.rz) ** 2;

/** Wellness: dry deck east of the Copacabana Room, barrel sauna (raised floor), jacuzzi, ramp to the sauna door. */
export const SAUNA: Rect = { x0: 132, x1: 136, z0: 100, z1: 104 };
export const SAUNA_FLOOR = 0.8;
export const WELLNESS: Rect = { x0: 130, x1: 148, z0: 96, z1: 115 };
export const JACUZZI: Rect = { x0: 139, x1: 142.6, z0: 101, z1: 104.6 };
/** 1.2 m ramp from the deck (+0.15 at Z 113.4) to a flat landing (+0.80, Z 104–105.2) in front of the sauna door. */
export const SAUNA_RAMP = { x0: 133.4, x1: 134.6, zFoot: 113.4, zTop: 105.2, zDoor: 104, yFoot: 0.15, yTop: 0.8 };
/** Copacabana double door (one saved state door.consEast, two 1.2 m leaves opening outward/east). */
export const CONS_EAST_DOOR = { x: 130, z0: 104.8, z1: 107.2, h: 2.35 };

/** Arrival: one gravel court, five 2.8 × 5.5 bays (four cars + one optional), shared manoeuvring strip. */
export const ARRIVAL: Rect = { x0: 80, x1: 100, z0: 61, z1: 78 };
export const ARRIVAL_SERVICE: Rect = { x0: 69.5, x1: 108, z0: 66, z1: 72 };
/** The arrival's ONE gravel surface as non-overlapping rectangles (strip, court, bays + foot strip, porch approach). */
export const ARRIVAL_GRAVEL: Rect[] = [
  ARRIVAL_SERVICE,
  { x0: 80, x1: 100, z0: 62, z1: 66 },
  { x0: 69.5, x1: 77.9, z0: 72, z1: 79 }, { x0: 77.9, x1: 101, z0: 72, z1: 78 }, { x0: 101, x1: 106.6, z0: 72, z1: 79 },
  { x0: 86, x1: 94, z0: 78, z1: 78.6 },
];
export const PARKING: (Rect & { id: string; car: boolean; color: string })[] = [
  { id: 'car.1', x0: 69.5, x1: 72.3, z0: 72, z1: 77.5, car: true, color: '#5a6f8a' },
  { id: 'car.2', x0: 72.3, x1: 75.1, z0: 72, z1: 77.5, car: true, color: '#b8b2a4' },
  { id: 'car.3', x0: 75.1, x1: 77.9, z0: 72, z1: 77.5, car: true, color: '#8a3a32' },
  { id: 'car.4', x0: 101, x1: 103.8, z0: 72, z1: 77.5, car: true, color: '#3f5a46' },
  { id: 'car.5', x0: 103.8, x1: 106.6, z0: 72, z1: 77.5, car: false, color: '#ffffff' }, // fifth bay stays free
];

/** Social garden: platforms at terrace height (+0.15) with real edges. The centre path at X 87–94 stays free. */
export const BBQ: Rect = { x0: 104, x1: 111, z0: 115, z1: 119 };
export const OUTDOOR_DINING: Rect = { x0: 94, x1: 102, z0: 117, z1: 123 };
export const MUSIC_BONG: Rect = { x0: 79, x1: 85, z0: 118, z1: 123 };
export const BALLOON_NOOK: Rect = { x0: 84, x1: 87, z0: 118, z1: 122 };
export const LANTERN_LAWN: Rect = { x0: 84, x1: 96, z0: 122, z1: 134 };
/** Dry lake viewpoint. DEV-02 deviation: the v0.2 box X 73–79 overlaps the water ellipse by up to 1.7 m at Z 142, so it
 * is shifted 3 m east (X 76–82) to stay dry everywhere (LEVEL_PLAN "droge kijkplek"); unit-tested. */
export const LAKE_VIEW: Rect = { x0: 76, x1: 82, z0: 137, z1: 142 };

/** Golf behind (north of) the BOSLUST hill: a tee beside the shed path, a cardboard return chute up the slope. */
export const GOLF_TEE: Rect = { x0: 60, x1: 66, z0: 49, z1: 55 };
export const GOLF_CHUTE: Rect = { x0: 62, x1: 64, z0: 38, z1: 49 };
/** The tee mat on the tee pad (owns its ground; the golf spur meets its west edge). */
export const GOLF_MAT: Rect = { x0: GOLF_TEE.x0 + 0.35, x1: GOLF_TEE.x0 + 3.05, z0: GOLF_TEE.z0 + 0.25, z1: GOLF_TEE.z0 + 2.25 };
/** Separate wickerman clearing (scene only; burning/aftermath is open decision I04). */
export const WICKERMAN = { x: 167, z: 54, r: 7.5, y: 1.2 };

/** Authoring height fields (LEVEL_PLAN §2) + a west shoulder that carries the cottage plateau (DEV-02 addition). */
export const RIDGES = [
  { id: 'northRidge', x: 124, z: 163, rx: 65, rz: 22, peak: 4.5 },
  { id: 'eastRidge', x: 176, z: 116, rx: 20, rz: 60, peak: 5 },
  { id: 'westShoulder', x: 8, z: 156, rx: 32, rz: 40, peak: 4.5 },
];

/** Flat pads (the house, clue lawn and arrival stay flat; the plateau and the clearing are level platforms). */
export const PADS: (Rect & { y: number; m: number })[] = [
  { x0: 64, x1: 152, z0: 62, z1: 126, y: 0, m: 6 }, // arrival, manor, social garden, wellness
  { x0: 80, x1: 100, z0: 120, z1: 136, y: 0, m: 6 }, // lantern lawn
  { ...LAKE_VIEW, y: 0, m: 4 },
  { ...GOLF_TEE, y: 0, m: 3 },
  { ...COTTAGE_PAD, y: COTTAGE_PAD_Y, m: 6 },
];

export interface Route { id: string; pts: [number, number][]; width: number; profile?: { d: number[]; h: number[] }; mandatory: boolean }
/**
 * v0.2 routes (LEVEL_LAYOUT `routes` + `terrain_profiles`). A profile is the authored walking height along the route; it
 * overrides the height fields in a corridor around the line (max grade 8 %). The +0.15 → 0 step off a platform is the
 * platform edge itself, so profiles start/end at ground level 0 there.
 */
export const ROUTES: Route[] = [
  { id: 'cottageOut', pts: [[80, 113.5], [62, 122], [40, 130], [18, 143], [18, 152], [25, 152]], width: 1.6, mandatory: false,
    profile: { d: [0, 2, 20, 43.32, 68.87, 75.87, 84.87], h: [0, 0, 0, 1.67, 3.5, 4, 4] } },
  { id: 'cottageReturn', pts: [[25, 152], [18, 152], [18, 168], [48, 168], [79, 160], [90, 139], [90, 128]], width: 1.5, mandatory: false,
    profile: { d: [0, 22, 72, 119.72], h: [4, 4, 0, 0] } },
  { id: 'terraceLanterns', pts: [[90, 117], [90, 128]], width: 1.6, mandatory: true },
  { id: 'lakeViewRoute', pts: [[90, 128], [85, 134], [79, 139]], width: 1.3, mandatory: false },
  { id: 'eastGardenLoop', pts: [[94, 127], [124, 132], [149, 145], [174, 139], [174, 109], [150, 104], [145, 108]], width: 1.4, mandatory: false,
    profile: { d: [0, 30.414, 58.592, 84.302, 114.302, 138.817, 145.22], h: [0, 1, 2.2, 2.5, 1.7, 0.4, 0] } },
  { id: 'wellnessPath', pts: [[102, 113.5], [114, 113.5], [126, 113.6], [130, 113.5]], width: 1.5, mandatory: true },
  { id: 'bbqApproach', pts: [[101, 109.8], [101, 113], [103, 113], [103, 116.5]], width: 1.2, mandatory: false },
];

/** Forest-zone side loops (drawn and kept clear like the forest paths). Wickerman: v0.2 loop from the well. */
export const WICKERMAN_LOOP: [number, number][] = [[146.5, 43.5], [154, 45], [163, 49], [167, 54], [169, 62], [162, 72], [151, 75], [131, 69], [113, 62.5]];
/** Walking height at each WICKERMAN_LOOP vertex (LEVEL_LAYOUT terrain_profiles.wickermanLoop, start moved onto the well path). */
export const WICKERMAN_HEIGHTS = [0, 0.5, 1.2, 1.2, 1.2, 0.8, 0.5, 0.2, 0];
/** Golf spur: from the shed path to the tee (the tee itself lies beside the existing forecourt → shed path). */
export const GOLF_SPUR: [number, number][] = [[52.5, 46.5], [57, 49.6], [61.5, 50.4]];

/**
 * Woodland masses in the north half (LEVEL_LAYOUT outdoor_zones west/north/eastForest + the east glade). `gap` is the
 * minimum trunk spacing (dense mass vs open glade); footprints, routes and water are excluded by footprints.ts.
 */
export const WOODS: (Rect & { id: string; gap: number; pine: number })[] = [
  { id: 'westForest', x0: 0, x1: 20, z0: 72, z1: 180, gap: 5.0, pine: 0.3 },
  { id: 'northForest', x0: 70, x1: 170, z0: 152, z1: 180, gap: 5.2, pine: 0.35 },
  { id: 'northWest', x0: 20, x1: 70, z0: 170, z1: 180, gap: 5.0, pine: 0.3 },
  { id: 'eastForest', x0: 170, x1: 200, z0: 72, z1: 180, gap: 5.0, pine: 0.25 }, // south of Z 72 the forest recipe continues
  { id: 'eastGlade', x0: 149, x1: 170, z0: 106, z1: 152, gap: 11, pine: 0.1 },
  { id: 'eastMeadow', x0: 150, x1: 170, z0: 72, z1: 106, gap: 9, pine: 0.15 },
  { id: 'lakeNorth', x0: 20, x1: 70, z0: 158, z1: 170, gap: 8, pine: 0.2 },
];

/** Hall maquette: a miniature of THIS house on a presentation table against the hall's west wall (DEV-01 follow-up). */
export const MAQUETTE = { x: 85.5, z: 94.4, w: 0.72, d: 2.0, h: 0.82, pose: { x: 86.75, z: 94.4 }, note: { dx: 0.02, dz: -0.72 } };

/** Old (v0.1 / iteration-3) positions that saves may still hold; see src/core/relocate.ts. */
export const LEGACY = { cottage: { x0: 31.5, x1: 42.5, z0: 125.4, z1: 136.5 }, pond: { x: 48, z: 132, r: 4 } };
