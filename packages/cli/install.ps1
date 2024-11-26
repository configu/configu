#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'

# Detect OS and architecture
$Target = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
  "arm64"
} elseif ($env:PROCESSOR_ARCHITECTURE -eq "x86") {
  "x86"
} else {
  "x64"
}

$OS = if ($IsWindows) {
  "win32"
} elseif ($IsMacOS) {
  "darwin"
} elseif ($IsLinux) {
  "linux"
} else {
  Write-Error "Unsupported OS"; exit 1
}

$Target = "${OS}-${Target}"

# Get the version from environment variable or use the default value
$Version = $env:CONFIGU_VERSION
$Version = if (!$Version -or $Version -eq "latest" -or $Version -eq "next" -or $Version.StartsWith("v")) {
  $Version
} else {
  "v${Version}"
}

# Set the installation path
$ConfiguInstall = $env:CONFIGU_PATH
$BinDir = if ($ConfiguInstall) {
  "${ConfiguInstall}\bin"
} else {
  "${Home}\.configu\bin"
}
$ConfiguExe = "$BinDir\configu.exe"

# Create the installation directory
if (!(Test-Path $BinDir)) {
  New-Item $BinDir -ItemType Directory | Out-Null
}

# Download the configu binary
$DownloadUrl = "https://github.com/configu/configu/releases/download/cli%2F${Version}/configu-${Target}.exe"
Write-Output "Downloading configu from $DownloadUrl"
curl.exe -Lo $ConfiguExe $DownloadUrl

# Make the binary executable
chmod +x $ConfiguExe

# Try to add to global $PATH
$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${BinDir};*".ToLower())) {
  [System.Environment]::SetEnvironmentVariable('Path', "${Path};${BinDir}", $User)
  $Env:Path += ";${BinDir}"
}

Write-Output "Configu was installed successfully to $ConfiguExe"
Write-Output "Run 'configu --help' to get started"
Write-Output "Stuck? Join our Discord https://discord.gg/deno"
