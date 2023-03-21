import functools

from .generated import Config as IConfig


class Config(IConfig):
    @functools.cached_property
    def id(self):
        return f"{self.set}.{self.key}"
