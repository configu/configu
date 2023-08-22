from .generated import ConfigSet as IConfigSet
from ..utils import error_message, is_valid_name


class ConfigSet(IConfigSet):
    """
    A mechanism for organizing and grouping configurations in a hierarchical
    structure. It serves as a path within the configuration tree, enabling
    you to associate specific configuration values with different contexts,
    such as environments, tenants, or any other use case you require.
    """

    SEPARATOR = "/"
    ROOT = ""
    ROOT_LABEL = "/"

    def __init__(self, path: str = None) -> None:
        """
        Creates a new ConfigSet.
        :param: path of the ConfigSet in a hierarchical structure.
        """
        error_location = [self.__class__.__name__, self.__init__.__name__]
        if path is None:
            path = ConfigSet.ROOT
        hierarchy = [ConfigSet.ROOT]
        if path.startswith(ConfigSet.ROOT_LABEL):
            path = path[1:]

        if path.endswith(ConfigSet.SEPARATOR):
            raise ValueError(
                error_message(
                    f"invalid path {path}",
                    error_location,
                    f"path mustn't end with {ConfigSet.SEPARATOR} character",
                )
            )

        for i, step in enumerate(path.split(ConfigSet.SEPARATOR)):
            if not is_valid_name(step):
                raise ValueError(
                    error_message(
                        f"invalid path {path}",
                        error_location,
                        "path is not valid or using reserved name",
                    )
                )
            if step != ConfigSet.ROOT:
                steps = [hierarchy[-1], step] if i > 0 else [step]
                hierarchy.append(ConfigSet.SEPARATOR.join(steps))
        super().__init__(hierarchy=hierarchy, path=path)
