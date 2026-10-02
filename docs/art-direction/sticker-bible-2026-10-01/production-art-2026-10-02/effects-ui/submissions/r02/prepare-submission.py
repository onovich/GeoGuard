"""Verify art references and atomically submit only effects-ui r02."""
from pathlib import Path
import json,hashlib,struct,re,subprocess,os

ROOT=Path('D:/WebProjects/GeoGuard')
OUT=Path(__file__).resolve().parent
GROUP=OUT.parent.parent
assert GROUP.name=='effects-ui' and OUT.name=='r02'
if (OUT/'packet.json').exists():raise SystemExit('Sealed revision. Do not rewrite.')
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name,d): (OUT/name).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

split=read(OUT/'production-split.json'); cells=read(OUT/'cell-catalog.json')['cells']
deps=read(OUT/'upstream-dependencies.json')
for dep in deps['readOnlyApprovedInputs']:
 assert sha(ROOT/dep['path'])==dep['sha256'],dep['owner']
 assert sha(ROOT/dep['approvalEvidence'])==dep['approvalSha256'],dep['owner']
for dep in deps['additionalContracts']:assert sha(ROOT/dep['path'])==dep['sha256']
expected={'friendly':'r03','enemies':'r02','bosses-mechanics':'r03'}
assert {v['owner']:v['revision'] for v in deps['readOnlyApprovedInputs']}==expected

source=read(GROUP/'submissions/r01/source-fingerprints.json')
for f in source['files']:assert sha(ROOT/f['path'])==f['sha256'],f['path']
write('source-fingerprints.json',{'purpose':'r02 uses unchanged runtime/art authority evidence, with current final upstream contracts independently hashed','files':source['files']})
oldpacket=read(GROUP/'submissions/r01/packet.json')
for f in oldpacket['files']:assert sha(GROUP/f['path'])==f['sha256'],f['path']
used={k for k,v in split['abilityCatalog'].items() if v['standardOrSurvivor']}
assert len(used)==95 and sum(v['defaultEncounter'] for v in split['abilityCatalog'].values())==93
assert sum(v['availability']=='survivor-added' for v in split['abilityCatalog'].values())==2
boss_dep=next(x for x in deps['readOnlyApprovedInputs'] if x['owner']=='bosses-mechanics')
handoff=read((ROOT/boss_dep['path']).parent/'effects-handoff.json')
assert used==set(handoff['defaultAbilityIds'])|set(handoff['survivorAbilities'])
assert split['abilityCatalog']['tailSweep']['effectCells']==[]
assert len(cells)==57
for key,c in cells.items():assert (OUT/c['file']).is_file(),key
counts={k:len(split[k]) for k in ['friendly','enemies','bossMechanicReferences']}
assert counts=={'friendly':106,'enemies':77,'bossMechanicReferences':192}
for category in counts:
 rows=split[category];assert len({r['key'] for r in rows})==len(rows)
 for r in rows:assert all(k in cells for k in r['effectCells']),r['key']
for aid,row in split['abilityCatalog'].items():
 for g in row['geometryMappings']:assert g['cell'] in row['effectCells'],aid
 for k in row['effectCells']:assert k in row['lifecycleByCell'],aid
 if row['standardOrSurvivor']:assert row['windupCell'] and row['openingCell'] and row['sourceHandlerExcerpt'],aid
for r in split['friendly']:
 assert 'r03' in r['directionRule'] and 'currentDirectionReuse' in r
 if r['key'].startswith('hero:PLAYER'):assert not r['upstreamMuzzleAnchors']
assert sum(':DIR_LEFT' in r['key'] for r in split['friendly'])==10
assert sum(':DIR_UP' in r['key'] for r in split['friendly'])==9

