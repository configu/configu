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
test_set = configu.ConfigSet("test")
schema = configu.ConfigSchema("get-started.cfgu.json")

configu.UpsertCommand(
  store=config_store,
  set=test_set,
  schema=schema,
  configs={
    "GREETING": "hello",
    "SUBJECT": "configu python sdk",
  },
).run()

data = configu.EvalCommand(
  store=config_store, set=test_set, schema=schema
).run()

configuration_data = configu.ExportCommand(data=data).run()

print(os.environ["MESSAGE"])
# hey, configu python sdk!
print(configuration_data)
# {'GREETING': 'hey', 'SUBJECT': 'configu python sdk', 'MESSAGE': 'hey, configu python sdk!'}
```

## Reference

See [oss.configu.com/py](https://oss.configu.com/py/configu.html)

## Contributing

### Requirements

1. Follow the [Development](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#development) section from the `CONTRIBUTING.md`.
2. Install [pyenv](https://github.com/pyenv/pyenv) | [Homebrew](https://formulae.brew.sh/formula/pyenv)
3. Install [poetry](https://python-poetry.org/) | [Homebrew](https://formulae.brew.sh/formula/poetry)

### Setup

Run these commands in order:

```bash
cd py
```

```bash
pyenv install
```

```bash
pyenv local 3.9.16
```

```bash
poetry env use $(pyenv which python)
```

```bash
poetry install
```

### Contribute

Follow the [Sending a Pull Request](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#sending-a-pull-request) section from the `CONTRIBUTING.md`.
