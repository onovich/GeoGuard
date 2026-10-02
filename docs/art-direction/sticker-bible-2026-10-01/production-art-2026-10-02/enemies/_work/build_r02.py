from pathlib import Path
import json, hashlib, struct, html, shutil

ROOT=Path('D:/WebProjects/GeoGuard')
BIBLE=ROOT/'docs/art-direction/sticker-bible-2026-10-01'
OWNER=BIBLE/'production-art-2026-10-02/enemies'
REV=OWNER/'submissions/r02'
assert not (REV/'packet.json').exists(), 'Submitted revision is immutable'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,data):
    p.write_text((data if isinstance(data,str)else json.dumps(data,ensure_ascii=False,indent=2))+'\n',encoding='utf-8')
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def esc(v):return html.escape(str(v))
doc=read(OWNER/'submissions/r01/production-split.json')
lock=read(BIBLE/'action-consistency/anatomy-lock.json')
gen=read(REV/'generation-record.json')

# Image cell rows reflect actual generated labels, including reversed SIEGE/SCOUT order.
locations={
 'BASIC':('submissions/r01/images/basic-root-lock.png',1,['NEUTRAL','SQUASH','STRETCH']),
 'BEACON':('submissions/r01/images/beacon-body-only.png',1,['NEUTRAL','WINDUP','TRIGGER','RECOVER']),
 'FAST':('submissions/r02/images/01-fast-tank.png',1,['NEUTRAL','SQUASH','STRETCH','RUN / CONTACT']),
 'TANK':('submissions/r02/images/01-fast-tank.png',2,['NEUTRAL','SQUASH','STRETCH','CONTACT']),
 'SHARD':('submissions/r02/images/02-shard-splinter.png',1,['NEUTRAL','SQUASH','STRETCH','PRE-SPLIT BODY']),
 'SPLINTER':('submissions/r02/images/02-shard-splinter.png',2,['NEUTRAL','SQUASH','STRETCH','HOP / CONTACT']),
 'SHIELD':('submissions/r02/images/03-shield-medic.png',1,['NEUTRAL','SQUASH','STRETCH','GUARD / CONTACT']),
 'MEDIC':('submissions/r02/images/03-shield-medic.png',2,['NEUTRAL','SQUASH','STRETCH','HEAL / CONTACT']),
 'BOMBER':('submissions/r02/images/04-bomber-jammer.png',1,['NEUTRAL','SQUASH','STRETCH','INFLATE / CONTACT']),
 'JAMMER':('submissions/r02/images/04-bomber-jammer.png',2,['NEUTRAL','SQUASH','STRETCH','JAM / CONTACT']),
 'PHASE':('submissions/r02/images/05-phase-burrower.png',1,['NEUTRAL','SQUASH','STRETCH','PHASE BODY']),
 'BURROWER':('submissions/r02/images/05-phase-burrower.png',2,['NEUTRAL','SQUASH','STRETCH','EMERGE BODY']),
 'SCOUT':('submissions/r02/images/06-scout-siege.png',2,['NEUTRAL','SQUASH','STRETCH','CHASE BODY']),
 'SIEGE':('submissions/r02/images/06-scout-siege.png',1,['NEUTRAL','SQUASH','STRETCH','STRIKE BODY']),
}
def source(id,col,role='body'):
    path,row,labels=locations[id]
    return {'path':path,'identity':id,'row':row,'column':col,'label':labels[col-1],'role':role,'fileSha256':digest(OWNER/path),'frameAccuracy':'concept cell only, not runtime frame or extraction rect','review':'r01 accepted source retained'if 'r01' in path else 'r02 final candidate; awaiting main view'}

