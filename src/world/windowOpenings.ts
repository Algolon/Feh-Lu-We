/** Solid wall rectangles excluding opt-in glazing apertures. No renderer dependency. */
export interface WindowCut { at: number; w: number; y0: number; y1: number }
export type WallRect = [along0: number, along1: number, bottom: number, top: number];
export function opaqueWallRects(a0: number, a1: number, y0: number, y1: number, cuts: readonly WindowCut[]): WallRect[] {
  if (a1 <= a0 || y1 <= y0) return [];
  const xs = [a0, a1];
  for (const c of cuts) {
    if (c.w <= 0 || c.y1 <= c.y0 || c.at + c.w / 2 <= a0 || c.at - c.w / 2 >= a1) continue;
    xs.push(Math.max(a0, c.at - c.w / 2), Math.min(a1, c.at + c.w / 2));
  }
  xs.sort((a, b) => a - b);
  const rects: WallRect[] = [];
  for (let i = 1; i < xs.length; i++) {
    const left = xs[i - 1], right = xs[i], mid = (left + right) / 2;
    if (right - left < 0.00001) continue;
    let intervals: [number, number][] = [[y0, y1]];
    for (const cut of cuts) {
      if (mid < cut.at - cut.w / 2 || mid > cut.at + cut.w / 2) continue;
      intervals = intervals.flatMap(([lo, hi]): [number, number][] => {
        if (cut.y1 <= lo || cut.y0 >= hi) return [[lo, hi]];
        const spans: [number, number][] = [];
        if (cut.y0 > lo) spans.push([lo, Math.min(hi, cut.y0)]);
        if (cut.y1 < hi) spans.push([Math.max(lo, cut.y1), hi]);
        return spans;
      });
    }
    for (const [lo, hi] of intervals) if (hi - lo > 0.00001) rects.push([left, right, lo, hi]);
  }
  return rects;
}
