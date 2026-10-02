$ErrorActionPreference = 'Stop'
$repoRoot = 'D:/WebProjects/GeoGuard'
$groupRoot = Join-Path $repoRoot 'docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/background'
$revisionRoot = Join-Path $groupRoot 'submissions/r01'
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
if (Test-Path -LiteralPath (Join-Path $revisionRoot 'packet.json')) { throw 'r01 already sealed. Do not overwrite.' }
$sourceEntries = @(
  @{path='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/reviews/master-r02.md'; role='approved master review'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/master/submissions/r02/master-desktop-r02.png'; role='viewed imagegen style input'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/master/submissions/r02/style-contract.md'; role='approved style and target stack'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/master/submissions/r02/constraints.md'; role='runtime scene constraints'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/master/submissions/r02/reference-map.md'; role='excluded body and overall element mapping'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/coordination.md'; role='ownership and submission mechanism'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/background/preparation.md'; role='read-only preparation'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/final-acceptance.md'; role='previous art approval authority'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/effects-ui/submissions/r02/b03-hazard-lifecycle.png'; role='viewed hazard geometry exclusion reference; not sent to imagegen'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/effects-ui/submissions/r02/b04-mechanic-feedback.png'; role='viewed terrain/drop/refund exclusion reference; not sent to imagegen'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/integration/submissions/r02/effective-specifications.md'; role='previous effective specifications'},
  @{path='src/view/canvas/canvasRenderer.js'; role='camera and current painter order read only'},
  @{path='src/data/gameConfig.js'; role='current colors read only'},
  @{path='src/logic/hooks/useGeoGuardGame.jsx'; role='camera following read only'},
  @{path='src/logic/engine/combatRules.js'; role='true area/line geometry read only'},
  @{path='src/logic/engine/battlefieldRules.js'; role='movement and mechanic collision read only'},
  @{path='src/logic/engine/gameRules.js'; role='omnidirectional spawn read only'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/background/submissions/r01/bg01-clean-background.png'; role='viewed BG02 input'},
  @{path='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/background/submissions/r01/iterations/bg02-first.png'; role='viewed BG02 edit target'}
)
$fingerprints = foreach ($sourceEntry in $sourceEntries) {
  $sourceFile = Join-Path $repoRoot $sourceEntry.path
  [ordered]@{path=$sourceEntry.path;role=$sourceEntry.role;sha256=(Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash.ToLowerInvariant()}
}
$sourcesDocument = [ordered]@{owner='background';revision='r01';pathRoot='D:/WebProjects/GeoGuard';entries=@($fingerprints)}
[System.IO.File]::WriteAllText((Join-Path $revisionRoot 'source-fingerprints.json'),($sourcesDocument | ConvertTo-Json -Depth 20),$utf8NoBom)
$packageFiles = foreach ($packageFile in (Get-ChildItem -LiteralPath $revisionRoot -File -Recurse | Sort-Object FullName)) {
  $relativeFile = $packageFile.FullName.Substring($groupRoot.Length+1).Replace('\','/')
  [ordered]@{path=$relativeFile;sha256=(Get-FileHash -LiteralPath $packageFile.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
}
$masterImage = $fingerprints | Where-Object role -eq 'viewed imagegen style input'
$masterReview = $fingerprints | Where-Object role -eq 'approved master review'
$packet = [ordered]@{
  owner='background';revision='r01';status='submitted';date='2026-10-02';timezone='Asia/Shanghai'
  files=@($packageFiles)
  images=@(
    @{id='BG01';path='submissions/r01/bg01-clean-background.png';width=1586;height=992;purpose='clean complete background';status='submitted'},
    @{id='BG02';path='submissions/r01/bg02-ground-layers.png';width=1586;height=992;purpose='ground and decoration layers / world continuation';status='submitted'}
  )
  coveredRequirements=@('approved-master-r02 inheritance','BG01 no entities/UI/shadows/hazards/drops','BG02 pure base/patches/grass samples','same sparse density per local world view','four-way continuation design','world and screen separation','flat walkable non-collision decorations','ground weaker than gameplay','resource/player/root-hazard motif exclusion','runtime area/line geometry preservation','target logical dimensions and schematic crop limits','target vs current runtime stack distinction','built-in imagegen only / full prompts / viewed references / source SHA','body and overall element source mapping')
  openIssues=@('Primary reviewer formal per-image approval pending.','Design concepts only: no pixel-seamless tile, alpha assets, editable layers, atlas, animation or runtime integration.','1440x900 and 390x844 are logical design targets; drawn crop frames are not calibrated rectangles.','Actual device layout, gameplay overlap, mobile HUD, seams/shake performance and final desktop/mobile/stress composites remain future stages.')
  dependencies=@{
    approvedMaster=@{revision='r02';path=$masterImage.path;sha256=$masterImage.sha256;approvalPath=$masterReview.path;approvalSha256=$masterReview.sha256}
    sourceAuthority='submissions/r01/source-fingerprints.json'
    previousArtAuthority='docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/final-acceptance.md'
  }
  summary='Two background concept plates; inherited pale sage / cream open-world style. Three built-in imagegen calls including isolated removal of grass from patch sample. No new entity/obstacle/pickup or baked gameplay layers. Immutable r01 submitted for formal reviewer approval.'
}
[System.IO.File]::WriteAllText((Join-Path $revisionRoot 'packet.json'),($packet | ConvertTo-Json -Depth 30),$utf8NoBom)
Write-Output ([pscustomobject]@{revision='r01';fileCount=$packageFiles.Count;imageCount=2;sourceCount=$fingerprints.Count;packet='submissions/r01/packet.json'} | ConvertTo-Json -Compress)
