import fs from 'node:fs';
import { TOWER_LIBRARY, ENEMY_TYPES } from 'file:///D:/WebProjects/GeoGuard/src/data/gameConfig.js';
import { buildTowerAtLevel } from 'file:///D:/WebProjects/GeoGuard/src/logic/engine/towerRules.js';
import { createPlacedTower } from 'file:///D:/WebProjects/GeoGuard/src/logic/engine/debugTowerRuntime.js';
import { createWaveDefinition } from 'file:///D:/WebProjects/GeoGuard/src/logic/engine/gameRules.js';
import { createPlayerState } from 'file:///D:/WebProjects/GeoGuard/src/logic/engine/gameState.js';
import { spawnEnemyRuntimeAt, spawnEnemyGroupRuntime } from 'file:///D:/WebProjects/GeoGuard/src/logic/engine/entitySpawnRuntime.js';
import { updateEnemyBehaviorRuntime } from 'file:///D:/WebProjects/GeoGuard/src/logic/engine/enemyBehaviorRuntime.js';
import { settleEnemyDefeatRuntime } from 'file:///D:/WebProjects/GeoGuard/src/logic/engine/enemyDefeatRuntime.js';
const prep=JSON.parse(fs.readFileSync(new URL('../../preparation/desktop-r04-source-states.json',import.meta.url),'utf8'));
const noop=()=>{};
const state={enemies:[],towers:[],drops:[],hazards:[],nextEnemyUid:1,player:{...createPlayerState(),x:2000,y:2000},gameTime:10,mode:'normal'};
const beacon=spawnEnemyRuntimeAt({state,enemyKey:'BEACON',x:0,y:0});
beacon.summonTimer=ENEMY_TYPES.BEACON.summon.interval;
let requested;
updateEnemyBehaviorRuntime({state,enemy:beacon,dt:0,spawnAround:(source,enemyKey,count,radius)=>{requested={enemyKey,count,radius};return spawnEnemyGroupRuntime({state,source,enemyKey,count,radius});},spawnImpactWave:noop,updateBossBehavior:noop,damageTarget:noop,damageArea:noop,spawnParticle:noop,syncHudHealth:noop,queueAreaHazard:noop});
const spawned=state.enemies.filter(e=>e.id==='BASIC');
const inheritedOwner=spawned.map(e=>e.summonedByBossUid);
beacon.hp=0;
const settle=e=>settleEnemyDefeatRuntime({state,enemy:e,enemyIndex:state.enemies.indexOf(e),spawnParticle:noop,spawnAround:noop,playBossDefeatCue:noop,syncHudMoney:noop,openBossReward:noop,enrageEncounterPartner:noop});
settle(beacon);
const afterBeaconDefeat=state.enemies.filter(e=>e.id==='BASIC').length;
spawned[0].hp=0;settle(spawned[0]);
const survivingSummons=state.enemies.filter(e=>e.id==='BASIC').length;
if(spawned.length!==3||afterBeaconDefeat!==3||survivingSummons!==2)throw Error('Summon survival proof failed');
const make=(id,level,uid,anchor,ratio=1)=>{
const t=createPlacedTower({tower:buildTowerAtLevel({...TOWER_LIBRARY[id],available:true},level),uid,x:0,y:0});
return{id,uid,level,worldBadge:level?'+'+level:null,maxHp:t.maxHp,hp:Math.round(t.maxHp*ratio),hpRatio:Math.round(t.maxHp*ratio)/t.maxHp,showHp:ratio<1,renderAnchor:anchor,fireRate:t.fireRate,burstCount:t.burstCount??1};
};
const A=[
make('BASIC',2,400,[713,177],.4),make('BASIC',0,401,[510,225]),make('BASIC',0,402,[875,278]),
make('BASIC',1,403,[340,379],.65),make('BASIC',1,404,[487,358]),make('BASIC',1,405,[1322,459],.65),
make('BURST',0,406,[1069,305]),make('BURST',0,407,[590,436]),make('BURST',0,408,[627,532]),make('BURST',0,409,[982,528])];
const B=[
make('BASIC',0,500,[845,309]),make('BASIC',2,501,[1148,320],.55),make('BASIC',1,502,[1287,447],.55),
make('BASIC',1,503,[622,588]),make('BASIC',1,504,[940,600]),
make('BURST',0,505,[578,313]),make('BURST',0,506,[1144,552]),make('SENTINEL',1,507,[230,596],.55)];
const wave=createWaveDefinition(31);
const counts=wave.queue.reduce((a,k)=>(a[k]=(a[k]??0)+1,a),{});
const contract={
status:'submitted; source-derived design contract, not runtime capture',revision:'r04',date:'2026-10-02',
supersedes:'Original planned22enemies/13towers and original B7types; actual narrowed roster permitted by main review.',
layout:{A:'1440x900 logical target',B:'1280x720 logical target',cardWidth:140,gap:8,barWidth:'min(92vw,920px)',scrollbar:'native horizontal',actualPngGeometry:'Concept raster approximation, not a measured implementation.'},
catalog:prep.A.catalog,
A:{wave:31,player:{hp:62,maxHp:100},money:18,queueCounts:counts,visibleEnemies:{BASIC:12,TANK:7,total:19},enemyAnchors:{BASIC:[[99,194],[306,209],[390,141],[962,176],[1127,206],[1466,217],[1516,294],[184,520],[85,607],[258,632],[1167,654],[1458,588]],TANK:[[229,126],[157,282],[1326,128],[1335,239],[1418,374],[390,566],[1320,614]]},summonHistory:{trigger:ENEMY_TYPES.BEACON.summon,requested,spawned:spawned.length,inheritedBossOwners:inheritedOwner,afterBeaconDefeat,survivingSummons,accounting:'10 wave BASIC + 2 surviving BASIC from one former BEACON event; the third summon and BEACON are defeated; no BEACON visible now.'},towers:A,visibleTowerCount:A.length,projectiles:{observed:26,basicSageBalls:9,burstSageCoralOvals:16,playerHoney:1,logic:'BURST level0 fires4. Six BASIC single shots plus3 from earlier valid shots may coexist within2s life. Not claimed as exact single volley or full trajectory simulation.'},drops:4,hazards:[],bosses:[],interaction:{type:'hover',towerId:'SNIPER',summary:'高伤穿透，专打后排。',damage:43,fireRate:1.86,range:378},scroll:'start: BASIC/CANNON/SNIPER/RAPID/MORTAR/FROST full; RAIL clipped'},
B:{wave:27,player:{hp:62,maxHp:100},money:18,towers:B,visibleTowerCount:B.length,ordinaryEnemies:[],members:prep.B.members,hud:prep.B.hud,hazards:prep.B.hazards,projectiles:{observed:15,burstSageCoralOvals:9,basicSageBalls:4,sentinelDarkSageBall:1,playerHoney:1,logic:'Left BURST5 visible may include an earlier volley survivor; right4. One BASIC has no visible shot. Not a claim of5pellet emission or one synchronized volley.'},drops:0,interaction:{type:'drag',towerId:'SENTINEL',price:69,money:18,canPlace:false,message:'资金不足',ghostIsPlacedTower:false,rangeBoundary:'right edge clipped by viewport; not certified wholly visible'},scroll:'end: SNIPER clipped; RAPID/MORTAR/FROST/RAIL/BURST/SENTINEL full'},
limits:['Pixel anchors describe PNG positions only, not game world range proofs.','HP bars are schematic; exact maxHp/hp above derived from actual tower identity/level.','No full playthrough, economy, runtime UI, mouse or physics trajectory verification.','UI tooltip and persistent drag badge are approved representations of existing content, not a claim that those widgets are implemented.','Resource art skews cyan; production palette is mint per UI/B01 contract.']
};
fs.writeFileSync(new URL('./source-derived-states.json',import.meta.url),JSON.stringify(contract,null,2)+'\n','utf8');
console.log(JSON.stringify({summonProof:contract.A.summonHistory,A:A.map(t=>({id:t.id,level:t.level,hp:t.hp,maxHp:t.maxHp})),B:B.map(t=>({id:t.id,level:t.level,hp:t.hp,maxHp:t.maxHp}))},null,2));

