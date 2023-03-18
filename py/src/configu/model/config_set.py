from pathlib import Path

from .generated import ConfigSet as IConfigSet
from ..utils import error_message, is_valid_name


class ConfigSet(IConfigSet):
    SEPARATOR = '/'
    ROOT = ''
    ROOT_LABEL = '/'

    def __init__(self, path: str = None) -> None:
        super().__init__(hierarchy=[''], path=ConfigSet.ROOT if path is None else path)
        error_location = [self.__class__.__name__, self.__init__.__name__]
        if self.path.startswith(ConfigSet.ROOT_LABEL):
            self.path = self.path[1:]

        if self.path.endswith(ConfigSet.SEPARATOR):
            raise ValueError(error_message(f"invalid path {self.path}", error_location,
                                           f"path mustn't end with {ConfigSet.SEPARATOR} character"))

        for step in self.path.split(ConfigSet.SEPARATOR):
            if not is_valid_name(step):
                raise ValueError(error_message(f"invalid path {self.path}", error_location,
                                               f"path is not valid or using reserved name"))
            if step != '':
                self.hierarchy.append(ConfigSet.SEPARATOR.join([self.hierarchy[-1], step])[1:])
