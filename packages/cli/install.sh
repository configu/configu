#!/bin/sh

set -e

# Detect OS and architecture
if [ "$OS" = "Windows_NT" ]; then
  ext=".exe"
  dist="win32-x64"
else
  ext=""
  case $(uname -sm) in
  "Darwin x86_64") dist="darwin-x64" ;;
  "Darwin arm64") dist="darwin-arm64" ;;
  "Linux aarch64") dist="linux-arm64" ;;
  "Linux armv7l") dist="linux-armv7l" ;;
  "Linux x86_64") dist="linux-x64" ;;
  *) echo "Unsupported OS/architecture combination"; exit 1 ;;
  esac
fi

# Get the version from environment variable or use the default value
version="${CONFIGU_VERSION:-latest}"
# Adjust version if necessary
if [ "$version" != "latest" ] && [ "$version" != "next" ] && [ "${version#v}" = "$version" ]; then
  version="v$version"
fi

# Set the installation path
dir="${CONFIGU_PATH:-$HOME/.configu}"
bin="$configu_install/bin"
exe="$bin/configu$ext"

# Create the installation directory
mkdir -p "$bin"

# Download the configu binary
download="https://github.com/configu/configu/releases/download/cli%2F${version}/configu-${dist}${ext}"
echo "Downloading configu from $download"
curl --fail --location --progress-bar --output "$exe" "$download"

# Make the binary executable
chmod +x "$exe"

# Try to add to global $PATH
if command -v configu >/dev/null; then
  echo "Configu was installed successfully to $exe"
  echo "Run 'configu --help' to get started"
else
  echo "Configu was installed successfully to $exe"
  echo "Manually add the directory to your \$HOME/.bash_profile (or similar)"
  echo "  export PATH=\"\$PATH:$bin\""
  echo "Run '$exe --help' to get started"
fi

echo "Stuck? Join our Discord https://discord.com/invite/cjSBxnB9z8"
