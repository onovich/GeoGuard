import fs from 'node:fs';
import path from 'node:path';
import { ROOT, argsMap, writeJSON, fileHash } from './common.mjs';
import { adaptFinalInputs } from './final-inputs.mjs';
import { reusableLogicEvidence } from './final-lock.mjs';

const args = argsMap(), out = path.resolve(args.out), inputPath = path.resolve(args.inputs);
if (fs.existsSync(path.join(out, 'READY.json'))) throw new Error('Cannot overwrite sealed submission');
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative)));
const parent = 'docs/art-implementation-2026-10-02/qa/submissions';
const actions = read(`${parent}/r01/action-coverage.json`), skills = read(`${parent}/r01/skill-coverage.json`), desktop = read(`${parent}/r01/desktop-coverage.json`);
const input = JSON.parse(fs.readFileSync(inputPath)), adapted = adaptFinalInputs(input, actions.actions.map(x => x.key), skills.skills.map(x => x.key));
writeJSON(path.join(out, 'prepared-character-inputs.json'), { inputPath, inputSha256: fileHash(inputPath), ...adapted });
const wait = { status: 'dependency_wait', evidence: [] };
const dimensions = [{ width: 960, height: 720 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }];
const matrix = {
  status: 'prepared_not_executed', requiresPrimaryFrozenCandidate: true,
  identities: actions.identities.map(x => ({ ...x, runtimeStatus: 'not_run', visualStatus: 'not_run' })),
  actions: input.entries.map(x => ({ key: x.key, artId: x.artId, archiveOnly: x.archiveOnly, bodyReuseKey: x.bodyReuseKey, sampleIds: adapted.samples.filter(s => s.kind === 'action' && s.key === x.key).map(s => s.id), ...wait })),
  skills: skills.skills.map(x => ({ key: x.key, owners: x.owners, phaseCases: x.phaseCases, additionalScenario: x.additionalScenario, requirements: ['actual scheduler and real state, not pose fixture', 'windup/locked target/attack/recover/cleanup evidence', 'hazard ownership, timer, geometry, hit and OPEN from actual state'], ...wait })),
  phaseCases: skills.phaseCases.map(x => ({ ...x, ...wait })), twinSurvivorCases: skills.twinSurvivorCases.map(x => ({ ...x, ...wait })),
  desktop: dimensions.flatMap(viewport => [1, 2].flatMap(dpr => ['/', '/geoguard-qa/'].map(base => ({ viewport, dpr, base, required: true, flows: ['start/build/cancel/invalid/insufficient', 'scroll-nine-towers', 'ghost-to-placement at zoom and camera offsets', 'pause/resume/reset/reward/end/restart', 'resource/icon URLs remain under base'], ...wait })))),
  desktopRequirements: desktop.requirements, uiFineRequirements: desktop.uiFineRequirements,
  performance: [
    { profile: 'matched-density', viewport: { width: 1440, height: 900 }, dpr: 1, baselineRuns: 3, candidateRuns: 3 },
    { profile: 'normal-real-level', viewport: { width: 1440, height: 900 }, dpr: 2, baselineRuns: 0, candidateRuns: 1 },
    { profile: 'dense-with-real-hazards', viewport: { width: 1440, height: 900 }, dpr: 2, baselineRuns: 0, candidateRuns: 1 },
  ].map(row => ({ ...row, browser: 'same executable/version/headless state', warmupSeconds: 10, measureSeconds: 60, measurement: 'real RAF while actual game updates; read-only sampler', loadComparison: 'same GUI/world inputs and actual density/hazard distributions; unequal load prohibits direct regression ratio', limitations: 'Baseline lacks DEV step bridge; no deterministic-baseline claim. No extra repeated runs without a specific regression.', ...wait })),
  resources: ['48 icon decode/base-path checks', 'all48 vector body API ready/no fallback', 'abort signal', 'icon404/decode failure/delay2s and10s', 'art module failure and recovery', 'reset during load; stale callbacks; cold/warm cache'],
  hookBoundary: ['same-frame birth/delete', 'splash source shared by correct targets', 'pierce order/dedup', 'four-shot same-point source indices', 'mutate original projectile after capture; event values stable', 'no shared runtime object in draw DTO graph', 'reset clears old epoch/events/retired actors', 'pause leaves gameTime and gameplay state stable', 'snapshot clone mutation cannot modify live state'],
  knownBugRegressions: [
    { id: 'I06', priorCandidateBug: true, status: 'awaiting_fixed_frozen_candidate', steps: ['real start', 'DEV reset while BuildBar remains mounted', 'real drag out then return to same bar', 'assert no entity, no money decrement, valid buildBarRect; no resize workaround'] },
    { id: 'I07', priorCandidateBug: true, status: 'awaiting_fixed_frozen_candidate', steps: ['debug reset', 'real Bosses card drag TWINS', 'inspect held ghost screenshot and fallback ledger', 'release and verify SUN/MOON separate identities', 'default complete-resource path fallbackArtIds must remain empty'] },
  ],
  logic: reusableLogicEvidence(ROOT, read(`${parent}/r03/logic-freeze.json`)),
};
writeJSON(path.join(out, 'final-matrix.json'), matrix);
const sourceObservations = input.sourceFiles.map(f => ({ ...f, observedSha256: fs.existsSync(path.join(ROOT, f.path)) ? fileHash(path.join(ROOT, f.path)) : null })).map(f => ({ ...f, matches: f.sha256 === f.observedSha256 }));
const characterPacket = path.join(ROOT, 'docs/art-implementation-2026-10-02/characters/submissions/r04/packet.json');
const characterAccepted = fs.existsSync(characterPacket) && fileHash(characterPacket) === '29b0c819836463d6712e26b13947953ad50b61b49347d97c0a1ff75d7ef542c3';
writeJSON(path.join(out, 'issues.json'), {
  status: 'preparation_only_not_final_READY', recipient: 'primary reviewer only', dependency_wait: [
    { id: 'QA-R04-D01', requirement: 'Primary-approved immutable full candidate fingerprint including public assets and 1.25 camera/inverse transform' },
    ...(!characterAccepted ? [{ id: 'QA-R04-D02', requirement: 'Final character r04 READY and SHA-bound input/source/public files' }] : []),
    { id: 'QA-R04-D03', requirement: 'UI final 48-resource three-desktop packet' },
  ], resolved_dependencies: characterAccepted ? [{ id: 'QA-R04-D02', packetSha256: fileHash(characterPacket), review: 'reviews/characters-r04.md', scope: 'character module only, not actual runtime skill coverage' }] : [], confirmed_bugs: [
    { id: 'I06', origin: 'primary pre-freeze candidate', owner: 'integration', status: 'awaiting_fixed_candidate_regression', evidence: 'reviews/final-candidate-issues.md', reproducedOnFinalFrozenCandidate: false },
    { id: 'I07', origin: 'primary pre-freeze candidate', owner: 'integration', status: 'awaiting_fixed_candidate_regression', evidence: 'reviews/final-candidate-issues.md', reproducedOnFinalFrozenCandidate: false },
  ], inputDefects: adapted.defects, sourceObservations,
  note: 'Unsealed owner output changing is dependency waiting, not a confirmed production bug. Static observations do not grant runtime/visual approval.'
});
writeJSON(path.join(out, 'PREPARATION.json'), { schemaVersion: 1, owner: 'qa', revision: 'r04', status: 'awaiting_primary_freeze', preparedAt: new Date().toISOString(), counts: adapted.counts, currentInputSha256: fileHash(inputPath), finalRuns: 0, finalSealed: false, priorLogic: matrix.logic, rootReadyRemains: 'approved r03', next: 'Receive primary lock and hash, verify frozen copies, refresh this input adaptation, then run final matrix in separate evidence directories.' });
console.log(JSON.stringify({ out, counts: adapted.counts, sourceMismatches: sourceObservations.filter(f => !f.matches).map(f => f.path), logic: matrix.logic, finalRuns: 0 }));
