import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from copy import deepcopy
from functools import reduce
from typing import List, Dict, Union, Literal

from pydantic import BaseModel, Field

from ..core import (
    Command,
    ConfigStore,
    ConfigSet,
    ConfigSchema,
    Cfgu,
    ConfigStoreQuery,
    Config,
)
from ..core.command import CommandReturn
from ..core.generated import ConfigSchemaContentsValue, CfguType
from ..utils import (
    render_template,
    parse_template,
    error_message,
)


class EvalCommandFromParameter(BaseModel):
    """"""

    store: ConfigStore
    set: ConfigSet
    schema_: ConfigSchema = Field(alias="schema")


class EvalCommandConfigsParameter(Dict[str, str]):
    """Dict with key:value"""


class FromParameterWithConfigsParameter(EvalCommandFromParameter):
    """"""

    configs: EvalCommandConfigsParameter = Field(
        default=EvalCommandConfigsParameter()
    )


class EvalCommandParameters(BaseModel):
    """"""

    from_: List[FromParameterWithConfigsParameter] = Field(alias="from")
    configs: EvalCommandConfigsParameter = Field(
        default=EvalCommandConfigsParameter()
    )


EvaluatedConfigSource = Literal[
    "global-override",
    "local-override",
    "store-set",
    "schema-template",
    "schema-default",
    "empty",
]


class FromParameterWithKeyAndFrom(EvalCommandFromParameter):
    """"""

    key: str
    from_: int = Field(alias="from")


class ConfigEvalScopeResultFrom(BaseModel):
    """"""

    source: EvaluatedConfigSource
    which: str


class ConfigEvalScopeResult(BaseModel):
    """"""

    value: str
    from_: ConfigEvalScopeResultFrom = Field(alias="from")


class ConfigEvalScope(BaseModel):
    """"""

    context: FromParameterWithKeyAndFrom
    cfgu: Union[Cfgu, ConfigSchemaContentsValue]
    result: ConfigEvalScopeResult


class EvalScope(Dict[str, ConfigEvalScope]):
    """"""


class EvalCommandReturn(BaseModel):
    """"""

    result: Dict[str, str]
    metadata: Dict[
        str,
        Dict[
            str,
            Union[
                FromParameterWithKeyAndFrom,
                Cfgu,
                ConfigEvalScopeResult,
                ConfigSchemaContentsValue,
                str,
            ],
        ],
    ]


