export const DEFAULT_BOSS_ABILITY_COOLDOWNS = {
  summonFormation: 6,
  commandLine: 5.8,
  shieldPulse: 8,
  phalanxAdvance: 8.5,
  commandRush: 7.2,
  dashAtPlayer: 4.5,
  markPrey: 5.2,
  summonScouts: 7,
  pincerRush: 6.8,
  feintStrike: 8.2,
  afterimageBurst: 9,
  summonSiege: 7.5,
  bastionMortar: 6.8,
  fortify: 10,
  shockRam: 8,
  quake: 8,
  bunkerRing: 10.5,
  prismBeam: 4.2,
  refractVolley: 6.2,
  mirrorSummon: 8,
  prismLattice: 8.8,
  tripleBeam: 7,
  mirrorStep: 8.4,
  spawnHive: 8,
  broodShift: 7.5,
  hiveHeal: 9,
  hivePulse: 7.2,
  summonSwarm: 7,
  hiveCollapse: 10.2,
  frostRing: 5.8,
  whiteout: 6.8,
  freezeTower: 8.5,
  glacialPrison: 8.8,
  summonFrostGuards: 9,
  coldSnap: 10.4,
  railShot: 4,
  crosshairBarrage: 6.5,
  markTower: 7,
  suppressiveGrid: 8.6,
  overload: 6,
  killLane: 9.2,
  stealMoney: 5,
  taxBeacon: 6.5,
  paydaySweep: 7.8,
  ransomBurst: 8,
  repossess: 9,
  twinOrbit: 9,
  twinBolt: 3.8,
  twinSwap: 7,
  eclipsePulse: 8,
  solarDash: 4.6,
  flareLance: 7.5,
  lunarSnare: 5.8,
  shadowArc: 7.2,
  twinCrossfire: 9,
  dragonStrafe: 5.2,
  emberWake: 6.2,
  wingBuffet: 7.4,
  dragonBreath: 4.8,
  tailSweep: 6,
  meteorRain: 9,
  skyDive: 8.5,
  infernoRing: 10.2,
  webTrap: 4.5,
  silkVolley: 6.4,
  spawnSpiderlings: 7,
  broodAmbush: 8.2,
  webField: 9,
  nestBloom: 10,
  gravityWell: 5.5,
  starfall: 6.5,
  orbitalShots: 6.5,
  orbitalLock: 8.4,
  singularity: 10,
  eventHorizon: 9.8,
  forgeArmor: 8,
  slagDrop: 6.6,
  sacrificeMinions: 9,
  brandLine: 7.4,
  moltenBurst: 10,
  forgeDetonation: 9.6,
  conductLines: 4,
  pulseMeasure: 5.5,
  tempoShift: 7,
  syncopate: 7.8,
  finale: 10,
  crescendo: 10.5,
  raiseWalls: 7,
  corridorClamp: 6.8,
  gateSwap: 8,
  mazeFold: 8.2,
  mazeCrush: 10,
  deadEnd: 10.2,
  seedPods: 6,
  blightRoots: 6.2,
  poisonBloom: 5.5,
  sporeBurst: 7.5,
  gardenWake: 9,
  creepingCanopy: 10.2,
};

const formatAbilityLabel = (abilityId) =>
  abilityId
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase())
    .trim();

const categorizeAbility = (abilityId) => {
  if (/summon|spawn|mirror/i.test(abilityId)) return 'Summon';
  if (/dash|rush|swap|step|dive/i.test(abilityId)) return 'Mobility';
  if (/beam|shot|line|arc|volley|barrage|bolt|lance/i.test(abilityId)) return 'Line';
  if (/ring|pulse|well|field|prison|bloom|wake|canopy|trap/i.test(abilityId)) return 'Area';
  if (/shield|fortify|armor|heal|orbit/i.test(abilityId)) return 'Buff';
  return 'Pattern';
};

export const BOSS_ABILITY_LIBRARY = Object.fromEntries(
  Object.entries(DEFAULT_BOSS_ABILITY_COOLDOWNS).map(([abilityId, cooldown]) => [
    abilityId,
    {
      id: abilityId,
      label: formatAbilityLabel(abilityId),
      category: categorizeAbility(abilityId),
      defaultCooldown: cooldown,
    },
  ])
);

