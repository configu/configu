from enum import Enum
from functools import reduce
from typing import Dict, Optional, Tuple, TypedDict

from ..core import (
    Cfgu,
    CfguType,
    Command,
    Config,
    ConfigSchema,
    ConfigSet,
    ConfigStore,
    ConfigStoreQuery,
)
from ..utils import error_message, parse_template, render_template


class EvaluatedConfigOrigin(Enum):
    ConfigsOverride = "CONFIGS_OVERRIDE"
    StoreSet = "STORE_SET"
    SchemaTemplate = "SCHEMA_TEMPLATE"
    SchemaDefault = "SCHEMA_DEFAULT"
    EmptyValue = "EMPTY_VALUE"


class EvalCommandReturnContext(TypedDict):
    store: str
    set: str
    schema: str
    key: str
    cfgu: Cfgu


class EvalCommandReturnResult(TypedDict):
    origin: EvaluatedConfigOrigin
    source: str
    value: str


class EvalCommandReturnValue(TypedDict):
    context: EvalCommandReturnContext
    result: EvalCommandReturnResult


EvalCommandReturn = Dict[str, EvalCommandReturnValue]


class EvalCommandParameters(TypedDict):
    store: ConfigStore
    set: ConfigSet
    schema: ConfigSchema
    configs: Optional[Dict[str, str]]
    validate: bool
    previous: Optional[EvalCommandReturn]


