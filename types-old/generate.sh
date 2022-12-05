#!/bin/bash

# source: https://stackoverflow.com/a/4774063/7654737 | https://stackoverflow.com/q/59895/7654737
SCRIPT_DIR="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

: ${OUT_LANG:=ts}
: ${OUT_DIR:=src/types/generated}

rm -rf $OUT_DIR
mkdir -p $OUT_DIR

for FILE in $(ls $SCRIPT_DIR | grep .ts); do
  FILE_NAME="${FILE%%.*}"
  FILE_PATH="$SCRIPT_DIR/$FILE"
  OUT_FILE="$OUT_DIR/$FILE_NAME.$OUT_LANG"


  # todo: support all jtd language generation
  case $OUT_LANG in
    schema)
      quicktype --lang $OUT_LANG --out "$OUT_FILE.json" --src-lang ts --src $FILE_PATH --top-level $FILE_NAME
      json -I -f "$OUT_FILE.json" -e "this.\$ref=\"#/definitions/$FILE_NAME\""
      ;;
    *)
      quicktype --lang $OUT_LANG --out $OUT_FILE --src-lang ts --src $FILE_PATH --top-level $FILE_NAME
      ;;
  esac
done
