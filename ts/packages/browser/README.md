# @configu/browser

Configu SDK for the Browser

## Install

To install the this package, simply type add or install [@configu/browser](https://www.npmjs.com/package/@configu/browser) using your favorite package manager:

```bash
npm install @configu/browser
yarn add @configu/browser
pnpm add @configu/browser
```

Or include it in your main html as a script tag:

```html
<script src="https://unpkg.com/@configu/browser/dist/configu.min.js" charset="utf-8"></script>
```

## Usage

```js
import {
  LocalForageConfigStore,
  ConfigSet,
  ConfigSchema,
  UpsertCommand,
  EvalCommand,
  ExportCommand,
} from '@configu/browser';

(async () => {
  try {
    const store = new LocalForageConfigStore({ name: 'config-db' });
    const set = new ConfigSet('test');
    const schema = await ConfigSchema.init(); // pick get-started.cfgu.json

    await new UpsertCommand({
      store,
      set,
      schema,
      configs: {
        'GREETING': 'hey',
        'SUBJECT': 'configu browser sdk'
      },
    }).run();

    const data = await new EvalCommand({
      store,
      set,
      schema,
    }).run();

    const configurationData = await new ExportCommand({
      data,
    }).run();
  } catch (error) {
    console.error(error);
  }
})();
```

<!-- For more examples see [examples/browser](https://github.com/configu/configu/tree/main/examples/browser-sdk/) -->

## Reference

See [oss.configu.com/browser](https://oss.configu.com/ts/modules/_configu_browser.html)

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
