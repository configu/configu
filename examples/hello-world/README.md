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
  configu upsert --store "<STORE>" --set "dev" --schema "start.cfgu.json" --config "GREETING=hey" --config "SUBJECT=<VALUE>"
  configu upsert --store "<STORE>" --set "prod" --schema "start.cfgu.json" -c "SUBJECT=<VALUE>"
  configu upsert --store "<STORE>" --set "prod/region" --schema "start.cfgu.json" -c "GREETING=welcome"
  ```
- Eval & Export

  ```bash
  configu export --store "configu" --set "dev" --schema "start.cfgu.json" --run "<EXECUTABLE>"

  set -a; source <(configu export --store "configu" --set "dev" --schema "start.cfgu.json" --source); set +a && <EXECUTABLE>
  ```
