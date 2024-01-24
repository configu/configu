import json
import re
from typing import Any, Dict, List, Tuple

import chevron
import jsonschema


class ConfigError(Exception):
    _reason: str
    _hint: str
    _scope: List[Tuple[str, str]]

    def __init__(
        self, *, reason: str, hint: str = "", scope: List[Tuple[str, str]] = None
    ) -> None:
        self._reason = reason
        self._hint = hint
        self._scope = scope or []
        super().__init__()

    def set_reason(self, reason: str):
        self._reason = reason
        return self

    def set_hint(self, hint: str):
        self._hint = hint
        return self

    def append_scope(self, scope: List[Tuple[str, str]]):
        # Append is a method that adds an item to the end of a list.
        scope.extend(self._scope)
        self._scope = scope
        return self

    def __str__(self):
        formatted_scope = ".".join([f"{domain}:{name}" for domain, name in self._scope])
        scope_str = f" at {formatted_scope}" if self._scope else ""
        hint_str = f", {self._hint}" if self._hint else ""
        return f"{self._reason}{scope_str}{hint_str}"


def is_valid_name(name: str) -> bool:
    naming_pattern = r"^[A-Za-z0-9_-]+$"
    reserved_names = ["_", "-", "this", "cfgu"]
    return name not in reserved_names and re.match(naming_pattern, name) is not None


def parse_template(template: str) -> List[str]:
    template_vars = []
    for tag_type, tag_key in chevron.tokenizer.tokenize(template):
        if tag_type not in ["variable", "literal"]:
            raise ConfigError(
                reason=f"template '{template}' mustn't contain unsupported tokens"
            )
        if tag_type == "variable":
            template_vars.append(tag_key)
    return template_vars


def render_template(template: str, context: Dict[str, Any]) -> str:
    return chevron.render(template, context)


def is_valid_json_schema(schema: Dict[str, Any], value: Any) -> bool:
    try:
        instance = value if isinstance(value, dict) else json.loads(value)
        jsonschema.validate(instance=instance, schema=schema)
        return True
    except (Exception,):
        return False
