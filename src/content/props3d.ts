// DEV-04D D2: FLW 3D reference pieces built into the world, and the key family. One row per object.
// - FLW ids are art / reference ids only. They are never gameplay or save ids, and no decor here is interactable.
// - Ship rule (tests/dev04d-props.test.ts): a piece ships only if docs/reference/flw/MANIFEST.json marks it
//   APPROVED_3D_REF / APPROVED_KEY_REF, or it is REVIEW_READY and listed in OWNER_GROUP_A_S3 (owner D0 review,
//   10 Oct 2026). Group B, C, REFINE, AMBIGUOUS, RESERVED and PENDING sources never appear here.

/** REVIEW_READY S3 sources the owner approved as group A (DEV04D_ASSET_MANIFEST.md §9, D2-b). */
export const OWNER_GROUP_A_S3 = ['FLW-S3-014', 'FLW-S3-015', 'FLW-S3-016', 'FLW-S3-017', 'FLW-S3-030', 'FLW-S3-031', 'FLW-S3-033', 'FLW-S3-037'] as const;

/** Gameplay key item → its FLW key-family reference (art id only; item, pickup and save ids are unchanged). */
export const KEY_REF = { frontKey: 'FLW-K3-001', studyKey: 'FLW-K3-002', shedKey: 'FLW-K3-003', consKey: 'FLW-K3-004' } as const;
export type KeyItem = keyof typeof KEY_REF;

/** Key-family game scale (owner K1): a key reads in a drawer at arm's length. */
export const KEY_SCALE = 1.3;
const KS = KEY_SCALE;
export interface KeySpec { len: number; bowW: number; bowH: number; shaftR: number; bow: 'trefoil' | 'ring' | 'square' | 'oval'; metal: 'brass' | 'paint'; col: string; dark: string; bitW: number; teeth: number[] }

export const KEY_SPECS: Record<KeyItem, KeySpec> = {
  // FLW-K3-001 Landhuissleutel: 120 mm, trefoil bow 38 mm, Ø10 shaft, E-bit, red leather tag on a copper ring
  frontKey: { len: 0.12 * KS, bowW: 0.038 * KS, bowH: 0.036 * KS, shaftR: 0.005 * KS, bow: 'trefoil', metal: 'brass', col: '#c9a24c', dark: '#a07c38', bitW: 0.017 * KS, teeth: [1, 0.55, 1] },
  // FLW-K3-002 Studeerkamersleutel: 80 mm, round bow 28 mm, Ø8 shaft, fine bit, ivory paper tag (left blank: the sheet's
  // lettering is misspelt and sheet text is never reproduced)
  studyKey: { len: 0.08 * KS, bowW: 0.028 * KS, bowH: 0.028 * KS, shaftR: 0.004 * KS, bow: 'ring', metal: 'brass', col: '#d2ae5a', dark: '#a8863e', bitW: 0.011 * KS, teeth: [1, 0.6] },
  // FLW-K3-003 Bosschuursleutel: 105 mm, square bow 32 mm, Ø10 shaft, broad stepped bit; dark iron with rust (the spec,
  // not the coppery render), wooden house-shaped hanger
  shedKey: { len: 0.105 * KS, bowW: 0.032 * KS, bowH: 0.032 * KS, shaftR: 0.005 * KS, bow: 'square', metal: 'paint', col: '#463e38', dark: '#7a4a2e', bitW: 0.019 * KS, teeth: [1, 0.7, 1, 0.5] },
  // FLW-K3-004 Serresleutel: 95 mm, upright oval bow 32 × 40 mm, Ø9 shaft, brass; green glass drop on a copper ring
  // (tinted glass with a little specular, no emission)
  consKey: { len: 0.095 * KS, bowW: 0.032 * KS, bowH: 0.04 * KS, shaftR: 0.0045 * KS, bow: 'oval', metal: 'brass', col: '#d4a94a', dark: '#a8823a', bitW: 0.014 * KS, teeth: [0.7, 1, 0.6] },
};

