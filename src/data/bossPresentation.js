export const BOSS_PRESENTATION = {
  COMMANDER: {
    summary: 'A disciplined push boss that advances behind escorts and shield pressure.',
    threats: ['Advance', 'Shielding', 'Lane Pressure'],
    counterplay: 'Break the escort line first and keep sustained fire on the front.',
  },
  HUNTER: {
    summary: 'A pursuit boss that turns static play into a liability through repeated dives.',
    threats: ['Dive', 'Chase', 'Feint'],
    counterplay: 'Move laterally early and punish the opening after each commit.',
  },
  FORTRESS: {
    summary: 'A heavy siege boss that wins by forcing the player to endure a slow collapse.',
    threats: ['Armor', 'Ram', 'Shockwave'],
    counterplay: 'Slow it, chip it early, and keep splash ready for its support pack.',
  },
  PRISM: {
    summary: 'A beam-pattern boss that constantly rewrites where the safe angle is.',
    threats: ['Refraction', 'Mirrors', 'Cross Lines'],
    counterplay: 'Leave beam intersections first, then return to a clean firing lane.',
  },
  HIVE: {
    summary: 'A snowball boss that claims the board with spawn points and swarm growth.',
    threats: ['Nests', 'Growth', 'Rebuild'],
    counterplay: 'Deny fresh nests quickly before returning to boss damage.',
  },
  FROST_JUDGE: {
    summary: 'A control boss that slows first and punishes clustered value next.',
    threats: ['Slow Zones', 'Freeze', 'Marked Targets'],
    counterplay: 'Split key towers across lanes and pre-move before the freeze lands.',
  },
  RAIL_WARLORD: {
    summary: 'A sight-line boss that punishes neat but overly linear defenses.',
    threats: ['Lock Lines', 'Sniping', 'Suppression Grid'],
    counterplay: 'Spread critical towers and react to targeting lanes immediately.',
  },
  COLLECTOR: {
    summary: 'An economy boss that steals tempo and forces defensive spending.',
    threats: ['Theft', 'Escort Runs', 'Tax Pressure'],
    counterplay: 'Protect income and stop repeated steal cycles before they compound.',
  },
  TWINS: {
    summary: 'A true dual-boss encounter built around crossfire, role recognition, and enrage cleanup.',
    threats: ['Dual Sync', 'Crossfire', 'Enrage'],
    counterplay: 'Break the twin restricting movement first, then survive the empowered remainder.',
  },
  DRAGON: {
    summary: 'A stage sweeper that repeatedly erases stable ground with breath and dives.',
    threats: ['Sweep', 'Dive', 'Inferno'],
    counterplay: 'Keep a moving route, dodge laterally, and recommit only after dives resolve.',
  },
  SPIDER_MATRIARCH: {
    summary: 'A territorial boss that wins through webs, body-blockers, and shrinking exits.',
    threats: ['Webs', 'Broods', 'Encirclement'],
    counterplay: 'Open escape lanes first and never let webs and spiderlings stack freely.',
  },
  ASTROLABE: {
    summary: 'A displacement boss that changes what counts as safe through gravity and lock lines.',
    threats: ['Gravity', 'Orbitals', 'Singularity'],
    counterplay: 'Preserve turning room and leave the pull line before the center closes.',
  },
  BLOOD_FORGE: {
    summary: 'A conversion boss that turns nearby enemies into armor and burst windows.',
    threats: ['Sacrifice', 'Armor', 'Detonation'],
    counterplay: 'Thin the fuel wave before phase spikes and avoid feeding the forge.',
  },
  VOID_CONDUCTOR: {
    summary: 'A rhythm boss that becomes memorable because patterns resolve like beats.',
    threats: ['Tempo', 'Cuts', 'Finale'],
    counterplay: 'Move for the next beat early and read grouped telegraphs as timing.',
  },
  LABYRINTH_KEEPER: {
    summary: 'A routing boss that shepherds the player into bad geometry and dead ends.',
    threats: ['Walls', 'Gate Swaps', 'Compression'],
    counterplay: 'Avoid dead-end tower clusters and always keep one escape lane open.',
  },
  NIGHTMARE_BLOOM: {
    summary: 'An attrition boss that gradually contaminates the arena if unchecked.',
    threats: ['Seeds', 'Spread', 'Garden'],
    counterplay: 'Leave infected edges quickly and clear propagation nodes before they bloom.',
  },
};

