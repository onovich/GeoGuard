import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)), owner=path.resolve(here,'../..'), repo='D:/WebProjects/GeoGuard';
if(fs.existsSync(path.join(here,'packet.json')))throw Error('r02 sealed: create a new revision instead');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const put=(file,data)=>fs.writeFileSync(path.join(here,file),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n','utf8');
const priorPath=path.join(owner,'submissions/r01/production-split.json');
const m=JSON.parse(fs.readFileSync(priorPath,'utf8'));
const pairs=[
 ['pair-01-commander-hunter.png','COMMANDER','HUNTER'],
 ['pair-02-fortress-prism.png','FORTRESS','PRISM'],
 ['pair-03-frost-rail.png','FROST_JUDGE','RAIL_WARLORD'],
 ['pair-04-collector-astrolabe.png','COLLECTOR','ASTROLABE'],
 ['pair-05-twins.png','TWINS_SUN','TWINS_MOON'],
 ['pair-06-dragon-spider.png','DRAGON','SPIDER_MATRIARCH']
];
const sources={HIVE:{file:'submissions/r01/hive-production.png',row:1,states:['NEUTRAL','WINDUP','ATTACK','OPEN'],reviewStatus:'accepted',review:'../reviews/bosses-mechanics-r01.md'},SEAL:{file:'submissions/r01/seal-production.png',row:1,states:['INTACT','TRIGGER','BROKEN','FADE'],reviewStatus:'accepted',review:'../reviews/bosses-mechanics-r01.md'}};
for(const [file,top,bottom]of pairs){sources[top]={file:'submissions/r02/'+file,row:1,states:['NEUTRAL','WINDUP','ATTACK','OPEN'],reviewStatus:'pending',review:null};sources[bottom]={file:'submissions/r02/'+file,row:2,states:['NEUTRAL','WINDUP','ATTACK','OPEN'],reviewStatus:'pending',review:null};}
const newIds=pairs.flatMap(x=>x.slice(1));
const remaining=m.entities.filter(e=>!sources[e.id]).map(e=>e.id);
const anchors={
 COMMANDER:{armRootL:[124,250],armRootR:[388,250],innerFistL:[155,329],innerFistR:[357,329],face:[256,259],feetMidpoint:[256,448]},
 HUNTER:{rearEar:[163,177],horn:[289,188],nose:[375,287],rearLobe:[117,326],nearEye:[307,272]},
 FORTRESS:{shellLift:[256,233],shieldL:[135,292],shieldR:[377,292],face:[256,336],feetMidpoint:[256,448]},
 PRISM:{mirrorL:[128,288],mirrorR:[384,288],face:[256,261]},
 FROST_JUDGE:{crown:[256,121],head:[256,237],collar:[256,335],fistL:[131,361],fistR:[381,361],chestDiamond:[256,379]},
 RAIL_WARLORD:{upperRailRoot:[270,230],lowerRailRoot:[270,338],port:[399,286],rearTail:[91,280],nearEye:[229,275]},
 COLLECTOR:{budL:[209,146],budR:[278,148],tailArm:[362,288],bellyCoin:[231,329],face:[231,213]},
 ASTROLABE:{shell:[242,296],centerOrb:[280,291],orbitOrb:[381,202],shellDot:[172,347],shellDash:[193,366]},
 TWINS_SUN:{body:[256,276],petalRootsClockwise:[[256,162],[355,219],[355,333],[256,390],[157,333],[157,219]],face:[256,270]},
 TWINS_MOON:{body:[256,286],coralRim:[291,392],face:[299,281]},
 DRAGON:{head:[380,272],nearWing:[236,197],farWing:[299,172],tailBase:[148,330],tailEnd:[109,270]},
 SPIDER_MATRIARCH:{outerLegL:[127,299],innerLegL:[180,326],innerLegR:[332,326],outerLegR:[385,299],shortFootL:[211,394],shortFootR:[301,394],face:[256,326]}
};
const inspection={
 COMMANDER:'四格保留外侧弯曲大臂和前侧内拳、双脚、三主顶瓣；未将OPEN画成腹洞。',
 HUNTER:'四格保留长后耳、顶角、鼻楔、后瓣、双脚及单近眼；无残影或射线。',
 FORTRESS:'四格保留一顶壳、两侧盾、两足及奶油脸窗两眼；攻击格仅原壳沿中央连接上抬。',
 PRISM:'四格黑长脸窗两白眼、两紫镜翼完整；镜翼属父级部件，无发射线。',
 FROST_JUDGE:'冠始终为冠，U项圈、两拳、胸菱、圆头五官均保留；无SEAL和目标塔。',
 RAIL_WARLORD:'上下两长轨臂围中圆口，双背鳍、尾瓣、既有后部浅色形体细节照参考保留；未增加射线或RETICLE。',
 COLLECTOR:'双芽、双脚、单卷尾臂、舌及腹币守恒；无外置货币或COURIER。',
 ASTROLABE:'珊瑚月壳、紫中心球两眼、小珊瑚轨球、壳上点/短线守恒；无轨迹线。',
 TWINS_SUN:'四格均可数12/2/4/6/8/10点六瓣；闭眼仍两槽；每格仅日体。',
 TWINS_MOON:'四格永久珊瑚下缘保留；两眼一口、无四肢；每格仅月体。',
 DRAGON:'四格连续单条S身尾与双翅完整；两眼单圆长嘴，无脚、无弹滴。',
 SPIDER_MATRIARCH:'四大腿及两短底足逐格可见；两眼微笑、单圆腹，无网或幼体。'
};
function bodyPose(a){
 if(a.group==='mechanic')return a.sourceActionKey;
 if(['NEUTRAL','WINDUP','OPEN'].includes(a.sourceActionKey))return a.sourceActionKey;
 if(/^P[123]$/.test(a.sourceActionKey)||a.sourceActionKey.startsWith('SOLO')||['ORBIT','SWAP'].includes(a.sourceActionKey)&&a.id.startsWith('TWINS_')||a.id==='HIVE'&&a.sourceActionKey==='HATCH')return 'NEUTRAL';
 return 'ATTACK';
}
m.revision='r02';m.status='submitted';m.mappingApproval='accepted-r01 (runtime split unchanged)';
m.productionReadiness='Body-only reference specifications. HIVE/SEAL accepted; 12 new bodies pending; remaining 10 identities await authorized next batch. Not transparent sprites or measured animation.';
m.bodySources=sources;
m.batchCoverage={newIdentityCount:newIds.length,newReferenceCount:m.actions.filter(a=>newIds.includes(a.id)).length,existingAcceptedIdentities:['HIVE','SEAL'],pendingNewIdentities:newIds,notYetProduced:remaining};
for(const e of m.entities){e.newBodySource=sources[e.id]??null;e.bodyReviewStatus=sources[e.id]?.reviewStatus??'not-produced';if(anchors[e.id])e.localAnchorDesign={canvas:[512,512],root:[256,448],collisionCenter:[256,288],anchors:anchors[e.id],precision:'Proposed local source-art joint positions only; not measured from concept sheet. Parent-organ anchors follow the same deform rig; frame root remains fixed.'};e.visualSelfCheck=inspection[e.id]??'Existing r01 approved or pending next batch';}
for(const a of m.actions){
 a.mappingApproval='accepted-r01';
 const source=sources[a.id],pose=bodyPose(a);
 a.productionBodySource=source?{file:source.file,row:source.row,column:source.states.indexOf(pose)+1,state:pose,reuse:true,reviewStatus:source.reviewStatus}:null;
 a.productionApproval=source?.reviewStatus==='accepted'?'accepted-reference-spec':source?'pending-body-review':'not-produced';
 a.sourceResolution=source?'New body-only sheet / explicit shared-pose reuse':'Next batch required; original sourceSheet retained for anatomy reference only, not a production body';
 a.body.exportRule='Exclude cream background, guide root, baseline, text; no direct atlas crop. No projectile/summon/other actor/skill effect baked in. Preserve all organs and fixed canvas.';
 if(a.sourceActionKey==='OPEN')a.bodyReuseNote='OPEN body panel + separate whole-silhouette vulnerability outline; never core-only cue.';
 if(a.sourceActionKey.startsWith('SOLO'))a.bodyReuseNote='Same surviving member NEUTRAL/WINDUP/ATTACK/OPEN body cycle. Survivor buff and solo skill effects remain separate; no new member.';
}
m.openIssues=['12 new body identities / 6 sheets await main-review image inspection.','Remaining 4 boss bodies and 6 mechanics will be produced in the next authorized batch after this submission.','All local roots and joint values are design specifications; no pixel-exact continuous-frame or game performance certification.'];
m.sources.push({file:'docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/bosses-mechanics/submissions/r01/production-split.json',sha256:hash(priorPath)});
put('production-split.json',m);
const md=['# r02：第一批新身体来源','','运行期拆分沿用已批r01，不修改技能或分类。新增6板12身份、117条原参考的身体归属。加已批HIVE/SEAL，共130/192条现有新body-only来源；余62条待第二批，明确不冒充完成。','','## 新图（全部pending）','','|板|上行|下行|状态|','|---|---|---|---|',...pairs.map(([file,a,b])=>`|${file}|${a}|${b}|pending|`),'','## 完整192来源表','','原动作key保留。NEUTRAL/WINDUP/ATTACK/OPEN为共享身体资源；旧阶段/技能示意中的效果另读runtimeAbilityIds，不要求重复绘制身体。行列仅标认图格，不是游戏图集裁切坐标。','','|原动作key|新身体图|行／列／姿态|审查状态|','|---|---|---|---|'];
for(const a of m.actions){const s=a.productionBodySource;md.push(`|${a.key}|${s?s.file:'下一批未生成；旧图仅解剖参考'}|${s?`${s.row} / ${s.column} / ${s.state}`:'—'}|${a.productionApproval}|`);}
md.push('','## 余下明确范围','',remaining.join('、'),'','这些身份下一批才有新身体图；本次不挂不存在的图片，也不声明其192归属已全完成。','');
put('production-split.md',md.join('\n'));
put('review-notes.md',['# r02 自检与待审边界','','本批采用内置image_gen，六次独立调用，各自两身份四状态。生成前实际查看所有引用的最新已批原图。生成后逐图检查，以下是制作方自检，不能替代主审。','',...newIds.map(id=>`- **${id}**：${inspection[id]}`),'','根锚十字／水平线均为设计导引，导出身体时排除；画布、collisionCenter/root与器官挂点见production-split.json。参考图画幅布局不等于可直接裁切的动画图集，禁止逐帧可见包围盒居中。','OPEN为相同完整身体加独立全身易伤轮廓，轮廓不烘焙。所有P1/P2/P3、技能、SOLO仅映射上述四身体姿态；效果、独立召唤和逻辑位移沿用r01完整运行链。','六个新图都标pending。HIVE/SEAL直接引用已批r01，不重画、不改变。','余下BLOOD_FORGE、VOID_CONDUCTOR、LABYRINTH_KEEPER、NIGHTMARE_BLOOM、NEST、WEB、ROOT、WALL、RETICLE、COURIER列为not-produced，下一批继续。',''].join('\n'));
put('effects-handoff.md','# 技能效果交接\n\n全部技能效果继续以已批r01及本包production-split.json的abilityCatalog为依据，优先optimized handler，缺失才fallback。本批只新增身体引用，不修改效果触发或实体。\n\n- 所有OPEN是全身易伤覆盖，不是核心标记。\n- 双子独奏复用其各自身体；两成员独立HP/root，不合并ECLIPSE身体。\n- ASTROLABE外轨小球是父级器官，轨迹线为独立效果；不得把小球当新弹体。\n- RAIL_WARLORD圆口提供美术挂点但不搬迁实际line hazard源，不新增projectile。\n- COLLECTOR腹币是固定身体标记，COURIER直接返款效果另做，不新增拾取。\n- DRAGON口／双翅／单尾只作身体；BREATH/TAIL旧key到当前技能的限制仍按r01说明。\n\n由主审统一路由至effects-ui；本组不写对方目录。\n');
function html(prefix){return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boss／机关制作索引</title><style>body{margin:0;background:#faf6ed;color:#442c24;font:16px/1.7 system-ui,sans-serif}main{max-width:1280px;margin:40px auto;padding:0 24px}h1{font-size:30px}a{color:#854f39}section{margin:36px 0;padding:20px;border:1px solid #d8caba;border-radius:16px;background:#fffdf7}img{max-width:100%;height:auto;border-radius:8px}.state{display:inline-block;padding:2px 10px;background:#f2d5a1;border-radius:12px}.accepted{background:#d5e5cd}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #dacdbe;padding:8px;text-align:left}</style><main><h1>Boss／机关 · 身体规范索引</h1><p>r01已批：HIVE／SEAL。r02六新板均 <b>pending</b>。共130/192原参考已有新body-only来源，余62条下一批制作。固定root为设计规格；不是连续帧实测或游戏资源接入。</p><p><a href="${prefix}submissions/r02/production-split.md">192条来源表</a> · <a href="${prefix}submissions/r02/production-split.json">完整JSON与运行证据</a> · <a href="${prefix}submissions/r02/review-notes.md">自检说明</a></p>${[['HIVE','submissions/r01/hive-production.png'],['SEAL','submissions/r01/seal-production.png']].map(([n,f])=>`<section><h2>${n} <span class="state accepted">accepted r01</span></h2><img src="${prefix}${f}" alt="${n} approved specification"></section>`).join('')}${pairs.map(([f,a,b])=>`<section><h2>${a} / ${b} <span class="state">pending r02</span></h2><p>上行${a}；下行${b}。四列NEUTRAL／WINDUP／ATTACK／OPEN。OPEN全身轮廓另层。</p><img src="${prefix}submissions/r02/${f}" alt="${a} and ${b} body only production sheet"><p><a href="${prefix}submissions/r02/${f.replace('.png','-prompt.txt')}">内置image_gen提示词</a></p></section>`).join('')}<section><h2>下一批未生成</h2><p>${remaining.join('、')}</p><p>保留原解剖参考，暂不标生产身体完成。</p></section></main></html>`;}
put('index.html',html('../../'));
fs.writeFileSync(path.join(owner,'index.html'),html(''),'utf8');
const expected=JSON.parse(fs.readFileSync(priorPath,'utf8')).actions.map(a=>a.key);
const checks={keys192Exact:m.actions.length===192&&m.actions.every(a=>expected.includes(a.key))&&new Set(m.actions.map(a=>a.key)).size===192,newBodies12:newIds.length===12,newReferences117:m.actions.filter(a=>newIds.includes(a.id)).length===117,hasNewBody130:m.actions.filter(a=>a.productionBodySource).length===130,remaining62:m.actions.filter(a=>!a.productionBodySource).length===62,allExistingPaths:m.actions.filter(a=>a.productionBodySource).every(a=>fs.existsSync(path.join(owner,a.productionBodySource.file))),allMappedColumnsValid:m.actions.filter(a=>a.productionBodySource).every(a=>a.productionBodySource.column>=1&&a.productionBodySource.column<=4),sourceHashesUnchanged:m.sources.every(s=>hash(path.join(repo,s.file))===s.sha256),newBodiesPending:newIds.every(id=>sources[id].reviewStatus==='pending')};
if(Object.values(checks).some(x=>!x))throw Error(JSON.stringify(checks));
put('validation-report.json',{checks,bodyReferences:130,pendingReferences:117,acceptedReferences:13,unproducedReferences:62,sourceConsistency:'192 original keys preserved; new source points to 6 new sheets or prior approved samples; not-produced entries have null productionBodySource',images:pairs.map(([file])=>{const b=fs.readFileSync(path.join(here,file));return {file,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:hash(path.join(here,file))};}),limitation:'No gameplay, source-vector, transparent-frame, pixel-root or performance test claimed.'});
const files=fs.readdirSync(here).filter(f=>f!=='packet.json').sort().map(f=>({path:'submissions/r02/'+f,sha256:hash(path.join(here,f))}));
for(const f of files.filter(x=>/\.(json|md|txt|mjs|html)$/.test(x.path))){const b=fs.readFileSync(path.join(owner,f.path));if(b[0]===239&&b[1]===187&&b[2]===191)throw Error('BOM '+f.path);}
put('packet.json',{owner:'bosses-mechanics',revision:'r02',status:'submitted',scope:'第一扩展批：12个Boss身体，6板×2身份×4状态，117条原参考新body-only归属；完整192表中余62明确not-produced等待下一批。',files,images:pairs.map(([f])=>'submissions/r02/'+f),coveredIds:newIds,coveredActions:m.actions.filter(a=>newIds.includes(a.id)).map(a=>a.key),openIssues:m.openIssues,dependencies:m.dependencies,summary:'r01保持不变。六板全部pending；自检固定器官和无独立对象烘焙，双子两实体、DRAGON单尾、OPEN同身体+独立全身覆盖。index.html提供已批／待审／未制作区别。',artGeneration:{tool:'built-in image_gen',prompts:pairs.map(([f])=>'submissions/r02/'+f.replace('.png','-prompt.txt'))},index:'submissions/r02/index.html',validation:'submissions/r02/validation-report.json',mappingScope:{allOriginalKeys:192,newBodyReferences:117,previousAcceptedReferences:13,remainingNotProduced:62}});
const temp=path.join(owner,'READY.pending.json');fs.writeFileSync(temp,JSON.stringify({revision:'r02',packetPath:'submissions/r02/packet.json'},null,2)+'\n','utf8');fs.renameSync(temp,path.join(owner,'READY.json'));
if(files.some(f=>hash(path.join(owner,f.path))!==f.sha256))throw Error('Postseal hash failure');
console.log(JSON.stringify({submitted:'r02',checks,newIds,remaining,fileCount:files.length},null,2));
