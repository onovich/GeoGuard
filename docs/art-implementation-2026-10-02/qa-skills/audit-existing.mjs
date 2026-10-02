import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const owner = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(owner, '../../..');
const sourceName=process.argv[2]??'actual-skills-02';
const source = path.resolve(owner, '../qa/submissions/r04/runs',sourceName);
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const coverage = JSON.parse(fs.readFileSync(path.join(owner, 'submissions/r01/coverage.json')));
const records = [], references = [];
for (const file of fs.readdirSync(source).filter(f => f.endsWith('-report.json'))) {
  const reportPath = path.join(source, file), report = JSON.parse(fs.readFileSync(reportPath));
  references.push({ path: relative(reportPath), sha256: sha(reportPath) });
  for (const cast of report.casts ?? []) {
    const stages = {}, files = [];
    for (const [stage, evidence] of Object.entries(cast.evidence ?? {})) {
      const snapshotPath = path.join(source, evidence.state), pngPath = path.join(source, evidence.image);
      const data = JSON.parse(fs.readFileSync(snapshotPath));
      const state = data.snapshot.semantic.state, boss = state.enemies.find(e => e.uid === data.snapshot.semantic.state.enemies.find(e => e.isBoss && (e.twinRole ?? 'boss') === cast.role)?.uid);
      stages[stage] = { frame: data.frame, time: data.gameTime, mode: boss?.bossState?.actionMode, ability: boss?.bossState?.castAbility, cooldown: boss?.abilityCooldowns?.[cast.ability], uid: boss?.uid, hp: boss?.hp,
        droppedEvents: data.snapshot.control.droppedEvents, liveBossOwnedChildren: state.enemies.filter(e => e.summonedByBossUid === boss?.uid).map(e => ({ uid:e.uid,id:e.id,mechanic:e.mechanic })),
        ownedHazards: state.hazards.filter(h => h.ownerBossUid === boss?.uid || (boss?.encounterUid && h.ownerEncounterUid === boss.encounterUid)),
        bossScreen:boss?{x:720+(boss.x-state.camera.x)*1.25,y:450+(boss.y-state.camera.y)*1.25}:null,
        money: state.money, infiniteMoney: state.debugOptions.infiniteMoney };
      for (const p of [snapshotPath,pngPath]) files.push({ path: relative(p), sha256: sha(p) });
    }
    const w = stages.windup, e = stages.execute, r = stages.recover;
    const lifecycle = Boolean(w?.mode === 'windup' && ['attack','recover'].includes(e?.mode) && r?.mode === 'recover' && w.uid === e.uid && e.uid === r.uid && w.time < e.time && e.time <= r.time && e.cooldown > w.cooldown && !Object.values(stages).some(s=>s.droppedEvents));
    records.push({ skill: cast.ability, key: cast.key, report: relative(reportPath), stages, files, actualLifecycleVerified: lifecycle,
      bossVisibleAllStages:Object.values(stages).every(s=>s.bossScreen&&s.bossScreen.x>0&&s.bossScreen.x<1440&&s.bossScreen.y>0&&s.bossScreen.y<900),
      effectReview: ['stealMoney','repossess'].includes(cast.ability) && e?.infiniteMoney ? 'effect_not_observed_infiniteMoney_suppresses_courier' : 'requires_geometry_child_and_visual_review',
      visualStatus:'not_reviewed', scope:'Read-only reference to original author files, per-file SHA pinned; not complete skill approval' });
  }
}
const seen = new Set(records.filter(r=>r.actualLifecycleVerified).map(r=>r.skill));
const audit = { auditedAt:new Date().toISOString(), reports:references.length, candidateFingerprint:'f353ca072173dfb8e63f4b06506f0e4ad345cecc276fab8bfedf163d18ec3ac6',
  observations:{ uniqueLifecycleSkills:seen.size, verifiedCastRecords:records.filter(r=>r.actualLifecycleVerified).length,
    missingSkills:coverage.skills.filter(s=>!seen.has(s.ability)).map(s=>s.ability),bossVisibleAllStages:records.filter(r=>r.bossVisibleAllStages).length,
    observerIssue:'Runner resets per-node cooldowns via original Phase button before each bounded first cast. Initially earliest node becomes ready before later nodes, even though abilityCursor persists. It returns as soon as first cast recovers. Repeated Phase cycles therefore bias first skill. No product AI defect asserted.' }, references, records };
fs.writeFileSync(path.join(owner,sourceName+'-audit.json'),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({reports:audit.reports,...audit.observations}));
