# @configu/examples/hello-world

## flow

- Create a `.cfgu` file
  ```bash
  configu init --get-started
  ```
- Set the default store as JsonFileStore - with path `./store.json`
  ```bash
  configu store upsert --type "json-file"
  ```
- Upsert config
  ```bash
  configu upsert --store "json-file" --set "" --schema "get-started.cfgu.json" --config "GREETING=hey" --config "SUBJECT=<VALUE>"
  configu upsert --store "json-file" --set "dev" --schema "get-started.cfgu.json" -c "SUBJECT=<VALUE>"
  configu upsert --store "json-file" --set "prod" --schema "get-started.cfgu.json" -c "SUBJECT=<VALUE>"
  ```
- Export
  ```bash
  set -a; source <(configu export --store "json-file" --set "dev" --schema "get-started.cfgu.json" --source); set +a && <EXECUTABLE>
  ```

## resources
- [Demo flow doc](https://docs.google.com/document/d/11s9TJCeSNag0eme6RSGIYkP5OfDPKLSPl1IrYFCFako)
