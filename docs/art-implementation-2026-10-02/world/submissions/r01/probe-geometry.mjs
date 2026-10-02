// Read-only fixture probe of actual logical geometry, not renderer integration or a new gameplay test.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { isLineHazardHit, isTargetWithinArea } from '../../../../../src/logic/engine/combatRules.js';
import { createLineHazard, createAreaHazard } from '../../../../../src/logic/engine/battlefieldRules.js';

const line = { x: 0, y: 0, x2: 100, y2: 0, width: 18 };
const point = (x, y, radius = 0) => ({ x, y, radius });
const probes = [
  ['line exact side', isLineHazardHit({ hazard: line, target: point(50, 18) }), true],
  ['line outside side', isLineHazardHit({ hazard: line, target: point(50, 18.001) }), false],
  ['line exact endpoint cap', isLineHazardHit({ hazard: line, target: point(118, 0) }), true],
  ['line outside endpoint cap', isLineHazardHit({ hazard: line, target: point(118.001, 0) }), false],
  ['line target radius included', isLineHazardHit({ hazard: line, target: point(50, 30, 12) }), true],
  ['line no rectangle corner', isLineHazardHit({ hazard: line, target: point(118, 18) }), false],
  ['zero length is disk', isLineHazardHit({ hazard: { ...line, x2: 0 }, target: point(0, 18) }), true],
  ['area full center hit', isTargetWithinArea(point(0, 0), 90, point(0, 0)), true],
  ['area boundary inclusive', isTargetWithinArea(point(0, 0), 90, point(90, 0)), true],
  ['area target radius included', isTargetWithinArea(point(0, 0), 90, point(102, 0, 12)), true],
  ['area outside with target radius', isTargetWithinArea(point(0, 0), 90, point(102.001, 0, 12)), false],
];
for (const [label, actual, expected] of probes) assert.equal(actual, expected, label);
const createdLine = createLineHazard(point(0, 0), point(100, 0));
assert.equal(createdLine.width, 18);
assert.equal(createdLine.x2, 620);
const terrain = createAreaHazard(point(200, 200, 12), 0, 0, { terrain: true, radius: 52, delay: 1.1, pulses: 10, pulseInterval: 1 });
assert.equal(terrain.radius, 52);
assert.equal(terrain.timer, 1.1);
assert.equal(terrain.pulsesRemaining, 10);
const result = {
  status: 'passed_readonly_plan_probe',
  checks: probes.map(([label, actual, expected]) => ({ label, actual, expected, pass: actual === expected })),
  actualFactoryDefaults: { lineHalfWidth: createdLine.width, lineLength: createdLine.x2, webRadius: terrain.radius, webDelay: terrain.timer, webPulses: terrain.pulsesRemaining },
  previewInspection: { status: 'viewed_proposed_samples', files: ['ground-preview.png', 'projectile-preview.png', 'geometry-preview.png'], acceptance: 'await_main_review', proofLimit: 'PNG visual inspection only; no runtime, 95-skill execution, animation, performance or crowded composite test' },
  runtimeSourcesModified: false,
};
writeFileSync(new URL('verification.json', import.meta.url), JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ status: result.status, geometryChecks: probes.length, factoryChecks: 5 }));
