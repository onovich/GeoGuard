$ErrorActionPreference = 'Stop'
$repo = 'D:\WebProjects\GeoGuard'
$outputDir = Join-Path $repo 'docs\art-implementation-2026-10-02\boss-a\submissions\r01'
$ownerDir = Join-Path $repo 'docs\art-implementation-2026-10-02\boss-a'
$art = 'docs/art-direction/sticker-bible-2026-10-01/'
$production = $art + 'production-art-2026-10-02/'
$mapPath = $production + 'integration/submissions/r02/production-map.json'
$lockPath = $art + 'action-consistency/anatomy-lock.json'
$mapDir = Split-Path (Join-Path $repo $mapPath)
$ids = @('COMMANDER','HUNTER','FORTRESS','PRISM','FROST_JUDGE','RAIL_WARLORD','COLLECTOR','TWINS_SUN')
$keys = @($ids | ForEach-Object { 'boss:' + $_ })
$map = Get-Content -LiteralPath (Join-Path $repo $mapPath) -Raw | ConvertFrom-Json
$lock = Get-Content -LiteralPath (Join-Path $repo $lockPath) -Raw | ConvertFrom-Json
$selected = @($map.actions | Where-Object { $_.identity -in $keys })
if ($selected.Count -ne 74) { throw 'Expected 74 source action mappings' }
$utf8 = [System.Text.UTF8Encoding]::new($false)
function WriteJson($name, $value) {
  [System.IO.File]::WriteAllText((Join-Path $outputDir $name), (($value | ConvertTo-Json -Depth 35) + "`n"), $utf8)
}
function Fingerprint($relative) {
  $absolute = Join-Path $repo $relative
  $item = Get-Item -LiteralPath $absolute
  [ordered]@{ path=$relative.Replace('\','/'); sha256=(Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLower(); bytes=$item.Length }
}
function RelativePath($absolute) {
  [System.IO.Path]::GetRelativePath($repo,$absolute).Replace('\','/')
}
$viewed = @(
  @(($production+'bosses-mechanics/submissions/r02/pair-01-commander-hunter.png'),'final-body','COMMANDER 3 top lobes, connected bent arms and inner fists; HUNTER long rear ear, horn, wedge nose, one near eye; four body-only poses'),
  @(($production+'bosses-mechanics/submissions/r02/pair-02-fortress-prism.png'),'final-body','FORTRESS raised ATTACK shell retains central connector; PRISM one long dark face and two parent purple mirrors'),
  @(($production+'bosses-mechanics/submissions/r02/pair-03-frost-rail.png'),'final-body','FROST U collar, separate crown, fists and chest diamond; RAIL two rails surround one central port, OPEN closes the same eye'),
  @(($production+'bosses-mechanics/submissions/r02/pair-04-collector-astrolabe.png'),'final-body','COLLECTOR row1: fat bag, two buds, connected high curled arm, belly coin and tongue; row2 ASTROLABE outside this ownership'),
  @(($production+'bosses-mechanics/submissions/r02/pair-05-twins.png'),'final-body','SUN row1 despite TWINS_MOON heading: six petals, round coral face, same-anchor squeeze eyes in WINDUP/ATTACK; MOON row2 outside ownership'),
  @(($art+'action-consistency/boss-18-commander.png'),'canonical-anatomy-action','Same three top lobes, two arms/fists, two feet, brow slot and one tooth; shield arcs/dust/open outline are external'),
  @(($art+'action-consistency/boss-19-hunter-v2.png'),'canonical-anatomy-action','One ear/horn/nose/rear lobe/near eye; PINCER child actors and AFTERIMAGE copies external'),
  @(($art+'action-consistency/boss-20-fortress-v2.png'),'canonical-anatomy-action','One lifted shell stays joined by central post; two shields remain attached; wall ring and quake waves external'),
  @(($art+'action-consistency/boss-21-prism.png'),'canonical-anatomy-action','Long black face and white eyes retained; two purple parent mirrors; beams and direction arrows external'),
  @(($art+'action-consistency/boss-23-frost_judge-v2.png'),'canonical-anatomy-action','Round coral head, blue U collar, crown/chest diamond; FREEZE target and SEAL pair external, storm snowflakes external'),
  @(($art+'action-consistency/boss-24-rail_warlord-v4.png'),'canonical-anatomy-action','Rigid two-rail/one-port anatomy; MARK node and target separate, SNIPE/OVERLOAD hazard lines external'),
  @(($art+'action-consistency/boss-25-collector-v2.png'),'canonical-anatomy-action','Belly coin remains body part; TAX/RANSOM floating coins and ESCORT courier are independent'),
  @(($art+'action-consistency/boss-27-twins_moon-v2.png'),'canonical-anatomy-action','SUN six fixed petals, MOON crescent; ORBIT/SWAP/ECLIPSE depict two separate members, not a fused body'),
  @(($production+'effects-ui/submissions/r02/b02-status-world.png'),'final-external-effect','Shield/slow/frozen/armor/open/enraged/hit mask/shadow/HP/links remain overlays; fixed projection R'),
  @(($production+'effects-ui/submissions/r02/b03-hazard-lifecycle.png'),'final-external-effect','Warning/resolve/fade retain actual area disk, line halfwidth, pulse disk and cross footprint; no invented damage'),
  @(($production+'effects-ui/submissions/r02/b04-mechanic-feedback.png'),'final-external-effect','Summon feedback not child body; drops/refund/death/link separate; twin special accent not SUN petal'),
  @(($art+'scene-ui-2026-10-02/master/submissions/r04/master-desktop-density-r04.png'),'approved-scene','Cream sparse background; strong outline identity at crowded density, separate HP/projectiles/resources; not geometry/size measurement'),
  @(($art+'scene-ui-2026-10-02/master/submissions/r04/master-desktop-twins-r04.png'),'approved-scene','SUN six petals and MOON independent body; member HUD and hazard boundaries separate; body details follow final sources')
)
$imageRecords = @($viewed | ForEach-Object {
  $record = Fingerprint $_[0]
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path $repo $_[0]))
  $w = [int]$bytes[16]*16777216 + [int]$bytes[17]*65536 + [int]$bytes[18]*256 + [int]$bytes[19]
  $h = [int]$bytes[20]*16777216 + [int]$bytes[21]*65536 + [int]$bytes[22]*256 + [int]$bytes[23]
  $record.role=$_[1]; $record.width=$w; $record.height=$h
  $record.viewedWith='tools.view_image (actual image output inspected in this conversation, 2026-10-02)'
  $record.observation=$_[2]; $record
})
$actions = @($selected | ForEach-Object {
  $entry = $_
  $bodySources = @($entry.bodySources | ForEach-Object {
    $source = $_
    $absolute = [System.IO.Path]::GetFullPath((Join-Path $mapDir $source.path))
    $actualSha = (Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLower()
    if ($actualSha -ne $source.sha256) { throw ('Body source SHA mismatch: ' + $entry.key) }
    if ($entry.review -ne 'accepted_original_art_stage') { throw ('Unexpected review: ' + $entry.key) }
    [ordered]@{ path=(RelativePath $absolute); row=$source.row; column=$source.column; label=$source.label; sha256=$actualSha; accuracy=$source.accuracy; reviewEvidence=(RelativePath ([System.IO.Path]::GetFullPath((Join-Path $mapDir $source.reviewEvidence)))) }
  })
  $effects = @($entry.externalEffectSources | ForEach-Object {
    $effect = $_
    $absolute = [System.IO.Path]::GetFullPath((Join-Path $mapDir $effect.image))
    if ((Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLower() -ne $effect.sha256) { throw ('Effect SHA mismatch: ' + $entry.key) }
    [ordered]@{ key=$effect.key; image=(RelativePath $absolute); sha256=$effect.sha256; title=$effect.title; layer=$effect.layer; pivot=$effect.pivot; lifecycle=$effect.lifecycle; review=$effect.review }
  })
  [ordered]@{ key=$entry.key; identity=$entry.identity; action=$entry.action; mappingMode=$entry.mappingMode; review=$entry.review; bodySources=$bodySources; externalEffectSources=$effects; originalContractRoot=$entry.contract.root; originalAnatomyLock=$entry.contract.body.anatomyLock; attachment=$entry.contract.attachment; muzzle=$entry.contract.muzzle; runtimeAbilityIds=$entry.contract.runtimeAbilityIds; anchorsMeasured=$false; continuousResources=$entry.continuousResources }
})
$inputs = @($mapPath,$lockPath,($production+'reviews/integration-r02.md'),($production+'reviews/bosses-mechanics-r02.md'),($production+'reviews/effects-ui-r02.md'),($art+'scene-ui-2026-10-02/desktop-final-acceptance.md'),($art+'scene-ui-2026-10-02/reviews/master-r04.md'),'docs/art-implementation-2026-10-02/coordination.md','docs/art-implementation-2026-10-02/integration/submissions/r01/coordinates-and-assets.md','docs/art-implementation-2026-10-02/integration/submissions/r01/module-api.md','src/view/art/characters/rigData.js','src/view/art/characters/rig.js','src/data/gameConfig.js','src/logic/engine/encounterRuntime.js') | ForEach-Object { Fingerprint $_ }
$sourceEvidence = [ordered]@{ owner='boss-a'; revision='r01'; status='study_only_pending_review'; date='2026-10-02'; identities=$ids; actionCount=$actions.Count; imagesViewed=$imageRecords; inputs=$inputs; anatomyLocks=@($lock.items | Where-Object { $_.id -in $ids }); actionMappings=$actions; authority='external accepted reviews override historical submitted/pending; final bodySources override old action-sheet body selection'; numericStatus='proposed source coordinates only; no production anchors measured'; productionResourcesCreated=$false }
WriteJson 'source-evidence.json' $sourceEvidence
$allFinalImages = @($actions.bodySources.path | Sort-Object -Unique)
$allEffects = @($actions.externalEffectSources.image | Sort-Object -Unique)
foreach ($p in @($allFinalImages)+@($allEffects)) {
  if ($p -notin $imageRecords.path) { throw ('Final referenced image not actually viewed: ' + $p) }
}
$htmlImages = $imageRecords | ForEach-Object {
  $relative = [System.IO.Path]::GetRelativePath($outputDir,(Join-Path $repo $_.path)).Replace('\','/')
  '<figure><figcaption>' + [System.Net.WebUtility]::HtmlEncode($_.role + ': ' + [System.IO.Path]::GetFileName($_.path)) + '</figcaption><a href="'+$relative+'"><img loading="lazy" src="'+$relative+'" alt="'+[System.Net.WebUtility]::HtmlEncode($_.observation)+'"></a><p>'+[System.Net.WebUtility]::HtmlEncode($_.observation)+'</p></figure>'
}
$html = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boss A r01 来源勘察</title><style>body{max-width:1100px;margin:32px auto;padding:0 20px;background:#fff9ef;color:#4b281c;font:16px/1.6 system-ui}img{width:100%;height:auto}figure{margin:28px 0}a{color:#345634}figcaption{font-weight:700}</style><h1>Boss A 八身份来源勘察 r01</h1><p>仅文档核对：8身份、74动作、18张实际查看图。未制作正式资源，未测生产锚点，待样板批准及分组数据合同。</p><p><a href="construction-study.md">逐身份轮廓与构造方案</a> · <a href="source-evidence.json">来源SHA、器官锁及74条状态映射</a> · <a href="verification.json">核查范围</a></p>'+($htmlImages -join "`n")+'</html>'
[System.IO.File]::WriteAllText((Join-Path $outputDir 'index.html'),$html,$utf8)
WriteJson 'verification.json' ([ordered]@{ owner='boss-a'; revision='r01'; status='study_verified_not_production'; identityCount=$ids.Count; actionCount=$actions.Count; finalBodyBoardCount=$allFinalImages.Count; finalExternalEffectBoardCount=$allEffects.Count; actuallyViewedImages=$imageRecords.Count; checks=@('all 74 final bodySources exist and SHA match production-map','all referenced external effect images exist and SHA match','all five final body boards and three final external effect boards present in actual view_image inspection log','eight anatomy-lock identities retained','two accepted master r04 images visually inspected','UTF-8 files written without BOM'); productionAnchorsMeasured=$false; runtimeTestsExecuted=$false; sourcePublicChangedByThisSubmission=$false; gitExecuted=$false; limitations=@('study only: no transparent exports, icons, clips or runtime draw','part pivots and Bezier coordinates await formal data contract and editable production drawing','approved art-stage status does not imply production or runtime acceptance') })
$files = @(Get-ChildItem -LiteralPath $outputDir -File | Where-Object { $_.Name -ne 'packet.json' } | Sort-Object Name | ForEach-Object { [ordered]@{path=$_.Name;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower();bytes=$_.Length} })
foreach ($file in $files) {
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path $outputDir $file.path))
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) { throw ('BOM: ' + $file.path) }
}
WriteJson 'packet.json' ([ordered]@{owner='boss-a';revision='r01';status='submitted_study';scope=$ids;coverage=[ordered]@{identities=8;actionMappings=74;viewedImages=18;finalBodyBoards=5;finalExternalEffectBoards=3};files=$files;inputs=$inputs;reviewEntry='index.html';implementationAuthorized=$false;writes=@('docs/art-implementation-2026-10-02/boss-a/submissions/r01/**','docs/art-implementation-2026-10-02/boss-a/READY.json');dependsOn=@('main review approval of character production sample','explicit grouped rig-data contract and independent file ownership');validation='Source SHA/path/coverage verified; actual image inspection recorded; no production/runtime completion claim'})
$packetSha = (Get-FileHash -LiteralPath (Join-Path $outputDir 'packet.json') -Algorithm SHA256).Hash.ToLower()
$ready = [ordered]@{owner='boss-a';revision='r01';status='submitted_study';packetPath='submissions/r01/packet.json';packetSha256=$packetSha;reviewEntry='submissions/r01/index.html';implementationAuthorized=$false;next='Wait for main review and grouped rig-data contract'}
$temporaryPointer = Join-Path $ownerDir 'READY.r01.tmp'
$finalPointer = Join-Path $ownerDir 'READY.json'
if ([System.IO.Path]::GetFullPath((Split-Path $temporaryPointer)) -ne [System.IO.Path]::GetFullPath($ownerDir)) { throw 'Pointer outside owner' }
if ([System.IO.Path]::GetFullPath((Split-Path $finalPointer)) -ne [System.IO.Path]::GetFullPath($ownerDir)) { throw 'Pointer outside owner' }
[System.IO.File]::WriteAllText($temporaryPointer,(($ready | ConvertTo-Json -Depth 5)+"`n"),$utf8)
[System.IO.File]::Move($temporaryPointer,$finalPointer,$true)
[ordered]@{packetSha256=$packetSha;identities=$ids.Count;actions=$actions.Count;viewedImages=$imageRecords.Count;finalBodyBoards=$allFinalImages.Count;externalEffectBoards=$allEffects.Count;submissionFiles=$files.Count;ready=$finalPointer} | ConvertTo-Json
