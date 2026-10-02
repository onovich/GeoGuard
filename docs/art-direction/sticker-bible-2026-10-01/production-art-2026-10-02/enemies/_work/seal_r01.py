from pathlib import Path
import json, hashlib, struct

ROOT=Path('D:/WebProjects/GeoGuard')
BIBLE=ROOT/'docs/art-direction/sticker-bible-2026-10-01'
OWNER=BIBLE/'production-art-2026-10-02/enemies'
REV=OWNER/'submissions/r01'
assert not (REV/'packet.json').exists(), 'Do not alter submitted revision'
def write(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def read(path):return json.loads(path.read_text(encoding='utf-8'))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
lock=read(BIBLE/'action-consistency/anatomy-lock.json')
doc=read(REV/'production-split.json')
expected={f"enemy:{x['id']}:{a['action']}"for x in lock['items']if x['group']=='enemy'for a in x['actions']}
actual={a['key']for a in doc['actions']}
assert len(actual)==77 and actual==expected
assert {x['id']for x in doc['identities']}=={x['id']for x in lock['items']if x['group']=='enemy'}
fields={'bodyResource','fixedRoot','parts','muzzleAnchors','independentProjectiles','independentSummons','independentMechanics','effects','logicMovementHint','runtimeEvidence','reuse','productionStatus'}
for action in doc['actions']:
    assert fields<=set(action),action['key']
    assert action['runtimeId']==action['id']
    assert action['fixedRoot']['coordinates']==[256,416]
    assert action['runtimeEvidence']
    assert not action['muzzleAnchors'] and not action['independentProjectiles']
    assert all(f in doc['effectRequirements']for f in action['effects'])
    for e in action['runtimeEvidence']:
        file=ROOT/e['path'];lines=file.read_text(encoding='utf-8-sig').splitlines()
        assert 1<=e['start']<=e['end']<=len(lines),e
    for entity in action['independentSummons']:
        assert entity['id'] in {x['id']for x in doc['identities']}
        assert entity['ownRoot'] and entity['ownUidHpBehavior'] and entity['notBodyPart']
mapping=read(REV/'runtime-mapping.json')
assert mapping['currentHandlerCount']==37
assert mapping['handlerOutputs']['spawnHive']=='NEST独立机关'
assert 'summonSwarm'not in mapping['handlerOutputs']
assert 'summonSwarm'in mapping['fallbackAbilitiesVerifiedNoHandler']
for p in REV.rglob('*'):
    if p.is_file() and p.suffix in {'.json','.md','.txt'}:
        b=p.read_bytes();assert not b.startswith(b'\xef\xbb\xbf'),p
        b.decode('utf-8')
        if p.suffix=='.json':json.loads(b)
sizes=[]
for p in sorted((REV/'images').glob('*.png')):
    b=p.read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n'
    w,h=struct.unpack('>II',b[16:24]);sizes.append({'file':str(p.relative_to(OWNER)).replace('\\','/'),'width':w,'height':h,'sha256':sha(p)})
assert len(sizes)==3
assert sum(a['sampleCoverage']for a in doc['actions'])==9
check={'owner':'enemies','revision':'r01','status':'submission integrity verified; main acceptance pending','checks':{'exactAnatomyLockIds':14,'exactAnatomyLockActionKeys':77,'sampleReferenceActions':9,'noDuplicateActions':True,'requiredSplitFieldsPresent':True,'allEvidenceFilesAndLineRangesExist':True,'allEffectsDefined':True,'allSummonIdsExisting':True,'allSummonsIndependent':True,'noOrdinaryEnemyMuzzlesOrProjectiles':True,'rootProposalConsistent':True,'optimizedHandlerCount':37,'utf8NoBom':True,'pngCount':3},'images':sizes,'visualReview':'creator observations in creator-check.md; main reviewer pre-review supplied but formal acceptance waits packet/READY. No self-approved assets.'}
write(REV/'integrity-check.json',check)
files=[{'path':str(p.relative_to(OWNER)).replace('\\','/'),'sha256':sha(p)}for p in sorted(REV.rglob('*'))if p.is_file()]
packet={'owner':'enemies','revision':'r01','status':'submitted','scope':'gate-1: complete 14 enemy / 77 reference-action production split + BASIC fixed-root, BEACON body-only summon and SHARD/SPLINTER independent-identity sample boards','files':files,'images':[{'path':i['file'],'purpose':purpose,'requiresMainReviewerView':True}for i,purpose in zip(sizes,['BASIC five buds/two feet in-place root standard','BEACON own timer body-only; independent BASIC box','SHARD connected parent and independent SPLINTER units'])], 'coveredIds':[x['id']for x in doc['identities']],'coveredActions':[a['key']for a in doc['actions']],'openIssues':['Only 9 reference actions visually demonstrated in 3 concept boards; remaining new artwork held for explicit gate-1 approval.','Root/collision numeric coordinates are design proposal, not generated-page measurements; source and every animation frame require later verification.','Concept boards do not deliver editable vector source, transparent sprites, atlas, integration or performance evidence.','Default and optimized runtime mapping overrides replace stale base-only spawnHive claim; other groups must consume current entry-chain evidence.'],'dependencies':[{'owner':'effects-ui','scope':'separate common state/death/contact feedback + shield/aura/blast/phase/emerge/summon requirements from production-split.json','status':'described for main coordination; not artwork delivered here','neededFor':'future production completeness, not this concept sample review'},{'owner':'bosses-mechanics','scope':'HIVE current spawnHive MECHANIC_NEST; NEST triggers BASIC; do not reuse BEACON body as NEST','status':'runtime evidence supplied; NEST production owned by bosses-mechanics','neededFor':'cross-group mapping validation'}],'summary':'All14 existing enemy IDs and all77 reference actions have body/root/part/projectile/entity/effect/movement/evidence/reuse/status ownership. Three built-in image_gen boards preserve fixed anatomy and separate entities. Current entry→optimized→fallback checked, including37 optimized handlers and13 enemy-relevant override differences. No src, logic parameters, integrations, Git commits or deployments changed. Awaiting main review; stop after seal.'}
write(REV/'packet.json',packet)
for item in read(REV/'packet.json')['files']:
    assert sha(OWNER/item['path'])==item['sha256'],item
ready_temp=OWNER/'READY.tmp.json'
write(ready_temp,{'revision':'r01','packetPath':'submissions/r01/packet.json'})
ready_temp.replace(OWNER/'READY.json')
assert set(read(OWNER/'READY.json'))=={'revision','packetPath'}
print(json.dumps({'packetPath':str(REV/'packet.json'),'READY':read(OWNER/'READY.json'),'manifestFiles':len(files),'ids':14,'actions':77,'sampleActions':9,'sha256Verified':True,'utf8NoBom':True,'images':sizes},ensure_ascii=False,indent=2))
