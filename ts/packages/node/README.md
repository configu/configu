# @configu/node

Configu SDK for Node.js

## Install

To install the this package, simply type add or install [@configu/node](https://www.npmjs.com/package/@configu/node) using your favorite package manager:

```bash
npm install @configu/node
yarn add @configu/node
pnpm add @configu/node
```

## Usage

```js
import path from 'path';
import {
  JsonFileConfigStore,
  ConfigSet,
  ConfigSchema,
  UpsertCommand,
  EvalCommand,
  ExportCommand,
} from '@configu/node';

(async () => {
  try {
    const store = new JsonFileConfigStore({ path: 'config-db.json' });
    const set = new ConfigSet('test');
    const schema = new ConfigSchema(path.join(__dirname, 'get-started.cfgu.json'));

    await new UpsertCommand({
      store,
      set,
      schema,
      configs: {
        'GREETING': 'hey',
        'SUBJECT': 'configu node.js sdk'
      },
    }).run();

    const data = await new EvalCommand({
      store,
      set,
      schema,
    }).run();

    const configurationData = await new ExportCommand({
      pipe: data,
    }).run();
  } catch (error) {
    console.error(error);
  }
})();
```

<!-- For more examples see [examples/node](https://github.com/configu/configu/tree/main/examples/node-sdk/) -->

## Reference

See [oss.configu.com/node](https://oss.configu.com/ts/modules/_configu_node.html)

## Contributing

### Requirements

1. Follow the [Development](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#development) section from the `CONTRIBUTING.md`.

### Setup

Run these commands in order:

```bash
cd ts
```

```bash
npm install
```

### Contribute

Follow the [Sending a Pull Request](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#sending-a-pull-request) section from the `CONTRIBUTING.md`.
