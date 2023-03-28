import graphlib
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import reduce
from typing import List, Dict, Union, Literal, Tuple

from pydantic import BaseModel, Field

from ..core import (
    Command,
    ConfigStore,
    ConfigSet,
    ConfigSchema,
    Cfgu,
    ConfigStoreQuery,
    Config,
    CfguType,
)
from ..utils import (
    is_template_valid,
    error_message,
    render_template,
)


class EvalCommandContext(BaseModel):
    """Base context"""

    store: ConfigStore
    set: ConfigSet
    schema_: ConfigSchema = Field(alias="schema")


class ConfigContext(EvalCommandContext):
    """Base context with ref to a specific key
    from_ is the index of ContextWithOverrides in EvalCommandParameters"""

    key: str
    from_: int = Field(alias="from")


class ConfigEvalScopeResultFrom(BaseModel):
    """"""

    source: Literal[
        "global-override",
        "local-override",
        "store-set",
        "schema-template",
        "schema-default",
        "empty",
    ]
    which: str


class ConfigEvalScopeResult(BaseModel):
    """"""

    value: str
    from_: ConfigEvalScopeResultFrom = Field(alias="from")

    @staticmethod
    def empty() -> "ConfigEvalScopeResult":
        return ConfigEvalScopeResult.parse_obj(
            {"value": "", "from": {"source": "empty", "which": ""}}
        )


class ConfigEvalScope(BaseModel):
    """"""

    context: ConfigContext
    cfgu: Cfgu
    result: ConfigEvalScopeResult


class ConfigsOverrides(Dict[str, str]):
    """Local or global context overrides for configs"""


class ContextWithConfigsOverrides(EvalCommandContext):
    """"""

    configs: ConfigsOverrides = Field(default={})


class EvalCommandParameters(BaseModel):
    """"""

    from_: List[ContextWithConfigsOverrides] = Field(alias="from")
    configs: ConfigsOverrides = Field(default={})


class EvalCommandReturn(BaseModel):
    """"""

    result: Dict[str, str]
    metadata: Dict[
        str,
        Dict[
            str,
            Union[ConfigContext, Cfgu, ConfigEvalScopeResult, str],
        ],
    ]


class EvalScope(Dict[str, ConfigEvalScope]):
    """Dict of ConfigEvalScope by key"""

    def get_empty_sources(self) -> Dict[str, ConfigEvalScope]:
        return {
            key: scope
            for key, scope in self.items()
            if scope.result.from_.source == "empty"
        }

    def get_empty_source_not_template(self) -> Dict[str, ConfigEvalScope]:
        return {
            key: scope
            for key, scope in self.items()
            if scope.result.from_.source == "empty"
            and scope.cfgu.template is None
        }

    def get_source_template(self) -> Dict[str, ConfigEvalScope]:
        return {
            key: scope
            for key, scope in self.items()
            if scope.result.from_.source == "schema-template"
        }

    def validate_scope(self):
        """"""
        error_scope = ["EvalCommand", "run"]
        for key, config_eval_scope in self.items():
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
                        if dep not in self.keys()
                        or not bool(self[dep].result.value)
                    ]
                ):
                    raise ValueError(
                        error_message(
                            f"one or more depends of key '{key}'"
                            f" is missing a value",
                            error_scope,
                        )
                    )

        return self

    def get_result(self) -> EvalCommandReturn:
        result = {"result": {}, "metadata": {}}
        for key, config_eval_scope in self.items():
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


