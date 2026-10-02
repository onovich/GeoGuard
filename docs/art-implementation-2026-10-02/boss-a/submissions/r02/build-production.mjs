import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOSS_RIGS_A } from '../../../../../src/view/art/characters/bossRigDataA.js';

const out = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(out, '../../../../..');
const ownModule = 'src/view/art/characters/bossRigDataA.js';
const requireRuntime = createRequire('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp = requireRuntime('sharp');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n', 'utf8'); };
const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const evidence = read('docs/art-implementation-2026-10-02/boss-a/submissions/r01/source-evidence.json');
const sourceMap = read('docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/integration/submissions/r02/production-map.json');
const identityMap = read('docs/art-implementation-2026-10-02/integration/submissions/r01/identity-map.json');
const skills = read('docs/art-implementation-2026-10-02/integration/submissions/r01/boss-skills-95.json').skills;
const runtimeVariants = read('docs/art-implementation-2026-10-02/integration/submissions/r01/runtime-boss-variants.json');
const contractPath = 'docs/art-implementation-2026-10-02/characters/submissions/r03/rig-data-output-contract.md';
assert.equal(sha(path.join(root, contractPath)), '2376767cd6bd4379797f261b366345cb4bbac0329546ef3bcf4a6e60a551cd00');
assert.equal(sha(path.join(root, 'docs/art-implementation-2026-10-02/integration/submissions/r01/packet.json')), 'b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba');

