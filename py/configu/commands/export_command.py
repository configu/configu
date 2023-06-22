from typing import Dict, TypedDict

from .eval_command import EvalCommandReturn
from ..core import (
    Command,
)

ExportCommandParameters = TypedDict(
    "ExportCommandParameters",
    {
        "data": EvalCommandReturn,
    },
)

ExportCommandReturn = Dict[str, str]


class ExportCommand(Command[ExportCommandReturn]):
    """"""

    parameters: ExportCommandParameters

    def __init__(self, parameters: ExportCommandParameters) -> None:
        super().__init__(parameters)

    def run(self):
        data = self.parameters["data"]
        return {key: value["result"]["value"] for key, value in data.items()}
