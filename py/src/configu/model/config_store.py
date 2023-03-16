from abc import abstractmethod, ABC

from typing import List

from .generated import ConfigStore as IConfigStore, ConfigStoreQuery, Config


class ConfigStore(ABC, IConfigStore):
    def init(self):
        """Anything that needs init before running Commands"""

    @abstractmethod
    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        raise NotImplemented()

    @abstractmethod
    def set(self, configs: List[Config]) -> None:
        raise NotImplemented()
