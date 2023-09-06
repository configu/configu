from configu import ConfigSchema
from configu.core.config_schema import ConfigSchemaDefinition
import pytest

@pytest.mark.parametrize("path", (
  "tests/staticfiles/config_schemas/valid/empty.cfgu.json",
  "tests/staticfiles/config_schemas/valid/basic.cfgu.json",
  "tests/staticfiles/config_schemas/valid/complex.cfgu.json",
))
def test_valid_config_schemas(path):
    ConfigSchema.parse(ConfigSchema(path))

@pytest.mark.parametrize("path", (
    "tests/staticfiles/config_schemas/invalid/regex_missing_pattern.cfgu.json",
    "tests/staticfiles/config_schemas/invalid/reserved_names.cfgu.json",
    "tests/staticfiles/config_schemas/invalid/default_and_required.cfgu.json",
    "tests/staticfiles/config_schemas/invalid/default_and_template.cfgu.json",
    "tests/staticfiles/config_schemas/invalid/nonexistent_type.cfgu.json",
    "tests/staticfiles/config_schemas/invalid/invalid_default.cfgu.json",
))
def test_invalid_config_schemas(path):
    with pytest.raises(ValueError):
        ConfigSchema.parse(ConfigSchema(path))

@pytest.mark.parametrize("path", (
    "tests/staticfiles/config_schemas/invalid/bad_extension.json",
    "tests/staticfiles/config_schemas/invalid/bad_file_type.txt",
))
def test_invalid_extension(path):
    with pytest.raises(ValueError):
      ConfigSchema(path)

@pytest.mark.parametrize("validator,value,expected", (
  ("Boolean", "True", True),
  ("Boolean", "Foo", False),
  ("Number", "3.14159", True),
  ("Number", "asd", False),
  ("String", "Hello", True),
  ("UUID", "0d3d45c8-11da-4730-8e90-30c2e04d51ec", True),
  ("UUID", "Foo", False),
  ("SemVer", "3.2.2", True),
  ("SemVer", "not.a.semver", False),
  ("Email", "test@example.com", True),
  ("Email", "not-an-email", False),
  ("MobilePhone", "+1 (200) 200 0000", True),
  ("MobilePhone", "not-a-mobile-number", False),
  ("LatLong", "22.2636563,-49.1842674", True),
  ("LatLong", "not-a-lat-long", False),
  ("Color", "ffffff", True),
  ("Color", "not-a-color", False),
  ("IPv4", "192.168.0.0", True),
  ("IPv4", "not-an-ipv4", False),
  ("IPv6", "0000:0000:0000:0000:0000:0000:0000:0001", True),
  ("IPv6", "not-an-ipv6", False),
  ("Domain", "example.com", True),
  ("Domain", "not-a-domain", False),
  ("URL", "https://example.com", True),
  ("URL", "not-a-url", False),
  ("ConnectionString", "user@service/path?opts", True),
  # ("ConnectionString", "", False), # TODO: Find an invalid connection string
  ("Hex", "a3ff4", True),
  ("Hex", "not-a-hex", False),
  ("Base64", "aGVsbG8K", True),
  ("Base64", "not-base64-encoded", False),
  ("MD5", "5d41402abc4b2a76b9719d911017c592", True),
  ("MD5", "not-an-md5-hash", False),
  ("SHA", "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d", True),
  ("SHA", "not-a-sha-hash", False),
  ("Currency", "$1.00", True),
  ("Currency", "not-a-currency", False),
))
def test_config_schema_definition_validators(validator, value, expected):
    assert ConfigSchemaDefinition.VALIDATORS[validator](value) == expected

def test_config_schema_definition_regex_validator():
    assert ConfigSchemaDefinition.VALIDATORS["RegEx"]("hello", r"[Hh]ello")
    assert not ConfigSchemaDefinition.VALIDATORS["RegEx"]("hello", r"[Yy]ellow")
