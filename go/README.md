# @configu/py

Configu SDK for Go

## Install

To install the this package, simply type install [configu](https://github.com/configu/configu) using `go get`:

```bash
go get github.com/configu/configu/go
```

## Usage

```go
package main

import (
	"configu/commands"
	"configu/core"
	"configu/stores"
	"fmt"
)

func main() {
	store := stores.InMemoryStore{}
	set, _ := core.NewConfigSet("test")
	schema, _ := core.NewConfigSchema("get-started.cfgu.json")
	commands.UpsertCommand{
		Store:   &store,
		Set:     set,
		Schema:  schema,
		Configs: map[string]string{"GREETING": "hey", "SUBJECT": "go python SDK"},
	}.Run()
	config, err := commands.EvalCommand{
		Store:  store,
		Set:    set,
		Schema: schema,
	}.Run()
	if err != nil {
		panic(err)
	}
	fmt.Printf("%v\n", config)
}
```

## Reference

[//]: # Link here once we have a reference page.

## Contributing

### Requirements

1. Follow the [Development](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#development) section from the `CONTRIBUTING.md`.

### Setup

Simply install Go and you'll be good to go

### Contribute

Follow the [Sending a Pull Request](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#sending-a-pull-request) section from the `CONTRIBUTING.md`.
