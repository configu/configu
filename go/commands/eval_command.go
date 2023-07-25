package commands

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	configu "github.com/configu/configu/go"
	"github.com/configu/configu/go/core"
	"github.com/configu/configu/go/core/generated"

	"github.com/hoisie/mustache"
	"golang.org/x/exp/slices"
)

type EvaluatedConfigOrigin string

const (
	ConfigsOverride EvaluatedConfigOrigin = "CONFIGS_OVERRIDE"
	StoreSet        EvaluatedConfigOrigin = "STORE_SET"
	SchemaTemplate  EvaluatedConfigOrigin = "SCHEMA_TEMPLATE"
	SchemaDefault   EvaluatedConfigOrigin = "SCHEMA_DEFAULT"
	EmptyValue      EvaluatedConfigOrigin = "EMPTY_VALUE"
)

type EvalCommandReturnContext struct {
	Store  string
	Set    string
	Schema string
	Key    string
	Cfgu   generated.ConfigSchemaContentsValue
}

type EvalCommandReturnResult struct {
	Origin EvaluatedConfigOrigin
	Source string
	Value  string
}

type EvalCommandReturn map[string]*EvalCommandReturnValue

type EvalCommandReturnValue struct {
	Context EvalCommandReturnContext
	Result  EvalCommandReturnResult
}

type EvalCommand struct {
	Store    core.ConfigStore
	Set      core.ConfigSet
	Schema   core.ConfigSchema
	Configs  map[string]string
	Validate *bool
	Previous *EvalCommandReturn
}

func (c EvalCommand) Run() (interface{}, error) {
	schema_contents, _ := c.Schema.Parse()
	result := make(EvalCommandReturn, 0)
	for key, cfgu := range schema_contents {
		result[key] = &EvalCommandReturnValue{
			Context: EvalCommandReturnContext{
				Store:  c.Store.GetType(),
				Set:    c.Set.Path,
				Schema: c.Schema.Path,
				Key:    key,
				Cfgu:   cfgu,
			},
			Result: EvalCommandReturnResult{
				Origin: EmptyValue,
			},
		}
	}
	result = c.evalFromConfigsOverride(result)
	result = c.evalFromStoreSet(result)
	result = c.evalFromSchema(result)
	result = c.evalPrevious(result)
	result = c.evalTemplates(result)
	err := c.validateResult(result)
	return result, err
}

func (c EvalCommand) evalFromConfigsOverride(result EvalCommandReturn) EvalCommandReturn {
	if len(c.Configs) == 0 {
		return result
	}
	for key, value := range result {
		override_value, ok := c.Configs[key]
		if !ok {
			continue
		}
		value.Result.Origin = ConfigsOverride
		value.Result.Source = fmt.Sprintf("parameters.configs.%s=%s", key, override_value)
		value.Result.Value = override_value
	}
	return result
}

func (c EvalCommand) evalFromStoreSet(result EvalCommandReturn) EvalCommandReturn {
	store_queries := make([]generated.ConfigStoreQuery, 0)
	for key := range result {
		for _, store_set := range c.Set.Hierarchy {
			store_queries = append(store_queries, generated.ConfigStoreQuery{Key: key, Set: store_set})
		}
	}
	store_configs := make(map[string]generated.Config)
	store_results := c.Store.Get(store_queries)
	sort.Slice(store_results, func(i, j int) bool {
		return len(strings.Split(store_results[i].Set, core.SEPARATOR)) < len(strings.Split(store_results[j].Set, core.SEPARATOR))
	})
	for _, v := range store_results {
		store_configs[v.Key] = v
	}
	for key, value := range result {
		store_config, ok := store_configs[key]
		if ok {
			value.Result.Origin = StoreSet
			value.Result.Source = fmt.Sprintf("parameters.store=$%s,parameters.set=$%s", value.Context.Store, value.Context.Set)
			value.Result.Value = store_config.Value
		}
	}
	return result
}

func (c EvalCommand) evalFromSchema(result EvalCommandReturn) EvalCommandReturn {
	for _, value := range result {
		if value.Context.Cfgu.Template != nil {
			value.Result.Origin = SchemaTemplate
			value.Result.Source = fmt.Sprintf("parameters.schema=$%s.template=$%s", value.Context.Schema, *value.Context.Cfgu.Template)
			value.Result.Value = ""
		}
		if value.Context.Cfgu.Default != nil {
			value.Result.Origin = SchemaDefault
			value.Result.Source = fmt.Sprintf("parameters.schema=$%s.default=$%s", value.Context.Schema, *value.Context.Cfgu.Default)
			value.Result.Value = *value.Context.Cfgu.Default
		}
	}
	return result
}

