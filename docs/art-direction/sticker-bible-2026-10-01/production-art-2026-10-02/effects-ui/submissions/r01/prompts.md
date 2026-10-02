# 内置 imagegen 提示词与来源

模式：built-in image_gen；不使用CLI/API runner。每张新图/返修各一调用；最终只提交两张样板。输入引用已实际查看。图为概念板，不是透明生产图集、实机截图或导入结果。

## 01 独立弹体／枪口／命中板

```text
Use case: stylized-concept
Asset type: GeoGuard independent VFX art design sheet, FIRST SAMPLE ONLY. High resolution wide landscape raster, creamy negative space, warm dark brown soft rounded outlines, matte mint/honey/terracotta pastel sticker language matching the reference.
Input image: hazards-01.png is STYLE REFERENCE ONLY; do not reproduce any characters from reference.
Primary request: an impeccably clean professional separated-layer design board with three columns and three rows. No character bodies, no towers, no hands, no monsters, no faces, no guns or gun barrels anywhere. Only independent projectile shapes, flash shapes, trails and impacts. 
Header exact: "GeoGuard / INDEPENDENT VFX" subtitle "DESIGN SAMPLE — NOT IMPORTED".
Columns labels: "PROJECTILE", "MUZZLE FLASH", "IMPACT".
Rows labels: "basic", "cannon", "sniper".
Projectile basic: isolated small mint soft seed capsule with warm brown outline; center pivot cross marked P. Cannon: isolated round sage orb with warm brown outline, center pivot P. Sniper: isolated slender mint lance seed oriented RIGHT; center pivot P; separate slim fading two-point trail below labeled "TRAIL / previous → current". All projectile axes tiny thin dashed rightward annotation arrows OUTSIDE the shapes labeled "+X". Cannon remains a straight moving orb, no ballistic arc.
Muzzle flash column: isolated honey yellow soft rounded three-lobe star/puff, each with a tiny warm brown cross at LEFT REAR ROOT marked M, axis pointing RIGHT; no muzzle barrel included. Basic compact, cannon rounded puff, sniper slim flare. M is emitter-local attachment and not projectile birth point.
Impact column: isolated soft honey mint spark petals / orb ripple / tiny piercing glint at WORLD HIT cross H; draw tiny schematic 3-step onset, peak, fade mini glyphs with no bodies.
Generous whitespace and horizontal thin rules, discreet small numeric layer pills: "L3 / projectile + trail", "L4 / flash", "L4 / hit".
Footer exact: "P = projectile center   M = emitter attachment   H = world hit"
Second footer exact: "Logic owns birth position, velocity, damage and timing."
Tiny note: "3 motion kinds / source appearance mapped separately".
Every visual effect belongs in its own isolated swatch. Crosses, axes, labels and panel rules are annotations only, never part of the future exported asset. No fabricated mechanics or hazards. No character body, no summon, no independent unit. Crisp legible English typography, no logos beyond text, no photorealism, no neon, no metallic effect.
```

## 02 桌面＋移动HUD初稿

```text
Use case: ui-mockup
Asset type: GeoGuard desktop + mobile player battle HUD and build bar concept art, FIRST SAMPLE ONLY. Wide landscape image with large left desktop frame and right mobile portrait frame; cream canvas, warm dark brown outlines, soft matte rounded sticker panels, restrained mint/honey/terracotta accents. Calm, clear hierarchy with ample blank battlefield.
Input images roles: ui-player-04-v3.png style and interaction context only, NOT exact gameplay; pilot-01-basic-tower-v4.png anatomy reference BASIC neutral only; batch-06-cannon-sniper.png anatomy reference CANNON/SNIPER neutral only. Treat three card portraits as small faithful neutral illustrations. BASIC 2 top buds, one rear lobe, two feet, one near eye, cheek curve and one short tube. CANNON two top buds, two feet, one near eye and one wide barrel mouth. SNIPER single continuous pear neck, two feet, two eyes on neck, one long beak, one belly pad.
Primary request: polished real-function visual design sample, not a screenshot. Header exact "GeoGuard / PLAYER HUD" and "DESIGN SAMPLE — NOT IMPORTED".
LEFT label "DESKTOP / 1440×900 concept". Desktop HUD anchored TOP: HP at left "HP 100/100" with coral bar; center "WAVE 08" and "01:24"; top right mint diamond with "240", separate button "暂停". Under time narrow boss HUD with exact names "曜子" and "蚀子", each own HP bar. Lines "P2/3 · 蓄力" and "P2/3 · 恢复" and "护卫 2". Small instruction "先避开预警线" as counterplay text.
Desktop battlefield deliberately empty creamy pale subtle floor dots. NO battle characters, no enemies, no bullets in field, no invented map terrain, no artwork on top of HP. A faint caption inside blank battlefield "战场留白 / HUD 层示意" signals composition only.
Desktop bottom compact build bar exactly 3 available starting tower cards using faithful small neutral portraits: "速射塔" / "15" / "Lv.1/4" / "单体 · 0.3秒"; "榴弹炮" / "40" / "Lv.1/4" / "范围 · 1.5秒"; "穿透塔" / "80" / "Lv.1/4" / "穿透 · 2秒". Each cost uses mint diamond. All affordable because money240. No UP button, no paid upgrades, no other menu. Desktop hint above bar "WASD/方向键移动，拖拽塔卡建造" and dismissal "我知道了".
RIGHT label "MOBILE / 390×844 concept". Same exact top grouping left HP, middle WAVE08/01:24, right240 and 暂停; smaller boss panel below with separate 曜子 and 蚀子 HP bars. Large quiet empty field. A faint temporary touch-origin joystick at lower left labeled "触点原点" (not fixed permanent joystick). Bottom bar shows same three cards with portraits and only concise Chinese names, costs15/40/80, Lv.1/4. Above bar a small guidance pill "长按空白处移动，拖拽塔卡建造" and "知道了". Bottom blank inset space is only safe-area design recommendation. 
Below both frames footer exact "现有功能映射 / 留白与触控尺寸为设计目标". Additional tiny note "奖励强化作用于后续新建塔；不增加收费升级。".
No sound/settings button because actual player HUD currently has no rendered audio control. No shop, quests, minimap, extra resources, upgrade buttons, ability buttons, joystick permanently at center. Do not add face to PLAYER. Use crisp Chinese text, cream background, warm brown ink; straight legible UI typography. No realistic device photograph, no shiny glass effects. Layout proposals, not pixel verified implementation.
```

