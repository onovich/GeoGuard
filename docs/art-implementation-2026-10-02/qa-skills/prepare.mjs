// Preparation only: reads static configuration and hashes; never starts a server/browser or updates game state.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const owner = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(owner, '../../..');
const revision = path.join(owner, 'submissions/r01');
assert.ok(!fs.existsSync(path.join(revision, 'packet.json')), 'Sealed revision is immutable');
fs.mkdirSync(revision, { recursive: true });
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const hash = file => sha(fs.readFileSync(file));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
const rel = file => path.relative(root, file).replaceAll('\\', '/');
const lockPath = path.resolve(owner, '../qa/submissions/r04/candidate-lock.json');
const expectedSha = 'b2ff7e280d52aa49cad9d3fd582cf6bec70adf7f998d0c6d54fcd4d676514a88';
const { verifyFinalLock } = await import(pathToFileURL(path.join(root, 'scripts/art-validation/final-lock.mjs')));
const lock = verifyFinalLock(lockPath, expectedSha);
assert.equal(lock.files.length, 880);
assert.equal(lock.sourceFingerprint, 'f353ca072173dfb8e63f4b06506f0e4ad345cecc276fab8bfedf163d18ec3ac6');
const candidate = lock.sourceRoot;
const load = file => import(pathToFileURL(path.join(candidate, file)));
const { BOSS_ORDER, BOSS_TYPES } = await load('src/data/gameConfig.js');
const { getBossPhaseOverrides, createTwinsEncounterMembers } = await load('src/logic/engine/encounterRuntime.js');
const { getPhaseBehaviorNodes } = await load('src/logic/engine/bossAuthoringRules.js');
const inputs = JSON.parse(fs.readFileSync(lock.inputs.path));
const matrixPath = path.resolve(owner, '../qa/submissions/r04/final-matrix.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath));
const optimizedPath = path.join(candidate, 'src/logic/engine/bossOptimizedAbilities.js');
const optimizedSource = fs.readFileSync(optimizedPath, 'utf8');
const optimized = new Set([...optimizedSource.matchAll(/^  (\w+): \(c\) =>/gm)].map(m => m[1]));
const sourceLocations = ability => {
  const file = optimized.has(ability) ? optimizedPath : path.join(candidate, 'src/logic/engine/bossAbilityRuntime.js');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const marker = optimized.has(ability) ? `  ${ability}: (c)` : `abilityName === '${ability}'`;
  return { path: path.relative(candidate, file).replaceAll('\\', '/'), line: lines.findIndex(line => line.includes(marker)) + 1, sha256: hash(file) };
};
const prerequisite = ability => ({
  stealMoney: ['GUI Infinite Money OFF; money > 0; courier spawn and independent movement/cargo'],
  repossess: ['GUI Infinite Money OFF; money > 0; courier plus damage zone'],
  markTower: ['One live tower placed through GUI; preserve reticle targetUid and firing/disappearance'],
  freezeTower: ['One live tower placed through GUI; preserve seal targetUid, frozenTimer and disappearance'],
  coldSnap: ['Two live GUI towers; each seal has its own UID and correct targetUid'],
  sacrificeMinions: ['GUI spawn BASIC/TANK within 180 world units before windup; capture sacrificeTargets, real deaths, healing/shield and scaled zone'],
  shieldPulse: ['Live nearby nonboss enemy; capture changed shield/maxShield/armoredTimer'],
  hivePulse: ['Earlier default spawnHive has produced a surviving nest'],
  hiveCollapse: ['Earlier default spawnHive has produced a surviving nest'],
  mazeCrush: ['Earlier default raiseWalls has produced surviving walls'],
  deadEnd: ['Earlier default raiseWalls/gateSwap has produced surviving walls'],
  soloSolarVolley: ['GUI Wave 1; real combat kills MOON; SUN partnerFallen=true; no HP setters'],
  soloLunarOrbit: ['GUI Wave 1; real combat kills SUN; MOON partnerFallen=true; no HP setters'],
}[ability] ?? ['Use original default scheduler; retain preceding casts and their entities; inspect effect against source']);

const phaseCases = [];
const scenes = [];
for (const id of BOSS_ORDER) {
  const template = BOSS_TYPES[id];
  const members = id === 'TWINS'
    ? createTwinsEncounterMembers({ ...template, maxHp: template.hp, baseSpeed: template.speed }).map((m, i) => ({ ...m, role: i === 0 ? 'sun' : 'moon' }))
    : [{ ...template, role: 'boss', phases: getBossPhaseOverrides(template) }];
  for (let phaseIndex = 0; phaseIndex < 3; phaseIndex++) {
    const cases = [];
    for (const member of members) for (const node of getPhaseBehaviorNodes(member.phases[phaseIndex], phaseIndex).filter(n => n.enabled)) {
      const row = { encounter: id, memberId: member.id, role: member.role, artId: `boss:${id === 'TWINS' ? 'TWINS_' + member.role.toUpperCase() : id}`, phaseIndex,
        phaseName: member.phases[phaseIndex].name, ability: node.abilityId, defaultCooldown: node.cooldown,
        sceneId: `C04-${id}-${member.role}-P${phaseIndex + 1}-${node.abilityId}`, source: sourceLocations(node.abilityId), prerequisites: prerequisite(node.abilityId), runtimeStatus: 'not_run', evidence: [] };
      assert.ok(row.source.line > 0, `No handler source for ${row.ability}`);
      phaseCases.push(row); cases.push(row.sceneId);
    }
    scenes.push({ sceneId: `${id}-P${phaseIndex + 1}`, encounter: id, label: template.name, phaseIndex, cases,
      seed: 20261001, alternateSeeds: [7, 314159], dt: 1 / 60, boundedFrames: 10800,
      viewport: { width: 1440, height: 900, dpr: 1 },
      setup: ['DEV reset(debug,seed)', 'GUI BASIC tower drag to (530,450)', 'GUI boss card drag to (970,440)', `GUI Phase ${phaseIndex + 1}`, 'Collapse debug panel',
        ...(id === 'COLLECTOR' ? ['GUI Infinite Money OFF after placements'] : []),
        ...(id === 'BLOOD_FORGE' && phaseIndex > 0 ? ['GUI BASIC/TANK nearby before sacrifice windup; preserve actual HP'] : [])],
      runtimeStatus: 'not_run', visualStatus: 'not_reviewed' });
  }
}
assert.deepEqual(phaseCases.map(c => c.sceneId).sort(), matrix.phaseCases.map(c => c.sceneId).sort());
const defaults = new Set(phaseCases.map(c => c.ability));
assert.equal(defaults.size, 93);
const keys = [...defaults, 'soloSolarVolley', 'soloLunarOrbit'].sort();
assert.deepEqual(keys, inputs.bossAbilitySamples.map(s => s.abilityId).sort());
assert.deepEqual(keys.map(k => `skill:${k}`), matrix.skills.map(s => s.key).sort());
const skills = keys.map((ability, index) => ({ index: index + 1, key: `skill:${ability}`, ability,
  source: sourceLocations(ability), dispatchPath: optimized.has(ability) ? 'optimized' : 'fallback',
  producerInputPointer: `/bossAbilitySamples/${inputs.bossAbilitySamples.findIndex(s => s.abilityId === ability)}`,
  inputOwners: inputs.bossAbilitySamples.find(s => s.abilityId === ability).sourceOwners,
  phaseCases: phaseCases.filter(c => c.ability === ability).map(c => c.sceneId),
  survivorRole: ability === 'soloSolarVolley' ? 'sun' : ability === 'soloLunarOrbit' ? 'moon' : null,
  prerequisites: prerequisite(ability), runtimeStatus: 'not_run', effectStatus: 'not_run', cleanupStatus: 'not_run', pauseStatus: 'not_run', visualStatus: 'not_reviewed', evidence: [] }));
const survivorCases = matrix.twinSurvivorCases.map(c => ({ ...c, status: 'not_run', evidence: [], sceneId: `TWINS-${c.role}-survivor-P${c.phaseIndex + 1}`, ability: c.role === 'sun' ? 'soloSolarVolley' : 'soloLunarOrbit',
  setup: ['DEV reset(debug,seed)', 'GUI Wave 1 to enable actual encounter rewards/enrage', 'GUI TWINS drag', 'GUI towers biased toward partner to defeat', 'Use Phase button only before combat; preserve defeat HP history', 'After actual partner death, sell attacking towers through GUI if necessary to preserve survivor'],
  requiredProof: ['both member UID/HP before last hit', 'real damaging projectile/hit event and partner removal', 'partnerFallen and injected solo ability', 'solo windup/execute/recover', 'independent owned geometry', 'second real death and aftermath cleanup'], visualStatus: 'not_reviewed' }));
write(path.join(revision, 'coverage.json'), { status: 'prepared_not_executed', counts: { identities: 48, referenceInputs: 375, archivedConceptsExcluded: 4, skills: skills.length, defaultSkills: defaults.size, defaultPhaseCases: phaseCases.length, survivorCases: survivorCases.length }, skills, phaseCases, survivorCases });
write(path.join(revision, 'scenes.json'), { scenes, survivorCases });
fs.writeFileSync(path.join(revision, 'coverage.md'), '# Actual skill dispatch coverage — preparation only\n\nAll 95 remain `not_run`. Pose sheets prove no runtime dispatch.\n\n| # | Ability | Dispatcher | Default member/phase cases | Preconditions |\n|---|---|---|---|---|\n' + skills.map(s => `| ${s.index} | ${s.ability} | ${s.dispatchPath} | ${s.phaseCases.join('<br>') || `TWINS ${s.survivorRole} after real partner defeat`} | ${s.prerequisites.join('; ')} |`).join('\n') + '\n', 'utf8');
const references = [lockPath, matrixPath, lock.inputs.path, path.resolve(owner, '../coordination.md'), ...['integration-r05.md','characters-r04.md','ui-r03.md','root-playable-r05.md'].map(f => path.resolve(owner, '../reviews', f)), path.join(root, 'scripts/art-validation/final-skill-observer.mjs'), path.join(root, 'scripts/art-validation/final-session.mjs'), path.join(root, 'scripts/art-validation/final-lock.mjs')];
write(path.join(revision, 'preparation-checks.json'), { checkedAt: new Date().toISOString(), checks: { lockSha: hash(lockPath), sourceFingerprint: lock.sourceFingerprint, candidateFiles: lock.files.length, independentPhaseMappingMatchesMatrix: true, all95MatchFrozenInputs: true, allHandlerLocationsExist: true, browserStarted: false, gameUpdatesRun: 0, buildsRun: 0 }, references: references.map(file => ({ path: rel(file), sha256: hash(file) })) });
console.log(JSON.stringify({ prepared: true, skills: skills.length, phaseCases: phaseCases.length, survivorCases: survivorCases.length, sourceFingerprint: lock.sourceFingerprint }));
