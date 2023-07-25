package core

type Command[T any] interface {
	Run() T
}
