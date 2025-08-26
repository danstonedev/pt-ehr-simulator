Param(
  [string]$HostName,
  [string]$User,
  [string]$KeyPath,
  [int]$Port = 22,
  [string]$TargetPath
)

Write-Host "Deploying app/ to main app target..." -ForegroundColor Cyan

$AppPath = Join-Path $PSScriptRoot 'app'
if (!(Test-Path $AppPath)) { throw "app/ folder not found at $AppPath" }

if ($HostName -and $User -and $KeyPath -and $TargetPath) {
  if (!(Test-Path $KeyPath)) { throw "SSH key not found at $KeyPath" }
  $Temp = Join-Path $env:TEMP ("pt-emr-artifact-" + [System.Guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $Temp | Out-Null
  try {
    # Sync app/ into temp to avoid sending repo extras
    robocopy $AppPath $Temp /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
  Write-Host ("Uploading to {0}@{1}:{2} via scp..." -f $User, $HostName, $TargetPath)
  $dest = "$User@$HostName`:$TargetPath/"
  scp -i "$KeyPath" -P $Port -r "$Temp/*" "$dest"
    if ($LASTEXITCODE -ne 0) { throw "SCP failed with code $LASTEXITCODE" }
    Write-Host "Deploy complete." -ForegroundColor Green
  } finally {
    Remove-Item -Recurse -Force $Temp
  }
} elseif ($TargetPath) {
  Write-Host "Copying app/ to local/UNC path: $TargetPath" -ForegroundColor Yellow
  robocopy $AppPath $TargetPath /MIR
  if ($LASTEXITCODE -ge 8) { throw "Robocopy failed with code $LASTEXITCODE" }
  Write-Host "Deploy complete." -ForegroundColor Green
} else {
  Write-Host "Usage examples:" -ForegroundColor Yellow
  Write-Host "  # Remote via SSH key" -ForegroundColor Yellow
  Write-Host "  .\\deploy-main-app.ps1 -HostName example.org -User deploy -KeyPath C:\\keys\\id_rsa -Port 22 -TargetPath /var/www/pt-emr" -ForegroundColor Yellow
  Write-Host "  # Local copy (e.g., mapped drive)" -ForegroundColor Yellow
  Write-Host "  .\\deploy-main-app.ps1 -TargetPath \\fileserver\\wwwroot\\pt-emr" -ForegroundColor Yellow
}
