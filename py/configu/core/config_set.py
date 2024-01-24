from .generated import ConfigSet as IConfigSet
from ..utils import ConfigError, is_valid_name


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
        path = path or ConfigSet.ROOT
        hierarchy = [ConfigSet.ROOT]
        if path != ConfigSet.ROOT:
            error_reason = "invalid config set path"
            error_scope = [("ConfigSet", path)]

            if path.startswith(ConfigSet.ROOT_LABEL):
                path = path[1:]

            if path.endswith(ConfigSet.SEPARATOR):
                raise ConfigError(
                    reason=error_reason,
                    hint=f"path mustn't end with {ConfigSet.SEPARATOR} character",
                    scope=error_scope,
                )

            for i, step in enumerate(path.split(ConfigSet.SEPARATOR)):
                if not is_valid_name(step):
                    raise ConfigError(
                        reason=error_reason,
                        hint=f"path nodes mustn't contain reserved words '{step}'",
                        scope=error_scope,
                    )
                if step != ConfigSet.ROOT:
                    steps = [hierarchy[-1], step] if i > 0 else [step]
                    hierarchy.append(ConfigSet.SEPARATOR.join(steps))
        super().__init__(hierarchy=hierarchy, path=path)