const BOSS_FORM_PRESENTATION_IDS = {
  commander: 'COMMANDER',
  hunter: 'HUNTER',
  fortress: 'FORTRESS',
  prism: 'PRISM',
  hive: 'HIVE',
  frostJudge: 'FROST_JUDGE',
  railWarlord: 'RAIL_WARLORD',
  collector: 'COLLECTOR',
  twinSun: 'TWINS',
  twinMoon: 'TWINS',
  dragon: 'DRAGON',
  spider: 'SPIDER_MATRIARCH',
  astrolabe: 'ASTROLABE',
  forge: 'BLOOD_FORGE',
  conductor: 'VOID_CONDUCTOR',
  labyrinth: 'LABYRINTH_KEEPER',
  bloom: 'NIGHTMARE_BLOOM',
};

const BOSS_ID_FORMS = {
  COMMANDER: 'commander',
  HUNTER: 'hunter',
  FORTRESS: 'fortress',
  PRISM: 'prism',
  HIVE: 'hive',
  FROST_JUDGE: 'frostJudge',
  RAIL_WARLORD: 'railWarlord',
  COLLECTOR: 'collector',
  TWINS: 'twinSun',
  DRAGON: 'dragon',
  SPIDER_MATRIARCH: 'spider',
  ASTROLABE: 'astrolabe',
  BLOOD_FORGE: 'forge',
  VOID_CONDUCTOR: 'conductor',
  LABYRINTH_KEEPER: 'labyrinth',
  NIGHTMARE_BLOOM: 'bloom',
};

const DEFAULT_PHASE_COUNTERPLAY = [
  'Scout the first pattern before committing resources.',
  'Keep escape routes open while pressure increases.',
  'Prioritize survival and interrupt the strongest pattern window.',
];

export const DEFAULT_BOSS_PHASE_PRESENTATION = [
  {
    intent: 'Setup',
    tone: '#ffffff',
    callout: 'The boss is changing its attack structure. Be ready to swap response patterns.',
  },
  {
    intent: 'Pressure',
    tone: '#ffffff',
    callout: 'The boss is changing its attack structure. Be ready to swap response patterns.',
  },
  {
    intent: 'Burst',
    tone: '#ffffff',
    callout: 'This boss is entering its high-pressure phase. Tempo and space are both changing now.',
  },
];

const buildPhasePresentation = ({ intents, tones, callouts }) =>
  intents.map((intent, index) => ({
    intent,
    tone: tones[index],
    callout: callouts[index],
  }));

