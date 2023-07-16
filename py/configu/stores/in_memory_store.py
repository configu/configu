from typing import List

from ..core import Config, ConfigStore, ConfigStoreQuery


class InMemoryConfigStore(ConfigStore):
    """A `ConfigStore` persisted in-memory"""

    _data: List[Config]

    def __init__(self) -> None:
        super().__init__(type="in-memory")
        self._data = []

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        query_ids = [f"{query.set}.{query.key}" for query in queries]
        return [
            config for config in self._data if f"{config.set}.{config.key}" in query_ids
        ]

    def set(self, configs: List[Config]) -> None:
        set_config_ids = [f"{config.set}.{config.key}" for config in configs]
        existing = [
            config
            for config in self._data
            if f"{config.set}.{config.key}" not in set_config_ids
        ]
        self._data = [config for config in existing + configs if bool(config.value)]
