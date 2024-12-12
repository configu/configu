#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'

if (-not (Get-Command 'curl.exe' -ErrorAction SilentlyContinue)) {
  Write-Output echo "Error: curl is required to install configu (see: https://curl.se/)."
  exit 1
}

# Detect OS and architecture
$ext = ""
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
  "arm64"
} elseif ($env:PROCESSOR_ARCHITECTURE -eq "x86") {
  "x86"
} else {
  "x64"
}

$arc = '.tar.gz'
$os = if ($IsWindows) {
  "win"
  $arc = '.zip'
  $ext = ".exe"
} elseif ($IsLinux) {
  "linux"
} elseif ($IsMacOS) {
  "darwin"
} else {
  Write-Error "Unsupported OS"; exit 1
}

if ($arc -eq '.tar.gz' -and -not (Get-Command 'tar.exe' -ErrorAction SilentlyContinue)) {
  Write-Output echo "Error: tar is required to install configu (see: https://www.gnu.org/software/tar/)."
  exit 1
}

$dist = "${os}-${arch}"

# Get the version from environment variable or use the default value
$version = $env:CONFIGU_VERSION
if (-not $version) {
  $version = "latest"
}
# Adjust version if necessary
if ($version -eq "latest" -or $version -eq "next") {
  $version = (curl -fsSL "https://registry.npmjs.org/@configu/cli/$version" | ConvertFrom-Json).version
}
if (-not $version.StartsWith("v")) {
  $version = "v${version}"
}

# Set the installation path
$dir = $env:CONFIGU_HOME
if (-not $dir) {
  $dir = "${Home}\.configu"
}
$bin = "${dir}\bin"
$exe = "${bin}\configu"

# Create the installation directory
if (!(Test-Path $bin)) {
  New-Item $bin -ItemType Directory | Out-Null
}

# Download the configu binary
$download = "https://github.com/configu/configu/releases/download/cli/$version/configu-$version-$dist$arc"
Write-Output "Downloading configu from $download"
curl.exe -Lo "$exe$arc" $download

# Extract the binary
if ($arc -eq '.zip') {
  Expand-Archive -Path "$exe$arc" -Destination $bin -Force
} else {
  tar.exe -xf "$exe$arc" -C $bin
}

# Make the binary executable
chmod +x $exe

# Remove the downloaded archive
Remove-Item "$exe$arc"

# Try to add to global $PATH
$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${bin};*".ToLower())) {
  [System.Environment]::SetEnvironmentVariable('Path', "${Path};${bin}", $User)
  $Env:Path += ";${bin}"
}

Write-Output "Configu was installed successfully to $exe"
if (-not (Test-Path "configu")) {
  Write-Output "Run 'configu --help' to get started"
} else {
  Write-Output "Run '$exe --help' to get started"
}
Write-Output "Stuck? Join our Discord https://discord.com/invite/cjSBxnB9z8"
