$ErrorActionPreference = 'Stop'
$studyDir = $PSScriptRoot
$ownerDir = [System.IO.Path]::GetFullPath((Join-Path $studyDir '../..'))
$repoDir = [System.IO.Path]::GetFullPath((Join-Path $studyDir '../../../../..'))
$baseRel = 'docs/art-direction/sticker-bible-2026-10-01'
$mapRel = "$baseRel/production-art-2026-10-02/integration/submissions/r02/production-map.json"
$lockRel = "$baseRel/action-consistency/anatomy-lock.json"
$mapPath = Join-Path $repoDir $mapRel
$mapDir = Split-Path $mapPath
$map = Get-Content -LiteralPath $mapPath -Raw | ConvertFrom-Json
$lock = Get-Content -LiteralPath (Join-Path $repoDir $lockRel) -Raw | ConvertFrom-Json
$ids = @('TWINS_MOON','DRAGON','SPIDER_MATRIARCH','ASTROLABE','BLOOD_FORGE','VOID_CONDUCTOR','LABYRINTH_KEEPER','NIGHTMARE_BLOOM')
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
function Write-Json($path, $value) {
  [System.IO.File]::WriteAllText($path, (($value | ConvertTo-Json -Depth 30) + "`n"), $utf8NoBom)
}
function Repo-Path($absolute) {
  [System.IO.Path]::GetRelativePath($repoDir, $absolute).Replace('\','/')
}
function Fingerprint($relative) {
  $absolute = Join-Path $repoDir $relative
  if (-not (Test-Path -LiteralPath $absolute -PathType Leaf)) { throw "Missing input: $relative" }
  [ordered]@{ path = $relative; sha256 = (Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLowerInvariant(); bytes = (Get-Item -LiteralPath $absolute).Length }
}
function Png-Dimensions($relative) {
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path $repoDir $relative))
  if ($bytes[0] -ne 137 -or $bytes[1] -ne 80) { throw "Not PNG: $relative" }
  [ordered]@{ width = [int]($bytes[16]*16777216+$bytes[17]*65536+$bytes[18]*256+$bytes[19]); height = [int]($bytes[20]*16777216+$bytes[21]*65536+$bytes[22]*256+$bytes[23]) }
}
$actions = @($map.actions | Where-Object { $_.identity -in @($ids | ForEach-Object { "boss:$_" }) })
if ($actions.Count -ne 81 -or @($actions.key | Select-Object -Unique).Count -ne 81) { throw 'Expected 81 unique action keys' }
$bodyInputs = @{}
$identityRows = @()
foreach ($id in $ids) {
  $identityActions = @($actions | Where-Object identity -eq "boss:$id")
  $anatomy = @($lock.items | Where-Object id -eq $id)
  if ($anatomy.Count -ne 1) { throw "Missing/duplicate anatomy lock: $id" }
  $actionRows = @()
  foreach ($action in $identityActions) {
    if ($action.review -ne 'accepted_original_art_stage') { throw "Unapproved action $($action.key)" }
    if ($action.contract.body.anatomyLock -ne $anatomy[0].anatomy) { throw "Anatomy mismatch $($action.key)" }
    $resolved = @()
    foreach ($source in $action.bodySources) {
      $absolute = [System.IO.Path]::GetFullPath((Join-Path $mapDir $source.path))
      $relative = Repo-Path $absolute
      if (-not $bodyInputs.ContainsKey($relative)) { $bodyInputs[$relative] = Fingerprint $relative }
      if ($bodyInputs[$relative].sha256 -ne $source.sha256) { throw "Source hash mismatch: $relative" }
      $review = Repo-Path ([System.IO.Path]::GetFullPath((Join-Path $mapDir $source.reviewEvidence)))
      if (-not (Test-Path -LiteralPath (Join-Path $repoDir $review))) { throw "Missing source review: $review" }
      $resolved += [ordered]@{ path = $relative; row = $source.row; column = $source.column; label = $source.label; sha256 = $source.sha256; reviewEvidence = $review; accuracy = $source.accuracy }
    }
    $actionRows += [ordered]@{
      key = $action.key; action = $action.action; mappingMode = $action.mappingMode
      bodySources = $resolved; transform = $action.transform; levelOverlay = $action.levelOverlay
      upstreamSourceJSON = Repo-Path ([System.IO.Path]::GetFullPath((Join-Path $mapDir $action.sourceJSON)))
      upstreamSourcePointer = $action.sourcePointer
      review = $action.review
      reviewEvidence = Repo-Path ([System.IO.Path]::GetFullPath((Join-Path $mapDir $action.reviewEvidence)))
      runtimeAbilityIds = @($action.contract.runtimeAbilityIds)
      independentSummons = @($action.contract.summon)
      independentEffects = @($action.contract.effect)
      independentProjectiles = @($action.contract.projectile)
      muzzleContract = $action.contract.muzzle
      productionGeometry = 'not authored or measured in this study'
    }
  }
  $identityRows += [ordered]@{
    identity = "boss:$id"; sourceActionCount = $identityActions.Count
    anatomyLock = $anatomy[0]
    proposedUpstreamRoot = $identityActions[0].contract.root
    proposedUpstreamAttachments = $identityActions[0].contract.attachment
    bodyExportRule = $identityActions[0].contract.body.exportRule
    actions = $actionRows
  }
}
$viewedBodies = @($bodyInputs.Keys | Sort-Object | ForEach-Object {
  $record = $bodyInputs[$_]
  $record['imageDimensions'] = Png-Dimensions $_
  $record['inspection'] = 'Actual full-image view_image display in this chat on 2026-10-02, all assigned rows and four body columns inspected'
  $record
})
$sceneImages = @(
 "$baseRel/scene-ui-2026-10-02/master/submissions/r04/master-desktop-twins-r04.png",
 "$baseRel/scene-ui-2026-10-02/master/submissions/r04/master-desktop-density-r04.png"
)
$sceneRows = @($sceneImages | ForEach-Object {
  $record = Fingerprint $_
  $record['imageDimensions'] = Png-Dimensions $_
  $record['inspection'] = 'Actual full-image view_image display in this chat on 2026-10-02; scene color, density, silhouette, separate shadow/HP/hazard layers examined'
  $record['use'] = 'Approved scene context only; does not replace final bodySources'
  $record
})
$readInputs = @(
 $mapRel, $lockRel,
 "$baseRel/production-art-2026-10-02/bosses-mechanics/submissions/r03/production-split.json",
 "$baseRel/production-art-2026-10-02/reviews/bosses-mechanics-r02.md",
 "$baseRel/production-art-2026-10-02/reviews/bosses-mechanics-r03.md",
 "$baseRel/production-art-2026-10-02/reviews/integration-r02.md",
 "$baseRel/scene-ui-2026-10-02/final-acceptance.md",
 "$baseRel/scene-ui-2026-10-02/desktop-final-acceptance.md",
 "$baseRel/scene-ui-2026-10-02/master/submissions/r04/reference-map.md",
 'src/view/art/characters/rigData.js', 'src/view/art/characters/rig.js'
)
$inputRows = @($readInputs | ForEach-Object { Fingerprint $_ })
$cells = @($identityRows | ForEach-Object { $identity=$_.identity; $_.actions | ForEach-Object { $_.bodySources | ForEach-Object { "$identity|$($_.path)|$($_.row)|$($_.column)" } } } | Sort-Object -Unique)
if ($viewedBodies.Count -ne 5 -or $cells.Count -ne 32) { throw 'Expected 5 viewed final boards / 32 unique body cells' }
Write-Json (Join-Path $studyDir 'sources.json') ([ordered]@{
  owner='boss-b'; revision='r01'; status='source_study_only'; inspectedClientDate='2026-10-02'; clientTimezone='Asia/Shanghai'
  sourceAuthority='Final production-map r02 bodySources and anatomy-lock; external accepted reviews supersede sealed pending/submitted fields'
  counts=[ordered]@{identities=8; actionSourceRows=81; uniqueBodyCells=32; viewedFinalBodyBoards=5; viewedFinalSceneBoards=2; productionRigs=0; productionExports=0}
  locatorRule='Named concept cells only; no board pixel extraction or animation frame claim'
  viewedFinalBodyBoards=$viewedBodies; viewedFinalSceneBoards=$sceneRows; readonlyInputSnapshots=$inputRows; identities=$identityRows
})
Write-Json (Join-Path $studyDir 'verification.json') ([ordered]@{
  result='pass_for_source_study_only'
  actionSourceRows=81; uniqueKeys=81; identities=8; uniqueBodyCells=32; finalBodyFileHashes='5/5 exact match with approved production-map bodySources'
  anatomyLocks='8/8 identities; all 81 body anatomy declarations match lock'
  reviews='accepted_original_art_stage for all 81; source review paths exist; external accepted reviews read'
  visualInspection='5 complete final body images and 2 approved scene images actually displayed using view_image in this chat'
  encoding='All newly authored study text/JSON written UTF-8 without BOM'
  writes='Only boss-b/submissions/r01 and boss-b/READY.json by this chat; no src/public or Git operations'
  productionRigs=0; productionExports=0; runtimeValidation='not performed'; continuousMotionValidation='not performed'; measuredAnchors='none'
  dependencies=@('Main reviewer approval of character prototype', 'Explicit group data schema and new file ownership assignment')
  openSourceIssues=@()
})
$fileNames = @('inspection.md','construction.md','sources.json','verification.json','seal-study.ps1')
$fileRows = @($fileNames | ForEach-Object {
  $path = Join-Path $studyDir $_
  $bytes = [System.IO.File]::ReadAllBytes($path)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) { throw "BOM in $_" }
  [ordered]@{path="submissions/r01/$_";sha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant();bytes=$bytes.Length}
})
[System.IO.File]::WriteAllText((Join-Path $studyDir 'SHA256SUMS.txt'), (($fileRows | ForEach-Object { "$($_.sha256)  $($_.path)" }) -join "`n") + "`n", $utf8NoBom)
$sumPath = Join-Path $studyDir 'SHA256SUMS.txt'
$fileRows += [ordered]@{path='submissions/r01/SHA256SUMS.txt';sha256=(Get-FileHash -LiteralPath $sumPath -Algorithm SHA256).Hash.ToLowerInvariant();bytes=(Get-Item -LiteralPath $sumPath).Length}
$packetPath = Join-Path $studyDir 'packet.json'
Write-Json $packetPath ([ordered]@{
  owner='boss-b';revision='r01';status='submitted_source_study';scope='Eight assigned Boss identities, final source/anatomy inspection and per-identity editable contour construction proposal only'
  files=$fileRows;counts=[ordered]@{identities=8;sourceActions=81;uniqueBodyCells=32;viewedBodyBoards=5;viewedSceneBoards=2;productionCompleted=0}
  validation='verification.json; approved body source SHA checked, per-action anatomy matched, actual image inspection recorded'
  dependencies=@('Approved character prototype', 'Group rig data contract and explicit independent new file assignment')
  ownership=[ordered]@{writes=@('docs/art-implementation-2026-10-02/boss-b/submissions/r01/**','docs/art-implementation-2026-10-02/boss-b/READY.json');excluded=@('src/**','public/**','shared manifest/registry/rig implementation','logic','Git')}
  limitations=@('No production assets, measured anchors, continuous animation or live gameplay claims','Upstream root values are proposed design coordinates','External accepted reviews override sealed submitted/pending fields')
  openIssues=@();summary='实际查看5张最终身体板与2张正式电脑场景；封包8身份81动作来源及逐身份贝塞尔轮廓准备，停等正式合同。'
})
$packetHash = (Get-FileHash -LiteralPath $packetPath -Algorithm SHA256).Hash.ToLowerInvariant()
$readyTemp = Join-Path $ownerDir 'READY.tmp.json'
Write-Json $readyTemp ([ordered]@{owner='boss-b';revision='r01';status='submitted_source_study';packetPath='submissions/r01/packet.json';packetSha256=$packetHash;scope='final_source_and_identity_contour_study';productionCompleted=0})
[System.IO.File]::Move($readyTemp, (Join-Path $ownerDir 'READY.json'), $true)
Write-Output "Sealed boss-b r01: 8 identities / 81 source actions / 32 body cells / 5 viewed body boards / 2 viewed scene boards. packet SHA256=$packetHash"
