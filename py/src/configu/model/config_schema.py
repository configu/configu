import functools
import json
import re
from dataclasses import dataclass
from itertools import cycle
from json import JSONDecodeError
from pathlib import Path
from typing import Dict, Callable, List

import pyvalidator as validator

from .generated import ConfigSchema as IConfigSchema, Cfgu, ConfigSchemaType, CfguType, from_dict
from ..utils import error_message, is_valid_name


@dataclass
class ConfigSchemaDefinition:
    NAME: str = 'cfgu'
    EXT: str = '.cfgu'
    VALIDATORS: Dict[str, Callable[[str], bool]] = None

    def __post_init__(self):
        if self.VALIDATORS is None:
            self.VALIDATORS = {
                "Boolean": validator.is_boolean,
                "Number": validator.is_number,
                "String": lambda value: isinstance(value, str),
                "UUID": validator.is_uuid,
                "SemVer": validator.is_semantic_version,
                "Email": validator.is_email,
                "MobilePhone": validator.is_mobile_number,
                "LatLong": validator.is_lat_long,
                "Color": lambda value: (
                    validator.is_hexadecimal(value)
                    or validator.is_hsl(value)
                    or validator.is_rgb_color(value)
                ),
                "IPv4": lambda value: validator.is_ip(value, 4),
                "IPv6": lambda value: validator.is_ip(value, 6),
                "Domain": validator.is_fqdn,
                "URL": validator.is_url,
                "ConnectionString": lambda value: re.fullmatch(
                    r"^(?:([^:/?#\s]+):/{2})?(?:([^@/?#\s]+)@)?([^/?#\s]+)?(?:/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$",
                    value, re.RegexFlag.M) is not None,
                "Hex": validator.is_hexadecimal,
                "Base64": validator.is_base64,
                "MD5": validator.is_md5,
                "SHA": lambda value: (
                    validator.is_hash(value, 'sha1')
                    or validator.is_hash(value, 'sha256')
                    or validator.is_hash(value, 'sha384')
                    or validator.is_hash(value, 'sha512')
                ),
                "Currency": validator.is_currency,
            }

    @functools.cached_property
    def ext(self) -> str:
        return " | ".join(["".join(ext) for ext in zip(cycle(self.EXT), self.types.keys())])

    @functools.cached_property
    def types(self) -> Dict[str, ConfigSchemaType]:
        return {f'.{schema_type.value}': schema_type for schema_type in ConfigSchemaType}

    @functools.cached_property
    def props(self) -> List[str]:
        return list(Cfgu.__annotations__.keys())


class ConfigSchema(IConfigSchema):
    """"""
    # todo nothing is done with PROPS.. ?
    #  why is this here anyway? i guess there will be other Schema types?
    #  if so this needs elevation or better if ConfigSchemaType will contain all this. if not its redundant.
    _SchemaDefinition = ConfigSchemaDefinition()

    def __init__(self, path: str) -> None:
        error_location = [self.__class__.__name__, self.__init__.__name__]
        if re.match(rf'.*({ConfigSchema._SchemaDefinition.ext})', path) is None:
            raise ValueError(error_message(f"invalid path {path}", error_location,
                                           f"file extension must be {ConfigSchema._SchemaDefinition.ext}"))
        super().__init__(path=path, type=ConfigSchema._SchemaDefinition.types[Path(path).suffix])

    def read(self) -> str:
        try:
            with open(self.path, mode='r', encoding='utf-8') as schema_file:
                file_content = schema_file.read()
            return file_content
        except (OSError, Exception):
            return ''

    @classmethod
    def parse(cls, scheme: "ConfigSchema") -> Dict[str, Cfgu]:
        """"""
        error_location = [cls.__name__, 'parse']
        # Read file as text
        schema_content = scheme.read()
        # parse per type
        if scheme.type == ConfigSchemaType.JSON:
            try:
                schema_content = json.loads(schema_content)
                schema_content = from_dict(Cfgu.from_dict, schema_content)
            except (JSONDecodeError, Exception):
                raise ValueError(error_message(f"Couldn't read or parse the file"))

        # validate parsed
        for key, cfgu in schema_content.items():
            if not is_valid_name(key):
                # todo `path nodes mustn't contain reserved words "{key}"` this is not a good suggestion
                raise ValueError(error_message(f"invalid key {key}", error_location + [key]))
            if cfgu.type == CfguType.REG_EX and cfgu.pattern is None:
                # todo suggestion grammar
                raise ValueError(error_message(f"invalid type property", error_location + [key, cfgu.type.value]),
                                 f'type {cfgu.type.value}" must come with a pattern property')
            if cfgu.default is not None:
                if cfgu.required is not None or cfgu.template is not None:
                    # todo suggestion grammar
                    raise ValueError(error_message(f"invalid default property", error_location + [key, 'default']),
                                     f"default mustn't set together with required or template properties")
                if cfgu.type == CfguType.REG_EX:
                    if re.fullmatch(cfgu.pattern, cfgu.default) is None:
                        raise ValueError(error_message(f"invalid default property", error_location + [key, 'default']),
                                         f"{cfgu.default} doesn't match {cfgu.pattern}")
                else:
                    type_test = ConfigSchema._SchemaDefinition.VALIDATORS.get(cfgu.type.value, lambda: False)
                    if not type_test(cfgu.default):
                        raise ValueError(error_message(f"invalid default property", error_location + [key, 'default']),
                                         f"{cfgu.default} must be of type {cfgu.type.value}")

            if cfgu.depends is not None and (not len(cfgu.depends)
                                             or any([not is_valid_name(dependency) for dependency in cfgu.depends])):
                raise ValueError(error_message(f"invalid depends property", error_location + [key, 'depends']),
                                 f"depends is empty or contain reserved words")

        return schema_content
