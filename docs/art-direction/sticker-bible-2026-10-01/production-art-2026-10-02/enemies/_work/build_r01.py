from pathlib import Path
import json, hashlib, re

ROOT = Path('D:/WebProjects/GeoGuard')
BIBLE = ROOT / 'docs/art-direction/sticker-bible-2026-10-01'
OWNER = BIBLE / 'production-art-2026-10-02/enemies'
OUT = OWNER / 'submissions/r01'
assert not (OUT / 'packet.json').exists(), 'Submitted revision is immutable'
LOCK = json.loads((BIBLE / 'action-consistency/anatomy-lock.json').read_text(encoding='utf-8-sig'))
ITEMS = [x for x in LOCK['items'] if x['group'] == 'enemy']

def write(name, value):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text((json.dumps(value, ensure_ascii=False, indent=2) if not isinstance(value, str) else value) + '\n', encoding='utf-8')

def ev(path, start, end, claim):
    return {'path': path, 'start': start, 'end': end, 'claim': claim}

CONFIG = 'src/data/gameConfig.js'
BEHAVIOR = 'src/logic/engine/enemyBehaviorRuntime.js'
ENTRY = 'src/logic/hooks/useGeoGuardGame.jsx'
OPT = 'src/logic/engine/bossOptimizedAbilities.js'
FALLBACK = 'src/logic/engine/bossAbilityRuntime.js'
SPAWN = 'src/logic/engine/entitySpawnRuntime.js'
DEFEAT = 'src/logic/engine/enemyDefeatRuntime.js'
MECH = 'src/logic/engine/bossMechanicEntities.js'
ENCOUNTER = 'src/logic/engine/encounterRuntime.js'
COMMON = [ev(ENTRY,891,921,'实际逐敌行为更新与死亡结算入口'), ev(BEHAVIOR,72,124,'目标选择、世界位置更新和持续接触伤害；普通敌人没有命名攻击动画状态机')]
design_root = {'canvas':[512,512], 'root':[256,416], 'collisionCenter':[256,256], 'collisionCenterMinusRoot':[0,-160], 'units':'design pixels', 'status':'proposed design coordinates, not measurements of generated PNGs', 'runtimeAlignment':'world enemy.x/y remains collisionCenter; rendered art root placed at world center + scaled (0,160); existing radius untouched', 'precisionGate':'source artwork and every exported frame must later verify the exact coordinates; page guides are schematic'}

