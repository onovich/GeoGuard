$ErrorActionPreference='Stop'
$repoRoot='D:/WebProjects/GeoGuard'
$sceneRoot='docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/'
$groupRoot=Join-Path $repoRoot ($sceneRoot+'background')
$revisionRoot=Join-Path $groupRoot 'submissions/r02'
$utf8NoBom=[System.Text.UTF8Encoding]::new($false)
if(Test-Path -LiteralPath (Join-Path $revisionRoot 'packet.json')){throw 'r02 is already sealed. Create a new revision.'}
$sourceSpecs=@(
 @{path='desktop-usability-review.md';role='desktop optimization request and outstanding evidence'},
 @{path='reviews/background-r01.md';role='approved background baseline'},
 @{path='background/submissions/r01/packet.json';role='immutable r01 integrity authority'},
 @{path='background/submissions/r01/bg01-clean-background.png';role='viewed BG01 imagegen input'},
 @{path='background/submissions/r01/bg02-ground-layers.png';role='viewed BG02 editorial imagegen input'},
 @{path='background/submissions/r01/production-notes.md';role='approved extension and runtime-order boundaries'},
 @{path='master/submissions/r02/master-desktop-r02.png';role='viewed approved master imagegen style input'},
 @{path='master/submissions/r02/style-contract.md';role='approved style hierarchy'},
 @{path='reviews/master-r02.md';role='master approval authority'},
 @{path='background/submissions/r02/bg01-clean-background.png';role='viewed updated BG02 imagegen input'}
)
$sourceRows=foreach($sourceSpec in $sourceSpecs){$sourcePath=$sceneRoot+$sourceSpec.path; [ordered]@{path=$sourcePath;role=$sourceSpec.role;sha256=(Get-FileHash -LiteralPath (Join-Path $repoRoot $sourcePath) -Algorithm SHA256).Hash.ToLowerInvariant()}}
$sourceDocument=[ordered]@{owner='background';revision='r02';pathRoot=$repoRoot;entries=@($sourceRows)}
[System.IO.File]::WriteAllText((Join-Path $revisionRoot 'source-fingerprints.json'),($sourceDocument|ConvertTo-Json -Depth 20),$utf8NoBom)
$fileRows=foreach($fileItem in (Get-ChildItem -LiteralPath $revisionRoot -File -Recurse|Sort-Object FullName)){[ordered]@{path=$fileItem.FullName.Substring($groupRoot.Length+1).Replace('\','/');sha256=(Get-FileHash -LiteralPath $fileItem.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}}
$approvalRow=$sourceRows|Where-Object role -eq 'approved background baseline'
$masterApprovalRow=$sourceRows|Where-Object role -eq 'master approval authority'
$reviewRow=$sourceRows|Where-Object role -eq 'desktop optimization request and outstanding evidence'
$packet=[ordered]@{
 owner='background';revision='r02';status='submitted';date='2026-10-02';scope='desktop background art only; mobile deferred'
 files=@($fileRows)
 images=@(@{id='BG01-r02';path='submissions/r02/bg01-clean-background.png';width=1586;height=992;purpose='clean distinct notched floor'},@{id='BG02-r02';path='submissions/r02/bg02-ground-layers.png';width=1586;height=992;purpose='updated layers / desktop continuation / shadow and dense battle constraints'})
 coveredRequirements=@('desktop-usability-review low-priority ground/shadow item response','distinctive low-contrast asymmetric notch motifs','no regular oval ground identity','clean no entities/UI/shadows/hazards/drops','separate base/wash/grass samples','sparse stable four-direction world distribution','same local density / no central-only clearing','ground-vs-root-shadow distinction','noninteractive noncollision decoration / no path/border/obstacle','dense-battle background priority and exclusion rules','world-screen and current-vs-target stack boundaries','desktop logical sizing and schematic-window limits','source/element mapping and complete built-in prompts/records')
 responseToDesktopReview=@{item='低：背景通用，地面椭圆与实体影子形制接近';response='Regular ovals replaced by pale asymmetrically notched wash silhouettes, grass reduced/weakened; separate root-shadow ownership and dense-battle priority specified.';evidence=@('BG01-r02','BG02-r02','submissions/r02/production-notes.md');approval='pending primary reviewer'}
 openIssues=@('r02 formal reviewer approval pending.','Actual dense-battle desktop composite remains master-owned; no runtime/device/layout/performance verification.','No alpha, editable layers, atlas or pixel-seamless tile produced.','1440x900 is logical target; drawn crop frames are schematic.','Mobile is deferred and is not a blocker in this desktop revision.')
 dependencies=@{approvedBackground=@{revision='r01';approvalPath=$approvalRow.path;approvalSha256=$approvalRow.sha256};approvedMaster=@{revision='r02';approvalPath=$masterApprovalRow.path;approvalSha256=$masterApprovalRow.sha256};desktopReview=@{path=$reviewRow.path;sha256=$reviewRow.sha256};sourceAuthority='submissions/r02/source-fingerprints.json'}
 summary='Two desktop background concept plates generated using built-in imagegen. Pale asymmetric notched sage/bone ground wash differentiates floor from independent entity shadows; rare low-contrast grass and continuous sparse world retained. No new gameplay object, collision, path, edge framing or code/resource integration. r01 unchanged; r02 submitted only.'
}
[System.IO.File]::WriteAllText((Join-Path $revisionRoot 'packet.json'),($packet|ConvertTo-Json -Depth 30),$utf8NoBom)
Write-Output ([pscustomobject]@{revision='r02';files=$fileRows.Count;sources=$sourceRows.Count;images=2}|ConvertTo-Json -Compress)
