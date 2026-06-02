param(
  [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$HostName = '127.0.0.1'
$PortCandidates = @(5173, 5174, 5175, 5176, 5180, 5273, 5373, 7300)

function Test-PortAvailable {
  param(
    [string]$Address,
    [int]$Port
  )

  $listener = $null
  try {
    $ip = [System.Net.IPAddress]::Parse($Address)
    $listener = [System.Net.Sockets.TcpListener]::new($ip, $Port)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($null -ne $listener) {
      $listener.Stop()
    }
  }
}

$SelectedPort = $null
foreach ($Port in $PortCandidates) {
  if (Test-PortAvailable -Address $HostName -Port $Port) {
    $SelectedPort = $Port
    break
  }
}

if ($null -eq $SelectedPort) {
  throw "No available port found. Tried: $($PortCandidates -join ', ')"
}

$ViteCmd = Join-Path $Root 'node_modules\.bin\vite.cmd'
if (-not (Test-Path -LiteralPath $ViteCmd)) {
  Write-Host "Local dependencies are missing. Running npm install first..."
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

$Url = "http://${HostName}:$SelectedPort/GeoGuard/"
Write-Host "Starting GeoGuard on $Url"
Write-Host "If another app is using a port, this launcher tries: $($PortCandidates -join ', ')"
Write-Host "Press Ctrl+C in this window to stop the dev server."

if (-not $NoOpen) {
  $OpenScript = "Start-Sleep -Milliseconds 1200; Start-Process '$Url'"
  Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile', '-Command', $OpenScript -WindowStyle Hidden | Out-Null
}

& npm.cmd run dev -- --host $HostName --port $SelectedPort --strictPort
exit $LASTEXITCODE
