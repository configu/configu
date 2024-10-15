# @configu/node

Configu SDK for Node.js published to [npm](https://www.npmjs.com/package/@configu/node).


# Integrations Package

## What is an Integration?

An integration in Configu is a module that allows Configu to interact with external systems, services, or tools. Integrations enable seamless management and collaboration on software configuration data across various environments and systems. They provide a standardized way to connect Configu with other platforms, ensuring consistent and efficient configuration operations.

## How to Use an Integration in the New CLI Syntax

Using an integration in the new CLI syntax is straightforward. Here is an example of how to use an integration:

```sh
configu integration <integration-name> <command> [options]
```

For example, to use the AWS SSM integration to fetch configuration data, you can use the following command:

```sh
configu integration aws-ssm fetch --path /my/config/path
```

## How to Create a New Integration Package

Creating a new integration package involves the following steps:

1. **Set Up the Project**: Create a new directory for your integration package and set up the necessary files.
2. **Define the Integration**: Implement the integration logic by creating the necessary classes and methods.
3. **Register the Integration**: Register your integration with Configu so that it can be used via the CLI.
4. **Test the Integration**: Write tests to ensure that your integration works as expected.
5. **Document the Integration**: Provide documentation on how to use your integration.

Here is an example structure for a new integration package:

```
my-integration/
├── __init__.py
├── integration.py
├── cli.py
├── tests/
│   └── test_integration.py
└── README.md
```

## Where Do Those Integrations Deploy?

Integrations are deployed as part of the Configu ecosystem. They can be installed and used via the Configu CLI. When you create a new integration, you can publish it to the Configu registry or any other package registry that Configu supports. This allows other users to easily install and use your integration.

To deploy an integration, you can use the following command:

```sh
configu integration deploy <integration-name>
```

This command will package your integration and publish it to the specified registry.




## Installation

```bash
npm install @configu/node
yarn add @configu/node
pnpm add @configu/node
```

## Usage

**With import / require:**

```js
import { JsonFileConfigStore, ConfigSet, ConfigSchema, UpsertCommand, EvalCommand, ExportCommand } from '@configu/node';
import schemaContents from './start.cfgu.json';

(async () => {
  try {
    const store = new JsonFileConfigStore({ path: 'config-db.json' });
    const set = new ConfigSet('test');
    const schema = new ConfigSchema('start', schemaContents);

    await new UpsertCommand({
      store,
      set,
      schema,
      configs: {
        GREETING: 'hey',
        SUBJECT: 'configu node.js sdk',
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

**With fs & path**:

```js
import path from 'path';
import fs from 'fs/promises';
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

    const schemaContentsString = await fs.readFile(path.join(__dirname, 'start.cfgu.json'));
    const schemaContents = JSON.parse(schemaContentsString);
    const schema = new ConfigSchema('start', schemaContents);

    ...
  } catch (error) {
    console.error(error);
  }
})();
```



<!-- For more examples see [examples/node](https://github.com/configu/configu/tree/main/examples/node-sdk/) -->

## Reference

See [interfaces/sdk/node/globals](https://docs.configu.com/interfaces/sdk/node/globals).

## Contributing

### Requirements

Follow the [Development](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#development) section from the `CONTRIBUTING.md`.

### Setup

Run these commands in order:

```bash
pnpm install
```

### Contribute

Follow the [Sending a Pull Request](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#sending-a-pull-request) section from the `CONTRIBUTING.md`.
