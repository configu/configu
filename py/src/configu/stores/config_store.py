import json
from abc import abstractmethod
from typing import List

from configu.types.generated import (
    ConfigStoreQuery,
    Config,
    ConfigStore as IConfigStore,
)


class ConfigStore(IConfigStore):
    @abstractmethod
    def get(self, queries: ConfigStoreQuery) -> List[Config]:
        raise NotImplemented()

    @abstractmethod
    def set(self, configs: List[Config]):
        raise NotImplemented()

    @staticmethod
    def parse(raw_content: str) -> List[Config]:
        configs = json.loads(raw_content)
        return [Config.from_dict(conf) for conf in configs]
