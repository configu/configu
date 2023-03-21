import re
from typing import Optional, List, Dict

import chevron


def error_message(
    message: str,
    location: Optional[List[str]] = None,
    suggestion: Optional[str] = None,
) -> str:
    location = f"at {' > '.join(location)}" if location else None
    return " ".join(
        [
            detail
            for detail in [message, location, suggestion]
            if detail is not None
        ]
    )


def is_valid_name(name: str) -> bool:
    naming_pattern = r"^[A-Za-z0-9_-]*$"
    reserved_names = ["_", "-", "this", "cfgu"]
    return (
        name not in reserved_names
        and re.match(naming_pattern, name) is not None
    )


def parse_template(template: str) -> List[str]:
    return [
        var
        for var_type, var in chevron.tokenizer.tokenize(template)
        if var_type == "variable"
    ]


def render_template(template: str, context: Dict[str, str]) -> str:
    return chevron.render(template, context)


def is_template_valid(
    template: str,
    scope_keys: List[str],
    key=str,
    validate_all_existing: bool = False,
) -> bool:
    print(scope_keys)
    template_vars = parse_template(template)
    is_valid = len(template_vars) > 0 and key not in template_vars
    if validate_all_existing:
        is_valid = is_valid and all(
            [
                False
                for template_var in template_vars
                if template_var not in scope_keys
            ]
        )
    return is_valid
