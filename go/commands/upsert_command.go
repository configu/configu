package commands

import (
	"fmt"

	configu "github.com/configu/configu/go"
	"github.com/configu/configu/go/core"
	"github.com/configu/configu/go/core/generated"
)

type UpsertCommand struct {
	Store   core.ConfigStore
	Set     core.ConfigSet
	Schema  core.ConfigSchema
	Configs map[string]string
}

func (c UpsertCommand) Run() (interface{}, error) {
	schema_content, _ := c.Schema.Parse()
	upsert_configs := make([]generated.Config, 0)
	for key, value := range c.Configs {
		cfgu, ok := schema_content[key]
		if !ok {
			return nil, configu.ConfiguError{
				Message:    fmt.Sprintf("Invalid config key '%s'", key),
				Location:   []string{"UpsertCommand", "Run"},
				Suggestion: fmt.Sprintf("key '%s' must be declared on schema %s", key, c.Schema.Path),
			}
		}
		if value != "" && cfgu.Template != nil {
			return nil, configu.ConfiguError{
				Message:    fmt.Sprintf("Invalid assignment to config key '%s'", key),
				Location:   []string{"UpsertCommand", "Run"},
				Suggestion: "keys declared with template mustn't have a value",
			}
		}
		if value != "" && !core.ValidateCfguType(cfgu, value) {
			return nil, configu.ConfiguError{
				Message:    fmt.Sprintf("Invalid config value '%s' for config key '%s'", value, key),
				Location:   []string{"UpsertCommand", "Run"},
				Suggestion: fmt.Sprintf("value '%s' must be of type '%s'", value, cfgu.Type),
			}
		}

		upsert_configs = append(upsert_configs, generated.Config{
			Set:   c.Set.Path,
			Key:   key,
			Value: value,
		})
	}
	c.Store.Set(upsert_configs)
	return nil, nil
}