# All attachment names belong to the parent body. No per-part HP, UID or AI.
PARTS = {
 'BASIC':['body','bud_12','bud_2','bud_4','bud_8','bud_10','foot_L','foot_R','eye_L','eye_R','mouth'],
 'FAST':['body','ear_L','ear_R','hindfoot_L','hindfoot_R','side_flap','eye_L','eye_R','mouth'],
 'TANK':['body','top_lobe_1','top_lobe_2','top_lobe_3','fist_L','fist_R','foot_L','foot_R','brow_slot','mouth','tooth'],
 'SHARD':['body_lobe_top','body_lobe_L','body_lobe_R','crease_top_1','crease_top_2','crease_L_1','crease_L_2','crease_R_1','crease_R_2','mouth','tooth'],
 'SPLINTER':['body','eye'],
 'SHIELD':['body','soft_shield_lobe','rear_fist','foot_L','foot_R','eye_anchor'],
 'MEDIC':['body_lobe_1','body_lobe_2','body_lobe_3','body_lobe_4','curl_arm_L','curl_arm_R','foot_L','foot_R','cream_cross'],
 'BOMBER':['body','bent_fuse_bud','cheek_arm_L','cheek_arm_R','foot_L','foot_R','eye_slot_L','eye_slot_R','mouth','tongue'],
 'JAMMER':['body','antenna_L','antenna_R','base_lobe_1','base_lobe_2','base_lobe_3','base_lobe_4','eye_slot_L','eye_slot_R','zigzag_mouth'],
 'PHASE':['continuous_body_tail','tail_tip_L','tail_tip_R','face_window','eye_L','eye_R'],
 'BURROWER':['body','three_finger_claw_L','three_finger_claw_R','foot_L','foot_R','eye_L','eye_R','round_nose_mouth'],
 'BEACON':['body','antenna_L','antenna_R','foot_L','foot_R','mouth','tongue'],
 'SCOUT':['head_hood','lid','eye','long_leg_L','long_leg_R'],
 'SIEGE':['body','forehead_plate','fist_L','fist_R','foot_L','foot_R','eye_L','eye_R','mouth'],
}
ROOT_KIND = {x:'two-foot contact horizontal midpoint' for x in PARTS}
ROOT_KIND.update(SHARD='fixed body ground projection', SPLINTER='fixed droplet ground projection', PHASE='fixed hovering-body ground projection', JAMMER='fixed midpoint of four base-lobe ground contacts')
MEANINGS = {
 'NEUTRAL':'常态身体；不含影子或状态层', 'SQUASH':'相对固定root向下压缩；附着拓扑与计数不变', 'STRETCH':'相对固定root向上拉伸；附着拓扑与计数不变',
 'MOVE':'NEUTRAL→SQUASH→STRETCH→NEUTRAL原地复用；仅在真实速度非零时播放',
 'ATTACK':'接触时局部身体紧张/前倾；不产生弹体、不用美术帧结算伤害',
 'RUN':'FAST的前倾姿态复用ATTACK；仍用真实速度，不能新增冲刺',
 'HEAVY_MOVE':'TANK偏重的原地节奏复用SQUASH；不改变速度或碰撞半径',
 'SPLIT_3':'SHARD死亡结算请求独立SPLINTER；不是存活身体分成三个器官',
 'HOP':'SPLINTER原地弹跳姿态；投影root保持不动，抬升只作表现',
 'GUARD':'SHIELD软肉盾瓣随父级变形；shield数值反馈为独立状态层',
 'HEAL':'MEDIC身体脉动复用常态/拉伸；持续范围治疗，不新增蓄力攻击窗口',
 'INFLATE':'BOMBER接触后fuseTimer期间局部充气，复用STRETCH；不改变判定范围',
 'JAM':'JAMMER天线局部屈曲；干扰持续影响塔射速，不生成独立实体或射弹',
 'PHASE_DASH':'图册名；实际phased定时切换+正常追踪移动，不能新增dash/瞬移',
 'EMERGE':'同一BURROWER从地下显现的前后时序；不复制成两只、不新增水平位移',
 'SUMMON_3_BASIC':'BEACON自身summonTimer到期；身体蓄力/触发/恢复仅表现；请求3个独立BASIC',
 'CHASE_PLAYER':'SCOUT追踪player，复用原地MOVE/前倾；目标PLAYER不进入SCOUT身体',
 'STRIKE_TOWER':'SIEGE接触优先tower；原地拳部动作，塔目标不进入身体；不新增打击帧结算',
}
FX = {
 'enemy.status.common':{'kind':'state overlays + separate shadow/HP UI','trigger':'hitFlash, slowTimer, armoredTimer, hp/maxHp and rendered state','lifetime':'read actual timers/HP; shadow follows fixed projected root; no body replacement','existing':'enemyBehaviorRuntime.js:19-21; canvasRenderer.js enemy pass'},
 'enemy.contact.feedback':{'kind':'particles','trigger':'player contact at gameTime % 0.5 < dt','lifetime':'particles own life/maxLife','existing':'enemyBehaviorRuntime.js:109-111; useGeoGuardGame.jsx:124-138'},
 'enemy.defeat.feedback':{'kind':'particles + optional true resource drops','trigger':'hp<=0 defeat settlement; consumed suppresses drop and deathSpawn','lifetime':'particles own life/maxLife; true drops use state.drops lifecycle','existing':'enemyDefeatRuntime.js:20-30','bodyExclusion':'death particles and gem outside every body frame'},
 'enemy.shield.overlay':{'kind':'shield state ring','trigger':'shield>0 and shield/maxShield','lifetime':'shield state only; flesh shield organ stays attached when numeric shield depleted','existing':'combatRules.js:13-26; canvasRenderer.js:975-979'},
 'enemy.medic.aura':{'kind':'proposed decorative aura overlay, no new hazard/entity','trigger':'healAura continuous radius eligibility','lifetime':'only while alive and eligible; actual HP changes continuous; effect timing cannot control healing','existing':'enemyBehaviorRuntime.js:51-57','status':'design need pending effects-ui review; no current new object assumed'},
 'enemy.jammer.aura':{'kind':'proposed decorative aura/target status','trigger':'jamAura range + getTowerFireRateFactor','lifetime':'actual range eligibility; no damage hazard','existing':'combatOffenseRuntime.js:24-31','status':'design need pending effects-ui review'},
 'enemy.bomber.blast':{'kind':'impactWaves, damage applied immediately by damageArea','trigger':'fuseTimer<=0','lifetime':'wave 0.26s visual; no persistent extra damage','existing':'enemyBehaviorRuntime.js:119-125; useGeoGuardGame.jsx:761-784'},
 'enemy.phase.opacity':{'kind':'renderer state alpha; optional independent afterimage','trigger':'enemy.phased toggle','lifetime':'interval/duration; afterimage design only, not PHASE child','existing':'enemyBehaviorRuntime.js:43-49; canvasRenderer.js:953','status':'alpha existing; optional afterimage pending effects-ui review'},
 'enemy.burrow.emerge':{'kind':'impactWaves + proposed separate earth overlay','trigger':'burrowTimer<=0 toggles burrowed false','lifetime':'impactWave life default0.28; earth overlay design only; does not hide whole anatomy by deleting organs','existing':'enemyBehaviorRuntime.js:33-41; useGeoGuardGame.jsx:156-178'},
 'enemy.beacon.summon':{'kind':'impactWaves','trigger':'summonTimer>=summon.interval resets timer and calls spawnAround','lifetime':'wave exists at each timer trigger even when spawn budget returns zero; body trigger may show attempt, child representations only successful UIDs','existing':'enemyBehaviorRuntime.js:59-66; entitySpawnRuntime.js:5-22; useGeoGuardGame.jsx:156-178'},
 'enemy.shard.split':{'kind':'reuse enemy.defeat.feedback; no separate living-body split VFX object','trigger':'deathSpawn and not consumed','lifetime':'death feedback independent of child lifetime','existing':'enemyDefeatRuntime.js:20-30'},
}

