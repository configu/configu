from unittest import mock
import os

from configu import (
    ConfigSchema,
    ConfigSet,
    EvalCommand,
    ExportCommand,
    InMemoryConfigStore,
)
from tests.schemas import DummyConfigSchema, DummySchemas


@mock.patch.dict(os.environ, {}, clear=True)
def test_export_value():
    schema = DummyConfigSchema(DummySchemas.ValidBasic)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    eval_output = EvalCommand(
        store=store, set=config_set, schema=config_schema, configs={"GREETING": "hello"}
    ).run()
    export_output = ExportCommand(eval_output).run()
    assert export_output == {"GREETING": "hello"}


@mock.patch.dict(os.environ, {}, clear=True)
def test_export_sets_environment_variables():
    schema = DummyConfigSchema(DummySchemas.ValidBasic)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    eval_output = EvalCommand(
        store=store, set=config_set, schema=config_schema, configs={"GREETING": "hello"}
    ).run()
    ExportCommand(eval_output).run()
    assert os.environ.get("GREETING") == "hello"


@mock.patch.dict(os.environ, {"GREETING": "bonjour"}, clear=True)
def test_export_environment_variables_overrides():
    schema = DummyConfigSchema(DummySchemas.ValidBasic)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    eval_output = EvalCommand(
        store=store, set=config_set, schema=config_schema, configs={"GREETING": "hello"}
    ).run()
    ExportCommand(eval_output).run()
    assert os.environ.get("GREETING") == "hello"


@mock.patch.dict(os.environ, {"GREETING": "bonjour"}, clear=True)
def test_export_environment_variables_with_no_override():
    schema = DummyConfigSchema(DummySchemas.ValidBasic)
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema(schema.name, schema.contents)
    eval_output = EvalCommand(
        store=store, set=config_set, schema=config_schema, configs={"GREETING": "hello"}
    ).run()
    ExportCommand(eval_output, override=False).run()
    assert os.environ.get("GREETING") == "bonjour"
