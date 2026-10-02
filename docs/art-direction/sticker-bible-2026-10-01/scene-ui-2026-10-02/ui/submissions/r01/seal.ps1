$ErrorActionPreference = 'Stop'
$taskRevisionRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$taskGroupRoot = [System.IO.Directory]::GetParent([System.IO.Directory]::GetParent($taskRevisionRoot).FullName).FullName
$taskProjectRoot = 'D:/WebProjects/GeoGuard'
$taskPacketPath = Join-Path $taskRevisionRoot 'packet.json'
$taskReadyPath = Join-Path $taskGroupRoot 'READY.json'
$taskUtf8 = [System.Text.UTF8Encoding]::new($false)
if (Test-Path -LiteralPath $taskPacketPath) { throw 'r01 already sealed; never overwrite. Use a new revision.' }
if (Test-Path -LiteralPath $taskReadyPath) { throw 'READY already exists; do not overwrite a published revision.' }
Add-Type -AssemblyName System.Drawing
$taskGenerationPath = Join-Path $taskRevisionRoot 'generation-record.json'
$taskGeneration = Get-Content -Raw -LiteralPath $taskGenerationPath | ConvertFrom-Json
foreach ($taskRecord in $taskGeneration.records) {
  if (-not (Test-Path -LiteralPath $taskRecord.sourceOutput)) { throw "Missing generated output: $($taskRecord.id)" }
  $taskRecord | Add-Member -NotePropertyName sourceOutputSha256 -NotePropertyValue (Get-FileHash -LiteralPath $taskRecord.sourceOutput -Algorithm SHA256).Hash.ToLower()
  foreach ($taskRef in $taskRecord.references) {
    if (-not (Test-Path -LiteralPath $taskRef.inputContentArchive)) { throw "Missing input archive: $($taskRecord.id)" }
    $taskRef | Add-Member -NotePropertyName sha256 -NotePropertyValue (Get-FileHash -LiteralPath $taskRef.inputContentArchive -Algorithm SHA256).Hash.ToLower()
  }
  $taskSavedPath = Join-Path $taskRevisionRoot $taskRecord.workspaceFile
  $taskSavedHash = (Get-FileHash -LiteralPath $taskSavedPath -Algorithm SHA256).Hash.ToLower()
  if ($taskSavedHash -ne $taskRecord.sourceOutputSha256) { throw "Generated output/copy mismatch: $($taskRecord.id)" }
  $taskRecord | Add-Member -NotePropertyName workspaceSha256 -NotePropertyValue $taskSavedHash
  $taskBitmap = [System.Drawing.Image]::FromFile($taskSavedPath)
  try { $taskRecord | Add-Member -NotePropertyName rasterPixels -NotePropertyValue ([ordered]@{width=$taskBitmap.Width;height=$taskBitmap.Height}) } finally { $taskBitmap.Dispose() }
}
$taskSources = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot 'source-fingerprints.json') | ConvertFrom-Json
foreach ($taskSource in $taskSources.files) {
  $taskAbs = Join-Path $taskProjectRoot $taskSource.path
  if (-not (Test-Path -LiteralPath $taskAbs)) { throw "Missing source: $($taskSource.path)" }
  if ((Get-FileHash -LiteralPath $taskAbs -Algorithm SHA256).Hash.ToLower() -ne $taskSource.sha256) { throw "Source changed: $($taskSource.path)" }
}
$taskIcons = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot 'tower-icon-sources.json') | ConvertFrom-Json
if ($taskIcons.items.Count -ne 9 -or ($taskIcons.items.identity | Sort-Object -Unique).Count -ne 9) { throw 'Tower source coverage must be nine unique identities.' }
foreach ($taskIcon in $taskIcons.items) {
  if ($taskIcon.cell -ne 'NEUTRAL' -or $taskIcon.column -ne 1 -or $taskIcon.transparentIconExported) { throw 'Invalid neutral-source/production boundary.' }
  if ((Get-FileHash -LiteralPath $taskIcon.absoluteSourcePath -Algorithm SHA256).Hash.ToLower() -ne $taskIcon.sha256) { throw 'Tower body source SHA changed.' }
}
$taskRequirements = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot 'requirements-map.json') | ConvertFrom-Json
if ($taskRequirements.requirements.Count -ne 49 -or ($taskRequirements.requirements.id | Sort-Object -Unique).Count -ne 49) { throw 'Requirement mapping duplicate/missing.' }
$taskPromptBase = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot 'prompts.json') | ConvertFrom-Json
foreach ($taskRecord in $taskGeneration.records) {
  if ($taskRecord.id -like '*-edit*') { $taskPromptText = Get-Content -Raw -LiteralPath (Join-Path $taskRevisionRoot ('prompt-'+$taskRecord.id.ToLower()+'.txt')) }
  else { $taskPromptText = ($taskPromptBase.jobs | Where-Object {$_.id -eq $taskRecord.id}).prompt }
  if ($taskPromptText.TrimEnd() -ne $taskRecord.toolArguments.prompt.TrimEnd()) { throw "Prompt record mismatch: $($taskRecord.id)" }
}
$taskFinalRecords = @($taskGeneration.records | Where-Object {$_.isFinalSelected})
if ($taskFinalRecords.Count -ne 3) { throw 'Only three selected images allowed.' }
$taskVerification = [ordered]@{
  schemaVersion=1; owner='ui'; revision='r01'; status='technical-check-record'; clientDate='2026-10-02'; timezone='Asia/Shanghai';
  sourceFilesChecked=$taskSources.files.Count; sourceShaMatched=$true; generationCalls=$taskGeneration.records.Count; generatedCopiesMatched=$true;
  uniqueTowerIdentities=9; neutralColumnsVerified=$true; uniqueRequirements=49; promptRecordsMatched=$true; finalImagesActuallyViewed=$true;
  finalImages=@($taskFinalRecords | ForEach-Object {[ordered]@{path=$_.workspaceFile;sha256=$_.workspaceSha256;pixels=$_.rasterPixels}});
  imageReferenceCount=@($taskSources.files | Where-Object {$_.actuallyViewedWithViewImage}).Count;
  measurements=[ordered]@{rasterDimensionsOnly=$true;logicalDeviceDimensionsMeasured=$false;contrastMeasured=$false;touchMeasured=$false;anchorsMeasured=$false;runtimeTested=$false};
  scope='File/source/prompt technical verification and creator viewing record; no self approval; final approval pending main reviewer.'
}
[System.IO.File]::WriteAllText($taskGenerationPath,($taskGeneration | ConvertTo-Json -Depth 16),$taskUtf8)
[System.IO.File]::WriteAllText((Join-Path $taskRevisionRoot 'verification.json'),($taskVerification | ConvertTo-Json -Depth 10),$taskUtf8)
$taskFiles = @()
foreach ($taskFile in (Get-ChildItem -LiteralPath $taskRevisionRoot -Recurse -File | Sort-Object FullName)) {
  if ($taskFile.Name -eq 'packet.json') { continue }
  $taskRel = $taskFile.FullName.Substring($taskGroupRoot.Length+1).Replace('\','/')
  if ($taskFile.Extension -in @('.json','.md','.txt','.html','.ps1')) {
    $taskBytes = [System.IO.File]::ReadAllBytes($taskFile.FullName)
    if ($taskBytes.Length -ge 3 -and $taskBytes[0] -eq 239 -and $taskBytes[1] -eq 187 -and $taskBytes[2] -eq 191) { throw "UTF8 BOM: $taskRel" }
  }
  $taskFiles += [ordered]@{path=$taskRel;sha256=(Get-FileHash -LiteralPath $taskFile.FullName -Algorithm SHA256).Hash.ToLower();bytes=$taskFile.Length}
}
$taskPacket = [ordered]@{
  schemaVersion=1; owner='ui'; revision='r01'; status='submitted'; approval='pending_main_review'; clientDate='2026-10-02';timezone='Asia/Shanghai';
  files=$taskFiles;
  images=@($taskFinalRecords | ForEach-Object {[ordered]@{id=$_.id.Split('-')[0];path=('submissions/r01/'+$_.workspaceFile);sha256=$_.workspaceSha256;pixels=$_.rasterPixels;kind='final-ui-concept-board';actuallyViewed=$true}});
  coveredRequirements=@($taskRequirements.requirements.id);
  openIssues=@();
  dependencies=@(
    [ordered]@{owner='master';revision='r02';approval='reviews/master-r02.md';status='accepted';role='Overall mother art/style'},
    [ordered]@{owner='background';revision='r01';approval='reviews/background-r01.md';status='accepted';role='BG01/BG02 final ground authority; UI01 context is not background source'},
    [ordered]@{owner='friendly';revision='r03';status='accepted_by_previous_final_acceptance';role='9 tower NEUTRAL body/direction sources'},
    [ordered]@{owner='effects-ui';revision='r02';status='accepted_by_previous_final_acceptance';role='Effective typography/colors/geometry/reward semantics'}
  );
  summary='三张精细玩家UI原画：桌面/手机HUD建造提示；开始结束暂停奖励修复蓝图；组件状态放置双子与9塔源格。49项逐格映射、9身份来源、55只读来源SHA、10内置生图调用。已执行mint货币及Esc文案预检返修，等待主审正式逐图批准。';
  limitations=@('原画非可运行游戏/透明生产素材；9塔透明图标未导出。','所有逻辑尺寸/字体/触控/对比为目标；只量PNG尺寸，未实机/性能/挂点测量。','UI01地面仅上下文，后续背景按已批BG01/BG02；危险几何按旧效果/runtime。','候选仅生成审计历史，不属最终三板；动态文字不从位图裁切。','最终桌面/手机/复杂战斗复合仍独立复审。');
  immutableAfterReady=$true
}
[System.IO.File]::WriteAllText($taskPacketPath,($taskPacket | ConvertTo-Json -Depth 12),$taskUtf8)
$taskPacketHash = (Get-FileHash -LiteralPath $taskPacketPath -Algorithm SHA256).Hash.ToLower()
$taskReady = [ordered]@{revision='r01';packetPath='submissions/r01/packet.json';packetSha256=$taskPacketHash}
$taskReadyStage = Join-Path $taskGroupRoot 'READY.r01.tmp'
[System.IO.File]::WriteAllText($taskReadyStage,($taskReady | ConvertTo-Json -Depth 4),$taskUtf8)
[System.IO.File]::Move($taskReadyStage,$taskReadyPath)
[PSCustomObject]@{Revision='r01';Status='submitted';Files=$taskFiles.Count;Images=3;Requirements=49;Sources=$taskSources.files.Count;PacketSha256=$taskPacketHash;Ready=$taskReadyPath}
