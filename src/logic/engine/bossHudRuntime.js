import { getBossPhaseHint, getBossPhaseTone, getBossPresentation } from '../../data/bossPresentation.js';

export const getBossHudGroupId = (boss) => (boss.encounterUid ? `enc-${boss.encounterUid}` : `boss-${boss.uid}`);

export const buildBossHudRuntime = ({
  enemies,
  getPresentation = getBossPresentation,
  getPhaseHint = getBossPhaseHint,
  getPhaseTone = getBossPhaseTone,
}) => {
  const groups = new Map();

  for (const boss of enemies.filter((enemy) => enemy.isBoss)) {
    const key = getBossHudGroupId(boss);
    const presentation = getPresentation(boss.encounterBossId ?? boss.id);
    const existing = groups.get(key) ?? {
      id: key,
      title: boss.encounterName ?? boss.name,
      summary: presentation?.summary ?? '',
      threats: presentation?.threats ?? [],
      counterplay: presentation?.counterplay ?? '',
      members: [],
    };
    const activePhaseIndex = boss.currentPhaseIndex ?? 0;

    existing.members.push({
      id: boss.uid,
      name: boss.name,
      color: boss.color,
      hpRatio: Math.max(0, boss.hp / boss.maxHp),
      phase: boss.phases?.[activePhaseIndex]?.name ?? '',
      phaseIndex: activePhaseIndex,
      phaseCount: boss.phases?.length ?? 0,
      phaseHint: getPhaseHint(boss, activePhaseIndex),
      phaseTone: getPhaseTone(boss, activePhaseIndex),
      enraged: Boolean(boss.bossState.partnerFallen),
    });
    groups.set(key, existing);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    members: group.members.sort((left, right) => left.id - right.id),
  }));
};

export const areBossHudSnapshotsEqual = (previous, next) => JSON.stringify(previous) === JSON.stringify(next);
