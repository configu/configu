import json
from typing import List

from ..core import Config, ConfigStore, ConfigStoreQuery


class JsonFileConfigStore(ConfigStore):
    """A `ConfigStore` persisted in a json file"""

    _path: str

    def __init__(self, path: str) -> None:
        super().__init__(type="json-file")
        self._path = path

    def _read(self) -> List[Config]:
        """
        Reads JSON file contents
        :return: The file contents, represented as a list of Config
        dicts
        """
        with open(self._path, mode="r", encoding="utf-8") as json_file:
            data = json.load(json_file)
        return [Config(**args) for args in data]

    def _write(self, configs: List[Config]) -> None:
        """
        Writes to the JSON file
        :param configs: a list of key/set/value dicts to write
        """
        data = [config.to_dict() for config in configs]
        with open(self._path, mode="w", encoding="utf-8") as json_file:
            json.dump(data, json_file)

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        stored_configs = self._read()
        query_ids = [f"{query.set}.{query.key}" for query in queries]
        return [
            config
            for config in stored_configs
            if f"{config.set}.{config.key}" in query_ids
        ]

    def set(self, configs: List[Config]) -> None:
        stored_configs = self._read()
        set_config_ids = [f"{config.set}.{config.key}" for config in configs]
        existing = [
            config
            for config in stored_configs
            if f"{config.set}.{config.key}" not in set_config_ids
        ]
        next_configs = [config for config in existing + configs if bool(config.value)]
        self._write(next_configs)
