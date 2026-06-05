import { dist, rand } from './gameMath.js';

export const getBossOwnedSummonCount = (enemies, bossUid, summonCategory) =>
  enemies.filter((enemy) => enemy.summonedByBossUid === bossUid && (!summonCategory || enemy.summonCategory === summonCategory)).length;

export const getBossSummonSpawnCount = ({ enemies, bossUid, summonCategory, requestedCount, maxActive }) => {
  if (!bossUid || !maxActive) {
    return requestedCount;
  }

  const activeCount = getBossOwnedSummonCount(enemies, bossUid, summonCategory);
  return Math.max(0, Math.min(requestedCount, maxActive - activeCount));
};

export const hasPendingBossAftermath = (enemies, hazards, bossUid) =>
  enemies.some((enemy) => enemy.summonedByBossUid === bossUid) ||
  hazards.some((hazard) => hazard.ownerBossUid === bossUid);

export const hasPendingEncounterAftermath = (enemies, hazards, encounterUid) =>
  enemies.some((enemy) => enemy.encounterUid === encounterUid || enemy.summonedByEncounterUid === encounterUid) ||
  hazards.some((hazard) => hazard.ownerEncounterUid === encounterUid);

export const getBossRewardResolution = ({ boss, enemies, hazards }) => {
  if (boss.encounterUid) {
    const hasLivingEncounterBoss = enemies.some((candidate) => candidate.isBoss && candidate.encounterUid === boss.encounterUid);
    if (hasLivingEncounterBoss) {
      return { action: 'enrage-partner', encounterUid: boss.encounterUid };
    }
    if (hasPendingEncounterAftermath(enemies, hazards, boss.encounterUid)) {
      return { action: 'await-encounter-aftermath', encounterUid: boss.encounterUid };
    }
    return { action: 'open-reward' };
  }

  if (hasPendingBossAftermath(enemies, hazards, boss.uid)) {
    return { action: 'await-boss-aftermath', bossUid: boss.uid };
  }

  return { action: 'open-reward' };
};

export const findOpenEnemySpawnPosition = ({
  source,
  enemyTemplate,
  blockers,
  baseRadius = 46,
  randomAngleOffset = Math.random,
  randomJitter = rand,
}) => {
  for (let ring = 0; ring < 4; ring += 1) {
    const ringRadius = baseRadius + ring * (enemyTemplate.radius + 18);
    const samples = 10 + ring * 4;
    for (let index = 0; index < samples; index += 1) {
      const angle = (Math.PI * 2 * index) / samples + randomAngleOffset() * 0.18;
      const candidate = {
        x: source.x + Math.cos(angle) * ringRadius,
        y: source.y + Math.sin(angle) * ringRadius,
      };
      const overlaps = blockers.some((blocker) => dist(candidate, blocker) < enemyTemplate.radius + (blocker.radius ?? 12) + 10);
      if (!overlaps) {
        return candidate;
      }
    }
  }

  return {
    x: source.x + randomJitter(-18, 18),
    y: source.y + randomJitter(-18, 18),
  };
};
