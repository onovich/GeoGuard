import { writeFileSync } from 'node:fs';
const sourceRoot = new URL('file:///D:/WebProjects/GeoGuard/');
const { createInitialTowerCatalog } = await import(new URL('src/data/gameConfig.js', sourceRoot));
const { buildTowerAtLevel } = await import(new URL('src/logic/engine/towerRules.js', sourceRoot));
const { buildRewardOfferPlan, materializeRewardChoices } = await import(new URL('src/logic/engine/rewardRules.js', sourceRoot));
const base = createInitialTowerCatalog();
const levels = [1, 0, 2, 0, 1, 0, 0, 1, 3];
const cards = base.map((tower, index) => buildTowerAtLevel({ ...tower, available: true }, levels[index]));
const allMax = base.map((tower) => buildTowerAtLevel({ ...tower, available: true }, 3));
const scenarios = [
  { id: 'DUI03-D-one', catalog: allMax, waveNumber: 34, money: 80, hp: 100 },
  { id: 'DUI03-E-two', catalog: allMax, waveNumber: 34, money: 80, hp: 50 },
  { id: 'DUI03-F-three', catalog: base.map((tower) => tower.id === 'FROST' ? { ...tower, available: false } : buildTowerAtLevel({ ...tower, available: true }, tower.id === 'BASIC' ? 0 : 3)), waveNumber: 32, money: 20, hp: 100 },
];
const evidence = {
  revision: 'r02', kind: 'derived-pure-rule-examples', gameplayChanged: false, runtimeOrHistorySimulated: false,
  cards: cards.map((tower) => ({ id: tower.id, name: tower.name, displayLevel: tower.level + 1, cost: tower.cost, fireRate: tower.fireRate, category: tower.splash ? '范围' : tower.pierce ? '穿透' : tower.slowRatio ? '减速' : tower.burstCount ? '散射' : '单体' })),
  rewardScenarios: scenarios.map((scenario) => ({
    input: { ...scenario, maxHp: 100, infiniteMoney: false, catalog: scenario.catalog.map((tower) => ({ id: tower.id, available: tower.available, level: tower.level, maxLevel: tower.maxLevel })) },
    choices: materializeRewardChoices(scenario.catalog, buildRewardOfferPlan({ ...scenario, maxHp: 100, infiniteMoney: false })),
  })),
};
writeFileSync(new URL('rule-evidence.json', import.meta.url), JSON.stringify(evidence, null, 2), 'utf8');
console.log(JSON.stringify({ cards: evidence.cards.length, choices: evidence.rewardScenarios.map((scenario) => scenario.choices.length), moneyAmounts: evidence.rewardScenarios.map((scenario) => scenario.choices.filter((choice) => choice.type === 'support_money').map((choice) => choice.amount)) }));
