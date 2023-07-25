package core

import (
	"fmt"
	"os"
	osPath "path"
	"regexp"
	"strings"

	configu "github.com/configu/configu/go"

	"github.com/configu/configu/go/core/generated"

	"github.com/go-playground/validator/v10"
)

const (
	EXT string = ".cfgu"
)

type ConfigSchema generated.ConfigSchema

func NewConfigSchema(path string) (schema ConfigSchema, err error) {
	extensions := strings.Join([]string{
		fmt.Sprintf("%s.%s", EXT, generated.JSON),
	},
		" | ")
	pattern := fmt.Sprintf(".*(%s)", extensions)
	if match, _ := regexp.MatchString(pattern, path); !match {
		err = configu.ConfiguError{
			Message:    fmt.Sprintf("invalid path %s", path),
			Location:   []string{"core", "NewConfigSchema"},
			Suggestion: fmt.Sprintf("file extension must be %s", extensions),
		}
		return
	}
	schema = ConfigSchema{

		Path: path,
		Type: generated.ConfigSchemaType(osPath.Ext(path)),
	}
	return
}

func (schema ConfigSchema) Read() []byte {
	content, err := os.ReadFile(schema.Path)
	if err != nil {
		return []byte{}
	}
	return content
}

func (schema ConfigSchema) Parse() (cfgu generated.ConfigSchemaContents, err error) {
	content := schema.Read()
	schema_content, e := generated.UnmarshalConfigSchemaContents(content)
	if e != nil {
		err = configu.ConfiguError{
			Message: "Couldn't parse schema file",
		}
		return
	}
	for key, value := range schema_content {
		if !configu.IsValidName(key) {
			err = configu.ConfiguError{
				Message:    fmt.Sprintf("invalid key %s", key),
				Location:   []string{"core", "ConfigSchema", "Parse", key},
				Suggestion: fmt.Sprintf("path nodes mustn't contain reserved word %s", key),
			}
			return
		}
		if value.Type == generated.RegEx && value.Pattern == nil {
			err = configu.ConfiguError{
				Message:    "invalid type property",
				Location:   []string{"core", "ConfigSchema", "Parse", key, string(value.Type)},
				Suggestion: fmt.Sprintf("type %s must come with a pattern property", value.Type),
			}
			return
		}
		if value.Default != nil {
			if value.Required != nil || value.Template != nil {
				err = configu.ConfiguError{
					Message:    "invalid default property",
					Location:   []string{"core", "ConfigSchema", "Parse", key, "default"},
					Suggestion: "default mustn't set together with required or template properties",
				}
				return
			} else {
				if !ValidateCfguType(value, *value.Default) {
					err = configu.ConfiguError{
						Message:    "invalid default property",
						Location:   []string{"core", "ConfigSchema", "Parse", key, "default"},
						Suggestion: fmt.Sprintf("%v must be of type %v or match Regex", value.Default, value.Type),
					}
					return
				}
			}
		}
		if value.Depends != nil {
			if len(value.Depends) == 0 || anyInvalidDependencyNames(value) {
				err = configu.ConfiguError{
					Message:    "invalid depends property",
					Location:   []string{"core", "ConfigSchema", "Parse", key, "depends"},
					Suggestion: "depends is empty or contains reserved words",
				}
				return
			}
		}
	}
	cfgu = schema_content
	return
}

func anyInvalidDependencyNames(value generated.ConfigSchemaContentsValue) bool {
	for _, dependency := range value.Depends {
		if !configu.IsValidName(dependency) {
			return false
		}
	}
	return true
}

func ValidateCfguType(schema generated.ConfigSchemaContentsValue, value string) bool {
	switch schema.Type {
	case generated.Base64:
		return isValidBase64(value)
	case generated.Boolean:
		return isValidBoolean(value)
	case generated.Color:
		return isValidColor(value)
	case generated.ConnectionString:
		return isValidConnectionString(value)
	case generated.Country:
		return isValidCountry(value)
	case generated.Currency:
		return isValidCurrency(value)
	case generated.Domain:
		return isValidDomain(value)
	case generated.Email:
		return isValidEmail(value)
	case generated.Hex:
		return isValidHex(value)
	case generated.IPv4:
		return isValidIPv4(value)
	case generated.IPv6:
		return isValidIPv6(value)
	case generated.LatLong:
		return isValidLatLong(value)
	case generated.Md5:
		return isValidMd5(value)
	case generated.Number:
		return isValidNumber(value)
	case generated.RegEx:
		return isValidRegEx(value, *schema.Pattern)
	case generated.SHA:
		return isValidSHA(value)
	case generated.SemVer:
		return isValidSemVer(value)
	case generated.String:
		return isValidString(value)
	case generated.URL:
		return isValidURL(value)
	case generated.UUID:
		return isValidUUID(value)
	default:
		return false
	}
}

func isValidBase64(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,base64"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidBoolean(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,boolean"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidColor(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,iscolor"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidConnectionString(value string) bool {
	return regexp.MustCompile(`^(?:([^:/?#\s]+):/{2})?(?:([^@/?#\s]+)@)?([^/?#\s]+)?(?:/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$`).MatchString(value)
}

func isValidCountry(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,country_code"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidCurrency(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,iso4217"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidDomain(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,fqdn"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidEmail(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,email"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidHex(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,hexadecimal"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidIPv4(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,ipv4"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidIPv6(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,ipv6"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidLatLong(value string) bool {
	if !strings.Contains(value, ",") {
		return false
	}
	parts := strings.Split(value, ",")
	if len(parts) != 2 {
		return false
	}
	if strings.HasPrefix(parts[0], "(") && !strings.HasSuffix(parts[1], ")") {
		return false
	}
	if !strings.HasPrefix(parts[0], "(") && strings.HasSuffix(parts[1], ")") {
		return false
	}
	type MyStruct struct {
		Latitude  string `validate:"required,latitude"`
		Longitude string `validate:"required,longitude"`
	}
	return validator.New().Struct(MyStruct{parts[0], parts[1]}) == nil
}

func isValidMd5(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,md5"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidNumber(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,number"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidRegEx(value string, pattern string) bool {
	re, err := regexp.Compile(pattern)
	if err != nil {
		return false
	}
	return re.FindString(value) != ""
}

func isValidSHA(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,sha256"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidSemVer(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,semver"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidString(value string) bool {
	type MyStruct struct {
		Value string `validate:"required"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidURL(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,datauri"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}

func isValidUUID(value string) bool {
	type MyStruct struct {
		Value string `validate:"required,uuid"`
	}
	return validator.New().Struct(MyStruct{value}) == nil
}
