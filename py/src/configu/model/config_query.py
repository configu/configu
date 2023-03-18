import functools

from .generated import ConfigStoreQuery as IConfigStoreQuery


class ConfigStoreQuery(IConfigStoreQuery):
    @functools.cached_property
    def id(self):
        return f"{self.set}.{self.key}"
