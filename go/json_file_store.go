package configu

import (
	"encoding/json"
	"fmt"
	"os"

	"golang.org/x/exp/slices"
)

type JsonFileConfigStore struct {
	Path string
}

func (s JsonFileConfigStore) Read() []ConfigStoreContentsElement {
	content, _ := os.ReadFile(s.Path)
	res := make([]ConfigStoreContentsElement, 0)
	json.Unmarshal(content, &res)
	return res
}

func (s JsonFileConfigStore) Write(elements []ConfigStoreContentsElement) {
	data, _ := json.Marshal(elements)
	os.WriteFile(s.Path, data, 0644)
}

func (s JsonFileConfigStore) Get(queries []ConfigStoreQuery) []Config {
	stored_configs := s.Read()
	query_ids := make([]string, len(queries))
	for i, query := range queries {
		query_ids[i] = fmt.Sprintf("%s.%s", query.Set, query.Key)
	}
	results := make([]Config, 0)
	for _, d := range stored_configs {
		if slices.Contains(query_ids, fmt.Sprintf("%s.%s", d.Set, d.Key)) {
			results = append(results, Config(d))
		}
	}
	return results
}

func (s JsonFileConfigStore) Set(configs []Config) {
	stored_configs := s.Read()
	set_config_ids := make([]string, len(configs))
	for i, d := range stored_configs {
		set_config_ids[i] = fmt.Sprintf("%s.%s", d.Set, d.Key)
	}
	existing := make([]ConfigStoreContentsElement, 0)
	for _, d := range stored_configs {
		if !slices.Contains(set_config_ids, fmt.Sprintf("%s.%s", d.Set, d.Key)) {
			existing = append(existing, d)
		}
	}
	config_store_elements := make([]ConfigStoreContentsElement, 0)
	for _, d := range configs {
		config_store_elements = append(config_store_elements, ConfigStoreContentsElement(d))
	}
	s.Write(append(existing, config_store_elements...))
}

func (s JsonFileConfigStore) GetType() string {
	return "json"
}
