from typing import Dict, TypedDict

from ..core import (
    CfguType,
    Command,
    Config,
    ConfigSchema,
    ConfigSet,
    ConfigStore,
)
from ..utils import error_message


class UpsertCommandParameters(TypedDict):
    store: ConfigStore
    set: ConfigSet
    schema: ConfigSchema
    configs: Dict[str, str]


class UpsertCommand(Command):
    """
    The Upsert command is used to create, update or delete Configs from a
    ConfigStore
    """

    parameters: UpsertCommandParameters

    def __init__(
        self,
        *,
        store: ConfigStore,
        set: ConfigSet,
        schema: ConfigSchema,
        configs: Dict[str, str],
    ) -> None:
        """
        Creates a new UpsertCommand.
        :param store: the `configu.core.ConfigStore` to which the command will write
        :param set: the `configu.core.ConfigSet` to which the command will write
        :param schema: `configu.core.ConfigSchema` to validate config being written
        :param configs: a dictionary of configs to upsert
        """
        super().__init__(
            UpsertCommandParameters(
                store=store, set=set, schema=schema, configs=configs
            )
        )

    def run(self):
        """Validates the configs against the schema and upsert to the store

        :raises ValueError: if any config is invalid for the schema
        """
        scope_location = ["UpsertCommand", "run"]
        store = self.parameters["store"]
        set_ = self.parameters["set"]
        schema = self.parameters["schema"]
        configs = self.parameters["configs"]
        store.init()
        schema_content = ConfigSchema.parse(schema)
        upset_configs = []
        for key, value in configs.items():
            cfgu = schema_content.get(key)
            if cfgu is None:
                raise ValueError(
                    error_message(
                        f"invalid config key '{key}'",
                        scope_location,
                        f"key '{key}' must be declared on schema {schema.path}",
                    )
                )
            if value and cfgu.template is not None:
                raise ValueError(
                    error_message(
                        f"invalid assignment to config key '{key}'",
                        scope_location,
                        "keys declared with template mustn't have a value",
                    )
                )
            type_test = ConfigSchema.CFGU.VALIDATORS.get(cfgu.type.value, lambda: False)
            test_values = (
                (
                    value,
                    cfgu.pattern,
                )
                if cfgu.type == CfguType.REG_EX
                else (value,)
            )
            if value and not type_test(*test_values):
                of_type = cfgu.type.value
                if cfgu.type == CfguType.REG_EX:
                    of_type += f"({cfgu.pattern})"
                raise ValueError(
                    error_message(
                        f"invalid config value '{value}' for key '{key}'",
                        scope_location,
                        f"value '{value}' must be of type '{of_type}'",
                    )
                )
            upset_configs.append(Config(set=set_.path, key=key, value=value))
        store.set(upset_configs)
