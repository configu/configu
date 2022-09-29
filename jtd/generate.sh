#!/bin/bash

if ! [ $(command -v jtd-codegen) ]; then
  echo "jtd-codegen is required"
  exit 1
fi

# source: https://stackoverflow.com/a/4774063/7654737 | https://stackoverflow.com/q/59895/7654737
SCRIPT_DIR="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

: ${OUT_LANG:=typescript}
: ${OUT_DIR:=src/types/generated}

rm -rf $OUT_DIR
mkdir -p $OUT_DIR

for JTD_FILE in $(ls $SCRIPT_DIR | grep jtd.json); do
  JTD_NAME="${JTD_FILE%%.*}"
  JTD_PATH="$SCRIPT_DIR/$JTD_FILE"
  JTD_OUT="$OUT_DIR/$JTD_FILE"

  cp $JTD_PATH $JTD_OUT

  # todo: support all jtd language generation
  case $OUT_LANG in
    typescript)
      jtd-codegen $JTD_OUT --typescript-out $OUT_DIR
      mv "$OUT_DIR/index.ts" "$OUT_DIR/$JTD_NAME.ts"
      ;;
    python)
      jtd-codegen $JTD_OUT --python-out $OUT_DIR
      mv "$OUT_DIR/__init__.py" "$OUT_DIR/$JTD_NAME.py"
      ;;
    go)
      jtd-codegen $JTD_OUT --go-out $OUT_DIR --go-package $JTD_NAME
      ;;
    *)
      echo "$OUT_LANG is not supported"
      exit 1
      ;;
  esac
done
