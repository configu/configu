from abc import ABC, abstractmethod
from typing import List

from .generated import Config, ConfigStore as IConfigStore, ConfigStoreQuery


class ConfigStore(ABC, IConfigStore):
    """
    An abstract base class representing a config store.

    A ConfigStore is a storage system for Configs in Configu,
    serving as a mechanism for storing, retrieving, and managing configuration
    data.
    """

    def init(self):
        """Creates/prepares a new ConfigStore"""

    @abstractmethod
    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        """
        Retrieves a set of `Config`s.
        :param queries: a class containing either the key and/or set to be
        retrieved.
        :return: A list of `Config`s from the store.
        """

    @abstractmethod
    def set(self, configs: List[Config]) -> None:
        """
        Upserts a set of `Config`s.
        :param configs: a list of `Config`s to be set in the store.
        """
