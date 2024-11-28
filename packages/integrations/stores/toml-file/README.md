# @configu-integrations/toml-file

Integrates the Configu Orchestrator with [TOML files](https://toml.io/en/).

- Name: Toml File
- Category: File

## Configuration

Configu needs to be directed to your desired file by providing a file path via the `path` parameter.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: toml-file
    configuration:
      path: path/to/file.toml
```

### CLI examples

#### Upsert command

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hey" \
    -c "SUBJECT=configu"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## References

- Integration documentation: https://toml.io/en/v1.0.0
