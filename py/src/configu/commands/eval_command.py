from dataclasses import dataclass
from typing import List, Dict, Union, Literal, Optional, Any

from pydantic import BaseModel, Field

from ..model import Command, ConfigStore, ConfigSet, ConfigSchema, Cfgu, ConfigStoreQuery, CfguType
from ..utils import parse_template, render_template, error_message


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


class EvalCommandReturn(BaseModel):
    result: Dict[str, str]
    metadata: Dict[str, Dict[str, Union[ConfigEvalScope, str]]]


def _eval_results_from_store(context: ConfigEvalScopeContext, cfgu: Cfgu) -> ConfigEvalScopeResult:
    if cfgu.template is None:
        queries = [ConfigStoreQuery(context.key, store_set) for store_set in context.set.hierarchy]
        results = context.store.get(queries)
        results = sorted(results, key=lambda query_result: len(query_result.set.split(context.set.SEPARATOR)))
        if len(results):
            value = results[-1].value
            which = f'parameters.from[{context.from_}]:store={context.store.type}:set={context.set.path}'
            from_ = ConfigEvalScopeResultFrom(source='store-set', which=which)
            return ConfigEvalScopeResult(value=value, from_=from_)
    return _eval_results_from_schema(context, cfgu)


def _eval_results_from_schema(context: ConfigEvalScopeContext, cfgu: Cfgu) -> ConfigEvalScopeResult:
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


def _validate_scope(eval_scope):
    error_scope = ['EvalCommand', 'run']
    result = {
        "result": {},
        "metadata": {}
    }
    for key, config_eval_scope in eval_scope.items():
        if config_eval_scope.cfgu.template is not None:
            template_vars = parse_template(config_eval_scope.cfgu.template)
            template_values = {var: value.result.value for var, value in eval_scope.items() if var in template_vars}
            config_eval_scope.result.value = render_template(config_eval_scope.cfgu.template, template_values)
        type_test = ConfigSchema.SchemaDefinition.VALIDATORS.get(config_eval_scope.cfgu.type.value, lambda: False)
        test_values = (config_eval_scope.result.value,
                       config_eval_scope.cfgu.pattern) if config_eval_scope.cfgu.type == CfguType.REG_EX \
            else (config_eval_scope.result.value,)
        if not type_test(*test_values):
            raise ValueError(error_message(f"invalid value type for key '{key}'", error_scope),
                             f"value '{test_values[0]}' must be a '{config_eval_scope.cfgu.type}'")
        if config_eval_scope.cfgu.required is not None and not bool(test_values[0]):
            raise ValueError(error_message(f"required key '{key}' is missing a value", error_scope))
        if bool(test_values[0]) and config_eval_scope.cfgu.depends is not None:
            if any([True for dep in config_eval_scope.cfgu.depends if
                    dep not in eval_scope.keys() or not bool(eval_scope[dep].result.value)]):
                raise ValueError(
                    error_message(f"one or more depends of key '{key}' is missing a value", error_scope))
        result['result'][key] = test_values[0]
        result['metadata'][key] = {
            "key": key,
            "value": test_values[0],
            "context": config_eval_scope
        }
    return EvalCommandReturn.parse_obj(result)


class EvalCommand(Command):
    parameters: EvalCommandParameters

    def __init__(self, parameters: Union[EvalCommandParameters, dict]) -> None:
        if isinstance(parameters, dict):
            parameters = EvalCommandParameters.parse_obj(parameters)
        super().__init__(parameters)

    def _eval_results_from_override(self, context: ConfigEvalScopeContext, cfgu: Cfgu) -> ConfigEvalScopeResult:
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
        return _eval_results_from_store(context, cfgu)

    def _evaluate_scope(self):
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
                result = self._eval_results_from_override(context, cfgu)
                eval_scope[key] = ConfigEvalScope(context=context, cfgu=cfgu, result=result)
        return eval_scope

    def run(self) -> EvalCommandReturn:
        eval_scope = self._evaluate_scope()
        result = _validate_scope(eval_scope)

        return result
