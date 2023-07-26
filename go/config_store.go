package configu

type IConfigStore interface {
	Get(queries []ConfigStoreQuery) []Config
	Set(configs []Config)
	GetType() string
}
