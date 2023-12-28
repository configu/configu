from configu import InMemoryConfigStore, EvalCommand, ConfigSchema, ConfigSet, Config
from configu.commands.eval_command import EvaluatedConfigOrigin
import pytest

def test_empty_value():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/basic.cfgu.json")
    result = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
    ).run()
    assert result["GREETING"]["result"]["value"] == ""
    assert result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.EmptyValue

def test_default_overrides_empty():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
    result = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"SUBJECT": "foo"},
    ).run()
    assert result["GREETING"]["result"]["value"] == "hello"
    assert result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.SchemaDefault

def test_store_overrides_default():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
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
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/basic.cfgu.json")
    store.set([Config("GREETING", "", "hello")])
    result = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "bonjour"}
    ).run()
    assert result["GREETING"]["result"]["value"] == "bonjour"
    assert result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.ConfigsOverride

def test_previous_does_not_override_configs():
  store = InMemoryConfigStore()
  config_set = ConfigSet("")
  config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
  previous = EvalCommand(
      store=store,
      set=config_set,
      schema=config_schema,
      configs={"GREETING": "bonjour", "SUBJECT": "foo"},
  ).run()
  result = EvalCommand(
    store=store,
    set=config_set,
    schema=config_schema,
    previous=previous
  )
  result = result.run()
  assert result["GREETING"]["result"]["value"] == "bonjour"
  assert result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.ConfigsOverride

def test_latest_configs_override_previous():
  store = InMemoryConfigStore()
  config_set = ConfigSet("")
  config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
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
    previous=previous,
    configs={"GREETING": "bonjour", "SUBJECT": "foo"},
  ).run()
  assert result["GREETING"]["result"]["value"] == "bonjour"
  assert result["GREETING"]["result"]["origin"] == EvaluatedConfigOrigin.ConfigsOverride


def test_resolves_templates():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
    result = EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"SUBJECT": "foo"}
    ).run()
    assert result["MESSAGE"]["result"]["value"] == "hello, foo!"
    assert result["MESSAGE"]["result"]["origin"] == EvaluatedConfigOrigin.SchemaTemplate

def test_validates_values():
  store = InMemoryConfigStore()
  config_set = ConfigSet("")
  config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
  store.set([Config("GREETING", "", "hello")])
  with pytest.raises(ValueError):
    EvalCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "foo"}
    ).run()
