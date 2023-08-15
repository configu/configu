package configu

import (
	"fmt"

	"golang.org/x/exp/slices"
)

type InMemoryStore struct {
	data []Config
}

func (s *InMemoryStore) Get(queries []ConfigStoreQuery) ([]Config, error) {
	query_ids := make([]string, len(queries))
	for i, query := range queries {
		query_ids[i] = fmt.Sprintf("%s.%s", query.Set, query.Key)
	}
	results := make([]Config, 0)
	for _, d := range s.data {
		if slices.Contains(query_ids, fmt.Sprintf("%s.%s", d.Set, d.Key)) {
			results = append(results, d)
		}
	}
	return results, nil
}

func (s *InMemoryStore) Set(configs []Config) error {
	set_config_ids := make([]string, len(configs))
	for i, d := range s.data {
		set_config_ids[i] = fmt.Sprintf("%s.%s", d.Set, d.Key)
	}
	existing := make([]Config, 0)
	for _, d := range s.data {
		if !slices.Contains(set_config_ids, fmt.Sprintf("%s.%s", d.Set, d.Key)) {
			existing = append(existing, d)
		}
	}
	s.data = append(existing, configs...)
	return nil
}

func (s *InMemoryStore) GetType() string {
	return "in-memory"
}
