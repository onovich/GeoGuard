$ErrorActionPreference = 'Stop'
$taskRevisionRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$taskGroupRoot = [System.IO.Directory]::GetParent([System.IO.Directory]::GetParent($taskRevisionRoot).FullName).FullName
$taskProjectRoot = 'D:/WebProjects/GeoGuard'
$taskUtf8 = [System.Text.UTF8Encoding]::new($false)
$taskPacketPath = Join-Path $taskRevisionRoot 'packet.json'
$taskReadyPath = Join-Path $taskGroupRoot 'READY.json'
if (Test-Path -LiteralPath $taskPacketPath) { throw 'r02 already sealed; do not overwrite.' }
$taskPreviousReady = Get-Content -Raw -LiteralPath $taskReadyPath | ConvertFrom-Json
if ($taskPreviousReady.revision -ne 'r01') { throw 'Expected current READY r01; stop to avoid overwriting another revision.' }
$taskPreviousPacketPath = Join-Path $taskGroupRoot $taskPreviousReady.packetPath
if ((Get-FileHash -LiteralPath $taskPreviousPacketPath -Algorithm SHA256).Hash.ToLower() -ne $taskPreviousReady.packetSha256) { throw 'Prior r01 packet SHA mismatch.' }
$taskPreviousPacket = Get-Content -Raw -LiteralPath $taskPreviousPacketPath | ConvertFrom-Json
foreach ($taskFile in $taskPreviousPacket.files) {
  if ((Get-FileHash -LiteralPath (Join-Path $taskGroupRoot $taskFile.path) -Algorithm SHA256).Hash.ToLower() -ne $taskFile.sha256) { throw 'Prior immutable r01 file changed.' }
}
Add-Type -AssemblyName System.Drawing
$taskGenerationPath = Join-Path $taskRevisionRoot 'generation-record.json'
$taskGeneration = Get-Content -Raw -LiteralPath $taskGenerationPath | ConvertFrom-Json
$taskPrompts = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot 'prompts.json') | ConvertFrom-Json
if ($taskGeneration.records.Count -ne 16 -or $taskPrompts.jobs.Count -ne 16) { throw 'Successful-call record count mismatch.' }
foreach ($taskRecord in $taskGeneration.records) {
  $taskJob = @($taskPrompts.jobs | Where-Object {$_.id -eq $taskRecord.id})
  if ($taskJob.Count -ne 1 -or $taskJob[0].prompt -ne $taskRecord.toolArguments.prompt) { throw 'Prompt mismatch.' }
  $taskRecord.toolArguments = [ordered]@{prompt=$taskJob[0].prompt;referenced_image_paths=$taskJob[0].referenced_image_paths;transparent_background=$false}
  $taskOutputHash = (Get-FileHash -LiteralPath $taskRecord.sourceOutput -Algorithm SHA256).Hash.ToLower()
  $taskSavedPath = Join-Path $taskRevisionRoot $taskRecord.workspaceFile
  $taskSavedHash = (Get-FileHash -LiteralPath $taskSavedPath -Algorithm SHA256).Hash.ToLower()
  if ($taskOutputHash -ne $taskSavedHash) { throw "Wrong selected output/copy: $($taskRecord.id)" }
  $taskRecord | Add-Member -Force -NotePropertyName sourceOutputSha256 -NotePropertyValue $taskOutputHash
  $taskRecord | Add-Member -Force -NotePropertyName workspaceSha256 -NotePropertyValue $taskSavedHash
  $taskReferences = @($taskJob[0].referenced_image_paths | ForEach-Object {[ordered]@{path=$_;sha256=(Get-FileHash -LiteralPath $_ -Algorithm SHA256).Hash.ToLower()}})
  if ($taskReferences.Count -gt 5) { throw 'Invalid reference limit.' }
  $taskRecord | Add-Member -Force -NotePropertyName references -NotePropertyValue $taskReferences
  $taskBitmap = [System.Drawing.Image]::FromFile($taskSavedPath)
  try { $taskRecord | Add-Member -Force -NotePropertyName rasterPixels -NotePropertyValue ([ordered]@{width=$taskBitmap.Width;height=$taskBitmap.Height}) } finally { $taskBitmap.Dispose() }
  if (-not $taskRecord.actuallyViewed) { throw 'Image viewing record missing.' }
}
$taskSources = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot 'source-fingerprints.json') | ConvertFrom-Json
foreach ($taskSource in $taskSources.files) {
  if ((Get-FileHash -LiteralPath (Join-Path $taskProjectRoot $taskSource.path) -Algorithm SHA256).Hash.ToLower() -ne $taskSource.sha256) { throw "Source changed: $($taskSource.path)" }
}
$taskIcons = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot 'tower-icon-sources.json') | ConvertFrom-Json
if ($taskIcons.items.Count -ne 9 -or ($taskIcons.items.identity | Sort-Object -Unique).Count -ne 9) { throw 'Nine identities required.' }
foreach ($taskIcon in $taskIcons.items) {
  if ($taskIcon.cell -ne 'NEUTRAL' -or $taskIcon.column -ne 1 -or $taskIcon.transparentIconExported) { throw 'Canonical production boundary invalid.' }
  if ((Get-FileHash -LiteralPath $taskIcon.absoluteSourcePath -Algorithm SHA256).Hash.ToLower() -ne $taskIcon.sha256) { throw 'Tower source changed.' }
}
$taskRequirements = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot 'requirements-map.json') | ConvertFrom-Json
if ($taskRequirements.requirements.Count -ne 48 -or ($taskRequirements.requirements.id | Sort-Object -Unique).Count -ne 48) { throw '48 unique requirements required.' }
$taskEvidence = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot 'rule-evidence.json') | ConvertFrom-Json
if ($taskEvidence.cards.Count -ne 9 -or (@($taskEvidence.rewardScenarios | ForEach-Object {$_.choices.Count}) -join ',') -ne '1,2,3') { throw 'Rule evidence incomplete.' }
$taskFinalRecords = @($taskGeneration.records | Where-Object {$_.isFinalSelected})
if ($taskFinalRecords.Count -ne 3 -or ($taskFinalRecords.id -join ',') -ne 'DUI01-edit8,DUI03-edit1,DUI02-edit4') { throw 'Final revision selection mismatch.' }
$taskVerification = [ordered]@{
  revision='r02';status='technical-check-record';approval='pending_main_review';
  priorR01FilesMatched=$taskPreviousPacket.files.Count;sourceFilesMatched=$taskSources.files.Count;referenceImagesActuallyViewed=@($taskSources.files | Where-Object {$_.actuallyViewedWithViewImage}).Count;
  successfulGenerationCalls=16;promptRecordsMatched=$true;generatedOutputCopiesMatched=$true;selectedImagesActuallyViewed=$true;uniqueRequirements=48;uniqueTowerIdentities=9;
  finalImages=@($taskFinalRecords | ForEach-Object {[ordered]@{id=$_.id;file=$_.workspaceFile;sha256=$_.workspaceSha256;pixels=$_.rasterPixels}});
  logicalSizesMeasured=$false;contrastMeasured=$false;mouseRuntimeTested=$false;historySimulated=$false;denseBattleJointApproved=$false;
  note='File/source/copy verification and creator actual viewing only; primary prechecks do not equal final approval.'
}
[System.IO.File]::WriteAllText($taskGenerationPath,($taskGeneration | ConvertTo-Json -Depth 16),$taskUtf8)
[System.IO.File]::WriteAllText((Join-Path $taskRevisionRoot 'verification.json'),($taskVerification | ConvertTo-Json -Depth 10),$taskUtf8)
$taskFiles = @()
foreach ($taskFile in (Get-ChildItem -LiteralPath $taskRevisionRoot -Recurse -File | Sort-Object FullName)) {
  if ($taskFile.Name -eq 'packet.json') { continue }
  $taskRel = $taskFile.FullName.Substring($taskGroupRoot.Length+1).Replace('\','/')
  if ($taskFile.Extension -in @('.json','.md','.mjs','.html','.ps1')) {
    $taskBytes = [System.IO.File]::ReadAllBytes($taskFile.FullName)
    if ($taskBytes.Length -ge 3 -and $taskBytes[0] -eq 239 -and $taskBytes[1] -eq 187 -and $taskBytes[2] -eq 191) { throw 'UTF8 BOM forbidden.' }
  }
  $taskFiles += [ordered]@{path=$taskRel;sha256=(Get-FileHash -LiteralPath $taskFile.FullName -Algorithm SHA256).Hash.ToLower();bytes=$taskFile.Length}
}
$taskPacket = [ordered]@{
  schemaVersion=1;owner='ui';revision='r02';status='submitted';approval='pending_main_review';clientDate='2026-10-02';timezone='Asia/Shanghai';
  files=$taskFiles;images=@($taskFinalRecords | ForEach-Object {[ordered]@{id=$_.id.Split('-')[0];path=('submissions/r02/'+$_.workspaceFile);sha256=$_.workspaceSha256;pixels=$_.rasterPixels;kind='desktop-ui-concept-board';actuallyViewed=$true}});
  coveredRequirements=@($taskRequirements.requirements.id);openIssues=@();
  dependencies=@(
    [ordered]@{owner='ui';revision='r01';status='accepted';approval='reviews/ui-r01.md';role='Preserved prior player UI/mobile basis'},
    [ordered]@{owner='master';revision='r02';status='accepted';approval='reviews/master-r02.md';role='Style authority'},
    [ordered]@{owner='background';revision='r02';status='accepted';approval='reviews/background-r02.md';role='Final sparse notched ground authority'},
    [ordered]@{owner='friendly';revision='r03';status='accepted_by_previous_final_acceptance';role='Canonical tower and PLAYER NEUTRAL reuse'},
    [ordered]@{owner='bosses-mechanics';revision='r03';status='accepted_by_previous_final_acceptance';role='Canonical HIVE/NEST/twins body sources'},
    [ordered]@{owner='master';revision='future-desktop-composite';status='pending_primary_authorization_and_review';role='Highdensity actual coexisting battle and danger boundary visibility'}
  );
  summary='桌面三板：全九塔/真实鼠标横滚、五个完整BossHUD鼠标快照、紧凑单双成员与实际1/2/3奖励。主审构成预检通过后停止美化；16次内置生图调用、48映射、9塔源格、43只读来源SHA。待主审正式批准。';
  limitations=@('手机暂缓；无游戏代码/接入/部署。','原画逻辑尺寸/字体/鼠标/对比目标未实机测量。','DUI02 B危盘靠近栏；最终master必须留可读边界，操作时序板不是高密度联合通过。','13候选仅审计，不能作最终板或canonical身体；未导出透明生产素材。','纯规则例值不是整局历史/概率/性能验证。');
  previousReady=$taskPreviousReady;immutableAfterReady=$true
}
[System.IO.File]::WriteAllText($taskPacketPath,($taskPacket | ConvertTo-Json -Depth 14),$taskUtf8)
$taskPacketHash = (Get-FileHash -LiteralPath $taskPacketPath -Algorithm SHA256).Hash.ToLower()
$taskReadyStage = Join-Path $taskGroupRoot 'READY.r02.tmp'
[System.IO.File]::WriteAllText($taskReadyStage,([ordered]@{revision='r02';packetPath='submissions/r02/packet.json';packetSha256=$taskPacketHash}|ConvertTo-Json -Depth 5),$taskUtf8)
# A concrete backup path avoids PowerShell's null-to-empty string conversion on Windows.
# File.Replace atomically replaces READY; the backup preserves the prior r01 marker.
$taskReadyBackup = Join-Path $taskGroupRoot 'READY.r01.before-r02.json'
if (Test-Path -LiteralPath $taskReadyBackup) { throw 'READY backup already exists; do not overwrite it.' }
[System.IO.File]::Replace($taskReadyStage,$taskReadyPath,$taskReadyBackup)
[PSCustomObject]@{Revision='r02';Status='submitted';Files=$taskFiles.Count;Images=3;Requirements=48;Sources=$taskSources.files.Count;PacketSha256=$taskPacketHash;Ready=$taskReadyPath}