extra_notes={
 'BASIC:ATTACK':'复用r01已过NEUTRAL完整身体+独立contact反馈；不会因缺专属新攻击格而回展旧动作板。伤害仍为持续接触。',
 'BEACON:SQUASH':'WINDUP是压缩身体子姿态；美术表现不新增逻辑蓄力窗口。',
 'BEACON:STRETCH':'TRIGGER是拉伸身体子姿态；与召唤尝试事件关联，不控制子体数量。',
 'BEACON:MOVE':'复用NEUTRAL→WINDUP(压缩)→TRIGGER(拉伸)→NEUTRAL；RECOVER可回常态。',
 'BEACON:SUMMON_3_BASIC':'身体前三子姿态与RECOVER；BASIC只在独立框/资源引用，不在body。自身timer与当前HIVE spawnHive分开。',
 'SHARD:SPLIT_3':'PRE-SPLIT BODY是完整父体示意，不新增存活分裂能力；死亡时按真实成功生成SPLINTER UID播放独立子体，再由原逻辑移除父体。consumed时无子体。',
 'SPLINTER:HOP':'BODY局部竖直抬升，基线投影root固定；不新增逻辑跳跃。',
 'PHASE:PHASE_DASH':'PHASE BODY复用完整常态姿态，phased alpha单独应用；没有图册名所暗示的新dash或烘焙残影。',
 'BURROWER:EMERGE':'单一完整EMERGE BODY为出土完成姿态；地下到显现可复用身体/遮罩，固定root；波/土层单独，不重画第二实体。',
 'MEDIC:HEAL':'HEAL / CONTACT完整身体+独立持续治疗装饰；无额外伤害帧、五官、漂浮十字。',
 'JAMMER:JAM':'JAM / CONTACT完整身体+独立干扰范围/目标反馈；无烘焙波线、无新增弹体。',
 'SHIELD:GUARD':'软肉盾器官保持父级；数值护盾环独立；耗尽不删除软肉盾。',
 'BOMBER:ATTACK':'INFLATE / CONTACT完整身体+独立即时爆炸波；从身体姿态不能推导新爆炸窗口/半径。',
 'SCOUT:CHASE_PLAYER':'CHASE BODY单体固定root；被追PLAYER不进入身体；实际targetMode=player。',
 'SIEGE:STRIKE_TOWER':'STRIKE BODY单体固定root，双拳仍完整；被打塔不进入身体；伤害读取持续接触与towerDamageFactor。',
}
final_rows=[]
for old in doc['actions']:
    r=dict(old);id=r['id'];action=r['action'];mode='direct_cell'
    if action=='NEUTRAL':cols=[1]
    elif action=='SQUASH':cols=[2]
    elif action=='STRETCH':cols=[3]
    elif action=='MOVE':cols=[1,2,3,1];mode='explicit_in_place_cycle_reuse'
    elif action=='HEAVY_MOVE':cols=[2];mode='same_body_pose_reuse'
    elif id=='BASIC'and action=='ATTACK':cols=[1];mode='same_body_plus_independent_feedback'
    elif id=='BEACON'and action=='SUMMON_3_BASIC':cols=[2,3,4];mode='body_subposes_plus_independent_spawn_event'
    else:cols=[4]
    r['bodySources']=[source(id,c)for c in cols]
    r['finalMappingMode']=mode
    r['bodyResource']=f'enemy/{id}/concept-cell-references'
    r['mappingNote']=extra_notes.get(id+':'+action,'同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。')
    r['productionStatus']='r02 final concept candidate submitted; no runtime-ready claim'
    r['sampleCoverage']=True
    r['sampleSheet']=locations[id][0]
    r['originalReferencePurpose']='identity authority only; not rendered in current index'
    r['entityResourceSources']=[]
    for summon in r['independentSummons']:
        r['entityResourceSources'].append({'id':summon['id'],'bodySource':source(summon['id'],1,'independent summoned unit'),'allAnimationReuse':summon['id'],'countPolicy':summon['actualCount'],'independentRootUidHpBehavior':True})
    if action=='SPLIT_3':
        r['relationshipDiagram']={'path':'submissions/r01/images/shard-splinter-separate.png','review':'r01 accepted independent-entity diagram','notBodyFrame':True,'purpose':'supplemental relationship only; r02 parent/child body keyposes above are authoritative'}
    final_rows.append(r)

