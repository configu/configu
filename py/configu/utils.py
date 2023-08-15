import re
from typing import Any, Dict, List, Optional

import chevron


def error_message(
    message: str,
    location: Optional[List[str]] = None,
    suggestion: Optional[str] = None,
) -> str:
    location = f"at {' > '.join(location)}" if location else None
    return " ".join(
        [detail for detail in [message, location, suggestion] if detail is not None]
    )


def is_valid_name(name: str) -> bool:
    naming_pattern = r"^[A-Za-z0-9_-]*$"
    reserved_names = ["_", "-", "this", "cfgu"]
    return name not in reserved_names and re.match(naming_pattern, name) is not None


def parse_template(template: str) -> List[str]:
    template_vars = []
    for tag_type, tag_key in chevron.tokenizer.tokenize(template):
        if tag_type not in ["variable", "literal"]:
            raise Exception(
                error_message(f'invalid template "{template}"', ["Template", "parse"])
            )
        if tag_type == "variable":
            template_vars.append(tag_key)
    return template_vars


def render_template(template: str, context: Dict[str, Any]) -> str:
    return chevron.render(template, context)
