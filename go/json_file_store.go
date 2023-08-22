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

func (s JsonFileConfigStore) Read() ([]ConfigStoreContentsElement, error) {
	content, err := os.ReadFile(s.Path)
	if err != nil {
		return nil, err
	}
	res := make([]ConfigStoreContentsElement, 0)
	if json.Unmarshal(content, &res) != nil {
		return nil, err
	}
	return res, nil
}

func (s JsonFileConfigStore) Write(elements []ConfigStoreContentsElement) error {
	data, err := json.Marshal(elements)
	if err != nil {
		return err
	}
	return os.WriteFile(s.Path, data, 0644)
}

func (s JsonFileConfigStore) Get(queries []ConfigStoreQuery) ([]Config, error) {
	stored_configs, err := s.Read()
	if err != nil {
		return nil, err
	}
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
	return results, nil
}

func (s JsonFileConfigStore) Set(configs []Config) error {
	stored_configs, err := s.Read()
	if err != nil {
		return err
	}
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
	return s.Write(append(existing, config_store_elements...))
}

func (s JsonFileConfigStore) GetType() string {
	return "json"
}