export interface Prop3D {
  id: string;
  title: string;
  basis: 'APPROVED_3D_REF' | 'OWNER_GROUP_A';
  /** room id (roomdefs) or outdoor zone */
  room: string;
  /** how it is carried */
  mount: 'surface' | 'wall' | 'ground';
  /** world anchor: plan x, height (support top or wall-piece centre), plan z; yaw = the piece's facing (plan heading) */
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** triangle budget (D2 brief) */
  maxTris: number;
}

const UF = 3.35, GF = 0.15, CF = 4.15;
export const PROPS3D: Prop3D[] = [
  // rear nook side table (round table, top at +0.76), beside the book stack, looking towards the landing
  { id: 'FLW-S3-004', title: 'Houten vogelbeeld', basis: 'APPROVED_3D_REF', room: 'rearNook', mount: 'surface', x: 92.55, y: UF + 0.76, z: 108.84, yaw: Math.PI - 0.45, maxTris: 600 },
  // front gallery: the long south wall between the windows, above the bench line (face z 80.422)
  { id: 'FLW-S3-014', title: 'Gesneden zwaluwen', basis: 'OWNER_GROUP_A', room: 'frontGallery', mount: 'wall', x: 90.0, y: UF + 2.0, z: 80.422, yaw: 0, maxTris: 900 }, // a set of three
  // Reiskamer writing desk (top at +0.76), east half; the open book keeps the west half
  { id: 'FLW-S3-015', title: 'Miniatuurzeilboot', basis: 'OWNER_GROUP_A', room: 'reis', mount: 'surface', x: 79.25, y: UF + 0.76, z: 80.92, yaw: Math.PI / 2, maxTris: 1500 },
  // Sterrenkamer: the free bedside (window side), facing into the room
  { id: 'FLW-S3-016', title: 'Keramische maanvorm', basis: 'OWNER_GROUP_A', room: 'sterren', mount: 'surface', x: 72.66, y: UF + 0.5775, z: 91.0, yaw: Math.PI / 2 - 0.35, maxTris: 600 },
  // botanic room: the long west wall opposite the prints, on the table's axis (face x 101.38)
  { id: 'FLW-S3-017', title: 'Terracotta bloemmedaillon', basis: 'OWNER_GROUP_A', room: 'botanic', mount: 'wall', x: 101.38, y: UF + 1.6, z: 88.5, yaw: Math.PI / 2, maxTris: 600 },
  // Portugal cottage room: east wall between the entry window and the room window (face x 29.70)
  { id: 'FLW-S3-030', title: 'Papier-maché wandmasker', basis: 'OWNER_GROUP_A', room: 'cottageRoom', mount: 'wall', x: 29.7, y: CF + 1.6, z: 160.95, yaw: -Math.PI / 2, maxTris: 600 },
  // Portugal terrace: the house's south face, west of the window shutters, over the terrace plant (face z 157.0)
  { id: 'FLW-S3-031', title: 'Keramisch tegelreliëf', basis: 'OWNER_GROUP_A', room: 'cottageTerrace', mount: 'wall', x: 20.78, y: CF + 1.55, z: 157.0, yaw: Math.PI, maxTris: 600 },
  // BBQ: the grill's backdrop, set back-left of it (straight behind, the kettle hid it from every approach) and turned
  // towards the way in from the house; the gas bottle stays clear on its west side, the feet stay on the platform
  { id: 'FLW-S3-033', title: 'Smeedijzeren BBQ-haardplaat', basis: 'OWNER_GROUP_A', room: 'bbq', mount: 'ground', x: 106.15, y: GF, z: 118.5, yaw: Math.PI + 0.35, maxTris: 600 },
  // lake viewpoint: beside the bench's north end, never in front of it (the view west to the water stays open)
  { id: 'FLW-S3-037', title: 'Houten reigerbeeld', basis: 'OWNER_GROUP_A', room: 'lakeView', mount: 'ground', x: 78.75, y: 0.04, z: 141.05, yaw: -Math.PI / 2 + 0.35, maxTris: 1500 },
];
export const PROP3D = Object.fromEntries(PROPS3D.map((p) => [p.id, p])) as Record<string, Prop3D>;
