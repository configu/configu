#!/bin/bash
tsx --inspect-brk packages/cli/src/configu.ts eval --defaults --schema "$(curl https://raw.githubusercontent.com/configu/configu/refs/heads/main/packages/schema/data/xy.cfgu.yaml)"


tsx packages/cli/src/configu.ts eval --defaults --schema "$(cat <<EOF
KEY1:
  type: String
  default: "value1"
EOF
)"
