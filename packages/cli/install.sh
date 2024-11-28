#!/bin/sh

set -e

if ! command -v curl >/dev/null; then
  echo "Error: curl is required to install configu (see: https://curl.se/)."
  exit 1
fi

# Detect OS and architecture
if [ "$OS" = "Windows_NT" ]; then
  dist="win-x64"
  arc=".zip"
  ext=".exe"

  if ! command -v unzip >/dev/null && ! command -v 7z >/dev/null; then
    echo "Error: either unzip or 7z is required to install configu (see: )."
    exit 1
  fi
else
  case $(uname -sm) in
  "Darwin x86_64") dist="darwin-x64" ;;
  "Darwin arm64") dist="darwin-arm64" ;;
  "Linux aarch64") dist="linux-arm64" ;;
  "Linux armv7l") dist="linux-armv7l" ;;
  "Linux x86_64") dist="linux-x64" ;;
  *) echo "Unsupported OS/architecture combination"; exit 1 ;;
  esac
  arc=".tar.gz"
  ext=""

  if ! command -v tar >/dev/null; then
    echo "Error: tar is required to install configu (see: https://www.gnu.org/software/tar/)."
    exit 1
  fi
fi

# Get the version from environment variable or use the default value
version="${CONFIGU_VERSION:-latest}"

# Adjust version if necessary
if [ "$version" != "latest" ] && [ "$version" != "next" ] && [ "${version#v}" = "$version" ]; then
  version="v$version"
fi

# Set the installation path
dir="${CONFIGU_HOME:-$HOME/.configu}"
bin="$dir/bin"
exe="$bin/configu"

# Create the installation directory
mkdir -p "$bin"

# Download the configu binary
download="https://github.com/configu/configu/releases/download/cli/$version/configu-$version-$dist$arc"
echo "Downloading configu from $download"
curl -fsSL "$download" -o "$exe$arc"

# Extract the binary
if [ "$arc" = ".tar.gz" ]; then
  tar -xzf "$exe$arc" -C "$bin"
else
  if command -v unzip >/dev/null; then
    unzip -o "$exe$arc" -d "$bin"
  else
    7z x -y "$exe$arc" -o"$bin"
  fi
fi

# Make the binary executable
chmod +x "$exe"

# Clean up
rm "$exe$arc"

# Try to add to global $PATH
echo "Configu was installed successfully to $exe"
if command -v configu >/dev/null; then
  echo "Run 'configu --help' to get started"
else
  echo "Run '$exe --help' to get started"
  echo "Manually add the directory to your \$HOME/.bash_profile (or similar)"
  echo "  export PATH=\"\$PATH:$bin\""
fi
echo "Stuck? Join our Discord https://discord.com/invite/cjSBxnB9z8"
