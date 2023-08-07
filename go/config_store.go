package configu

type IConfigStore interface {
	Get(queries []ConfigStoreQuery) ([]Config, error)
	Set(configs []Config) error
	GetType() string
}
