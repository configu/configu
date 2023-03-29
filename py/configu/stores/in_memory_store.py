from typing import List, Union

from ..core import Config, ConfigStoreQuery, ConfigStore
from ..core.generated import config_store_query_from_dict, config_from_dict


class InMemoryStore(ConfigStore):
    _data: List[Config]

    def __init__(self) -> None:
        super().__init__(type="in-memory")
        self._data = []

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        queries = [
            config_store_query_from_dict(query)
            if isinstance(query, dict)
            else query
            for query in queries
        ]
        query_ids = [f"{query.set}.{query.key}" for query in queries]
        return [
            config
            for config in self._data
            if f"{config.set}.{config.key}" in query_ids
        ]

    def set(self, configs: List[Union[Config, dict]]) -> None:
        configs = [
            config_from_dict(config) if isinstance(config, dict) else config
            for config in configs
        ]
        set_config_ids = [f"{config.set}.{config.key}" for config in configs]
        existing = [
            config
            for config in self._data
            if f"{config.set}.{config.key}" not in set_config_ids
        ]
        self._data = [
            config for config in existing + configs if bool(config.value)
        ]
