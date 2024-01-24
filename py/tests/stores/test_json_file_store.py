import os
import tempfile

from configu import Config, ConfigStoreQuery, JsonFileConfigStore


def test_values_roundtrips_correctly():
    with tempfile.TemporaryDirectory() as tempdir:
        filepath = os.path.join(tempdir, "config_store.json")
        with open(filepath, "w") as f:
            f.write("{}")
        store = JsonFileConfigStore(filepath)
        configs = [
            Config("foo", "", "bar"),
            Config("foo1", "", "baz"),
        ]
        store.set(configs)
        queries = [
            ConfigStoreQuery("foo", ""),
            ConfigStoreQuery("foo1", ""),
        ]
        result = store.get(queries)
        assert result == configs


def test_empty_values_removed_from_store():
    with tempfile.TemporaryDirectory() as tempdir:
        filepath = os.path.join(tempdir, "config_store.json")
        with open(filepath, "w") as f:
            f.write("{}")
        store = JsonFileConfigStore(filepath)
        store.set([Config("foo", "", "bar")])
        store.set([Config("foo", "", "")])
        result = store.get([ConfigStoreQuery("foo", "")])
        assert result == []
