package stores

import (
	"fmt"

	"github.com/configu/configu/go/core/generated"

	"golang.org/x/exp/slices"
)

type InMemoryStore struct {
	data []generated.Config
}

func (s InMemoryStore) Get(queries []generated.ConfigStoreQuery) []generated.Config {
	query_ids := make([]string, len(queries))
	for i, query := range queries {
		query_ids[i] = fmt.Sprintf("%s.%s", query.Set, query.Key)
	}
	results := make([]generated.Config, 0)
	for _, d := range s.data {
		if slices.Contains(query_ids, fmt.Sprintf("%s.%s", d.Set, d.Key)) {
			results = append(results, d)
		}
	}
	return results
}

func (s InMemoryStore) Set(configs []generated.Config) {
	set_config_ids := make([]string, len(configs))
	for i, d := range s.data {
		set_config_ids[i] = fmt.Sprintf(fmt.Sprintf("%s.%s", d.Set, d.Key))
	}
	existing := make([]generated.Config, 0)
	for _, d := range s.data {
		if !slices.Contains(set_config_ids, fmt.Sprintf("%s.%s", d.Set, d.Key)) {
			existing = append(existing, d)
		}
	}
	s.data = append(existing, configs...)
}

func (s InMemoryStore) GetType() string {
	return "in-memory"
}
