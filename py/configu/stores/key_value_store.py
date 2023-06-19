import json
from typing import List, Dict, Union
from abc import abstractmethod
from ..core import ConfigStore, ConfigStoreQuery, Config


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

    def safe_json_parse(self, value):
        """
        Try parsing the data as json.
        :param value: The value to parse
        :return: The parsed value. If parsing fails, returns an empty dict.
        """
        try:
            return json.loads(value)
        except Exception:
            return {}

    def calc_key(self, query: Union[ConfigStoreQuery, Config]) -> str:
        """
        Calculate the storage system key referenced in a query.
        If `set` is populated, will use that. Otherwise defaults to `key`
        :param query: The query to be calculated.
        """
        return getattr(query, "set", query.key)

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        keys = {self.calc_key(q) for q in queries}
        key_value_dict = {}
        for key in keys:
            try:
                value = self.get_by_key(key)
                if not value:
                    raise KeyError(
                        f"key {key} has no value at {self.__class__.__name__}"
                    )
                key_value_dict[key] = value
            except Exception:
                key_value_dict[key] = ""

        json_values: List[Config] = []
        for query in queries:
            value = key_value_dict[self.calc_key(query)]
            if not query.set:
                json_values.append(
                    Config.from_dict(
                        {
                            "key": query.key,
                            "set": query.set,
                            "value": value if value is not None else "",
                        }
                    )
                )
                continue
            json_value = self.safe_json_parse(value)
            json_values.append(
                Config.from_dict(
                    {
                        "set": query.set,
                        "key": query.key,
                        "value": str(json_value.get(query.key, "")),
                    }
                )
            )
        return json_values

    def set(self, configs: List[Config]):
        key_value_dict: Dict[str, Dict[str, str]] = {}
        for config in configs:
            key = self.calc_key(config)
            if key not in key_value_dict:
                key_value_dict[key] = {}
            if not config.value:
                continue
            key_value_dict[key] = {
                **key_value_dict[key],
                config.key: config.value,
            }

        for key, value in key_value_dict.items():
            if value == "" or value is None:
                self.delete(key)
            else:
                self.upsert(key, json.dumps(value))
