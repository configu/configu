import json
from typing import List, Union

from ..core import Config, ConfigStoreQuery, ConfigStore
from ..core.generated import config_store_contents_from_dict


class JsonFileStore(ConfigStore):
    _path: str

    def __init__(self, path: str) -> None:
        super().__init__(type="in-memory")
        # todo must validate the file exists.
        #  and that it's a list and not object.
        #  probably create it if not..
        #  otherwise the exception only raise
        #  when the user read()
        self._path = path

    def read(self):
        with open(self._path, mode="r", encoding="utf-8") as json_file:
            data = json.load(json_file)
        return config_store_contents_from_dict(data)

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        pass

    # query_ids = [query.id for query in queries]
    # return [config for config in self._data if config.id in query_ids]

    def set(self, configs: List[Union[Config, dict]]) -> None:
        pass


# configs = [
#     Config(**config) if isinstance(config, dict) else config
#     for config in configs
# ]
# set_config_ids = [config.id for config in configs]
# existing = [
#     config for config in self._data if config.id not in set_config_ids
# ]
# self._data = [
#     config for config in existing + configs if bool(config.value)
# ]
