package core

import "github.com/configu/configu/go/core/generated"

type ConfigStore interface {
	Get(queries []generated.ConfigStoreQuery) []generated.Config
	Set(configs []generated.Config)
	GetType() string
}
