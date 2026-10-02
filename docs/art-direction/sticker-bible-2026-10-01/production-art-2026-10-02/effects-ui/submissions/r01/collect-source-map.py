"""Read-only source evidence collection for the art inventory. Writes only beside this file."""
from pathlib import Path
import re, json, hashlib, subprocess

ROOT = Path('D:/WebProjects/GeoGuard')
OUT = Path(__file__).resolve().parent
BASE = 'src/logic/engine/bossAbilityRuntime.js'
OPT = 'src/logic/engine/bossOptimizedAbilities.js'

def branches(path, pattern):
    text = (ROOT / path).read_text(encoding='utf-8-sig')
    matches = list(re.finditer(pattern, text, re.M))
    rows = {}
    for i, m in enumerate(matches):
        end = matches[i+1].start() if i+1 < len(matches) else text.find('\n};',m.end())
        fragment = text[m.start():end].rstrip()
        rows[m[1]] = {'path': path, 'line': text.count('\n', 0, m.start())+1,
                     'code': fragment, 'sha256': hashlib.sha256((ROOT/path).read_bytes()).hexdigest()}
    return rows

fallback = branches(BASE, r"^  if \(abilityName === '([^']+)'\)")
optimized = branches(OPT, r'^  (\w+): \(c\) =>')
# Alias handlers must be expanded for effects; preserve their own source reference too.
aliases = {'creepingCanopy': 'seedPods', 'deadEnd': 'mazeCrush', 'gateSwap': 'raiseWalls'}
helper_src = (ROOT/OPT).read_text(encoding='utf-8-sig')
helpers = {
  'placeWalls': helper_src[helper_src.index('const placeWalls'):helper_src.index('const stealWithCourier')],
  'stealWithCourier': helper_src[helper_src.index('const stealWithCourier'):helper_src.index('// These handlers')],
  'plant': helper_src[helper_src.index('const plant'):helper_src.index('const placeWalls')],
}

rows = []
def calls(code, name):
    found=[]
    for m in re.finditer(r'\b'+name+r'\s*\(', code):
        start=m.end()-1; depth=0; quote=None; escape=False
        for i in range(start,len(code)):
            ch=code[i]
            if quote:
                if escape: escape=False
                elif ch=='\\': escape=True
                elif ch==quote: quote=None
                continue
            if ch in "'\"`": quote=ch; continue
            if ch=='(': depth+=1
            elif ch==')':
                depth-=1
                if depth==0: found.append(code[start:i+1]); break
    return found

for name in sorted(set(fallback) | set(optimized)):
    primary = optimized.get(name, fallback.get(name))
    code = primary['code']
    if name in aliases: code += '\n' + optimized[aliases[name]]['code']
    if 'handlers.nestBloom' in code: code += '\n' + optimized['nestBloom']['code']
    if 'handlers.spawnHive' in code: code += '\n' + optimized['spawnHive']['code']
    if 'handlers.seedPods' in code: code += '\n' + optimized['seedPods']['code']
    if 'placeWalls' in code: code += '\n' + helpers['placeWalls']
    if 'stealWithCourier' in code: code += '\n' + helpers['stealWithCourier']
    line_calls = bool(re.search(r'\bqueueLineHazard\s*\(', code))
    area_calls = bool(re.search(r'\bqueueAreaHazard\s*\(', code))
    labels = sorted(set(re.findall(r"label:\s*'([^']+)'", code)))
    mechanics = sorted(set(re.findall(r"plant\((?:c|context),\s*'([^']+)'", code)))
    summons = sorted(set(re.findall(r"spawnAround\([^,]+,\s*'([^']+)'", code)+re.findall(r"spawnEnemyAt\('([^']+)'", code)))
    resources = []
    line_labels=sorted(set(x for call in calls(code,'queueLineHazard') for x in (re.findall(r"label:\s*'([^']+)'",call) or ['unlabelled default'])))
    area_labels=sorted(set(x for call in calls(code,'queueAreaHazard') for x in (re.findall(r"label:\s*'([^']+)'",call) or ['unlabelled default'])))
    if line_calls: resources.append('hazard.line / '+','.join(line_labels))
    if area_calls: resources.append('hazard.area / '+','.join(area_labels))
    if 'spawnImpactWave' in code: resources.append('impactWave / '+(','.join(sorted(set(re.findall(r"style:\s*'([^']+)'",code)))) or 'generic'))
    if mechanics: resources += ['independent MECHANIC_'+v.upper() for v in mechanics]
    if 'web' in mechanics: resources.append('terrain.area / web (queueMechanicTerrain)')
    if 'root' in mechanics: resources.append('terrain.area / poison (queueMechanicTerrain)')
    if summons: resources += ['independent enemy '+v for v in summons]
    if 'shield' in code: resources.append('shield state overlay (actual recipient)')
    if '.hp = Math.min' in code: resources.append('heal feedback (cosmetic only)')
    if 'frozenTimer' in code: resources.append('tower frozen overlay')
    if 'spawnFloatingText' in code or 'state.money' in code: resources.append('money/text feedback')
    moves = bool(re.search(r'\b(?:boss|partner)\.(?:x|y|dashTimer)\s*=',code))
    if moves: resources.append('logical displacement cue; root stays fixed in body art')
    if not resources: resources.append('body/state presentation; consult full source evidence')
    rows.append({'ability': name, 'handler': 'optimized' if name in optimized else 'fallback',
                 'source': {k:v for k,v in primary.items() if k!='code'},
                 'resources':resources, 'labels':labels, 'mechanics':mechanics, 'summons':summons,
                 'displacement': moves, 'code':primary['code'],
                 'fallbackSource': fallback.get(name) if name in optimized else None})

