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

export const getBossPresentation = (bossId) => BOSS_PRESENTATION[bossId] ?? null;
