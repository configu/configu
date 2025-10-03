# @configu/cloud-bees

Integrates the Configu Orchestrator with [CloudBees Feature Management](https://docs.cloudbees.com/docs/cloudbees-feature-management/latest).

- Name: CloudBees
- Category: Feature flag manager

## Configuration

Configu needs to be authorized to access your CloudBees app. You must specify an `appKey` that corresponds to an an environment of some CloudBees environment and an optional context that has a `targetingKey` that identifies the subject (end-user, or client service) of a flag evaluation. You may also configure [`providerOptions`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/dc3f51b89bf7741b8d327311321ab6db041aa88d/types/rox-node/index.d.ts#L35C35-L35C35) to customize the CloudBees client.

## Limitations

- Only supports the eval and export commands.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: cloud-bees
    configuration:
      appKey: example-appKey
```

### CLI Examples

#### Upsert command

Not supported

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common errors and solutions

1. Invalid API token
   - Solution: Verify that the provided `apiToken` is valid and has access to the necessary resources. Regenerate the token if needed via the CloudBees dashboard.

2. Connection timeout
   - Solution: Check the `url` and ensure the CloudBees instance is accessible. Make sure there are no firewall or network restrictions blocking access.

3. Unauthorized access
   - Solution: Ensure that the API token or credentials have the necessary permissions for the specified project and environment. Update the permissions via the CloudBees admin console.

4. Configuration not found
   - Solution: Verify that the correct `project` and `environment` names are provided in the store configuration. Check if the configuration exists in the CloudBees instance.

## References

- Integration Documentation: https://docs.cloudbees.com/docs/cloudbees-platform/latest/feature-management
