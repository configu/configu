from configu import Config, ConfigStoreQuery, InMemoryConfigStore


def test_values_roundtrips_correctly():
    store = InMemoryConfigStore()
    configs = [
        Config("foo", "", "bar"),
        Config("foo1", "", "baz"),
    ]
    store.set(configs)
    queries = [
        ConfigStoreQuery("foo", ""),
        ConfigStoreQuery("foo1", ""),
    ]
    assert store.get(queries) == configs


def test_empty_values_removed_from_store():
    store = InMemoryConfigStore()
    configs = [
        Config("foo", "", "bar"),
    ]
    store.set([Config("foo", "", "bar")])
    store.set([Config("foo", "", "")])
    assert store.get([ConfigStoreQuery("foo", "")]) == []