doc['revision']='r02';doc['scope']='final enemy concept keyposes:6 new two-identity boards + retained2 approved body boards,14 existing identities/77 source mappings'
doc['status']='submitted; main review pending for6 new boards'
doc['actions']=final_rows
doc['gates']['thisMapping']='r01 split accepted; r02 concrete sources submitted'
doc['gates']['allSamples']='r01 accepted sources retained;6 new concept boards require main view'
doc['gates']['editableSourceArt']='not delivered; continuous resource production expressly out of scope'
doc['referenceActionCount']=77
doc['newIdentityCount']=12
doc['newBoardCount']=6
doc['r01ApprovalEvidence']='production-art-2026-10-02/reviews/enemies-r01.md'
for identity in doc['identities']:
    identity['finalBoard']=locations[identity['id']][0]
    identity['finalBoardRow']=locations[identity['id']][1]
    identity['productionApproval']='r01 source retained / r02 mapping submitted'if identity['id']in('BASIC','BEACON')else 'r02 final concept candidate pending main review'
    identity['sampleSheet']=identity['finalBoard']
write(REV/'production-split.json',doc)

mapping={'owner':'enemies','revision':'r02','scope':'exact77 anatomy-lock action source mappings; concept cells only','identityCount':14,'actionCount':77,'pathsRelativeTo':'production-art-2026-10-02/enemies','bodyAuthority':'6new r02 body-only boards plus accepted r01 BASIC/BEACON boards','actions':[{k:r[k]for k in ['key','id','action','bodySources','finalMappingMode','mappingNote','effects','entityResourceSources','logicMovementHint','runtimeEvidence']}for r in final_rows]}
write(REV/'action-sources.json',mapping)
md=['# r02 全77条具体来源','', '格位按实际页面：row1上排/row2下排，column1到4从左向右。最后一张SIEGE在上排、SCOUT在下排（与标题顺序不同）。BASIC/BEACON保留r01正式通过的原地板。所有MOVE显式复用同身份N→SQUASH→STRETCH→N，不生成位移帧。','', '能力body-only可复用完整同身体+独立效果/实体事件。身体里无目标、子弹、召唤物或效果。这里只提交关键姿态与来源规格；不制作连续资源，不接入代码。','', '|ID / 动作|具体板与格（行/列/可见标签）|复用与独立事件|独立效果需求|','|---|---|---|---|']
for r in final_rows:
    src=' → '.join(f"{s['path'].split('/')[-1]} · R{s['row']}C{s['column']} {s['label']}"for s in r['bodySources'])
    entities='；'.join(s['id']+'独立复用'+s['bodySource']['path'].split('/')[-1]+f" R{s['bodySource']['row']}C{s['bodySource']['column']}"for s in r['entityResourceSources'])
    md.append('|'+r['id']+' / '+r['action']+'|'+src+'|'+r['mappingNote']+('；'+entities if entities else '')+'|'+', '.join(r['effects'])+'|')
md+=['', 'SHARD SPLIT_3的完整父体在r02 R1C4，子体各用r02 SPLINTER R2C1。原r01独立关系图只作关系补充，不是身体动画格。BEACON召唤BASIC用r01 BASIC NEUTRAL/MOVE资源；当前HIVE spawnHive则NEST，由机关组制作。','', '数值root与collisionCenter沿用r01设计建议；图内标线仅可读规格，帧级精度另验。新板未审不继承r01通过。']
write(REV/'action-sources.md','\n'.join(md))
write(REV/'production-split.md','# r02 生产拆分完整清单\n\n同名JSON完整保留r01已通过的77条身体、root、部件、枪口（无）、独立弹体（无）、独立召唤/机关、effects、逻辑位移、运行期证据及复用字段，并新增具体bodySources。\n\n可读逐条来源见[action-sources.md](action-sources.md)，浏览入口见[index.html](index.html)。旧权威referenceSheet只作身份来源记录，不在当前索引展示。\n\n运行期沿用已审entry→optimized→fallback，不把旧fallback HIVE spawnHive=BEACON写成当前行为。详见本包runtime-mapping.json/md。新图仅提交审查，未代主审批。')
for name in ['runtime-mapping.json','runtime-mapping.md']:
    shutil.copyfile(OWNER/'submissions/r01'/name,REV/name)

