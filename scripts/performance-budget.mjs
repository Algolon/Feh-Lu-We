// FLW-PB01: policy only; no runtime quality, culling or LOD changes.
export const PERFORMANCE_BUDGET = Object.freeze({
  status: 'PROVISIONAL DEVELOPMENT BUDGET',
  deviceValidation: 'PENDING',
  cameraTrianglesPerView: 750_000,
  lowDrawCalls: 150,
  targetFps: 30,
});

export function cameraTrianglesWithinBudget(triangles) {
  return Number.isFinite(triangles) && triangles >= 0 && triangles <= PERFORMANCE_BUDGET.cameraTrianglesPerView;
}

export function lowViewWithinBudget(view) {
  return Number.isFinite(view.calls) && view.calls >= 0 && view.calls <= PERFORMANCE_BUDGET.lowDrawCalls && cameraTrianglesWithinBudget(view.triangles);
}

// Relative regression review is independent of the absolute development ceiling.
// An explained, approved increase changes the paired baseline/allowance explicitly;
// it never silently restores the historical 250k ceiling or bypasses 750k.
export function cameraRegressionWithinBudget(triangles, baseline, maxGrowthRatio) {
  return cameraTrianglesWithinBudget(triangles) && Number.isFinite(baseline) && baseline >= 0 &&
    Number.isFinite(maxGrowthRatio) && maxGrowthRatio >= 1 && triangles <= baseline * maxGrowthRatio;
}
