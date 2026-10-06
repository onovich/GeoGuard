import { seededRandom, withRandom } from '../../../scripts/art-validation/snapshot.mjs';

// Imports are injected so exactly the same QA driver runs fixed baseline and candidate.
export async function loadEngine(importer) {
  const paths = {
    config: 'data/gameConfig.js', state: 'logic/engine/gameState.js', spawn: 'logic/engine/entitySpawnRuntime.js',
    encounter: 'logic/engine/encounterRuntime.js', combat: 'logic/engine/bossCombatRuntime.js', ability: 'logic/engine/bossOptimizedAbilities.js',
    behavior: 'logic/engine/enemyBehaviorRuntime.js', battlefield: 'logic/engine/battlefieldRules.js',
    frame: 'logic/engine/combatFrameRuntime.js', offense: 'logic/engine/combatOffenseRuntime.js',
    rules: 'logic/engine/combatRules.js', mechanics: 'logic/engine/bossMechanicEntities.js',
    towers: 'logic/engine/debugTowerRuntime.js', levels: 'logic/engine/towerRules.js', wave: 'logic/engine/gameRules.js',defeat:'logic/engine/enemyDefeatRuntime.js',
  };
  return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, value]) => [key, await importer(value)])));
}

export function createScene(engine, { kind = 'density', bossId = 'TWINS', seed = 20261001, phaseSeconds = 12, offense = false, presentation = null, sourceAnchors = null, playerMotion = 'bounded-orbit', visualParticles = false } = {}) {
  const random = seededRandom(seed), state = engine.state.createRuntimeState();
  state.player.x = 160; state.player.y = 100; state.money = 100;
  const casts = [], hits = [], hazardOrigins=new WeakMap(), entityOrigins=new WeakMap(), hazardLifecycle=[], impactOrigins=new WeakMap(),statusOrigins=new WeakMap(),statusEvents=[]; let activeOrigin=null;
  const noop = () => {};
  // Optional declared QA callback mirrors normal hook particle DTOs; no extra effects are triggered.
  const spawnParticle=(x,y,color,count,speedBase=50,style=null)=>{if(!visualParticles)return;for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=Math.random()*speedBase+20;state.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,maxLife:.3+Math.random()*.3,color,...(style?{style}:{}),size:2+Math.random()*2})}};
  const statusFields=['shield','maxShield','armoredTimer','frozenTimer','slowTimer','slowRatio','jamTimer','speedBoostTimer','speedBuffTimer','damageTakenMultiplier','damageTakenTimer'];
  const statusProbe=()=>[state.player,...state.towers,...state.enemies].map(e=>({e,values:Object.fromEntries(statusFields.map(k=>[k,e[k]]))}));
  const recordStatus=(before,origin)=>{if(origin?.castIndex==null)return;for(const {e,values}of before)for(const field of statusFields)if(e[field]!==values[field]){let map=statusOrigins.get(e);if(!map){map=new Map();statusOrigins.set(e,map)}const record={origin:{...origin},field,before:values[field]??null,after:e[field]??null,time:state.gameTime,uid:e.uid??'player'};map.set(field,record);statusEvents.push(record)}};
  const spawnImpactWave=(x,y,options={})=>{const wave={x,y,radius:options.startRadius??6,maxRadius:options.maxRadius??54,growth:options.growth??220,life:options.life??.28,maxLife:options.life??.28,color:options.color??engine.config.COLORS.towerCannon,lineWidth:options.lineWidth??4,fillAlpha:options.fillAlpha??.12,dash:options.dash??[],spokes:options.spokes??0,spin:options.spin??0,style:options.style??null,accentColor:options.accentColor??options.color??engine.config.COLORS.towerCannon,secondaryColor:options.secondaryColor??'#fff',nodeCount:options.nodeCount??6,anchorA:options.anchorA??null,anchorB:options.anchorB??null,rotation:options.rotation??0};impactOrigins.set(wave,activeOrigin);state.impactWaves.push(wave)};
  let bosses = [];
  withRandom(random, () => {
    state.towers = engine.config.TOWER_ORDER.map((id, i) => {
      const template = state.towerCatalog.find(t => t.id === id);
      const tower = engine.levels.buildTowerAtLevel(template, i % 4);
      return engine.towers.createPlacedTower({ tower, uid: state.nextTowerUid++, x: -250 + (i % 5) * 105, y: 100 + Math.floor(i / 5) * 95 });
    });
    if (kind === 'density' || kind === 'catalog') {
      const keys = kind === 'catalog' ? Object.keys(engine.config.ENEMY_TYPES) : Array.from({ length: 24 }, (_, i) => i % 4 === 0 ? 'TANK' : 'BASIC');
      keys.forEach((enemyKey, i) => engine.spawn.spawnEnemyRuntimeAt({ state, enemyKey, x: -310 + (i % 8) * 82, y: -215 + Math.floor(i / 8) * 76, extras: { skipBurrowPosition: true } }));
      engine.offense.updateTowerOffenseRuntime({ state, dt: 3, spawnParticle });
      engine.offense.updatePlayerOffenseRuntime({ state, dt: 3 });
      state.towers.forEach((t, i) => { if (i % 2) t.hp = Math.max(1, Math.floor(t.maxHp * 0.6)); });
    } else if (kind === 'boss') {
      bosses = engine.spawn.spawnBossEncounterRuntimeAt({ state, bossTemplate: engine.encounter.getBossEditorBaseTemplate(bossId), x: -120, y: -90 });
      state.player.hp = 10000;
      state.towers.forEach(t => { t.hp = 10000; });
    } else throw new Error(`Unknown QA scene ${kind}`);
  });
  const spawnAround = (source, enemyKey, count, radius, options) => {const before=new Set(state.enemies);const result=engine.spawn.spawnEnemyGroupRuntime({ state, source, enemyKey, count, radius, options });const children=state.enemies.filter(e=>!before.has(e));for(const child of children)entityOrigins.set(child,{sourceUid:source.uid,sourceArtId:source.id,ability:source.bossState?.castAbility??activeOrigin?.ability??null,castIndex:activeOrigin?.castIndex??null,time:state.gameTime});presentation?.captureBirths(state,children,source);return result};
  const queueAreaHazard = (x, y, options) => {const h=engine.battlefield.createAreaHazard(state.player,x,y,options);hazardOrigins.set(h,activeOrigin??{castIndex:null,ability:null,reason:'unattributed outside cast'});state.hazards.push(h);return h};
  const queueLineHazard = (source, target, options) => {const h=engine.battlefield.createLineHazard(source,target,options);hazardOrigins.set(h,activeOrigin??{castIndex:null,ability:null,reason:'unattributed outside cast'});state.hazards.push(h);return h};
  const damageTarget = (target, amount) => { hits.push({ frameTime: state.gameTime, target: target === state.player ? 'player' : target.uid, amount }); target.hp -= amount; };
  const damageEnemy = (enemy, amount, projectile) => { hits.push({ frameTime: state.gameTime, enemy: enemy.uid, amount }); Object.assign(enemy, engine.rules.resolveEnemyDamage(enemy, amount));presentation?.captureHit(state,enemy,projectile); };
  const damageArea = (x, y, radius, amount) => {
    for (const target of [state.player, ...state.towers]) if (Math.hypot(target.x - x, target.y - y) <= radius + target.radius) damageTarget(target, amount);
  };
  const runAbility = (boss, abilityName) => {
    const combatants=()=>[...state.enemies.map(e=>({e,domain:e.isBoss?'boss':e.mechanic?'mechanic':'enemy'})),...state.towers.map(e=>({e,domain:'tower'})),{e:state.player,domain:'hero'}],scalars=e=>Object.fromEntries(Object.entries(e).filter(([k,v])=>['number','boolean','string'].includes(typeof v)));const beforeStatus=new Map(combatants().map(({e,domain})=>[domain+'/'+(e.uid??'player'),scalars(e)]));
    casts.push({ time: state.gameTime, uid: boss.uid, phase: boss.currentPhaseIndex, abilityName,eligibleNearby:state.enemies.filter(e=>e!==boss&&Math.hypot(e.x-boss.x,e.y-boss.y)<=160).map(e=>e.uid) });
    const priorOrigin=activeOrigin;activeOrigin={castIndex:casts.length-1,ability:abilityName,sourceUid:boss.uid};const beforeCastStatus=statusProbe(),beforeCastChildren=new Set(state.enemies);
    engine.ability.runBossOptimizedAbility({ state, boss, abilityName, spawnAround, queueAreaHazard, queueLineHazard, damageTarget, damageArea,
      spawnEnemyAt: (enemyKey,x,y,extras)=>{const entity=engine.spawn.spawnEnemyRuntimeAt({state,enemyKey,x,y,extras});if(entity){entityOrigins.set(entity,{...activeOrigin,time:state.gameTime});presentation?.captureBirths(state,[entity],boss)}return entity},
      getBossOwnership: engine.encounter.getBossOwnership,
      getEncounterPartner: source => bosses.find(b => b !== source && b.hp > 0), spawnImpactWave, spawnFloatingText: noop, syncHudMoney: noop });const newCastChildren=state.enemies.filter(e=>!beforeCastChildren.has(e));for(const child of newCastChildren)if(!entityOrigins.has(child))entityOrigins.set(child,{...activeOrigin,time:state.gameTime});presentation?.captureBirths(state,newCastChildren,boss);casts.at(-1).recipientChanges=combatants().map(({e,domain})=>({uid:e.uid??'player',domain,before:beforeStatus.get(domain+'/'+(e.uid??'player'))??null,after:scalars(e)})).filter(r=>JSON.stringify(r.before)!==JSON.stringify(r.after));recordStatus(beforeCastStatus,activeOrigin);activeOrigin=priorOrigin;
  };
  const step = dt => withRandom(random, () => {
    const beforeEnemies=new Set(state.enemies),beforeHazards=new Set(state.hazards);
    state.gameTime += dt;
    if (kind === 'boss') {
      const phaseIndex = Math.min(2, Math.floor(state.gameTime / phaseSeconds));
      for (const boss of bosses) {
        if(boss.hp<=0)continue; // Survivor probe never resurrects the fallen partner.
        const phase = boss.phases[Math.min(phaseIndex, boss.phases.length - 1)];
        boss.hp = boss.maxHp * (phaseIndex ? Math.max(0.05, phase.hpBelow - 0.02) : 1);
      }
    }
    engine.battlefield.tickPlayerControl(state.player, dt);
    const desired={x:160+80*Math.sin(state.gameTime*.7),y:100+55*Math.sin(state.gameTime*1.1)},speed=state.player.speed*(state.player.slowRatio??1);
    const dx=playerMotion==='bounded-orbit'?Math.max(-1,Math.min(1,(desired.x-state.player.x)/Math.max(.001,speed*dt))):Math.cos(state.gameTime*.6),dy=playerMotion==='bounded-orbit'?Math.max(-1,Math.min(1,(desired.y-state.player.y)/Math.max(.001,speed*dt))):Math.sin(state.gameTime*.6);
    engine.battlefield.movePlayerOnBattlefield({player:state.player,dx,dy,dt,enemies:state.enemies});
    for (const enemy of [...state.enemies]) {
      const mechanicBefore=presentation?.beginMechanicStep(state,enemy),beforeChildren=new Set(state.enemies);
      const previousOrigin=activeOrigin;activeOrigin=entityOrigins.get(enemy)??null;const beforeMechanicStatus=enemy.mechanic?statusProbe():null;
      engine.behavior.updateEnemyBehaviorRuntime({ state, enemy, dt, spawnAround, queueAreaHazard,
        updateBossBehavior: (boss, stepDt) => engine.combat.tickBossCombatRuntime({ state, boss, dt: stepDt, runAbility }),
        damageTarget, damageArea, spawnParticle, spawnImpactWave, syncHudHealth: noop });
      if(enemy.mechanic)presentation?.captureBirths(state,state.enemies.filter(e=>!beforeChildren.has(e)),enemy);
      presentation?.endMechanicStep(state,enemy,mechanicBefore,dt);if(beforeMechanicStatus)recordStatus(beforeMechanicStatus,activeOrigin);activeOrigin=previousOrigin;
    }
    if (offense) {
      const firstNew=state.projectiles.length,resolveProjectileOrigin=sourceAnchors?request=>presentation.resolveProjectileOrigin(state,request,sourceAnchors):undefined;
      engine.offense.updatePlayerOffenseRuntime({ state, dt,resolveProjectileOrigin });
      engine.offense.updateTowerOffenseRuntime({ state, dt, spawnParticle,resolveProjectileOrigin });
      presentation?.captureShots(state,firstNew);
      engine.frame.updateProjectileRuntime({ state, dt, damageEnemy, spawnFloatingText: noop, spawnParticle, spawnImpactWave });
    }
    const resolving=state.hazards.filter(h=>h.timer<=dt).map(h=>({h,pulsesRemaining:h.pulsesRemaining,timer:h.timer,radius:h.radius}));
    engine.frame.updateHazardRuntime({ state, dt, damageTarget, spawnImpactWave:(x,y,options)=>{const h=resolving.find(entry=>Math.hypot(entry.h.x-x,entry.h.y-y)<.001);const prior=activeOrigin;activeOrigin=h?hazardOrigins.get(h.h):null;spawnImpactWave(x,y,options);activeOrigin=prior}, syncHudHealth: noop });
    for(const before of resolving)hazardLifecycle.push({time:state.gameTime,origin:hazardOrigins.get(before.h)??null,label:before.h.label,type:before.h.type,beforeTimer:before.timer,afterTimer:before.h.timer,beforePulses:before.pulsesRemaining,afterPulses:before.h.pulsesRemaining,beforeRadius:before.radius,afterRadius:before.h.radius,ended:!state.hazards.includes(before.h)});
    presentation?.captureHazardPulses(state,resolving.map(entry=>entry.h));
    engine.frame.updateTransientVisualRuntime({state,dt});
    for(const child of state.enemies.filter(e=>!beforeEnemies.has(e))){if(!entityOrigins.has(child)){const castIndex=casts.findLastIndex(c=>c.uid===child.summonedByBossUid&&Math.abs(c.time-state.gameTime)<.00001);entityOrigins.set(child,{sourceUid:child.summonedByBossUid,ability:castIndex>=0?casts[castIndex].abilityName:null,castIndex,time:state.gameTime})}}
    presentation?.captureBirths(state,state.enemies.filter(e=>!beforeEnemies.has(e)));
    
    for (let index = state.enemies.length - 1; index >= 0; index--) {
      const enemy=state.enemies[index];if(enemy.hp>0)continue;
      const moneyBefore=state.money;
      const result=engine.defeat.settleEnemyDefeatRuntime({state,enemy,enemyIndex:index,spawnParticle,spawnAround,playBossDefeatCue:noop,syncHudMoney:noop,openBossReward:noop,enrageEncounterPartner:defeated=>{const partner=engine.combat.enrageTwinRuntime(state,defeated);if(partner)spawnImpactWave(partner.x,partner.y,{maxRadius:partner.radius+44,color:partner.color,fillAlpha:.14})}});
      presentation?.captureDefeat(state,enemy,result,moneyBefore);
    }
    return state;
  });
  return { state, step, random, casts, hits, bosses,hazardOrigins,entityOrigins,hazardLifecycle,impactOrigins,statusOrigins,statusEvents,applyQaProjectileHit:(uid,amount)=>{const enemy=state.enemies.find(e=>e.uid===uid);if(enemy)damageEnemy(enemy,amount,null)},
    provenance: { kind, bossId: kind === 'boss' ? bossId : null, seed, phaseSeconds, offense,
      playerMotion,scope: 'constructed QA fixture using real exported engine; boss phase probe forces HP, no claim of normal economy or full gameplay reachability' } };
}
