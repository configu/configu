# @configu/localforage

Integrates the Configu Orchestrator with [LocalForage](https://localforage.github.io/localForage/), a fast and simple storage library for offline data, offering a unified API for IndexedDB, WebSQL, and localStorage.

- Name: LocalForage
- Category: Browser Key-Value store

## Configuration

The localForage store needs to be initialized with the [localForage configuration options](https://localforage.github.io/localForage/#settings-api-config).

## Usage

localForage only integrates with the browser hence it cannot be used with either `@configu/cli` or `@configu/proxy` and can only be used directly.

### Example SDK usage

```js
import { ConfigSet, ConfigSchema, UpsertCommand, EvalCommand, ExportCommand } from '@configu/sdk';
import { LocalForageConfigStore } from '@configu-integrations/localforage';

(async () => {
  try {
    const store = new LocalForageConfigStore({ name: 'example-db-name' });
    const set = new ConfigSet('test');
    const schema = new ConfigSchema(schemaContents);

    await new UpsertCommand({
      store,
      set,
      schema,
      configs: {
        GREETING: 'hey',
        SUBJECT: 'configu',
      },
    }).run();

    const { result: data } = await new EvalCommand({
      store,
      set,
      schema,
    }).run();

    const configurationData = await new ExportCommand({ pipe: data }).run();

    console.log(configurationData);
  } catch (error) {
    console.error(error);
  }
})();
```

## Common errors and solutions

1. Driver unsupported error
   - Solution: Verify that the selected driver (e.g., IndexedDB) is supported by the browser. If not, fallback to `localStorage` or `WebSQL`:
     ```yaml
     driver: LOCALSTORAGE
     ```

2. Storage quota exceeded
   - Solution: Reduce the amount of data stored, or prompt the user to free up space. IndexedDB generally provides more storage space than localStorage.

3. Version conflict
   - Solution: Ensure the `version` specified in the configuration matches the current database version. If changing schema, increment the version number.

4. Data persistence issues
   - Solution: Verify that the store name and driver configuration are correct. Use the browser's DevTools to inspect the storage.

## References

- Integration documentation: https://localforage.github.io/localForage/
