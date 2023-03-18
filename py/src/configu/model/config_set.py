from .generated import ConfigSet as IConfigSet
from ..utils import error_message, is_valid_name


class ConfigSet(IConfigSet):
    SEPARATOR = '/'
    ROOT = ''
    ROOT_LABEL = '/'

    def __init__(self, path: str = None) -> None:
        error_location = [self.__class__.__name__, self.__init__.__name__]
        if path is None:
            path = ConfigSet.ROOT
        hierarchy = [ConfigSet.ROOT]
        if path.startswith(ConfigSet.ROOT_LABEL):
            path = path[1:]

        if path.endswith(ConfigSet.SEPARATOR):
            raise ValueError(error_message(f"invalid path {path}", error_location,
                                           f"path mustn't end with {ConfigSet.SEPARATOR} character"))

        for step in path.split(ConfigSet.SEPARATOR):
            if not is_valid_name(step):
                raise ValueError(error_message(f"invalid path {path}", error_location,
                                               f"path is not valid or using reserved name"))
            if step != ConfigSet.ROOT:
                hierarchy.append(ConfigSet.SEPARATOR.join([hierarchy[-1], step])[1:])
        super().__init__(hierarchy=hierarchy, path=path)
