import { ART_SCHEMA_VERSION, clamp01, finite, freezeArtDto, getActorDomain, getArtIdentity } from '../contracts.js';

const eventLife = { shot: 0.12, hit: 0.18, defeat: 0.24, 'summon-success': 0.32, 'split-success': 0.32, refund: 0.5 };
const copyPoint = entity => ({ x: finite(entity.x), y: finite(entity.y) });
const facingFor = angle => Math.sin(angle)<-.7?'up':Math.sin(angle)>.7?'down':Math.cos(angle)<0?'left':'right';

// This object is owned by the view. Nothing is attached to a simulation entity.
export const createPresentationRuntime = ({ getTowerFireRateFactor } = {}) => {
  let epoch = 0, currentState = null, nextObjectId = 1, nextEventId = 1;
  let objectIds = new WeakMap(), observedBirths = new WeakSet(), poses = new Map(), shots = new Map();
  let triggers = new Map(), retirements = new Map(), killedByHit = new WeakSet(), resolvedMechanics = new WeakSet();
  let events = [], errors = [], lastFrameTime = 0, lastActors = [], lastRetired = [];
  const reset = state => {
    epoch += 1; currentState = state; nextObjectId = 1; nextEventId = 1;
    objectIds = new WeakMap(); observedBirths = new WeakSet(); poses = new Map(); shots = new Map();
    triggers = new Map(); retirements = new Map(); killedByHit = new WeakSet(); resolvedMechanics = new WeakSet();
    events = []; lastActors = []; lastRetired = []; lastFrameTime = state?.gameTime ?? 0;
  };
  const ensure = state => { if (currentState !== state) reset(state); };
  const keyFor = (entity, domain = 'enemy') => `${epoch}/${getActorDomain(entity, domain)}/${domain === 'hero' ? 'player' : entity.uid}`;
  const objectKey = (object, kind) => {
    if (!objectIds.has(object)) objectIds.set(object, nextObjectId++);
    return `${epoch}/${kind}/${objectIds.get(object)}`;
  };
  const emit = (state, type, data) => {
    ensure(state);
    events.push({ ...data, eventId: `${epoch}/event/${nextEventId++}`, epoch, time: state.gameTime, type });
    // Feedback is bounded independently of gameplay collections.
    if (events.length > 512) events.splice(0, events.length - 512);
  };
  const report = error => {
    const message = String(error?.message ?? error);
    if (!errors.includes(message) && errors.length < 16) errors.push(message);
  };
  const safe = callback => (...args) => { try { return callback(...args); } catch (error) { report(error); return undefined; } };

  const captureShots = safe((state, firstNewIndex) => {
    ensure(state);
    const directions = new Map(), sourceRegistrations=new Map();
    for (const projectile of state.projectiles.slice(firstNewIndex)) {
      if (!projectile.sourceArtId) continue;
      const sourceDomain = projectile.sourceArtId.startsWith('hero:') ? 'hero' : 'tower';
      const source = sourceDomain === 'hero' ? state.player : state.towers.find(tower => tower.uid === projectile.sourceUid);
      if (!source) continue;
      const sourceKey = keyFor(source, sourceDomain);
      sourceRegistrations.set(sourceKey,projectile.birthOrigin);
      const angle = Math.atan2(projectile.vy, projectile.vx);
      const direction = directions.get(sourceKey) ?? { x: 0, y: 0 };
      const bodyAngle=projectile.sourceAimAngle??angle;
      direction.x += Math.cos(bodyAngle); direction.y += Math.sin(bodyAngle); directions.set(sourceKey, direction);
      emit(state, 'shot', { sourceArtId: projectile.sourceArtId, sourceKey, position: copyPoint(projectile),
        angle, birthOrigin: projectile.birthOrigin ?? null, shotIndex: projectile.shotIndex, projectileKind: projectile.kind, projectileKey: objectKey(projectile, 'projectile') });
    }
    for (const [key, direction] of directions) shots.set(key, { time: state.gameTime, angle: Math.atan2(direction.y, direction.x),sourceAimExact:sourceRegistrations.get(key)?.sourceAimExact??false,sourceFacing:sourceRegistrations.get(key)?.sourceFacing });
  });
  const captureBirths = safe((state, children, source = null) => {
    ensure(state);
    for (const child of children) {
      if (!child || observedBirths.has(child) || child.hp <= 0) continue;
      observedBirths.add(child);
      if (source?.mechanic) triggers.set(keyFor(source), state.gameTime);
      emit(state, source?.deathSpawn && source.hp <= 0 ? 'split-success' : 'summon-success', {
        sourceKey: source ? keyFor(source) : null, sourceArtId: source ? getArtIdentity(source) : null,
        targetKey: keyFor(child), childKeys: [keyFor(child)], position: copyPoint(child), radius: child.radius,
      });
    }
  });
  const captureDefeat = safe((state, enemy, result, moneyBefore) => {
    ensure(state);
    if (!result?.defeated) return;
    const confirmedHit = killedByHit.has(enemy), triggered = resolvedMechanics.has(enemy);
    const actor = actorFor(state, enemy);
    const pose = enemy.mechanic ? triggered ? 'trigger' : confirmedHit ? 'broken' : 'neutral' : 'neutral';
    retirements.set(actor.key, { actor, time: state.gameTime, pose });
    if (!enemy.mechanic || confirmedHit) emit(state, 'defeat', { targetKey: keyFor(enemy), sourceArtId: getArtIdentity(enemy), position: copyPoint(enemy), radius: enemy.radius });
    if (enemy.mechanic?.kind === 'courier' && !enemy.mechanic.escaped && state.money > moneyBefore) {
      emit(state, 'refund', { targetKey: keyFor(enemy), position: copyPoint(enemy), amount: state.money - moneyBefore });
    }
  });
  // Copy scalar provenance at the confirmed callback; no mutable projectile or
  // collision reconstruction is handed to any drawing module.
  const captureHit = safe((state, enemy, projectile = null) => {
    ensure(state);
    if (enemy.hp <= 0) killedByHit.add(enemy);
    const sourceArtId = projectile?.sourceArtId ?? null;
    emit(state, 'hit', { targetKey: keyFor(enemy), position: copyPoint(enemy), sourceArtId,
      sourceKey: sourceArtId && projectile.sourceUid != null ? `${epoch}/${sourceArtId.startsWith('hero:') ? 'hero' : 'tower'}/${projectile.sourceUid}` : null,
      shotIndex: projectile?.shotIndex ?? 0, projectileKind: projectile?.kind ?? null,
      angle: projectile ? Math.atan2(projectile.vy, projectile.vx) : 0,
      projectileKey: projectile ? objectKey(projectile, 'projectile') : null });
  });
  const beginMechanicStep = safe((state, enemy) => {
    if (!enemy.mechanic) return null;
    const target = state.towers.find(tower => tower.uid === enemy.mechanic.targetUid && tower.hp > 0);
    return { hp: enemy.hp, life: enemy.mechanic.life, timer: enemy.mechanic.timer, hazardCount: state.hazards.length,
      targetAlive: Boolean(target), bossAlive: state.enemies.some(boss => boss.uid === enemy.summonedByBossUid && boss.isBoss && boss.hp > 0) };
  });
  const endMechanicStep = safe((state, enemy, before, dt) => {
    if (!before || !(before.hp > 0 && before.life > dt && before.timer <= dt && before.bossAlive)) return;
    const target = state.towers.find(tower => tower.uid === enemy.mechanic.targetUid && tower.hp > 0);
    const sealResolved = enemy.mechanic.kind === 'seal' && before.targetAlive && target && target.frozenTimer >= 1.6;
    const reticleResolved = enemy.mechanic.kind === 'reticle' && state.hazards.slice(before.hazardCount)
      .some(hazard => hazard.label === 'mark' && hazard.ownerBossUid === enemy.summonedByBossUid);
    if (enemy.hp <= 0 && (sealResolved || reticleResolved)) {
      resolvedMechanics.add(enemy); triggers.set(keyFor(enemy), state.gameTime);
    }
  });
  const captureHazardPulses = safe((state, resolvedHazards) => {
    for (const hazard of resolvedHazards) {
      const owner = state.enemies.find(enemy => enemy.uid === hazard.ownerMechanicUid && enemy.hp > 0);
      if (owner) triggers.set(keyFor(owner), state.gameTime);
    }
  });

  const actorFor = (state, entity, domain = 'enemy', transient = false) => {
    const actualDomain = getActorDomain(entity, domain), key = keyFor(entity, domain), time = state.gameTime;
    const previous = poses.get(key), shot = shots.get(key);
    const elapsed = previous ? time - previous.time : 0;
    const distance = previous ? Math.hypot(entity.x - previous.x, entity.y - previous.y) : 0;
    const movementSpeed = elapsed > 0 ? distance / elapsed : previous?.movementSpeed ?? 0;
    let angle = shot?.angle ?? previous?.angle ?? 0;
    if (actualDomain !== 'tower' && elapsed > 0 && distance > 0.01 && !(actualDomain === 'hero' && shot && time - shot.time <= 0.16)) angle = Math.atan2(entity.y - previous.y, entity.x - previous.x);
    const bs = entity.bossState, target = bs?.lockedTarget;
    if (bs?.actionMode === 'windup' && target) angle = Math.atan2(target.y - entity.y, target.x - entity.x);
    const recentShot = shot && time - shot.time <= 0.16;
    const triggeredAt = triggers.get(key);
    const recentTrigger = triggeredAt != null && time - triggeredAt <= 0.2;
    let pose = bs?.actionMode ?? (recentShot ? 'attack' : movementSpeed > 0.1 ? 'move' : 'neutral');
    if (pose === 'idle') pose = movementSpeed > 0.1 ? 'move' : 'neutral';
    if (entity.mechanic) pose = recentTrigger ? 'trigger' : 'neutral';
    const poseStart = previous?.pose === pose ? previous.poseStart : time;
    const behaviorEligible = entity.hp > 0 && !entity.mechanic && !entity.burrowed;
    const healAuraActive = Boolean(behaviorEligible && entity.healAura);
    const jamFactor = actualDomain === 'tower' && getTowerFireRateFactor ?
      getTowerFireRateFactor(state, { ...entity, frozenTimer: 0 }) : 1;
    const fuseActive = Boolean(behaviorEligible && entity.explode && Number.isFinite(entity.fuseTimer) && entity.fuseTimer > 0);
    if (!transient) poses.set(key, { x: entity.x, y: entity.y, time, angle, pose, poseStart, movementSpeed });
    return freezeArtDto({
      key, artId: getArtIdentity(entity, domain), domain: actualDomain,
      x: finite(entity.x), y: finite(entity.y), radius: finite(entity.radius, 12), referenceRadius: finite(entity.radius, 12),
      facing: (actualDomain==='tower'||recentShot)?shot?.sourceFacing??facingFor(angle):facingFor(angle), aimAngle: angle, sourceCandidateContinuousParts:entity.artContinuousCandidate===true, sourceAimExact:shot?.sourceAimExact??false, pose, poseTime: Math.max(0, time - poseStart),
      poseProgress: bs?.actionMode === 'windup' ? clamp01(1 - bs.actionTimer / Math.max(0.001, bs.windupDuration)) :
        recentShot ? clamp01((time - shot.time) / 0.16) : recentTrigger ? clamp01((time - triggeredAt) / 0.2) :
          pose === 'attack' ? clamp01((time - poseStart) / 0.18) : 0,
      movementSpeed, alpha: entity.phased ? 0.42 : entity.burrowed ? 0.25 : 1,
      level: entity.level ?? 0, hp: entity.hp, maxHp: entity.maxHp ?? entity.hp,
      shield: entity.shield ?? 0, maxShield: entity.maxShield ?? 0, hitFlash: entity.hitFlash ?? 0,
      states: { frozen: entity.frozenTimer > 0, slowed: entity.slowTimer > 0 && entity.slowRatio < 1,
        jammed: jamFactor > 1,
        phased: Boolean(entity.phased), burrowed: Boolean(entity.burrowed), armored: entity.armoredTimer > 0,
        open: (entity.damageTakenMultiplier ?? 1) > 1, partnerFallen: Boolean(bs?.partnerFallen) },
      healAura: entity.healAura ? { active: healAuraActive, range: entity.healAura.range, amount: entity.healAura.amount,
        eligibleTargetKeys: healAuraActive ? state.enemies.filter(other => other !== entity && other.hp > 0 && !other.isBoss && !other.mechanic &&
          Math.hypot(other.x - entity.x, other.y - entity.y) <= entity.healAura.range).map(other => keyFor(other)) : [] } : null,
      jamAura: entity.jamAura ? { active: entity.hp > 0, range: entity.jamAura.range, fireRateFactor: entity.jamAura.fireRateFactor } : null,
      fuse: entity.explode ? { active: fuseActive, remaining: entity.fuseTimer, duration: entity.explode.fuse, radius: entity.explode.radius } : null,
      boss: bs ? { phaseIndex: entity.currentPhaseIndex, phaseCount: entity.phases?.length ?? 0,
        castAbility: bs.castAbility, actionMode: bs.actionMode, actionTimer: bs.actionTimer,
        windupDuration: bs.windupDuration, phaseName: entity.phases?.[entity.currentPhaseIndex]?.name ?? '',
        phaseIntroTimer: bs.phaseIntroTimer ?? 0 } : null,
      mechanic: entity.mechanic ? { ...entity.mechanic,
        targetKey: entity.mechanic.targetUid != null ? `${epoch}/tower/${entity.mechanic.targetUid}` : null,
        parentKey: entity.mechanic.parentUid != null ? `${epoch}/mechanic/${entity.mechanic.parentUid}` : null } : null,
      presentationOffset: { x: 0, y: 0 },
    });
  };

  const prepare = (state, viewport, camera, paused = false) => {
    ensure(state);
    const time = state.gameTime;
    const frame = freezeArtDto({ schemaVersion: ART_SCHEMA_VERSION, epoch, time, dt: Math.max(0, time - lastFrameTime), paused,
      viewport: { ...viewport }, camera: { ...camera }, quality: 'full' });
    lastFrameTime = time;
    const entries = [ { entity: state.player, domain: 'hero' }, ...state.towers.map(entity => ({ entity, domain: 'tower' })),
      ...state.enemies.filter(entity => entity.hp > 0).map(entity => ({ entity, domain: 'enemy' })) ];
    const actors = entries.map(({ entity, domain }) => ({ actor: actorFor(state, entity, domain), entity }));
    const liveKeys = new Set(actors.map(entry => entry.actor.key));
    for (const key of poses.keys()) if (!liveKeys.has(key)) { poses.delete(key); shots.delete(key); triggers.delete(key); }
    const retired = [];
    for (const [key, entry] of retirements) {
      const progress = (time - entry.time) / 0.24;
      if (progress >= 1) { retirements.delete(key); continue; }
      retired.push(freezeArtDto({ ...entry.actor, pose: entry.pose, poseTime: time - entry.time,
        poseProgress: clamp01(progress), alpha: (1 - clamp01(progress)) * 0.7 }));
    }
    lastActors = actors.map(entry => entry.actor); lastRetired = retired;
    events = events.filter(event => time - event.time <= eventLife[event.type]);
    const items = [];
    for (const kind of ['projectile', 'drop', 'particle', 'impactWave']) {
      const collection = { projectile: state.projectiles, drop: state.drops, particle: state.particles, impactWave: state.impactWaves }[kind];
      for (const value of collection) {
        const { hitEnemies, ...data } = value;
        if (data.dash) data.dash = [...data.dash];
        items.push({ key: objectKey(value, kind), kind, ...copyPoint(value), radius: value.radius ?? value.size ?? 4,
          angle: Math.atan2(value.vy ?? 0, value.vx ?? 0), alpha: value.maxLife ? clamp01(value.life / value.maxLife) : 1,
          color: value.color, style: value.style, life: value.life, maxLife: value.maxLife,
          sourceArtId: value.sourceArtId ?? null, sourceKey: value.sourceUid == null ? null : `${epoch}/${value.sourceArtId?.startsWith('hero:') ? 'hero' : 'tower'}/${value.sourceUid}`,
          shotIndex: value.shotIndex ?? 0, data });
      }
    }
    for (const event of events) items.push({ key: event.eventId, kind: 'feedback', ...event.position, radius: event.radius ?? 8,
      angle: event.angle ?? 0, alpha: clamp01(1 - (time - event.time) / eventLife[event.type]),
      life: eventLife[event.type] - (time - event.time), maxLife: eventLife[event.type],
      sourceArtId: event.sourceArtId, sourceKey: event.sourceKey, shotIndex: event.shotIndex ?? 0, data: { ...event } });
    const enemyByUid = new Map(state.enemies.map(entity => [entity.uid, entity]));
    const towerByUid = new Map(state.towers.map(entity => [entity.uid, entity]));
    const links = [];
    const link = (from, to, type) => { if (to) links.push({ key: `${keyFor(from)}/${type}`, kind: 'link', x: from.x, y: from.y, x2: to.x, y2: to.y,
      alpha: 0.6, color: from.color, style: type === 'root' ? 'root' : 'target', data: { type, from: copyPoint(from), to: copyPoint(to) } }); };
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      const parent = enemyByUid.get(enemy.mechanic?.parentUid);
      if (parent?.hp > 0) link(enemy, parent, 'root');
      const target = towerByUid.get(enemy.mechanic?.targetUid);
      if (target?.hp > 0) link(enemy, target, enemy.mechanic.kind);
      if (enemy.bossState?.actionMode === 'windup') {
        link(enemy, enemy.bossState.lockedTarget, 'windup');
        if (enemy.bossState.castAbility === 'sacrificeMinions') for (const uid of enemy.bossState.sacrificeTargets ?? []) {
          const victim = enemyByUid.get(uid); if (victim?.hp > 0) link(enemy, victim, `sacrifice-${uid}`);
        }
      }
    }
    return { frame, actors, retired, items, links, hazards: state.hazards.map(hazard => ({ ...hazard,
      key: objectKey(hazard, 'hazard'), ownerKey: `${epoch}/boss/${hazard.ownerBossUid}`,
      ownerMechanicKey: hazard.ownerMechanicUid != null ? `${epoch}/mechanic/${hazard.ownerMechanicUid}` : null,
      mechanicKind: enemyByUid.get(hazard.ownerMechanicUid)?.mechanic?.kind ?? null })),
      actorForGhost: (entity, domain) => actorFor(state, entity, domain, true) };
  };
  const resolveProjectileOrigin=(state,request,getAnchors)=>{
    if(typeof getAnchors!=='function')return null;
    ensure(state);const domain=request.sourceArtId.startsWith('hero:')?'hero':'tower';
    const facing=request.sourceFacingOverride??facingFor(request.angle),exact=domain==='tower';
    let angle=request.angle;
    const sample=aim=>getAnchors({...actorFor(state,request.source,domain,true),pose:'attack',poseTime:0,poseProgress:0,facing,aimAngle:aim,sourceAimExact:exact},{time:state.gameTime})?.muzzles??[];
    let muzzles=sample(angle);
    if(!muzzles.length)return domain==='hero'?{x:request.source.x,y:request.source.y,kind:'logical-emitter',measurement:'source identity has no anatomical muzzle; unchanged independent centre emitter'}:null;
    if(exact&&request.target&&!request.acceptedBirthAim){
      const pivot=muzzles[0].launcherPivot,axis=muzzles[0].sourceBoreAxisAngle??muzzles[0].imageXAxisAngle;
      const aimM=muzzles.reduce((sum,p)=>({x:sum.x+p.x/muzzles.length,y:sum.y+p.y/muzzles.length}),{x:0,y:0});
      if(pivot&&Number.isFinite(axis)){
        const b=-(aimM.x-pivot.x)*Math.sin(axis)+(aimM.y-pivot.y)*Math.cos(axis);
        const tx=request.target.x-pivot.x,ty=request.target.y-pivot.y,r=Math.hypot(tx,ty);
        if(r>Math.abs(b)+.01){angle=Math.atan2(ty,tx)-Math.asin(b/r);muzzles=sample(angle)}
      }
    }
    const m=muzzles[request.shotIndex%muzzles.length];
    return{x:m.x,y:m.y,kind:'source-muzzle',imageXAxisAngle:m.imageXAxisAngle,sourceBoreAxisAngle:m.sourceBoreAxisAngle??m.imageXAxisAngle,sourceAimAngle:angle,sourceFacing:facing,sourceAimExact:exact,measurement:m.measurement};
  };
  return { reset, safe, resolveProjectileOrigin, captureShots, captureBirths, captureDefeat, captureHit, beginMechanicStep, endMechanicStep, captureHazardPulses, prepare,
    inspect: () => ({ epoch, events: events.map(event => ({ ...event })), actors: lastActors, retired: lastRetired, errors: [...errors], actorCacheSize: poses.size }) };
};
