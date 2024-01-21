from typing import Dict, Optional, TypedDict

from . import EvalCommandReturn
from .eval_command import EvaluatedConfigOrigin
from ..core import (
    Command,
    Config,
    ConfigSchema,
    ConfigSet,
    ConfigStore,
)
from ..utils import ConfigError


class UpsertCommandParameters(TypedDict):
    store: ConfigStore
    set: ConfigSet
    schema: ConfigSchema
    configs: Dict[str, str]
    pipe: Optional[EvalCommandReturn]


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
        configs: Optional[Dict[str, str]] = None,
        pipe: Optional[EvalCommandReturn] = None,
    ) -> None:
        """
        Creates a new UpsertCommand.
        :param store: the `configu.core.ConfigStore` to which the command will write
        :param set: the `configu.core.ConfigSet` to which the command will write
        :param schema: `configu.core.ConfigSchema` to validate config being written
        :param configs: a dictionary of configs to upsert
        """
        configs = configs or {}
        pipe = pipe or {}
        super().__init__(
            UpsertCommandParameters(
                store=store, set=set, schema=schema, configs=configs, pipe=pipe
            )
        )

    def run(self):
        """Validates the configs against the schema and upsert to the store

        :raises ConfigError: if any config is invalid for the schema
        """
        store = self.parameters["store"]
        set_ = self.parameters["set"]
        schema = self.parameters["schema"]
        configs = self.parameters["configs"]
        pipe = self.parameters["pipe"]
        if not configs and not pipe:
            return
        store.init()
        piped_configs = {
            key: value["result"]["value"]
            for key, value in pipe.items()
            if schema.contents.get(key)
            and not schema.contents[key].template
            and value["result"]["origin"] != EvaluatedConfigOrigin.EmptyValue
            and value["result"]["origin"] != EvaluatedConfigOrigin.SchemaDefault
        }
        upsert_configs = []
        for key, value in {**piped_configs, **configs}.items():
            error_scope = [
                (
                    "UpsertCommand",
                    f"store:{store.type};set:{set_.path};schema:{schema.name}",
                ),
                ("parameters.configs", f"key:{key};value:{value}"),
            ]
            cfgu = schema.contents.get(key)
            if cfgu is None:
                raise ConfigError(
                    reason="invalid config key",
                    hint=f"key '{key}' must be declared on schema '{schema.name}'",
                    scope=error_scope,
                )
            if value:
                if cfgu.template is not None:
                    raise ConfigError(
                        reason="invalid config value",
                        hint="keys declared with template mustn't have a value",
                        scope=error_scope,
                    )
                try:
                    ConfigSchema.CFGU["VALIDATORS"]["valueOptions"](cfgu, value)
                    ConfigSchema.CFGU["VALIDATORS"]["valueType"](cfgu, value)
                except (Exception,) as e:
                    if isinstance(e, ConfigError):
                        raise e.append_scope(error_scope)
                    raise e

            upsert_configs.append(Config(set=set_.path, key=key, value=value))
        store.set(upsert_configs)
