#!/bin/bash
{
    set -e
    SUDO=''
    if [ "$(id -u)" != "0" ]; then
      SUDO='sudo'
      echo "This installer requires superuser access"
      echo "You will be prompted for your password by sudo"
      # clear any previous sudo permission
      sudo -k
    fi


    # run inside sudo
    $SUDO bash <<SCRIPT
  set -e

  echoerr() { echo "\$@" 1>&2; }

  if [[ ! ":\$PATH:" == *":/usr/local/bin:"* ]]; then
    echoerr "Your PATH is missing /usr/local/bin"
    echoerr "You need to add it to use this installer"
    exit 1
  fi

  if [ "\$(uname)" == "Darwin" ]; then
    OS="darwin"
  elif [ "\$(expr substr \$(uname -s) 1 5)" == "Linux" ]; then
    OS="linux"
  else
    echoerr "This installer is only supported on Linux and MacOS"
    exit 1
  fi

  ARCH="\$(uname -m)"
  if [ "\$ARCH" == "x86_64" ]; then
    ARCH="x64"
  elif [ "\$ARCH" == "arm64" ]; then
    ARCH="arm64"
  elif [[ "\$ARCH" == arm* || "\$ARCH" == aarch* ]]; then
    ARCH="arm"
  else
    echoerr "Unsupported arch \$ARCH"
    exit 1
  fi

  TARBALL_NAME="configu-\$OS-\$ARCH"
  CONFIGU_VERSION=${CONFIGU_VERSION:="stable"}
  TAR_ARGS="xz"

  INSTALL_PATH="/usr/local/lib/configu"
  BIN_PATH="\$INSTALL_PATH/bin"
  # https://github.com/oclif/oclif/blob/149ef6ef296cdebc49793679a95dddc72d2debfd/src/tarballs/bin.ts#L57
  CLI_HOME=\$(cd && pwd)
  CLI_DATA_PATH=${XDG_DATA_HOME:="\$CLI_HOME/.local/share/configu"}

  STABLE_DOWNLOAD_URL="https://cli.configu.com/channels/stable/\$TARBALL_NAME.tar.gz"
  VERSION_DOWNLOAD_URL="https://cli.configu.com/versions/\$TARBALL_NAME-tar-gz.json"

  if [[ "\$CONFIGU_VERSION" == "stable" || "\$CONFIGU_VERSION" == "latest" || "\$CONFIGU_VERSION" == "lts" ]]; then
    DOWNLOAD_URL="\$STABLE_DOWNLOAD_URL"
  elif [ \$(command -v curl) ]; then
    DOWNLOAD_URL="\$(curl --fail \$VERSION_DOWNLOAD_URL | grep -o '"$CONFIGU_VERSION": "[^"]*' | grep -o '[^"]*$')"
  elif [ \$(command -v wget) ]; then
    DOWNLOAD_URL="\$(wget -qO- \$VERSION_DOWNLOAD_URL | grep -o '"$CONFIGU_VERSION": "[^"]*' | grep -o '[^"]*$')"
  else
    echoerr "This installer requires either 'curl' or 'wget' command be available on your PATH"
    exit 1
  fi

  # Delete old configu installation if exists
  rm -rf \$INSTALL_PATH
  rm -rf \$CLI_DATA_PATH

  # Delete old configu bin if exists
  rm -f \$(command -v configu) || true
  rm -f /usr/local/bin/configu

  echo "Installing Configu CLI from \$DOWNLOAD_URL"

  mkdir -p /usr/local/lib /usr/local/bin
  cd /usr/local/lib

  # Download and Extract the tarball to INSTALL_PATH
  if [ \$(command -v curl) ]; then
    curl "\$DOWNLOAD_URL" | tar "\$TAR_ARGS"
  else
    wget -O- "\$DOWNLOAD_URL" | tar "\$TAR_ARGS"
  fi

  # Add configu to the PATH
  ln -s /usr/local/lib/configu/bin/configu /usr/local/bin/configu

  # on alpine (and maybe others) the basic node binary does not work
  # remove our node binary and fall back to whatever node is on the PATH
  /usr/local/lib/configu/bin/node -v || rm /usr/local/lib/configu/bin/node

SCRIPT
  # Test the CLI
  BIN_PATH=$(command -v configu)
  echo "Configu CLI installed to $BIN_PATH"
  configu version
}
