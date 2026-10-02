import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const out = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(out, '../../../../..');
const upstream = 'docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/integration/submissions/r02';
const delivery = 'docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/delivery/submissions/r02';
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rel = p => path.relative(root, p).replaceAll('\\', '/');
const write = (p, data) => fs.writeFileSync(path.join(out, p), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n', 'utf8');
if (fs.existsSync(path.join(out, 'READY'))) throw new Error('Published revision is immutable.');
const map = json(`${upstream}/production-map.json`);
const config = await import(pathToFileURL(path.join(root, 'src/data/gameConfig.js')));
const encounter = await import(pathToFileURL(path.join(root, 'src/logic/engine/encounterRuntime.js')));
const presentation = await import(pathToFileURL(path.join(root, 'src/data/bossPresentation.js')));
const bossCombat = await import(pathToFileURL(path.join(root, 'src/logic/engine/bossCombatRuntime.js')));
const bossRows = [];
let nextUid = 1;
for (const [key, template] of Object.entries(config.BOSS_TYPES)) {
  const entities = encounter.createBossEncounterRuntime({bossTemplate:template, x:0, y:0, allocateEnemyUid:()=>nextUid++, allocateEncounterUid:()=>nextUid++});
  for (const entity of entities) {
    const artId = entity.twinRole ? `TWINS_${entity.twinRole.toUpperCase()}` : presentation.getBossBaseId(entity.id);
    const before = entity.phases.map(p=>({name:p.name, abilities:p.abilities}));
    const survivor = entity.twinRole ? structuredClone(entity) : null;
    if (survivor) bossCombat.enrageTwinRuntime({enemies:[survivor]}, {...entity,uid:-1});
    bossRows.push({templateId:key, runtimeId:entity.id, artKey:`boss:${artId}`, form:entity.form, radius:entity.radius,
      phases:before, survivorPhases:survivor?.phases.map(p=>({name:p.name,abilities:p.abilities})) ?? null});
  }
}
const activeSkills = new Set(bossRows.flatMap(b=>[...b.phases,...(b.survivorPhases??[])].flatMap(p=>p.abilities)));
const identities = map.identities.map(i=>{
  const [group,id]=i.key.split(':');
  const related=bossRows.filter(b=>b.artKey===i.key);
  return {artKey:i.key,group,id,owner:'characters',runtimeCollection:group==='hero'?'player':group==='tower'?'towers':'enemies',
    runtimeIds:group==='boss'?[...new Set(related.map(b=>b.runtimeId))]:[group==='mechanic'?`MECHANIC_${id}`:id],
    discriminator:group==='hero'?'state.player (no runtime id/uid)':group==='mechanic'?`entity.mechanic.kind === '${id.toLowerCase()}'`:group==='boss'?'entity.isBoss, twinRole before baseId suffix stripping':`entity.id === '${id}'`,
    runtimeRadius:group==='tower'?config.TOWER_LIBRARY[id].radius:group==='enemy'?config.ENEMY_TYPES[id].radius:group==='hero'?12:null,
    radiusRule:'Use current entity.radius for collision. Visual scale is measured against fixed reference radius; never write radius.',
    runtimeVariants:related,anatomy:i.anatomy,faceAnchors:i.faceAnchors,immutable:i.immutable,
    referenceActions:map.actions.filter(a=>a.identity===i.key).map(a=>a.action),
    resourceSlug:`${group}/${id.toLowerCase()}`,manifestKey:i.key,
    productionStatus:'contract_only_not_produced'};
});
write('identity-map.json',{schemaVersion:1,counts:{identities:identities.length,towers:9,hero:1,enemies:14,bossBodies:17,bossEncounters:16,mechanics:7},identities});
const commonTrigger = (a) => {
  const c=a.contract, id=a.identity, action=a.action;
  if (c.body?.mode?.includes('archived')) return 'archive/reference only; do not schedule a new ability';
  if (c.runtimeAbilityIds?.length) return `actual bossState.castAbility in ${c.runtimeAbilityIds.join(', ')}; pose gated by actionMode`;
  if (/^LV[1-4]$/.test(action)) return `read level=${Number(action.slice(2))-1}; body reused; independent badge; no stat mutation`;
  if (action.startsWith('DIR_')) return 'view aim orientation; derive from real shot angle/retained orientation; no new aiming rule';
  if (action==='OPEN') return 'boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1';
  if (/^P[123]$/.test(action)) return `currentPhaseIndex=${Number(action[1])-1}; same identity; never advance phase from animation`;
  if (action==='WINDUP') return 'bossState.actionMode=windup and actual actionTimer/windupDuration';
  if (action.startsWith('SOLO')) return 'bossState.partnerFallen; distinct sun/moon actual survivor ability';
  if (action==='BROKEN') return 'confirmed defeat before removal; view-only bounded transient, no target/hp';
  if (action==='FADE') return 'view-only retirement; not an extension of entity/hazard lifetime';
  if (action==='TRIGGER') return 'confirmed mechanic timer resolution/spawn/state effect; absence is not proof of trigger';
  if (['SQUASH','STRETCH','MOVE','RUN','HEAVY_MOVE','HOP','CHASE_PLAYER','STRIKE_TOWER'].includes(action)) return 'in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion';
  if (['ATTACK','AUTO_ATTACK'].includes(action) && /^(tower|hero):/.test(id)) return 'actual successful shot event; do not infer from cooldown alone';
  return c.runtimeEvent ?? 'read current entity state / upstream contract; no new gameplay state';
};
const actions = map.actions.map(a=>({key:a.key,artKey:a.identity,action:a.action,
  upstreamPointer:`${upstream}/production-map.json#/actions/${map.actions.indexOf(a)}`,
  upstreamMappingMode:a.mappingMode,bodyReuseKey:`${a.identity}|${a.bodySources.map(s=>`${s.path}:${s.row}:${s.column}:${s.label}`).join('|')}`,
  bodySources:a.bodySources,transform:a.transform,levelOverlay:a.levelOverlay,
  runtimeTrigger:commonTrigger(a),runtimeAbilityIds:a.contract.runtimeAbilityIds??[],
  contract:a.contract,externalEffectContract:a.externalEffectContract,
  effectSourceKeys:a.effectSources?.map(e=>e.key)??[],
  bodyOwner:'characters',effectOwner:'world',productionStatus:'reference mapped; editable resources and measured anchors required'}));
write('state-reuse-375.json',{schemaVersion:1,sourceBase:upstream,referenceCount:actions.length,bodyReuseGroups:new Set(actions.map(a=>a.bodyReuseKey)).size,
  note:'Reuse grouping is exact source-pose equivalence, not final sprite/clip count. Preserve bodySources and sourceBase for relative references.',actions});
const opt = read('src/logic/engine/bossOptimizedAbilities.js');
const base = read('src/logic/engine/bossAbilityRuntime.js');
const optimizedKeys = [...opt.matchAll(/^  (\w+): \(c\) =>/gm)].map(m=>m[1]);
const baseKeys = [...base.matchAll(/if \(abilityName === '(\w+)'\)/g)].map(m=>m[1]);
const allHandlers = new Set([...optimizedKeys,...baseKeys]);
const skills = map.skills.map(s=>{
  const c=s.contract;
  const actualDispatch=optimizedKeys.includes(c.abilityId)?'optimized':'fallback';
  const owners=[...new Set(bossRows.filter(b=>[...b.phases,...(b.survivorPhases??[])].some(p=>p.abilities.includes(c.abilityId))).map(b=>b.artKey))];
  const source=actualDispatch==='optimized'?opt:base;
  const excerpt=c.sourceHandlerExcerpt??'';
  const normalize=x=>x.replace(/\s+/g,' ').trim();
  return {abilityId:c.abilityId,actualDispatch,actualOwners:owners,active:activeSkills.has(c.abilityId),handlerExists:allHandlers.has(c.abilityId),
    upstreamExcerptMatchesCurrentSource:excerpt ? normalize(source).includes(normalize(excerpt)) : null,
    bodyRule:'same identity; actual windup/attack/recover; effect/entities separate',...c,actualDispatch,
    upstreamReference:`${upstream}/production-map.json#/skills/${map.skills.indexOf(s)}`};
});
const skillAudit={runtimeDefaultAndSurvivor:activeSkills.size,upstreamSkills:skills.length,optimizedHandlerCount:optimizedKeys.length,
  supportedHandlerCount:allHandlers.size,legacyOutsideDefault:[...allHandlers].filter(k=>!activeSkills.has(k)),
  missingInUpstream:[...activeSkills].filter(k=>!skills.some(s=>s.abilityId===k)),unexpectedUpstream:skills.filter(s=>!s.active).map(s=>s.abilityId),
  excerptMismatch:skills.filter(s=>s.upstreamExcerptMatchesCurrentSource===false).map(s=>s.abilityId),
  noHandler:'tailSweep: concept/catalog only; do not invent this attack'};
write('boss-skills-95.json',{schemaVersion:1,audit:skillAudit,skills});
write('runtime-boss-variants.json',bossRows);
const lines=['# 48 身份与 375 状态复用索引','', '完整逐条合同见 state-reuse-375.json；原画定位不是裁切矩形。运行 ID 由当前模块实例化导出。','', '|美术身份|实际运行 ID|条目|动作/状态|','|---|---|---:|---|'];
for(const i of identities) lines.push(`|${i.artKey}|${i.runtimeIds.join(', ')}|${i.referenceActions.length}|${i.referenceActions.join(' / ')}|`);
lines.push('','## 每条复用索引','', '|key|原画复用方式|身体参照标签|实际触发|','|---|---|---|---|');
for(const a of actions) lines.push(`|${a.key}|${a.upstreamMappingMode}|${a.bodySources.map(s=>s.label).join(' + ')}|${String(a.runtimeTrigger).replaceAll('|','/')}|`);
write('identity-and-state-index.md',lines.join('\n')+'\n');
const skillLines=['# 实际 Boss 技能表','', '入口 useGeoGuardGame → runBossOptimizedAbility；优化 handler 优先，否则 runBossAbilityEffect。每行完整几何、所有权、生命周期和当前源码摘录见 boss-skills-95.json。','', '|技能|实际身份|分派|独立召唤|机关|危险几何/效果|','|---|---|---|---|---|---|'];
for(const s of skills)skillLines.push(`|${s.abilityId}|${s.actualOwners.join(', ')}|${s.actualDispatch}|${(s.upstreamSummon??[]).map(x=>x.id).join(', ')||'—'}|${(s.upstreamMechanic??[]).map(x=>x.id??x.kind??JSON.stringify(x)).join(', ')||'—'}|${(s.effectCells??[]).join(', ')}|`);
write('boss-skills-index.md',skillLines.join('\n')+'\n');
const walk=d=>fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]):[];
const protectedFiles=[...walk(path.join(root,'src')),...walk(path.join(root,'public')),...walk(path.join(root,'tests')),...walk(path.join(root,'scripts')),
  ...fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isFile()&&(/^(package.*\.json|.*config\..*|index.html|AGENTS.md)$/.test(e.name))).map(e=>path.join(root,e.name))];
