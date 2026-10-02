import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Consolidate completed, independently recorded player sessions against server audits.
const episodes = [];
for (const role of ['novice', 'builder', 'mobile']) {
  const records = JSON.parse(readFileSync(`.tmp/player-playtest/${role}-results.json`, 'utf8'));
  for (const record of records) {
    let summary = record.debrief;
    if (summary?.debrief) summary = summary.debrief;
    const audit = JSON.parse(readFileSync(`.tmp/player-playtest/audit/${record.session}.json`, 'utf8'));
    assert.deepEqual(summary, audit.summary, `Player/server mismatch: ${record.session}`);
    assert.equal(summary.profile, role);
    assert.notEqual(summary.status, 'playing');
    episodes.push({ session: record.session, role, scenario: record.scenario,
      strategyVersion: record.version, auxiliary: record.version === 'auxiliary-wait', ...summary });
  }
}
const main = episodes.filter(e => !e.auxiliary);
const totalSeconds = main.reduce((sum, e) => sum + e.elapsed, 0);
const totalComputeMs = main.reduce((sum, e) => sum + e.computeMilliseconds, 0);
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const report = {
  schema: 'geoguard-restricted-player-report-v1', date: '2026-10-01',
  method: 'Three isolated-context agents; semantic screen observations; normal campaign; human-like action latency; three fixed scenarios; versioned policies.',
  scope: { mainEpisodes: main.length, auxiliaryEpisodes: episodes.length - main.length,
    maxWaveReached: Math.max(...main.map(e => e.waveReached)),
    simulatedSeconds: Math.round(totalSeconds * 10) / 10,
    coreComputeMilliseconds: Math.round(totalComputeMs * 10) / 10,
    simulatedSecondsPerCoreComputeSecond: Math.round(totalSeconds / (totalComputeMs / 1000)),
    includesHttpAndDecisionCost: false, allSummariesMatchServerAudit: true },
  provenance: Object.fromEntries(['scripts/player-sim/engine.mjs', 'scripts/player-sim/server.mjs',
    'docs/player-simulation-api.md', ...['novice', 'builder', 'mobile'].map(r => `.tmp/player-playtest/clients/${r}.mjs`)].map(p => [p, hash(p)])),
  limitations: ['Semantic observations do not model visual detection, audio, UI occlusion, reading or touch errors.',
    'Information restriction combines API whitelist and agent protocol, not an OS sandbox.',
    'Adaptive policy versions and repeated seeds are not independent samples for population win-rate estimates.',
    'Earlier line-avoidance errors and later tower/search policy weaknesses confound balance conclusions.',
    'Coverage reaches wave 9, not every Boss or endgame; timeout/stopped does not mean victory.',
    'Headless orchestration reuses production runtime modules but is not a browser input/rendering test.'],
  episodes,
};
writeFileSync('docs/player-playtest-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.scope, null, 2));
