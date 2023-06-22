import os
from typing import Dict, TypedDict

from .eval_command import EvalCommandReturn
from ..core import (
    Command,
)

ExportCommandParameters = TypedDict(
    "ExportCommandParameters",
    {
        "data": EvalCommandReturn,
        "env": bool,
        "override": bool,
    },
    total=False,
)

ExportCommandReturn = Dict[str, str]


class ExportCommand(Command[ExportCommandReturn]):
    """"""

    parameters: ExportCommandParameters

    def __init__(self, parameters: ExportCommandParameters) -> None:
        super().__init__(parameters)

    def run(self):
        data = self.parameters["data"]
        env = self.parameters.get("env", True)
        override = self.parameters.get("override", True)
        exported_configs = {
            key: value["result"]["value"] for key, value in data.items()
        }
        if env:
            for key, value in exported_configs.items():
                if override or key in os.environ:
                    os.environ[key] = value

        return exported_configs
