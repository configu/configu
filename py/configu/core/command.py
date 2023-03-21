from abc import abstractmethod, ABC
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any


@dataclass
class Command(ABC):
    """"""

    parameters: Mapping[str, Any]

    @abstractmethod
    def run(self) -> Any:
        pass