SPECIAL_EVIDENCE = {
 'RUN':[ev(BEHAVIOR,98,108,'FAST同用baseSpeed追踪；没有FAST专用冲刺状态')],
 'HEAVY_MOVE':[ev(BEHAVIOR,98,108,'TANK同用baseSpeed追踪，重步只是原地动画节奏')],
 'SPLIT_3':[ev(DEFEAT,27,30,'deathSpawn仅在not consumed时调用spawnAround然后移除父体'),ev(SPAWN,5,41,'真实数量受预算约束；每子体分配新uid并加入enemies')],
 'HOP':[ev(BEHAVIOR,98,108,'SPLINTER没有逻辑竖直跳跃；HOP只表现性抬升')],
 'GUARD':[ev('src/logic/engine/combatRules.js',7,29,'shield数值抵消伤害；不是可攻击身体部件')],
 'HEAL':[ev(BEHAVIOR,51,57,'持续治疗同范围非Boss非mechanic敌人；无发射事件')],
 'INFLATE':[ev(BEHAVIOR,114,125,'接触点燃引信，到期damageArea后hp=0')],
 'JAM':[ev('src/logic/engine/combatOffenseRuntime.js',24,31,'塔射速系数读取jamAura范围，非弹体')],
 'PHASE_DASH':[ev(BEHAVIOR,43,49,'phased定时切换'),ev('src/logic/engine/combatRules.js',7,11,'phased只影响受伤倍率'),ev('src/view/canvas/canvasRenderer.js',953,953,'phased透明度反馈')],
 'EMERGE':[ev(ENCOUNTER,194,195,'新建BURROWER初始burrowed'),ev(SPAWN,33,37,'初次生成可放到玩家附近，skipBurrowPosition跳过；不是动画水平偏移'),ev(BEHAVIOR,33,41,'同实体burrowTimer到期显现并产生独立波')],
 'SUMMON_3_BASIC':[ev(BEHAVIOR,59,66,'BEACON自身定时召唤BASIC和独立波'),ev(SPAWN,5,41,'返回spawned数量，新uid/HP/坐标由生成函数负责')],
 'CHASE_PLAYER':[ev(BEHAVIOR,72,91,'targetMode=player跳过塔搜寻')],
 'STRIKE_TOWER':[ev(BEHAVIOR,74,86,'tower优先目标；无tower时仍为player'),ev(BEHAVIOR,105,108,'持续接触伤害；塔读取towerDamageFactor')],
}

