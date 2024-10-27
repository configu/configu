# @configu-integrations/launchdarkly

Integrates the Configu Orchestrator with [LaunchDarkly](https://launchdarkly.com/).

- Name: LaunchDarkly
- Category:

## Configuration

Configu needs to be authorized to access

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: launch-darkly
    configuration:
```

### CLI examples

#### Upsert command

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hey" \
    -c "SUBJECT=configu node.js sdk"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## References

- Integration documentation: https://docs.launchdarkly.com/home/getting-started/setting-up?_gl=1*11fhv7o*_gcl_au*MTQ4NDYyNzQ0OC4xNzI5ODgzMTI5
