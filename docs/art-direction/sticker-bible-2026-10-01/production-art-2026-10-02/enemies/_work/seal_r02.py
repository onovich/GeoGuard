from pathlib import Path
import json, hashlib

ROOT=Path('D:/WebProjects/GeoGuard')
BIBLE=ROOT/'docs/art-direction/sticker-bible-2026-10-01'
OWNER=BIBLE/'production-art-2026-10-02/enemies'
REV=OWNER/'submissions/r02'
assert not (REV/'packet.json').exists(), 'Submitted revision is immutable'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,data):p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
doc=read(REV/'production-split.json')
idx=read(REV/'final-index.json')
validation=read(REV/'integrity-check.json')
assert len(doc['actions'])==77 and len(idx['items'])==14
assert validation['checks']['all77BodySourcesExist']
assert len(list((REV/'images').glob('*.png')))==6
for f in read(OWNER/'submissions/r01/packet.json')['files']:
    assert sha(OWNER/f['path'])==f['sha256'], 'r01 must remain immutable'
paths=[p for p in sorted(REV.rglob('*'))if p.is_file()]
retained=[OWNER/'submissions/r01/images'/name for name in['basic-root-lock.png','beacon-body-only.png','shard-splinter-separate.png']]
paths+=retained
files=[{'path':str(p.relative_to(OWNER)).replace('\\','/'),'sha256':sha(p)}for p in paths]
packet={'owner':'enemies','revision':'r02','status':'submitted','scope':'final concept keypose set:6 new two-identity body-only boards for remaining12 identities + retained approved BASIC/BEACON,14 existing enemy IDs / all77 concrete action-source mappings; no continuous resources or code integration',
 'files':files,
 'images':[{'path':image['path'],'requiresMainReviewerView':True,'status':'final candidate pending main review','purpose':purpose}for image,purpose in zip(validation['images'],['FAST/TANK root/body/anatomy','SHARD/SPLINTER complete deformation and independent body','SHIELD/MEDIC organs and independent effects','BOMBER/JAMMER organs and independent blast/aura','PHASE/BURROWER complete single entities','SIEGE top / SCOUT bottom, body-only targets'])],
 'coveredIds':[x['id']for x in idx['items']],
 'coveredActions':[r['key']for r in doc['actions']],
 'openIssues':['Six new final concept boards await main actual image review; author does not self-approve.','03-shield-medic GUARD label retains a very faint vertical annotation trace; only the baseline mint cross is the root. No body or extra organ affected.','Root numeric coordinates remain approved design convention; no continuous frames/source atlas/alpha sprite/vector source/integration/performance supplied or certified.'],
 'dependencies':[{'owner':'enemies','revision':'r01','scope':'retained BASIC/BEACON boards and supplemental SHARD/SPLINTER independent relationship diagram','status':'accepted; review in reviews/enemies-r01.md; original file hashes rechecked unchanged'}, {'owner':'effects-ui','scope':'independent effect requirements retained in production-split.json; no effect drawn in body cells','status':'main coordinator owns cross-group effect acceptance; enemy body concept review can proceed'}, {'owner':'bosses-mechanics','scope':'current HIVE spawnHive=NEST; NEST tick=BASIC; summonSwarm fallback=SHARD','status':'r01 current runtime chain retained; no NEST body authored in enemy group'}],
 'summary':'Remaining12 enemy identities completed in6 built-in image_gen body-only root/keypose boards. SHARD/SPLINTER keep full deforming bodies, children separate. Final index shows only current enemy boards, complete77 source mappings specify row/column/label and explicit MOVE reuse. Runtime entry/optimized/fallback boundaries retained. Only enemies directory written; no game source, parameters, integration, commit or deployment. Stop after submission and await main instructions.'}
write(REV/'packet.json',packet)
for f in read(REV/'packet.json')['files']:assert sha(OWNER/f['path'])==f['sha256']
assert len(read(REV/'packet.json')['images'])==6
for p in paths+[REV/'packet.json']:
    if p.suffix in{'.json','.md','.txt','.html'}:
        raw=p.read_bytes();assert not raw.startswith(b'\xef\xbb\xbf');raw.decode('utf-8')
        if p.suffix=='.json':json.loads(raw)
tmp=OWNER/'READY.tmp.json'
write(tmp,{'revision':'r02','packetPath':'submissions/r02/packet.json'})
tmp.replace(OWNER/'READY.json')
assert set(read(OWNER/'READY.json'))=={'revision','packetPath'}
print(json.dumps({'revision':'r02','packetPath':str(REV/'packet.json'),'READY':read(OWNER/'READY.json'),'manifestFiles':len(files),'newFinalImages':6,'retainedBodies':2,'ids':14,'actions':77,'hashesVerified':True,'r01Unchanged':True,'utf8NoBom':True},ensure_ascii=False,indent=2))