rows=[]
identities=[]
for i,item in enumerate(ITEMS):
    id=item['id']
    parts=[{'name':p,'parent':'body','independentEntity':False,'attachment':'canonical parent-local attachment; numeric coordinates pending source-art approval'} for p in PARTS[id] if p!='body']
    common=COMMON+[ev(CONFIG,67+i,67+i,'ENEMY_TYPES同ID模板；SPLINTER在deathSpawn生产，不属ENEMY_ORDER波次基础列表')]
    # gameConfig order differs from anatomy-lock only MEDIC / SHIELD? Resolve exact ID line.
    config_lines=(ROOT/CONFIG).read_text(encoding='utf-8-sig').splitlines()
    config_line=next(n for n,s in enumerate(config_lines,1) if n>=66 and re.match(r'\s*'+id+r':',s))
    common[-1]=ev(CONFIG,config_line,config_line,'ENEMY_TYPES真实ID/属性；不新建精英ID')
    sample={'BASIC':'images/basic-root-lock.png','BEACON':'images/beacon-body-only.png','SHARD':'images/shard-splinter-separate.png','SPLINTER':'images/shard-splinter-separate.png'}.get(id)
    identities.append({'id':id,'runtimeId':id,'anatomy':item['anatomy'],'canonicalSheet':'action-consistency/'+item['canonicalSheet'],'fixedRoot':{'kind':ROOT_KIND[id],**design_root},'parts':parts,'muzzleAnchors':[],'muzzleNote':'普通敌人没有发射器或射弹；嘴/鼻/芽不被解释为新枪口','faceRule':item['faceAnchors'],'sourceApproval':'original named concept keyposes approved, retained','productionApproval':'submitted for gate-1 review' if sample else 'mapping submitted; new body artwork held until explicit gate-1 approval','sampleSheet':sample,'sampleSheetNature':'full concept board, not cuttable runtime sprites' if sample else None})
    for a in item['actions']:
        action=a['action']; fx=['enemy.status.common']; summons=[]
        evidence=common+SPECIAL_EVIDENCE.get(action,[])
        reuse=None
        if action=='MOVE': reuse=[id+':NEUTRAL',id+':SQUASH',id+':STRETCH',id+':NEUTRAL']
        if action in ('RUN','GUARD'): reuse=[id+':ATTACK']
        if action=='HEAVY_MOVE': reuse=[id+':SQUASH']
        if action=='INFLATE': reuse=[id+':STRETCH']
        if action=='HEAL': reuse=[id+':NEUTRAL',id+':STRETCH']
        if action=='ATTACK': fx.append('enemy.contact.feedback')
        if id=='SHIELD': fx.append('enemy.shield.overlay')
        if id=='MEDIC': fx.append('enemy.medic.aura')
        if id=='JAMMER': fx.append('enemy.jammer.aura')
        if id=='PHASE': fx.append('enemy.phase.opacity')
        if action=='SPLIT_3':
            fx+=['enemy.shard.split','enemy.defeat.feedback']
            summons=[{'id':'SPLINTER','runtimeId':'SPLINTER','requestedCount':3,'actualCount':'spawnAround return; budget/placement-dependent; consumed suppresses request','resourceReuse':'enemy:SPLINTER body and all animations','ownRoot':True,'ownUidHpBehavior':True,'notBodyPart':True,'sourceEvent':'SHARD hp<=0 and !consumed'}]
        if action=='EMERGE': fx.append('enemy.burrow.emerge')
        if action=='SUMMON_3_BASIC':
            fx.append('enemy.beacon.summon')
            summons=[{'id':'BASIC','runtimeId':'BASIC','requestedCount':3,'actualCount':'spawnAround returns actual count; inherited boss budget may reduce to zero','resourceReuse':'enemy:BASIC body and MOVE cycle','ownRoot':True,'ownUidHpBehavior':True,'notBodyPart':True,'sourceEvent':'BEACON.summonTimer reaches interval; not HIVE spawnHive'}]
        if id=='BOMBER' and action in ('ATTACK','INFLATE'): fx.append('enemy.bomber.blast'); evidence+=SPECIAL_EVIDENCE['INFLATE']
        if action in ('NEUTRAL','SQUASH','STRETCH','MOVE'):
            event='既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器'
        else:event=MEANINGS[action]
        movement='enemy.x/y世界坐标由enemyBehaviorRuntime更新；身体源画布原地；无新增整体表现偏移'
        if action=='HOP':movement+='；仅body相对root局部竖直起伏，固定投影/影子，不添加逻辑跳跃'
        if action=='PHASE_DASH':movement+='；PHASE并无专用dashTimer赋值；不能从图册名新增冲刺'
        if action=='EMERGE':movement+='；初次spawn可能在player周边放置；显现时不重定位'
        if action=='SPLIT_3':movement='父体root保持到删除；新子体位置由spawnAround选择，子体各独立root，不继承页内箭头'
        if action=='SUMMON_3_BASIC':movement+='；子体世界出生位置由spawnAround，不从BEACON嘴吐出'
        row={'key':f'enemy:{id}:{action}','id':id,'runtimeId':id,'action':action,'bodyResource':f'enemy/{id}/'+('reuse' if reuse else action.lower()),'bodyDescription':MEANINGS[action],'fixedRoot':{'identityRootRef':id,'kind':ROOT_KIND[id],'coordinates':[256,416],'status':'design lock proposal; exact source/frame verification pending'},'parts':[p['name'] for p in parts],'muzzleAnchors':[],'independentProjectiles':[],'independentSummons':summons,'independentMechanics':[],'effects':fx,'logicMovementHint':movement,'runtimeEvent':event,'runtimeEvidence':evidence,'reuse':reuse or [],'referenceSheet':'action-consistency/'+a['sheet'],'referenceFrame':a.get('frame'),'originalConceptStatus':a['status'],'productionStatus':'submitted_mapping_and_sample' if sample else 'submitted_mapping_only; artwork_on_hold','sampleSheet':sample,'sampleCoverage':False}
        if id=='BASIC' and action in ('NEUTRAL','SQUASH','STRETCH','MOVE'):row['sampleCoverage']=True
        if id=='BEACON' and action in ('NEUTRAL','SUMMON_3_BASIC'):row['sampleCoverage']=True
        if id=='SHARD' and action in ('NEUTRAL','SPLIT_3'):row['sampleCoverage']=True
        if id=='SPLINTER' and action=='NEUTRAL':row['sampleCoverage']=True
        rows.append(row)

assert len(identities)==14 and len(rows)==77
assert len({r['key'] for r in rows})==77
document={'owner':'enemies','revision':'r01','scope':'gate-1 full 14 enemy / 77 reference action split + 3 concept sample boards','status':'submitted; no author approval','authority':'anatomy-lock.json + canonical named keyposes; actual runtime entry/optimized/fallback inspected 2026-10-02','rootConvention':design_root,'identities':identities,'actions':rows,'effectRequirements':FX,'runtimeMappingCorrection':'HIVE spawnHive current optimized handler => MECHANIC_NEST; nest tick=>BASIC; summonSwarm fallback=>SHARD. BEACON own timer=>BASIC remains valid. Base fallback spawnHive=>BEACON is not current dispatch.','noProjectileFinding':'All 14 ordinary enemy templates use contact/aura/explode/summon/deathSpawn; none generates state.projectiles. Empty projectile arrays intentional. Boss projectiles/hazards are separate effects-ui scope.','sharedReuse':'Spawned enemies reuse existing same-ID resources. Boss tiers/ownership/categories do not create elite IDs. Parts remain parent-owned.','globalDeathRequirement':'All 14 reuse separate particles; positive value ordinary enemies create true state.drops unless consumed. SPLINTER value0. No drop or death debris baked in body.','gates':{'originalConceptApproval':'retained','thisMapping':'awaiting main reviewer','allSamples':'awaiting actual main reviewer view','runtimeSprites':'not delivered','editableSourceArt':'not delivered; future vector source after approval','everyFrameRootPrecision':'not certified','integrationAndPerformance':'out of scope'}}
write('production-split.json',document)
table=['# 敌人生产拆分 r01','', '14 个现有敌人 ID、77 条参考动作。本清单依据解剖锁逐条展开；旧原画 approved 不改写为生产 approved。3 张板为第一门槛设定稿，尚无可运行帧/矢量源稿/资源接入。','', '本组尚未发现共享 production-split.json/md，因此在独占目录提交本组同名清单；输入权威为 action-consistency/anatomy-lock.json 的 14×77 条，无新增身份或动作覆盖计数。','', '运行期更正：当前 useGeoGuardGame.jsx:798 调 runBossOptimizedAbility，只有无 handler 才回落 bossAbilityRuntime。HIVE spawnHive→MECHANIC_NEST→BASIC；summonSwarm→SHARD。BEACON 图只表示 BEACON 自身 summonTimer 的 BASIC 请求，与当前 HIVE spawnHive 分开。详见 runtime-mapping.md。','', '## 固定 root 与导出边界','', '统一建议源画布512×512，root=(256,416)，collisionCenter=(256,256)，固定偏移=(0,-160)。这是未来源稿设计坐标，不是对生图页的像素测量，也不是改变当前碰撞中心。运行期世界 enemy.x/y 仍为碰撞中心；绘制按同一缩放转换偏移。全动作保留同一源画布，不按轮廓自动居中；双脚中心/无脚投影锚逐帧固定。','', '图中奶油底、分栏、文字、十字、引线、基线均为annotation层；影子、血条、状态环另层。根锚页仅证明规范可读，插值中间帧与循环首尾精确对齐待实现后另验。','', '## 身份与父级部件','', '|ID|守恒结构|root语义|父级部件挂点|', '|---|---|---|---|']
for item in identities:
    table.append('|'+item['id']+'|'+item['anatomy']+'|'+item['fixedRoot']['kind']+'|'+', '.join(p['name'] for p in item['parts'])+'|')
