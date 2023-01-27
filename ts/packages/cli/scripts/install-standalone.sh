#!/usr/bin/env sh

set -e

echoerr() {
  # print to stderr
  >&2 echo "ERROR: $1"
  exit 1
}

# detect os
OS="unknown"
uname_os=$(uname -s)
if [ "$uname_os" = "Darwin" ]; then
  OS=darwin
elif [ "$uname_os" = "Linux" ] || [ "$(expr substr $uname_os 1 5)" = "Linux" ]; then
  OS=linux
else
  echoerr "unsupported os '$uname_os'"
fi

# detect arch
ARCH="unknown"
uname_machine=$(uname -m)
if [ "$uname_machine" = "x86_64" ]; then
  ARCH=x64
elif [ "$uname_machine" = "arm64" ] || [ "$uname_machine" = "aarch64" ]; then
  ARCH=arm64
elif [ "$uname_machine" = arm* ] || [ "$uname_machine" = aarch* ]; then
  ARCH=arm
else
  echoerr "unsupported architecture '$uname_machine'"
fi

set +e
curl_binary="$(command -v curl)"
wget_binary="$(command -v wget)"

# check if curl is available
[ -x "$curl_binary" ]
curl_installed=$? # 0 = yes

# check if wget is available
[ -x "$wget_binary" ]
wget_installed=$? # 0 = yes
set -e

# get download url based on version
CONFIGU_VERSION="${CONFIGU_VERSION:-latest}"
GET_DOWNLOAD_URL="https://cli.configu.com/versions/configu-$OS-$ARCH-tar-gz.json"

if [ "$CONFIGU_VERSION" = "latest" ] || [ "$CONFIGU_VERSION" = "stable" ]; then
  DOWNLOAD_URL="https://cli.configu.com/channels/stable/configu-$OS-$ARCH.tar.gz"
elif [ "$curl_installed" -eq 0 ]; then
  DOWNLOAD_URL="$(curl --fail $GET_DOWNLOAD_URL | grep -o '"$CONFIGU_VERSION": "[^"]*' | grep -o '[^"]*$')"
elif [ "$wget_installed" -eq 0 ]; then
  DOWNLOAD_URL="$(wget -qO- $GET_DOWNLOAD_URL | grep -o '"$CONFIGU_VERSION": "[^"]*' | grep -o '[^"]*$')"
else
  echoerr "missing curl or wget"
fi

# download and extract
echo "Downloading Configu CLI from $DOWNLOAD_URL"
tar_args="xz"
if [ "$curl_installed" -eq 0 ]; then
  curl "$DOWNLOAD_URL" | tar "$tar_args"
elif [ "$wget_installed" -eq 0 ]; then
  wget -O- "$DOWNLOAD_URL" | tar "$tar_args"
else
  echoerr "missing curl or wget"
fi

INSTALL_PATH="$(pwd)/configu/bin/configu"
# test
echo "$($INSTALL_PATH version) installed at $INSTALL_PATH"