func (c EvalCommand) evalPrevious(result EvalCommandReturn) EvalCommandReturn {
	if c.Previous == nil {
		return result
	}
	merged_keys := make([]string, 0)
	for key := range result {
		merged_keys = append(merged_keys, key)
	}
	for key := range *c.Previous {
		if !slices.Contains(merged_keys, key) {
			merged_keys = append(merged_keys, key)
		}
	}
	merged_result := make(EvalCommandReturn, 0)
	for _, key := range merged_keys {
		current_value, current_ok := result[key]
		previous_value, previous_ok := (*c.Previous)[key]
		if !current_ok {
			merged_result[key] = previous_value
		} else if !previous_ok {
			merged_result[key] = current_value
		} else if previous_value.Result.Origin != EmptyValue && current_value.Result.Origin == EmptyValue {
			merged_result[key] = previous_value
		} else {
			merged_result[key] = current_value
		}
	}
	return merged_result
}

func (c EvalCommand) evalTemplates(result EvalCommandReturn) EvalCommandReturn {
	template_keys := make([]string, 0)
	for key, value := range result {
		if value.Result.Origin == SchemaTemplate {
			template_keys = append(template_keys, key)
		}
	}
	should_render_templates := true
	for len(template_keys) > 0 && should_render_templates {
		has_rendered_at_least_once := false
	Loop:
		for _, key := range template_keys {
			expressions := GrabMustacheTemplateVars(*result[key].Context.Cfgu.Template)
			for _, exp := range expressions {
				if slices.Contains(template_keys, exp) {
					continue Loop
				}
			}
			context_config_set, _ := core.NewConfigSet(result[key].Context.Set)
			render_context := make(map[string]interface{})
			for key, value := range result {
				render_context[key] = value.Result.Value
			}
			render_context["CONFIGU_STORE"] = map[string]interface{}{"type": result[key].Context.Store}
			render_context["CONFIGU_SET"] = map[string]interface{}{
				"path":      context_config_set.Path,
				"hierarchy": context_config_set.Hierarchy,
				"first":     context_config_set.Hierarchy[0],
				"last":      context_config_set.Hierarchy[len(context_config_set.Hierarchy)-1],
			}
			for index, path := range context_config_set.Hierarchy {
				render_context["CONFIGU_SET"].(map[string]interface{})[strconv.Itoa(index)] = path
			}
			render_context["CONFIGU_SCHEMA"] = map[string]interface{}{"path": result[key].Context.Schema}
			rendered_value := mustache.Render(*result[key].Context.Cfgu.Template, render_context)
			result[key].Result.Value = rendered_value
			template_keys = slices.DeleteFunc(template_keys, func(x string) bool { return x == key })
			has_rendered_at_least_once = true
		}
		should_render_templates = has_rendered_at_least_once
	}
	return result
}

func (c EvalCommand) validateResult(result EvalCommandReturn) error {
	// TODO: implement
	if c.Validate == nil || !*c.Validate {
		return nil
	}
	for key, value := range result {
		if !core.ValidateCfguType(value.Context.Cfgu, value.Result.Value) {
			return configu.ConfiguError{
				Message:    fmt.Sprintf("invalid value type for key %s", key),
				Location:   []string{"EvalCommand", "Run"},
				Suggestion: fmt.Sprintf("Value %s must be a %s", value.Result.Value, value.Context.Cfgu.Type),
			}
		}
		if value.Context.Cfgu.Required != nil && *value.Context.Cfgu.Required && value.Result.Value == "" {
			return configu.ConfiguError{
				Message:  fmt.Sprintf("required key '%s' is missing a value", key),
				Location: []string{"EvalCommand", "Run"},
			}
		}
		if value.Result.Value != "" && len(value.Context.Cfgu.Depends) > 0 {
			for _, dep := range value.Context.Cfgu.Depends {
				if _, ok := result[dep]; !ok || result[dep].Result.Value == "" {
					return configu.ConfiguError{
						Message:  fmt.Sprintf("one or more depends of key '%s is missing a value", key),
						Location: []string{"EvalCommand", "Run"},
					}
				}
			}
		}
	}
	return nil
}

func GrabMustacheTemplateVars(template string) []string {
	var template_ string
	template_ = template
	found_vars := make([]string, 0)
	for {
		_, template, found := strings.Cut(template_, "{{")
		template_ = template
		if !found {
			// No more templates started
			break
		}
		current_tag_invalid := slices.Contains([]string{"{", "!", "#", "^", "/", ">", "=", "&"}, string(template[0]))
		current_tag, template, found := strings.Cut(template, "}}")
		template_ = template
		if current_tag_invalid {
			// Invalid escape sequence, skip the current one.
			continue
		}
		if !found {
			// Unterminated template sequence
			continue
		}
		found_vars = append(found_vars, strings.TrimSpace(current_tag))
	}
	return found_vars
}
