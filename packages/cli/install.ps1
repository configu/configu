#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'

# Detect OS and architecture
$os = [System.Runtime.InteropServices.RuntimeInformation]::OSDescription
# https://learn.microsoft.com/en-us/dotnet/api/system.runtime.interopservices.architecture
# https://blog.nerdbank.net/2023/02/how-to-get-os-architecture-in-windows-powershell
$arch = [System.Runtime.InteropServices.RuntimeInformation,mscorlib]::OSArchitecture

switch -Wildcard ($os) {
  '*Windows*' {
    switch ($arch) {
      'X64' { $dist = 'win-x64' }
      'Arm64' { $dist = 'win-arm64' }
      default { Write-Error "Unsupported architecture: $arch"; exit 1 }
    }
    $archive_ext = '.zip'
    $exec_ext = '.exe'
  }
  '*Linux*' {
    switch ($arch) {
      'X64' { $dist = 'linux-x64' }
      'Arm64' { $dist = 'linux-arm64' }
      default { Write-Error "Unsupported architecture: $arch"; exit 1 }
    }
    $archive_ext = '.tar.gz'
    $exec_ext = ''
  }
  '*Darwin*' {
    switch ($arch) {
      'X64' { $dist = 'darwin-x64' }
      'Arm64' { $dist = 'darwin-arm64' }
      default { Write-Error "Unsupported architecture: $arch"; exit 1 }
    }
    $archive_ext = '.tar.gz'
    $exec_ext = ''
  }
  default {
    Write-Error "Unsupported OS: $os"
    exit 1
  }
}

# Check for required commands
if ($archive_ext -eq '.tar.gz' -and -not (Get-Command 'tar' -ErrorAction SilentlyContinue)) {
  Write-Output "Error: tar is required to install Configu (see: https://www.gnu.org/software/tar/)."
  exit 1
}

# Resolve the version to install
$version = $env:CONFIGU_VERSION
if (-not $version) {
  $version = "latest"
}
if ($version -eq "latest" -or $version -eq "next") {
  # $version = (Invoke-WebRequest -Uri "https://registry.npmjs.org/@configu/cli/$version" -UseBasicParsing | ConvertFrom-Json).version
  $version = (Invoke-WebRequest -Uri "https://files.configu.com/cli/channels/$version" -UseBasicParsing).content
}
# Remove leading 'v' if present
version = version.TrimStart('v')

# Set the installation path
$install_dir = $env:CONFIGU_HOME
if (-not $install_dir) {
  $install_dir = Join-Path -Path $Home -ChildPath ".configu"
}
$bin_dir = Join-Path -Path $install_dir -ChildPath "bin"
$exec_path = Join-Path -Path $bin_dir -ChildPath "configu"

# Create the installation directory
if (-not (Test-Path $bin_dir)) {
  New-Item $bin_dir -ItemType Directory | Out-Null
}

# Download the Configu binary
# $download_url = "https://github.com/configu/configu/releases/download/cli/v$version/configu-v$version-$dist$archive_ext"
$download_url = "https://files.configu.com/cli/versions/$version/configu-v$version-$dist$archive_ext"
Write-Output "Downloading Configu from $download_url"
Invoke-WebRequest -Uri $download_url -OutFile "$exec_path$archive_ext" -UseBasicParsing

# Extract the binary
if ($archive_ext -eq '.zip') {
  Expand-Archive -Path "$exec_path$archive_ext" -Destination $bin_dir -Force
} else {
  tar -xf "$exec_path$archive_ext" -C $bin_dir
}

# Make the binary executable (only needed for non-Windows systems)
if ($exec_ext -eq '') {
  chmod +x $exec_path
}

# Clean up
Remove-Item "$exec_path$archive_ext"

# Run setup command
& $exec_path$exec_ext setup --global --purge
