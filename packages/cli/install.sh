#!/bin/sh

set -e

if [ "$OS" = "Windows_NT" ]; then
  target="win32-x64"
  ext="exe"
else
  ext="gz"
  case $(uname -sm) in
  "Darwin x86_64") target="darwin-x64" ;;
  "Darwin arm64") target="darwin-arm64" ;;
  "Linux aarch64") target="linux-x64" ;;
  *) target="linux-x64" ;;
  esac
fi

# get the version from environment variable or use the default value
configu_version="${CONFIGU_VERSION:-latest}"

echo "Downloading configu version $configu_version"

#configu_uri="./dist/configu-${target}${ext}"
# todo: fix
# configu_uri="https://github.com/configu/configu/releases/download/cli%2Fv${configu_version}/configu-${target}.${ext}"
configu_uri="https://github.com/configu/configu/releases/download/cli%2Fv${configu_version}/configu-${target}"
# https://github.com/configu/configu/releases/download/cli%2Fnext/configu-linux-armv7l
# https://github.com/configu/configu/releases/download/cli%2Fv1.0.0-next.205/configu-linux-x64
configu_install="${CONFIGU_DIR:-$HOME/.configu}"
bin_dir="$configu_install/bin"
exe="$bin_dir/configu"

if [ -d "$bin_dir" ]; then
  rm -rf "$bin_dir"
fi
mkdir -p "$bin_dir"

#cp $configu_uri $exe
curl --fail --location --progress-bar --output "$exe.$ext" "$configu_uri"

if [ "$ext" = "gz" ]; then
  if command -v gunzip >/dev/null; then
    gunzip "$exe.$ext"
  else
    gzip -d "$exe.$ext"
  fi
fi

chmod +x "$exe"

# configure global command "configu" to run $exec executable
echo "Configu was installed successfully to $exe"

if command -v configu >/dev/null; then
  echo "Run 'configu --help' to get started"
else
  echo "Run '$exe --help' to get started"
fi
