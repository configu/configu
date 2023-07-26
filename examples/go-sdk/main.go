package main

import (
	"fmt"

	"github.com/configu/configu/go/commands"
	"github.com/configu/configu/go/core"
	"github.com/configu/configu/go/stores"
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
