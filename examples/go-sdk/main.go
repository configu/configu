package main

import (
	"fmt"

	configu "github.com/configu/configu/go"
)

func main() {
	store := configu.InMemoryStore{}
	set, _ := configu.NewConfigSet("test")
	schema, _ := configu.NewConfigSchema("get-started.cfgu.json")
	configu.UpsertCommand{
		Store:   &store,
		Set:     set,
		Schema:  schema,
		Configs: map[string]string{"GREETING": "hey", "SUBJECT": "go python SDK"},
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
