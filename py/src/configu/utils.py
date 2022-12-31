import json
from typing import TypeVar, Iterable, Callable, Hashable

T = TypeVar("T")


def unique_by(items: Iterable[T], fn: Callable[[T], Hashable]) -> Iterable[T]:
    s = set()
    for i in items:
        key = fn(i)
        if key not in s:
            yield i
            s.add(key)


def pretty_error(msg: str, metadata: dict):
    return f"{msg}; {json.dumps(metadata, indent=2)}"