export const BOSS_PHASE_PRESENTATION_BY_FORM = {
  commander: buildPhasePresentation({
    intents: ['Advance', 'Shield Wall', 'Breakthrough'],
    tones: ['#93c5fd', '#60a5fa', '#2563eb'],
    callouts: [
      'The commander is still testing the front. Respect the formation before greedily expanding.',
      'The line is hardening now. Shield support will make the lane feel narrower.',
      'The formation is committing to a breakthrough. Expect the push to arrive as one heavy beat.',
    ],
  }),
  hunter: buildPhasePresentation({
    intents: ['Probe', 'Pincer', 'Execution'],
    tones: ['#fca5a5', '#fb7185', '#e11d48'],
    callouts: [
      'The hunter is probing for bad positioning. Stay mobile and wait for the overcommit.',
      'The pursuit pattern is tightening. Feints and side pressure will punish planted play.',
      'The hunter has shifted into execution range. Failed reads will be punished much faster now.',
    ],
  }),
  fortress: buildPhasePresentation({
    intents: ['Siege', 'Fortify', 'Crush'],
    tones: ['#cbd5e1', '#94a3b8', '#64748b'],
    callouts: [
      'The fortress is still a slow wall. Start the damage race before the lane collapses.',
      'Armor and fortification are stacking up now. Endurance matters more than burst alone.',
      'The wall is turning into a crush pattern. Surviving the advance is the fight now.',
    ],
  }),
  prism: buildPhasePresentation({
    intents: ['Refraction', 'Mirrors', 'Overload'],
    tones: ['#c4b5fd', '#a78bfa', '#7c3aed'],
    callouts: [
      'The prism is teaching its beam geometry. Watch intersections before you look for damage.',
      'Mirror lines are multiplying. Safe angles will move even if the boss itself barely does.',
      'Refraction is overloading the arena. Pattern reading matters more than holding one spot.',
    ],
  }),
  hive: buildPhasePresentation({
    intents: ['Nest', 'Swarm', 'Collapse'],
    tones: ['#86efac', '#4ade80', '#16a34a'],
    callouts: [
      'The hive is starting to claim territory. Deny fresh nest points before they snowball.',
      'Swarm pressure is rising now. Letting the board state grow is the real loss condition.',
      'The hive is ready to collapse the arena under numbers. Clear spawners before you tunnel the core.',
    ],
  }),
  frostJudge: buildPhasePresentation({
    intents: ['Slowfield', 'Freeze Mark', 'Judgment'],
    tones: ['#bfdbfe', '#93c5fd', '#38bdf8'],
    callouts: [
      'The judge is laying out slow fields first. Protect your spacing before the punish arrives.',
      'Freeze marks are entering the pattern now. Stacked value will become a liability.',
      'Judgment range has opened. One frozen pocket can cost the whole lane if you stay grouped.',
    ],
  }),
  railWarlord: buildPhasePresentation({
    intents: ['Targeting', 'Suppression', 'Kill Lane'],
    tones: ['#fda4af', '#fb7185', '#e11d48'],
    callouts: [
      'The warlord is establishing sight-lines. Clumped tower geometry is now a risk.',
      'Suppression lanes are forming. React to targeting lines before they become a grid.',
      'The kill lane is online. Linear defenses will get punished if they cannot break formation.',
    ],
  }),
  collector: buildPhasePresentation({
    intents: ['Tax', 'Escort', 'Repossess'],
    tones: ['#fde68a', '#fbbf24', '#f59e0b'],
    callouts: [
      'The collector is still stealing tempo, not just money. Protect your economy line early.',
      'Escort runs are becoming more aggressive. A delayed response now costs future pacing too.',
      'The repossession pattern is live. Letting the boss loop tax cycles will snowball the whole wave.',
    ],
  }),
  twinSun: buildPhasePresentation({
    intents: ['Pressure', 'Crossfire', 'Eclipse'],
    tones: ['#fde68a', '#fbbf24', '#f59e0b'],
    callouts: [
      'The twins are beginning to sync up. Watch where the two bodies overlap their lanes.',
      'The pair is now forcing crossfire patterns. Positioning mistakes will compound quickly.',
      'The twins are closing the arena together now. Crossfire patterns will collapse space faster.',
    ],
  }),
  twinMoon: buildPhasePresentation({
    intents: ['Snare', 'Lockdown', 'Eclipse'],
    tones: ['#bfdbfe', '#93c5fd', '#60a5fa'],
    callouts: [
      'Moon pressure is entering the pattern. Watch for the body that restricts movement first.',
      'Lockdown support is thickening now. Bad movement will feed the partner easier openings.',
      'The lunar half is closing the trap with the sun twin. Escape lanes will vanish much faster.',
    ],
  }),
  dragon: buildPhasePresentation({
    intents: ['Strafe', 'Air Supremacy', 'Inferno Dive'],
    tones: ['#fdba74', '#fb923c', '#ea580c'],
    callouts: [
      'Air space is tightening. Lateral dodges will hold better than backing straight away.',
      'The dragon is rewriting safe ground now. Breath and buffet windows will keep shifting the lane.',
      'The dragon is sealing the field. Dive aftermath will shred what used to be safe ground.',
    ],
  }),
  spider: buildPhasePresentation({
    intents: ['Webs', 'Encircle', 'Nest Bloom'],
    tones: ['#bef264', '#a3e635', '#65a30d'],
    callouts: [
      'The matriarch is building territory now. Track web zones and encirclement angles first.',
      'Brood pressure is joining the webs. Exits will fail if you ignore body-blockers.',
      'The nest is reaching endgame density. Webs and brood points will choke escape lanes together.',
    ],
  }),
  astrolabe: buildPhasePresentation({
    intents: ['Gravity', 'Orbital Lock', 'Event Horizon'],
    tones: ['#c4b5fd', '#a78bfa', '#8b5cf6'],
    callouts: [
      'Orbital geometry is forming. Leave turning room before the gravity lines fully settle.',
      'The astrolabe is teaching displacement now. Old safe positions are becoming temporary.',
      'The singularity is starting to close. Pulls and lock lines will turn old safe corners into traps.',
    ],
  }),
  forge: buildPhasePresentation({
    intents: ['Armor', 'Sacrifice', 'Detonation'],
    tones: ['#fdba74', '#f97316', '#c2410c'],
    callouts: [
      'The forge is still gathering fuel. Do not let the support wave become free armor.',
      'Sacrifice timing is entering the fight now. Small enemies are no longer harmless background noise.',
      'The forge is converting the arena into burst windows. Thin the fuel wave before the detonation comes.',
    ],
  }),
  conductor: buildPhasePresentation({
    intents: ['Tempo', 'Syncopate', 'Finale'],
    tones: ['#f9a8d4', '#f472b6', '#db2777'],
    callouts: [
      'The conductor is setting the beat. Read the rhythm before you chase damage windows.',
      'The pattern is syncopating now. Move for the next pulse before the current one resolves.',
      'The finale pattern is opening. Treat the fight like timing, not chaos.',
    ],
  }),
  labyrinth: buildPhasePresentation({
    intents: ['Corridor', 'Gate Shift', 'Dead End'],
    tones: ['#d8b4fe', '#c084fc', '#9333ea'],
    callouts: [
      'The keeper is sketching routes now. Preserve at least one clean escape line.',
      'Gate shifts are reshaping the arena. Familiar movement paths will stop being reliable.',
      'The maze is compressing into dead ends. Bad geometry will become the real source of damage.',
    ],
  }),
  bloom: buildPhasePresentation({
    intents: ['Seed', 'Blight', 'Canopy'],
    tones: ['#86efac', '#4ade80', '#22c55e'],
    callouts: [
      'The bloom is planting contamination lines. Leave infected edges before they mature.',
      'Spread pressure is accelerating now. Propagation nodes matter more than the boss body alone.',
      'The garden is entering attrition mode. Hesitation will let the arena decay around you.',
    ],
  }),
};

