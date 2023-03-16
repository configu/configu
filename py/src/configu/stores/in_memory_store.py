from typing import List

from .. import Config, ConfigStoreQuery
from .. import ConfigStore


class InMemoryStore(ConfigStore):
    _data: List[Config]

    def __init__(self) -> None:
        super().__init__('in-memory')
        self._data = []

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        query_ids = [query.id for query in queries]
        return [config for config in self._data if config.id in query_ids]

    def set(self, configs: List[Config]) -> None:
        set_config_ids = [config.id for config in configs]
        existing = [config for config in self._data if config.id not in set_config_ids]
        self._data = [config for config in existing + configs if bool(config.value)]
