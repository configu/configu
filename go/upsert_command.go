package configu

import (
	"fmt"
)

type UpsertCommand struct {
	Store   IConfigStore
	Set     ConfigSet
	Schema  ConfigSchema
	Configs map[string]string
}

func (c UpsertCommand) Run() (interface{}, error) {
	schema_content, err := c.Schema.Parse()
	if err != nil {
		return nil, err
	}
	upsert_configs := make([]Config, 0)
	for key, value := range c.Configs {
		cfgu, ok := schema_content[key]
		if !ok {
			return nil, ConfiguError{
				Message:    fmt.Sprintf("Invalid config key '%s'", key),
				Location:   []string{"UpsertCommand", "Run"},
				Suggestion: fmt.Sprintf("key '%s' must be declared on schema %s", key, c.Schema.Path),
			}
		}
		if value != "" && cfgu.Template != nil {
			return nil, ConfiguError{
				Message:    fmt.Sprintf("Invalid assignment to config key '%s'", key),
				Location:   []string{"UpsertCommand", "Run"},
				Suggestion: "keys declared with template mustn't have a value",
			}
		}
		if value != "" && !validateCfguType(cfgu, value) {
			return nil, ConfiguError{
				Message:    fmt.Sprintf("Invalid config value '%s' for config key '%s'", value, key),
				Location:   []string{"UpsertCommand", "Run"},
				Suggestion: fmt.Sprintf("value '%s' must be of type '%s'", value, cfgu.Type),
			}
		}

		upsert_configs = append(upsert_configs, Config{
			Set:   c.Set.Path,
			Key:   key,
			Value: value,
		})
	}
	return nil, c.Store.Set(upsert_configs)
}
