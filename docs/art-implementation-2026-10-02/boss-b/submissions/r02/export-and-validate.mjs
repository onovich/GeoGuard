import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { BOSS_RIGS_B } from '../../../../../src/view/art/characters/bossRigDataB.js';

const out = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(out, '../../../../..');
const require = createRequire(import.meta.url);
const dependencyRoot = process.env.CODEX_WORKSPACE_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp = require(path.join(dependencyRoot, 'sharp'));
const read = relative => fs.readFileSync(path.join(repo, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const sha = relative => crypto.createHash('sha256').update(fs.readFileSync(path.join(repo, relative))).digest('hex');
const write = (relative, value) => { const target = path.join(repo, relative); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2) + '\n'); };
const doc = file => `docs/art-implementation-2026-10-02/boss-b/submissions/r02/${file}`;
const frozen = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(frozen); } return value; };
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const near = (a, b, label) => assert.ok(Math.abs(a - b) < 1e-9, `${label}: ${a} != ${b}`);
const pointNear = (a, b, label) => { near(a.x, b.x, label + '.x'); near(a.y, b.y, label + '.y'); };
const study = json('docs/art-implementation-2026-10-02/boss-b/submissions/r01/sources.json');
const identityMap = json('docs/art-implementation-2026-10-02/integration/submissions/r01/identity-map.json');
const runtimeVariants = json('docs/art-implementation-2026-10-02/integration/submissions/r01/runtime-boss-variants.json');
const approvedContract = 'docs/art-implementation-2026-10-02/characters/submissions/r03/rig-data-output-contract.md';
assert.equal(sha(approvedContract), '2376767cd6bd4379797f261b366345cb4bbac0329546ef3bcf4a6e60a551cd00');

// Evaluate the actual shared sampler with this unregistered group injected in memory.
// No shared file is modified; this is standalone artwork evidence, not API/gameplay integration.
const paletteLiteral = read('src/view/art/characters/rigData.js').match(/export const PALETTE = Object.freeze\((\{[\s\S]*?\})\);/)[1];
const palette = vm.runInNewContext(`(${paletteLiteral})`);
const samplerPath = 'src/view/art/characters/rig.js';
const originalSampler = read(samplerPath);
assert.ok(originalSampler.includes("import { RIGS, PALETTE } from './rigData.js';"));
const samplerText = originalSampler.replace("import { RIGS, PALETTE } from './rigData.js';", `const RIGS = ${JSON.stringify(BOSS_RIGS_B)}; const PALETTE = ${JSON.stringify(palette)};`)
  .replace('return { artId: actor.artId, rig, actor, world, soft, launcher, partMatrices, commands,', 'return { samplerSelectedVariant: variantName, artId: actor.artId, rig, actor, world, soft, launcher, partMatrices, commands,');
const sampler = await import('data:text/javascript;base64,' + Buffer.from(samplerText).toString('base64'));
const { buildCharacterPlan, getPlanAnchors, planToSvg, pathCommands, transformPoint } = sampler;
frozen(BOSS_RIGS_B);

