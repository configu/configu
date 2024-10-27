# @configu-integrations/launch-darkly

Integrates the Configu Orchestrator with [LaunchDarkly](https://launchdarkly.com/).

- Name: LaunchDarkly
- Category: Feature flag manager

## Configuration

Configu needs to be authorized to access your LaunchDarkly project. You must specify an `sdkKey` that corresponds to an SDK key of an environment of some LaunchDarkly project and a context that has a `key` or a `targetingKey` that identifies the subject (end-user, or client service) of a flag evaluation. You may also configure [`ldOptions`](https://launchdarkly.github.io/node-server-sdk/interfaces/_launchdarkly_node_server_sdk_.LDOptions.html) to customize the LaunchDarkly client.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: launch-darkly
    configuration:
      sdkKey: example-sdkKey
        context:
          targetingKey: default
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

- Integration documentation: https://docs.launchdarkly.com
