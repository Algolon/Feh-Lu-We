// Art-refresh comparison flags. Everything here is opt-in through the URL; with no parameters the game
// renders exactly as before (baseline assets, baseline lighting, ACES tone mapping).
//
//   ?review=living      art-review mode: isolated in-memory save, starts in the living room, comparison bar
//   &art=base|sample    which living-room asset set to build (review mode defaults to "sample")
//   &light=base|sample  interior lighting treatment (review mode defaults to "sample")
//   &tm=aces|neutral    tone mapping (default "aces", exposure unchanged at 1.15)
//
// The flags are read once at startup and can be changed live from the review bar (the world is rebuilt
// for `art`; `light` and `tm` apply on the next frame). Tests can use them with ?autotest=1 as well.

export type ArtSet = 'base' | 'sample';
export type LightSet = 'base' | 'sample';
export type ToneSet = 'aces' | 'neutral';

const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const pick = <T extends string>(v: string | null, ok: readonly T[], d: T): T => (ok as readonly string[]).includes(v ?? '') ? (v as T) : d;

/** Art-review mode: isolated state (see state.ts `storage`), review bar, direct start in the room under review. */
export const REVIEW: 'living' | null = q.get('review') === 'living' ? 'living' : null;

export const ART: { set: ArtSet; light: LightSet; tm: ToneSet } = {
  set: pick(q.get('art'), ['base', 'sample'] as const, REVIEW ? 'sample' : 'base'),
  light: pick(q.get('light'), ['base', 'sample'] as const, REVIEW ? 'sample' : 'base'),
  tm: pick(q.get('tm'), ['aces', 'neutral'] as const, 'aces'),
};
