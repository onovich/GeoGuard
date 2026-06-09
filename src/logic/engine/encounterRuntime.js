import { BOSS_TYPES, COLORS, ENEMY_TYPES } from '../../data/gameConfig.js';

export const splitEncounterValue = (totalValue, shares) => {
  let remaining = totalValue;
  return shares.map((share, index) => {
    const isLast = index === shares.length - 1;
    const value = isLast ? remaining : Math.max(1, Math.round(totalValue * share));
    remaining -= value;
    return value;
  });
};

export const createTwinsEncounterMembers = (bossTemplate) => {
  const [sunValue, moonValue] = splitEncounterValue(bossTemplate.value, [0.5, 0.5]);

  return [
    {
      id: 'TWIN_SOL',
      name: '曜子',
      form: 'twinSun',
      isBoss: true,
      enemyType: 'BOSS',
      hp: Math.round(bossTemplate.maxHp * 0.46),
      maxHp: Math.round(bossTemplate.maxHp * 0.46),
      speed: Math.round(bossTemplate.baseSpeed * 1.26),
      damage: Math.max(8, Math.round(bossTemplate.damage * 0.72)),
      radius: 24,
      color: COLORS.enemyBomber,
      value: sunValue,
      phases: [
        { name: '炽近', hpBelow: 1, abilities: ['solarDash'] },
        { name: '灼线', hpBelow: 0.68, abilities: ['solarDash', 'flareLance', 'twinCrossfire'] },
        { name: '日蚀', hpBelow: 0.34, abilities: ['solarDash', 'flareLance', 'twinCrossfire', 'eclipsePulse'] },
      ],
    },
    {
      id: 'TWIN_LUNA',
      name: '蚀子',
      form: 'twinMoon',
      isBoss: true,
      enemyType: 'BOSS',
      hp: Math.round(bossTemplate.maxHp * 0.54),
      maxHp: Math.round(bossTemplate.maxHp * 0.54),
      speed: Math.round(bossTemplate.baseSpeed * 0.92),
      damage: Math.max(7, Math.round(bossTemplate.damage * 0.62)),
      radius: 26,
      color: COLORS.enemyPhase,
      value: moonValue,
      phases: [
        { name: '月网', hpBelow: 1, abilities: ['lunarSnare'] },
        { name: '锁域', hpBelow: 0.68, abilities: ['lunarSnare', 'shadowArc', 'twinCrossfire'] },
        { name: '残月', hpBelow: 0.34, abilities: ['lunarSnare', 'shadowArc', 'twinCrossfire', 'eclipsePulse'] },
      ],
    },
  ];
};

