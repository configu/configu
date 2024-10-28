# @configu-integrations/split

Integrates the Configu Orchestrator with [Split](https://help.split.io/hc/en-us).

- Name: Split
- Category: Feature flag manager

## Configuration

Configu needs to be authorized to access your Split project. You must specify an `authKey` that corresponds to an SDK key of an environment of some Split project, a context that has a `targetingKey` that identifies the subject (end-user or client service) of a flag evaluation, and optionally a `key` that represents a customer identifier, [more details can be found in the Split SDK initialization documentation](https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#initialization).

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: split
    configuration:
      authKey: <your-sdk-api-key>
      context:
        targetingKey: <your-targeting-key>
```

### CLI Examples

#### Upsert Command

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

## Common errors and solutions

1. Invalid API key  
   - Solution: Verify that the provided `apiKey` is correct and active. You can regenerate it in the Split dashboard if needed.

2. Environment or workspace not found  
   - Solution: Ensure that the specified `workspace` and `environment` exist in your Split account. Use the Split dashboard to confirm their names.

3. Permission issues  
   - Solution: Verify that the API key has the necessary permissions to read, write, and modify feature flags in the target environment.

4. Rate limit exceeded  
   - Solution: If the API rate limit is exceeded, consider optimizing the frequency of API requests. Monitor Split’s rate limit policies in the [API documentation](https://help.split.io/hc/en-us/articles/360020218091-API-Rate-Limits).

## References

- Integration documentation: https://help.split.io/hc/en-us
