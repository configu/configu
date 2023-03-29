from typing import Dict, Union

from pydantic import BaseModel, Field

from ..core import (
    ConfigSet,
    ConfigStore,
    ConfigSchema,
    CfguType,
    Config,
    Command,
)
from ..core.command import CommandReturn
from ..utils import error_message


class UpsertCommandParameters(BaseModel):
    """"""

    store: ConfigStore
    set: ConfigSet
    schema_: ConfigSchema = Field(alias="schema")
    configs: Dict[str, str]


class UpsertCommand(Command[None]):
    parameters: UpsertCommandParameters

    def __init__(
        self, parameters: Union[UpsertCommandParameters, dict]
    ) -> None:
        if isinstance(parameters, dict):
            parameters = UpsertCommandParameters.parse_obj(parameters)
        super().__init__(parameters)

    def run(self) -> CommandReturn:
        scope_location = ["UpsertCommand", "run"]
        store = self.parameters.store
        set_ = self.parameters.set
        schema = self.parameters.schema_
        configs = self.parameters.configs
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
                        f"key '{key}' must be declared"
                        f" on schema {schema.path}",
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
            type_test = ConfigSchema.CFGU.VALIDATORS.get(
                cfgu.type.value, lambda: False
            )
            test_values = (
                (
                    value,
                    cfgu.pattern,
                )
                if cfgu.type == CfguType.REG_EX
                else (value,)
            )
            if value and not type_test(*test_values):
                raise ValueError(
                    error_message(
                        f"invalid config value '{value}' for key '{key}'",
                        scope_location,
                        f"value '{value}' must be of type '{cfgu.type.value}'",
                    )
                )
            upset_configs.append(Config(set=set_.path, key=key, value=value))
        store.set(upset_configs)
        return
