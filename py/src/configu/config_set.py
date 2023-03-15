from typing import List

from .config_schema import ConfigSchema
from .types.generated import ConfigSet as IConfigSet
from .utils import pretty_error


class ConfigSet(IConfigSet):
    SEPARATOR: str = "/"
    ROOT: str = ""
    ROOT_LABEL: str = "/"

    def __init__(self, path: str = ROOT):
        self.hierarchy: List[str] = []

        if path.startswith(ConfigSet.ROOT_LABEL):
            path = path[1:]

        if path.endswith(ConfigSet.SEPARATOR):
            err_metadata = {
                "location": ["ConfigSet", "constructor"],
                "suggestion": f"path mustn't end with {ConfigSet.SEPARATOR} character",
            }
            raise ValueError(
                pretty_error(f'invalid path "{path}"', err_metadata)
            )

        if path == ConfigSet.ROOT:
            self.hierarchy = [ConfigSet.ROOT]
            return

        sets = path.split(ConfigSet.SEPARATOR)

        self.hierarchy = [
            ConfigSet.SEPARATOR.join(sets[:i])
            for i, cur in enumerate(sets, 1)
            if ConfigSchema.validate_naming(cur)
        ]
        self.hierarchy.insert(0, ConfigSet.ROOT)
