package configu

type Command[T any] interface {
	Run() (T, error)
}
