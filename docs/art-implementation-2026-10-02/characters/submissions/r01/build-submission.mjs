import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const out = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(out, '../../../../..');
const bible = path.join(root, 'docs/art-direction/sticker-bible-2026-10-01');
const mapDir = path.join(bible, 'production-art-2026-10-02/integration/submissions/r02');
const anatomy = JSON.parse(fs.readFileSync(path.join(bible, 'action-consistency/anatomy-lock.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(mapDir, 'production-map.json'), 'utf8'));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rel = file => path.relative(root, file).replaceAll('\\', '/');
const href = file => path.relative(out, file).replaceAll('\\', '/');
const write = (name, value) => {
  const file = path.resolve(out, name);
  if (!file.startsWith(out + path.sep)) throw new Error('Outside authorized submission');
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', 'utf8');
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Counts transcribed from the approved anatomy lock, including meaningful zero counts.
const counts = {
  'tower:BASIC':{body:1,topBuds:2,rearLobes:1,feet:2,eyes:1,cheekArc:1,shortTube:1},
  'tower:CANNON':{body:1,rearTopBuds:2,feet:2,eyes:1,barrel:1},
  'tower:SNIPER':{continuousPearNeck:1,feet:2,eyes:2,longBeak:1,bellyPad:1},
  'tower:RAPID':{body:1,topBuds:2,rearLobes:1,feet:2,eyes:1,mouthLine:1,stackedTubes:2},
  'tower:MORTAR':{body:1,rearTriangleBud:1,feet:2,eyes:1,cheekDot:1,smile:1,slantedCup:1},
  'tower:FROST':{lowOvalBody:1,topBuds:2,sideFins:2,feet:2,eyes:1,whistle:1,bellyStripes:2},
  'tower:RAIL':{continuousPearNeck:1,feet:2,eyes:2,parallelLongBeaks:2,bellyPad:1},
  'tower:BURST':{body:1,topBuds:2,rearLobes:1,feet:2,eyes:1,smile:1,rigidMuzzlePlane:1,equalBores:4,rows:2,columns:2},
  'tower:SENTINEL':{body:1,topBuds:2,feet:2,roundShoulderPads:2,eyeSlot:1,eyeHighlight:1,shortTube:1},
  'hero:PLAYER':{continuousDrop:1,sageLeaf:1,eyes:0,mouth:0,feet:0,hands:0,launcher:0},
  'enemy:BASIC':{body:1,buds:5,feet:2,eyes:2,roundMouth:1},
  'enemy:FAST':{body:1,longRearEars:2,rearFeet:2,sideLobe:1,eyes:2,ovalMouth:1},
  'enemy:TANK':{body:1,upperLobes:3,fistArms:2,feet:2,browSlot:1,mouth:1,squareTooth:1},
  'enemy:SHARD':{connectedDropLobes:3,mouth:1,tooth:1,marksPerLobe:2,independentDeathSplinters:3},
  'enemy:SPLINTER':{drop:1,eyes:1,hands:0,feet:0,mouth:0},
  'enemy:SHIELD':{body:1,shieldLobe:1,rearFist:1,feet:2,eyeHighlight:1},
  'enemy:MEDIC':{roundLobes:4,curlArms:2,feet:2,creamCross:1,eyes:0,mouth:0},
  'enemy:BOMBER':{body:1,bentFuseBud:1,cheekArms:2,feet:2,browEyeSlots:2,mouth:1,tongue:1},
  'enemy:JAMMER':{body:1,longDroopingAntennae:2,baseLobes:4,eyeSlots:2,foldMouth:1},
  'enemy:PHASE':{continuousGhostTail:1,tailTips:2,blackFaceWindow:1,whiteEyes:2,limbs:0},
  'enemy:BURROWER':{lowBody:1,diggingClaws:2,fingersPerClaw:3,feet:2,eyes:2,roundNoseMouth:1},
  'enemy:BEACON':{bellBody:1,topFeelers:2,feet:2,blackMouth:1,tongue:1,eyes:0},
  'enemy:SCOUT':{hoodEyeBody:1,longLegs:2,eyelid:1,eyes:1,mouth:0,hands:0},
  'enemy:SIEGE':{lowBody:1,foreheadPlate:1,fistArms:2,feet:2,eyes:2,mouth:1},
  'boss:COMMANDER':{body:1,topLobes:3,bentArms:2,innerFists:2,feet:2,browSlot:1,mouth:1,tooth:1,newBellyHoleOnOpen:0},
  'boss:HUNTER':{body:1,longRearEar:1,topHorn:1,noseWedge:1,rearLobe:1,feet:2,nearEye:1,noseRootMouth:1},
  'boss:FORTRESS':{topShell:1,sideShields:2,feet:2,creamFaceWindow:1,eyes:2},
  'boss:PRISM':{softDiamondRobe:1,blackFaceWindow:1,whiteEyes:2,purpleSideMirrors:2},
  'boss:HIVE':{layeredHiveBody:1,bodyLayers:3,topEars:2,skirtLobes:5,nestApertures:3,upperApertures:1,lowerApertures:2,closedEyeSlots:2},
  'boss:FROST_JUDGE':{head:1,closedEyeSlots:2,mouthTooth:1,blueUCollar:1,fists:2,crown:1,chestDiamond:1},
  'boss:RAIL_WARLORD':{lowLongBody:1,backFins:2,feet:2,tailLobe:1,nearEye:1,stackedRailArms:2,centralRoundMouth:1},
  'boss:COLLECTOR':{bagBody:1,topBuds:2,feet:2,longCurlTailArm:1,horizontalEyeSlot:1,tongue:1,honeyBellyCoin:1},
  'boss:TWINS_SUN':{coralBody:1,sunPetals:6,eyes:2,mouth:1},
  'boss:TWINS_MOON':{honeyCrescent:1,eyes:2,mouth:1,permanentCoralLowerArc:1,limbs:0},
  'boss:DRAGON':{continuousSBodyTail:1,softWings:2,longRoundSnout:1,eyes:2,feet:0},
  'boss:SPIDER_MATRIARCH':{abdomen:1,bigLegs:4,shortBaseFeet:2,eyes:2,smile:1},
  'boss:ASTROLABE':{coralMoonShell:1,purpleCenterOrb:1,whiteEyes:2,outerOrbitOrb:1,shellBlackDot:1,shellShortLine:1},
  'boss:BLOOD_FORGE':{archBody:1,largeDoorArms:2,feet:2,blackFaceWindow:1,whiteEyes:2,honeyCoreOrb:1},
  'boss:VOID_CONDUCTOR':{longRobe:1,blackFaceWindow:1,whiteEyes:2,longArms:2,roundFingersPerHand:3,skirtLobes:3},
  'boss:LABYRINTH_KEEPER':{archBody:1,blackFaceWindow:1,whiteEyes:2,doorShields:2,feet:2,emptyArch:1},
  'boss:NIGHTMARE_BLOOM':{mainPetals:3,rearLeaves:2,baseLeaves:2,blackMouth:1,whiteTeeth:6,upperTeeth:3,lowerTeeth:3,eyes:0},
  'mechanic:NEST':{nestLobes:3,blackMouth:1,whiteTeeth:2,tongue:1,feet:2,independentHatchedBasics:3},
  'mechanic:WEB':{interwovenSoftBands:3,centralKnot:1,eyes:0,mouth:0},
  'mechanic:ROOT':{rootMat:1,fingerBuds:3,eyes:0,mouth:0,feet:0},
  'mechanic:WALL':{wideMat:1,cornerLobes:4,feet:2,eyeSlot:1,tooth:1,bellyArcs:2},
  'mechanic:SEAL':{opposedIndependentSoftClaws:2,face:0,feet:0},
  'mechanic:RETICLE':{separateArcs:3,face:0},
  'mechanic:COURIER':{body:1,longUpperEar:1,feet:2,backBag:1,mintDiamond:1,uEyeSlot:1}
};

const inputs = new Map();
const fingerprint = file => { const record = {path:rel(file),sha256:sha(file),bytes:fs.statSync(file).size}; inputs.set(record.path,record); return record; };
const sources = sourceList => sourceList.map(s => {
  const file = path.resolve(mapDir, s.path);
  const fp = fingerprint(file);
  if (fp.sha256 !== s.sha256) throw new Error('Approved body fingerprint differs: ' + fp.path);
  return {path:fp.path,href:href(file),sha256:s.sha256,row:s.row,column:s.column,label:s.label,accuracy:s.accuracy};
});
const coverage = anatomy.items.map(item => {
  if (!counts[item.key]) throw new Error('Missing organ count '+item.key);
  const actions = map.actions.filter(a => a.identity === item.key).map(a => ({
    key:a.key,action:a.action,mappingMode:a.mappingMode,bodySources:sources(a.bodySources),
    effectKeys:a.externalEffectSources.map(e=>e.key),
    transform:a.transform,levelOverlay:a.levelOverlay,
    constructionReference:a.constructionReference,
    runtimeEvent:a.contract.runtimeEvent ?? a.contract.runtimeAbilityIds ?? null,
    namedBodyMode:a.contract.body?.mode ?? a.contract.bodyDescription ?? null,
    sourceReview:rel(path.resolve(mapDir,a.reviewEvidence)),
    sourceContract:{path:rel(path.resolve(mapDir,a.sourceJSON)),pointer:a.sourcePointer},
    productionStatus:'not_produced_pending_contract'
  }));
  map.actions.filter(a=>a.identity===item.key).forEach(a=>{
    fingerprint(path.resolve(mapDir,a.sourceJSON));
    fingerprint(path.resolve(mapDir,a.reviewEvidence));
  });
  if (actions.length !== item.actions.length) throw new Error('Action count mismatch '+item.key);
  const originalKeys = new Set(item.actions.map(a=>a.action));
  for (const a of actions) if (!originalKeys.has(a.action)) throw new Error('Unexpected action '+a.key);
  const canonical = path.join(bible,'action-consistency',item.canonicalSheet);
  fingerprint(canonical);
  return {identity:item.key,group:item.group,id:item.id,anatomy:item.anatomy,organCounts:counts[item.key],
    countAuthority:'manual transcription from anatomy-lock; independent child quantities are explicitly named, never body organs',
    canonicalProvenance:rel(canonical),actions,
    fixedRootStatus:'proposal_until_source_measured',faceRule:item.faceAnchors,
    proposedSourcePath:`public/art/characters/source/${item.group}/${item.id.toLowerCase()}.svg`,
    proposedGeometryPath:`src/view/art/characters/${item.group==='hero'||item.group==='tower'?'friendly':item.group==='boss'?'bosses':item.group==='mechanic'?'mechanics':'enemies'}.js`,
    previewStatus:['tower:BASIC','tower:BURST'].includes(item.key)?'unapproved_vector_feasibility_only':'approved_reference_board_only_no_production_preview'
  };
});

const deps = [
  'action-consistency/anatomy-lock.json','action-consistency/anatomy-lock.md','action-consistency/action-matrix.md',
  'production-art-2026-10-02/integration/submissions/r02/production-map.json',
  'production-art-2026-10-02/integration/submissions/r02/effective-specifications.md',
  'production-art-2026-10-02/friendly/submissions/r03/reuse-design.md',
  'production-art-2026-10-02/reviews/integration-r02.md','production-art-2026-10-02/reviews/runtime-correction-01.md',
  'scene-ui-2026-10-02/delivery/submissions/r02/packet.json','scene-ui-2026-10-02/reviews/delivery-r02.md',
  'scene-ui-2026-10-02/reviews/master-r04.md',
  'scene-ui-2026-10-02/master/submissions/r04/master-desktop-density-r04.png',
  'scene-ui-2026-10-02/master/submissions/r04/master-desktop-twins-r04.png'
];
deps.forEach(d=>fingerprint(path.join(bible,d)));
let externalEffectReferences=0;
for (const a of map.actions) for (const e of a.externalEffectSources) {
  const fp=fingerprint(path.resolve(mapDir,e.image));
  if (fp.sha256!==e.sha256) throw new Error('Approved effect fingerprint differs '+fp.path);
  externalEffectReferences++;
}
['src/view/canvas/canvasRenderer.js','src/logic/engine/combatOffenseRuntime.js','src/logic/engine/enemyBehaviorRuntime.js',
 'src/logic/engine/bossCombatRuntime.js','src/logic/engine/bossMechanicEntities.js','src/logic/engine/encounterRuntime.js',
 'src/logic/engine/bossOptimizedAbilities.js','src/logic/hooks/useGeoGuardGame.jsx','src/data/gameConfig.js','package.json'].forEach(d=>fingerprint(path.join(root,d)));
const groups = Object.fromEntries(['tower','hero','enemy','boss','mechanic'].map(g=>[g,{identities:coverage.filter(i=>i.group===g).length,actions:coverage.filter(i=>i.group===g).reduce((sum,i)=>sum+i.actions.length,0)}]));
const keys = coverage.flatMap(i=>i.actions.map(a=>a.key));
if (coverage.length!==48 || keys.length!==375 || new Set(keys).size!==375) throw new Error('Coverage mismatch');
write('coverage.json',{status:'planning_source_coverage_not_production_completion',identities:48,actionMappings:375,groups,items:coverage});

// Two editable, transparent feasibility rigs. No board crop or raster embedding.
const bodyPath = 'M66 201 C49 193 42 174 43 157 C24 158 24 131 37 129 C46 127 50 135 52 141 C56 119 72 99 88 91 C72 88 63 73 70 65 C78 56 96 62 101 73 C97 57 100 43 112 42 C125 40 133 58 128 76 C152 78 177 96 185 121 C201 160 190 196 165 207 C137 221 91 217 66 201 Z';
const feet = '<g id="feet" fill="#76A16E" stroke="#4B281C" stroke-width="4.7" stroke-linejoin="round"><path id="foot-left" d="M72 206 C72 214 67 222 76 224 C85 227 96 220 95 210 Z"/><path id="foot-right" d="M143 211 C144 218 151 226 160 224 C169 223 169 216 165 207 Z"/></g>';
const states = {neutral:[1,1],squash:[1.11,.73],stretch:[.87,1.16],attack:[1.015,.985]};
function rig(identity,state) {
  const [sx,sy]=states[state];
  const mount=[128+(176-128)*sx,211+(143-211)*sy];
  const burst=identity==='burst';
  const launcher = burst ? `<g id="launcher-rigid" transform="translate(${mount[0]} ${mount[1]})"><path fill="url(#barrel)" d="M-5-21 Q-8-23-11-18 L-11 22 Q-9 27-4 27 L27 27 Q31 26 31 22 L31-16 Q30-22 24-22 Z"/><path fill="url(#barrel)" d="M10-19 Q8-23 15-23 L33-23 Q43-23 43-15 L43 22 Q43 28 35 28 L15 28 Q9 28 9 22 Z"/>${[[-9,0],[14,0]].map(([x])=>[[-13],[13]].map(([y])=>`<g class="equal-bore" transform="translate(${x+25} ${y})"><ellipse rx="9" ry="10" fill="#729B68"/><ellipse rx="5.5" ry="6.6" fill="#345634" stroke-width="2.2"/></g>`).join('')).join('')}</g>` : `<g id="launcher-rigid" transform="translate(${mount[0]} ${mount[1]})"><path fill="url(#barrel)" d="M-4-17 C-17-15-17 14-4 17 L32 17 C47 17 47-17 32-17 Z"/><path d="M-4-7 L32-7" stroke="#CEE5AD" stroke-width="7" opacity=".55"/><ellipse cx="32" rx="11" ry="17" fill="#78A069"/><ellipse cx="33" rx="6.8" ry="11" fill="#345634" stroke-width="3"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><title>${identity.toUpperCase()} ${state} — unapproved editable feasibility study</title><metadata>Reference body-only production board. Fixed root 128,224; source prototype coordinates only. Face follows soft body; rigid launcher follows transformed mount and retains size. Transparent; no effect or shadow.</metadata><defs><linearGradient id="body" x2=".8" y2="1"><stop stop-color="#C7DFAA"/><stop offset="1" stop-color="#A9CC93"/></linearGradient><linearGradient id="barrel" x2="0" y2="1"><stop stop-color="#B9D8A1"/><stop offset="1" stop-color="#8EB579"/></linearGradient></defs>${feet}<g fill="url(#body)" stroke="#4B281C" stroke-width="4.7" stroke-linecap="round" stroke-linejoin="round"><g id="soft-body-face" transform="translate(128 211) scale(${sx} ${sy}) translate(-128 -211)"><path id="continuous-body-two-buds-one-rear-lobe" d="${bodyPath}"/>${burst?'<path id="belly-spot" d="M68 173 C70 164 81 162 89 166 C101 166 101 177 96 184 C87 190 68 188 68 173 Z" fill="#779965" stroke="none"/>':''}<path id="eye" d="M144 133 C149 125 153 133 152 140 C152 148 147 151 144 145 C142 141 142 137 144 133 Z" fill="#4B281C" stroke="none"/><path id="cheek-smile" d="${burst?'M141 163 Q148 174 157 163':'M139 167 Q150 179 139 187'}" fill="none" stroke-width="3.8"/></g>${launcher}</g></svg>`;
}
for (const identity of ['basic','burst']) for (const state of Object.keys(states)) write(`previews/${identity}-${state}.svg`,rig(identity,state));
write('prototype-manifest.json',{
  status:'unapproved_editable_feasibility_no_runtime',sourceCanvas:[256,256],root:[128,224],
  prototypeMeasurementsOnly:true,coordinateAuthority:'these new SVG paths only; not approved runtime anchors',
  identities:['tower:BASIC','tower:BURST'],states:Object.keys(states),
  invariants:{footGroundY:224,bodyFaceSameTransform:true,rigidBarrelSizeIndependent:true,burstBores:{count:4,rx:9,ry:10,grid:[2,2]}},
  limitations:['No left/up/full-aim projection made','No production silhouette approval','No runtime scaling/performance tests','8 vector source files; frame-switch playback is a technique preview, not smooth production animation']
});

const cards = coverage.map(i=>{
  const boards=[...new Map(i.actions.flatMap(a=>a.bodySources).map(s=>[s.path,s])).values()];
  return `<article id="${i.identity.replace(':','-')}"><h3>${esc(i.identity)} <small>${i.actions.length} 映射</small></h3><p>${esc(i.anatomy)}</p><p class="counts">${Object.entries(i.organCounts).map(([k,v])=>`${esc(k)}: <b>${v}</b>`).join(' · ')}</p><div class="boards">${boards.map(b=>`<a href="${esc(b.href)}" target="_blank"><img loading="lazy" src="${esc(b.href)}" alt="${esc(i.identity)} approved body source board"/><span>${esc(path.basename(b.path))} · 参考整板，非生产帧</span></a>`).join('')}</div><details><summary>全部动作与来源格</summary><table><tr><th>动作</th><th>身体来源</th><th>复用模式</th></tr>${i.actions.map(a=>`<tr><td>${esc(a.action)}</td><td>${a.bodySources.map(b=>`<a href="${esc(b.href)}">${esc(path.basename(b.path))}</a> 行${esc(b.row)} / 列${esc(b.column)} / ${esc(b.label)}`).join('<br/>')}</td><td>${esc(a.mappingMode)}</td></tr>`).join('')}</table></details><p class="status">生产状态：${esc(i.previewStatus)}</p></article>`;
}).join('');
write('index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoGuard · Characters r01</title><style>
*{box-sizing:border-box}body{margin:0;background:#fff9ef;color:#4b281c;font:15px/1.6 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1280px;margin:auto;padding:28px}h1,h2,h3{line-height:1.25}h1{font-size:30px}h2{margin-top:42px}a{color:#466a3e}small{font-size:12px;font-weight:500}nav{display:flex;flex-wrap:wrap;gap:14px;margin:20px 0}.notice{padding:18px;background:#f8ddaa;border-left:5px solid #4b281c}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}article{background:#fffcf7;padding:20px;border:1px solid #d8c8b7;border-radius:14px}article h3{margin:0 0 12px}.boards img{width:100%;display:block}.boards a{display:block;font-size:12px}.boards{display:grid;gap:12px}.counts{font-size:12px;background:#f0eadf;padding:10px}.status{font-size:12px;color:#744537}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border-bottom:1px solid #dfd4c7;padding:8px;text-align:left;vertical-align:top}details{margin-top:16px}.studies{display:flex;gap:16px;flex-wrap:wrap}.study{background:#fffdf8;border:1px solid #d8c8b7;padding:18px;border-radius:14px;width:calc(50% - 8px)}.frames{display:flex;gap:10px;flex-wrap:wrap}.frames figure{margin:0;text-align:center;font-size:11px}.frames img{width:96px;height:96px;background:repeating-conic-gradient(#f2efe8 0% 25%,#fff 0% 50%) 50% / 12px 12px}.sizes{display:flex;align-items:end;gap:18px;margin-top:20px}.sizes figure{margin:0;text-align:center;font-size:12px}.sizes img{display:block}.size48{width:48px;height:48px}.size64{width:64px;height:64px}.size96{width:96px;height:96px}button{background:#b6d4ae;color:#4b281c;border:1px solid #4b281c;border-radius:8px;padding:10px 16px;font:inherit;cursor:pointer}.scene{display:grid;grid-template-columns:1fr 1fr;gap:20px}.scene img{width:100%}@media(max-width:800px){.grid,.scene{grid-template-columns:1fr}.study{width:100%}main{padding:18px}}
</style><main><h1>GeoGuard · 角色制作勘察 r01</h1><p>48身份 · 375动作映射 · 2026-10-02</p><div class="notice"><b>只读勘察与未获批矢量试样。</b>正式代码和资源等待统一契约批准。参考整板只用于比对；未裁为运行帧。48身份生产动作预览尚未制作；以下只有BASIC/BURST技术试样，不能将此页计为全48身份生产验收。</div><nav><a href="implementation-plan.md">制作计划</a><a href="contract-proposal.json">接口提案</a><a href="coverage.json">完整覆盖JSON</a><a href="source-fingerprints.json">来源SHA</a><a href="verification.json">核查结果</a></nav><h2>代表性可编辑画法</h2><p>按已批body-only板手工构造连体轮廓。ROOT(128,224)固定；身体和脸同变形，炮组只随P移动且保持尺寸。透明SVG保留命名部件。色彩/比例、连续动画和全方向尚待生产审阅。</p><button id="play" type="button" aria-pressed="false">播放试样帧切换</button><div class="studies">${['basic','burst'].map(id=>`<section class="study"><h3>${id.toUpperCase()} · 试样</h3><div class="frames">${Object.keys(states).map(st=>`<figure><img src="previews/${id}-${st}.svg" alt="${id} ${st} editable feasibility"/><figcaption>${st}</figcaption></figure>`).join('')}</div><div class="sizes">${[48,64,96].map(sz=>`<figure><img class="size${sz}" data-cycle="${id}" src="previews/${id}-neutral.svg" alt="${id} ${sz}px small preview"/><figcaption>${sz}px</figcaption></figure>`).join('')}</div></section>`).join('')}</div><h2>已批电脑端联合图</h2><p>身体精细结构以角色源与解剖锁为准。图中数值与布局不作为实测生产锚点。</p><div class="scene">${['density','twins'].map(id=>`<a href="${href(path.join(bible,`scene-ui-2026-10-02/master/submissions/r04/master-desktop-${id}-r04.png`))}"><img src="${href(path.join(bible,`scene-ui-2026-10-02/master/submissions/r04/master-desktop-${id}-r04.png`))}" alt="approved desktop ${id} scene"/></a>`).join('')}</div><h2>48身份来源与器官锁</h2><p>展开每项可审阅全部命名动作和来源行/列。数字来自解剖锁人工转录；命名 independent 表示另一个游戏实体，不是器官。</p><div class="grid">${cards}</div></main><script>let playing=false,timer=null;const states=['neutral','squash','stretch','neutral','attack','neutral'];let n=0;const btn=document.getElementById('play');btn.addEventListener('click',()=>{playing=!playing;btn.setAttribute('aria-pressed',String(playing));btn.textContent=playing?'暂停试样帧切换':'播放试样帧切换';if(playing){timer=setInterval(()=>{n=(n+1)%states.length;document.querySelectorAll('[data-cycle]').forEach(img=>img.src='previews/'+img.dataset.cycle+'-'+states[n]+'.svg')},280)}else{clearInterval(timer)}});</script></html>`);

write('source-fingerprints.json',{status:'read_only_source_snapshot',files:[...inputs.values()].sort((a,b)=>a.path.localeCompare(b.path))});
const html = fs.readFileSync(path.join(out,'index.html'),'utf8');
const targets = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map(m=>m[1]);
const missing = targets.filter(t=>!fs.existsSync(path.resolve(out,t)) && !['source-fingerprints.json','verification.json'].includes(t));
if (missing.length) throw new Error('Missing preview links: '+missing.join(', '));
const sourceShaOK = [...inputs.values()].every(f=>sha(path.join(root,f.path))===f.sha256);
write('verification.json',{
  result:'passed_planning_checks_only',identities:coverage.length,actionMappings:keys.length,uniqueKeys:new Set(keys).size,groups,
  bodySourceReferences:coverage.reduce((n,i)=>n+i.actions.reduce((k,a)=>k+a.bodySources.length,0),0),externalEffectReferences,
  uniqueBodySourceFiles:new Set(coverage.flatMap(i=>i.actions.flatMap(a=>a.bodySources.map(s=>s.path)))).size,
  sourceFilesFingerprinted:inputs.size,sourceShaOK,htmlLocalReferences:targets.length,missingLocalReferences:missing,
  structuredOrganCounts:coverage.length,editableStudySVGs:8,
  runtimeModifiedByThisOwner:false,productionResourceFiles:0,productionBodiesCompleted:0,productionActionPreviewsCompleted:0,
  testsRun:['exact 48/375 source coverage','approved body source SHA verification','all generated HTML local references exist','UTF-8 without BOM checked during packet sealing'],
  notRun:['game build/tests: no runtime change','runtime integration','smooth animation review','48 identity production visuals','360 degree aiming','performance','mouse/device QA']
});
const walk = dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);
const files = walk(out).filter(file=>path.basename(file)!=='packet.json').map(file=>({path:'submissions/r01/'+path.relative(out,file).replaceAll('\\','/'),sha256:sha(file),bytes:fs.statSync(file).size}));
for (const f of files) {
  const bytes=fs.readFileSync(path.join(out,path.relative('submissions/r01',f.path)));
  if (bytes[0]===239 && bytes[1]===187 && bytes[2]===191) throw new Error('Unexpected BOM '+f.path);
}
write('packet.json',{
  owner:'characters',revision:'r01',status:'submitted_for_plan_and_contract_review',scope:'read_only_inventory_and_production_plan_with_2_unapproved_editable_studies',
  counts:{identities:48,actions:375,sourceCoverage:48,productionIdentitiesCompleted:0,productionActionPreviewsCompleted:0,unapprovedPrototypeIdentities:2},
  files,coveredRequirements:['all48 identities inventoried','all375 approved actions traced to exact body source locator/SHA','organ count transcription for48','file ownership proposal','editable body/face/rigid launcher feasibility forBASIC/BURST','fixed-root/face/aim/mirror/4-bore plan','runtime state and independent entity boundaries','risks/dependencies/acceptance plan','approved final desktop joint scenes consulted'],
  dependencies:['Baseline publication must be explicitly released by primary reviewer','Unified art contract/API/palette/ownership approval','Integration view-only shot/trigger/defeat/aim signals','48 production identities and action previews remain future authorized work'],
  openIssues:['CHAR-API','CHAR-SCALE','CHAR-EVENT','CHAR-AIM','CHAR-LAYERS','CHAR-PALETTE','CHAR-ICON'],
  restrictionsObserved:['only characters/submissions/r01 writes','no src/public/package edits','no archived artwork edits','no Git operation','no tool messages to other threads'],
  visualStudyApproval:'not_requested_as_final_production; primary review needed',
  summary:'48身份375动作来源清单、器官计数、分层/状态/锚点计划及BASIC/BURST八个可编辑透明SVG试样；正式实现等待统一契约批准。'
});
console.log(JSON.stringify({out,groups,sourceFiles:inputs.size,files:files.length,bodySourceRefs:coverage.reduce((n,i)=>n+i.actions.reduce((k,a)=>k+a.bodySources.length,0),0)},null,2));
