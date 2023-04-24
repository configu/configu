package main

import (
  "fmt"
  "os"
)

func main() {
  fmt.Println("=== go ===")
  fmt.Println(os.Getenv("MESSAGE"))
}
