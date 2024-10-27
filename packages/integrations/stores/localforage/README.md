# @configu-integrations/localforage-config-store

Integrates the Configu Orchestrator with [LocalForage](https://localforage.github.io/localForage/), a fast and simple storage library for offline data, offering a unified API for IndexedDB, WebSQL, and localStorage.

- Name: LocalForage Config Store  
- Category: Browser Storage  

## Configuration

Configu utilizes LocalForage to store configurations locally in the browser. This is useful for offline or client-side data persistence. You can specify the storage driver, database name, and version in the configuration.  

## Usage

### `.configu` store declaration

```yaml
stores:
  my-localforage-store:
    type: localforage
    configuration:
      driver: INDEXEDDB # Options: INDEXEDDB, WEBSQL, LOCALSTORAGE
      name: configu_store
      version: 1.0
      storeName: config_data
      description: "LocalForage store for Configu data"
```

### CLI Examples

#### Upsert Command

```bash
configu upsert --store "my-localforage-store" --set "test" --schema "./start.cfgu.json" \
    -c "THEME=dark" \
    -c "LANGUAGE=en"
```

#### Eval and Export Commands

```bash
configu eval --store "my-localforage-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common Errors and Solutions

1. Driver Unsupported Error  
   - Solution: Verify that the selected driver (e.g., IndexedDB) is supported by the browser. If not, fallback to `localStorage` or `WebSQL`:
     ```yaml
     driver: LOCALSTORAGE
     ```

2. Storage Quota Exceeded  
   - Solution: Reduce the amount of data stored, or prompt the user to free up space. IndexedDB generally provides more storage space than localStorage.

3. Version Conflict  
   - Solution: Ensure the `version` specified in the configuration matches the current database version. If changing schema, increment the version number.

4. Data Persistence Issues  
   - Solution: Verify that the store name and driver configuration are correct. Use the browser's DevTools to inspect the storage.

## References

- Integration documentation: https://localforage.github.io/localForage/  
- API Documentation: https://localforage.github.io/localForage/#api-reference

