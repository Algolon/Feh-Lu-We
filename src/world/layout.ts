// Authored estate layout (plan metres: X east, Z north). Single source for world builders, the map,
// clue texts that mention places, and tests. The estate is 180 × 150: forest in the south (Z 0–72),
// manor + open garden in the north.

export const ESTATE = { w: 180, d: 150, forestEdge: 72 };

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
  cottage: { x: 37, z: 132 },
  pond: { x: 48, z: 132 },
  sauna: { x: 134, z: 102 },
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
export const COTTAGE = { x0: 32, x1: 42, z0: 128, z1: 136 };
export const SHED = { x0: 39.5, x1: 44.5, z0: 37.2, z1: 40.8 };

// Heights
export const GF = 0.15, CEIL = 3.15, UF = 3.35, UCEIL = 6.2, TOP = 6.4, BF = -3.2, BCEIL = -0.25;
/** Underground (BOSLUST) floor and ceiling. */
export const UG = -3.4, UGCEIL = -0.55;

export const GARDEN_PATH: [number, number][] = [[80, 113.5], [68, 118], [56, 124], [46, 127.2], [40, 127.6]];
