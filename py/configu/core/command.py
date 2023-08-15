from abc import ABC, abstractmethod
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Generic, TypeVar

CommandReturn = TypeVar("CommandReturn")


@dataclass
class Command(ABC, Generic[CommandReturn]):
    """
    Abstract base class encapsulating a Configu command.
    """

    parameters: Mapping[str, Any]

    @abstractmethod
    def run(self) -> CommandReturn:
        """
        Overridden by individual commands.
        Contains instructions for how to run a command.
        """
