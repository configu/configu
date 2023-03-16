from .generated import Config as IConfig


class Config(IConfig):
    @property
    def id(self):
        return f"{self.set}.{self.key}"
