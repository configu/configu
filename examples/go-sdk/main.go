package main

import (
	"fmt"

	configu "github.com/configu/configu/go"
)

func main() {
	store := configu.InMemoryStore{}
	set, err := configu.NewConfigSet("test")
	if err != nil {
		panic(err)
	}
	schema, err := configu.NewConfigSchema("get-started.cfgu.json")
	_, err = configu.UpsertCommand{
		Store:   &store,
		Set:     set,
		Schema:  schema,
		Configs: map[string]string{"GREETING": "hey", "SUBJECT": "configu go SDK"},
	}.Run()
	if err != nil {
		panic(err)
	}
	if err != nil {
		panic(err)
	}
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
