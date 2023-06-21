from abc import abstractmethod
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Generic, TypeVar

CommandReturn = TypeVar("CommandReturn")


@dataclass
class Command(Generic[CommandReturn]):
    """"""

    parameters: Mapping[str, Any]

    @abstractmethod
    def run(self) -> CommandReturn:
        """"""