table += ['', '各部件固定在相同父级局部根部，随局部形变；无独立生命、行为或血条。数值挂点待源稿批准后量定；全部14敌人无枪口、无独立射弹。SHIELD肉盾是身体器官，数值护盾环另层，耗尽不删除肉盾。', '', '## 逐条动作归属（77条）','', '每条具体root、父级挂点、运行期文件行号、审批/复用状态完整保存在同名JSON。下表逐条列身体、独立对象、效果、逻辑位移和复用。','', '|ID / 动作|身体 / root|部件 / 枪口 / 弹体|独立召唤 / 机关|效果|逻辑位移 / 运行期依据|复用 / 生产状态|','|---|---|---|---|---|---|---|']
for r in rows:
    ent='; '.join(s['id']+' request '+str(s['requestedCount'])+'，实际数量取spawned' for s in r['independentSummons']) or '无'
    refs='; '.join(e['path'].split('/')[-1]+':'+str(e['start'])+'-'+str(e['end']) for e in r['runtimeEvidence'])
    table.append('|'+r['id']+' / '+r['action']+'|'+r['bodyDescription']+'；root=(256,416)|'+', '.join(r['parts'])+'；枪口无/弹体无|'+ent+'；机关无|'+', '.join(r['effects'])+'|'+r['logicMovementHint']+'；'+refs+'|'+(', '.join(r['reuse']) or '同身份局部关键姿态')+'；'+r['productionStatus']+'|')
table += ['', '## 独立效果需求','', '|资源需求|触发 / 运行期证据|生命周期边界|','|---|---|---|']
for k,v in FX.items(): table.append('|'+k+'|'+v['trigger']+'；'+v['existing']+'|'+v['lifetime']+'|')
table += ['', '以上效果由主审协调 effects-ui，均未在本组生图中烘焙。建议性治疗/干扰装饰须由主审批准；没有现成独立对象时不假称已有hazard/particle。普通敌人全部复用独立死亡反馈；正value死亡资源走真实drops，消耗掉的实体无drop/deathSpawn。','', '第一门槛后暂停；不得把清单77条理解为已绘制77条。样板仅覆盖9条参考动作的视觉/实体分离示意，仍等主审逐图审查。']
write('production-split.md','\n'.join(table))

