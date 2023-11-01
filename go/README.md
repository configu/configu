# @configu/go

Configu SDK for Go published to [GitHub](https://github.com/configu/configu/releases?q=go-&expanded=true).

## Install

```bash
go get github.com/configu/configu/go
```

## Usage

```go
package main

import (
	configu "github.com/configu/configu/go"
	"fmt"
)

func main() {
	store := configu.InMemoryStore{}
	set, _ := configu.NewConfigSet("test")
	schema, _ := configu.NewConfigSchema("get-started.cfgu.json")
	configu.UpsertCommand{
		Store:   &store,
		Set:     set,
		Schema:  schema,
		Configs: map[string]string{"GREETING": "hey", "SUBJECT": "configu go SDK"},
	}.Run()
	config, err := configu.EvalCommand{
		Store:  &store,
		Set:    set,
		Schema: schema,
	}.Run()
	if err != nil {
		panic(err)
	}
	fmt.Printf("%v\n", config)
}
```

<!-- todo: ## Reference

[//]: # Link here once we have a reference page. -->

## Contributing

### Requirements

Follow the [Development](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#development) section from the `CONTRIBUTING.md`.

### Setup

```bash
cd go
```

```bash
go install
```

### Contribute

Follow the [Sending a Pull Request](https://github.com/configu/configu/blob/main/CONTRIBUTING.md#sending-a-pull-request) section from the `CONTRIBUTING.md`.
