import os
from typing import Dict, TypedDict

from .eval_command import EvalCommandReturn
from ..core import (
    Command,
)


class ExportCommandParameters(TypedDict):
    data: EvalCommandReturn
    env: bool
    override: bool


ExportCommandReturn = Dict[str, str]


class ExportCommand(Command[ExportCommandReturn]):
    """"""

    parameters: ExportCommandParameters

    def __init__(
        self,
        data: EvalCommandReturn,
        *,
        env: bool = True,
        override: bool = True,
    ) -> None:
        super().__init__(ExportCommandParameters(data=data, env=env, override=override))

    def run(self) -> ExportCommandReturn:
        data = self.parameters["data"]
        env = self.parameters.get("env", True)
        override = self.parameters.get("override", True)
        exported_configs: ExportCommandReturn = {
            key: value["result"]["value"] for key, value in data.items()
        }
        if env:
            for key, value in exported_configs.items():
                if override or key in os.environ:
                    os.environ[key] = value

        return exported_configs
