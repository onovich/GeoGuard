const OFFER_HISTORY_LIMIT = 8;
const PICK_HISTORY_LIMIT = 6;

const getOfferKey = (choice) => {
  if (choice.type === 'upgrade' || choice.type === 'unlock') {
    return `${choice.type}:${choice.towerId}`;
  }
  return choice.type;
};

const trimHistory = (items, limit) => items.slice(Math.max(0, items.length - limit));

const countRecent = (items, key, depth) => trimHistory(items, depth).filter((item) => item === key).length;

const scoreUnlockTower = (tower, waveNumber, offeredKeys, pickedKeys) => {
  const key = `unlock:${tower.id}`;
  const recentOffers = countRecent(offeredKeys, key, 4);
  const recentPicks = countRecent(pickedKeys, key, 6);
  const earlyWaveBias = waveNumber <= 8 ? 30 : waveNumber <= 12 ? 18 : 10;
  return earlyWaveBias - tower.sortOrder * 4 - recentOffers * 90 - recentPicks * 40;
};

const scoreUpgradeTower = (tower, waveNumber, offeredKeys, pickedKeys) => {
  const key = `upgrade:${tower.id}`;
  const recentOffers = countRecent(offeredKeys, key, 5);
  const recentPicks = countRecent(pickedKeys, key, 6);
  const missingLevels = tower.maxLevel - tower.level;
  const spreadBias = tower.level === 0 ? 22 : tower.level === 1 ? 12 : 4;
  const lateWaveBias = waveNumber >= 10 ? tower.level * 8 : 0;
  const affordabilityBias = tower.cost <= 55 ? 6 : tower.cost >= 90 ? -3 : 0;
  return missingLevels * 10 + spreadBias + lateWaveBias + affordabilityBias - tower.sortOrder * 1.5 - recentOffers * 70 - recentPicks * 24;
};

const buildSupportChoices = ({ waveNumber, money, hp, maxHp, infiniteMoney }) => {
  const supports = [];
  const missingHp = Math.max(0, maxHp - hp);

  if (missingHp > 0) {
    const amount = Math.min(missingHp, 18 + waveNumber * 3);
    supports.push({
      id: 'support-repair',
      type: 'support_repair',
      amount,
      priority: (missingHp / Math.max(1, maxHp)) * 100 + waveNumber * 0.3,
    });
  }

  if (!infiniteMoney && money <= 70) {
    const amount = 40 + waveNumber * 10;
    supports.push({
      id: 'support-money',
      type: 'support_money',
      amount,
      priority: (70 - money) * 0.9 + waveNumber * 0.8,
    });
  }

  return supports.sort((left, right) => right.priority - left.priority);
};

export const createRewardHistory = () => ({
  offeredKeys: [],
  pickedKeys: [],
});

export const buildRewardOfferPlan = ({ catalog, waveNumber, money, hp, maxHp, infiniteMoney, history = createRewardHistory() }) => {
  const offeredKeys = history.offeredKeys ?? [];
  const pickedKeys = history.pickedKeys ?? [];
  const locked = catalog
    .filter((tower) => !tower.available)
    .sort((left, right) => scoreUnlockTower(right, waveNumber, offeredKeys, pickedKeys) - scoreUnlockTower(left, waveNumber, offeredKeys, pickedKeys));
  const upgrades = catalog
    .filter((tower) => tower.available && tower.level < tower.maxLevel)
    .sort((left, right) => scoreUpgradeTower(right, waveNumber, offeredKeys, pickedKeys) - scoreUpgradeTower(left, waveNumber, offeredKeys, pickedKeys));
  const supports = buildSupportChoices({ waveNumber, money, hp, maxHp, infiniteMoney });

  const choices = [];
  const seenKeys = new Set();
  const addChoice = (choice) => {
    if (!choice) {
      return;
    }
    const key = getOfferKey(choice);
    if (seenKeys.has(key) || choices.length >= 3) {
      return;
    }
    seenKeys.add(key);
    choices.push(choice);
  };

  if (locked.length > 0) {
    addChoice({ type: 'unlock', towerId: locked[0].id });
  }

  if (supports.length > 0) {
    addChoice(supports[0]);
  }

  for (const tower of upgrades) {
    addChoice({ type: 'upgrade', towerId: tower.id });
    if (choices.length >= 3) {
      break;
    }
  }

  for (let index = 1; index < locked.length && choices.length < 3; index += 1) {
    addChoice({ type: 'unlock', towerId: locked[index].id });
  }

  if (choices.length < 3 && supports.length > 1) {
    addChoice(supports[1]);
  }

  if (choices.length < 3 && !infiniteMoney) {
    addChoice({
      id: 'support-money',
      type: 'support_money',
      amount: 30 + waveNumber * 8,
    });
  }

  return choices.slice(0, 3);
};

export const recordRewardOffers = (history, choices) => ({
  offeredKeys: trimHistory([...(history?.offeredKeys ?? []), ...choices.map(getOfferKey)], OFFER_HISTORY_LIMIT),
  pickedKeys: trimHistory(history?.pickedKeys ?? [], PICK_HISTORY_LIMIT),
});

export const recordRewardPick = (history, choice) => ({
  offeredKeys: trimHistory(history?.offeredKeys ?? [], OFFER_HISTORY_LIMIT),
  pickedKeys: trimHistory([...(history?.pickedKeys ?? []), getOfferKey(choice)], PICK_HISTORY_LIMIT),
});
