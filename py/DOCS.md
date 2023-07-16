# @configu/py

Configu SDK for Python

## Install

To install the this package, simply type install [configu](https://pypi.org/project/configu/) using pip:

```bash
pip install configu
```

## Usage

```py
import os

import configu

config_store = configu.InMemoryConfigStore()
dev_set = configu.ConfigSet("Development")
schema = configu.ConfigSchema("get-started.cfgu.json")

configu.UpsertCommand(
  store=config_store,
  set=dev_set,
  schema=schema,
  configs={
    "GREETING": "hello",
    "SUBJECT": "configu python sdk",
  }
).run()

data = configu.EvalCommand(store=config_store, set=dev_set, schema=schema).run()
configuration_data = configu.ExportCommand(data=data).run()

print(os.environ["MESSAGE"])
# hey, configu python sdk!

print(configuration_data)
# {'GREETING': 'hey', 'SUBJECT': 'configu python sdk', 'MESSAGE': 'hey, configu python sdk!'}
```

# Core

### [TBD] Description

- Config - `configu.core.Config`
- ConfigSchema - `configu.core.ConfigSchema`
- ConfigSet - `configu.core.ConfigSet`
- ConfigStoreQuery - `configu.core.ConfigStoreQuery`

# Stores

### [TBD] Description

- ConfiguConfigStore - `configu.stores.ConfiguConfigStore`
- AWSSecretsManagerConfigStore - `configu.stores.AWSSecretsManagerConfigStore`
- AzureKeyVaultConfigStore - `configu.stores.AzureKeyVaultConfigStore`
- GCPSecretManagerConfigStore - `configu.stores.GCPSecretManagerConfigStore`
- HashicorpVaultConfigStore - `configu.stores.HashicorpVaultConfigStore`
- InMemoryConfigStore - `configu.stores.InMemoryConfigStore`
- JsonFileConfigStore - `configu.stores.JsonFileConfigStore`
- KubernetesSecretConfigStore - `configu.stores.KubernetesSecretConfigStore`

# Commands

### [TBD] Description

- UpsertCommand - `configu.commands.UpsertCommand`
- EvalCommand - `configu.commands.EvalCommand`
- ExportCommand - `configu.commands.ExportCommand`