selected=[
 ('B01','b01-friendly-projectiles.png','exec-37628f88-5548-40d4-9e4b-a1bf105b29b7.png','P01–P10 source order; isolated projectile and flash; no body; BURST four anchors/five shots note'),
 ('B02','b02-status-world.png','exec-97fdd312-d0d1-4be8-9b56-eca1f5326ad3.png','S01–S16 isolated overlays; empty OPEN brackets; 1/2/3/4 external dots; no organs or bodies'),
 ('B03','b03-hazard-lifecycle.png','exec-56205aac-abe2-4410-bd7a-338ebb5c29b5.png','H01–H04 three columns; ring remains disk; crossed actual strips no square; fade no extra damage'),
 ('B04','b04-mechanic-feedback.png','exec-70823475-941e-446c-9ebb-46ce307d8082.png','M01–M12 separated terrain, UID success, generic fragments, links, immediate refund and true drop; no mechanic body'),
 ('B05','b05-start-end.png','exec-8d7cc71c-a926-4cf9-9ed5-c092beeac273.png','U01/U02 exact titles/description/CTA; example end numbers; light green white CTA overridden by color spec'),
 ('B06','b06-rewards-blueprints.png','exec-d7ee7581-1db0-4021-8b03-09cb5349bb0d.png','U03 desktop/mobile exactly3 cards, repair alternate separate, future builds only; cost15→20 subsidy5 and frost55 example stats'),
 ('B07','b07-controls-placement.png','exec-5f1b43d2-32c6-4e47-87cf-cae3e405a335.png','U06–U11 pause/title/control hints/temporary touch/placement/build states; deep text; scroll arrows annotations, no additional buttons')]
generated=Path('C:/Users/Administrator/.codex/generated_images/01a0f8ba-9c8d-7f00-8a57-d23c8a2df300')
prompts=read(OUT/'prompts.json');assert len(prompts)==7
images=[];records=[]
for (board,name,original,inspection),prompt in zip(selected,prompts):
 assert prompt['id']==board and prompt['file']==name
 p=OUT/name;raw=p.read_bytes()
 assert raw[:8]==b'\x89PNG\r\n\x1a\n' and len(raw)>100000
 w,h=struct.unpack('>II',raw[16:24]);assert w>=1500 and h>=990
 assert sha(p)==sha(generated/original),name
 images.append({'board':board,'path':name,'sha256':sha(p),'bytes':len(raw),'width':w,'height':h,'actualWorkSessionInspection':inspection,'imported':False,'productionReady':False})
 records.append({'board':board,'selectedFile':name,'originalGeneratedFile':(generated/original).as_posix(),'tool':'built-in image_gen.imagegen','referencePaths':prompt['refs'],'referencesActuallyViewed':True,'transparentBackground':False,'promptEntry':'prompts.json#'+board,'selectedImageActuallyViewed':True})
write('generation-record.json',{'date':'2026-10-02','generated':records,'productionForm':'opaque design sheets, not alpha sprites','interimMainImageReview':{'B01':'visually passed','B02':'visually passed','B03':'visually passed; exact runtime geometry required','B04':'composition/independent entity boundaries passed','B05':'composition passed; text contrast addressed by ui-color-type-spec.md','B06':'formal packet review pending','B07':'formal packet review pending'},'overallReview':'submitted, pending formal packet acceptance'})

