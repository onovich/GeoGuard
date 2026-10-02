"""Build the local, self-contained review index. No application code is touched."""
from pathlib import Path
import json, html

OUT=Path(__file__).resolve().parent
if (OUT/'packet.json').exists(): raise SystemExit('Sealed revision.')
split=json.loads((OUT/'production-split.json').read_text(encoding='utf-8'))
cells=json.loads((OUT/'cell-catalog.json').read_text(encoding='utf-8'))['cells']
e=html.escape
boards=[('B01','b01-friendly-projectiles.png','10来源弹体与独立flash'),('B02','b02-status-world.png','16状态与战场层'),('B03','b03-hazard-lifecycle.png','实际圆区与线段生命周期'),('B04','b04-mechanic-feedback.png','独立地形、召唤、破碎、退款'),('B05','b05-start-end.png','开始与结束'),('B06','b06-rewards-blueprints.png','奖励与未来新建蓝图'),('B07','b07-controls-placement.png','暂停、操作与放置反馈'),('R01_HUD','../r01/hud-desktop-mobile.png','已过桌面／移动HUD'),('R01_HIT','../r01/vfx-projectile-flash-hit.png','已过三个kind的命中行')]
gallery=[]
for board,file,title in boards:
 refs=[f'<span>{e(k)} · {e(v["title"])}</span>' for k,v in cells.items() if v['file']==file]
 gallery.append(f'<article id="{board}"><div class="board-head"><h2>{board} · {title}</h2><small>{"r01 已通过保留" if board.startswith("R01") else "r02 整包待审"}</small></div><a href="{file}" target="_blank"><img src="{file}" alt="{e(title)}" loading="lazy"></a><div class="cell-list">{"".join(refs)}</div></article>')
abilities=[{k:v for k,v in row.items() if k in ['abilityId','owners','dispatch','availability','effectCells','geometryMappings','windupCell','openingCell','lifecycleByCell','runtimeEvidence','overrideDifference','upstreamLogicalMotion','moneyFeedbackBinding','sourceHandlerExcerpt']} for row in split['abilityCatalog'].values() if row['standardOrSurvivor']]
assignments=[]
for category,key in [('我方','friendly'),('敌方','enemies'),('Boss／机关','bossMechanicReferences')]:
 for row in split[key]:
  assignments.append({'group':category,'key':row['key'],'cells':row['effectCells']})