export const getBossPhaseOverrides = (bossTemplate) => {
  if (bossTemplate.id === 'COMMANDER') {
    return [
      { name: '列阵', hpBelow: 1, abilities: ['summonFormation', 'commandLine'] },
      { name: '压阵', hpBelow: 0.6, abilities: ['summonFormation', 'commandLine', 'shieldPulse', 'phalanxAdvance'] },
      { name: '破阵', hpBelow: 0.3, abilities: ['summonFormation', 'shieldPulse', 'phalanxAdvance', 'commandRush'] },
    ];
  }
  if (bossTemplate.id === 'HUNTER') {
    return [
      { name: '试探', hpBelow: 1, abilities: ['dashAtPlayer', 'markPrey'] },
      { name: '围猎', hpBelow: 0.7, abilities: ['dashAtPlayer', 'markPrey', 'summonScouts', 'pincerRush'] },
      { name: '残猎', hpBelow: 0.35, abilities: ['dashAtPlayer', 'markPrey', 'pincerRush', 'afterimageBurst', 'feintStrike'] },
    ];
  }
  if (bossTemplate.id === 'FORTRESS') {
    return [
      { name: '推城', hpBelow: 1, abilities: ['summonSiege', 'bastionMortar'] },
      { name: '重甲', hpBelow: 0.5, abilities: ['summonSiege', 'bastionMortar', 'fortify', 'shockRam'] },
      { name: '崩垒', hpBelow: 0.2, abilities: ['summonSiege', 'fortify', 'shockRam', 'quake', 'bunkerRing'] },
    ];
  }
  if (bossTemplate.id === 'PRISM') {
    return [
      { name: '折光', hpBelow: 1, abilities: ['prismBeam', 'refractVolley'] },
      { name: '镜列', hpBelow: 0.66, abilities: ['prismBeam', 'refractVolley', 'mirrorSummon', 'prismLattice'] },
      { name: '棱镜', hpBelow: 0.33, abilities: ['prismBeam', 'mirrorSummon', 'prismLattice', 'tripleBeam', 'mirrorStep'] },
    ];
  }
  if (bossTemplate.id === 'HIVE') {
    return [
      { name: '铺巢', hpBelow: 1, abilities: ['spawnHive', 'broodShift'] },
      { name: '孵潮', hpBelow: 0.75, abilities: ['spawnHive', 'broodShift', 'hivePulse', 'summonSwarm'] },
      { name: '迁巢', hpBelow: 0.35, abilities: ['spawnHive', 'hivePulse', 'summonSwarm', 'hiveCollapse', 'broodShift'] },
    ];
  }
  if (bossTemplate.id === 'FROST_JUDGE') {
    return [
      { name: '冰审', hpBelow: 1, abilities: ['frostRing', 'whiteout'] },
      { name: '封判', hpBelow: 0.6, abilities: ['frostRing', 'whiteout', 'freezeTower', 'glacialPrison'] },
      { name: '寒狱', hpBelow: 0.25, abilities: ['frostRing', 'freezeTower', 'glacialPrison', 'summonFrostGuards', 'coldSnap'] },
    ];
  }
  if (bossTemplate.id === 'RAIL_WARLORD') {
    return [
      { name: '锁线', hpBelow: 1, abilities: ['railShot', 'crosshairBarrage'] },
      { name: '钉杀', hpBelow: 0.7, abilities: ['railShot', 'markTower', 'crosshairBarrage', 'suppressiveGrid'] },
      { name: '歼灭', hpBelow: 0.4, abilities: ['railShot', 'markTower', 'suppressiveGrid', 'overload', 'killLane'] },
    ];
  }
  if (bossTemplate.id === 'COLLECTOR') {
    return [
      { name: '抽税', hpBelow: 1, abilities: ['stealMoney', 'taxBeacon'] },
      { name: '搬运', hpBelow: 0.5, abilities: ['stealMoney', 'taxBeacon', 'summonScouts', 'paydaySweep'] },
      { name: '收账', hpBelow: 0.25, abilities: ['stealMoney', 'summonScouts', 'paydaySweep', 'ransomBurst', 'repossess'] },
    ];
  }
  if (bossTemplate.id === 'BLOOD_FORGE') {
    return [
      { name: '铸火', hpBelow: 1, abilities: ['forgeArmor', 'slagDrop'] },
      { name: '献炉', hpBelow: 0.58, abilities: ['forgeArmor', 'slagDrop', 'sacrificeMinions', 'brandLine'] },
      { name: '过热', hpBelow: 0.24, abilities: ['forgeArmor', 'sacrificeMinions', 'brandLine', 'moltenBurst', 'forgeDetonation'] },
    ];
  }
  if (bossTemplate.id === 'VOID_CONDUCTOR') {
    return [
      { name: '起拍', hpBelow: 1, abilities: ['conductLines', 'pulseMeasure'] },
      { name: '切分', hpBelow: 0.68, abilities: ['conductLines', 'pulseMeasure', 'tempoShift', 'syncopate'] },
      { name: '终章', hpBelow: 0.34, abilities: ['conductLines', 'tempoShift', 'syncopate', 'finale', 'crescendo'] },
    ];
  }
  if (bossTemplate.id === 'LABYRINTH_KEEPER') {
    return [
      { name: '筑墙', hpBelow: 1, abilities: ['raiseWalls', 'corridorClamp'] },
      { name: '换门', hpBelow: 0.65, abilities: ['raiseWalls', 'corridorClamp', 'gateSwap', 'mazeFold'] },
      { name: '迷狱', hpBelow: 0.3, abilities: ['raiseWalls', 'gateSwap', 'mazeFold', 'mazeCrush', 'deadEnd'] },
    ];
  }
  if (bossTemplate.id === 'NIGHTMARE_BLOOM') {
    return [
      { name: '播种', hpBelow: 1, abilities: ['seedPods', 'blightRoots'] },
      { name: '绽瘴', hpBelow: 0.68, abilities: ['seedPods', 'blightRoots', 'poisonBloom', 'sporeBurst'] },
      { name: '花园', hpBelow: 0.33, abilities: ['seedPods', 'poisonBloom', 'sporeBurst', 'gardenWake', 'creepingCanopy'] },
    ];
  }
  if (bossTemplate.id === 'DRAGON') {
    return [
      { name: '盘旋', hpBelow: 1, abilities: ['dragonStrafe', 'emberWake'] },
      { name: '俯冲', hpBelow: 0.66, abilities: ['dragonStrafe', 'emberWake', 'wingBuffet', 'meteorRain'] },
      { name: '天火', hpBelow: 0.3, abilities: ['dragonStrafe', 'wingBuffet', 'meteorRain', 'skyDive', 'infernoRing'] },
    ];
  }
  if (bossTemplate.id === 'SPIDER_MATRIARCH') {
    return [
      { name: '织杀', hpBelow: 1, abilities: ['webTrap', 'silkVolley'] },
      { name: '孵潮', hpBelow: 0.7, abilities: ['webTrap', 'silkVolley', 'spawnSpiderlings', 'broodAmbush'] },
      { name: '巢域', hpBelow: 0.35, abilities: ['webTrap', 'spawnSpiderlings', 'broodAmbush', 'nestBloom', 'webField'] },
    ];
  }
  if (bossTemplate.id === 'ASTROLABE') {
    return [
      { name: '引潮', hpBelow: 1, abilities: ['gravityWell', 'starfall'] },
      { name: '轨域', hpBelow: 0.62, abilities: ['gravityWell', 'orbitalShots', 'starfall', 'orbitalLock'] },
      { name: '奇点', hpBelow: 0.28, abilities: ['gravityWell', 'orbitalShots', 'orbitalLock', 'singularity', 'eventHorizon'] },
    ];
  }
  return bossTemplate.phases;
};