export const getBossPresentation = (bossId) => BOSS_PRESENTATION[bossId] ?? null;

const clampPhaseTier = (activePhaseIndex = 0) => Math.max(0, Math.min(DEFAULT_BOSS_PHASE_PRESENTATION.length - 1, activePhaseIndex));

const getBossForm = (bossOrForm) => {
  if (typeof bossOrForm === 'string') {
    return BOSS_ID_FORMS[bossOrForm] ?? bossOrForm;
  }

  return bossOrForm?.form ?? BOSS_ID_FORMS[bossOrForm?.encounterBossId] ?? BOSS_ID_FORMS[bossOrForm?.id] ?? null;
};

const getBossPresentationId = (bossOrForm, form) => {
  if (typeof bossOrForm === 'string') {
    return BOSS_PRESENTATION[bossOrForm] ? bossOrForm : BOSS_FORM_PRESENTATION_IDS[form] ?? null;
  }

  return bossOrForm?.encounterBossId ?? bossOrForm?.id ?? BOSS_FORM_PRESENTATION_IDS[form] ?? null;
};

export const getBossPhasePresentation = (bossOrForm, activePhaseIndex = 0) => {
  const form = getBossForm(bossOrForm);
  const phaseTier = clampPhaseTier(activePhaseIndex);
  const phasePresentation = BOSS_PHASE_PRESENTATION_BY_FORM[form]?.[phaseTier] ?? DEFAULT_BOSS_PHASE_PRESENTATION[phaseTier];
  const bossId = getBossPresentationId(bossOrForm, form);
  const bossPresentation = getBossPresentation(bossId);

  return {
    ...phasePresentation,
    phaseTier,
    form,
    bossId,
    summary: bossPresentation?.summary ?? '',
    threats: bossPresentation?.threats ?? [],
    counterplay: bossPresentation?.counterplay ?? DEFAULT_PHASE_COUNTERPLAY[phaseTier],
  };
};

export const getBossPhaseHint = (boss, activePhaseIndex) => getBossPhasePresentation(boss, activePhaseIndex).intent;

export const getBossPhaseTone = (boss, activePhaseIndex) => {
  const presentation = getBossPhasePresentation(boss, activePhaseIndex);
  return presentation.tone ?? boss?.color ?? '#ffffff';
};

export const getBossPhaseCalloutText = (boss, activePhaseIndex) => getBossPhasePresentation(boss, activePhaseIndex).callout;
