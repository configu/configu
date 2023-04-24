import json
from typing import List, Union

from ..core import Config, ConfigStoreQuery, ConfigStore
from ..core.generated import (
    config_store_contents_from_dict,
    config_store_query_from_dict,
    config_store_contents_to_dict,
    ConfigStoreContentsElement,
    config_store_contents_element_from_dict,
)


class JsonFileStore(ConfigStore):
    _path: str

    def __init__(self, path: str) -> None:
        super().__init__(type="in-memory")
        self._path = path

    def read(self):
        with open(self._path, mode="r", encoding="utf-8") as json_file:
            data = json.load(json_file)
        return config_store_contents_from_dict(data)

    def write(self, next_configs: List[ConfigStoreContentsElement]):
        data = config_store_contents_to_dict(next_configs)
        with open(self._path, mode="w", encoding="utf-8") as json_file:
            json.dump(data, json_file)

    def get(
        self, queries: List[Union[ConfigStoreQuery, dict]]
    ) -> List[ConfigStoreContentsElement]:
        stored_configs = self.read()
        queries = [
            config_store_query_from_dict(query)
            if isinstance(query, dict)
            else query
            for query in queries
        ]
        query_ids = [f"{query.set}.{query.key}" for query in queries]
        results = []
        for config in stored_configs:
            for query in queries:
                if any(
                    [
                        f"{config.set}.{config.key}" in query_ids,
                        (query.set == "*" or query.set == config.set)
                        and (query.key == "*" or query.key == config.key),
                    ]
                ):
                    results.append(config)
        return results

    def set(self, configs: List[Union[Config, dict]]) -> None:
        stored_configs = self.read()
        configs = [
            config_store_contents_element_from_dict(config)
            if isinstance(config, dict)
            else config_store_contents_element_from_dict(config.to_dict())
            for config in configs
        ]
        set_config_ids = [f"{config.set}.{config.key}" for config in configs]
        existing = [
            config
            for config in stored_configs
            if f"{config.set}.{config.key}" not in set_config_ids
        ]
        stored_configs = [
            config for config in existing + configs if bool(config.value)
        ]
        self.write(stored_configs)
