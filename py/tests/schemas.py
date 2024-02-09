import json
from enum import Enum


class DummySchemas(Enum):
    # Valid
    ValidBasic = "tests/staticfiles/config_schemas/valid/basic.cfgu.json"
    ValidComplex = "tests/staticfiles/config_schemas/valid/complex.cfgu.json"
    ValidJSONSchema = "tests/staticfiles/config_schemas/valid/jsonschema.cfgu.json"
    # Invalid
    InvalidJSONSchema = "tests/staticfiles/config_schemas/invalid/jsonschema.cfgu.json"
    InvalidEmpty = "tests/staticfiles/config_schemas/invalid/empty.cfgu.json"
    InvalidDefaultAndRequired = (
        "tests/staticfiles/config_schemas/invalid/default_and_required.cfgu.json"
    )
    InvalidDefaultAndTemplate = (
        "tests/staticfiles/config_schemas/invalid/default_and_template.cfgu.json"
    )
    InvalidInvalidDefault = (
        "tests/staticfiles/config_schemas/invalid/invalid_default.cfgu.json"
    )
    InvalidNoneExistentType = (
        "tests/staticfiles/config_schemas/invalid/nonexistent_type.cfgu.json"
    )
    InvalidRegexMissingPattern = (
        "tests/staticfiles/config_schemas/invalid/regex_missing_pattern.cfgu.json"
    )
    InvalidReservedNames = (
        "tests/staticfiles/config_schemas/invalid/reserved_names.cfgu.json"
    )


class DummyConfigSchema:
    name: str
    contents: dict

    def __init__(self, schema: DummySchemas):
        super().__init__()
        self.name = schema.name
        with open(schema.value) as f:
            self.contents = json.load(f)