## 03 HUD卡栏文字返修

```text
Use case: precise-object-edit.
Edit target Image 1: GeoGuard PLAYER HUD concept. Fix ONLY the text layouts in the six build cards at the bottom (three desktop and three mobile). Preserve the existing cream/warm-brown style, overall composition, HUD panels, header, empty battlefield, neutral card character portraits, and all other text exactly.
Each of the three DESKTOP cards must visibly include name, mint diamond COST numeric line, LEVEL line, and type/rate line. Exact text by card:
Left: "速射塔" ; mint diamond "15" ; "Lv.1/4" ; "单体 · 0.3秒"
Middle: "榴弹炮" ; mint diamond "40" ; "Lv.1/4" ; "范围 · 1.5秒"
Right: "穿透塔" ; mint diamond "80" ; "Lv.1/4" ; "穿透 · 2秒"
Each of the three MOBILE cards must show a smaller portrait, exact name, a mint diamond plus correct COST NUMBER (not a level), then a separate small exact LEVEL line. Exact mobile left text "速射塔" / diamond "15" / "Lv.1/4"; middle "榴弹炮" / diamond "40" / "Lv.1/4"; right "穿透塔" / diamond "80" / "Lv.1/4". Slightly reduce portraits if necessary within card bounds to fit these distinct 3 text lines, no cropping, no crowded numbers. Remove the erroneous Lv.8 and Lv.0 currently replacing costs on mobile. All cards show Lv.1/4 because initial blueprint internal level0. No new controls or charged upgrades. Crisp accurate Chinese typography. This is still a design sample, not imported, not a game screenshot.
```

## 04 HUD移除非必要Boss头像（最终返修）

```text
Use case: precise-object-edit.
Edit target Image 1: GeoGuard PLAYER HUD concept. One final exact limited edit: REMOVE the four little SUN/MOON decorative creature portraits from the two boss panels (desktop two, mobile two). These are not needed by the actual HUD and are not anatomically authoritative. Leave no character icon in either boss panel. Keep the exact boss names "曜子" and "蚀子", both separate HP bars, "P2/3 · 蓄力", "P2/3 · 恢复", "护卫 2" and counterplay text. Use the small space freed by icon removal as cream blank padding, keeping each boss label and HP bar readable. 
Preserve all other visual details and all other text, especially the SIX bottom tower portraits and corrected cost/level lines: desktop and mobile costs15/40/80 and all levelsLv.1/4. Preserve warm cream matte sticker style, empty battlefield, overall wide layout, header "DESIGN SAMPLE — NOT IMPORTED", HP100/100, money240, pause, wave08 and01:24, movement hints, touch-origin circle and bottom safe-area note. Do not create substitute shapes, symbols, extra eyes, bodies or decorative boss faces. Do not regenerate or change the bottom tower artwork. The only permitted change is removing the four small boss character icons.
```

参考：hazards-01.png（效果风格）、ui-player-04-v3.png（UI风格）、pilot-01-basic-tower-v4.png与batch-06-cannon-sniper.png（常态塔卡身份参考）。返修只引用已生成且查看的HUD目标。原生成文件保留在Codex generated_images，最终复制到本revision。

## 05 HUD实际双子数据校正（最终选稿）

```text
Use case: precise-object-edit.
Image 1 is edit target: existing GeoGuard PLAYER HUD concept. Change ONLY the two BOSS HUD panels (desktop and mobile), to match verified current game data. Keep all six bottom tower cards and every cost15/40/80 and levelLv.1/4 untouched; keep whole overall layout, header, cream style, empty battlefield, HP/time/money/pause, movement hints, joystick-origin illustration and safe-area note.
Correction: "护卫 2" must be REMOVED in BOTH panels; it is not a real TWINS state. Do not add guard counts anywhere. Also replace the invented abbreviated strategy "先避开预警线" with the real counterplay sentence. No creature icons in these panels.
Re-layout boss HUD with readable typesetting within same width; may increase panel height into blank battlefield to fit.
Each panel shows shared header exact "昼夜双子", then two separate member columns:
LEFT exact text:
"曜子"
one coral HP bar
"灼线 · P2/3"
"蓄力 · 准备闪避"
RIGHT exact text:
"蚀子"
one coral HP bar
"锁域 · P2/3"
"恢复 · 输出窗口"
Color RIGHT recovery action text warm honey/brown accent to reflect actual exposed=true whole-body opening; no new button.
Along panel bottom spanning both columns put real exact counterplay: "选择先击破日或月；幸存者会使用不同的独奏招式。"
Allow mobile counterplay to wrap two lines. Preserve all other text and images. Do not add mechanics, icons, resource numbers, boss faces, charged upgrades, or extra controls. This is a clean concept art sample, not imported, not screenshot.
```

最终选稿：vfx源exec-3e673d6b-67d8-4418-9ccb-ffbfc8aa53f6.png；HUD源exec-d69781ed-3b1e-4c71-af2f-00148a1af4f9.png。其他HUD生成结果为未提交的返修历史，不能接入。