if(!fs.existsSync(path.join(out,'observed-baseline.json')))write('observed-baseline.json',{status:'observed_worktree_not_release_baseline',capturedAt:new Date().toISOString(),
  gate:'Published baseline confirmation and reviewer contract approval are both required before src/public writes.',
  files:protectedFiles.sort().map(p=>({path:rel(p),bytes:fs.statSync(p).size,sha256:sha(p),
    protection:p.includes(`${path.sep}src${path.sep}logic${path.sep}engine${path.sep}`)||p.includes(`${path.sep}src${path.sep}data${path.sep}`)?'logic_frozen':'captured'}))});
const sourceRefs=[`${upstream}/production-map.json`,`${upstream}/packet.json`,`${upstream}/effective-specifications.md`,`${upstream}/coverage.json`,
  `${delivery}/index.html`,`${delivery}/gallery-manifest.json`,`${delivery}/actual-state-and-limits.md`,`${delivery}/requirements.json`,
  'docs/art-direction/sticker-bible-2026-10-01/art-replacement-plan.md',
  'docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/desktop-final-acceptance.md'];
const gallery=json(`${delivery}/gallery-manifest.json`);
for(const entry of gallery.images)sourceRefs.push(rel(path.resolve(root,delivery,entry.file)));
write('sources.json',{readAt:new Date().toISOString(),inspectedDesktopImages:gallery.images.map(i=>i.id),files:sourceRefs.map(p=>({path:p,sha256:sha(path.join(root,p))})),
  authority:'desktop-final-acceptance.md supersedes historical submitted/pending in delivery; art approval is not runtime approval'});
write('coverage.json',{identities:identities.length,actions:actions.length,uniqueActionKeys:new Set(actions.map(a=>a.key)).size,
  exactPoseReuseGroups:new Set(actions.map(a=>a.bodyReuseKey)).size,skillAudit,
  unmappedRuntimeIds:bossRows.filter(b=>!identities.some(i=>i.artKey===b.artKey)),
  productionResources:0,runtimeIntegration:false,reviewStatus:'submitted_contract_only'});
console.log(JSON.stringify({identities:identities.length,actions:actions.length,skillAudit},null,2));
