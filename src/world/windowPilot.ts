// WINDOW-R01: one opt-in pilot; single source for facade, collider and portal placement.
export const BILLIARD_PILOT_WINDOW = {
  room: 'billiard', axis: 'x' as const, f: 109.8, at: 88, sill: 1.05, w: 1.1, h: 1.6,
  wallThickness: 0.4, glassInsetFromExterior: 0.085,
};

// Exterior direction is +Z in plan for the billiard north wall.
// The single sash sits close to the outside face; reveal and internal sill
// extend from interior plaster to the pane, rather than forming a second sash.
export function billiardPilotDepths() {
  const p = BILLIARD_PILOT_WINDOW;
  const exteriorFace = p.f + p.wallThickness / 2;
  const glazingZ = exteriorFace - p.glassInsetFromExterior;
  const innerFinishZ = p.f - p.wallThickness / 2 - 0.025;
  return { exteriorFace, glazingZ, innerFinishZ };
}
