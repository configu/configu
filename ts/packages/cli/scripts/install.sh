#!/bin/bash
{
    set -e
    SUDO=''
    if [ "$(id -u)" != "0" ]; then
      SUDO='sudo'
      echo "This script requires superuser access."
      echo "You will be prompted for your password by sudo."
      # clear any previous sudo permission
      sudo -k
    fi


    # run inside sudo
    $SUDO bash <<SCRIPT
  set -e

  echoerr() { echo "\$@" 1>&2; }

  if [[ ! ":\$PATH:" == *":/usr/local/bin:"* ]]; then
    echoerr "Your path is missing /usr/local/bin, you need to add this to use this installer."
    exit 1
  fi

  if [ "\$(uname)" == "Darwin" ]; then
    OS=darwin
  elif [ "\$(expr substr \$(uname -s) 1 5)" == "Linux" ]; then
    OS=linux
  else
    echoerr "This installer is only supported on Linux and MacOS"
    exit 1
  fi

  ARCH="\$(uname -m)"
  if [ "\$ARCH" == "x86_64" ]; then
    ARCH=x64
  elif [ "\$ARCH" == "arm64" ]; then
    ARCH=arm64
  elif [[ "\$ARCH" == arm* || "\$ARCH" == aarch* ]]; then
    ARCH=arm
  else
    echoerr "unsupported arch: \$ARCH"
    exit 1
  fi

  CONFIGU_VERSION="${CONFIGU_VERSION:-latest}"
  GET_DOWNLOAD_URL="https://cli.configu.com/versions/configu-\$OS-\$ARCH-tar-gz.json"

  if [[ "\$CONFIGU_VERSION" == "latest" || "\$CONFIGU_VERSION" == "stable" ]]; then
    DOWNLOAD_URL="https://cli.configu.com/channels/stable/configu-\$OS-\$ARCH.tar.gz"
  elif [ \$(command -v curl) ]; then
    DOWNLOAD_URL="\$(curl --fail \$GET_DOWNLOAD_URL | grep -o '"$CONFIGU_VERSION": "[^"]*' | grep -o '[^"]*$')"
  else
    DOWNLOAD_URL="\$(wget -qO- \$GET_DOWNLOAD_URL | grep -o '"$CONFIGU_VERSION": "[^"]*' | grep -o '[^"]*$')"
    exit 1
  fi

  TAR_ARGS="xz"

  mkdir -p /usr/local/lib /usr/local/bin
  cd /usr/local/lib
  rm -rf configu
  rm -rf ~/.local/share/configu/client

  echo "Installing CLI from \$DOWNLOAD_URL"

  if [ \$(command -v curl) ]; then
    curl "\$DOWNLOAD_URL" | tar "\$TAR_ARGS"
  else
    wget -O- "\$DOWNLOAD_URL" | tar "\$TAR_ARGS"
  fi

  # delete old configu bin if exists
  rm -f \$(command -v configu) || true
  rm -f /usr/local/bin/configu

  ln -s /usr/local/lib/configu/bin/configu /usr/local/bin/configu

  # on alpine (and maybe others) the basic node binary does not work
  # remove our node binary and fall back to whatever node is on the PATH
  /usr/local/lib/configu/bin/node -v || rm /usr/local/lib/configu/bin/node

SCRIPT
  # test the CLI
  LOCATION=$(command -v configu)
  echo "configu installed to $LOCATION"
  configu version
}
