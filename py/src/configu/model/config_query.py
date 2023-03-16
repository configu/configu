from .generated import ConfigStoreQuery as IConfigStoreQuery


class ConfigStoreQuery(IConfigStoreQuery):
    @property
    def id(self):
        return f"{self.set}.{self.key}"
