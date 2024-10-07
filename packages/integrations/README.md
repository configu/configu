# @configu/node

Configu SDK for Node.js published to [npm](https://www.npmjs.com/package/@configu/node).

## Install

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


# Integrations Package

## What is an Integration?

An integration in Configu allows you to connect and manage configuration data across various platforms, services, and tools. Integrations enable seamless configuration management, validation, and deployment, ensuring that your application configurations are consistent and secure.

## How to Use an Integration in the New CLI Syntax

To use an integration with the new CLI syntax, follow these steps:

1. **List Available Integrations**:
 ```sh
   configu integrations list
 ```
2. **Connect an Integration:**
  ```sh
  configu integrations connect <integration-name>
  ```
3. **Manage Integration Configurations:**
  ```sh
  configu integrations manage <integration-name> --action <action>
  ```
4. **Disconnect an Integration:**
  ```sh
  configu integrations disconnect <integration-name>
  ```

  ## How to Create a New Integration Package
To create a new integration package, follow these steps:


1.**Set Up Your Development Enviroment:** Ensure you have the necessary tools and dependencies installed.

2. **Create a New Integration Directory:**
```sh
mkdir -p packages/integrations/<integration-name>
cd packages/integrations/<integration-name>
```
3.**Implement the Integration:**
- Create the necessary files and implement the integration logic.
- Follow the existing integration structure and conventions.

4.**Write Tests:** 
Ensure your integration is thoroughly tested.

5. **Update Documentation:**  Add documentation for your integration, including usage examples and configuration options.

6.**Deploy the Integration:**
- Ensure your integration is properly versioned.
- Publish the integration package.


## Where Do Those Integrations Deploy?


Integrations are deployed as part of the Configu ecosystem. They can be used in various environments, including:

- **Local Development:** Manage configurations on your local machine.

- **CI/CD Pipelines:** Integrate with CI/CD tools to manage configurations during the build and deployment process.


- **Cloud Environments:** Deploy configurations to cloud services and platforms.


- **Containerized Environments:** Manage configurations within containerized applications.

---
