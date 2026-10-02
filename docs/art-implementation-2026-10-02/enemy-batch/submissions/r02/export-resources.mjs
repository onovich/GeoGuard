import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { ENEMY_RIGS } from '../../../../../src/view/art/characters/enemyRigData.js';

const out = import.meta.dirname;
const root = path.resolve(out, '../../../../..');
const require = createRequire('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const sharp = require('sharp');
const palette = { brown: '#4B281C', sage: '#B6D4AE', sageLight: '#D1E4BA', sageShade: '#7E9F71', coral: '#F77965', coralLight: '#FF9A7A', coralShade: '#CB584C', cream: '#FFF9EF', honey: '#F8DDAA', honeyLight: '#FFEAC3', greenDark: '#345634', pink: '#F4ADA0' };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const json = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const write = (p, data) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`, 'utf8'); };
const identityMap = json('docs/art-implementation-2026-10-02/integration/submissions/r01/identity-map.json');
const actionMap = json('docs/art-implementation-2026-10-02/enemy-batch/submissions/r01/actions.json');
const anatomy = json('docs/art-implementation-2026-10-02/enemy-batch/submissions/r01/anatomy.json');
const expectedContractSha = 'b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba';
if (sha(path.join(root, 'docs/art-implementation-2026-10-02/integration/submissions/r01/packet.json')) !== expectedContractSha) throw new Error('Approved integration contract changed');
const sourceCoverage = json('docs/art-implementation-2026-10-02/characters/submissions/r01/coverage.json');
const sampleCode = fs.readFileSync(path.join(root, 'src/view/art/characters/rig.js'), 'utf8');
// Offline export adapter: inject only this group's data into an in-memory snapshot
// of the owner's sampler. No registry change and no second runtime renderer.
const injected = sampleCode.replace("import { RIGS, PALETTE } from './rigData.js';", `import { ENEMY_RIGS as RIGS } from '${pathToFileURL(path.join(root, 'src/view/art/characters/enemyRigData.js')).href}';\nconst PALETTE=${JSON.stringify(palette)};`);
if (injected === sampleCode) throw new Error('Shared sampler import changed; require contract check');
const sampler = await import(`data:text/javascript;base64,${Buffer.from(injected).toString('base64')}`);
const { buildCharacterPlan, getPlanAnchors, planToSvg, pathCommands, transformPoint } = sampler;
const neutralActor = (id, rig, options = {}) => ({ artId: id, x: rig.center[0], y: rig.center[1], radius: rig.collisionRadius, facing: 'right', pose: 'neutral', poseProgress: .5, poseTime: 0, alpha: 1, ...options });
const samples = [
  { name: 'neutral', pose: 'neutral' }, { name: 'squash', pose: 'squash' }, { name: 'stretch', pose: 'stretch' },
  { name: 'action', pose: 'attack' }, { name: 'left', pose: 'neutral', facing: 'left' },
  { name: 'up', pose: 'neutral', facing: 'up' },
  { name: 'windup', pose: 'windup', poseProgress: 1 }, { name: 'trigger', pose: 'trigger', poseProgress: .5 },
];
const actionPose = (id, action) => ({ NEUTRAL: 'neutral', MOVE: 'move', SQUASH: 'squash', STRETCH: 'stretch', RUN: 'attack', ATTACK: 'attack', HEAVY_MOVE: 'squash', HOP: 'attack', GUARD: 'attack', HEAL: 'attack', INFLATE: 'attack', JAM: 'attack', PHASE_DASH: 'neutral', EMERGE: 'neutral', SUMMON_3_BASIC: 'windup/trigger/recover', CHASE_PLAYER: 'attack', STRIKE_TOWER: 'attack' }[action]);
const manifest = {};
const checks = [];
const rasterFacts = [];
const svgById = new Map();
async function raster(svg, filename) {
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, buffer);
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1, transparent = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const alpha = data[(y * info.width + x) * 4 + 3];
    if (alpha === 0) transparent++;
    if (alpha > 0) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  }
  const fact = { path: path.relative(root, filename).replaceAll('\\', '/'), width: info.width, height: info.height, transparentPixels: transparent, alphaBounds: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }, touchesCanvasEdge: minX === 0 || minY === 0 || maxX === info.width - 1 || maxY === info.height - 1 };
  // Connected alpha is useful evidence for attached limbs. Count substantial
  // components, ignoring at most 2 raster pixels of antialias debris.
  if (fact.path.startsWith('public/') && info.width === 256) {
    const seen = new Uint8Array(info.width * info.height), componentPixels = [];
    for (let index = 0; index < seen.length; index++) {
      if (seen[index] || data[index * 4 + 3] < 128) continue;
      const queue = [index]; seen[index] = 1;
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const current = queue[cursor], x = current % info.width, y = Math.floor(current / info.width);
        for (const next of [x ? current - 1 : -1, x + 1 < info.width ? current + 1 : -1, y ? current - info.width : -1, y + 1 < info.height ? current + info.width : -1]) {
          if (next < 0 || seen[next] || data[next * 4 + 3] < 128) continue;
          seen[next] = 1; queue.push(next);
        }
      }
      componentPixels.push(queue.length);
    }
    fact.substantialAlphaComponents = componentPixels.filter(n => n > 2).length;
    fact.componentPixels = componentPixels.filter(n => n > 2);
  }
  rasterFacts.push(fact); return fact;
}
for (const [id, rig] of Object.entries(ENEMY_RIGS)) {
  const mapItem = identityMap.identities.find(i => i.artKey === id);
  if (!mapItem || !mapItem.resourceSlug.startsWith('enemy/')) throw new Error(`Unknown slug ${id}`);
  const dir = path.join(root, 'public/art/characters/v1', mapItem.resourceSlug);
  const actor = neutralActor(id, rig);
  const plan = buildCharacterPlan(actor);
  const anchors = getPlanAnchors(plan);
  const svg = planToSvg(plan);
  write(path.join(dir, 'source.svg'), svg); write(path.join(dir, 'body.svg'), svg);
  const neutralRaster = await raster(svg, path.join(dir, 'body.png'));
  const b = neutralRaster.alphaBounds, side = Math.max(b.width, b.height) + 12;
  const crop = [b.x + (b.width - side) / 2, b.y + (b.height - side) / 2, side, side];
  write(path.join(dir, 'icon.svg'), planToSvg(plan, { width: 64, height: 64, viewBox: crop }));
  await raster(planToSvg(plan, { width: 64, height: 64, viewBox: crop }), path.join(dir, 'icon.png'));
  const poseSvgs = {};
  for (const sample of samples) {
    const sampled = buildCharacterPlan(neutralActor(id, rig, sample));
    const sampleSvg = planToSvg(sampled); poseSvgs[sample.name] = sampleSvg;
    write(path.join(dir, 'poses', `${sample.name}.svg`), sampleSvg);
    await raster(sampleSvg, path.join(dir, 'poses', `${sample.name}.png`));
  }
  // Representative true-radius source uses 96px viewport with no upscale.
  const trueSizePlan = buildCharacterPlan({ ...actor, x: 48, y: 40, radius: rig.referenceRadius });
  await raster(planToSvg(trueSizePlan, { width: 96, height: 96, viewBox: [0, 0, 96, 96] }), path.join(out, 'runtime-size', `${mapItem.resourceSlug.split('/')[1]}.png`));
  svgById.set(id, poseSvgs);
  const actions = actionMap.items.filter(i => i.identity === id);
  manifest[id] = { schemaVersion: 1, artId: id, status: 'produced_pending_review', sourceSize: [256, 256], rootPx: rig.root, collisionCenterPx: rig.center, collisionRadiusPx: rig.collisionRadius, referenceRuntimeRadius: rig.referenceRadius, visualScaleMode: 'runtime-radius', anchorsMeasured: true, measurementMode: 'authored vector coordinates plus neutral raster alpha bounds; not measured from concept board', neutralAlphaBounds: b, organAnatomy: anatomy.items.find(i => i.key === id).anatomy, organCounts: sourceCoverage.items.find(i => i.identity === id).organCounts, organParts: anatomy.items.find(i => i.key === id).finalBodyParts, joints: rig.joints, muzzleAnchors: [], poseVariants: rig.poseVariants ?? {}, partTransforms: rig.partTransforms ?? {}, sourceFile: `art/characters/v1/${mapItem.resourceSlug}/source.svg`, bodyResource: `art/characters/v1/${mapItem.resourceSlug}/body.png`, icon: { src: `art/characters/v1/${mapItem.resourceSlug}/icon.svg`, width: 64, height: 64, viewBox: crop }, independentSummons: actions.flatMap(a => a.independentSummons), directions: { right: 'authored neutral', left: 'whole rig reflected around fixed source root; all attached facial/organ parts included', up: 'nearest approved body projection; no separate up silhouette for these enemies' }, actions: Object.fromEntries(actions.map(a => [a.action, { pose: actionPose(id, a.action), bodySources: a.bodySources, mappingMode: a.mappingMode, effects: a.effects, productionStatus: 'produced_pending_review' }])) };
  write(path.join(dir, 'rig.json'), manifest[id]);
  let maxRootError = 0, maxCenterError = 0, cases = 0;
  for (const pose of ['neutral', 'squash', 'stretch', 'move', 'attack', 'windup', 'trigger', 'recover', 'fade']) for (const facing of ['right', 'left', 'up']) for (const progress of [0, .25, .5, .75, 1]) {
    const input = neutralActor(id, rig, { x: 30, y: 44, radius: rig.referenceRadius, pose, facing, poseProgress: progress, poseTime: progress * .72, alpha: .7 });
    const before = JSON.stringify(input); const p = buildCharacterPlan(input); const a = getPlanAnchors(p);
    if (JSON.stringify(input) !== before) throw new Error(`Input mutated ${id}`);
    const scale = input.radius / rig.collisionRadius, flip = facing === 'left' ? -1 : 1;
    const expectedRoot = [input.x + scale * flip * (rig.root[0] - rig.center[0]), input.y + scale * (rig.root[1] - rig.center[1])];
    maxRootError = Math.max(maxRootError, Math.hypot(a.root.x - expectedRoot[0], a.root.y - expectedRoot[1]));
    maxCenterError = Math.max(maxCenterError, Math.hypot(a.collisionCenter.x - input.x, a.collisionCenter.y - input.y));
    const shapeIds = new Set();
    for (const cmd of p.commands) {
      if (shapeIds.has(cmd.shape.id)) throw new Error(`Duplicate shape ${id}/${cmd.shape.id}`); shapeIds.add(cmd.shape.id);
      if (Boolean(cmd.shape.d) === Boolean(cmd.shape.ellipse)) throw new Error('Exactly one shape geometry required');
      if (cmd.shape.d) pathCommands(cmd.shape.d);
      if (cmd.matrix.some(n => !Number.isFinite(n))) throw new Error('Nonfinite matrix');
      if (cmd.shape.partId && !p.rig.partTransforms[cmd.shape.partId]) throw new Error(`Missing part transform ${id}`);
    }
    if (a.muzzles.length) throw new Error('Enemy muzzle introduced');
    cases++;
  }
  if (maxRootError > 1e-9 || maxCenterError > 1e-9) throw new Error('Fixed geometry drift');
  const moveStart = planToSvg(buildCharacterPlan(neutralActor(id, rig, { pose: 'move', poseTime: 0 })));
  const moveEnd = planToSvg(buildCharacterPlan(neutralActor(id, rig, { pose: 'move', poseTime: .72 })));
  // Compare numeric commands with tolerance instead of SVG float serialization.
  const p0 = buildCharacterPlan(neutralActor(id, rig, { pose: 'move', poseTime: 0 }));
  const p1 = buildCharacterPlan(neutralActor(id, rig, { pose: 'move', poseTime: .72 }));
  const seamError = Math.max(...p0.commands.flatMap((c, i) => c.matrix.map((v, j) => Math.abs(v - p1.commands[i].matrix[j]))));
  checks.push({ artId: id, sampleCases: cases, maxRootError, maxCenterError, inputMutation: false, muzzleCount: 0, moveSeamMatrixError: seamError, moveSeamIssue: seamError > 1e-8 ? 'neutral independent organ sway periods differ; combined cycle needs owner policy' : null });
}
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const ids = Object.keys(ENEMY_RIGS);
for (let group = 0; group < 3; group++) {
  const groupIds = ids.slice(group * 4, group * 4 + 4);
  const cols = ['neutral', 'squash', 'stretch', 'action', 'left'];
  const tile = 216, rowHeight = 246, width = cols.length * tile + 132, height = groupIds.length * rowHeight + 44;
  let content = `<rect width="100%" height="100%" fill="#FFF9EF"/><text x="12" y="24" font-size="18" font-family="sans-serif" fill="#4B281C">enemy-batch r02 / body only / production pending review</text>`;
  for (let r = 0; r < groupIds.length; r++) {
    const id = groupIds[r]; content += `<text x="10" y="${70 + r * rowHeight}" font-size="16" font-family="sans-serif" fill="#4B281C">${escape(id.split(':')[1])}</text>`;
    for (let c = 0; c < cols.length; c++) {
      const name = cols[c], x = 132 + c * tile, y = 40 + r * rowHeight;
      const inner = svgById.get(id)[name].replace(/^.*?<g opacity=/s, '<g opacity=').replace('</svg>', '');
      content += `<g transform="translate(${x},${y}) scale(${(tile - 8) / 256})"><rect width="256" height="256" fill="#FFFDF7" stroke="#DACABB"/>${inner}</g><text x="${x + 10}" y="${y + 225}" font-size="15" font-family="sans-serif" fill="#4B281C">${name}</text>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;
  write(path.join(out, `poses-${group + 1}.svg`), svg); await raster(svg, path.join(out, `poses-${group + 1}.png`));
}
let small = '<rect width="100%" height="100%" fill="#FFF9EF"/><text x="12" y="26" font-family="sans-serif" font-size="18" fill="#4B281C">Actual runtime radius at 1x / 64px icon / no gameplay integration claim</text>';
for (let i = 0; i < ids.length; i++) {
  const id = ids[i], rig = ENEMY_RIGS[id], x = 16 + (i % 4) * 290, y = 48 + Math.floor(i / 4) * 170;
  small += `<text x="${x}" y="${y + 18}" font-size="17" font-family="sans-serif" fill="#4B281C">${id.split(':')[1]} r=${rig.referenceRadius}</text><rect x="${x}" y="${y + 34}" width="96" height="96" fill="#fffdf7" stroke="#D9CDBE"/>`;
  const p = buildCharacterPlan(neutralActor(id, rig, { x: 48, y: 40, radius: rig.referenceRadius }));
  const inner = planToSvg(p, { width: 96, height: 96, viewBox: [0, 0, 96, 96] }).replace(/^.*?<g opacity=/s, '<g opacity=').replace('</svg>', '');
  small += `<g transform="translate(${x},${y + 34})">${inner}</g>`;
  const icon = fs.readFileSync(path.join(root, 'public', manifest[id].icon.src), 'utf8').replace(/^.*?<g opacity=/s, '<g opacity=').replace('</svg>', '');
  const crop = manifest[id].icon.viewBox, scale = 64 / crop[2];
  small += `<g transform="translate(${x + 132 - crop[0] * scale},${y + 48 - crop[1] * scale}) scale(${scale})">${icon}</g>`;
}
const smallSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="572" viewBox="0 0 1180 572">${small}</svg>`;
write(path.join(out, 'runtime-size-contact.svg'), smallSvg); await raster(smallSvg, path.join(out, 'runtime-size-contact.png'));
// Show actual intermediate progress from the approved shared sampler. Static
// pose variants are visibly selected immediately; they are not interpolated.
for (let group = 0; group < 3; group++) {
  const groupIds = ids.slice(group * 4, group * 4 + 4), tile = 160, rowHeight = 196;
  let content = '<rect width="100%" height="100%" fill="#FFF9EF"/><text x="10" y="24" font-family="sans-serif" font-size="16" fill="#4B281C">Neutral | attack progress 0, .25, .5, .75, 1 (static variant entry is not interpolated)</text>';
  for (let row = 0; row < groupIds.length; row++) {
    const id = groupIds[row], rig = ENEMY_RIGS[id];
    content += `<text x="10" y="${65 + row * rowHeight}" font-family="sans-serif" font-size="14" fill="#4B281C">${id.split(':')[1]}</text>`;
    for (let col = 0; col < 6; col++) {
      const progress = col === 0 ? 0 : (col - 1) / 4;
      const p = buildCharacterPlan(neutralActor(id, rig, { pose: col === 0 ? 'neutral' : 'attack', poseProgress: progress }));
      const inner = planToSvg(p).replace(/^.*?<g opacity=/s, '<g opacity=').replace('</svg>', '');
      content += `<g transform="translate(${115 + col * tile},${40 + row * rowHeight}) scale(.58)">${inner}</g>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${rowHeight * 4 + 42}">${content}</svg>`;
  write(path.join(out, `attack-progress-${group + 1}.svg`), svg); await raster(svg, path.join(out, `attack-progress-${group + 1}.png`));
}
const organAudit = Object.entries(manifest).map(([id, item]) => ({ artId: id, anatomicalCounts: item.organCounts, sourceCanvasRoot: item.rootPx, collisionCenter: item.collisionCenterPx, collisionRadius: item.collisionRadiusPx, sourceOrganNames: item.organParts, authoredJoints: item.joints, embeddedContourOrgans: ['top-lobe', 'body-lobe', 'tail-tip', 'antenna', 'foot-base', 'droplet-tip'].filter(prefix => Object.keys(item.joints).some(j => j.startsWith(prefix))), faceAttachment: 'face shapes and highlights are body-local soft shapes; no fixed-space face', countsMeaning: 'anatomical organs, not SVG path count; highlights/folds are subordinate details', primaryAcceptance: 'pending' }));
write(path.join(out, 'organ-audit.json'), { schemaVersion: 1, items: organAudit });
const splinterFacts = rasterFacts.filter(f => /enemy\/splinter\/(body.png|poses\/action.png)$/.test(f.path));
const splinterBottoms = splinterFacts.map(f => f.alphaBounds.y + f.alphaBounds.height - 1);
if (splinterBottoms.length !== 2 || splinterBottoms[0] !== splinterBottoms[1]) throw new Error('SPLINTER action leaves neutral alpha bottom');
write(path.join(out, 'splinter-contact-proof.json'), { artId: 'enemy:SPLINTER', sourceRoot: ENEMY_RIGS['enemy:SPLINTER'].root, correction: 'Primary precheck: preserve lower contour; stretch upper tip instead of translating whole body', samples: splinterFacts, alphaBottomDifferencePx: splinterBottoms[1] - splinterBottoms[0], wholeBodyTranslation: [0, 0], acceptance: 'pending primary visual review' });
let contact = '<rect width="100%" height="100%" fill="#FFF9EF"/><text x="12" y="24" font-size="16" font-family="sans-serif" fill="#4B281C">SPLINTER corrected: neutral/action alpha bottom both y=226; root y=232</text>';
for (let col = 0; col < 2; col++) {
  const name = col ? 'action' : 'neutral';
  const inner = svgById.get('enemy:SPLINTER')[name].replace(/^.*?<g opacity=/s, '<g opacity=').replace('</svg>', '');
  contact += `<g transform="translate(${32 + col * 320},40)">${inner}<path d="M24 226 L232 226" fill="none" stroke="#AA7160" stroke-dasharray="4 4"/><path d="M24 232 L232 232 M128 225 L128 240" fill="none" stroke="#52997B" stroke-width="1.5"/></g><text x="${55 + col * 320}" y="322" font-size="16" font-family="sans-serif" fill="#4B281C">${name}: lower contour retained</text>`;
}
const contactSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="672" height="350">${contact}</svg>`;
write(path.join(out, 'splinter-contact-proof.svg'), contactSvg); await raster(contactSvg, path.join(out, 'splinter-contact-proof.png'));
write(path.join(out, 'transition-limitations.json'), { scope: 'rig.js owner must validate/adapt transitions after merging group data; no shared edits made', items: Object.entries(ENEMY_RIGS).filter(([, r]) => r.poseVariants).map(([id, r]) => ({ artId: id, poseVariants: r.poseVariants, limitation: 'Shared selector changes to variant at pose entry and back at pose exit; no geometry morph between key poses. Attack progress strips show this exact behavior. Root/C stay fixed; visual entry/exit continuity requires owner follow-up.', proof: `attack-progress-${Math.floor(ids.indexOf(id) / 4) + 1}.png` })) });
write(path.join(out, 'manifest.json'), manifest);
write(path.join(out, 'raster-audit.json'), rasterFacts);
write(path.join(out, 'sampler-checks.json'), { mode: 'offline in-memory owner sampler with group data injection; not registered public API', samplerPath: 'src/view/art/characters/rig.js', samplerSha256: crypto.createHash('sha256').update(sampleCode).digest('hex'), groupModuleSha256: sha(path.join(root, 'src/view/art/characters/enemyRigData.js')), totalCases: checks.reduce((n, c) => n + c.sampleCases, 0), items: checks });
const edgeFailures = rasterFacts.filter(f => f.path.startsWith('public/') && f.width === 256 && f.touchesCanvasEdge);
const disconnected = rasterFacts.filter(f => f.path.startsWith('public/') && f.width === 256 && f.substantialAlphaComponents > 1);
console.log(JSON.stringify({ identities: ids.length, actionMappings: Object.values(manifest).reduce((n, m) => n + Object.keys(m.actions).length, 0), rasters: rasterFacts.length, edgeFailures, disconnected, seamWarnings: checks.filter(c => c.moveSeamIssue) }, null, 2));
if (edgeFailures.length || disconnected.length || checks.some(c => c.moveSeamIssue)) process.exitCode = 1;
