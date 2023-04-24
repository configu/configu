# @configu/py

> configu python sdk

## Install

```bash
pip install configu
```

## Usage
See example in the examples folder

## CONTRIBUTING

### Requirements

1. Follow the instructions on the main [CONTRIBUTING.md](https://github.com/configu/configu/blob/main/CONTRIBUTING.md)
   to set up node and npm. This is necessary for lint-staged workflow.
2. Install [pyenv](https://github.com/pyenv/pyenv) | [Homebrew](https://formulae.brew.sh/formula/pyenv)
3. Install [poetry](https://python-poetry.org/) | [Homebrew](https://formulae.brew.sh/formula/poetry)

### Setup

#### Run these commands in order

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