// Evaluate an immutable read-only snapshot of the public sampler with only the
// registry import substituted. This is offline production sampling, not wiring
// the group into the public registry or a separate runtime renderer.
const palette = { brown: '#4B281C', sage: '#B6D4AE', sageLight: '#D1E4BA', sageShade: '#7E9F71', coral: '#F77965', coralLight: '#FF9A7A', coralShade: '#CB584C', cream: '#FFF9EF', honey: '#F8DDAA', honeyLight: '#FFEAC3', greenDark: '#345634', pink: '#F4ADA0' };
const samplerPath = path.join(root, 'src/view/art/characters/rig.js');
const samplerOriginal = fs.readFileSync(samplerPath, 'utf8');
assert(samplerOriginal.includes('baseRig.abilityVariants') && samplerOriginal.includes('part.rigid'), 'Shared sampler must support approved selectors/articulation');
const sampler = samplerOriginal.replace(/import \{ RIGS, PALETTE \} from '\.\/rigData\.js';/, `import {BOSS_RIGS_A as RIGS} from '${pathToFileURL(path.join(root, ownModule)).href}';\nconst PALETTE=${JSON.stringify(palette)};`);
write(path.join(out, 'shared-sampler-snapshot.txt'), samplerOriginal);
const { buildCharacterPlan, planToSvg, getPlanAnchors, pathCommands, transformPoint } = await import('data:text/javascript;base64,' + Buffer.from(sampler).toString('base64'));
const actorFor = (id, extra = {}) => { const r = BOSS_RIGS_A[id]; return { artId: id, x: r.center[0], y: r.center[1], radius: r.collisionRadius, facing: 'right', aimAngle: 0, pose: 'neutral', poseProgress: 0, poseTime: 0, alpha: 1, boss: { phaseIndex: 0, castAbility: null }, ...extra }; };
const plan = (id, extra = {}) => buildCharacterPlan(actorFor(id, extra));
const toPng = svg => sharp(Buffer.from(svg)).png().toBuffer();
const checkAlpha = async (png) => {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1, edgeAlpha = 0, opaque = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const a = data[(y * info.width + x) * info.channels + info.channels - 1];
    if (a) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); opaque++; }
    if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) edgeAlpha = Math.max(edgeAlpha, a);
  }
  return { width: info.width, height: info.height, channels: info.channels, alphaBounds: [minX, minY, maxX, maxY], edgeAlpha, paintedPixels: opaque, transparentPixels: info.width * info.height - opaque };
};
const organs = {
  'boss:COMMANDER': { crownLobes: ['crown-left','crown-center','crown-right'], arms: ['arm-left','arm-right'], innerFists: ['fist-left','fist-right'], feet: ['foot-left','foot-right'], faceSlots: ['brow-slot'], mouths: ['mouth'], teeth: ['tooth'] },
  'boss:HUNTER': { rearEar: ['rear-ear'], horn: ['top-horn'], nose: ['nose-root'], rearLobe: ['rear-lobe'], feet: ['foot-left','foot-right'], eyes: ['near-eye'], mouths: ['mouth'] },
  'boss:FORTRESS': { shells: ['top-shell'], shields: ['shield-left','shield-right'], feet: ['foot-left','foot-right'], faceWindows: ['face-window'], eyes: ['eye-left','eye-right'] },
  'boss:PRISM': { robe: ['robe-top'], faceWindows: ['face-window'], eyes: ['eye-left','eye-right'], parentMirrors: ['mirror-left','mirror-right'] },
  'boss:FROST_JUDGE': { heads: ['head'], eyeSlots: ['eye-slot-left','eye-slot-right'], mouthTooth: ['mouth','tooth'], UCollar: ['U-collar'], fists: ['fist-left','fist-right'], crown: ['crown'], chestDiamond: ['chest-diamond'] },
  'boss:RAIL_WARLORD': { fins: ['dorsal-fin-rear','dorsal-fin-front'], feet: ['foot-left','foot-right'], tail: ['tail-lobe'], eyes: ['near-eye'], rails: ['upper-rail','lower-rail'], ports: ['central-port'] },
  'boss:COLLECTOR': { buds: ['bud-left','bud-right'], feet: ['foot-left','foot-right'], curledArm: ['curled-arm'], faceSlots: ['brow-slot'], tongue: ['tongue'], bellyCoin: ['belly-coin'] },
  'boss:TWINS_SUN': { petals: ['petal-12','petal-2','petal-4','petal-6','petal-8','petal-10'], eyes: ['eye-left','eye-right'], mouths: ['mouth'] },
};
const samples = [
  ['neutral', {}], ['left', { facing: 'left' }], ['up-body-reuse', { facing: 'up', aimAngle: -Math.PI / 2 }], ['squash', { pose: 'squash' }], ['stretch', { pose: 'stretch' }],
  ['windup-half', { pose: 'windup', poseProgress: .5 }], ['windup', { pose: 'windup', poseProgress: 1 }],
  ['attack-quarter', { pose: 'attack', poseProgress: .25 }], ['attack', { pose: 'attack', poseProgress: .5 }],
  ['attack-end', { pose: 'attack', poseProgress: 1 }], ['open-body', { pose: 'recover' }],
];
const manifests = {}, audits = {}, alphaAudits = {}, previewRows = [], runtimeRows = [], overlayRows = [];
let stateSamples = 0, abilitySamples = 0, alphaSamples = 0, rootError = 0, rigidError = 0;
for (const [id, rig] of Object.entries(BOSS_RIGS_A)) {
  const identity = identityMap.identities.find(i => i.artKey === id);
  assert(identity && identity.resourceSlug === `boss/${id.split(':')[1].toLowerCase()}`);
  const dir = path.join(root, 'public/art/characters/v1', identity.resourceSlug);
  const expectedAbilities = skills.filter(s => s.actualOwners.includes(id)).map(s => s.abilityId).sort();
  assert.deepEqual(Object.keys(rig.abilityVariants).sort(), expectedAbilities, `All actual ability keys: ${id}`);
  for (const [kind, names] of Object.entries(organs[id])) for (const name of names) assert(rig.joints[name], `${id}/${kind}/${name}`);
  assert.deepEqual(rig.softPivot, rig.root);
  assert(rig.collisionRadius > 0 && rig.referenceRadius > 0);
  for (const v of [rig, ...Object.values(rig.variants)]) {
    const shapeIds = new Set();
    for (const s of v.shapes) {
      assert(!shapeIds.has(s.id)); shapeIds.add(s.id);
      assert.equal(Boolean(s.d) + Boolean(s.ellipse), 1);
      if (s.d) for (const c of pathCommands(s.d)) assert(c.values.every(Number.isFinite));
      else assert(s.ellipse.every(Number.isFinite) && s.ellipse[2] > 0 && s.ellipse[3] > 0);
      assert(Number.isFinite(s.width));
      if (s.partId) assert(rig.partTransforms[s.partId]?.pivot, `Missing part transform ${id}/${s.id}`);
      if (/eye|mouth|tongue|brow|tooth/.test(s.id)) assert.notEqual(s.space, 'fixed');
    }
  }
  const neutralPlan = plan(id);
  const anchors = getPlanAnchors(neutralPlan);
  const neutralSvg = planToSvg(neutralPlan);
  const neutralPng = await toPng(neutralSvg);
  const alpha = await checkAlpha(neutralPng);
  assert.equal(alpha.edgeAlpha, 0, `${id} neutral crop`);
  assert(alpha.transparentPixels > 0);
  alphaAudits[id] = { neutral: alpha, frames: {} };
  write(path.join(dir, 'source.svg'), neutralSvg); write(path.join(dir, 'body.svg'), neutralSvg);
  fs.writeFileSync(path.join(dir, 'body.png'), neutralPng);
  write(path.join(out, 'editable', identity.resourceSlug + '.svg'), neutralSvg);
  const [minX,minY,maxX,maxY] = alpha.alphaBounds;
  const side = Math.max(maxX - minX + 1, maxY - minY + 1) + 12;
  const iconBox = [(minX + maxX + 1 - side) / 2, (minY + maxY + 1 - side) / 2, side, side];
  const iconSvg = planToSvg(neutralPlan, { width: 64, height: 64, viewBox: iconBox });
  write(path.join(dir, 'icon.svg'), iconSvg); fs.writeFileSync(path.join(dir, 'icon.png'), await toPng(iconSvg));

  const actionMappings = evidence.actionMappings.filter(a => a.identity === id);
  manifests[id] = { schemaVersion: 1, artId: id, status: 'produced_pending_review', sourceSize: [256,256], sourceOffset: [0,0], trim: null,
    rootPx: rig.root, collisionCenterPx: rig.center, collisionRadiusPx: rig.collisionRadius, referenceRuntimeRadius: rig.referenceRadius, visualScaleMode: 'runtime-radius',
    anchorsMeasured: true, measurementMode: 'authored numeric Bezier source joints + shared sampler equations; PNG alpha bounds independently decoded',
    neutralAlphaBounds: alpha.alphaBounds, iconSourceViewBox: iconBox, sourceFile: `art/characters/v1/${identity.resourceSlug}/source.svg`, body: `art/characters/v1/${identity.resourceSlug}/body.png`,
    icon: `art/characters/v1/${identity.resourceSlug}/icon.svg`, parts: Object.entries(rig.joints).map(([name,p]) => ({ id: name, positionPx: p, parent: /fist/.test(name) && id === 'boss:COMMANDER' ? name.replace('fist','arm') : 'body', class: name.startsWith('foot-') ? 'fixed-contact' : rig.partTransforms[name]?.rigid ? 'rigid-attached' : 'soft-attached', transform: rig.partTransforms[name] ?? null })),
    organCounts: Object.fromEntries(Object.entries(organs[id]).map(([name,names]) => [name,names.length])), anatomyLock: identity.anatomy,
    directions: { right: 'approved body orientation', left: 'whole rig reflection including joints at fixed root', up: 'retain approved body orientation; no approved up-specific body/projection or invented organ; geometry hazard aim remains external' },
    poseVariants: rig.poseVariants, phaseVariants: rig.phaseVariants, abilityVariants: rig.abilityVariants, actualRuntimeVariants: runtimeVariants.filter(v => v.artKey === id),
    actions: Object.fromEntries(actionMappings.map(a => [a.action, { pose: a.bodySources[0].label === 'ATTACK' ? 'attack' : a.bodySources[0].label === 'WINDUP' ? 'windup' : a.bodySources[0].label === 'OPEN' ? 'recover' : 'neutral', bodySources: a.bodySources, mappingMode: a.mappingMode, effectKeys: a.externalEffectSources.map(e => e.key), externalOnly: a.externalEffectSources }])),
    clips: { neutral: { loop: true }, move: { loop: true, period: .72 }, windup: { loop: false, duration: 'actual runtime window' }, attack: { loop: false, duration: 'actual runtime window' }, recover: { loop: false, body: 'same identity, OPEN effect external' } },
    railCastingReference: id === 'boss:RAIL_WARLORD' ? { P: rig.joints['rail-cannon'], M: rig.joints['rail-tip-M'], axis: 0, rigidPart: 'rail-cannon', actualEmission: 'geometry hazard, no independent projectile; not registered as projectile muzzle' } : null,
    independentChildren: [...new Set(skills.filter(s => s.actualOwners.includes(id)).flatMap(s => [...s.upstreamSummon,...s.upstreamMechanic].map(c => c.id)))],
    limits: id === 'boss:FORTRESS' ? ['attack variant raises one shell with its retained connector; shape transition at pose boundary is discrete; continuous shell lift needs main sampler translation/path interpolation support'] : [],
  };
  write(path.join(dir, 'rig.json'), manifests[id]);
  audits[id] = { root: rig.root, collisionCenter: rig.center, radius: rig.collisionRadius, organs: organs[id], joints: rig.joints, partTransforms: rig.partTransforms, neutralAnchors: anchors, actualAbilityKeys: expectedAbilities, samples: [] };

  const preview = [], actual = [], overlays = [];
  for (const [name, extra] of samples) {
    const p = plan(id, extra);
    const svg = planToSvg(p);
    const png = await toPng(svg);
    const alphaFrame = await checkAlpha(png);
    assert.equal(alphaFrame.edgeAlpha, 0, `${id}/${name} crop`);
    alphaAudits[id].frames[name] = alphaFrame;
    write(path.join(dir, 'poses', name + '.svg'), svg);
    fs.mkdirSync(path.join(dir, 'poses'), { recursive: true }); fs.writeFileSync(path.join(dir, 'poses', name + '.png'), png);
    preview.push({ input: await sharp(png).resize(128,128).toBuffer(), left: preview.length * 128, top: 0 });
    const a = actorFor(id, { x: 64, y: 70, radius: rig.referenceRadius, ...extra });
    const real = buildCharacterPlan(a);
    const realSvg = planToSvg(real, { width: 128, height: 128, viewBox: [0,0,128,128] });
    actual.push({ input: await toPng(realSvg), left: actual.length * 128, top: 0 });
    audits[id].samples.push({ name, radius: rig.referenceRadius, root: getPlanAnchors(real).root, collisionCenter: getPlanAnchors(real).collisionCenter, bounds: getPlanAnchors(real).bounds, selectedVariant: rig.poseVariants[a.pose] });
  }
  // Dense continuous samples exercise the actual shared sampler, including part
  // matrices, face transforms, ground contacts, left reflection and zero writes.
  for (const facing of ['right','left','up']) for (const poseName of ['neutral','move','windup','attack','recover','squash','stretch']) for (let i = 0; i <= 16; i++) {
    const actor = actorFor(id, { x: 317, y: 231, radius: rig.referenceRadius, facing, pose: poseName, poseTime: i * .72 / 16, poseProgress: i / 16 });
    const frozen = JSON.stringify(actor);
    const p = buildCharacterPlan(actor); const a = getPlanAnchors(p);
    assert.equal(JSON.stringify(actor), frozen);
    const scale = actor.radius / rig.collisionRadius, flip = facing === 'left' ? -1 : 1;
    const expectedRoot = [actor.x + scale * flip * (rig.root[0] - rig.center[0]), actor.y + scale * (rig.root[1] - rig.center[1])];
    rootError = Math.max(rootError, Math.abs(a.root.x - expectedRoot[0]), Math.abs(a.root.y - expectedRoot[1]));
    assert(Math.abs(a.collisionCenter.x - actor.x) < 1e-9 && Math.abs(a.collisionCenter.y - actor.y) < 1e-9);
    const localRoot = transformPoint(p.soft, rig.root); assert(Math.hypot(localRoot[0] - rig.root[0],localRoot[1] - rig.root[1]) < 1e-9);
    for (const c of p.commands) assert(c.matrix.every(Number.isFinite));
    const bodyCommand = p.commands.find(c => /body|head|robe/.test(c.shape.id));
    for (const c of p.commands.filter(c => /eye|brow|mouth|tooth|tongue/.test(c.shape.id))) if (!c.shape.partId) assert.deepEqual(c.matrix, bodyCommand.matrix, `${id} face follows body`);
    if (id === 'boss:RAIL_WARLORD') {
      const m = p.commands.find(c => c.shape.id === 'upper-rail').matrix;
      rigidError = Math.max(rigidError, Math.abs(Math.hypot(m[0],m[1])-scale), Math.abs(Math.hypot(m[2],m[3])-scale), Math.abs(m[0]*m[2]+m[1]*m[3]));
    }
    if (['move','windup','attack'].includes(poseName)) {
      const sourcePlan = plan(id, { facing, pose: poseName, poseTime: i * .72 / 16, poseProgress: i / 16 });
      const alphaSample = await checkAlpha(await toPng(planToSvg(sourcePlan)));
      assert.equal(alphaSample.edgeAlpha, 0, `${id}/${facing}/${poseName}/${i}: continuous pose clipping`);
      alphaSamples++;
    }
    stateSamples++;
  }
  for (const ability of expectedAbilities) for (const pose of ['windup','attack','recover']) {
    const p = plan(id, { pose, poseProgress: .5, boss: { phaseIndex: 2, castAbility: ability } });
    assert.deepEqual(p.rig.shapes, rig.variants[rig.abilityVariants[ability][pose]].shapes);
    abilitySamples++;
  }
  for (const phaseIndex of [0,1,2]) {
    const p = plan(id, { pose: 'intro', boss: { phaseIndex, castAbility: null } });
    assert.deepEqual(p.rig.shapes, rig.variants[rig.phaseVariants[phaseIndex]].shapes);
  }
  const begin = plan(id, { pose: 'move', poseTime: 0 }); const end = plan(id, { pose: 'move', poseTime: .72 });
  for (let i = 0; i < begin.commands.length; i++) for (let j = 0; j < 6; j++) assert(Math.abs(begin.commands[i].matrix[j]-end.commands[i].matrix[j]) < 1e-9);
  const rootMarker = `<circle cx="${rig.root[0]}" cy="${rig.root[1]}" r="3" fill="#009870"/><circle cx="${rig.center[0]}" cy="${rig.center[1]}" r="3" fill="#DA2355"/><circle cx="${rig.center[0]}" cy="${rig.center[1]}" r="${rig.collisionRadius}" fill="none" stroke="#DA2355" stroke-width="1" stroke-dasharray="4 4"/>`;
  const jointsMarker = Object.entries(rig.joints).map(([name,p]) => `<circle cx="${p[0]}" cy="${p[1]}" r="1.8" fill="#266AB7"><title>${name}</title></circle>`).join('');
  write(path.join(out,'anchors',identity.resourceSlug.split('/')[1]+'.svg'), neutralSvg.replace('</svg>',rootMarker+jointsMarker+'</svg>'));
  overlays.push({input:await toPng(neutralSvg.replace('</svg>',rootMarker+jointsMarker+'</svg>')),left:0,top:0});
  previewRows.push(await sharp({create:{width:samples.length*128,height:128,channels:4,background:'#FFF9EF'}}).composite(preview).png().toBuffer());
  runtimeRows.push(await sharp({create:{width:samples.length*128,height:128,channels:4,background:'#FFF9EF'}}).composite(actual).png().toBuffer());
  overlayRows.push(await sharp({create:{width:256,height:256,channels:4,background:'#FFF9EF'}}).composite(overlays).png().toBuffer());
}
assert(rootError < 1e-9 && rigidError < 1e-9);
await sharp({create:{width:samples.length*128,height:1024,channels:4,background:'#FFF9EF'}}).composite(previewRows.map((input,i)=>({input,left:0,top:i*128}))).png().toFile(path.join(out,'poses-contact-sheet.png'));
await sharp({create:{width:samples.length*128,height:1024,channels:4,background:'#FFF9EF'}}).composite(runtimeRows.map((input,i)=>({input,left:0,top:i*128}))).png().toFile(path.join(out,'runtime-radius-contact-sheet.png'));
await sharp({create:{width:1024,height:512,channels:4,background:'#FFF9EF'}}).composite(overlayRows.map((input,i)=>({input,left:(i%4)*256,top:Math.floor(i/4)*256}))).png().toFile(path.join(out,'anchors-contact-sheet.png'));
write(path.join(out,'manifest.json'),manifests); write(path.join(out,'anchor-audit.json'),audits); write(path.join(out,'alpha-audit.json'),alphaAudits);
write(path.join(out,'source-evidence.json'),{...evidence,status:'production_reference_inspection_retained',dataContract:{path:contractPath,sha256:sha(path.join(root,contractPath))},sourceSnapshotNote:'18 images inspected before production in r01, reused without changing sources'});
write(path.join(out,'validation.json'), { status:'offline_production_checks_passed_pending_visual_review', identities:8, actionMappings:74, actualAbilityOwnershipMappings:Object.values(manifests).reduce((n,m)=>n+Object.keys(m.abilityVariants).length,0), sourceCanvas:[256,256], stateSamples, abilitySamples, denseRasterAlphaSamples:alphaSamples, maxRootError:rootError, maxRigidScaleError:rigidError, namedOrganJointsValidated:true, phaseSelectorsValidated:true, zeroInputMutation:true, moveLoopSeamValidated:true, transparentNeutralAndPosePngs:true, allElevenExportedPosesHaveTransparentBorder:true, sharedSamplerSnapshotSha:sha(path.join(out,'shared-sampler-snapshot.txt')), sharedSamplerCurrentSha:sha(samplerPath), samplerUse:'offline immutable snapshot with group-only import substitution; no shared registry writes', previewColumns:samples.map(s=>s[0]), previewRows:Object.keys(BOSS_RIGS_A), actualRadius:Object.fromEntries(Object.entries(BOSS_RIGS_A).map(([id,r])=>[id,r.referenceRadius])), rendererIntegrated:false, gameplayTested:false, upSpecificProjectionProduced:false, upBodyReuseSampled:true, unsupportedTransitions:[{id:'boss:FORTRESS',from:'closed shell',to:'raised shell',kind:'discrete pose variant',reason:'approved partTransforms support rotation but no translation/path interpolation; main character owner must decide continuous shell-lift support'}] });
console.log(JSON.stringify({identities:8,stateSamples,abilitySamples,alphaSamples,rootError,rigidError,outputs:out}));