class EvalCommand(Command):
    """"""

    parameters: EvalCommandParameters

    def __init__(self, parameters: Union[EvalCommandParameters, dict]) -> None:
        # todo ? why is this an instance?
        #  is there a situation where we call the same run() twice or more?
        #  if not, it can be static with abstract run(parameters)
        if isinstance(parameters, dict):
            parameters = EvalCommandParameters.parse_obj(parameters)
        super().__init__(parameters)

    @staticmethod
    def _eval_values_from_store(configs_eval_scopes: EvalScope):
        possible_scopes = configs_eval_scopes.get_empty_source_not_template()
        try:
            sample: ConfigEvalScope = random.choice(
                list(possible_scopes.values())
            )
            context = sample.context
            store = context.store
            set_ = context.set
        except IndexError:
            return
        queries = [
            ConfigStoreQuery(key, store_set)
            for store_set in set_.hierarchy
            for key, config_eval_scope in possible_scopes.items()
        ]
        results: Dict[str, Config] = {
            v.key: v
            for v in sorted(
                store.get(queries),
                key=lambda query_result: len(
                    query_result.set.split(set_.SEPARATOR)
                ),
            )
        }
        for key, config in results.items():
            result = possible_scopes[key].result
            result.value = config.value
            result.from_.source = "store-set"
            result.from_.which = (
                f"parameters.from[{context.from_}]"
                f":store={store.type}"
                f":set={set_.path}"
            )

    @staticmethod
    def _eval_values_from_schema(
        configs_eval_scopes: EvalScope,
    ):
        for (
            key,
            config_eval_scope,
        ) in configs_eval_scopes.get_empty_sources().items():
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

    def _eval_configs_scopes(
        self,
        from_: int,
        context_with_overrides: ContextWithConfigsOverrides,
        global_overrides: ConfigsOverrides,
    ) -> EvalScope:
        local_overrides = self.parameters.from_[from_].configs
        context_with_overrides.store.init()
        schema_contents = ConfigSchema.parse(context_with_overrides.schema_)
        configs_eval_scopes = EvalScope()
        config_context = {
            "store": context_with_overrides.store,
            "set": context_with_overrides.set,
            "schema": context_with_overrides.schema_,
            "from": from_,
        }

        for key, cfgu in schema_contents.items():
            context = ConfigContext(**config_context, key=key)
            result = ConfigEvalScopeResult.empty()
            if key in global_overrides:
                result.value = global_overrides.get(key)
                result.from_.source = "global-override"
                result.from_.which = f"parameters.configs.{key}={result.value}"
            elif key in local_overrides:
                result.value = local_overrides.get(key)
                result.from_.source = "local-override"
                result.from_.which = (
                    f"parameters.from[{from_}].configs.{key}={result.value}"
                )
            configs_eval_scopes[key] = ConfigEvalScope(
                context=context,
                cfgu=cfgu,
                result=result,
            )
        self._eval_values_from_store(configs_eval_scopes)
        self._eval_values_from_schema(configs_eval_scopes)
        return configs_eval_scopes

    def _eval_configs_eval_scopes(self):
        configs_eval_scopes_array = []
        with ThreadPoolExecutor(
            max_workers=len(self.parameters.from_)
        ) as executor:
            global_overrides = self.parameters.configs
            future_configs_scopes = {
                executor.submit(
                    self._eval_configs_scopes,
                    from_,
                    context_with_overrides,
                    global_overrides,
                ): from_
                for from_, context_with_overrides in enumerate(
                    self.parameters.from_
                )
            }
            for future in as_completed(future_configs_scopes):
                from_ = future_configs_scopes[future]
                try:
                    configs_eval_scopes: EvalScope = future.result()
                except Exception as exc:
                    print("%r generated an exception: %s" % (from_, exc))
                else:
                    configs_eval_scopes_array.append(
                        (from_, configs_eval_scopes)
                    )
        return [
            v[1]
            for v in sorted(
                configs_eval_scopes_array, key=lambda scope: scope[0]
            )
        ]

    @staticmethod
    def _eval_scope(ordered_eval_scopes: List[EvalScope]) -> EvalScope:
        """"""
        config_scopes: Tuple[ConfigEvalScope] = tuple(
            [
                scope
                for scopes in ordered_eval_scopes
                for scope in scopes.values()
            ]
        )

        def reduce_scopes(
            eval_scope_acc: EvalScope, config_scope: ConfigEvalScope
        ) -> EvalScope:
            key = config_scope.context.key
            if key not in eval_scope_acc or (
                eval_scope_acc[key].result.from_.source == "empty"
                and config_scope.result.from_.source != "empty"
            ):
                eval_scope_acc[key] = config_scope
            return eval_scope_acc

        eval_scope: EvalScope = reduce(
            reduce_scopes, reversed(config_scopes), EvalScope()
        )

        def render_templates():
            template_keys = eval_scope.get_source_template().keys()
            template_keys_graph = graphlib.TopologicalSorter()
            render_context = {
                key: value.result.value for key, value in eval_scope.items()
            }

            for key in template_keys:
                template = eval_scope[key].cfgu.template
                is_valid, template_vars = is_template_valid(template, key)
                dependencies = [i for i in template_vars if i in template_keys]
                if is_valid:
                    template_keys_graph.add(key, *dependencies)

            for key in template_keys_graph.static_order():
                config_eval_scope = eval_scope[key]
                set_ = config_eval_scope.context.set
                configu_set = {
                    "path": set_.path,
                    "first": set_.hierarchy[0],
                    "last": set_.hierarchy[-1],
                }
                configu_set.update(
                    {
                        str(index): path
                        for index, path in enumerate(set_.hierarchy)
                    }
                )
                render_context["CONFIGU_SET"] = configu_set
                template = config_eval_scope.cfgu.template
                render_context[
                    key
                ] = config_eval_scope.result.value = render_template(
                    template, render_context
                )

        render_templates()
        return eval_scope

    def run(self) -> EvalCommandReturn:
        ordered_desc_eval_scopes = self._eval_configs_eval_scopes()
        eval_scope = self._eval_scope(ordered_desc_eval_scopes)
        return eval_scope.validate_scope().get_result()
