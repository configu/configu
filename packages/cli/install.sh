#!/bin/sh

set -e

# Detect OS and architecture
os="$(uname -s)"
arch="$(uname -m)"
case "$os" in
  Darwin)
    case "$arch" in
      x86_64) dist="darwin-x64" ;;
      arm64) dist="darwin-arm64" ;;
      *) echo "Unsupported architecture: $arch"; exit 1 ;;
    esac
    archive_ext=".tar.gz"
    exec_ext=""
    ;;
  Linux)
    case "$arch" in
      x86_64)
        if [ -f /etc/alpine-release ] || ldd --version 2>&1 | grep -q musl; then
          dist="linux-x64-musl"
        else
          dist="linux-x64"
        fi
        ;;
      arm64) dist="linux-arm64" ;;
      *) echo "Unsupported architecture: $arch"; exit 1 ;;
    esac
    archive_ext=".tar.gz"
    exec_ext=""
    ;;
  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    case "$arch" in
      x86_64) dist="win-x64" ;;
      arm64) dist="win-arm64" ;;
      *) echo "Unsupported architecture: $arch"; exit 1 ;;
    esac
    archive_ext=".zip"
    exec_ext=".exe"
    if ! command -v unzip >/dev/null && ! command -v 7z >/dev/null; then
      echo "Error: either unzip or 7z is required to install Configu."
      exit 1
    fi
    ;;
  *)
    echo "Unsupported OS: $os"
    exit 1
    ;;
esac

# Check for required commands
if ! command -v curl >/dev/null; then
  echo "Error: curl is required to install Configu (see: https://curl.se/)."
  exit 1
fi

if [ "$archive_ext" = ".tar.gz" ] && ! command -v tar >/dev/null; then
  echo "Error: tar is required to install Configu (see: https://www.gnu.org/software/tar/)."
  exit 1
fi

if [ "$archive_ext" = ".zip" ] && ! command -v unzip >/dev/null && ! command -v 7z >/dev/null; then
  echo "Error: either unzip or 7z is required to install Configu."
  exit 1
fi

# Get the version from environment variable or use the default value
version="${CONFIGU_VERSION:-latest}"
echo "$version"
# Adjust version if necessary
if [ "$version" = "latest" ] || [ "$version" = "next" ]; then
  version=$(curl -fsSL "https://registry.npmjs.org/@configu/cli/$version" | sed -e 's/^.*version":"//' | sed -e 's/".*$//')
fi
echo "$version"
if [ "${version#v}" = "$version" ]; then
  version="v$version"
fi
echo "$version"

# Set the installation path
install_dir="${CONFIGU_HOME:-$HOME/.configu}"
bin_dir="$install_dir/bin"
exec_path="$bin_dir/configu"

# Create the installation directory
mkdir -p "$bin_dir"

# Download the Configu binary
download_url="https://github.com/configu/configu/releases/download/cli/$version/configu-$version-$dist$archive_ext"
echo "Downloading Configu from $download_url"
curl -fsSL "$download_url" -o "$exec_path$archive_ext"

# Extract the binary
if [ "$archive_ext" = ".tar.gz" ]; then
  tar -xzf "$exec_path$archive_ext" -C "$bin_dir"
else
  if command -v unzip >/dev/null; then
    unzip -o "$exec_path$archive_ext" -d "$bin_dir"
  else
    7z x -y "$exec_path$archive_ext" -o"$bin_dir"
  fi
fi

# Make the binary executable
chmod +x "$exec_path"

# Clean up
rm "$exec_path$archive_ext"

# Print next steps
echo "Configu was installed successfully to $exec_path"
echo "Run '$exec_path --help' to get started"
echo "Stuck? Join our Discord https://discord.com/invite/cjSBxnB9z8"
