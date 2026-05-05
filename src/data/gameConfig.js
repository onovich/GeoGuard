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
  projectile: '#f1c40f',
  particle: '#ecf0f1',
  text: '#2c3e50',
  uiBg: 'rgba(255, 255, 255, 0.85)',
};

export const TOWER_TYPES = {
  BASIC: { id: 'BASIC', name: '速射塔', cost: 15, color: COLORS.towerBasic, radius: 14, range: 180, fireRate: 0.3, damage: 6, hp: 50, shape: 'circle' },
  CANNON: { id: 'CANNON', name: '榴弹炮', cost: 40, color: COLORS.towerCannon, radius: 16, range: 140, fireRate: 1.5, damage: 15, splash: 60, hp: 80, shape: 'square' },
  SNIPER: { id: 'SNIPER', name: '穿透塔', cost: 80, color: COLORS.towerSniper, radius: 14, range: 350, fireRate: 2, damage: 35, pierce: 3, hp: 40, shape: 'triangle' },
};

export const ENEMY_TYPES = {
  BASIC: { color: COLORS.enemyBasic, hp: 20, speed: 100, damage: 5, radius: 10, value: 1 },
  FAST: { color: COLORS.enemyFast, hp: 15, speed: 180, damage: 3, radius: 8, value: 2 },
  TANK: { color: COLORS.enemyTank, hp: 80, speed: 60, damage: 15, radius: 16, value: 5 },
};

export const UI_COPY = {
  startTitle: '吸血鬼塔防',
  gameOverTitle: '防线崩溃',
  startDescription: '移动角色自动射击。收集水晶，在地图上布置你的防御塔阵地。',
  controlsPc: '电脑：WASD/方向键移动，鼠标点击底部卡牌后点击空地建造。',
  controlsMobile: '手机：左侧屏幕拖动摇杆移动，点击卡牌后点击空地建造。',
  introBanner: '生存并建立你的防线',
  invalidPlacement: '位置无效',
  insufficientFunds: '资金不足',
  buildHint: '点击空地建造',
};