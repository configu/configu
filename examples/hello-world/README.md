# @configu/examples/[hello-world](https://en.wikipedia.org/wiki/%22Hello,_World!%22_program)

## flow

- Install Configu CLI
- Create a `.cfgu` file
  ```bash
  configu init --get-started
  ```
- Setup a `ConfigStore` at the [.configu](.configu) file
  - use `configu login` for `ConfiguConfigStore` 
- Upsert `Config`s
  ```bash
  configu upsert --store "<STORE>" --set "dev" --schema "get-started.cfgu.json" --config "GREETING=hey" --config "SUBJECT=<VALUE>"
  configu upsert --store "configu" --set "prod" --schema "get-started.cfgu.json" -c "SUBJECT=<VALUE>"
  configu upsert --store "configu" --set "prod/region" --schema "get-started.cfgu.json" -c "GREETING=welcome"
  ```
- Export
  ```bash
  configu export --store "configu" --set "dev" --schema "get-started.cfgu.json" --run "<EXECUTABLE>"

  set -a; source <(configu export --store "configu" --set "dev" --schema "get-started.cfgu.json" --source); set +a && <EXECUTABLE>
  ```