const normalizeNodeId = (abilityId, phaseIndex, nodeIndex) => `${abilityId}-${phaseIndex}-${nodeIndex}`;

export const createBossBehaviorNode = (abilityId, phaseIndex = 0, nodeIndex = 0, overrides = {}) => ({
  id: overrides.id ?? normalizeNodeId(abilityId, phaseIndex, nodeIndex),
  abilityId,
  cooldown: overrides.cooldown ?? DEFAULT_BOSS_ABILITY_COOLDOWNS[abilityId] ?? 6,
  condition: overrides.condition ?? 'when ready',
  note: overrides.note ?? '',
  enabled: overrides.enabled ?? true,
});

export const getPhaseBehaviorNodes = (phase, phaseIndex = 0) => {
  if (phase.behaviorNodes?.length) {
    return phase.behaviorNodes.map((node, nodeIndex) =>
      createBossBehaviorNode(node.abilityId, phaseIndex, nodeIndex, node)
    );
  }

  return (phase.abilities ?? []).map((abilityId, nodeIndex) => createBossBehaviorNode(abilityId, phaseIndex, nodeIndex));
};

export const buildBossEditorDraft = (bossTemplate) => ({
  bossId: bossTemplate.id,
  name: bossTemplate.name,
  personality: bossTemplate.personality ?? '',
  summary: bossTemplate.summary ?? '',
  phases: (bossTemplate.phases ?? []).map((phase, phaseIndex) => ({
    id: `${bossTemplate.id}-phase-${phaseIndex + 1}`,
    name: phase.name,
    hpBelow: phase.hpBelow,
    nodes: getPhaseBehaviorNodes(phase, phaseIndex),
  })),
});

const normalizePhase = (phase, phaseIndex) => {
  const hpBelow = Number(phase.hpBelow);
  return {
    id: phase.id ?? `phase-${phaseIndex + 1}`,
    name: phase.name?.trim() || `Phase ${phaseIndex + 1}`,
    hpBelow: Number.isFinite(hpBelow) ? Math.max(0.05, Math.min(1, hpBelow)) : Math.max(0.1, 1 - phaseIndex * 0.3),
    nodes: (phase.nodes ?? []).map((node, nodeIndex) =>
      createBossBehaviorNode(node.abilityId ?? 'summonFormation', phaseIndex, nodeIndex, {
        ...node,
        cooldown: Number.isFinite(Number(node.cooldown)) ? Math.max(0.4, Number(node.cooldown)) : undefined,
      })
    ),
  };
};

export const normalizeBossEditorDraft = (draft, fallbackBossTemplate) => {
  const baseDraft = draft ?? buildBossEditorDraft(fallbackBossTemplate);
  const normalizedPhases = (baseDraft.phases?.length ? baseDraft.phases : buildBossEditorDraft(fallbackBossTemplate).phases).map(normalizePhase);

  return {
    bossId: baseDraft.bossId ?? fallbackBossTemplate.id,
    name: baseDraft.name?.trim() || fallbackBossTemplate.name,
    personality: baseDraft.personality?.trim() || (fallbackBossTemplate.personality ?? ''),
    summary: baseDraft.summary?.trim() || (fallbackBossTemplate.summary ?? ''),
    phases: normalizedPhases,
  };
};

export const applyBossEditorDraft = (bossTemplate, draft) => {
  const normalizedDraft = normalizeBossEditorDraft(draft, bossTemplate);
  const phases = normalizedDraft.phases.map((phase) => ({
    name: phase.name,
    hpBelow: phase.hpBelow,
    abilities: phase.nodes.filter((node) => node.enabled !== false).map((node) => node.abilityId),
    behaviorNodes: phase.nodes.map((node) => ({
      id: node.id,
      abilityId: node.abilityId,
      cooldown: node.cooldown,
      condition: node.condition,
      note: node.note,
      enabled: node.enabled,
    })),
  }));

  return {
    ...bossTemplate,
    name: normalizedDraft.name,
    personality: normalizedDraft.personality,
    summary: normalizedDraft.summary,
    phases,
    authoredTemplate: true,
  };
};

export const serializeBossEditorDraft = (draft) => JSON.stringify(draft, null, 2);

export const parseBossEditorDraft = (text, fallbackBossTemplate) => {
  const parsed = JSON.parse(text);
  return normalizeBossEditorDraft(parsed, fallbackBossTemplate);
};
