# @configu/py

Configu SDK for Python

## Install

To install the this package, simply type install [configu](https://pypi.org/project/configu/) using pip:

```bash
pip install configu
```

## Usage

```py
import configu

store = configu.InMemoryStore()
set = configu.ConfigSet("test")
schema = configu.ConfigSchema("get-started.cfgu.json")

UpsertCommand({
  store,
  set,
  schema,
  configs: {
    'GREETING': 'hey',
    'SUBJECT': 'configu python sdk'
  },
}).run()

data = EvalCommand({
  store,
  set,
  schema,
}).run()

configurationData = ExportCommand({
  data,
}).run()
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
