// Art-refresh comparison flags. Everything here is opt-in through the URL; with no parameters the game
// renders exactly as before (baseline assets, baseline lighting, ACES tone mapping).
//
//   ?review=living      art-review mode: isolated in-memory save, starts in the living room, comparison bar
//   ?review=boslust     the same for the BOSLUST exterior sample (starts at the fork signpost)
//   ?review=dev01       DEV-01 structural & systems slice (own persistent save namespace, see src/slice/)
//   &art=base|sample    which living-room asset set to build (living review defaults to "sample")
//   &ext=base|sample    which BOSLUST-approach asset set to build (boslust review defaults to "sample")
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
export const REVIEW: 'living' | 'boslust' | 'dev01' | null = pick(q.get('review'), ['living', 'boslust', 'dev01'] as const, '' as never) || null;
/** DEV-01 slice review build (?review=dev01): B01 v0.2, DS01, notebook v0.2. The normal game never sets it. */
export const SLICE = REVIEW === 'dev01';

export const ART: { set: ArtSet; ext: ArtSet; light: LightSet; tm: ToneSet } = {
  set: pick(q.get('art'), ['base', 'sample'] as const, REVIEW === 'living' ? 'sample' : 'base'),
  ext: pick(q.get('ext'), ['base', 'sample'] as const, REVIEW === 'boslust' ? 'sample' : 'base'),
  light: pick(q.get('light'), ['base', 'sample'] as const, REVIEW && !SLICE ? 'sample' : 'base'),
  tm: pick(q.get('tm'), ['aces', 'neutral'] as const, 'aces'),
};
