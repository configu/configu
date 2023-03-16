from .generated import ConfigSet as IConfigSet
from ..utils import error_message, is_valid_name


class ConfigSet(IConfigSet):
    SEPARATOR = '/'
    ROOT = ''
    ROOT_LABEL = '/'

    def __init__(self, path: str = None) -> None:
        super().__init__([''], ConfigSet.ROOT if path is None else path)
        scope_location = [self.__class__.__name__, '__init__']
        if self.path.startswith(ConfigSet.ROOT_LABEL):
            self.path = self.path[1:]

        if self.path.endswith(ConfigSet.SEPARATOR):
            raise Exception(error_message(f"invalid path {self.path}", scope_location,
                                          f"path mustn't end with {ConfigSet.SEPARATOR} character"))

        if self.path == ConfigSet.ROOT:
            self.hierarchy = [ConfigSet.ROOT]

        for step in self.path.split(ConfigSet.SEPARATOR):
            if not is_valid_name(step):
                raise Exception(error_message(f"invalid path {self.path}", scope_location,
                                              f"path is not valid or using reserved name"))
            if step != '':
                self.hierarchy.append(ConfigSet.SEPARATOR.join([self.hierarchy[-1], step]))
