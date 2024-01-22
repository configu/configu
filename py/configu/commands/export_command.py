import os
from typing import Dict, TypedDict

from .eval_command import EvalCommandReturn
from ..core import (
    Command,
)


class ExportCommandParameters(TypedDict):
    pipe: EvalCommandReturn
    env: bool
    override: bool


ExportCommandReturn = Dict[str, str]


class ExportCommand(Command[ExportCommandReturn]):
    """"""

    parameters: ExportCommandParameters

    def __init__(
        self,
        pipe: EvalCommandReturn,
        *,
        env: bool = True,
        override: bool = True,
    ) -> None:
        super().__init__(ExportCommandParameters(pipe=pipe, env=env, override=override))

    def run(self) -> ExportCommandReturn:
        env = self.parameters.get("env", True)
        override = self.parameters.get("override", True)
        pipe = self.parameters["pipe"]
        exported_configs: ExportCommandReturn = {
            key: value["result"]["value"] for key, value in pipe.items()
        }
        if env:
            for key, value in exported_configs.items():
                if override or key not in os.environ:
                    os.environ[key] = value

        return exported_configs
