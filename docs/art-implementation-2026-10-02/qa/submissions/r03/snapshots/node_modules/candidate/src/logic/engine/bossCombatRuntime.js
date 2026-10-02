import { BOSS_ACTION_LABELS, BOSS_COMBAT_PROFILES } from '../../data/bossMechanics.js';
import { getPhaseBehaviorNodes } from './bossAuthoringRules.js';
import { dist } from './gameMath.js';

export const getBossCombatProfile = (boss) => BOSS_COMBAT_PROFILES[boss.form] ?? BOSS_COMBAT_PROFILES.commander;

const lockTarget = (state, boss) => {
  // A rail shot can be lured off the tower line by approaching the sniper.
  if (boss.form === 'rail' && dist(boss, state.player) <= 600) return state.player;
  return [state.player, ...state.towers.filter((tower) => tower.hp > 0)]
    .reduce((nearest, candidate) => dist(boss, candidate) < dist(boss, nearest) ? candidate : nearest, state.player);
};

const snapshot = (entity) => ({ x: entity.x, y: entity.y, radius: entity.radius, uid: entity.uid });

export const updateBossDefenseRuntime = (state, boss) => {
  const runtime = boss.bossState;
  const profile = getBossCombatProfile(boss);
  boss.damageTakenMultiplier = runtime.actionMode === 'recover' ? profile.opening : 1;
  if (boss.form === 'fortress' && runtime.actionMode !== 'recover') boss.damageTakenMultiplier = 0.8;
  if (boss.form !== 'commander') return;
  const guards = state.enemies.filter((enemy) => !enemy.isBoss && !enemy.mechanic && enemy.hp > 0 && enemy.summonedByBossUid === boss.uid);
  runtime.guardCount = guards.length;
  if (guards.length >= 2) boss.damageTakenMultiplier *= 0.7;
};

export const enrageTwinRuntime = (state, defeatedBoss) => {
  const partner = state.enemies.find((enemy) => enemy.isBoss && enemy.hp > 0 && enemy.uid !== defeatedBoss.uid && enemy.encounterUid === defeatedBoss.encounterUid);
  if (!partner || partner.bossState.partnerFallen) return null;
  partner.bossState.partnerFallen = true;
  partner.baseSpeed *= 1.12;
  partner.shield = Math.max(partner.shield ?? 0, 40);
  partner.maxShield = Math.max(partner.maxShield ?? 0, partner.shield);
  const soloAbility = partner.twinRole === 'sun' ? 'soloSolarVolley' : 'soloLunarOrbit';
  partner.phases = partner.phases.map((phase) => ({ ...phase,
    abilities: [...phase.abilities.filter((ability) => ability !== 'twinCrossfire'), soloAbility],
    behaviorNodes: undefined,
  }));
  partner.bossState.actionMode = 'recover';
  partner.bossState.actionTimer = 1.4;
  return partner;
};