identity_index=[]
for identity in doc['identities']:
    id=identity['id'];path,row,labels=locations[id]
    identity_index.append({'id':id,'anatomy':identity['anatomy'],'board':path,'row':row,'columns':{str(i+1):v for i,v in enumerate(labels)},'root':identity['fixedRoot'],'parts':identity['parts'],'actionKeys':[r['key']for r in final_rows if r['id']==id],'review':'r01 retained approved board; r02 reuse mapping submitted'if id in('BASIC','BEACON')else 'r02 pending main review'})
write(REV/'final-index.json',{'owner':'enemies','revision':'r02','status':'final candidate concept set submitted','items':identity_index,'count':14,'currentBoardPaths':sorted({x['board']for x in identity_index}),'bodyOnly':True,'all77Mapped':True,'notRuntimeSprites':True})

review_obs={
 '01-fast-tank':'FAST双后倾耳/双后足/侧瓣/双眼椭圆口；TANK三顶瓣/双拳/双脚/单眉槽一口方牙。四格均无速度线或目标。',
 '02-shard-splinter':'SHARD三连体滴瓣、各两刻线、中央一口一牙，能力格仍完整父体；SPLINTER各格单眼无口手脚；HOP只局部竖直抬升。',
 '03-shield-medic':'SHIELD单软肉盾瓣、后拳双脚与同锚眼亮点；MEDIC四主体瓣双卷臂双脚十字、无眼口。GUARD标签附近淡竖标注残线不是第二root，root仅取基线十字。',
 '04-bomber-jammer':'BOMBER弯引信芽、双鼓腮臂双脚双眼槽一口一舌，无火花；JAMMER双下垂天线、四基底瓣双眼槽折嘴，无波线。',
 '05-phase-burrower':'PHASE连体尾末两尖瓣、单长黑脸窗双白眼无肢体，能力格单体不绘残影；BURROWER双三指爪双底脚双眼大鼻口，EMERGE单完整实体。',
 '06-scout-siege':'实际SIEGE上排单额板双拳双脚双眼一嘴，SCOUT下排单头罩眼睑大眼双长腿；追逐格修为双脚分列基线root两側，无玩家/塔目标。',
}
write(REV/'creator-check.md','# r02 制作者逐板观察（非主审审批）\n\n'+ '\n\n'.join('**'+name+'**：'+desc for name,desc in review_obs.items())+'\n\n所有引用图生成前已view；全部6张最终选图已实际查看。局部编辑只在本revision候选阶段，不改变已提交r01。\n\nROOT LOCK是设计规格：每格基线十字为root；器官局部压缩/拉伸/倾斜，HOP以固定投影为参照。设定板未输出逐帧同画布PNG，不宣称精确叠帧认证。标线/文字与底色均不属于身体。\n\n角色身体不含独立弹体/召唤/目标/闪光/弹道/危险区。独立效果需求仍由effects-ui承担。r02最终候选图等主审实际view后决定是否接受。')

board_paths=list(dict.fromkeys(locations[i['id']][0]for i in doc['identities']))
cards=[]
for path in board_paths:
    ids=[x['id']for x in identity_index if x['board']==path]
    rel=Path(path).relative_to('submissions/r02') if path.startswith('submissions/r02')else Path('../r01/images')/Path(path).name
    status='r01 保留通过'if 'r01' in path else 'r02 最终候选 · 待主审'
    cards.append(f'<figure id="board-{esc(Path(path).stem)}"><figcaption><strong>{esc(" / ".join(ids))}</strong><span>{status}</span></figcaption><a href="{esc(rel.as_posix())}"><img loading="lazy" src="{esc(rel.as_posix())}" alt="{esc(" / ".join(ids))} 身体关键姿态与固定根锚规范板"></a><p>{esc(path)}</p></figure>')
