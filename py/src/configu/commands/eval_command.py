from dataclasses import dataclass
from typing import List, Dict, Union, Literal, Optional, Any

from pydantic import BaseModel, Field

from ..model import Command, ConfigStore, ConfigSet, ConfigSchema, Cfgu, ConfigStoreQuery


class EvalCommandFromParameter(BaseModel):
    """"""
    store: ConfigStore
    set: ConfigSet
    schema_: ConfigSchema = Field(alias='schema')


class ConfigEvalScopeContext(EvalCommandFromParameter):
    key: str
    from_: int


@dataclass
class ConfigEvalScopeResultFrom:
    source: Literal[
        'global-override',
        'local-override',
        'store-set',
        'schema-template',
        'schema-default',
        'empty'
    ]
    which: str


@dataclass
class ConfigEvalScopeResult:
    value: str
    from_: ConfigEvalScopeResultFrom


@dataclass
class ConfigEvalScope:
    context: ConfigEvalScopeContext
    cfgu: Cfgu
    result: ConfigEvalScopeResult


class EvalCommandFromParameterWithOverrides(EvalCommandFromParameter):
    configs: Optional[Dict[str, str]]


class EvalCommandParameters(BaseModel):
    """"""
    from_: List[EvalCommandFromParameterWithOverrides] = Field(alias='from')
    configs: Optional[Dict[str, str]]


def _eval_result_from_store(context: ConfigEvalScopeContext) -> ConfigEvalScopeResult:
    queries = [ConfigStoreQuery(context.key, store_set) for store_set in context.set.hierarchy]
    results = context.store.get(queries)
    results = sorted(results, key=lambda query_result: len(query_result.set.split(context.set.SEPARATOR)))
    if len(results):
        value = results[-1].value
        which = f'parameters.from[{context.from_}]:store={context.store.type}:set={context.set.path}'
        from_ = ConfigEvalScopeResultFrom(source='store-set', which=which)
        return ConfigEvalScopeResult(value=value, from_=from_)
    return ConfigEvalScopeResult(value='', from_=ConfigEvalScopeResultFrom(source='empty', which=''))


def _eval_result_from_schema(context: ConfigEvalScopeContext, cfgu: Cfgu) -> ConfigEvalScopeResult:
    if cfgu.template is not None:
        which = f'parameters.from[{context.from_}]:schema.template={cfgu.template}'
        from_ = ConfigEvalScopeResultFrom(source='schema-template', which=which)
        return ConfigEvalScopeResult(value='', from_=from_)
    if cfgu.default is not None:
        value = cfgu.default
        which = f'parameters.from[{context.from_}]:schema.default={cfgu.default}'
        from_ = ConfigEvalScopeResultFrom(source='schema-default', which=which)
        return ConfigEvalScopeResult(value=value, from_=from_)
    return ConfigEvalScopeResult(value='', from_=ConfigEvalScopeResultFrom(source='empty', which=''))


class EvalCommand(Command):
    parameters: EvalCommandParameters

    def __init__(self, parameters: Union[EvalCommandParameters, dict]) -> None:
        if isinstance(parameters, dict):
            parameters = EvalCommandParameters.parse_obj(parameters)
        super().__init__(parameters)

    def _eval_result(self, context: ConfigEvalScopeContext, cfgu: Cfgu) -> ConfigEvalScopeResult:
        if self.parameters.configs is not None and context.key in self.parameters.configs:
            value = self.parameters.configs.get(context.key)
            which = f'parameters.configs.{context.key}={value}'
            from_ = ConfigEvalScopeResultFrom(source='global-override', which=which)
            return ConfigEvalScopeResult(value=value, from_=from_)
        if (
            context.from_ < len(self.parameters.from_)
            and self.parameters.from_[context.from_].configs is not None
            and context.key in self.parameters.from_[context.from_].configs
        ):
            value = self.parameters.from_[context.from_].configs.get('key')
            which = f'parameters.from[{context.from_}].configs.{context.key}=${value}'
            from_ = ConfigEvalScopeResultFrom(source='local-override', which=which)
            return ConfigEvalScopeResult(value=value, from_=from_)
        return _eval_result_from_store(context) if cfgu.template is None else _eval_result_from_schema(context, cfgu)

    def run(self) -> Any:
        eval_scope = {}
        for i, eval_from in enumerate(self.parameters.from_):
            eval_from.store.init()
            schema_contents = ConfigSchema.parse(eval_from.schema_)
            from_context = {
                "store": eval_from.store,
                "set": eval_from.set,
                "schema": eval_from.schema_,
                "from_": i,
            }
            for key, cfgu in schema_contents.items():
                context = ConfigEvalScopeContext(**from_context, key=key)
                result = self._eval_result(context, cfgu)
                eval_scope[key] = ConfigEvalScope(context=context, cfgu=cfgu, result=result)
        print(eval_scope.keys())