export const tickBossCombatRuntime = ({ state, boss, dt, runAbility = () => {}, onPhaseShift = () => {} }) => {
  if (boss.hp <= 0 || !boss.phases?.length) return { type: 'inactive' };
  const runtime = boss.bossState;
  runtime.combatClockManaged = true;
  runtime.combatTime = (runtime.combatTime ?? 0) + dt;
  let phaseIndex = Math.max(0, boss.currentPhaseIndex ?? 0);
  boss.phases.forEach((phase, index) => {
    if (boss.hp / boss.maxHp <= phase.hpBelow) phaseIndex = Math.max(phaseIndex, index);
  });
  phaseIndex = Math.min(phaseIndex, boss.phases.length - 1);
  const previousPhaseIndex = boss.currentPhaseIndex;
  if (previousPhaseIndex !== phaseIndex) {
    boss.currentPhaseIndex = phaseIndex;
    runtime.actionMode = 'intro';
    runtime.phaseIntroTimer = 1.15;
    runtime.actionTimer = 0;
    runtime.castAbility = null;
    onPhaseShift({ boss, activePhase: boss.phases[phaseIndex], activePhaseIndex: phaseIndex, previousPhaseIndex });
  }
  runtime.phaseIntroTimer = Math.max(0, (runtime.phaseIntroTimer ?? 0) - dt);
  updateBossDefenseRuntime(state, boss);
  if (runtime.phaseIntroTimer > 0) return { type: 'intro' };
  if (runtime.actionMode === 'intro') runtime.actionMode = 'idle';

  const profile = getBossCombatProfile(boss);
  const hasLiveAttack = () => state.hazards.some((hazard) => !hazard.terrain &&
    (hazard.ownerBossUid === boss.uid || (boss.encounterUid && hazard.ownerEncounterUid === boss.encounterUid))) ||
    state.enemies.some((enemy) => enemy.hp > 0 && enemy.mechanic?.kind === 'reticle' && enemy.summonedByBossUid === boss.uid);
  const nodes = getPhaseBehaviorNodes(boss.phases[phaseIndex], phaseIndex).filter((node) => node.enabled);
  for (const [index, node] of nodes.entries()) {
    boss.abilityCooldowns[node.abilityId] = Math.max(0, (boss.abilityCooldowns[node.abilityId] ?? (0.3 + index * 0.6)) - dt);
  }

  if (runtime.actionMode === 'windup') {
    runtime.actionTimer = Math.max(0, runtime.actionTimer - dt);
    if (runtime.actionTimer > 0) return { type: 'windup' };
    const ability = runtime.castAbility;
    runAbility(boss, ability);
    const node = nodes.find((entry) => entry.abilityId === ability);
    boss.abilityCooldowns[ability] = node?.cooldown ?? 7;
    runtime.actionMode = hasLiveAttack() || boss.dashTimer > 0 ? 'attack' : 'recover';
    runtime.actionTimer = profile.recovery;
    updateBossDefenseRuntime(state, boss);
    return { type: 'execute', ability };
  }
  if (runtime.actionMode === 'attack') {
    if (hasLiveAttack() || boss.dashTimer > 0) return { type: 'attack' };
    runtime.actionMode = 'recover';
    runtime.actionTimer = profile.recovery;
    updateBossDefenseRuntime(state, boss);
    return { type: 'recover' };
  }
  if (runtime.actionMode === 'recover') {
    runtime.actionTimer = Math.max(0, runtime.actionTimer - dt);
    if (runtime.actionTimer > 0) return { type: 'recover' };
    runtime.actionMode = 'idle';
    updateBossDefenseRuntime(state, boss);
  }

  const partnerCasting = boss.encounterUid && state.enemies.some((enemy) => enemy.isBoss && enemy.uid !== boss.uid &&
    enemy.encounterUid === boss.encounterUid && enemy.bossState.actionMode === 'windup');
  if (hasLiveAttack() || partnerCasting) return { type: 'wait' };

  // The conductor starts phrases on a shared beat instead of independent random bursts.
  const beat = profile.beat ? Math.max(0.55, profile.beat - phaseIndex * 0.1) : 0;
  if (beat && runtime.combatTime < (runtime.nextBeat ?? 0)) return { type: 'wait-beat' };
  const cursor = runtime.abilityCursor ?? 0;
  for (let offset = 0; offset < nodes.length; offset++) {
    const index = (cursor + offset) % nodes.length;
    const node = nodes[index];
    if (boss.abilityCooldowns[node.abilityId] > 0) continue;
    runtime.abilityCursor = (index + 1) % nodes.length;
    runtime.castAbility = node.abilityId;
    runtime.lockedTarget = snapshot(lockTarget(state, boss));
    runtime.lockedPlayerPoint = snapshot(state.player);
    runtime.castOrigin = snapshot(boss);
    if (node.abilityId === 'sacrificeMinions') {
      runtime.sacrificeTargets = state.enemies.filter((enemy) => !enemy.isBoss && !enemy.mechanic && enemy.hp > 0 && dist(enemy, boss) <= 180)
        .slice(0, 4).map((enemy) => enemy.uid);
    }
    runtime.actionMode = 'windup';
    runtime.actionTimer = beat || profile.windup;
    runtime.windupDuration = runtime.actionTimer;
    if (beat) runtime.nextBeat = Math.ceil((runtime.combatTime + runtime.actionTimer + profile.recovery) / beat) * beat;
    return { type: 'start-windup', ability: node.abilityId };
  }
  return { type: 'idle' };
};

export const getBossActionLabel = (boss) => BOSS_ACTION_LABELS[boss.bossState?.actionMode ?? 'idle'];
