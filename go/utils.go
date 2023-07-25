package configu

import (
	"regexp"
	"strings"
)

type ConfiguError struct {
	Message    string
	Location   []string
	Suggestion string
}

func (err ConfiguError) Error() string {
	var location string
	if len(err.Location) > 0 {
		location = " at " + strings.Join(err.Location, " > ")
	}
	return strings.Join([]string{err.Message, location, err.Suggestion}, " ")
}

func IsValidName(name string) bool {
	namingPattern := "^[A-Za-z0-9_-]*$"
	reservedNames := [4]string{"_", "-", "this", "cfgu"}
	for _, reservedName := range reservedNames {
		if reservedName == name {
			return false
		}
	}
	match, _ := regexp.MatchString(namingPattern, name)
	return match
}
