import pytest

from configu import ConfigSchema
from configu.core.config_schema import CFGU_VALUE_TYPE_VALIDATORS
from configu.utils import ConfigError
from tests.schemas import DummyConfigSchema, DummySchemas


@pytest.mark.parametrize(
    "test_schema",
    (
        DummyConfigSchema(DummySchemas.ValidBasic),
        DummyConfigSchema(DummySchemas.ValidComplex),
        DummyConfigSchema(DummySchemas.ValidJSONSchema),
    ),
)
def test_valid_config_schemas(test_schema):
    ConfigSchema(test_schema.name, test_schema.contents)


@pytest.mark.parametrize(
    "test_schema",
    (
        DummyConfigSchema(DummySchemas.InvalidRegexMissingPattern),
        DummyConfigSchema(DummySchemas.InvalidReservedNames),
        DummyConfigSchema(DummySchemas.InvalidDefaultAndRequired),
        DummyConfigSchema(DummySchemas.InvalidDefaultAndTemplate),
        DummyConfigSchema(DummySchemas.InvalidInvalidDefault),
        DummyConfigSchema(DummySchemas.InvalidEmpty),
        DummyConfigSchema(DummySchemas.InvalidJSONSchema),
    ),
)
def test_invalid_config_schemas(test_schema):
    with pytest.raises(ConfigError):
        ConfigSchema(test_schema.name, test_schema.contents)


@pytest.mark.parametrize(
    "validator,value,expected",
    (
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
    ),
)
def test_config_schema_definition_validators(validator, value, expected):
    assert CFGU_VALUE_TYPE_VALIDATORS[validator](value) == expected


def test_config_schema_definition_regex_validator():
    assert CFGU_VALUE_TYPE_VALIDATORS["RegEx"](r"[Hh]ello", "hello")
    assert not CFGU_VALUE_TYPE_VALIDATORS["RegEx"](r"[Yy]ellow", "hello")
