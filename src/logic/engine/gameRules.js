import { BOSS_TYPES } from '../../data/gameConfig';
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

const WAVE_RECIPES = [
  { bossId: 'COMMANDER', spawnInterval: 0.95, label: '阵线试压', focus: '先学会稳住基础前线', groups: [{ type: 'BASIC', count: 9 }] },
  { bossId: 'HUNTER', spawnInterval: 0.9, label: '追猎热身', focus: '开始要求边走边打', groups: [{ type: 'BASIC', count: 9 }, { type: 'FAST', count: 7 }] },
  { bossId: 'FORTRESS', spawnInterval: 0.86, label: '重装逼近', focus: '第一次正面承受慢压与厚血', groups: [{ type: 'BASIC', count: 10 }, { type: 'FAST', count: 4 }, { type: 'TANK', count: 3 }] },
  { bossId: 'PRISM', spawnInterval: 0.82, label: '镜线交错', focus: '学会离开交叉火线', groups: [{ type: 'BASIC', count: 11 }, { type: 'FAST', count: 4 }, { type: 'SHARD', count: 5 }] },
  { bossId: 'HIVE', spawnInterval: 0.78, label: '蜂巢扩张', focus: '开始处理会滚场面的召唤单位', groups: [{ type: 'BASIC', count: 10 }, { type: 'TANK', count: 2 }, { type: 'BEACON', count: 3 }, { type: 'SHIELD', count: 2 }] },
  { bossId: 'FROST_JUDGE', spawnInterval: 0.74, label: '冰审封场', focus: '减速区会放大失误成本', groups: [{ type: 'BASIC', count: 10 }, { type: 'FAST', count: 5 }, { type: 'BOMBER', count: 3 }, { type: 'SHIELD', count: 2 }] },
  { bossId: 'RAIL_WARLORD', spawnInterval: 0.7, label: '狙线压制', focus: '开始惩罚抱团塔阵', groups: [{ type: 'BASIC', count: 8 }, { type: 'TANK', count: 3 }, { type: 'SHARD', count: 4 }, { type: 'SIEGE', count: 2 }] },
  { bossId: 'COLLECTOR', spawnInterval: 0.66, label: '催债搜刮', focus: '经济和站位会一起承压', groups: [{ type: 'BASIC', count: 8 }, { type: 'FAST', count: 6 }, { type: 'SCOUT', count: 4 }, { type: 'JAMMER', count: 2 }, { type: 'SHIELD', count: 2 }] },
  { bossId: 'TWINS', spawnInterval: 0.63, label: '日月夹击', focus: '第一次处理双体协同 boss', groups: [{ type: 'BASIC', count: 8 }, { type: 'SHARD', count: 4 }, { type: 'SCOUT', count: 5 }, { type: 'PHASE', count: 5 }] },
  { bossId: 'DRAGON', spawnInterval: 0.6, label: '掠空扫场', focus: '持续横移比站桩输出更重要', groups: [{ type: 'BASIC', count: 7 }, { type: 'FAST', count: 4 }, { type: 'TANK', count: 2 }, { type: 'BOMBER', count: 5 }, { type: 'SCOUT', count: 5 }] },
  { bossId: 'SPIDER_MATRIARCH', spawnInterval: 0.57, label: '网域围猎', focus: '优先剪断包围网再保塔阵', groups: [{ type: 'BASIC', count: 7 }, { type: 'SHARD', count: 5 }, { type: 'MEDIC', count: 2 }, { type: 'BURROWER', count: 4 }] },
  { bossId: 'ASTROLABE', spawnInterval: 0.54, label: '轨道偏折', focus: '开始预留脱离中心线的空间', groups: [{ type: 'BASIC', count: 7 }, { type: 'SHIELD', count: 3 }, { type: 'JAMMER', count: 4 }, { type: 'PHASE', count: 5 }] },
  { bossId: 'BLOOD_FORGE', spawnInterval: 0.51, label: '献炉过热', focus: '不能放任本体和随从一起滚强度', groups: [{ type: 'BASIC', count: 6 }, { type: 'TANK', count: 4 }, { type: 'BOMBER', count: 4 }, { type: 'SIEGE', count: 3 }, { type: 'SHIELD', count: 2 }] },
  { bossId: 'VOID_CONDUCTOR', spawnInterval: 0.48, label: '切分终章', focus: '把连续预兆当节奏记下来', groups: [{ type: 'BASIC', count: 5 }, { type: 'FAST', count: 7 }, { type: 'SCOUT', count: 4 }, { type: 'JAMMER', count: 3 }, { type: 'PHASE', count: 6 }] },
  { bossId: 'LABYRINTH_KEEPER', spawnInterval: 0.45, label: '换门迷宫', focus: '始终给自己保留横向逃生线', groups: [{ type: 'BASIC', count: 5 }, { type: 'SHIELD', count: 5 }, { type: 'BURROWER', count: 4 }, { type: 'SIEGE', count: 4 }] },
  { bossId: 'NIGHTMARE_BLOOM', spawnInterval: 0.42, label: '梦魇花园', focus: '污染扩散会把拖战变成慢性死亡', groups: [{ type: 'BASIC', count: 5 }, { type: 'SHARD', count: 6 }, { type: 'MEDIC', count: 4 }, { type: 'BEACON', count: 3 }, { type: 'PHASE', count: 4 }] },
];

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
  const recipe = WAVE_RECIPES[(waveNumber - 1) % WAVE_RECIPES.length];
  const cycleNumber = Math.floor((waveNumber - 1) / WAVE_RECIPES.length);
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
