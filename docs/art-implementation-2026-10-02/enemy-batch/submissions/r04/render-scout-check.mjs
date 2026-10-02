import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { ENEMY_RIGS } from '../../../../../src/view/art/characters/enemyRigData.js';

const out = import.meta.dirname, root = path.resolve(out, '../../../../..');
const require = createRequire('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json'), sharp = require('sharp');
const before = JSON.parse(fs.readFileSync(path.join(out, 'before-rigs.json'), 'utf8'));
const proof = JSON.parse(fs.readFileSync(path.join(out, 'split-proof.json'), 'utf8'));
const source = fs.readFileSync(path.join(root, 'src/view/art/characters/rig.js'), 'utf8');
const palette = { brown: '#4B281C', coral: '#F77965', coralLight: '#FF9A7A', cream: '#FFF9EF', pink: '#F4ADA0' };
const injected = source.replace("import { RIGS, PALETTE } from './rigData.js';", `import { ENEMY_RIGS as RIGS } from '${pathToFileURL(path.join(root, 'src/view/art/characters/enemyRigData.js')).href}'; const PALETTE=${JSON.stringify(palette)};`);
if (injected === source) throw new Error('Sampler import contract changed');
const { buildCharacterPlan, planToSvg, getPlanAnchors } = await import(`data:text/javascript;base64,${Buffer.from(injected).toString('base64')}`);
const beforeInjected = source.replace("import { RIGS, PALETTE } from './rigData.js';", `import { ENEMY_RIGS as RIGS } from '${pathToFileURL(path.join(out, 'before-enemyRigData.js')).href}'; const PALETTE=${JSON.stringify(palette)};`);
const oldSampler = await import(`data:text/javascript;base64,${Buffer.from(beforeInjected).toString('base64')}`);
const rig = ENEMY_RIGS['enemy:SCOUT'], frame = { time: 0, quality: 'full' };
const actor = (pose, progress = .5) => ({ artId: 'enemy:SCOUT', x: rig.center[0], y: rig.center[1], radius: rig.collisionRadius, facing: 'right', pose, poseProgress: progress, poseTime: 0, alpha: 1 });
const write = (name, content) => fs.writeFileSync(path.join(out, name), typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`, 'utf8');
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const idsOther = Object.keys(before).filter(id => id !== 'enemy:SCOUT');
if (!idsOther.every(id => JSON.stringify(before[id]) === JSON.stringify(ENEMY_RIGS[id]))) throw new Error('Another identity changed');
const restored = structuredClone(ENEMY_RIGS['enemy:SCOUT']);
for (const rec of proof.records) restored.variants[rec.variant].shapes.find(s => s.id === rec.shapeId).d = rec.fromD;
if (JSON.stringify(restored) !== JSON.stringify(before['enemy:SCOUT'])) throw new Error('SCOUT changed outside four d strings');
const evaluate = (c, t) => c[0].map((_, i) => (1 - t) ** 3 * c[0][i] + 3 * (1 - t) ** 2 * t * c[1][i] + 3 * (1 - t) * t ** 2 * c[2][i] + t ** 3 * c[3][i]);
let maxCurveError = 0;
for (const rec of proof.records) {
  if ((rec.toD.match(/C/g) ?? []).length !== 5) throw new Error('Target must have exactly five C');
  for (let n = 0; n <= 128; n++) {
    const t = n / 128, old = evaluate(rec.originalControlPolygon, t), next = evaluate(rec.splitControlPolygons[t <= .5 ? 0 : 1], t <= .5 ? 2 * t : 2 * t - 1);
    maxCurveError = Math.max(maxCurveError, Math.hypot(old[0] - next[0], old[1] - next[1]));
  }
}
async function raster(svg, name) {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  if (name) fs.writeFileSync(path.join(out, name), png);
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = 256, minY = 256, maxX = -1, maxY = -1, footFillPixels = 0, soleMinX = 256, soleMaxX = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const index = (y * info.width + x) * 4;
    if (data[index + 3] > 0) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    if (y >= 215 && data[index + 3] >= 128 && data[index] > 120) { footFillPixels++; soleMinX = Math.min(soleMinX, x); soleMaxX = Math.max(soleMaxX, x); }
  }
  return { alphaBounds: [minX, minY, maxX - minX + 1, maxY - minY + 1], alphaBottom: maxY, footBandFillPixels: footFillPixels, footBandFillWidth: soleMaxX - soleMinX + 1, footBandFillBBoxCenterX: (soleMinX + soleMaxX) / 2, pngSha256: sha(png) };
}
const samples = [];
let content = '<rect width="100%" height="100%" fill="#FFF9EF"/><text x="12" y="24" font-family="sans-serif" font-size="16" fill="#4B281C">SCOUT current shared sampler attack; target C2 exact split; one body / two legs</text>';
for (let n = 0; n <= 8; n++) {
  const progress = n / 8, input = actor('attack', progress), inputBefore = JSON.stringify(input), plan = buildCharacterPlan(input, frame), anchors = getPlanAnchors(plan);
  if (JSON.stringify(input) !== inputBefore) throw new Error('Input mutated');
  const svg = planToSvg(plan), name = `scout-attack-${String(n).padStart(2, '0')}.png`;
  const facts = await raster(svg, name); write(name.replace('.png', '.svg'), svg);
  const feet = {};
  for (const foot of ['long-leg-left', 'long-leg-right']) {
    const solo = { ...plan, commands: plan.commands.filter(c => c.shape.id === foot) };
    feet[foot] = await raster(planToSvg(solo), `foot-${foot}-${String(n).padStart(2, '0')}.png`);
    if (feet[foot].footBandFillPixels < 80 || feet[foot].footBandFillWidth < 10) throw new Error(`Foot sole collapsed ${foot}/${progress}`);
  }
  const jointMidX = (anchors.parts['foot-left'].x + anchors.parts['foot-right'].x) / 2;
  if (jointMidX !== rig.root[0] || anchors.root.x !== rig.root[0] || anchors.root.y !== rig.root[1]) throw new Error('Contact midpoint/root drift');
  samples.push({ pose: 'attack', progress, root: anchors.root, collisionCenter: anchors.collisionCenter, jointFootMidpointX: jointMidX, feet, ...facts });
  const inner = svg.replace(/^.*?<g opacity=/s, '<g opacity=').replace('</svg>', '');
  const col = n % 5, row = Math.floor(n / 5), x = 16 + col * 214, y = 44 + row * 254;
  content += `<g transform="translate(${x},${y}) scale(.78)">${inner}<path d="M20 236 L236 236" fill="none" stroke="#6BA58C" stroke-width="1"/></g><text x="${x + 8}" y="${y + 220}" font-family="sans-serif" font-size="15" fill="#4B281C">attack p=${progress}</text>`;
}
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1090" height="558">${content}</svg>`;
write('scout-attack-timeline.svg', sheet); await raster(sheet, 'scout-attack-timeline.png');
const endpoints = [];
let epContent = '<rect width="100%" height="100%" fill="#FFF9EF"/><text x="12" y="24" font-family="sans-serif" font-size="16" fill="#4B281C">SCOUT neutral / crouch / chase: endpoint contours preserved; joint midpoint x=128</text>';
for (const [index, sample] of [{ name: 'neutral', pose: 'neutral' }, { name: 'crouch', pose: 'squash' }, { name: 'chase', pose: 'attack', progress: .5 }].entries()) {
  const plan = buildCharacterPlan(actor(sample.pose, sample.progress), frame), anchors = getPlanAnchors(plan), svg = planToSvg(plan);
  const facts = await raster(svg, `scout-${sample.name}.png`), mid = (anchors.parts['foot-left'].x + anchors.parts['foot-right'].x) / 2;
  const oldPlan = oldSampler.buildCharacterPlan(actor(sample.pose, sample.progress), frame), oldFacts = await raster(oldSampler.planToSvg(oldPlan), `before-scout-${sample.name}.png`);
  if (oldFacts.pngSha256 !== facts.pngSha256) throw new Error(`Endpoint raster changed ${sample.name}`);
  if (mid !== 128) throw new Error('Endpoint joint foot midpoint changed');
  endpoints.push({ name: sample.name, jointFootMidpointX: mid, root: anchors.root, endpointBeforePngSha256: oldFacts.pngSha256, endpointRasterByteIdentical: true, ...facts });
  const inner = svg.replace(/^.*?<g opacity=/s, '<g opacity=').replace('</svg>', '');
  epContent += `<g transform="translate(${12 + index * 270},40)">${inner}<path d="M20 236 L236 236" fill="none" stroke="#6BA58C" stroke-width="1"/></g><text x="${25 + index * 270}" y="315" font-family="sans-serif" font-size="16" fill="#4B281C">${sample.name}: alpha bottom ${facts.alphaBottom}</text>`;
}
const epSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="830" height="350">${epContent}</svg>`;
write('scout-endpoints.svg', epSvg); await raster(epSvg, 'scout-endpoints.png');
const validation = { scope: 'Only four SCOUT variant leg paths changed; no shared sampler/registry/public/r02/r03 writes', samplerSha256: sha(source), moduleSha256: sha(fs.readFileSync(path.join(root, 'src/view/art/characters/enemyRigData.js'))), other11IdentitiesDeepEqual: true, scoutAllOtherFieldsDeepEqual: true, maxExactSubdivisionCurveError: maxCurveError, posesTargetCubicCount: 5, jointNeutralCrouchChaseFootMidpointX: endpoints.map(e => e.jointFootMidpointX), actualAlphaEndpointBottoms: endpoints.map(e => ({ name: e.name, bottom: e.alphaBottom })), allThreeEndpointRastersByteIdentical: true, attackEntryExitByteIdenticalToNeutral: samples[0].pngSha256 === endpoints[0].pngSha256 && samples[8].pngSha256 === endpoints[0].pngSha256, poseProgressInputMutation: false, samples, endpoints, limitations: ['Static crouch is the real squash selector; continuous attack samples use real chase selector', 'Fixed foot-joint mean x=128 is not a claim that asymmetric raster mass centroids equal128', 'Alpha bottom is not constant across every pose: original endpoint neutral/crouch/chase bottoms236/238/234 are preserved byte-for-byte. Attack intermediate min233 comes from local contour morph, with constant root and no body translation', 'No production acceptance or gameplay integration claimed'] };
write('validation.json', validation);
console.log(JSON.stringify({ changedPaths: 4, maxCurveError, midpointXs: validation.jointNeutralCrouchChaseFootMidpointX, endpointBottoms: validation.actualAlphaEndpointBottoms, attackBottoms: samples.map(s => s.alphaBottom), minSoleFillPixels: Math.min(...samples.flatMap(s => Object.values(s.feet).map(f => f.footBandFillPixels))) }, null, 2));