catalog_js = """
import {BOSS_TYPES,TOWER_LIBRARY} from './src/data/gameConfig.js';
import {getBossEditorBaseTemplate,enrichBossTemplate,createTwinsEncounterMembers} from './src/logic/engine/encounterRuntime.js';
const ids=[...new Set(Object.keys(BOSS_TYPES).map(x=>x.replace(/_T[123]$/,'')))];
const bosses=ids.map(id=>{const t=enrichBossTemplate(getBossEditorBaseTemplate(id));return {id,form:t.form,phases:t.phases};});
const twins=createTwinsEncounterMembers({...getBossEditorBaseTemplate('TWINS'),maxHp:440,baseSpeed:92});
console.log(JSON.stringify({bosses,twins:twins.map(t=>({id:t.id,form:t.form,phases:t.phases})),towers:TOWER_LIBRARY},null,2));
"""
result = subprocess.run(['node','--input-type=module','-e',catalog_js], cwd=ROOT, check=True, capture_output=True, text=True, encoding='utf-8')
catalog = json.loads(result.stdout)
(OUT/'runtime-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'boss-source-map.json').write_text(json.dumps({'method':'static source collection, not runtime execution or gameplay testing', 'dispatch':'useGeoGuardGame.jsx runBossAbility -> runBossOptimizedAbility -> optimized handler else fallback', 'helpers':helpers,'abilities':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

md = ['# Boss 技能独立效果逐项清单','', '当前调用优先 optimized；下表按实际 dispatcher 取来源。静态来源提取，配合 inventory.md 人工边界说明；不是实机测试。未标 label 的 line 沿用通用线危险区，不能包装成 projectile。','',
      '|身份／运行期 form|阶段|技能|独立资源需求|代码依据|','|---|---|---|---|---|']
all_used=set()
index={r['ability']:r for r in rows}
for boss in [b for b in catalog['bosses'] if b['id'] != 'TWINS']+catalog['twins']:
    ability_phases={}
    for n,p in enumerate(boss['phases']):
        for a in p['abilities']: ability_phases.setdefault(a,[]).append('P'+str(n+1))
    if boss['form']=='twinSun': ability_phases['soloSolarVolley']=['幸存狂暴']
    if boss['form']=='twinMoon': ability_phases['soloLunarOrbit']=['幸存狂暴']
    for a,phases in ability_phases.items():
        all_used.add(a)
        r=index[a]; ref=r['source']; resource='；'.join(r['resources'])
        md.append(f"|{boss['id']} / {boss['form']}|{','.join(phases)}|{a}|{resource}|{r['handler']}: `{ref['path']}:{ref['line']}`|")
md += ['', '## 模板／作者库保留但非当前标准遭遇直接技能', '', 'TWINS标准遭遇入口createBossEncounterRuntime会拆成TWIN_SOL/TWIN_LUNA，使用上述两套阶段；基础TWINS模板中的twinOrbit/twinBolt/twinSwap仅留来源，不作为当前双体直接运行。hiveHeal/dragonBreath也只留自定义fallback支持。', '', '|技能|资源需求|依据|','|---|---|---|']
for r in rows:
    if r['ability'] not in all_used:
        md.append(f"|{r['ability']}|{'；'.join(r['resources'])}|`{r['source']['path']}:{r['source']['line']}`|")
md += ['', '## 生命周期与复用', '',
       '- 所有 line／area 使用预警形状、结算瞬间和装饰消散的独立资源；参数来自运行期，不从图片推导。AREA 多次脉冲每次读取当前 radius；LINE 取 x/y/x2/y2/width。',
       '- WEB／ROOT 由 plant 调用 queueMechanicTerrain，另产持续地形 web／poison；terrain 所有权由 ownerMechanicUid 和 ownerBossUid 控制。',
       '- 机关、召唤单位有独立 UID/HP/root。表中列的是来源要求，本组只制作外部环、连线、闪光等，不制作或替代其身体。',
       '- spawnAround 受预算与放置结果限制，召唤闪光只对应实际成功生成；图片不得承诺固定召唤数量。',
       '- 原始 fallback 的额外 source 保存于 boss-source-map.json，避免把被覆盖的效果当主运行来源。',
       '- 上表覆盖 enriched 模板全部技能、TWINS双体和幸存技能；自定义模板可变，本包列现有支持处理器全集。',
       '- 本表属于清单提交，所有效果仍待主审批准后制作，不标为生产就绪。', '']
(OUT/'boss-effects.md').write_text('\n'.join(md),encoding='utf-8')
print(json.dumps({'bossTemplates':len(catalog['bosses']),'runtimeBodies':17,'twinBodies':len(catalog['twins']),'usedAbilities':len(all_used),'supportedHandlers':len(rows),'optimized':len(optimized)},ensure_ascii=False))
