# @configu-integrations/key-config-store

Integrates the Configu Orchestrator with KeyConfigStore, a key-value storage solution for lightweight configuration management.

- Name: Key Config Store  
- Category: Key-Value Store  

## Configuration

KeyConfigStore provides a simple key-value mechanism for storing configurations. It requires a straightforward configuration setup with options such as storage type and connection parameters.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-key-store:
    type: key-config-store
    configuration:
      storageType: memory # Options: memory, file, redis
      filePath: ./config-store.json # Required if using 'file' storage type
      redisUrl: redis://localhost:6379 # Required if using 'redis' storage type
```

### CLI Examples

#### Upsert Command

```bash
configu upsert --store "my-key-store" --set "test" --schema "./start.cfgu.json" \
    -c "APP_MODE=production" \
    -c "MAX_CONNECTIONS=100"
```

#### Eval and Export Commands

```bash
configu eval --store "my-key-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common Errors and Solutions

1. Invalid Storage Type  
   - Solution: Ensure that the `storageType` is correctly specified. Available options are `memory`, `file`, or `redis`. Example:
     ```yaml
     storageType: memory
     ```

2. File Not Found (File Storage)  
   - Solution: If using file storage, ensure that the specified `filePath` is correct and accessible. Create the file if it doesn’t exist.

3. Redis Connection Failure  
   - Solution: Verify that the `redisUrl` is correct and the Redis server is running. You can test the connection using:
     ```bash
     redis-cli ping
     ```

4. Data Loss in Memory Storage  
   - Solution: Be aware that the `memory` storage type is non-persistent and resets when the process restarts. Use `file` or `redis` storage for persistence.

## References

- Redis Documentation: https://redis.io/docs  
- YAML Documentation: https://yaml.org/  