write('sample-spec.json',{'owner':'enemies','revision':'r01','generationMode':'built-in image_gen','imageReferencesViewedBeforeGeneration':True,'transparentBackground':False,'deliverableType':'annotated raster concept boards only','notRuntimeSprites':True,'fixedSourceProposal':design_root,'boards':[
 {'file':'images/basic-root-lock.png','prompt':'prompts/basic-root-lock.txt','reference':'action-consistency/pilot-03-basic-enemy-v2.png','cells':['NEUTRAL','SQUASH','STRETCH','MOVE 0','MOVE 1','MOVE 2','MOVE 3 / LOOP','anatomy inset'],'counts':{'buds':5,'feet':2,'eyes':2,'mouth':1},'labels':'buds numbered1-5; feetL/R','loop':'reuse identical source NEUTRAL at loop endpoints; generated endpoints visually similar, not pixel-identical certified','coveredActions':['enemy:BASIC:NEUTRAL','enemy:BASIC:SQUASH','enemy:BASIC:STRETCH','enemy:BASIC:MOVE'],'notCovered':['enemy:BASIC:ATTACK']},
 {'file':'images/beacon-body-only.png','prompt':'prompts/beacon-body-only.txt','references':['action-consistency/batch-13-beacon-scout-v4.png','images/basic-root-lock.png'],'bodyCells':['NEUTRAL','WINDUP','TRIGGER','RECOVER'],'counts':{'topAntennae':2,'feet':2,'mouth':1,'tongue':1,'eyes':0},'independentBox':'3 separate BASIC unit references, not body layers or exact spawn guarantee','event':'BEACON enemyBehaviorRuntime summonTimer; windup/recover are art-only subposes, no existing logic timing windows','coveredActions':['enemy:BEACON:NEUTRAL','enemy:BEACON:SUMMON_3_BASIC'],'notCurrentHiveSpawnHive':True,'effects':'wave is text-only requirement, not baked in body'},
 {'file':'images/shard-splinter-separate.png','prompt':'prompts/shard-splinter-separate.txt','references':['action-consistency/batch-10-shard-medic.png','action-consistency/batch-04-player-splinter.png'],'parent':'one connected3-lobe SHARD, six crease marks,1mouth,1tooth,0eyes/limbs','child':'three separately boxed SPLINTER complete bodies,1eye0mouth/limbs each','rootGuide':'mint crosses and leaders are annotation, not organs or MEDIC symbols','event':'hp<=0 && !consumed requests SPLINTER3; runtime allocates new UIDs; diagram does not specify operation ordering','coveredActions':['enemy:SHARD:NEUTRAL','enemy:SHARD:SPLIT_3','enemy:SPLINTER:NEUTRAL'],'labelClarification':'NEW UNIT IDS means new runtime UIDs of existing SPLINTER ID, never new art/game IDs'}
],'layerStack':['ground effects','separate shadow aligned root','parent-owned body/parts/face','independent summoned units each own root/UID','independent particles/waves','HP/status/UI','annotation only in concept boards'],'localReview':{'status':'creator observation only, not main acceptance','findings':'all BASIC drawn cells show5buds2feet; BEACON4body cells show2antennae2feet1mouth1tongue0eyes and no child; split diagram separates complete SHARD and complete one-eye SPLINTER','limits':'no editable vector source, alpha cutout, frame atlas, measured animation or rendered runtime test'}})

differences=[
 ('mirrorStep',44,51,'PHASE×1 + old/new line wave','Boss逻辑换位+独立line hazard；不生成PHASE'),
 ('spawnHive',53,55,'BEACON×2','MECHANIC_NEST请求2；NEST后续请求BASIC×3；NEST非enemy BEACON'),
 ('broodShift',56,63,'寻BEACON迁移；没有BEACON则召BEACON×1','寻NEST迁移；没有NEST调用spawnHive；不生成BEACON'),
 ('hivePulse',64,69,'BEACON或Boss区域、多次pulse及治疗','每个NEST区域hazard；无本分支治疗'),
 ('hiveCollapse',70,75,'BEACON区域及SHARD×2/节点','NEST区域hazard；无SHARD召唤'),
 ('nestBloom',102,104,'独立hazard + SPLINTER×4','MECHANIC_WEB请求2；没有SPLINTER请求'),
 ('webField',105,108,'独立大范围web hazard + BURROWER×2','WEB请求2 + SPLINTER请求3；不请求BURROWER'),
 ('seedPods',109,111,'MEDIC×2','MECHANIC_ROOT请求2；不召MEDIC'),
 ('gardenWake',112,116,'治疗+SHARD请求6+garden危险区','ROOT请求2 + 范围非Boss非机关治疗 + SHARD请求3/maxActive8'),
 ('creepingCanopy',117,117,'多个spore危险区','同seedPods生成ROOT；不新增MEDIC'),
 ('tempoShift',170,173,'冻结塔+FAST请求4/maxActive8','更新nextBeat + FAST请求2/maxActive6'),
 ('raiseWalls',118,119,'SIEGE请求3 + wall区域hazard','WALL独立机关；不请求SIEGE'),
 ('sacrificeMinions',134,144,'需检查fallback不可直接推导子体','已标记存活近距敌人hp=0/consumed=true；禁止SHARD deathSpawn/资源drop；BossHP/护盾/slag hazard'),
]
override_outputs={
 'markTower':'RETICLE独立机关，targetUid指向塔', 'mirrorStep':'逻辑换位+line hazard', 'spawnHive':'NEST独立机关', 'broodShift':'迁移至NEST或调用spawnHive', 'hivePulse':'NEST-owned area hazards', 'hiveCollapse':'NEST-owned area hazards', 'stealMoney':'COURIER独立机关+资金直接扣除', 'taxBeacon':'coin area hazard；名字不是BEACON单位', 'repossess':'coin area hazard+COURIER', 'frostRing':'area hazard', 'freezeTower':'SEAL独立机关', 'coldSnap':'SEAL独立机关，最多两塔目标', 'webTrap':'WEB独立机关+地形hazard', 'silkVolley':'WEB独立机关+地形hazard', 'nestBloom':'WEB独立机关；名字不是NEST', 'webField':'WEB + SPLINTER独立单位', 'seedPods':'ROOT独立机关', 'gardenWake':'ROOT+SHARD单位+治疗', 'creepingCanopy':'ROOT独立机关', 'raiseWalls':'WALL独立机关', 'gateSwap':'切墙方向+WALL独立机关', 'mazeCrush':'WALL-owned area hazards', 'deadEnd':'调用mazeCrush', 'gravityWell':'独立area hazard+拉拽', 'singularity':'独立多pulse area hazard+拉拽', 'sacrificeMinions':'标记单位consumed+BossHP/shield+独立hazard', 'quake':'area hazard', 'wingBuffet':'area hazard+推离', 'skyDive':'Boss dashTimer世界位移+area hazard', 'conductLines':'line hazards', 'pulseMeasure':'area hazards', 'tempoShift':'FAST独立单位+nextBeat', 'syncopate':'line hazards', 'crescendo':'area hazards', 'finale':'line hazards', 'soloSolarVolley':'line hazards', 'soloLunarOrbit':'area hazards'}
