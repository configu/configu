package core

import (
	"fmt"
	"strings"

	configu "github.com/configu/configu/go"

	"github.com/configu/configu/go/core/generated"
)

const (
	SEPARATOR  string = "/"
	ROOT       string = ""
	ROOT_LABEL string = "/"
)

type ConfigSet generated.ConfigSet

func NewConfigSet(path string) (set ConfigSet, err error) {
	if path == "" {
		path = ROOT
	}
	hierarchy := []string{ROOT}
	path = strings.TrimPrefix(path, ROOT_LABEL)
	if strings.HasSuffix(path, SEPARATOR) {
		err = configu.ConfiguError{
			Message:    fmt.Sprintf("invalid path %v", path),
			Location:   []string{"core", "NewConfigSet"},
			Suggestion: fmt.Sprintf("path mustn't end with %v character", SEPARATOR),
		}
		return
	}
	for i, step := range strings.Split(path, SEPARATOR) {
		if !configu.IsValidName(step) {
			err = configu.ConfiguError{
				Message:    fmt.Sprintf("invalid path %v", path),
				Location:   []string{"core", "NewConfigSet"},
				Suggestion: "path is not valid or using reserved name",
			}
			return
		}
		if step != ROOT {
			steps := []string{step}
			if i > 0 {
				steps = []string{hierarchy[len(hierarchy)-1], step}
			}
			hierarchy = append(hierarchy, strings.Join(steps, SEPARATOR))
		}
	}
	set = ConfigSet{
		Hierarchy: hierarchy,
		Path:      path,
	}
	return
}
