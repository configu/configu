# @configu/examples/[hello-world](https://en.wikipedia.org/wiki/%22Hello,_World!%22_program)

## flow

- Create a `.cfgu` file
  ```bash
  configu init --get-started
  ```
- Set the default store as ConfiguStore with your org and user/token
  ```bash
  configu store upsert --type "configu"
  ```
- Upsert config
  ```bash
  configu upsert --store "configu" --set "dev" --schema "get-started.cfgu.json" --config "GREETING=hey" --config "SUBJECT=<VALUE>"
  configu upsert --store "configu" --set "prod" --schema "get-started.cfgu.json" -c "SUBJECT=<VALUE>"
  configu upsert --store "configu" --set "prod/region" --schema "get-started.cfgu.json" -c "GREETING=welcome"
  ```
- Export
  ```bash
  configu export --store "configu" --set "dev" --schema "get-started.cfgu.json" --run "<EXECUTABLE>"

  set -a; source <(configu export --store "configu" --set "dev" --schema "get-started.cfgu.json" --source); set +a && <EXECUTABLE>
  ```