const expectedOrgans = {
  'boss:TWINS_MOON': { crescent: 1, permanentCoralRim: 1, eyes: 2, mouth: 1, limbs: 0 },
  'boss:DRAGON': { continuousBodyTail: 1, wings: 2, roundedMuzzle: 1, eyes: 2, feet: 0 },
  'boss:SPIDER_MATRIARCH': { abdomen: 1, largeLegs: 4, shortFeet: 2, eyes: 2, smile: 1 },
  'boss:ASTROLABE': { moonShell: 1, centerOrb: 1, centerOrbEyes: 2, orbitOrb: 1, shellDot: 1, shellLine: 1 },
  'boss:BLOOD_FORGE': { archBody: 1, doorArms: 2, feet: 2, faceWindow: 1, eyes: 2, coreOrb: 1 },
  'boss:VOID_CONDUCTOR': { robe: 1, faceWindow: 1, eyes: 2, arms: 2, fingersPerHand: 3, skirtLobes: 3, feet: 0 },
  'boss:LABYRINTH_KEEPER': { emptyArch: 1, doorShields: 2, feet: 2, faceWindow: 1, eyes: 2, coreOrb: 0 },
  'boss:NIGHTMARE_BLOOM': { mainPetals: 3, rearLeaves: 2, baseLeaves: 2, blackMouth: 1, upperTeeth: 3, lowerTeeth: 3, eyes: 0 },
};
const actor = (id, overrides = {}) => frozen({ artId: id, key: 'standalone:' + id, x: BOSS_RIGS_B[id].center[0], y: BOSS_RIGS_B[id].center[1], radius: BOSS_RIGS_B[id].collisionRadius, facing: 'right', pose: 'neutral', poseProgress: 0, poseTime: 0, alpha: 1, boss: { phaseIndex: 0, castAbility: null }, ...overrides });
const frame = frozen({ time: 0, dt: 1 / 60, paused: false, quality: 'full' });
const build = (id, changes) => buildCharacterPlan(actor(id, changes), frame);
const png = async svg => sharp(Buffer.from(svg), { density: 144 }).resize(256, 256).png().toBuffer();
async function alphaAudit(buffer, center) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1, edgePixels = 0, visible = 0, maxRadius = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] === 0) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); visible++;
    if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) edgePixels++;
    maxRadius = Math.max(maxRadius, Math.hypot(x + .5 - center[0], y + .5 - center[1]));
  }
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, maxRadius, enclosingRadiusCeil: Math.ceil(maxRadius), edgePixels, visiblePixels: visible, sourceSize: [info.width, info.height], hasAlpha: info.channels === 4 };
}
async function connectedBodyComponents(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(info.width * info.height); const sizes = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || data[start * 4 + 3] < 32) continue;
    let count = 0; const queue = [start]; seen[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head]; const x = index % info.width; const y = Math.floor(index / info.width); count++;
      for (let yy = Math.max(0, y - 1); yy <= Math.min(info.height - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(info.width - 1, x + 1); xx++) {
        const next = yy * info.width + xx;
        if (!seen[next] && data[next * 4 + 3] >= 32) { seen[next] = 1; queue.push(next); }
      }
    }
    if (count > 10) sizes.push(count);
  }
  return sizes.sort((a, b) => b - a);
}
const sheet = (width, height, content, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#FBF8F1"/><path d="M0 0 H8 V8 H0 Z M8 8 H16 V16 H8 Z" fill="#EAE5DC"/></pattern></defs><rect width="100%" height="100%" fill="#FFF9EF"/><text x="18" y="25" font-family="Arial" font-size="17" fill="#4B281C">${escape(title)}</text>${content}</svg>`;
const text = (label, x, y, size = 13) => `<text x="${x}" y="${y}" font-family="Arial" font-size="${size}" fill="#4B281C">${escape(label)}</text>`;
const place = (svg, x, y, side) => `<rect x="${x}" y="${y}" width="${side}" height="${side}" fill="url(#checker)"/>` + svg.replace('<svg ', `<svg x="${x}" y="${y}" `).replace(/width="256" height="256"/, `width="${side}" height="${side}"`);
const sheetPng = async (relative, svg) => { write(doc(relative.replace(/\.png$/, '.svg')), svg); write(doc(relative), await sharp(Buffer.from(svg)).png().toBuffer()); };
const manifest = {};
const audits = {};
const runtimeContent = [];
const iconContent = [];
let totalRootSamples = 0;
let sourceActionCount = 0;
let pathsValidated = 0;
let matricesValidated = 0;
let rotationSamples = 0;
let variantSelections = 0;
let poseBoundSamples = 0;

for (const [row, [id, rig]] of Object.entries(BOSS_RIGS_B).entries()) {
  assert.deepEqual(rig.softPivot, rig.root);
  assert.ok(rig.root.every(Number.isFinite) && rig.center.every(Number.isFinite) && rig.collisionRadius > 0);
  const source = study.identities.find(item => item.identity === id);
  const item = identityMap.identities.find(item => item.artKey === id);
  const runtime = runtimeVariants.filter(item => item.artKey === id);
  assert.equal(runtime[0].radius, rig.referenceRadius);
  assert.equal(item.resourceSlug, id.replace(':', '/').toLowerCase());
  const actualAbilityKeys = [...new Set(runtime.flatMap(item => [...item.phases, ...(item.survivorPhases ?? [])].flatMap(phase => phase.abilities)))].sort();
  assert.deepEqual(Object.keys(rig.abilityVariants).sort(), actualAbilityKeys);
  for (const ref of source.actions.flatMap(action => action.bodySources)) assert.equal(sha(ref.path), ref.sha256);
  for (const variant of [rig, ...Object.values(rig.variants)]) {
    const ids = variant.shapes.map(shape => shape.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const shape of variant.shapes) {
      assert.equal(Boolean(shape.d) + Boolean(shape.ellipse), 1);
      assert.ok(!/shadow|projectile|bullet|hazard|summon|badge|guide|healthbar/.test(shape.id));
      assert.ok(Number.isFinite(shape.width));
      if (shape.d) { assert.ok(!/[^MLCQZ0-9eE+.\s-]/.test(shape.d)); pathCommands(shape.d); pathsValidated++; }
      if (shape.ellipse) assert.ok(shape.ellipse.every(Number.isFinite) && shape.ellipse[2] > 0 && shape.ellipse[3] > 0);
      if (shape.partId) assert.ok(rig.partTransforms[shape.partId]?.pivot, `${id} missing transform ${shape.partId}`);
    }
  }
  const count = expression => rig.shapes.filter(shape => expression.test(shape.id)).length;
  const jointCount = expression => Object.keys(rig.joints).filter(key => expression.test(key)).length;
  if (id === 'boss:TWINS_MOON') { assert.equal(count(/^crescent$/), 1); assert.equal(count(/^coral-lower-rim$/), 1); assert.equal(count(/^eye-/), 2); assert.equal(count(/^mouth$/), 1); }
  if (id === 'boss:DRAGON') { assert.equal(count(/^body-tail$/), 1); assert.equal(count(/^wing-(left|right)$/), 2); assert.equal(count(/^muzzle-neck$/), 1); assert.equal(count(/^eye-/), 2); assert.equal(count(/^foot/), 0); }
  if (id === 'boss:SPIDER_MATRIARCH') { assert.equal(count(/^leg-/), 4); assert.equal(count(/^foot-/), 2); assert.equal(count(/^eye-/), 2); assert.equal(count(/^smile$/), 1); }
  if (id === 'boss:ASTROLABE') { for (const key of ['moon-shell', 'center-orb', 'orbit-orb', 'shell-dot', 'shell-line']) assert.equal(count(new RegExp('^' + key + '$')), 1); assert.equal(count(/^orb-eye-/), 2); }
  if (id === 'boss:BLOOD_FORGE' || id === 'boss:LABYRINTH_KEEPER') { assert.equal(count(/^door-(left|right)$/), 2); assert.equal(count(/^foot-/), 2); assert.equal(count(/^eye-/), 2); assert.equal(count(/^core-orb$/), id === 'boss:BLOOD_FORGE' ? 1 : 0); }
  if (id === 'boss:VOID_CONDUCTOR') { assert.equal(count(/^arm-(left|right)$/), 2); assert.equal(jointCount(/^finger-left-/), 3); assert.equal(jointCount(/^finger-right-/), 3); assert.equal(jointCount(/^skirt-/), 3); assert.equal(count(/^eye-/), 2); }
  if (id === 'boss:NIGHTMARE_BLOOM') { assert.equal(count(/^main-petal-(top|left|right)$/), 3); assert.equal(count(/^rear-leaf-/), 2); assert.equal(count(/^base-leaf-/), 2); assert.equal(count(/^tooth-upper-/), 3); assert.equal(count(/^tooth-lower-/), 3); assert.equal(count(/eye/), 0); }

  const neutral = build(id);
  const neutralAnchors = getPlanAnchors(neutral);
  const immutableInput = actor(id);
  const immutableSnapshot = JSON.stringify(immutableInput);
  buildCharacterPlan(immutableInput, frame);
  assert.equal(JSON.stringify(immutableInput), immutableSnapshot);
  const variantsTested = [];
  let rootError = 0;
  for (const facing of ['right', 'left', 'up']) for (const pose of ['neutral', 'move', 'squash', 'stretch', 'windup', 'attack', 'recover']) for (let step = 0; step <= 16; step++) {
    const plan = build(id, { facing, pose, poseProgress: step / 16, poseTime: step * .72 / 16 });
    const anchors = getPlanAnchors(plan);
    pointNear(anchors.root, neutralAnchors.root, 'fixed R');
    pointNear(anchors.collisionCenter, { x: rig.center[0], y: rig.center[1] }, 'fixed C');
    rootError = Math.max(rootError, Math.hypot(anchors.root.x - neutralAnchors.root.x, anchors.root.y - neutralAnchors.root.y));
    for (const key of Object.keys(rig.joints).filter(key => key.startsWith('foot-'))) {
      const baseline = getPlanAnchors(build(id, { facing })).parts[key]; pointNear(anchors.parts[key], baseline, 'fixed contact');
    }
    for (const command of plan.commands) { assert.ok(command.matrix.every(Number.isFinite)); matricesValidated++; }
    for (const [partId, declaration] of Object.entries(rig.partTransforms ?? {})) if (declaration.rigid) {
      const matrix = plan.partMatrices[partId];
      near(Math.hypot(matrix[0], matrix[1]), 1, 'rigid dimension x'); near(Math.hypot(matrix[2], matrix[3]), 1, 'rigid dimension y');
      pointNear({ x: transformPoint(matrix, declaration.pivot)[0], y: transformPoint(matrix, declaration.pivot)[1] }, { x: transformPoint(plan.soft, declaration.pivot)[0], y: transformPoint(plan.soft, declaration.pivot)[1] }, 'rigid attachment'); rotationSamples++;
    }
    const eyeCommands = plan.commands.filter(command => /^(eye-|orb-eye-)/.test(command.shape.id));
    for (const command of eyeCommands) {
      const p = rig.joints[command.shape.id]; const actual = transformPoint(command.matrix, p);
      pointNear({ x: actual[0], y: actual[1] }, anchors.parts[command.shape.id], 'face follows parent');
    }
    totalRootSamples++;
  }
  for (const ability of actualAbilityKeys) for (const pose of ['windup', 'attack', 'recover']) {
    const plan = build(id, { pose, poseProgress: .5, boss: { phaseIndex: 2, castAbility: ability } });
    assert.equal(plan.samplerSelectedVariant, rig.abilityVariants[ability][pose]); variantSelections++;
    variantsTested.push({ ability, pose, selected: plan.samplerSelectedVariant });
  }
  for (const phaseIndex of [0, 1, 2]) { const plan = build(id, { pose: 'intro', boss: { phaseIndex, castAbility: null } }); assert.equal(plan.samplerSelectedVariant, rig.phaseVariants[phaseIndex]); variantSelections++; }
  const start = build(id, { pose: 'move', poseTime: 0 }); const end = build(id, { pose: 'move', poseTime: .72 });
  start.commands.forEach((command, index) => command.matrix.forEach((v, component) => near(v, end.commands[index].matrix[component], 'move loop seam')));

  const targetDir = 'public/art/characters/v1/' + item.resourceSlug;
  const neutralSvg = planToSvg(neutral);
  const neutralPng = await png(neutralSvg);
  const pixels = await alphaAudit(neutralPng, rig.center);
  assert.equal(pixels.edgePixels, 0);
  write(`${targetDir}/source.svg`, neutralSvg); write(`${targetDir}/body.svg`, neutralSvg); write(`${targetDir}/body.png`, neutralPng);
  write(doc(`editable/${item.resourceSlug}.svg`), neutralSvg);
  const iconSide = Math.max(pixels.width, pixels.height) + 10;
  const iconBox = [pixels.x + (pixels.width - iconSide) / 2, pixels.y + (pixels.height - iconSide) / 2, iconSide, iconSide];
  const iconSvg = planToSvg(neutral, { width: 64, height: 64, viewBox: iconBox });
  write(`${targetDir}/icon.svg`, iconSvg); write(`${targetDir}/icon.png`, await sharp(Buffer.from(iconSvg), { density: 144 }).resize(64, 64).png().toBuffer());
  for (let col = 0; col < 3; col++) { const side = [48, 64, 96][col]; iconContent.push(place(iconSvg.replace(/width="64" height="64"/, 'width="256" height="256"'), col * 174 + 35, row * 140 + 40, side), text(`${id.split(':')[1]} ${side}px`, col * 174 + 10, row * 140 + 155, 11)); }

  const poses = [
    ['neutral', {}], ['squash', { pose: 'squash' }], ['stretch', { pose: 'stretch' }],
    ['windup', { pose: 'windup', poseProgress: 1 }], ['attack', { pose: 'attack', poseProgress: .5 }], ['open', { pose: 'recover' }],
    ['left', { facing: 'left' }], ['move', { pose: 'move', poseTime: .18 }], ['up-fallback', { facing: 'up' }],
  ];
  const poseSheet = [];
  const boundsByPose = [];
  for (let index = 0; index < poses.length; index++) {
    const [name, changes] = poses[index]; const plan = build(id, changes); const svg = planToSvg(plan); const buffer = await png(svg);
    const alpha = await alphaAudit(buffer, rig.center); assert.equal(alpha.edgePixels, 0, `${id}/${name} clipped canvas`); poseBoundSamples++;
    const components = await connectedBodyComponents(buffer);
    assert.equal(components.length, id === 'boss:ASTROLABE' ? 3 : 1, `${id}/${name} detached body components ${components}`);
    write(doc(`transparent/${item.resourceSlug.split('/')[1]}-${name}.png`), buffer);
    if (['neutral', 'windup', 'attack', 'open'].includes(name)) { write(`${targetDir}/clips/${name}.svg`, svg); write(`${targetDir}/clips/${name}.png`, buffer); }
    const x = index % 3 * 276 + 12, y = Math.floor(index / 3) * 280 + 40;
    poseSheet.push(place(svg, x, y, 256), text(`${name} | fixed R ${rig.root.join(',')}`, x, y + 270));
    boundsByPose.push({ pose: name, pixels: alpha, connectedOpaqueComponents: components, anchors: getPlanAnchors(plan) });
  }
  await sheetPng(`previews/${item.resourceSlug.split('/')[1]}-poses.png`, sheet(828, 894, poseSheet.join(''), id + ' | 256 untrimmed body poses'));

  const motion = [];
  const motionFrames = [];
  for (let poseRow = 0; poseRow < 2; poseRow++) for (let step = 0; step <= 4; step++) {
    const pose = ['windup', 'attack'][poseRow]; const progress = step / 4;
    const plan = build(id, { pose, poseProgress: progress }); const svg = planToSvg(plan);
    const buffer = await png(svg); const alpha = await alphaAudit(buffer, rig.center); assert.equal(alpha.edgePixels, 0, `${id}/${pose}/${progress} clipped`); poseBoundSamples++;
    const components = await connectedBodyComponents(buffer);
    assert.equal(components.length, id === 'boss:ASTROLABE' ? 3 : 1, `${id}/${pose}/${progress} disconnected body`);
    motion.push(place(svg, step * 184 + 8, poseRow * 209 + 40, 176), text(`${pose} p=${progress}`, step * 184 + 8, poseRow * 209 + 234, 12));
    motionFrames.push({ pose, progress, anchors: getPlanAnchors(plan), alphaBounds: alpha, connectedOpaqueComponents: components });
  }
  await sheetPng(`previews/${item.resourceSlug.split('/')[1]}-motion.png`, sheet(920, 462, motion.join(''), id + ' | actual shared sampler intermediates'));
  const anchorMarks = [];
  const dot = (key, p, color) => `<circle cx="${p.x}" cy="${p.y}" r="2.2" fill="${color}"/>` + text(key, p.x + 3, p.y - 3, 7);
  anchorMarks.push(`<circle cx="${rig.center[0]}" cy="${rig.center[1]}" r="${rig.collisionRadius}" fill="none" stroke="#888888" stroke-width=".8" stroke-dasharray="3 3"/>`, dot('R', neutralAnchors.root, '#216DCA'), dot('C0', neutralAnchors.collisionCenter, '#888888'));
  Object.entries(neutralAnchors.parts).forEach(([key, p]) => anchorMarks.push(dot(key, p, '#20724A')));
  const anchorSvg = neutralSvg.replace('</svg>', anchorMarks.join('') + '</svg>');
  write(doc(`previews/${item.resourceSlug.split('/')[1]}-anchors.svg`), anchorSvg);
  write(doc(`previews/${item.resourceSlug.split('/')[1]}-anchors.png`), await png(anchorSvg));

  const runtimePoses = ['neutral', 'squash', 'stretch', 'windup', 'attack', 'open', 'left'];
  for (let col = 0; col < runtimePoses.length; col++) {
    const name = runtimePoses[col]; const changes = poses.find(p => p[0] === name)[1];
    const plan = build(id, { ...changes, x: 70, y: 42, radius: rig.referenceRadius });
    const svg = planToSvg(plan, { width: 140, height: 88, viewBox: [0, 0, 140, 88] });
    runtimeContent.push(`<rect x="${col * 140}" y="${row * 100 + 36}" width="140" height="88" fill="url(#checker)"/>` + svg.replace('<svg ', `<svg x="${col * 140}" y="${row * 100 + 36}" `), text(`${id.split(':')[1]} r${rig.referenceRadius} ${name}`, col * 140 + 5, row * 100 + 128, 8.4));
  }
  const clipForCell = label => ({ NEUTRAL: 'neutral', WINDUP: 'windup', ATTACK: 'attack', OPEN: 'open' }[label]);
  const actionMappings = Object.fromEntries(source.actions.map(action => [action.action, { bodyPose: clipForCell(action.bodySources[0].label), resource: `art/characters/v1/${item.resourceSlug}/clips/${clipForCell(action.bodySources[0].label)}.svg`, mappingMode: action.mappingMode, bodySources: action.bodySources, runtimeAbilityIds: action.runtimeAbilityIds, externalSummons: action.independentSummons, externalEffects: action.independentEffects, externalProjectiles: action.independentProjectiles }]));
  sourceActionCount += Object.keys(actionMappings).length;
  const parentForJoint = key => key.startsWith('orb-eye-') ? 'center-orb' : key.startsWith('finger-') ? `hand-forearm-${key.split('-')[1]}` : key.startsWith('tooth-') ? 'mouth' : key === 'muzzle-aperture' ? 'muzzle' : key === 'wing-left-tip' ? 'wing-left' : key === 'wing-right-tip' ? 'wing-right' : 'body';
  const parts = [{ id: 'body', parent: null, pivotPx: rig.softPivot, class: 'soft-body', sourceShapeIds: rig.shapes.filter(shape => !shape.partId && shape.space !== 'fixed').map(shape => shape.id) }, ...Object.entries(rig.joints).map(([key, pivot]) => ({ id: key, parent: parentForJoint(key), pivotPx: pivot, class: key.startsWith('foot-') ? 'fixed-contact' : rig.partTransforms?.[key]?.rigid ? 'rigid-attached' : 'soft-attached', embeddedContour: !rig.shapes.some(shape => shape.id === key) }))];
  manifest[id] = {
    schemaVersion: 1, artId: id, status: 'produced_pending_primary_review', version: 'v1', sourceSize: { width: 256, height: 256 }, rootPx: rig.root, collisionCenterPx: rig.center, collisionRadiusPx: rig.collisionRadius,
    referenceRuntimeRadius: rig.referenceRadius, visualScaleMode: 'runtime-radius', anchorsMeasured: true,
    geometryMeasurementMode: 'Authored Bézier source-space joints and source collision-reference circle measured in vector units, verified through shared sampler; neutral raster alpha envelope measured independently. r0 is the authored collision-reference circle, not an enclosing silhouette radius.', neutralAlphaBoundsPx: pixels,
    parts, organCounts: expectedOrgans[id], partTransforms: rig.partTransforms ?? {}, muzzles: [],
    castingCue: id === 'boss:DRAGON' ? { partId: 'muzzle', positionPx: rig.joints['muzzle-aperture'], purpose: 'Optional cosmetic cue only; no runtime projectile origin relocation' } : null,
    directions: { right: { bodyRotation: 0 }, left: { reflectionAxisPx: 128, wholeRig: true, bodyRotation: 0 }, up: { bodyRotation: 0, mode: 'same approved right body; no extra up source exists for these bosses', newProjectionProduced: false } },
    icon: { src: `art/characters/v1/${item.resourceSlug}/icon.svg`, width: 64, height: 64, viewBox: iconBox }, bodyPng: `art/characters/v1/${item.resourceSlug}/body.png`, sourceFile: `art/characters/v1/${item.resourceSlug}/source.svg`,
    clips: { neutral: { sourceSize: [256, 256], sourceOffset: [0, 0], trim: null, loop: false }, windup: { sampler: 'shared continuous source-local compression and authored parts', duration: 'existing runtime windup window', loop: false }, attack: { sampler: 'shared sin(progress*pi) body and local part pulse', duration: 'existing runtime action window', loop: false }, open: { bodyReuse: 'neutral', externalOverlayOnly: true }, move: { duration: .72, loop: true, verifiedSeam: true }, squash: { sampler: 'shared sampleSoftPose' }, stretch: { sampler: 'shared sampleSoftPose' } },
    phaseVariants: rig.phaseVariants, abilityVariants: rig.abilityVariants, runtimeTemplates: runtime.map(row => ({ templateId: row.templateId, runtimeId: row.runtimeId, radius: row.radius, phases: row.phases, survivorPhases: row.survivorPhases })),
    actions: actionMappings, referenceSources: [...new Map(source.actions.flatMap(action => action.bodySources).map(ref => [ref.path, { path: ref.path, sha256: ref.sha256, reviewEvidence: ref.reviewEvidence }])).values()],
    integrationStatus: 'standalone group, not registered by this worker', continuousTransitionLimit: 'Per-pose intermediates verified; current shared windup end and attack start have different soft transforms. Global cross-pose blending belongs to character owner/QA.',
  };
  write(`${targetDir}/rig.json`, manifest[id]);
  audits[id] = { rootPx: rig.root, centerPx: rig.center, collisionRadiusPx: rig.collisionRadius, measuredNeutralEnclosingRadiusPx: pixels.enclosingRadiusCeil, referenceRadius: rig.referenceRadius, maxRootError: rootError, rootSampleCount: 3 * 7 * 17, organCounts: expectedOrgans[id], neutralAnchors, posedBounds: boundsByPose, motionFrames, actualAbilityKeys, abilitySelections: variantsTested, independentSummonIds: [...new Set(source.actions.flatMap(action => action.independentSummons).map(summon => summon.id))], transitionBoundary: { windupEnd: getPlanAnchors(build(id, { pose: 'windup', poseProgress: 1 })), attackStart: getPlanAnchors(build(id, { pose: 'attack', poseProgress: 0 })), interpolationImplementedByGroup: false } };
}
await sheetPng('previews/runtime-size-contact-sheet.png', sheet(980, 850, runtimeContent.join(''), 'Boss B | radius from actual runtime | 1 world unit = 1 pixel'));
write(doc('previews/runtime-size-contact-sheet-2x.png'), await sharp(path.join(repo, doc('previews/runtime-size-contact-sheet.png'))).resize({ width: 1960, kernel: 'nearest' }).png().toBuffer());
await sheetPng('previews/icon-size-contact-sheet.png', sheet(522, 1176, iconContent.join(''), 'Boss B | independent measured icon crop | 48 / 64 / 96px'));
write(doc('manifest.json'), manifest);
write(doc('anchor-audit.json'), audits);
write(doc('source-provenance.json'), { finalViewedBoards: study.viewedFinalBodyBoards, viewedSceneBoards: study.viewedFinalSceneBoards, originalActions: study.identities, productionApprovals: 'Pending primary. Original art accepted does not self-approve new resources.' });
write(doc('verification.json'), {
  schemaVersion: 1, status: 'standalone_group_geometry_and_exports_passed', identitiesProduced: 8, originalSourceActionsMapped: sourceActionCount, uniqueBodyKeyCells: 32,
  runtimeAbilityKeysMapped: Object.values(audits).reduce((sum, audit) => sum + audit.actualAbilityKeys.length, 0), rootSamples: totalRootSamples, maxRootError: 0,
  pathsValidated, finiteMatricesValidated: matricesValidated, rigidDimensionAndMountSamples: rotationSamples, abilityAndPhaseSelections: variantSelections, rasterPoseBoundsChecked: poseBoundSamples,
  transparentEdgeClipping: 0, callerInputMutation: false, moveLoopSeam: true, groundContactsFixed: true, faceAttachmentChecked: true, namedOrganCountsChecked: true,
  rasterBodyConnectivity: '152 source pose and action intermediate rasters: 3 separated approved primary blocks for ASTROLABE; 1 connected body for every other identity',
  renderMode: 'Actual shared rig.js source evaluated with this group injected in memory; planToSvg to sharp local raster, no browser',
  sharedSamplerSHA256: sha(samplerPath), groupDataSHA256: sha('src/view/art/characters/bossRigDataB.js'), contractSHA256: sha(approvedContract),
  sharedRegistryWritten: false, gameplayIntegrated: false, publicAPIPlaybackVerified: false, primaryVisualApproval: 'pending',
  limitations: ['Cross-pose windup-to-attack soft deformation is discontinuous in current shared sampler; owner/QA must validate or blend', 'UP uses unchanged approved right body: no invented up projection', 'Part count through authored paths/joints complements visual inspection; not automatic visual acceptance'],
});
console.log(JSON.stringify({ status: 'passed', ids: 8, sources: sourceActionCount, roots: totalRootSamples, enclosingRadii: Object.fromEntries(Object.entries(audits).map(([id, audit]) => [id, audit.measuredNeutralEnclosingRadiusPx])), samplerSHA: sha(samplerPath) }, null, 2));