index=(OUT/'index.html').read_text(encoding='utf-8')
scripts=re.findall(r'<script>([\s\S]*?)</script>',index)
assert len(scripts)==1
syntax=subprocess.run(['node','--check'],input=scripts[0],text=True,encoding='utf-8',capture_output=True)
assert syntax.returncode==0,syntax.stderr
embedded=json.loads(re.search(r'<script type="application/json" id="data">([\s\S]*?)</script>',index)[1])
assert len(embedded['abilities'])==95 and len(embedded['assignments'])==375
for img in re.findall(r'<img src="([^"]+)"',index):assert (OUT/img).is_file(),img
write('verification.json',{'date':'2026-10-02','revision':'r02','method':'source contract/code checks, integrity, index script syntax, and actual native image viewing','counts':split['counts']|{'cellCount':len(cells),'newImages':len(images),'retainedImages':2,'referenceAssignmentsVerified':sum(counts.values())},'images':images,
 'checks':{'finalUpstreamRevisionsAndReviewHashesMatch':True,'all95SkillIdsMatchFinalBossHandoff':True,'375ActionKeysUniqueAndCellsResolved':True,'runtimeAndApprovedR01HashesUnchanged':True,'currentFriendlyDirectionalRigPreserved':True,'exactGeometrySourceCallsOrMechanicTimerMapped':True,'noBodiesInFxBoards':True,'uiSourceTextAndExampleNumbersReviewed':True,'b05TextColorSpecOverridesPaleWhiteButton':True,'uiNumbersAndDimensionsNotRuntimeCertification':True,'indexJavaScriptSyntaxAndEmbeddedCounts':True,'textUtf8WithoutBom':True},
 'notRun':['game build/tests or integration','device layout/contrast measurements','animation frame or numeric anchor verification','alpha/atlas production'], 'overallReview':'submitted, pending formal main review'})
for p in OUT.iterdir():
 if p.is_file() and p.suffix in {'.json','.md','.py','.html'}:
  raw=p.read_bytes();assert not raw.startswith(b'\xef\xbb\xbf'),p.name;raw.decode('utf-8')
files=[{'path':p.relative_to(GROUP).as_posix(),'sha256':sha(p)} for p in sorted(OUT.iterdir()) if p.is_file()]
covered_actions=[r['key'] for key in counts for r in split[key]]+['skill:'+k for k in sorted(used)]+[k for k in cells if k.startswith(('B05/','B06/','B07/'))]
packet={'owner':'effects-ui','revision':'r02','status':'submitted','scope':'Seven independent effects/world/player UI design sheets; 95 exact skill mappings and 375 external reference assignments; art only.',
 'files':files,'images':[(OUT/name).relative_to(GROUP).as_posix() for _,name,_,_ in selected],
 'retainedApprovedImages':['submissions/r01/vfx-projectile-flash-hit.png','submissions/r01/hud-desktop-mobile.png'],
 'coveredIds':sorted(set(r['key'].rsplit(':',1)[0] for key in counts for r in split[key]))+list(cells),
 'coveredActions':covered_actions,'counts':split['counts'],'dependencies':deps,
 'openIssues':['Design sheets only; alpha assets, source layers, atlas, animation and numeric anchors remain future production work.','UI dynamic numbers/device dimensions are examples; actual layout/contrast/device verification not performed.','No handler for tailSweep; no art invented. Five legacy handlers retained outside default encounter scope.','Projectile source appearance discriminator and successful shot/child visual event hookup remain future integration dependencies.','Audio props currently have no rendered player control; proposal deferred.'],
 'summary':'B01–B07 complete; retained r01 HIT/HUD; final friendly r03, enemies r02 and bosses-mechanics r03 dependencies and directional P/M contract. Actual area/line/terrain/RETICLE geometry and lifetimes, 10 appearances vs3 motion kinds, BURST4holes/5shots, whole-body OPEN, COURIER direct refund and BEACON attempt/success separation. B05 dark text override specified. Formal review pending; no src/gameplay/resource integration/commit/deployment.'}
write('packet.json',packet)
for f in packet['files']:assert sha(GROUP/f['path'])==f['sha256'],f['path']
ready={'revision':'r02','packetPath':'submissions/r02/packet.json'}
tmp=GROUP/'READY.json.tmp';tmp.write_text(json.dumps(ready,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');os.replace(tmp,GROUP/'READY.json')
print(json.dumps({'submitted':True,'revision':'r02','files':len(files),'images':len(images),'skills':len(used),'assignments':sum(counts.values()),'packetSha256':sha(OUT/'packet.json'),'ready':ready},ensure_ascii=False))
