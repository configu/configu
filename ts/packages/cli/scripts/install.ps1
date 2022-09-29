#Requires -RunAsAdministrator

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$tarballName = "configu-win32-x64.tar.gz"
$downloadUrl = "https://cli.configu.com/channels/stable/$tarballName"
$tarArgs = "xz"

$installRoot = (Join-Path $env:ProgramFiles "configu")
$configRoot = (Join-Path $env:LOCALAPPDATA "configu")
$binRoot = (Join-Path $installRoot "bin")

# If we have a previous install, delete it.
if (Test-Path -Path $installRoot) {
  Remove-Item -Recurse -Force $installRoot
}
if (Test-Path -Path $configRoot) {
  Remove-Item -Recurse -Force $configRoot
}

Write-Host "Installing CLI from $downloadUrl"

# Install 7-zip to allow wxtracting .tar.gz files
# https://gist.github.com/SomeCallMeTom/6dd42be6b81fd0c898fa9554b227e4b4
$dlurl = 'https://7-zip.org/' + (Invoke-WebRequest -UseBasicParsing -Uri 'https://7-zip.org/' | Select-Object -ExpandProperty Links | Where-Object {($_.outerHTML -match 'Download')-and ($_.href -like "a/*") -and ($_.href -like "*-x64.exe")} | Select-Object -First 1 | Select-Object -ExpandProperty href)
$installerPath = Join-Path $env:TEMP (Split-Path $dlurl -Leaf)
Invoke-WebRequest $dlurl -OutFile $installerPath
Start-Process -FilePath $installerPath -Args "/S" -Verb RunAs -Wait
Remove-Item $installerPath

# Downloads the win32 tarball
$tempTarball = New-Item -Type File (Join-Path $env:TEMP $tarballName) -Force
Invoke-WebRequest $downloadUrl -OutFile $tempTarball

# Expands .tar.gz file to .tar file
. (Join-Path $env:ProgramFiles "7-Zip\7z.exe") x -aoa $tempTarball -o"$env:TEMP" > $null
Remove-Item -Force $tempTarball

# Expands .tar file to configu dir
$tempTarball = Join-Path $env:TEMP ([System.IO.Path]::GetFileNameWithoutExtension($tarballName))
. (Join-Path $env:ProgramFiles "7-Zip\7z.exe") x -aoa $tempTarball -o"$env:ProgramFiles" > $null
Remove-Item -Force $tempTarball

# Attempt to add ourselves to the $PATH, but if we can't, don't fail the overall script.
try {
  if ($env:Path -notlike "*$binRoot*") {
    [Environment]::SetEnvironmentVariable("Path", $env:Path + ";" + $binRoot, [System.EnvironmentVariableTarget]::Machine)
    SETX /M PATH "$env:Path;$binRoot" > $null
    $env:PATH = "$env:Path;$binRoot"
  }
} catch {
  Write-Host "Ensure that $binRoot is on your `$PATH to use it."
}

try {
  Write-Host "configu installed to $binRoot"
  configu version
} catch {
} finally {
  Start-Sleep -Seconds 3
  exit 0
}