data=json.dumps({'abilities':abilities,'assignments':assignments,'cells':cells},ensure_ascii=False).replace('<','\\u003c')
doc=r'''<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoGuard Effects/UI r02 · 审阅索引</title>
<style>
:root{font:16px/1.6 system-ui,"Microsoft YaHei",sans-serif;color:#4b281c;background:#fff9ef}*{box-sizing:border-box}body{margin:0}main{max-width:1280px;margin:auto;padding:32px 22px 72px}h1{font-size:34px;line-height:1.2;margin:0 0 12px}h2{font-size:20px;margin:0}h3{font-size:20px;margin:36px 0 14px}p{max-width:1000px}a{color:#4b281c;text-underline-offset:3px}nav{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0}nav a,.pill{border:1px solid #8b6756;border-radius:8px;padding:5px 10px;background:#f4e8d9}article{border:2px solid #795640;border-radius:16px;overflow:hidden;background:#fffef9;margin:24px 0;scroll-margin-top:18px}.board-head{padding:16px 18px;display:flex;gap:20px;align-items:center;justify-content:space-between;flex-wrap:wrap}small{font-size:13px}article img{display:block;width:100%;height:auto}.cell-list{padding:12px 18px;display:flex;gap:8px;flex-wrap:wrap}.cell-list span{font-size:12px;background:#f4eee5;border-radius:6px;padding:4px 7px}.note{background:#e8f0df;border-left:4px solid #6a8a59;padding:14px 18px;border-radius:4px}input{width:100%;max-width:760px;font:inherit;color:inherit;background:#fffef9;padding:10px 14px;border:1px solid #795640;border-radius:8px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:12px 10px;border-bottom:1px solid #d1bda9;text-align:left;vertical-align:top}th{background:#eee4d7;position:sticky;top:0}td:first-child{min-width:150px;font-weight:650}.table-scroll{overflow:auto}pre{white-space:pre-wrap;word-break:break-word;font:12px/1.6 ui-monospace,monospace;background:#f5eee4;padding:12px;border-radius:6px}details{margin-top:10px}summary{cursor:pointer}.links a{display:inline-block;margin:3px 9px 3px 0}footer{font-size:13px;margin-top:40px}@media(max-width:640px){main{padding:24px 12px}h1{font-size:28px}.board-head{padding:12px}.cell-list{padding:10px}td,th{padding:8px;font-size:12px}}
</style><main>
<h1>GeoGuard · Effects/UI r02</h1><div class="pill">7张新原画 · 95技能 · 375外部效果归属 · 整包 submitted</div>
<p>奶油留白、暖棕轮廓、哑光贴纸语言。效果与身体分层，使用真实逻辑事件。新图是设计来源，尚未做透明资产、连续帧或游戏接入；UI数值与屏幕尺寸均为示例。</p>
<div class="note">当前依赖：friendly r03、enemies r02、bosses-mechanics r03 已书面通过。LEFT须整体rig含P/M绕固定root镜像，再残余瞄准；UP使用各身份已过构造/遮挡。数字挂点仍是proposed。B05浅绿白字由字色规格覆盖为深棕。</div>
<nav><a href="#B01">弹体</a><a href="#B02">状态</a><a href="#B03">危区</a><a href="#B04">机关反馈</a><a href="#B05">开始/结束</a><a href="#B06">奖励</a><a href="#B07">操作</a><a href="#skills">95技能</a><a href="#assignments">375归属</a></nav>
<div class="links"><a href="production-notes.md">生产边界</a><a href="ui-color-type-spec.md">UI字色与字号</a><a href="production-split.json">完整映射JSON</a><a href="skill-map.md">95技能表</a><a href="upstream-dependencies.json">最终依赖与SHA</a><a href="packet.json">封包</a></div>
GALLERY
<h3 id="skills">95项真实技能 → 具体格／几何／生命周期</h3>
<p>93默认＋2幸存技能。H03环装饰覆盖真实disk；H04只复用逐条真实线段构图，实际可以平行或斜交。没有hazard的技能不增加hazard。warning读timer，resolve瞬间结算，fade纯装饰。展开每行查看handler与后续机关触发依据。</p>
<input id="skillSearch" type="search" placeholder="搜索技能、Boss、label、板格，如 gravity / H04 / RETICLE" aria-label="搜索95技能"><p id="skillCount"></p><div class="table-scroll"><table><thead><tr><th>技能与dispatch</th><th>具体来源</th><th>实际几何／生命期</th></tr></thead><tbody id="skillRows"></tbody></table></div>
<h3 id="assignments">375条身体动作 → 外部效果层</h3><p>106我方＋77敌方＋192 Boss/机关。身体最终来源仍由上游负责，此表没有重新批准身体；格的触发条件以完整JSON和cell-catalog为准。</p><input id="assignmentSearch" type="search" placeholder="搜索动作或格，如 DIR_LEFT / enemy:BEACON / COURIER" aria-label="搜索外部效果归属"><p id="assignmentCount"></p><div class="table-scroll"><table><thead><tr><th>组</th><th>动作</th><th>效果格</th></tr></thead><tbody id="assignmentRows"></tbody></table></div>
<footer>r01保留：HUD和三kind命中。tailSweep无handler不制作；五个旧非默认handler仅在完整JSON保留。COURIER即时退款不是掉落；BEACON尝试波与成功生成闪分开。未新增收费升级、声音入口、拾取或伤害窗口。所有UI箭头/技术分栏只是说明，U11横向滚动示意箭头不新增操作按钮。</footer>
</main><script type="application/json" id="data">DATA</script><script>
const d=JSON.parse(document.getElementById('data').textContent);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=k=>{const c=d.cells[k];return c?`<a href="${esc(c.file)}" target="_blank">${esc(k)}</a>`:esc(k)};
function skills(){const q=document.getElementById('skillSearch').value.toLowerCase();const rows=d.abilities.filter(r=>JSON.stringify(r).toLowerCase().includes(q));document.getElementById('skillCount').textContent=`${rows.length} / 95项`;document.getElementById('skillRows').innerHTML=rows.map(r=>{const keys=[...r.effectCells,r.windupCell,r.openingCell].filter(Boolean);const geom=r.geometryMappings.map(g=>`${g.primitive} / ${g.label??''} → ${g.cell}`).join('\n')||'无新增危区；只读实际状态/独立生成';return `<tr><td>${esc(r.abilityId)}<br><small>${esc(r.dispatch)} · ${esc(r.availability)}<br>${esc(r.owners.join(', '))}</small></td><td>${keys.map(link).join(' · ')}<details><summary>各格条件／源handler</summary><pre>${esc(JSON.stringify({lifecycleByCell:r.lifecycleByCell,overrideDifference:r.overrideDifference,logicalMotion:r.upstreamLogicalMotion,money:r.moneyFeedbackBinding,source:r.runtimeEvidence,handler:r.sourceHandlerExcerpt},null,2))}</pre></details></td><td>${esc(geom).replace(/\n/g,'<br>')}<details><summary>真实几何调用</summary><pre>${esc(JSON.stringify(r.geometryMappings,null,2))}</pre></details></td></tr>`}).join('')}
function assignments(){const q=document.getElementById('assignmentSearch').value.toLowerCase();const rows=d.assignments.filter(r=>JSON.stringify(r).toLowerCase().includes(q));document.getElementById('assignmentCount').textContent=`${rows.length} / 375条`;document.getElementById('assignmentRows').innerHTML=rows.map(r=>`<tr><td>${esc(r.group)}</td><td>${esc(r.key)}</td><td>${r.cells.map(link).join(' · ')||'该参考动作无专属效果请求；不从姿态发射'}</td></tr>`).join('')}
document.getElementById('skillSearch').addEventListener('input',skills);document.getElementById('assignmentSearch').addEventListener('input',assignments);skills();assignments();
</script></html>'''
doc=doc.replace('GALLERY','\n'.join(gallery)).replace('DATA',data)
(OUT/'index.html').write_text(doc,encoding='utf-8')
print(json.dumps({'boards':len(boards),'skills':len(abilities),'assignments':len(assignments),'indexBytes':len(doc.encode('utf-8'))}))
