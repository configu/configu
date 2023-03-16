import re
from typing import Optional, List


def error_message(message: str, location: Optional[List[str]] = None, suggestion: Optional[str] = None) -> str:
    location = f"at {' > '.join(location)}" if location else None
    return " ".join([detail for detail in [message, location, suggestion] if detail is not None])


def is_valid_name(name: str) -> bool:
    naming_pattern = r'^[A-Za-z0-9_-]*$'
    reserved_names = ['_', '-', 'this', 'cfgu']
    return name not in reserved_names and re.match(naming_pattern, name) is not None

# TODO TMPL
