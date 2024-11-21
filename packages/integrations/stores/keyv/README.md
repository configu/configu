# @configu-integrations/keyv

Integrates the Configu Orchestrator with [Key-v](https://keyv.org/).

- Name: Keyv
- Category: Key-value store

## Configuration

The Keyv client [should be configured to use the intended storage adapter](https://keyv.org/docs/#3-create-a-new-keyv-instance). By default, if the client isn't configured, everything is stored in memory.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: keyv
    configuration:
      uri: <path-to-storage>
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

- Integration documentation: https://keyv.org/docs