opt_text=(ROOT/OPT).read_text(encoding='utf-8-sig')
handler_names=re.findall(r'^  (\w+): \(c\)',opt_text,re.M)
assert set(handler_names)==set(override_outputs)
ingress={
 'BASIC':['BEACON自身summonTimer→BASIC3','NEST tick→BASIC3（optimized spawnHive创建NEST）','summonFormation无optimized handler→fallback BASIC4'],
 'FAST':['tempoShift optimized→FAST2'],
 'TANK':['普通波次/调试；未发现当前Boss技能直接spawn TANK'],
 'SHARD':['summonSwarm无handler→fallback SHARD5','gardenWake optimized→SHARD3；hiveCollapse optimized无SHARD'],
 'SPLINTER':['SHARD死亡且not consumed→SPLINTER3','spawnSpiderlings无handler→fallback SPLINTER6','broodAmbush无handler→fallback SPLINTER（逐点）','webField optimized→SPLINTER3；nestBloom optimized无SPLINTER'],
 'SHIELD':['phalanxAdvance、summonFrostGuards、forgeArmor无handler→fallback SHIELD'],
 'MEDIC':['普通波次/调试；seedPods optimized只ROOT，不能当当前Boss MEDIC召唤'],
 'BOMBER':['普通波次/调试；未发现当前Boss技能直接spawn BOMBER'],
 'JAMMER':['普通波次/调试；未发现当前Boss技能直接spawn JAMMER'],
 'PHASE':['默认afterimageBurst、mirrorSummon无handler→fallback PHASE；mirrorStep optimized无PHASE；旧/编辑器twinSwap也可fallback PHASE，非默认双子phase'],
 'BURROWER':['broodAmbush无handler→fallback BURROWER；webField optimized无BURROWER'],
 'BEACON':['普通波次/调试；当前spawnHive与broodShift不创建BEACON'],
 'SCOUT':['summonScouts、pincerRush、paydaySweep、ransomBurst无handler→fallback SCOUT'],
 'SIEGE':['summonSiege无handler→fallback SIEGE；raiseWalls optimized为WALL，fallback SIEGE墙卫不可当当前召唤'],
}
# Verify fallback branch names before claiming fallback dispatch.
fallback_names=['summonFormation','summonSwarm','spawnSpiderlings','broodAmbush','phalanxAdvance','summonFrostGuards','forgeArmor','afterimageBurst','mirrorSummon','twinSwap','summonScouts','pincerRush','paydaySweep','ransomBurst','summonSiege']
fallback_text=(ROOT/FALLBACK).read_text(encoding='utf-8-sig')
for name in fallback_names:
    assert name not in handler_names and f"abilityName === '{name}'" in fallback_text,name
chain=[ev(ENTRY,797,814,'正式能力入口'),ev(OPT,209,213,'handler优先，否则fallback；不是两份同时执行'),ev('src/logic/engine/encounterRuntime.js',59,171,'默认Boss实际phase能力覆盖，tier裁剪；编辑模板可另有能力'),ev(SPAWN,5,41,'spawn数量/UID/所有权分配'),ev(MECH,7,27,'机关独立uid/hp/timer加入enemies'),ev(MECH,57,60,'NEST tick请求BASIC3')]
write('runtime-mapping.json',{'entryChain':chain,'handlerOutputs':override_outputs,'currentHandlerCount':len(handler_names),'summonDifferences':[{'ability':a,'optimizedLines':[s,e],'baseFallback':b,'current':c}for a,s,e,b,c in differences],'enemyResourceIngress':ingress,'fallbackAbilitiesVerifiedNoHandler':fallback_names,'caveat':'Listed summons are requests, not guaranteed successful counts; authored editor patterns may choose other existing fallback abilities. Identity reuse does not depend on owner/category/tier.'})
rm=['# 当前调用链与敌人复用证据','', '主审2026-10-02纠正已纳入：旧plan/production-notes曾把基础fallback spawnHive→BEACON写成当前行为。本包以真正入口为准，不修改只读旧文件。','', '正式链：useGeoGuardGame.jsx:797-814 → bossOptimizedAbilities.js:209-213（handler优先、else fallback）→ entitySpawnRuntime/机关工厂。默认phase还由encounterRuntime.js:59-171覆盖，不能只读gameConfig早期phase列表。所有下表ID仍是原有身份，拥有独立uid/hp/行为/根锚；机关MECHANIC_NEST由bosses-mechanics组制作。','', '## 影响敌人归属的覆盖差异','', '|能力|基础fallback（被覆盖）|当前优化handler|依据|','|---|---|---|---|']
for a,s,e,b,c in differences:rm.append(f'|{a}|{b}|{c}|bossOptimizedAbilities.js:{s}-{e}|')
rm += ['', 'summonSwarm无handler，仍fallback SHARD请求5。BEACON自身summonTimer是普通敌人行为，不经Boss能力分派，仍BASIC请求3。NEST触发BASIC请求3且timer重置6秒。请求数必须与成功spawned数分开；预算受boss/encounter/category限制。BEACON现有代码每次定时尝试都产生波，即使没有成功子体；样板仅在子体存在时显示子体。', '', '## 当前全部优化handler输出（检查防遗漏）','', '|handler|当前输出资源分类|','|---|---|']
for a in handler_names:rm.append('|'+a+'|'+override_outputs[a]+'|')
rm += ['', '这张表记录实际输出及完整覆盖集合；其他危险区形状/数值交由effects-ui/Boss组自行按同入口复核，本组不宣称其原画通过。', '', '## 14身份被召唤/复用入口','', '|ID|当前入口与排除旧误映射|','|---|---|']
for id,values in ingress.items():rm.append('|'+id+'|'+ '；'.join(values)+'|')
rm += ['', '普通波次/调试的同ID也复用身体。SPLINTER不在ENEMY_ORDER基础波次列表，但确实在ENEMY_TYPES并由死亡/能力创建。所有普通敌人ATTACK均保留持续接触逻辑；图册RUN/HOP/PHASE_DASH不是新的游戏技能。','', 'SHARD分裂图中REMOVE PARENT与REQUEST 3是关系标签，不代表代码操作次序；实际settleEnemyDefeatRuntime先spawnAround，再splice父体。NEW UNIT IDS意指新uid，类型仍SPLINTER。consumed时不分裂；不能强制演出三子体。']
write('runtime-mapping.md','\n'.join(rm))

