from typing import List, Dict, Union, Literal, Optional, Any

from pydantic import BaseModel, Field

from ..model import Command, ConfigStore, ConfigSet, ConfigSchema, Cfgu, ConfigStoreQuery


class EvalCommandFromParameter(BaseModel):
    """"""
    store: ConfigStore
    set: ConfigSet
    schema_: ConfigSchema = Field(alias='schema')


EvaluatedConfigSource = Literal[
    'global-override',
    'local-override',
    'store-set',
    'schema-template',
    'schema-default',
    'empty'
]


class ConfigEvalScopeContext(EvalCommandFromParameter):
    key: str
    from_: int


class ConfigEvalScopeResultFrom(BaseModel):
    source: EvaluatedConfigSource
    which: str


class ConfigEvalScopeResult(BaseModel):
    value: str
    from_: ConfigEvalScopeResultFrom


class ConfigEvalScope(BaseModel):
    context: ConfigEvalScopeContext
    cfgu: Cfgu
    result: ConfigEvalScopeResult


class EvalScope:
    def __init__(self):
        self.scopes = {}

    def __getitem__(self, key: str) -> ConfigEvalScope:
        return self.scopes[key]

    def __setitem__(self, key: str, value: ConfigEvalScope):
        self.scopes[key] = value


class EvalCommandFromParameterWithOverrides(EvalCommandFromParameter):
    configs: Optional[Dict[str, str]]


class EvalCommandParameters(BaseModel):
    """"""
    from_: List[EvalCommandFromParameterWithOverrides] = Field(alias='from')
    configs: Optional[Dict[str, str]]


class EvalCommand(Command):
    parameters: EvalCommandParameters

    def __init__(self, parameters: Union[EvalCommandParameters, dict]) -> None:
        if isinstance(parameters, dict):
            parameters = EvalCommandParameters.parse_obj(parameters)
        super().__init__(parameters)

    def _get_result_from_schema(self, context: ConfigEvalScopeContext, cfgu: Cfgu) -> ConfigEvalScopeResult:
        if cfgu.template is not None:
            from_ = ConfigEvalScopeResultFrom(source='schema-template',
                                              which=f'parameters.from[{context.from_}]:schema.template={cfgu.template}')
            return ConfigEvalScopeResult(value='', from_=from_)
        elif cfgu.default is not None:
            value = cfgu.default
            from_ = ConfigEvalScopeResultFrom(source='schema-default',
                                              which=f'parameters.from[{context.from_}]:schema.default={cfgu.default}')

        return ConfigEvalScopeResult(value='', from_=ConfigEvalScopeResultFrom(source='empty', which=''))

    def _get_result_from_store(self, context: ConfigEvalScopeContext, cfgu: Cfgu) -> ConfigEvalScopeResult:
        if cfgu.template is None:
            queries = [ConfigStoreQuery(context.key, store_set) for store_set in context.set.hierarchy]
            results = context.store.get(queries)
            results = sorted(results, key=lambda query_result: len(query_result.set.split(context.set.SEPARATOR)))
            if len(results):
                value = results[-1].value
                from_ = ConfigEvalScopeResultFrom(source='store-set',
                                                  which=f'parameters.from[{context.from_}]:store={context.store.type}'
                                                        f':set={context.set.path}')
                return ConfigEvalScopeResult(value=value, from_=from_)
        return self._get_result_from_schema(context, cfgu)

    def _get_result(self, context: ConfigEvalScopeContext, cfgu: Cfgu) -> ConfigEvalScopeResult:
        if self.parameters.configs is not None and context.key in self.parameters.configs:
            value = self.parameters.configs.get(context.key)
            from_ = ConfigEvalScopeResultFrom(source='global-override',
                                              which=f'parameters.configs.{context.key}={value}')
            return ConfigEvalScopeResult(value=value, from_=from_)
        if all([
            context.from_ < len(self.parameters.from_),
            self.parameters.from_[context.from_].configs is not None,
        ]) and context.key in self.parameters.from_[context.from_].configs:
            value = self.parameters.from_[context.from_].configs.get('key')
            from_ = ConfigEvalScopeResultFrom(source='local-override',
                                              which=f'parameters.from[{context.from_}].configs.{context.key}=${value}')
            return ConfigEvalScopeResult(value=value, from_=from_)
        return self._get_result_from_store(context, cfgu)
        # return ConfigEvalScopeResult(value='', from_=ConfigEvalScopeResultFrom(source='empty', which=''))

    def run(self) -> Any:
        eval_scope = EvalScope()
        for i, eval_from in enumerate(self.parameters.from_):
            eval_from.store.init()
            schema_contents = ConfigSchema.parse(eval_from.schema_)
            for key, cfgu in schema_contents.items():
                context = ConfigEvalScopeContext(store=eval_from.store, set=eval_from.set, schema=eval_from.schema_,
                                                 key=key, from_=i)
                result = self._get_result(context, cfgu)
                eval_scope[key] = ConfigEvalScope(context=context, cfgu=cfgu, result=result)
        print(eval_scope.scopes.keys())
