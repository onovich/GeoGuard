"""Resolve formally accepted effects, verify final atlas, then seal r02 once."""
from pathlib import Path
from html import escape as E
from html.parser import HTMLParser
import json, hashlib, os, collections

OUT=Path(__file__).resolve().parent
BASE=OUT.parents[2]
assert not (OUT/'packet.json').exists(), 'immutable revision already sealed'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def dump(n,d):(OUT/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def write(n,t):(OUT/n).write_text(t,encoding='utf-8')
def rel(p):return Path(os.path.relpath(p,OUT)).as_posix()
def norm(k):return k if '/' in k else '/'.join(k.rsplit(':',1))
def a(p,t):return f'<a href="{E(p,quote=True)}">{E(str(t))}</a>'
fx=BASE/'effects-ui/submissions/r02'
review=BASE/'reviews/effects-ui-r02.md'
assert '— accepted' in review.read_text(encoding='utf-8-sig')
packet=load(fx/'packet.json')
hashes={}
for rev in ['r01','r02']:
    pp=load(BASE/'effects-ui/submissions'/rev/'packet.json')
    for f in pp['files']:
        path=BASE/'effects-ui'/f['path'];assert path.exists() and sha(path)==f['sha256'],path
        hashes[path.resolve()]=f['sha256']
mapping=load(fx/'production-split.json')
cells=load(fx/'cell-catalog.json')['cells']
final=load(OUT/'production-map.json')
snapshot=load(OUT/'source-snapshot.json')['sha256']
snapshot.pop('production-art-2026-10-02/integration/READY.json',None)
for path in [review,*fx.iterdir()]:
    if path.is_file():snapshot[path.relative_to(BASE.parent).as_posix()]=sha(path)
resolved={}
for key,c in cells.items():
    path=(fx/c['file']).resolve();assert path in hashes and sha(path)==hashes[path],key
    assert key==c['board']+'/'+c['cell'] and c['lifecycle'] and c['pivot'],key
    resolved[key]={'key':key,'image':rel(path),'sha256':sha(path),'board':c['board'],'cell':c['cell'],
                   'title':c['title'],'pivot':c['pivot'],'layer':c['layer'],'lifecycle':c['lifecycle'],
                   'review':'accepted_original_art_stage','reviewEvidence':rel(review),
                   'locatorAccuracy':'named design section; not an exported rectangle or continuous frame',
                   'originalSubmissionMetadata':c}
external={norm(x['key']):x for group in ['friendly','enemies','bossMechanicReferences'] for x in mapping[group]}
assert len(external)==375 and set(external)=={x['key'] for x in final['actions']}
effect_locator_count=0
for x in final['actions']:
    ext=external[x['key']]
    refs=ext['effectCells'];assert all(k in resolved for k in refs),x['key']
    x['externalEffectSources']=[resolved[k] for k in refs]
    x['externalEffectContract']=ext
    x['externalEffectSpecPage']=rel(fx/'index.html')
    x['externalEffectReviewEvidence']=rel(review)
    effect_locator_count+=len(refs)
    # Verify the effects group consumed the actual final body contract, not old r01 inputs.
    if x['owner']=='friendly':assert ext['currentBodyReference']==x['contract']['bodyReference']
    elif x['owner']=='enemies':assert ext['currentBodySources']==x['contract']['bodySources']
    else:assert ext['currentBodySource']==x['contract']['productionBodySource']
skills=[]
for key,sk in mapping['abilityCatalog'].items():
    if sk['standardOrSurvivor']:
        refs=list(dict.fromkeys(sk['effectCells']+[k for k in [sk['windupCell'],sk['openingCell']] if k]))
        assert refs and all(k in resolved for k in refs) and sk['lifecycleByCell'],key
        skills.append({'key':'skill:'+key,'review':'accepted_original_art_stage',
                       'specPage':rel(fx/'index.html'),'reviewEvidence':rel(review),
                       'effectSources':[resolved[k] for k in refs],'contract':sk})
assert len(skills)==95 and len(mapping['abilityCatalog'])==101
supported=[k for k,v in mapping['abilityCatalog'].items() if v['dispatch']!='no-handler']
assert len(supported)==100
for u in mapping['ui']:assert all(k in resolved for k in u['cells'])
for ref in packet['images']+packet['retainedApprovedImages']:
    path=BASE/'effects-ui'/ref;assert path.resolve() in hashes
    final['gallery'].append({'owner':'effects-ui','sourcePath':ref,'path':rel(path),'sha256':sha(path),
                             'role':'independent_effect_or_player_ui_design','imageReview':rel(review),
                             'mappingReview':rel(review),'approvalScope':'accepted original art design; effective text/color overrides apply',
                             'identities':[]})
assert len(final['gallery'])==38 and len({g['path'] for g in final['gallery']})==38
color_spec=(fx/'ui-color-type-spec.md').read_text(encoding='utf-8-sig')
direction=mapping['currentFriendlyDirectionPolicy']
assert 'SENTINEL' in direction['printedNotesOverride']
overrides={'status':'effective_accepted_design_specification','uiColorType':{'source':rel(fx/'ui-color-type-spec.md'),
           'reviewEvidence':rel(review),'text':color_spec,
           'rule':'B05 pale-green button white text is superseded by #4B281C dark brown; B06/B07 CTA and labels follow same rule.',
           'solidColors':[{'background':bg,'text':'#4B281C'} for bg in ['#B6D4AE','#FFF9EF','#C7E4F4','#F4ADA0','#F8DDAA']],
           'targetContrast':4.5,'primaryReviewedSolidContrastRange':[7.00,12.38],
           'limits':'solid design colors only; not actual translucent compositing/device layout proof'},
           'friendlyDirection':{'source':rel(BASE/'friendly/submissions/r03/reuse-design.md'),
             'reviewEvidence':rel(BASE/'reviews/friendly-r03.md'),'policy':direction,
             'rule':'SENTINEL printed LEFT180/rotate launcher at P is superseded: mirror entire local rig at fixed root including P/M, then residual aim at mirrored P. RIGHT default. UP approved projection/occlusion construction.'}}
final.update({'status':'submitted_for_primary_review','skills':skills,'effectCells':resolved,'playerUI':mapping['ui'],
              'effectsUI':{'revision':'r02','review':'accepted_original_art_stage','specPage':rel(fx/'index.html'),'reviewEvidence':rel(review)},
              'effectiveOverrides':overrides,'abilityScope':{'runtimeDefaultAndSurvivor':95,'supportedHandlers':100,
                 'allCatalogKeys':101,'noHandlerKeys':['tailSweep'],
                 'legacySupportedOutsideDefault':[k for k in supported if not mapping['abilityCatalog'][k]['standardOrSurvivor']]}})
dump('production-map.json',final)
coverage=load(OUT/'coverage.json')
coverage.update({'status':'submitted_for_primary_review','bodyAndRelationshipSheets':29,'effectAndUISheets':9,'totalSheets':38,
                 'externalAssignments':375,'externalCellLocators':effect_locator_count,'effectCellCatalog':len(resolved),
                 'effectsUI':final['effectsUI'],'allCatalogKeys':101,'noHandlerKeys':['tailSweep'],
                 'bodyCellLocators':sum(len(x['bodySources']) for x in final['actions']),
                 'versions':dict(coverage['versions'],**{'effects-ui':'r02'}),'packetPublished':True,'READYPublished':True,
                 'integrationApproval':'awaiting_primary_review; upstream accepted only'})
dump('coverage.json',coverage)
queue=load(OUT/'queue-audit.json');assert all(x['result']!='awaiting_primary_review' for x in queue['sealedPackets'])
queue.update({'status':'final_pre_submission_snapshot','integration':'r01 accepted; r02 newly submitted, awaiting primary review',
              'newSubmission':{'owner':'integration','revision':'r02','result':'awaiting_primary_review','packet':'packet.json'},
              'unreviewed':[{'owner':'integration','revision':'r02','reason':'new submission from this run'}]})
dump('queue-audit.json',queue)
dump('source-snapshot.json',{'sha256':snapshot,'note':'Final source snapshot before integration r02 publication; immutable dependencies verified'})
write('effective-specifications.md','# 生效规格覆盖\n\n以下文字规格已被主审接受，优先于原画板中的冲突简写；图片仅设定参考。\n\n'
      '## SENTINEL及我方方向\n\n'+overrides['friendlyDirection']['rule']+'\n\n[完整方向合同]('+overrides['friendlyDirection']['source']+') · [主审]('+overrides['friendlyDirection']['reviewEvidence']+')\n\n'
      '## UI对比度及字号\n\n'+color_spec+'\n\n[上游规格]('+overrides['uiColorType']['source']+') · [主审]('+rel(review)+')\n\n'
      '主审规定实色五组文字/背景对比7.00–12.38，超过设计目标4.5；实际半透明合成、390px手机/1440px桌面与设备排版仍未验证。\n')
write('coverage.md','# r02最终汇总覆盖\n\n状态：submitted，等待integration主审；四制作组已主审accepted。\n\n'
      '|组|最终版本|身体参考归属|外部效果归属|板数|\n|---|---|---:|---:|---:|\n|friendly|r03|106|106|7|\n|enemies|r02|77|77|9（含关系补充）|\n|bosses-mechanics|r03|192|192|13|\n|effects-ui|r02|—|375条＋95技能|9（含r01保留两板）|\n\n'
      '375逐key匹配解剖锁，48身份，无重复、缺项、额外或新增精英。合计38张本轮规范板=28身体＋1关系补充＋9效果/UI。'
      f"逐条核验{coverage['bodyCellLocators']}个身体源格与{effect_locator_count}个外部效果引用；57个效果目录格全可解析。\n\n"
      '95默认/幸存技能、100支持handler、101库key分开；tailSweep无handler，不虚构效果。旧探索图与旧方向参考不作为新身体源格或默认画廊。\n\n'
      '概念关键格为静态参考；明确复用保存源格/序列；方向构造保留LEFT整体rig镜像、RIGHT默认及UP投影遮挡合同；等级、状态与召唤/弹体独立。375参考动作不等于375独立动画。\n\n'
      '[生效规格](effective-specifications.md)覆盖B05白字浅绿、B06/B07文字与SENTINEL旧LEFT180简写。数值锚点proposed；原画通过不等于透明sprite、图集/连续动画、实测挂点、代码接入、设备或性能测试通过。\n')
write('production-map.md','# r02生产归属最终汇总\n\n[总图册](index.html) · [完整契约JSON](production-map.json) · [生效规格](effective-specifications.md)\n\n'
      '每条身体与外部效果均可回溯最终组规范页、文件/行格或命名效果分区及主审记录。未把375参考条目视为375独立动画。\n\n'
      '|动作|身体来源格|外部效果格|类型|\n|---|---|---|---|\n'+''.join(
         f"|{x['key']}|"+'；'.join(f"[{s['label']}]({s['path']}) 行{s['row']}列{s['column']}" for s in x['bodySources'])+'|'+
         '；'.join(f"[{s['key']}]({s['image']})" for s in x['externalEffectSources'])+f"|{x['mappingMode']}|\n" for x in final['actions'])+
      '\n## 95默认/幸存技能\n\n|技能|具体效果格|\n|---|---|\n'+''.join('|'+s['key']+'|'+'；'.join(f"[{c['key']}]({c['image']})" for c in s['effectSources'])+'|\n' for s in skills))
write('queue-audit.md','# 通信队列最终提交审计\n\n全部旧封存packet SHA一致，每组当前READY及所有历史封包均有主审结果。friendly r02 changes_requested只退方向说明，r03已修复并accepted。\n\n'
      '|组|版本|当前READY|主审结果|证据|\n|---|---|---|---|---|\n'+''.join(
          f"|{x['owner']}|{x['revision']}|{x['isCurrentREADY']}|{x['result']}|[review]({x['review']})|\n" for x in queue['sealedPackets'])+
      '\n本次新增integration r02：submitted/awaiting_primary_review；READY发布后保持可见，主审需新增对应结果。不得把新提交自审为accepted。\n')
write('stage-summary.md','# 美术原画与生产拆分阶段总结\n\n四组最终主审accepted：friendly r03、enemies r02、bosses-mechanics r03、effects-ui r02。总图册含38张本轮板、48身份、375身体与外部效果逐条映射、95默认/幸存技能和玩家UI。\n\n'
      '继承既有器官身份，无新增精英。HIVE优化spawnHive→NEST，summonSwarm基础回退→SHARD，NEST触发→BASIC；机关独立HP/计时；双子两个实体；COURIER即时退款和真正掉落分开。'
      '弹体/枪口/命中、危险区、召唤反馈、OPEN全身提示独立于身体。B05对比度和SENTINEL方向文字以生效规格为准。\n\n'
      '本轮仅原画与生产拆分设计。概念源格及复用未转为透明sprite/连续动画；root/P/M等数值为proposed；可编辑生产源稿/导出图集、逐帧精度、代码接入、设备和性能测试仍属后续生产。未修改游戏代码、提交或部署。\n\n'
      'integration r02已封包提交，等待主审结果；提交后停止，不修改本revision。\n')
old=(OUT/'index.html').read_text(encoding='utf-8')
style=old.split('<style>',1)[1].split('</style>',1)[0]
cards=''.join('<figure>'+a(g['path'],Path(g['path']).name)+f'<img loading="lazy" src="{E(g["path"],quote=True)}" alt="{E(g["role"])}"><figcaption>'+E(' / '.join(g['identities']) or g['role'])+'<br>'+a(g['imageReview'],'图审')+' · '+a(g['mappingReview'],'最终映射审查')+'</figcaption></figure>' for g in final['gallery'])
body=''
for x in final['actions']:
    sr='<br>'.join(a(s['path'],f"行{s['row']} 列{s['column']} · {s['label']}") for s in x['bodySources'])
    er='<br>'.join(a(s['image'],s['key']+' '+s['title']) for s in x['externalEffectSources'])
    detail={'mode':x['mappingMode'],'transform':x['transform'],'levelOverlay':x['levelOverlay'],'construction':x['constructionReference'],'pointer':x['sourcePointer']}
    body+=f'<tr data-owner="{x["owner"]}"><td>{E(x["key"])}</td><td>'+a(x['specPage'],f"{x['owner']} {x['revision']}")+'</td><td>'+sr+'</td><td>'+er+'<br>'+a(x['externalEffectSpecPage'],'效果规范')+'</td><td>'+E(x['mappingMode'])+'<details><summary>复用／构造合同</summary><pre>'+E(json.dumps(detail,ensure_ascii=False,indent=2))+'</pre>'+a(x['sourceJSON'],'来源JSON')+'</details></td><td>'+a(x['reviewEvidence'],'身体主审')+' · '+a(rel(review),'效果主审')+'</td></tr>'
skill_html=''.join('<tr><td>'+E(s['key'])+'</td><td>'+E(', '.join(s['contract']['owners']))+' · '+E(s['contract']['availability'])+'</td><td>'+'<br>'.join(a(c['image'],c['key']+' '+c['title']) for c in s['effectSources'])+'</td><td><details><summary>触发／生命周期／几何</summary><pre>'+E(json.dumps({'dispatch':s['contract']['dispatch'],'lifecycle':s['contract']['lifecycleByCell'],'geometry':s['contract']['geometryMappings']},ensure_ascii=False,indent=2))+'</pre></details></td></tr>' for s in skills)
ui_html=''.join('<tr><td>'+E(u['component'])+'</td><td>'+' · '.join(a(resolved[k]['image'],k) for k in u['cells'])+'</td><td>'+E(u['rule'])+'</td></tr>' for u in mapping['ui'])
write('index.html','<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoGuard 美术总图册 r02</title><style>'+style+'</style><main><h1>GeoGuard 美术总图册 · r02</h1><p>2026-10-02 · 四制作组已主审accepted；integration汇总submitted，待主审。</p>'
      '<div class="notice">38张本轮规范板 · 48身份 · 375身体与外部效果归属 · 95默认/幸存技能。入口均指向最终已批组规范页。'
      '<br>375原画参考动作不等于375独立动画。挂点proposed；原画通过≠透明动画资源、代码接入、设备或实机测试通过。</div>'
      '<h2>生效规格 · 覆盖图中文字</h2><div class="notice"><strong>SENTINEL LEFT180旧简写已覆盖：</strong>整个局部rig绕固定root镜像，body/脸/脚/部件/P/M一起镜像，再在镜像P作剩余瞄准；RIGHT默认，UP按获批构造处理投影遮挡。'
      '<br><strong>B05及B06/B07文字：</strong>浅绿/浅色按钮与标签使用深棕#4B281C，B05白字浅绿示例不生效。五组规定实色对比7.00–12.38；真实合成及设备排版另验。<br>'+a('effective-specifications.md','完整生效规格与字号')+'</div><p>'+
      ' · '.join(a(f,t) for f,t in [('coverage.md','覆盖核查'),('production-map.json','完整契约JSON'),('production-map.md','生产映射'),('queue-audit.md','通信队列'),('stage-summary.md','阶段总结')])+'</p>'+
      '<h2>最终规范入口</h2><p>'+' · '.join(a(rel(BASE/o/'submissions'/r/'index.html'),o+' '+r) for o,r in coverage['versions'].items())+'</p>'+
      '<h2>已批原画板</h2><p>28身体板＋1独立实体关系补充＋9效果/UI；旧探索图不混作最终body。</p><div class="gallery">'+cards+'</div>'+
      '<h2>375逐动作来源</h2><p>概念关键格仅静态参考；MOVE序列、方向构造、外置等级和姿态共享均显式标注，未导出连续资源。</p><label for="q">检索动作</label><input id="q" type="search"><label for="o">组</label><select id="o"><option value="">全部</option>'+''.join(f'<option>{o}</option>' for o in ['friendly','enemies','bosses-mechanics'])+'</select><p id="count">375 / 375</p><div class="scroll"><table id="actions"><thead><tr><th>动作key</th><th>身体规范入口</th><th>身体概念格</th><th>独立效果格</th><th>映射方式</th><th>审批依据</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
      '<h2>95默认/幸存技能</h2><p>100支持handler另计；库共101key，tailSweep无handler，不虚构效果。各格生命周期按真实事件/计时器，原画不会生成伤害或召唤。</p><div class="scroll"><table><thead><tr><th>技能</th><th>归属/可用性</th><th>效果板格</th><th>生命周期</th></tr></thead><tbody>'+skill_html+'</tbody></table></div>'+
      '<h2>真实玩家UI</h2><div class="scroll"><table><thead><tr><th>组件</th><th>规范格</th><th>功能边界</th></tr></thead><tbody>'+ui_html+'</tbody></table></div>'+
      '<script>const q=document.getElementById("q"),o=document.getElementById("o"),rs=[...document.querySelectorAll("#actions tbody tr")];function f(){let n=0;for(const r of rs){const yes=r.cells[0].textContent.toLowerCase().includes(q.value.toLowerCase())&&(!o.value||r.dataset.owner===o.value);r.hidden=!yes;if(yes)n++}document.getElementById("count").textContent=n+" / 375"}q.oninput=f;o.onchange=f;</script></main></html>')
class Links(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.images=0
    def handle_starttag(self,t,attrs):
        d=dict(attrs)
        if t in ['a','img']:self.refs.append(d.get('href') or d.get('src'));self.images+=t=='img'
check=Links();check.feed((OUT/'index.html').read_text(encoding='utf-8'))
assert check.images==38 and all((OUT/r.split('#')[0]).is_file() for r in check.refs)
for path in OUT.iterdir():assert not path.read_bytes().startswith(b'\xef\xbb\xbf'),path
for g in final['gallery']:assert sha((OUT/g['path']).resolve())==g['sha256']
for p,h in snapshot.items():assert sha(BASE.parent/p)==h, p
dump('verification.json',{'status':'verified_before_seal','actions':375,'identities':48,'displayedSheets':38,
                          'bodyCellLocators':coverage['bodyCellLocators'],'externalCellLocators':effect_locator_count,
                          'effectCatalogCells':len(resolved),'defaultSurvivorSkills':95,'supportedHandlers':100,
                          'htmlLinksValid':len(check.refs),'allSourceHashesValid':True,'UTF8WithoutBOM':True,
                          'effectiveOverridesVisible':True,'oldExplorationInFinalGallery':False,
                          'notRun':['image approval by integration','continuous animation','transparent sprite/atlas export','code integration','device layout','runtime/performance tests']})
files=[{'path':p.relative_to(BASE/'integration').as_posix(),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(OUT.iterdir()) if p.is_file()]
dump('packet.json',{'owner':'integration','revision':'r02','status':'submitted',
                   'scope':'Final original-art atlas and production split integration; no runtime resource certification',
                   'files':files,'images':[],'referencedAcceptedImages':final['gallery'],
                   'coveredIds':[x['key'] for x in final['identities']],
                   'coveredActions':[x['key'] for x in final['actions']]+[s['key'] for s in skills],
                   'counts':{'identities':48,'referenceActions':375,'defaultSurvivorSkills':95,'boards':38},
                   'openIssues':['Integration r02 awaits primary review.', 'Transparent editable sprite/atlas production, continuous animation, measured anchors, code/device/performance validation remain subsequent production.'],
                   'dependencies':[{'owner':o,'revision':r,'review':'accepted_original_art_stage','evidence':rel(BASE/'reviews'/f'{o}-{r}.md')} for o,r in coverage['versions'].items()],
                   'summary':'38 approved upstream boards; exact 375 body+external assignments /48 identities /95 default-survivor skills; effective color and SENTINEL overrides; new integration revision submitted, not self-approved.'})
# Verify the sealed manifest before making the revision visible to the reviewer.
for f in load(OUT/'packet.json')['files']:assert sha(BASE/'integration'/f['path'])==f['sha256']
tmp=BASE/'integration/READY.tmp.json';tmp.write_text(json.dumps({'revision':'r02','packetPath':'submissions/r02/packet.json'},indent=2)+'\n',encoding='utf-8');tmp.replace(BASE/'integration/READY.json')
print(json.dumps({'publishedRevision':'r02','actions':375,'identities':48,'boards':38,'skills':95,'externalCellLocators':effect_locator_count,'validHTMLLinks':len(check.refs),'manifestFiles':len(files)}))
