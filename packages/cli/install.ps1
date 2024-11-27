#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'

# Detect OS and architecture
$ext = ""
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
  "arm64"
} elseif ($env:PROCESSOR_ARCHITECTURE -eq "x86") {
  "x86"
} else {
  "x64"
}

$os = if ($IsWindows) {
  "win32"
  $ext = ".exe"
} elseif ($IsMacOS) {
  "darwin"
} elseif ($IsLinux) {
  "linux"
} else {
  Write-Error "Unsupported OS"; exit 1
}

$dist = "${os}-${arch}"

# Get the version from environment variable or use the default value
$version = $env:CONFIGU_VERSION
if (-not $version) {
  $version = "latest"
}

# Adjust version if necessary
if ($version -ne "latest" -and $version -ne "next" -and -not $version.StartsWith("v")) {
  $version = "v${version}"
}

# Set the installation path
$dir = $env:CONFIGU_PATH
if (-not $dir) {
  $dir = "${Home}\.configu"
}
$bin = "${dir}\bin"
$exe = "${bin}\configu${ext}"

# Create the installation directory
if (!(Test-Path $bin)) {
  New-Item $bin -ItemType Directory | Out-Null
}

# Download the configu binary
$download = "https://github.com/configu/configu/releases/download/cli%2F${version}/configu-${dist}${ext}"
Write-Output "Downloading configu from $download"
curl.exe -Lo $exe $download

# Make the binary executable
chmod +x $exe

# Try to add to global $PATH
$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${bin};*".ToLower())) {
  [System.Environment]::SetEnvironmentVariable('Path', "${Path};${bin}", $User)
  $Env:Path += ";${bin}"
}

Write-Output "Configu was installed successfully to $exe"
Write-Output "Run 'configu --help' to get started"
Write-Output "Stuck? Join our Discord https://discord.com/invite/cjSBxnB9z8"
