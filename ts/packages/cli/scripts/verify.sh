#!/usr/bin/env sh

CONFIGU_BIN_PATH="${CONFIGU_BIN_PATH:-configu}"

$CONFIGU_BIN_PATH version
if [ $? -ne 0 ]; then
  echo "configu cli is not installed, see https://configu.com/docs/cli-setup/#install-with-script"
  echo "initiating installation ..."
  curl https://cli.configu.com/install.sh | sh
  return
fi

$CONFIGU_BIN_PATH test --store "configu" --clean
if [ $? -ne 0 ]; then
  echo "your not logged in to configu config-store, see https://configu.com/docs/cli-commands/#configu-login"
  echo "initiating login ..."
  $CONFIGU_BIN_PATH login
  return
fi

# if [[ -z "${CONFIGU_SCRIPT}" ]]; then
#   return
# else
#   $CONFIGU_BIN_PATH run --script "$CONFIGU_SCRIPT"
# fi