details=[]
for identity in identity_index:
    rs=[r for r in final_rows if r['id']==identity['id']]
    trs=[]
    for r in rs:
        cells=' → '.join(f"R{s['row']}C{s['column']} {s['label']}"for s in r['bodySources'])
        trs.append('<tr><td>'+esc(r['action'])+'</td><td>'+esc(cells)+'</td><td>'+esc(r['mappingNote'])+'</td><td>'+esc(', '.join(r['effects']))+'</td></tr>')
    details.append('<details id="id-'+identity['id']+'"><summary>'+identity['id']+' · '+str(len(rs))+'条动作</summary><p>'+esc(identity['anatomy'])+'</p><p>板：'+esc(identity['board'])+'；'+str(identity['row'])+'行。root：'+esc(identity['root']['kind'])+'</p><div class="table-scroll"><table><thead><tr><th>动作</th><th>具体格位/循环复用</th><th>身体与独立事件</th><th>独立效果键</th></tr></thead><tbody>'+''.join(trs)+'</tbody></table></div></details>')
page='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoGuard · enemies r02</title><style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fffaf0;color:#533323;font:16px/1.6 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1440px;margin:auto;padding:32px 24px 64px}h1{font-size:clamp(28px,4vw,46px);line-height:1.2;margin:12px 0;color:#422515}h2{font-size:24px;margin-top:36px}.eyebrow{color:#98634b;letter-spacing:.08em;font-size:13px}p{max-width:1000px}a{color:#76482c}nav{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0}nav a,.badge{border:1px solid #dfcdbb;border-radius:20px;padding:5px 12px;background:#fffdf5;text-decoration:none}.note{border-left:4px solid #cf7962;padding:14px 20px;background:#fff4e8}figure{margin:28px 0;border:1px solid #ddcbbb;border-radius:16px;overflow:hidden;background:#fffdf6;scroll-margin-top:16px}figcaption{display:flex;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid #eadccd}figcaption span{font-size:13px;color:#8c6954}figure img{display:block;width:100%;height:auto}figure p{font-size:12px;color:#92745f;padding:0 20px;overflow-wrap:anywhere}details{margin:12px 0;padding:16px 20px;border:1px solid #dfcdbb;border-radius:12px;background:#fffdf5;scroll-margin-top:16px}summary{cursor:pointer;font-weight:650}table{border-collapse:collapse;width:100%;font-size:13px;min-width:880px}th,td{padding:12px;border-bottom:1px solid #e9ddcf;text-align:left;vertical-align:top}th{background:#f7ecdd}.table-scroll{overflow:auto}footer{margin-top:32px;color:#8c6954;font-size:13px}@media(max-width:600px){main{padding:24px 12px}figcaption{flex-direction:column}details{padding:12px}}
</style></head><body><main><div class="eyebrow">GEOGUARD · STICKER CRITTERS · ENEMIES</div><h1>身体关键姿态 · r02</h1><p>14 个现有敌人身份 / 77 条参考动作来源。6 张新板覆盖12身份，保留 BASIC、BEACON 已通过样板。奶油留白、暖棕线、软轮廓；全部身体原地制作。</p><div class="note">新图均为最终候选，仍等主审逐图验收。body-only格仅身体与父级器官，独立效果/目标/子体不烘焙。基线十字为设计root，标线不进入身体。此包不包含连续资源、代码接入或帧级精度证明。</div><nav>'''+''.join('<a href="#id-'+x['id']+'">'+x['id']+'</a>'for x in identity_index)+'''</nav><p><a href="action-sources.md">77条可读来源表</a> · <a href="action-sources.json">结构化来源</a> · <a href="production-split.json">完整生产拆分</a> · <a href="runtime-mapping.md">实际运行期映射</a> · <a href="creator-check.md">制作者检查</a></p><h2>当前身体板</h2>'''+''.join(cards)+'''<h2>逐身份与动作来源</h2>'''+''.join(details)+'''<footer>只展示当前敌人body-only生产规范板。旧含其他角色/效果的原探索动作板不在本页展示。MOVE复用循环；世界移动取逻辑坐标；图中能力子姿态不新增玩法时序。SHARD分裂、BEACON召唤各取真实成功UID数，独立资源生命由逻辑决定。</footer></main></body></html>'''
write(REV/'index.html',page)
write(REV/'README.md','# enemies r02 最终概念候选包\n\n入口：[index.html](index.html)。14现有身份、77条具体板/格来源；保留r01已通过BASIC/BEACON，新增6张2身份body-only板。\n\n所有新原画使用内置image_gen，引用图先view；完整生成与局部修订prompt在prompts/，记录在generation-record.json。最终图在images/。\n\n- 01-fast-tank.png：FAST上排、TANK下排。\n- 02-shard-splinter.png：SHARD上排、SPLINTER下排。\n- 03-shield-medic.png：SHIELD上排、MEDIC下排。\n- 04-bomber-jammer.png：BOMBER上排、JAMMER下排。\n- 05-phase-burrower.png：PHASE上排、BURROWER下排。\n- 06-scout-siege.png：SIEGE上排、SCOUT下排，以实际行标签为准。\n\n全部动作来源：action-sources.json/md；完整拆分production-split.json含root/部件/独立对象/effects/位移/运行期依据/复用。最终候选图片未自动继承r01批准，等待主审实际查看。仅概念关键姿态，不制作连续资源、不改代码、不提交或部署。')

expected={f"enemy:{i['id']}:{a['action']}"for i in lock['items']if i['group']=='enemy'for a in i['actions']}
assert len(final_rows)==77 and {r['key']for r in final_rows}==expected
assert len(identity_index)==14 and len(board_paths)==8
assert len(list((REV/'images').glob('*.png')))==6
for r in final_rows:
    assert r['bodySources']
    for s in r['bodySources']:
        assert (OWNER/s['path']).exists() and s['fileSha256']==digest(OWNER/s['path'])
        assert s['identity']==r['id']
    for ss in r['entityResourceSources']:assert (OWNER/ss['bodySource']['path']).exists()
assert 'batch-'not in page and 'pilot-'not in page
assert all(x in page for x in ['01-fast-tank.png','02-shard-splinter.png','03-shield-medic.png','04-bomber-jammer.png','05-phase-burrower.png','06-scout-siege.png'])
for p in REV.rglob('*'):
    if p.is_file()and p.suffix in{'.json','.md','.txt','.html'}:
        b=p.read_bytes();assert not b.startswith(b'\xef\xbb\xbf');b.decode('utf-8')
pngs=[]
for p in sorted((REV/'images').glob('*.png')):
    b=p.read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',b[16:24]);pngs.append({'path':str(p.relative_to(OWNER)).replace('\\','/'),'width':w,'height':h,'sha256':digest(p)})
validation={'owner':'enemies','revision':'r02','status':'integrity and source mapping verified; no main approval asserted','checks':{'existingIds':14,'referenceActions':77,'exactAnatomyLockKeys':True,'all77BodySourcesExist':True,'allCellsAssignedToSameIdentity':True,'moveCyclesExplicit':True,'newIdentityBoards':6,'newIdentityCount':12,'retainedApprovedBoards':2,'onlyCurrentBoardsDisplayed':True,'utf8NoBom':True,'sixFinalImagesActualCreatorViewed':True},'images':pngs,'visualObservations':review_obs,'rootPrecision':'schematic design, not exact exported animation certification'}
write(REV/'integrity-check.json',validation)
print(json.dumps({'newBoards':6,'totalCurrentBodyBoards':8,'ids':14,'actions':77,'imagePaths':pngs,'index':str(REV/'index.html')},ensure_ascii=False,indent=2))