class EvalCommand(Command[EvalCommandReturn]):
    """
    The Eval command is used to fetch and validate `Config`s from ConfigStore
    on demand.
    """

    parameters: EvalCommandParameters

    def __init__(
        self,
        *,
        store: ConfigStore,
        set: ConfigSet,
        schema: ConfigSchema,
        configs: Dict[str, str] = None,
        validate: bool = True,
        previous: EvalCommandReturn = None,
    ) -> None:
        """

        :param store: the `configu.core.ConfigStore` from which to fetch
        :param set: the `ConfigSet` to fetch
        :param schema: `ConfigSchema` to validate the config being fetched
        :param configs: a dictionary of overrides to the fetched Config`s
        :param validate: run validation against schema, defaults to True
        :param previous: the previous `EvalCommandReturn` in case of pipes
        """
        super().__init__(
            EvalCommandParameters(
                store=store,
                set=set,
                schema=schema,
                configs=configs,
                validate=validate,
                previous=previous,
            )
        )

    def _eval_from_configs_override(
        self, result: EvalCommandReturn
    ) -> EvalCommandReturn:
        if not self.parameters.get("configs"):
            return {}
        for key, value in result.items():
            if key in self.parameters["configs"]:
                override_value = self.parameters["configs"][key]
                value["result"]["origin"] = EvaluatedConfigOrigin.ConfigsOverride
                value["result"]["source"] = f"parameters.configs.{key}={override_value}"
                value["result"]["value"] = override_value
        return result

    def _eval_from_store_set(self, result: EvalCommandReturn) -> EvalCommandReturn:
        store = self.parameters["store"]
        set_ = self.parameters["set"]
        store_queries = [
            ConfigStoreQuery(key, store_set)
            for store_set in set_.hierarchy
            for key in result
        ]
        store_configs: Dict[str, Config] = {
            result.key: result
            for result in sorted(
                store.get(store_queries),
                key=lambda query_result: len(query_result.set.split(set_.SEPARATOR)),
            )
        }
        for key, value in result.items():
            if key in store_configs:
                store_config = store_configs[key]
                value["result"]["origin"] = EvaluatedConfigOrigin.StoreSet
                value["result"]["source"] = (
                    f"parameters.store={value['context']['store']},"
                    f"parameters.set={value['context']['set']}"
                )
                value["result"]["value"] = store_config.value
        return result

    @staticmethod
    def _eval_from_schema(result: EvalCommandReturn) -> EvalCommandReturn:
        for key, value in result.items():
            context = value["context"]
            cfgu = context["cfgu"]
            if cfgu.template:
                value["result"]["origin"] = EvaluatedConfigOrigin.SchemaTemplate
                value["result"]["source"] = (
                    f"parameters.schema={context['schema']}"
                    f".template={cfgu.template}"
                )
                value["result"]["value"] = ""

            if cfgu.default:
                value["result"]["origin"] = EvaluatedConfigOrigin.SchemaDefault
                value["result"]["source"] = (
                    f"parameters.schema={context['schema']}" f".default={cfgu.default}"
                )
                value["result"]["value"] = cfgu.default
        return result

    def _validate_result(self, result: EvalCommandReturn):
        if self.parameters.get("validate", True):
            error_scope = ["EvalCommand", "run"]
            for key, value in result.items():
                cfgu = value["context"]["cfgu"]
                evaluated_value = value["result"]["value"]
                try:
                    type_test = ConfigSchema.CFGU.VALIDATORS[cfgu.type.value]
                except KeyError as e:
                    raise KeyError(
                        error_message(
                            "invalid type property", error_scope + [key, "type"]
                        ),
                        f"type '{cfgu.type.value}' is not yet supported in this SDK. "
                        "For the time being, please utilize the String type. "
                        "We'd greatly appreciate it if you could open an issue "
                        "regarding this at "
                        "https://github.com/configu/configu/issues/new/choose "
                        "so we can address it in future updates.",
                    ) from e
                test_values = (
                    (
                        evaluated_value,
                        cfgu.pattern,
                    )
                    if cfgu.type == CfguType.REG_EX
                    else (evaluated_value,)
                )
                if not type_test(*test_values):
                    raise ValueError(
                        error_message(
                            f"invalid value type for key '{key}'", error_scope
                        ),
                        f"value '{test_values[0]}' must be a '{cfgu.type}'",
                    )

                if (
                    bool(test_values[0])
                    and cfgu.options is not None
                    and test_values[0] not in cfgu.options
                ):
                    raise ValueError(
                        error_message(f"invalid value for key '{key}'", error_scope),
                        f"value '{test_values[0]}' must be one of "
                        + ",".join([f"'{option}'" for option in cfgu.options]),
                    )

                if cfgu.required is not None and not bool(test_values[0]):
                    raise ValueError(
                        error_message(
                            f"required key '{key}' is missing a value",
                            error_scope,
                        )
                    )
                if bool(test_values[0]) and cfgu.depends is not None:
                    if any(
                        [
                            True
                            for dep in cfgu.depends
                            if dep not in result.keys()
                            or not bool(result[dep]["result"]["value"])
                        ]
                    ):
                        raise ValueError(
                            error_message(
                                f"one or more depends of key '{key}'"
                                f" is missing a value",
                                error_scope,
                            )
                        )

    def _eval_previous(self, result: EvalCommandReturn) -> EvalCommandReturn:
        previous_result = self.parameters.get("previous")
        if not previous_result:
            return {}

        def reduce_prev(
            merged: EvalCommandReturn,
            current: Tuple[str, EvalCommandReturnValue],
        ):
            key, value = current
            if key not in merged or self._should_override_origin(
                value["result"]["origin"],
                merged[key]["result"]["origin"],
            ):
                merged[key] = value
            return merged

        return reduce(
            reduce_prev,
            iter(list(previous_result.items()) + list(result.items())),
            {},
        )

    @staticmethod
    def _eval_templates(result: EvalCommandReturn) -> EvalCommandReturn:
        template_keys = list(
            {
                key
                for key, value in result.items()
                if value["result"]["origin"] == EvaluatedConfigOrigin.SchemaTemplate
            }
        )
        should_render_templates = True
        while len(template_keys) and should_render_templates:
            has_rendered_at_least_once = False
            for key in template_keys:
                context = result[key]["context"]
                template = context["cfgu"].template
                expressions = parse_template(template)
                if any([True for exp in expressions if exp in template_keys]):
                    continue
                context_config_set = ConfigSet(context["set"])
                render_context = {
                    **{key: value["result"]["value"] for key, value in result.items()},
                    "CONFIGU_STORE": {"type": context["store"]},
                    **{
                        "CONFIGU_SET": {
                            "path": context_config_set.path,
                            "hierarchy": context_config_set.hierarchy,
                            "first": context_config_set.hierarchy[0],
                            "last": context_config_set.hierarchy[-1],
                            **{
                                str(index): path
                                for index, path in enumerate(
                                    context_config_set.hierarchy
                                )
                            },
                        }
                    },
                    "CONFIGU_SCHEMA": {"path": context["schema"]},
                }
                result[key]["result"]["value"] = render_template(
                    template, render_context
                )
                template_keys.remove(key)
                has_rendered_at_least_once = True
            should_render_templates = has_rendered_at_least_once
        return result

    @staticmethod
    def _should_override_origin(
        next_origin: EvaluatedConfigOrigin, previous_origin: EvaluatedConfigOrigin
    ) -> bool:
        if previous_origin is None:
            return True
        if previous_origin == EvaluatedConfigOrigin.EmptyValue:
            return next_origin != EvaluatedConfigOrigin.EmptyValue
        if previous_origin == EvaluatedConfigOrigin.SchemaDefault:
            return next_origin in (
                EvaluatedConfigOrigin.SchemaDefault,
                EvaluatedConfigOrigin.StoreSet,
                EvaluatedConfigOrigin.ConfigsOverride,
                EvaluatedConfigOrigin.SchemaTemplate,
            )
        return next_origin in (
            EvaluatedConfigOrigin.StoreSet,
            EvaluatedConfigOrigin.ConfigsOverride,
            EvaluatedConfigOrigin.SchemaTemplate,
        )

    def run(self):
        """
        Runs the eval command.

        :return: `EvalCommandReturn`
        The evaluated configs contains the command's
        results and metadata

        :raises: AnyError If anything bad happens.
        """
        store = self.parameters["store"]
        set_ = self.parameters["set"]
        schema = self.parameters["schema"]
        store.init()
        schema_contents = ConfigSchema.parse(schema)
        result: EvalCommandReturn = {
            key: {
                "context": {
                    "store": store.type,
                    "set": set_.path,
                    "schema": schema.path,
                    "key": key,
                    "cfgu": cfgu,
                },
                "result": {
                    "origin": EvaluatedConfigOrigin.EmptyValue,
                    "source": "",
                    "value": "",
                },
            }
            for key, cfgu in schema_contents.items()
        }

        result = {**result, **self._eval_from_configs_override(result)}

        result = {
            **result,
            **self._eval_from_store_set(
                {
                    key: value
                    for key, value in result.items()
                    if value["result"]["origin"] == EvaluatedConfigOrigin.EmptyValue
                    and not value["context"]["cfgu"].template
                }
            ),
        }

        result = {
            **result,
            **self._eval_from_schema(
                {
                    key: value
                    for key, value in result.items()
                    if value["result"]["origin"] == EvaluatedConfigOrigin.EmptyValue
                }
            ),
        }

        result = {**result, **self._eval_previous(result)}
        result = {**result, **self._eval_templates(result)}
        self._validate_result(result)

        return result