class EvalCommand(Command[EvalCommandReturn]):
    """"""

    parameters: EvalCommandParameters

    def __init__(self, parameters: Union[EvalCommandParameters, dict]) -> None:
        if isinstance(parameters, dict):
            parameters = EvalCommandParameters.parse_obj(parameters)
        super().__init__(parameters)

    def _eval_from_override(
        self,
        eval_scope: Union[EvalScope, Dict[str, ConfigEvalScope]],
    ) -> Dict[str, ConfigEvalScope]:
        for key, current in eval_scope.items():
            context = current.context
            result = current.result
            global_override = self.parameters.configs.get(key)
            local_override = self.parameters.from_[context.from_].configs.get(
                key
            )
            if global_override is not None:
                result.value = global_override
                result.from_.source = "global-override"
                result.from_.which = f"parameters.configs.{key}={result.value}"

            elif local_override is not None:
                result.value = local_override
                result.from_.source = "local-override"
                result.from_.which = (
                    f"parameters.from[{context.from_}]"
                    f".configs.{key}={result.value}"
                )

        return eval_scope

    @staticmethod
    def _eval_from_store(
        eval_scope: Union[EvalScope, Dict[str, ConfigEvalScope]],
    ) -> Dict[str, ConfigEvalScope]:
        try:
            sample: ConfigEvalScope = random.choice(list(eval_scope.values()))
            context = sample.context
            store = context.store
            set_ = context.set
        except IndexError:
            return eval_scope
        queries = [
            ConfigStoreQuery(key, store_set)
            for store_set in set_.hierarchy
            for key, config_eval_scope in eval_scope.items()
        ]
        results: Dict[str, Config] = {
            result.key: result
            for result in sorted(
                store.get(queries),
                key=lambda query_result: len(
                    query_result.set.split(set_.SEPARATOR)
                ),
            )
        }
        for key, config in results.items():
            result = eval_scope[key].result
            result.value = config.value
            result.from_.source = "store-set"
            result.from_.which = (
                f"parameters.from[{context.from_}]"
                f":store={store.type}"
                f":set={set_.path}"
            )

        return eval_scope

    @staticmethod
    def _eval_from_schema(
        eval_scope: Union[EvalScope, Dict[str, ConfigEvalScope]],
    ) -> Union[EvalScope, Dict[str, ConfigEvalScope]]:
        for (
            key,
            config_eval_scope,
        ) in eval_scope.items():
            cfgu = config_eval_scope.cfgu
            context = config_eval_scope.context
            result = config_eval_scope.result
            if cfgu.template is not None:
                result.value = ""
                result.from_.source = "schema-template"
                result.from_.which = (
                    f"parameters.from[{context.from_}]"
                    f":schema.template={cfgu.template}"
                )
            if cfgu.default is not None:
                result.value = cfgu.default
                result.from_.source = "schema-default"
                result.from_.which = (
                    f"parameters.from[{context.from_}]"
                    f":schema.default={cfgu.default}"
                )
        return eval_scope

    def _eval_from_parameter(
        self,
        index: int,
        from_parameter: FromParameterWithConfigsParameter,
    ) -> EvalScope:
        from_parameter.store.init()
        schema_contents = ConfigSchema.parse(from_parameter.schema_)
        eval_scope = EvalScope()
        for key, cfgu in schema_contents.items():
            config_context = {
                "store": from_parameter.store,
                "set": from_parameter.set,
                "schema": from_parameter.schema_,
                "from": index,
            }
            context = FromParameterWithKeyAndFrom(**config_context, key=key)
            result = ConfigEvalScopeResult.parse_obj(
                {"value": "", "from": {"source": "empty", "which": ""}}
            )
            eval_scope[key] = ConfigEvalScope(
                context=context,
                cfgu=cfgu,
                result=result,
            )
        eval_scope = {
            **eval_scope,
            **self._eval_from_override(deepcopy(eval_scope)),
        }
        eval_scope = {
            **eval_scope,
            **self._eval_from_store(
                deepcopy(
                    {
                        key: scope
                        for key, scope in eval_scope.items()
                        if scope.result.from_.source == "empty"
                        and scope.cfgu.template is None
                    }
                )
            ),
        }
        eval_scope = {
            **eval_scope,
            **self._eval_from_schema(
                deepcopy(
                    {
                        key: scope
                        for key, scope in eval_scope.items()
                        if scope.result.from_.source == "empty"
                    }
                )
            ),
        }
        return eval_scope

    def _eval_from_parameters(self):
        eval_scope_array = []
        with ThreadPoolExecutor() as executor:
            eval_scope_futures = {
                executor.submit(
                    self._eval_from_parameter, index, from_parameter
                ): index
                for index, from_parameter in enumerate(self.parameters.from_)
            }
            for future in as_completed(eval_scope_futures):
                index = eval_scope_futures[future]
                try:
                    eval_scope: EvalScope = future.result()
                except Exception as e:
                    print(f"_eval_from_parameter({index}) raised: {e}")
                else:
                    eval_scope_array.append((index, eval_scope))
        return [
            v[1] for v in sorted(eval_scope_array, key=lambda scope: scope[0])
        ]

    @staticmethod
    def _eval_scope(ordered_eval_scopes: List[EvalScope]) -> EvalScope:
        """"""

        def reduce_scopes(
            scope: EvalScope, current_scope: ConfigEvalScope
        ) -> EvalScope:
            key = current_scope.context.key
            if key not in scope or (
                scope[key].result.from_.source == "empty"
                and current_scope.result.from_.source != "empty"
            ):
                scope[key] = current_scope
            return scope

        eval_scope: EvalScope = reduce(
            reduce_scopes,
            reversed(
                [
                    scope
                    for scopes in ordered_eval_scopes
                    for scope in scopes.values()
                ]
            ),
            EvalScope(),
        )

        template_keys = list(
            {
                key: scope
                for key, scope in eval_scope.items()
                if scope.result.from_.source == "schema-template"
            }.keys()
        )

        render_context = {
            key: value.result.value for key, value in eval_scope.items()
        }

        run_again = True
        while len(template_keys) > 0 and run_again:
            has_rendered = False
            for key in deepcopy(template_keys):
                current: ConfigEvalScope = eval_scope[key]
                template: str = current.cfgu.template
                expressions = parse_template(template)
                if any([True for exp in expressions if exp in template_keys]):
                    continue

                eval_scope[key].result.value = render_template(
                    template,
                    {
                        **render_context,
                        **{
                            "CONFIGU_SET": {
                                "path": current.context.set.path,
                                "first": current.context.set.hierarchy[0],
                                "last": current.context.set.hierarchy[-1],
                                **{
                                    str(index): path
                                    for index, path in enumerate(
                                        current.context.set.hierarchy
                                    )
                                },
                            }
                        },
                    },
                )
                template_keys.remove(key)
                has_rendered = True
            run_again = has_rendered

        return eval_scope

    @staticmethod
    def _validate_scope(scope: EvalScope):
        """"""
        error_scope = ["EvalCommand", "run"]
        for key, config_eval_scope in scope.items():
            type_test = ConfigSchema.CFGU.VALIDATORS.get(
                config_eval_scope.cfgu.type.value, lambda: False
            )
            test_values = (
                (
                    config_eval_scope.result.value,
                    config_eval_scope.cfgu.pattern,
                )
                if config_eval_scope.cfgu.type == CfguType.REG_EX
                else (config_eval_scope.result.value,)
            )
            if not type_test(*test_values):
                raise ValueError(
                    error_message(
                        f"invalid value type for key '{key}'", error_scope
                    ),
                    f"value '{test_values[0]}' must be"
                    f" a '{config_eval_scope.cfgu.type}'",
                )
            if config_eval_scope.cfgu.required is not None and not bool(
                test_values[0]
            ):
                raise ValueError(
                    error_message(
                        f"required key '{key}' is missing a value", error_scope
                    )
                )
            if (
                bool(test_values[0])
                and config_eval_scope.cfgu.depends is not None
            ):
                if any(
                    [
                        True
                        for dep in config_eval_scope.cfgu.depends
                        if dep not in scope.keys()
                        or not bool(scope[dep].result.value)
                    ]
                ):
                    raise ValueError(
                        error_message(
                            f"one or more depends of key '{key}'"
                            f" is missing a value",
                            error_scope,
                        )
                    )

    def run(self) -> CommandReturn:
        eval_scope_array = self._eval_from_parameters()
        eval_scope = self._eval_scope(eval_scope_array)
        self._validate_scope(eval_scope)
        result = {"result": {}, "metadata": {}}
        for key, config_eval_scope in eval_scope.items():
            value = config_eval_scope.result.value
            result["result"][key] = value
            result["metadata"][key] = {
                "key": key,
                "value": value,
                "context": config_eval_scope.context,
                "cfgu": config_eval_scope.cfgu,
                "result": config_eval_scope.result,
            }
        return EvalCommandReturn.parse_obj(result)
