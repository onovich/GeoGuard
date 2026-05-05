export const COLORS = {
  bg: '#f0f4f8',
  grid: '#e2e8f0',
  player: '#4a90e2',
  playerStroke: '#357abd',
  enemyBasic: '#e74c3c',
  enemyFast: '#f39c12',
  enemyTank: '#8e44ad',
  gem: '#2ecc71',
  towerBase: '#bdc3c7',
  towerBasic: '#3498db',
  towerCannon: '#e67e22',
  towerSniper: '#9b59b6',
  towerRapid: '#16a085',
  towerMortar: '#d35400',
  towerFrost: '#5dade2',
  towerRail: '#7d3c98',
  towerBurst: '#c0392b',
  towerSentinel: '#117864',
  projectile: '#f1c40f',
  particle: '#ecf0f1',
  text: '#2c3e50',
  success: '#2ecc71',
  danger: '#e74c3c',
  boss: '#1f2937',
  uiBg: 'rgba(255, 255, 255, 0.85)',
};

export const TOWER_LIBRARY = {
  BASIC: { id: 'BASIC', name: '速射塔', summary: '稳定对单火力。', cost: 15, color: COLORS.towerBasic, radius: 14, range: 180, fireRate: 0.3, damage: 6, hp: 50, shape: 'circle' },
  CANNON: { id: 'CANNON', name: '榴弹炮', summary: '范围爆炸，清理怪群。', cost: 40, color: COLORS.towerCannon, radius: 16, range: 140, fireRate: 1.5, damage: 15, splash: 60, hp: 80, shape: 'square' },
  SNIPER: { id: 'SNIPER', name: '穿透塔', summary: '高伤穿透，专打后排。', cost: 80, color: COLORS.towerSniper, radius: 14, range: 350, fireRate: 2, damage: 35, pierce: 3, hp: 40, shape: 'triangle' },
  RAPID: { id: 'RAPID', name: '链锯塔', summary: '极高射速，适合近距压制。', cost: 28, color: COLORS.towerRapid, radius: 13, range: 155, fireRate: 0.12, damage: 3, hp: 42, shape: 'circle', projectileSpeed: 560 },
  MORTAR: { id: 'MORTAR', name: '迫击塔', summary: '超大范围爆炸，但装填缓慢。', cost: 72, color: COLORS.towerMortar, radius: 18, range: 260, fireRate: 2.3, damage: 24, splash: 92, hp: 68, shape: 'square', projectileSpeed: 420 },
  FROST: { id: 'FROST', name: '霜冻塔', summary: '造成减速，帮助阵线控场。', cost: 55, color: COLORS.towerFrost, radius: 15, range: 190, fireRate: 0.85, damage: 7, hp: 74, shape: 'square', slowRatio: 0.55, slowDuration: 1.4 },
  RAIL: { id: 'RAIL', name: '磁轨塔', summary: '超长射程和高穿透。', cost: 98, color: COLORS.towerRail, radius: 14, range: 430, fireRate: 1.65, damage: 26, pierce: 5, hp: 38, shape: 'triangle', projectileSpeed: 700 },
  BURST: { id: 'BURST', name: '散射塔', summary: '扇形连射，近距压制。', cost: 66, color: COLORS.towerBurst, radius: 16, range: 165, fireRate: 0.95, damage: 8, hp: 64, shape: 'triangle', burstCount: 4, spread: 0.18, projectileSpeed: 460 },
  SENTINEL: { id: 'SENTINEL', name: '哨戒塔', summary: '耐久更高，适合前线。', cost: 52, color: COLORS.towerSentinel, radius: 17, range: 175, fireRate: 0.55, damage: 11, hp: 108, shape: 'circle', projectileSpeed: 520 },
};

export const STARTING_TOWER_IDS = ['BASIC', 'CANNON', 'SNIPER'];

export const TOWER_ORDER = ['BASIC', 'CANNON', 'SNIPER', 'RAPID', 'MORTAR', 'FROST', 'RAIL', 'BURST', 'SENTINEL'];

export const createInitialTowerCatalog = () =>
  TOWER_ORDER.map((towerId, index) => ({
    ...TOWER_LIBRARY[towerId],
    available: STARTING_TOWER_IDS.includes(towerId),
    level: 0,
    maxLevel: 3,
    sortOrder: index,
  }));

export const ENEMY_TYPES = {
  BASIC: { id: 'BASIC', name: '方阵兵', color: COLORS.enemyBasic, hp: 20, speed: 100, damage: 5, radius: 10, value: 1 },
  FAST: { id: 'FAST', name: '疾袭兵', color: COLORS.enemyFast, hp: 15, speed: 180, damage: 3, radius: 8, value: 2 },
  TANK: { id: 'TANK', name: '重装兵', color: COLORS.enemyTank, hp: 80, speed: 60, damage: 15, radius: 16, value: 5 },
};

export const UI_COPY = {
  startTitle: '吸血鬼塔防',
  gameOverTitle: '防线崩溃',
  startDescription: '移动角色自动射击。收集水晶，在地图上布置你的防御塔阵地。',
  controlsPc: '电脑：WASD/方向键移动，从底部拖拽塔卡到场地里建造。',
  controlsMobile: '手机：左侧屏幕拖动摇杆移动，从底部拖拽塔卡到场地里建造。',
  introBanner: '生存并建立你的防线',
  invalidPlacement: '位置无效',
  insufficientFunds: '资金不足',
  buildHint: '拖到场地里建造',
  waveIncoming: '波次来袭',
  bossIncoming: 'Boss 出现',
  rewardTitle: 'Boss 已击破',
  rewardSubtitle: '选择一项强化，下一波即将开始。',
};