#Requires -RunAsAdministrator

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ((Get-Command "tar" -ErrorAction SilentlyContinue) -eq $null) {
  Write-Host "This installer requires the 'tar.exe' command be available on your PATH"
  exit 1
}

$OS = "win32"
$ARCH = "x64"
$TARBALL_NAME = "configu-$OS-$ARCH.tar.gz"
$CONFIGU_VERSION = if ($env:CONFIGU_VERSION) { $env:CONFIGU_VERSION } else { "stable" }

$INSTALL_PATH = (Join-Path $env:ProgramFiles "configu")
$BIN_PATH = (Join-Path $INSTALL_PATH "bin")
# https://github.com/oclif/oclif/blob/149ef6ef296cdebc49793679a95dddc72d2debfd/src/tarballs/bin.ts#L22
$CLI_DATA_PATH = (Join-Path $env:LOCALAPPDATA "configu")

$STABLE_DOWNLOAD_URL = "https://cli.configu.com/channels/stable/$TARBALL_NAME"
$VERSION_DOWNLOAD_URL = "https://cli.configu.com/versions/configu-$OS-$ARCH-tar-gz.json"

if ($CONFIGU_VERSION -eq 'stable' -or $CONFIGU_VERSION -eq 'latest' -or $CONFIGU_VERSION -eq 'lts') {
  $DOWNLOAD_URL = $STABLE_DOWNLOAD_URL
} else {
  $DOWNLOAD_URL = (Invoke-WebRequest $VERSION_DOWNLOAD_URL | ConvertFrom-Json | Select-Object -expand $CONFIGU_VERSION)
}

# Delete old configu installation if exists
if (Test-Path -Path $INSTALL_PATH) {
  Remove-Item -Recurse -Force $INSTALL_PATH
}
if (Test-Path -Path $CLI_DATA_PATH) {
  Remove-Item -Recurse -Force $CLI_DATA_PATH
}

Write-Host "Installing Configu from $DOWNLOAD_URL"

cd $env:ProgramFiles

# Download the win32 tarball
$TEMP_TARBALL = New-Item -Type File (Join-Path $env:TEMP $TARBALL_NAME) -Force
Invoke-WebRequest $DOWNLOAD_URL -OutFile $TEMP_TARBALL

# Expand .tar file to INSTALL_PATH
tar -xzf $TEMP_TARBALL
Remove-Item -Force $TEMP_TARBALL

# Attempt to add configu to the PATH, but if we can't, don't fail the overall script.
try {
  if ($env:Path -notlike "*$BIN_PATH*") {
    [Environment]::SetEnvironmentVariable("Path", $env:Path + ";" + $BIN_PATH, [System.EnvironmentVariableTarget]::Machine)
    SETX /M PATH "$env:Path;$BIN_PATH" > $null
    $env:PATH = "$env:Path;$BIN_PATH"
  }
} catch {
  Write-Host "Ensure that $BIN_PATH is on your `$PATH to use it"
}

# Test the CLI
Write-Host "Configu CLI installed to $BIN_PATH"
configu version

Start-Sleep -Seconds 3
exit 0
