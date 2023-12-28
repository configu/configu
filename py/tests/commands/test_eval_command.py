import pytest

from configu import Config, ConfigSchema, ConfigSet, EvalCommand, InMemoryConfigStore
from configu.commands.eval_command import EvaluatedConfigOrigin
from configu.utils import ConfigError
from tests.schemas import DummyConfigSchema, DummySchemas


def test_empty_value():
    schema = DummyConfigSchema(DummySchemas.ValidBasic)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    result = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
    ).run()
    assert result["GREETING"]["result"]["value"] == ""
    assert result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.EmptyValue


def test_default_overrides_empty():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    result = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"SUBJECT": "foo"},
    ).run()
    assert result["GREETING"]["result"]["value"] == "hello"
    assert result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.SchemaDefault


def test_store_overrides_default():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    store.set([Config("GREETING", "", "hello")])
    result = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"SUBJECT": "foo"},
    ).run()
    assert result["GREETING"]["result"]["value"] == "hello"
    assert result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.StoreSet


def test_configs_override_store():
    schema = DummyConfigSchema(DummySchemas.ValidBasic)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    store.set([Config("GREETING", "", "hello")])
    result = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "bonjour"},
    ).run()
    assert result["GREETING"]["result"]["value"] == "bonjour"
    assert (
        result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.ConfigsOverride
    )


def test_previous_does_not_override_configs():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    previous = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "bonjour", "SUBJECT": "foo"},
    ).run()
    result = EvalCommand(
        store=store, set=config_set, schema=config_schema, pipe=previous
    )
    result = result.run()
    assert result["GREETING"]["result"]["value"] == "bonjour"
    assert (
        result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.ConfigsOverride
    )


def test_latest_configs_override_previous():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    previous = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "hello", "SUBJECT": "foo"},
    ).run()

    result = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        pipe=previous,
        configs={"GREETING": "bonjour", "SUBJECT": "foo"},
    ).run()
    assert result["GREETING"]["result"]["value"] == "bonjour"
    assert (
        result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.ConfigsOverride
    )


def test_resolves_templates():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    result = EvalCommand(
        store=store, set=config_set, schema=config_schema, configs={"SUBJECT": "foo"}
    ).run()
    assert result["MESSAGE"]["result"]["value"] == "hello, foo!"
    assert result["MESSAGE"]["result"]["origin"] == EvaluatedConfigOrigin.SchemaTemplate


def test_validates_values():
    schema = DummyConfigSchema(DummySchemas.ValidComplex)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    store.set([Config("GREETING", "", "hello")])
    with pytest.raises(ConfigError):
        EvalCommand(
            store=store,
            set=config_set,
            schema=config_schema,
            configs={"GREETING": "foo"},
        ).run()
