import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ENEMY_RIGS } from '../../../../../src/view/art/characters/enemyRigData.js';

const out = import.meta.dirname, root = path.resolve(out, '../../../../..');
const fingerprint = relative => { const buffer = fs.readFileSync(path.join(root, relative)); return { path: relative, sha256: crypto.createHash('sha256').update(buffer).digest('hex'), bytes: buffer.length }; };
const moduleFingerprint = fingerprint('src/view/art/characters/enemyRigData.js');
const samplerFingerprint = fingerprint('src/view/art/characters/rig.js');
const contractFingerprint = fingerprint('docs/art-implementation-2026-10-02/characters/submissions/r04/path-morph-contract.md');
const samplerCode = fs.readFileSync(path.join(root, samplerFingerprint.path), 'utf8');
const parse = d => {
  const tokens = d.match(/[MLCQZ]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
  const arity = { M: 2, L: 2, C: 6, Q: 4, Z: 0 }, commands = [];
  let index = 0, op;
  while (index < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[index])) op = tokens[index++].toUpperCase();
    if (!(op in arity)) throw new Error('Unsupported command');
    const args = tokens.slice(index, index + arity[op]).map(Number);
    if (args.length !== arity[op] || args.some(n => !Number.isFinite(n))) throw new Error('Invalid path');
    commands.push({ commandIndex: commands.length, op, values: args }); index += arity[op];
    if (op === 'M') op = 'L'; else if (op === 'Z') op = 'M';
  }
  return commands;
};
const signature = commands => commands.map(c => `${c.op}${c.values.length}`).join(' ');
const closed = commands => commands.some(c => c.op === 'Z');
const cubicContour = commands => {
  let point, start;
  const curves = [];
  for (const command of commands) {
    const v = command.values;
    if (command.op === 'M') { point = v; start = v; }
    else if (command.op === 'C') { curves.push({ points: [point, v.slice(0, 2), v.slice(2, 4), v.slice(4, 6)], originalCommandIndex: command.commandIndex, originalOp: 'C', parameterInterval: [0, 1] }); point = v.slice(4, 6); }
    else if (command.op === 'L') { const end = v; curves.push({ points: [point, point.map((n, i) => n + (end[i] - n) / 3), point.map((n, i) => n + 2 * (end[i] - n) / 3), end], originalCommandIndex: command.commandIndex, originalOp: 'L', parameterInterval: [0, 1] }); point = end; }
    else if (command.op === 'Q') { const end = v.slice(2); curves.push({ points: [point, point.map((n, i) => n + 2 * (v[i] - n) / 3), end.map((n, i) => n + 2 * (v[i] - n) / 3), end], originalCommandIndex: command.commandIndex, originalOp: 'Q', parameterInterval: [0, 1] }); point = end; }
  }
  return { start, curves, closed: closed(commands), subdivisions: [] };
};
const middle = (a, b) => a.map((v, i) => (v + b[i]) / 2);
const splitSpecified = (contour, originalCommandIndex) => {
  const index = contour.curves.findIndex(c => c.originalCommandIndex === originalCommandIndex && c.parameterInterval[0] === 0 && c.parameterInterval[1] === 1);
  if (index < 0) throw new Error('Specified authored curve missing');
  const curve = contour.curves[index], c = curve.points;
  const a = middle(c[0], c[1]), b = middle(c[1], c[2]), d = middle(c[2], c[3]), e = middle(a, b), f = middle(b, d), p = middle(e, f);
  contour.subdivisions.push({ originalCommandIndex, splitAtOriginalT: .5 });
  contour.curves.splice(index, 1, { ...curve, points: [c[0], a, e, p], parameterInterval: [0, .5] }, { ...curve, points: [p, f, d, c[3]], parameterInterval: [.5, 1] });
};
const contourPath = contour => `M${contour.start.join(' ')} ${contour.curves.map(c => `C${c.points.slice(1).flat().join(' ')}`).join(' ')}${contour.closed ? ' Z' : ''}`;
const splitLongest = contour => {
  let index = 0, longest = -1;
  contour.curves.forEach((curve, i) => { const size = curve.points.slice(1).reduce((sum, p, j) => sum + Math.hypot(p[0] - curve.points[j][0], p[1] - curve.points[j][1]), 0); if (size > longest) { longest = size; index = i; } });
  const curve = contour.curves[index], c = curve.points;
  const a = middle(c[0], c[1]), b = middle(c[1], c[2]), d = middle(c[2], c[3]), e = middle(a, b), f = middle(b, d), p = middle(e, f);
  const [t0, t1] = curve.parameterInterval, tm = (t0 + t1) / 2;
  contour.subdivisions.push({ currentSegmentIndex: index, originalCommandIndex: curve.originalCommandIndex, originalOp: curve.originalOp, splitAtOriginalT: tm });
  contour.curves.splice(index, 1, { ...curve, points: [c[0], a, e, p], parameterInterval: [t0, tm] }, { ...curve, points: [p, f, d, c[3]], parameterInterval: [tm, t1] });
};
const normalizedPairs = (a, b) => {
  const from = cubicContour(a), to = cubicContour(b), targetCount = Math.max(from.curves.length, to.curves.length);
  while (from.curves.length < targetCount) splitLongest(from);
  while (to.curves.length < targetCount) splitLongest(to);
  return { policy: 'Read-only reproduction of current generic longest-control-polygon de Casteljau split; no semantic landmark alignment or playback approval inferred', fromStart: from.start, toStart: to.start, fromClosed: from.closed, toClosed: to.closed, fromSubdivisions: from.subdivisions, toSubdivisions: to.subdivisions, cubicPairs: from.curves.map((curve, index) => ({ segmentIndex: index, fromOriginalCommand: curve.originalCommandIndex, toOriginalCommand: to.curves[index].originalCommandIndex, fromOriginalParameterInterval: curve.parameterInterval, toOriginalParameterInterval: to.curves[index].parameterInterval, fromControlPolygon: curve.points, toControlPolygon: to.curves[index].points })) };
};
const items = [];
for (const [id, rig] of Object.entries(ENEMY_RIGS)) {
  if (!rig.poseVariants) continue;
  for (const [variantName, variant] of Object.entries(rig.variants)) {
    const poses = Object.entries(rig.poseVariants).filter(([, v]) => v === variantName).map(([p]) => p);
    const baseIds = rig.shapes.map(s => s.id), targetIds = variant.shapes.map(s => s.id);
    const shapes = variant.shapes.map(target => {
      const base = rig.shapes.find(s => s.id === target.id);
      if (!base) return { shapeId: target.id, issue: 'missing neutral id' };
      const mode = base.d && target.d ? 'path' : base.ellipse && target.ellipse ? 'ellipse' : 'geometry_type_mismatch';
      const sameGeometry = mode === 'path' ? base.d === target.d : JSON.stringify(base.ellipse) === JSON.stringify(target.ellipse);
      if (mode === 'ellipse') return { shapeId: target.id, mode, changed: !sameGeometry, from: base.ellipse, to: target.ellipse, coordinatePairs: base.ellipse.map((v, index) => ({ index, from: v, to: target.ellipse[index] })), sameStyle: base.fill === target.fill && base.stroke === target.stroke && base.width === target.width, sameSpace: base.space === target.space, minimalSupplement: 'No path-morph field; current generic ellipse numeric blend already covers this pair' };
      if (mode !== 'path') return { shapeId: target.id, mode, issue: 'Cannot interpolate shape type' };
      const a = parse(base.d), b = parse(target.d), strictCompatible = signature(a) === signature(b);
      const pairs = strictCompatible ? a.map((c, index) => ({ commandIndex: index, op: c.op, coordinatePairs: c.values.map((v, j) => ({ argumentIndex: j, axis: j % 2 === 0 ? 'x' : 'y', from: v, to: b[index].values[j] })) })) : null;
      return { shapeId: target.id, mode, changed: !sameGeometry, fromD: base.d, toD: target.d, fromSignature: signature(a), toSignature: signature(b), fromClosed: closed(a), toClosed: closed(b), fromCurveCount: a.filter(c => ['L', 'Q', 'C'].includes(c.op)).length, toCurveCount: b.filter(c => ['L', 'Q', 'C'].includes(c.op)).length, strictPathMorphCompatible: strictCompatible, commandAndCoordinatePairs: pairs, genericNormalizedVertexPairs: sameGeometry ? null : normalizedPairs(a, b), sameStyle: base.fill === target.fill && base.stroke === target.stroke && base.width === target.width, sameSpace: base.space === target.space, samePartId: base.partId === target.partId, minimalSupplement: 'No data addition under confirmed generic policy. Only request a new data revision if intermediate contact/closure/landmark validation reveals a real defect.' };
    });
    const jointIds = [...new Set([...Object.keys(rig.joints), ...Object.keys(variant.joints ?? {})])];
    const joints = jointIds.map(jointId => ({ jointId, from: rig.joints[jointId] ?? null, to: variant.joints?.[jointId] ?? rig.joints[jointId] ?? null, targetExplicitlyDeclared: Boolean(variant.joints?.[jointId]), delta: variant.joints?.[jointId] && rig.joints[jointId] ? variant.joints[jointId].map((v, index) => v - rig.joints[jointId][index]) : [0, 0], belongsToContact: jointId.startsWith('foot-') }));
    items.push({ artId: id, variantName, poses, targetPosesInRequestedScope: poses.filter(p => ['attack', 'windup', 'trigger'].includes(p)), fixedSourceGeometry: { root: rig.root, center: rig.center, collisionRadius: rig.collisionRadius, softPivot: rig.softPivot }, idSetEqual: baseIds.length === targetIds.length && baseIds.every(s => targetIds.includes(s)), orderEqual: JSON.stringify(baseIds) === JSON.stringify(targetIds), addedIds: targetIds.filter(s => !baseIds.includes(s)), removedIds: baseIds.filter(s => !targetIds.includes(s)), shapes, joints });
  }
}
const changed = items.flatMap(i => i.shapes.filter(s => s.changed).map(s => ({ artId: i.artId, variantName: i.variantName, poses: i.poses, ...s })));
const findings = { identities: new Set(items.map(i => i.artId)).size, variantPairsIncludingSquash: items.length, requestedVariantPairs: items.filter(i => i.targetPosesInRequestedScope.length).length, changedPathPairs: changed.filter(s => s.mode === 'path').length, changedEllipsePairs: changed.filter(s => s.mode === 'ellipse').length, incompatiblePathPairs: changed.filter(s => s.mode === 'path' && !s.strictPathMorphCompatible).map(s => ({ artId: s.artId, variantName: s.variantName, shapeId: s.shapeId, fromSignature: s.fromSignature, toSignature: s.toSignature, closureMismatch: s.fromClosed !== s.toClosed })), namedOrganSetStable: items.every(i => i.idSetEqual), drawOrderStable: items.every(i => i.orderEqual), changedJointPairs: items.flatMap(i => i.joints.filter(j => j.delta.some(n => n !== 0)).map(j => ({ artId: i.artId, variantName: i.variantName, poses: i.poses, ...j }))) };
const payload = { schemaVersion: 1, owner: 'enemy-batch', revision: 'r03', scope: 'read-only pairing audit; no runtime or resource mutation', dependencies: [moduleFingerprint, samplerFingerprint, contractFingerprint], observedGeneric: { blendShapePresent: samplerCode.includes('function blendShape('), normalizedPairPresent: samplerCode.includes('function normalizedPair('), sin2VariantEnvelopePresent: samplerCode.includes('const variantWeight ='), jointInterpolationPresent: samplerCode.includes('const variantJoints ='), status: 'observed active shared implementation; primary confirmation still pending; this audit did not run or approve playback' }, findings, items };
fs.writeFileSync(path.join(out, 'morph-pair-audit.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
const normalized = items.flatMap(i => i.shapes.filter(s => s.mode === 'path' && s.changed).map(s => ({ artId: i.artId, variantName: i.variantName, shapeId: s.shapeId, poses: i.poses, pairingOnly: true, ...s.genericNormalizedVertexPairs })));
fs.writeFileSync(path.join(out, 'vertex-pairs.json'), `${JSON.stringify({ schemaVersion: 1, status: 'read_only_pairing_not_runtime_fields', items: normalized }, null, 2)}\n`, 'utf8');
const landmarkSuggestions = [];
for (const item of items) for (const shape of item.shapes.filter(s => s.changed && s.mode === 'path')) {
  if (item.artId === 'enemy:SCOUT' && ['long-leg-left', 'long-leg-right'].includes(shape.shapeId)) {
    const from = cubicContour(parse(shape.fromD)), to = cubicContour(parse(shape.toD));
    // Match complete upper/lower leg segments, splitting the returning foot
    // arc (C3), rather than splitting the longest thigh-to-ankle arc (C1).
    splitSpecified(to, 3);
    landmarkSuggestions.push({ artId: item.artId, variantName: item.variantName, shapeId: shape.shapeId, status: 'unapplied authored landmark suggestion, primary/owner validation needed', reason: 'Neutral C1 and target C1 each span hip-to-outer-ankle. Neutral C2 and target C2 each span outer ankle-to-foot-bottom. Neutral C3+C4 wrap foot-bottom-to-inner-ankle; pair them to target C3 split at .5. Neutral C5 and target C4 each return inner ankle-to-hip. Generic longest split currently splits target C1 instead and shifts anatomical phase of segment correspondence.', fromD: contourPath(from), toD: contourPath(to), sourceGeometryPreservedExactly: 'only de Casteljau subdivision of target C3; no endpoint geometry change', commandSequence: 'M C C C C C Z', pairs: from.curves.map((c, i) => ({ segmentIndex: i, fromOriginalCommand: c.originalCommandIndex, toOriginalCommand: to.curves[i].originalCommandIndex, fromControlPolygon: c.points, toControlPolygon: to.curves[i].points })) });
  }
  if (item.artId === 'enemy:SIEGE' && shape.shapeId === 'fist-right') {
    const from = cubicContour(parse(shape.fromD)), to = cubicContour(parse(shape.toD));
    // Variant M is the forearm base, while neutral M is the upper inside of
    // the fist. Rotate the closed target to its C1 endpoint (same landmark).
    to.curves = [...to.curves.slice(1), to.curves[0]]; to.start = to.curves[0].points[0];
    splitSpecified(from, 1); splitSpecified(from, 4);
    landmarkSuggestions.push({ artId: item.artId, variantName: item.variantName, shapeId: shape.shapeId, status: 'unapplied authored landmark suggestion, primary/owner validation needed', reason: 'Neutral M=[196,147] is upper inner fist; target M=[182,154] is arm base. Rotate closed target to target C1 endpoint [203,113], then align upper knuckle arcs (neutral C1 halves -> target C2/C3), outer lower fist (C2 -> target C4), outside connector (C3 -> target C5), inner connector/return (C4 halves -> target C6/C1). Generic longest splitting uses neutral C1/C2 with unrotated target and does not encode these landmarks.', fromD: contourPath(from), toD: contourPath(to), sourceGeometryPreservedExactly: 'closed target start rotation plus de Casteljau subdivision of neutral C1/C4; no endpoint geometry change', commandSequence: 'M C C C C C C Z', pairs: from.curves.map((c, i) => ({ segmentIndex: i, fromOriginalCommand: c.originalCommandIndex, toOriginalCommand: to.curves[i].originalCommandIndex, fromControlPolygon: c.points, toControlPolygon: to.curves[i].points })) });
  }
}
fs.writeFileSync(path.join(out, 'landmark-pair-suggestions.json'), `${JSON.stringify({ schemaVersion: 1, status: 'read_only_unapplied_suggestions_not_confirmed_defects', minimalSupplement: 'none until generic intermediate contact/landmark check identifies a visible defect; never stack duplicate morph weights', items: landmarkSuggestions }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ identities: findings.identities, variantPairs: findings.variantPairsIncludingSquash, requestedVariantPairs: findings.requestedVariantPairs, changedPathPairs: findings.changedPathPairs, changedEllipsePairs: findings.changedEllipsePairs, stableIds: findings.namedOrganSetStable, stableOrder: findings.drawOrderStable, rawCommandExceptions: findings.incompatiblePathPairs, splitRecommendations: normalized.filter(n => n.fromSubdivisions.length || n.toSubdivisions.length).map(n => ({ artId: n.artId, variantName: n.variantName, shapeId: n.shapeId, fromSubdivisions: n.fromSubdivisions, toSubdivisions: n.toSubdivisions })) }, null, 2));