evidence_paths={e['path']for row in rows for e in row['runtimeEvidence']}|{e['path']for e in chain}|{OPT,FALLBACK,CONFIG,MECH,'src/logic/engine/battlefieldRules.js','src/logic/engine/bossFlowRules.js','src/view/canvas/canvasRenderer.js'}
snapshots=[]
for p in sorted(evidence_paths):snapshots.append({'path':p,'sha256':hashlib.sha256((ROOT/p).read_bytes()).hexdigest()})
for p in ['art-replacement-plan.md','production-art-2026-10-02/coordination.md','action-consistency/anatomy-lock.json','action-consistency/production-notes.md']:
    snapshots.append({'path':str((BIBLE/p).relative_to(ROOT)).replace('\\','/'),'sha256':hashlib.sha256((BIBLE/p).read_bytes()).hexdigest()})
write('source-evidence.json',{'readOnlyEvidenceSnapshot':snapshots,'date':'2026-10-02','note':'Hash records current working-tree source, not clean commit. This work changes no src or game settings.'})
write('README.md', '# enemies 第一包 r01\n\n提交14敌77动作清单、实际入口/优化版/fallback映射与3张样板。采用内置image_gen；引用图均先实际查看；完整prompt见prompts/。\n\n- images/basic-root-lock.png：五芽两脚常态/压缩/拉伸/原地循环；annotation独立。\n- images/beacon-body-only.png：BEACON自身召唤body-only，BASIC子体独立分栏。非当前HIVE spawnHive。\n- images/shard-splinter-separate.png：活体SHARD与死亡生成SPLINTER的独立关系。\n- production-split.json/md：77条全字段清单。\n- runtime-mapping.json/md：当前正式调用链、37个优化handler输出与敌人相关覆盖差异。\n- sample-spec.json：层次、root建议坐标、样板范围与未认证边界。\n- source-evidence.json：只读工作树证据SHA256。\n\n样板覆盖9条参考动作的设计示意，不是77条已绘制，也不是可导入动画。无透明精灵/图集/矢量源稿/连续帧精度/实战性能承诺。所有生产状态待主审明确审查。本包提交后停止，不展开其他身份新生图。')
write('creator-check.md', '# 制作者检查（非主审审批）\n\n已实际查看3张生成图。BASIC七姿态及解剖小格均可数出5芽与2脚；BEACON四身体格2触芽/2脚/1口1舌0眼，子体仅在独立框；SHARD三连滴瓣、6刻线、1口1牙与三个完整SPLINTER分框。身体格不含弹体/闪光/独立召唤对象。\n\n根锚十字是annotation。BASIC和BEACON基线视觉一致，尚未用精灵源文件/中间帧核验同坐标。分裂页无连续动作，较大薄荷十字及引线仅投影标注；不是新增器官或MEDIC十字。生图页不可直接裁成资源。\n\n数据检查：77个唯一action key与anatomy-lock完全相等；14个ID完全相等；各条含身体/root/parts/muzzle/projectile/summon/mechanics/effects/movement/evidence/reuse/status；效果键均有需求定义；packet文件哈希与UTF8无BOM会在提交前检查。\n\n审批：awaiting_main_review。样板9条参考覆盖；未展示的动作仍mapping-only。运行期映射已按正式分派更正；其他组效果依赖由主审处理。')
print(json.dumps({'ids':len(identities),'actions':len(rows),'sampleActions':sum(r['sampleCoverage']for r in rows),'optimizedHandlers':len(handler_names),'written':sorted(p.name for p in OUT.glob('*')if p.is_file())},ensure_ascii=False))
