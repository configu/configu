# @configu-integrations/split-config-store

Integrates the Configu Orchestrator with [Split](https://help.split.io/hc/en-us), a feature flag and experimentation platform.  

- Name: Split Config Store  
- Category: Feature Management  

---

## Configuration

Configu connects to the Split API to manage feature flags and configurations. You need to provide your API key and the Split workspace environment details for proper access. The API key should have sufficient permissions to read and modify configurations.  

## Usage

### `.configu` store declaration

```yaml
stores:
  my-split-store:
    type: split
    configuration:
      apiKey: <your-split-api-key>
      environment: production
      workspace: my-workspace
```

---

### CLI Examples

#### Upsert Command

```bash
configu upsert --store "my-split-store" --set "test" --schema "./start.cfgu.json" \
    -c "NEW_FEATURE=true" \
    -c "EXPERIMENT_VARIANT=A"
```

#### Eval and Export Commands

```bash
configu eval --store "my-split-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common Errors and Solutions

1. Invalid API Key  
   - Solution: Verify that the provided `apiKey` is correct and active. You can regenerate it in the Split dashboard if needed.

2. Environment or Workspace Not Found  
   - Solution: Ensure that the specified `workspace` and `environment` exist in your Split account. Use the Split dashboard to confirm their names.

3. Permission Issues  
   - Solution: Verify that the API key has the necessary permissions to read, write, and modify feature flags in the target environment.

4. Rate Limit Exceeded  
   - Solution: If the API rate limit is exceeded, consider optimizing the frequency of API requests. Monitor Split’s rate limit policies in the [API documentation](https://help.split.io/hc/en-us/articles/360020218091-API-Rate-Limits).

## References

- Integration documentation: https://help.split.io/hc/en-us
- API documentation: https://api.split.io/
