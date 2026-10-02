// All timing is in seconds. Profiles define readable attack and counterattack windows.
export const BOSS_COMBAT_PROFILES = {
  commander: { windup: 0.8, recovery: 1.2, opening: 1.25 },
  hunter: { windup: 0.8, recovery: 1.35, opening: 1.4 },
  fortress: { windup: 1, recovery: 1.8, opening: 1.6 },
  prism: { windup: 0.85, recovery: 1.1, opening: 1.2 },
  hive: { windup: 0.8, recovery: 1.1, opening: 1.2 },
  frost: { windup: 0.9, recovery: 1.2, opening: 1.25 },
  rail: { windup: 1, recovery: 1.45, opening: 1.35 },
  collector: { windup: 1, recovery: 1.1, opening: 1.2 },
  twinSun: { windup: 0.8, recovery: 1.2, opening: 1.35 },
  twinMoon: { windup: 0.9, recovery: 1.2, opening: 1.35 },
  dragon: { windup: 1, recovery: 1.6, opening: 1.45 },
  spider: { windup: 0.85, recovery: 1.1, opening: 1.25 },
  astrolabe: { windup: 1.1, recovery: 1.5, opening: 1.35 },
  forge: { windup: 1.2, recovery: 1.6, opening: 1.5 },
  conductor: { windup: 0.75, recovery: 0.75, opening: 1.25, beat: 0.75 },
  labyrinth: { windup: 1, recovery: 1.3, opening: 1.25 },
  bloom: { windup: 0.95, recovery: 1.3, opening: 1.25 },
};

export const BOSS_LIMITS = {
  summonedUnits: 24,
  mechanicsPerBoss: 10,
  nests: 4,
  webs: 6,
  roots: 5,
  walls: 8,
  couriers: 3,
  minPlayerSlow: 0.65,
  maxPlayerSlowDuration: 2,
  controlGrace: 1,
};

export const BOSS_ACTION_LABELS = { idle: '准备', windup: '蓄力 · 准备闪避', attack: '攻击 · 避开危险区', recover: '恢复 · 输出窗口', intro: '阶段切换' };

export const MECHANIC_LABELS = { nest: '孵化巢', web: '蛛网结点', root: '污染根', wall: '可破坏墙', seal: '冰封印', reticle: '磁轨锁标', courier: '赎金搬运者' };
