import { BOSS_TYPES } from '../../data/gameConfig';
import { WAVE_TABLE } from '../../data/waveTable';
import { dist } from './gameMath';

export const getSpawnPosition = (camera, viewportWidth, viewportHeight) => {
  const angle = Math.random() * Math.PI * 2;
  const spawnRadius = Math.max(viewportWidth, viewportHeight) / 2 + 100;

  return {
    x: camera.x + Math.cos(angle) * spawnRadius,
    y: camera.y + Math.sin(angle) * spawnRadius,
  };
};

export const canPlaceTower = (position, towerConfig, player, towers) => {
  const tooClosePlayer = dist(position, player) < towerConfig.radius + player.radius + 5;
  const tooCloseTower = towers.some((tower) => dist(position, tower) < towerConfig.radius + tower.radius + 5);

  return !tooClosePlayer && !tooCloseTower;
};

export const canPlaceTowerOnField = (position, towerConfig, player, towers, enemies) => {
  const blockedByEnemy = enemies.some((enemy) => dist(position, enemy) < towerConfig.radius + enemy.radius + 8);
  return canPlaceTower(position, towerConfig, player, towers) && !blockedByEnemy;
};

const interleaveGroups = (groups) => {
  const queue = [];
  const maxCount = Math.max(...groups.map((group) => group.count));

  for (let index = 0; index < maxCount; index += 1) {
    for (const group of groups) {
      if (index < group.count) {
        queue.push(group.type);
      }
    }
  }

  return queue;
};

const scaleGroupsForCycle = (groups, cycleNumber, waveNumber) =>
  groups.map((group) => ({
    ...group,
    count: group.count + cycleNumber * (group.type === 'BASIC' ? 4 : 2) + Math.floor(waveNumber / 24),
  }));

const scaleBossMember = (memberTemplate, hpScale, damageScale, waveNumber, value) => ({
  ...memberTemplate,
  enemyType: 'BOSS',
  hp: Math.round(memberTemplate.hp * hpScale),
  maxHp: Math.round(memberTemplate.hp * hpScale),
  damage: Math.round((memberTemplate.damage + waveNumber * 1.05) * damageScale),
  value,
  isBoss: true,
});

const scaleBossTemplate = (bossTemplate, hpScale, damageScale, waveNumber) => {
  const totalValue = bossTemplate.value + waveNumber * 6;
  if (!bossTemplate.encounter?.members?.length) {
    return {
      ...bossTemplate,
      enemyType: 'BOSS',
      hp: Math.round(bossTemplate.hp * hpScale),
      maxHp: Math.round(bossTemplate.hp * hpScale),
      damage: Math.round((bossTemplate.damage + waveNumber * 1.4) * damageScale),
      value: totalValue,
      isBoss: true,
    };
  }

  const members = bossTemplate.encounter.members;
  let remainingValue = totalValue;
  const scaledMembers = members.map((memberTemplate, index) => {
    const isLast = index === members.length - 1;
    const share = memberTemplate.valueShare ?? 1 / members.length;
    const memberValue = isLast ? remainingValue : Math.max(1, Math.round(totalValue * share));
    remainingValue -= memberValue;
    return scaleBossMember(memberTemplate, hpScale, damageScale, waveNumber, memberValue);
  });

  return {
    ...bossTemplate,
    enemyType: 'BOSS',
    hp: scaledMembers.reduce((sum, member) => sum + member.hp, 0),
    maxHp: scaledMembers.reduce((sum, member) => sum + member.maxHp, 0),
    damage: Math.max(...scaledMembers.map((member) => member.damage)),
    value: totalValue,
    isBoss: true,
    encounter: {
      ...bossTemplate.encounter,
      members: scaledMembers,
    },
  };
};

export const createWaveDefinition = (waveNumber) => {
  const recipe = WAVE_TABLE[(waveNumber - 1) % WAVE_TABLE.length];
  const cycleNumber = Math.floor((waveNumber - 1) / WAVE_TABLE.length);
  const groups = scaleGroupsForCycle(recipe.groups, cycleNumber, waveNumber);
  const bossTemplate = BOSS_TYPES[recipe.bossId];
  const hpScale = 1 + waveNumber * 0.07 + cycleNumber * 0.25;
  const damageScale = 1 + cycleNumber * 0.12;

  return {
    number: waveNumber,
    label: recipe.label,
    focus: recipe.focus,
    spawnInterval: Math.max(0.32, recipe.spawnInterval - cycleNumber * 0.04),
    queue: interleaveGroups(groups),
    boss: scaleBossTemplate(bossTemplate, hpScale, damageScale, waveNumber),
  };
};

export const findNearestTarget = (source, candidates, maxRange) => {
  let nearestDistance = maxRange;
  let target = null;

  for (const candidate of candidates) {
    const distance = dist(source, candidate);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      target = candidate;
    }
  }

  return target;
};
