from typing import List, Dict, Union, Literal, Optional, Any

from pydantic import BaseModel, Field

from ..model import Command, ConfigStore, ConfigSet, ConfigSchema, Cfgu

EvaluatedConfigSource = Literal[
    'global-override',
    'local-override',
    'store-set',
    'schema-template',
    'schema-default',
    'empty'
]


class EvalCommandFromParameter(BaseModel):
    """"""
    store: ConfigStore
    set: ConfigSet
    schema_: ConfigSchema = Field(alias='schema')


class EvalCommandFromParameterWithConfigs(EvalCommandFromParameter):
    configs: Optional[Dict[str, str]]


class EvalCommandParameters(BaseModel):
    """"""
    from_: List[EvalCommandFromParameter] = Field(alias='from')
    configs: Optional[Dict[str, str]]


class ConfigEvalScope(BaseModel):
    context: Dict[str, Union[EvalCommandFromParameter, str, int]]
    cfgu: Cfgu
    result: Dict[str, Union[str, Dict[str, Union[EvaluatedConfigSource, str]]]]


class EvalScope:
    def __init__(self):
        self.scopes = {}

    def __getitem__(self, key: str) -> ConfigEvalScope:
        return self.scopes[key]

    def __setitem__(self, key: str, value: ConfigEvalScope):
        self.scopes[key] = value


class EvalCommand(Command):
    parameters: EvalCommandFromParameterWithConfigs

    def __init__(self, parameters: Union[EvalCommandFromParameterWithConfigs, dict]) -> None:
        if isinstance(parameters, dict):
            parameters = EvalCommandParameters.parse_obj(parameters)
        super().__init__(parameters)

    def run(self) -> Any:
        for eval_scope in self.parameters.from_:
            eval_scope.store.init()
            schema_contents = ConfigSchema.parse(eval_scope.schema_)
            print(schema_contents)
