from configu import InMemoryConfigStore, ConfigSet, ConfigSchema, EvalCommand, ExportCommand
from unittest import mock
import os

def test_export_empty_value():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    schema = ConfigSchema("tests/staticfiles/config_schemas/valid/empty.cfgu.json")
    eval_output = EvalCommand(
        store=store,
        set=config_set,
        schema=schema,
    ).run()
    export_output = ExportCommand(eval_output).run()
    assert export_output == {}

@mock.patch.dict(os.environ, {}, clear=True)
def test_export_value():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    schema = ConfigSchema("tests/staticfiles/config_schemas/valid/basic.cfgu.json")
    eval_output = EvalCommand(
        store=store,
        set=config_set,
        schema=schema,
        configs={"GREETING": "hello"}
    ).run()
    export_output = ExportCommand(eval_output).run()
    assert export_output == {"GREETING": "hello"}

@mock.patch.dict(os.environ, {}, clear=True)
def test_export_sets_environment_variables():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    schema = ConfigSchema("tests/staticfiles/config_schemas/valid/basic.cfgu.json")
    eval_output = EvalCommand(
        store=store,
        set=config_set,
        schema=schema,
        configs={"GREETING": "hello"}
    ).run()
    ExportCommand(eval_output).run()
    assert os.environ.get("GREETING") == "hello"

@mock.patch.dict(os.environ, {"GREETING": "bonjour"}, clear=True)
def test_export_environment_variables_overrides():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    schema = ConfigSchema("tests/staticfiles/config_schemas/valid/basic.cfgu.json")
    eval_output = EvalCommand(
        store=store,
        set=config_set,
        schema=schema,
        configs={"GREETING": "hello"}
    ).run()
    ExportCommand(eval_output).run()
    assert os.environ.get("GREETING") == "hello"

@mock.patch.dict(os.environ, {"GREETING": "bonjour"}, clear=True)
def test_export_environment_variables_with_no_override():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    schema = ConfigSchema("tests/staticfiles/config_schemas/valid/basic.cfgu.json")
    eval_output = EvalCommand(
        store=store,
        set=config_set,
        schema=schema,
        configs={"GREETING": "hello"}
    ).run()
    ExportCommand(eval_output, override=False).run()
    assert os.environ.get("GREETING") == "bonjour"
