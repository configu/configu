# @configu/examples/[hello-world](https://en.wikipedia.org/wiki/%22Hello,_World!%22_program)

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