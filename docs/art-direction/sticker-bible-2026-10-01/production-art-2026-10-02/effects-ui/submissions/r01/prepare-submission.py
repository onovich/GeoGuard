"""Seal r01 once. All writes are confined to this group's folder; no game source writes."""
from pathlib import Path
import json, hashlib, struct, os

ROOT=Path('D:/WebProjects/GeoGuard')
OUT=Path(__file__).resolve().parent
GROUP=OUT.parent.parent
assert GROUP.name=='effects-ui' and OUT.name=='r01'
if (OUT/'packet.json').exists(): raise SystemExit('Revision already sealed; do not overwrite it.')
def write(name,value):
    (OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()

source_paths=[
 'src/data/gameConfig.js','src/data/bossMechanics.js','src/data/bossPresentation.js',
 'src/logic/engine/combatOffenseRuntime.js','src/logic/engine/combatFrameRuntime.js',
 'src/logic/engine/combatRules.js','src/logic/engine/battlefieldRules.js',
 'src/logic/engine/bossAbilityRuntime.js','src/logic/engine/bossOptimizedAbilities.js',
 'src/logic/engine/bossMechanicEntities.js','src/logic/engine/bossCombatRuntime.js',
 'src/logic/engine/bossHudRuntime.js','src/logic/engine/bossAuthoringRules.js',
 'src/logic/engine/encounterRuntime.js','src/logic/engine/entitySpawnRuntime.js',
 'src/logic/engine/enemyBehaviorRuntime.js','src/logic/engine/enemyDefeatRuntime.js',
 'src/logic/engine/towerRules.js','src/logic/engine/rewardRules.js','src/logic/engine/rewardFlowRuntime.js',
 'src/logic/hooks/useGeoGuardGame.jsx','src/logic/hooks/useGameAudio.js',
 'src/view/canvas/canvasRenderer.js','src/view/screens/GameScreen.jsx',
 'src/view/components/GameHud.jsx','src/view/components/BuildBar.jsx',
 'src/view/components/TowerContextMenu.jsx','src/view/components/WaveRewardOverlay.jsx',
 'src/view/components/OverlayScreen.jsx','src/view/components/StatusBanner.jsx',
 'docs/art-direction/sticker-bible-2026-10-01/art-replacement-plan.md',
 'docs/art-direction/sticker-bible-2026-10-01/action-consistency/anatomy-lock.json',
 'docs/art-direction/sticker-bible-2026-10-01/action-consistency/production-notes.md',
 'docs/art-direction/sticker-bible-2026-10-01/hazards-01.png',
 'docs/art-direction/sticker-bible-2026-10-01/usability-refinement/ui-player-04-v3.png',
 'docs/art-direction/sticker-bible-2026-10-01/action-consistency/pilot-01-basic-tower-v4.png',
 'docs/art-direction/sticker-bible-2026-10-01/action-consistency/batch-06-cannon-sniper.png',
]
write('source-fingerprints.json',{'purpose':'read-only evidence snapshot; source may change after submission',
 'files':[{'path':p,'sha256':digest(ROOT/p)} for p in source_paths]})

source_map=json.loads((OUT/'boss-source-map.json').read_text(encoding='utf-8'))
catalog=json.loads((OUT/'runtime-catalog.json').read_text(encoding='utf-8'))
index={r['ability']:r for r in source_map['abilities']}
active_bodies=[b for b in catalog['bosses'] if b['id']!='TWINS']+catalog['twins']
used=set(a for b in active_bodies for p in b['phases'] for a in p['abilities'])|{'soloSolarVolley','soloLunarOrbit'}
assert len(active_bodies)==17 and len(used)==95 and used<=index.keys()
assert len(index)==100 and sum(r['handler']=='optimized' for r in index.values())==37
for r in index.values():
    assert digest(ROOT/r['source']['path'])==r['source']['sha256'],r['ability']

image_files=['vfx-projectile-flash-hit.png','hud-desktop-mobile.png']
image_info=[]
for name in image_files:
    data=(OUT/name).read_bytes()
    assert data.startswith(b'\x89PNG\r\n\x1a\n') and len(data)>100000
    width,height=struct.unpack('>II',data[16:24])
    image_info.append({'path':name,'width':width,'height':height,'bytes':len(data),'sha256':digest(OUT/name),
      'visualWorkSessionReview':'generated result actually viewed; main review pending',
      'imported':False,'productionReady':False})
write('verification.json',{'date':'2026-10-02','revision':'r01',
 'method':'source mapping, file integrity and work-session visual inspection only',
 'counts':{'bossTemplates':16,'runtimeBossBodies':17,'runtimeUniqueSkillsIncludingSolo':95,'supportedSourceHandlers':100,'optimizedHandlers':37,'projectileKinds':3,'friendlySourceAppearances':10,'selectedDesignImages':2},
 'images':image_info,
 'checks':{'runtimeSkillSourceCoverage':True,'sourceHashesStillMatch':True,'noBodyOnVfxSheet':True,
           'hudCostAndLevelTextChecked':True,'hudTwinsGuardCountRemoved':True,'hudTwinsActualDataChecked':True,
           'noPaidUpgradeOrSoundEntryShown':True,'conceptNotScreenshotLabelPresent':True},
 'notRun':['game integration','npm tests/build','device layout test','animation every-frame audit','performance test'],
 'mainReviewStatus':'submitted, not accepted'})

for p in OUT.iterdir():
    if p.suffix in {'.md','.json','.py'}:
        raw=p.read_bytes(); assert not raw.startswith(b'\xef\xbb\xbf'),p.name
        raw.decode('utf-8')
files=[{'path':p.relative_to(GROUP).as_posix(),'sha256':digest(p)} for p in sorted(OUT.iterdir()) if p.is_file()]
packet={'owner':'effects-ui','revision':'r01','status':'submitted',
 'scope':'Complete independent effect/battlefield/player UI source inventory plus two design samples; no body production, code integration or game changes.',
 'files':files,'images':[(OUT/n).relative_to(GROUP).as_posix() for n in image_files],
 'coveredIds':['projectile:basic','projectile:cannon','projectile:sniper','hero:PLAYER']+
    ['tower:'+x for x in catalog['towers']]+['boss:'+b['id'] for b in active_bodies]+
    ['mechanic:'+x for x in ['NEST','WEB','ROOT','WALL','SEAL','RETICLE','COURIER']]+
    ['effect:flash','effect:trail','effect:hit','effect:hazards','effect:terrain','effect:summon','effect:status','effect:OPEN','world:ground','world:shadow','world:levelBadge','world:drop','ui:GameHud','ui:BuildBar','ui:WaveRewardOverlay','ui:OverlayScreen','ui:StatusBanner','ui:pause'],
 'coveredActions':['skill:'+a for a in sorted(used)]+['projectile/flash/hit design','desktop/mobile battle HUD and build bar design'],
 'openIssues':[
   'Samples are design boards only; editable layers, alpha assets, numeric pivots, animation and runtime dimensions remain future production work.',
   'Authoring library names tailSweep but no current same-name ability handler found; do not invent art for it.',
   'Player audio props exist without a rendered control; any new audio UI needs later scope decision.'
 ],
 'dependencies':['Explicit main review approval before batch expansion','Friendly emitter anchors/axes and approved neutral icon masters','Enemy and Boss/mechanic independent-effect requests transferred by main review'],
 'summary':'3 projectile motion kinds and 10 source appearances separated; all 17 runtime Boss bodies/95 skills mapped plus supported-template appendix; 37 optimized differences; HIVE=NEST→BASIC, swarm=SHARD; COURIER immediate refund; BURST four organs with runtime five-shot level3 respected. Two built-in imagegen design sheets actually viewed; waiting for main review.'}
write('packet.json',packet)
for entry in packet['files']: assert digest(GROUP/entry['path'])==entry['sha256']
ready={'revision':'r01','packetPath':'submissions/r01/packet.json'}
tmp=GROUP/'READY.json.tmp'
tmp.write_text(json.dumps(ready,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
os.replace(tmp,GROUP/'READY.json')
print(json.dumps({'submitted':True,'revision':'r01','files':len(files),'images':image_info,'ready':str(GROUP/'READY.json')},ensure_ascii=False))
