import pytest

from configu import (
    Config,
    ConfigSchema,
    ConfigSet,
    ConfigStoreQuery,
    InMemoryConfigStore,
    UpsertCommand,
)
from configu.utils import ConfigError
from tests.schemas import DummyConfigSchema, DummySchemas


def test_upsert_no_configs():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    UpsertCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={},
    ).run()
    assert (
        store.get(
            [
                ConfigStoreQuery("GREETING", ""),
                ConfigStoreQuery("SUBJECT", ""),
                ConfigStoreQuery("MESSAGE", ""),
            ]
        )
        == []
    )


def test_upsert_writes_value():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    UpsertCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "bonjour"},
    ).run()

    assert store.get([ConfigStoreQuery("GREETING", "")]) == [
        Config("GREETING", "", "bonjour")
    ]


def test_upsert_overrides_value():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    store.set([Config("GREETING", "", "hello")])
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    UpsertCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "bonjour"},
    ).run()

    assert store.get([ConfigStoreQuery("GREETING", "")]) == [
        Config("GREETING", "", "bonjour")
    ]


def test_upsert_key_not_in_schema():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    with pytest.raises(ConfigError):
        UpsertCommand(
            store=store,
            set=config_set,
            schema=config_schema,
            configs={"foo": "bar"},
        ).run()


def test_upsert_template_value():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    with pytest.raises(ConfigError):
        UpsertCommand(
            store=store,
            set=config_set,
            schema=config_schema,
            configs={"MESSAGE": "Hello, World!"},
        ).run()


def test_upsert_invalid_value():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    with pytest.raises(ConfigError):
        UpsertCommand(
            store=store,
            set=config_set,
            schema=config_schema,
            configs={"GREETING": "foo"},
        ).run()


def test_upsert_multiple_values():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    UpsertCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "hello", "SUBJECT": "test"},
    ).run()
    assert store.get(
        [ConfigStoreQuery("GREETING", ""), ConfigStoreQuery("SUBJECT", "")]
    ) == [Config("GREETING", "", "hello"), Config("SUBJECT", "", "test")]
