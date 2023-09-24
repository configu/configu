from configu import UpsertCommand, InMemoryConfigStore, ConfigSchema, ConfigSet, ConfigStoreQuery, Config
import pytest

def test_upsert_no_configs():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
    UpsertCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={},
    ).run()
    assert store.get([ConfigStoreQuery("GREETING", ""), ConfigStoreQuery("SUBJECT", ""), ConfigStoreQuery("MESSAGE", "")]) == []

def test_upsert_writes_value():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
    UpsertCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "bonjour"},
    ).run()

    assert store.get([ConfigStoreQuery("GREETING", "")]) == [Config("GREETING", "", "bonjour")]

def test_upsert_overrides_value():
    store = InMemoryConfigStore()
    store.set([Config("GREETING", "", "hello")])
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
    UpsertCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "bonjour"},
    ).run()

    assert store.get([ConfigStoreQuery("GREETING", "")]) == [Config("GREETING", "", "bonjour")]

def test_upsert_key_not_in_schema():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
    with pytest.raises(ValueError):
      UpsertCommand(
          store=store,
          set=config_set,
          schema=config_schema,
          configs={"foo": "bar"},
      ).run()

def test_upsert_template_value():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
    with pytest.raises(ValueError):
      UpsertCommand(
          store=store,
          set=config_set,
          schema=config_schema,
          configs={"MESSAGE": "Hello, World!"},
      ).run()

def test_upsert_invalid_value():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
    with pytest.raises(ValueError):
      UpsertCommand(
          store=store,
          set=config_set,
          schema=config_schema,
          configs={"GREETING": "foo"},
      ).run()

def test_upsert_multiple_values():
    store = InMemoryConfigStore()
    config_set = ConfigSet("")
    config_schema = ConfigSchema("tests/staticfiles/config_schemas/valid/complex.cfgu.json")
    UpsertCommand(
        store=store,
        set=config_set,
        schema=config_schema,
        configs={"GREETING": "hello", "SUBJECT": "test"},
    ).run()
    assert store.get([ConfigStoreQuery("GREETING", ""), ConfigStoreQuery("SUBJECT", "")]) == [Config("GREETING", "", "hello"), Config("SUBJECT", "", "test")]
