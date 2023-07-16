import json
from typing import Dict, List, Union
from abc import abstractmethod

from ..core import Config, ConfigStore, ConfigStoreQuery


class KeyValueConfigStore(ConfigStore):
    """
    An abstract ConfigStore represented by a key-value storage system
    """

    def __init__(self, type: str):
        super().__init__(type)

    @abstractmethod
    def get_by_key(self, key: str) -> str:
        """
        Get data from the store
        :param key: the key in the storage system from which to read
        :return: the value stored in the storage system.
        """
        ...

    @abstractmethod
    def upsert(self, key: str, value: str):
        """
        Upsert data to the storage system
        :param key: the key in the storage system to write to
        :param value: the value to write
        """
        ...

    @abstractmethod
    def delete(self, key: str):
        """
        Delete data from the storage system
        :param key: the key in the storage system to delete
        """
        ...

    def _safe_json_parse(self, value):
        """
        Try parsing the data as json.
        :param value: The value to parse
        :return: The parsed value. If parsing fails, returns an empty dict.
        """
        try:
            return json.loads(value)
        except (Exception,):
            return {}

    def _calc_key(self, query: Union[ConfigStoreQuery, Config]) -> str:
        """
        Calculate the storage system key referenced in a query.
        If `set` is populated, will use that. Otherwise defaults to `key`
        :param query: The query to be calculated.
        """
        return query.set or query.key

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        stored_configs = []
        for query in queries:
            try:
                value = self.get_by_key(self._calc_key(query))
                if query.set:
                    value = str(self._safe_json_parse(value).get(query.key, ""))
                if value:
                    stored_configs.append(
                        Config.from_dict(
                            {
                                "key": query.key,
                                "set": query.set,
                                "value": value,
                            }
                        )
                    )
            except (Exception,):
                continue
        return stored_configs

    def set(self, configs: List[Config]):
        key_value_dict: Dict[str, Union[str, Dict[str, str]]] = {}
        for config in configs:
            key = self._calc_key(config)
            if not config.set:
                key_value_dict[key] = config.value
                continue

            if key not in key_value_dict or not isinstance(key_value_dict[key], dict):
                key_value_dict[key] = {}

            key_value_dict[key] = {
                **key_value_dict[key],
                config.key: config.value,
            }

        for key, value in key_value_dict.items():
            if value == "" or value is None:
                self.delete(key)
            else:
                self.upsert(
                    key,
                    json.dumps(value) if isinstance(value, dict) else str(value),
                )
