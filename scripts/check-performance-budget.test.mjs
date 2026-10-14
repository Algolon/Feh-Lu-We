import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PERFORMANCE_BUDGET as B, cameraTrianglesWithinBudget as camera, lowViewWithinBudget as low, cameraRegressionWithinBudget as regression } from './performance-budget.mjs';

test('new camera ceiling accepts development above historical guide and rejects overshoot', () => {
  assert.equal(B.status, 'PROVISIONAL DEVELOPMENT BUDGET');
  assert.equal(B.deviceValidation, 'PENDING');
  for (const n of [250001, 350000, 500000, B.cameraTrianglesPerView]) assert.ok(camera(n));
  for (const n of [B.cameraTrianglesPerView + 1, -1, NaN, Infinity, undefined]) assert.equal(camera(n), false);
});
test('draw-call failures stay independent of spare triangle budget', () => {
  assert.ok(low({ calls: 150, triangles: 750000 }));
  assert.equal(low({ calls: 151, triangles: 100000 }), false);
  assert.equal(low({ calls: NaN, triangles: 100000 }), false);
});
test('relative guards can cross 250k but do not hide unexplained growth or absolute overshoots', () => {
  assert.ok(regression(260000, 245000, 1.08));
  assert.ok(regression(251000, 249000, 1.02));
  assert.equal(regression(300000, 245000, 1.08), false);
  assert.equal(regression(750001, 740000, 1.08), false);
  assert.equal(regression(100, NaN, 1.08), false);
});
test('all active low camera-budget suites consume central checks without a hidden 250k condition', () => {
  for (const name of ['e2e', 'e2e-dev04a', 'e2e-dev04b', 'e2e-dev04c', 'e2e-dev04d']) {
    const s = readFileSync(new URL(`${name}.mjs`, import.meta.url), 'utf8');
    assert.match(s, /from '\.\/performance-budget.mjs'/);
    assert.doesNotMatch(s, /250000|250_000|250 k|250k/);
    assert.match(s, /lowViewWithinBudget|cameraRegressionWithinBudget/);
  }
  assert.match(readFileSync(new URL('e2e-dev04c.mjs', import.meta.url), 'utf8'), /set === 'A' && k === 'golfSpur'/);
  assert.match(readFileSync(new URL('e2e.mjs', import.meta.url), 'utf8'), /r.high.calls <= 150 \* 1.8 && r.high.triangles <= 450000/);
});