export const enrichBossTemplate = (bossTemplate) => ({
  ...bossTemplate,
  phases: getBossPhaseOverrides(bossTemplate),
});

export const getBossEditorBaseTemplate = (bossId) => {
  const bossTemplate = BOSS_TYPES[bossId];
  return bossTemplate ? enrichBossTemplate(bossTemplate) : null;
};

export const createEnemyRuntimeEntity = ({ enemyTemplate, uid }) => ({
  ...enemyTemplate,
  uid,
  hp: enemyTemplate.hp,
  maxHp: enemyTemplate.hp,
  baseSpeed: enemyTemplate.speed,
  shield: enemyTemplate.shield ?? 0,
  maxShield: enemyTemplate.shield ?? 0,
  slowTimer: 0,
  slowRatio: 1,
  hitFlash: 0,
  abilityTimer: 0,
  summonTimer: 0,
  phaseTimer: enemyTemplate.phase?.interval ?? 0,
  phased: false,
  burrowTimer: enemyTemplate.burrow ? enemyTemplate.burrow.duration : 0,
  burrowed: Boolean(enemyTemplate.burrow),
  fuseTimer: null,
  summonedByBossUid: null,
  summonedByEncounterUid: null,
  summonCategory: null,
});

export const createEnemyRuntimeEntityFromKey = ({ enemyKey, uid }) =>
  createEnemyRuntimeEntity({ enemyTemplate: ENEMY_TYPES[enemyKey], uid });

export const createBossRuntimeEntity = ({ bossTemplate, uid }) => {
  const enrichedBoss = bossTemplate.authoredTemplate ? bossTemplate : enrichBossTemplate(bossTemplate);
  return {
    ...enrichedBoss,
    uid,
    hp: enrichedBoss.hp,
    maxHp: enrichedBoss.maxHp ?? enrichedBoss.hp,
    baseSpeed: enrichedBoss.speed,
    shield: 0,
    maxShield: 0,
    slowTimer: 0,
    slowRatio: 1,
    hitFlash: 0,
    currentPhaseIndex: -1,
    abilityCooldowns: {},
    bossState: {},
    isDefeated: false,
  };
};

export const getBossOwnership = (boss) => ({
  ownerBossUid: boss.uid,
  ownerEncounterUid: boss.encounterUid ?? null,
});

export const createBossEncounterRuntime = ({ bossTemplate, x, y, allocateEnemyUid, allocateEncounterUid }) => {
  if (bossTemplate.id === 'TWINS') {
    const encounterUid = allocateEncounterUid();
    const memberTemplates = createTwinsEncounterMembers({
      ...bossTemplate,
      baseSpeed: bossTemplate.baseSpeed ?? bossTemplate.speed,
      maxHp: bossTemplate.maxHp ?? bossTemplate.hp,
    });
    const offsets = [-1, 1];
    return memberTemplates.map((memberTemplate, index) => {
      const boss = createBossRuntimeEntity({
        bossTemplate: {
          ...memberTemplate,
          encounterUid,
          encounterBossId: bossTemplate.id,
          encounterName: bossTemplate.name,
          twinRole: index === 0 ? 'sun' : 'moon',
        },
        uid: allocateEnemyUid(),
      });
      boss.x = x + offsets[index] * 54;
      boss.y = y + (index === 0 ? -18 : 18);
      return boss;
    });
  }

  const boss = createBossRuntimeEntity({
    bossTemplate: {
      ...bossTemplate,
      maxHp: bossTemplate.maxHp ?? bossTemplate.hp,
      isBoss: true,
      enemyType: 'BOSS',
    },
    uid: allocateEnemyUid(),
  });
  boss.x = x;
  boss.y = y;
  return [boss];
};
