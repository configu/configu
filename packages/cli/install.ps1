#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'

$ConfiguInstall = $env:CONFIGU_INSTALL
$BinDir = if ($ConfiguInstall) {
  "${ConfiguInstall}\bin"
} else {
  "${Home}\.configu\bin"
}
$ConfiguExe = "$BinDir\configu.exe"


$Version = $env:CONFIGU_VERSION
$Version = if (!$Version) {
  "latest"
} else {
  $Version
}

$Target = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
  "arm64"
} else {
  "x64"
}

$DownloadUrl = "https://github.com/configu/configu/releases/download/cli%2Fv${Version}/configu-${Target}.exe"

if (!(Test-Path $BinDir)) {
  New-Item $BinDir -ItemType Directory | Out-Null
}

curl.exe -Lo $ConfiguExe $DownloadUrl

$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${BinDir};*".ToLower())) {
  [System.Environment]::SetEnvironmentVariable('Path', "${Path};${BinDir}", $User)
  $Env:Path += ";${BinDir}"
}

Write-Output "Configu was installed successfully to ${ConfiguExe}"
Write-Output "Run '${ConfiguExe} --help' to get started"
