# @configu-integrations/toml-file

Integrates the Configu Orchestrator with [TomlFile](https://toml.io/en/).

- Name: Toml File
- Category: File Format

## Configuration

Configu needs to be authorized to access your TomlFile configuration.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: toml-file
    configuration:
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
