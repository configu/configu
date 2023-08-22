import json
import re
from itertools import cycle
from pathlib import Path
from typing import Callable, Dict

import pyvalidator

from .generated import (
    Cfgu,
    CfguType,
    ConfigSchema as IConfigSchema,
    ConfigSchemaType,
)
from ..utils import error_message, is_valid_name


class ConfigSchemaDefinition:
    _cs_regex = r"^(?:([^:/?#\s]+):/{2})?(?:([^@/?#\s]+)@)?([^/?#\s]+)?(?:/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$"  # noqa: E501
    NAME: str = "cfgu"
    EXT: str = ".cfgu"
    VALIDATORS: Dict[str, Callable[[str], bool]] = {
        "Boolean": pyvalidator.is_boolean,
        "Number": pyvalidator.is_number,
        "String": lambda value: isinstance(value, str),
        "RegEx": lambda *args: re.fullmatch(args[1], args[0]) is not None,
        "UUID": pyvalidator.is_uuid,
        "SemVer": pyvalidator.is_semantic_version,
        "Email": pyvalidator.is_email,
        "MobilePhone": pyvalidator.is_mobile_number,
        "LatLong": pyvalidator.is_lat_long,
        "Color": lambda value: (
            pyvalidator.is_hexadecimal(value)
            or pyvalidator.is_hsl(value)
            or pyvalidator.is_rgb_color(value)
        ),
        "IPv4": lambda value: pyvalidator.is_ip(value, 4),
        "IPv6": lambda value: pyvalidator.is_ip(value, 6),
        "Domain": pyvalidator.is_fqdn,
        "URL": pyvalidator.is_url,
        "ConnectionString": lambda value: re.fullmatch(
            ConfigSchemaDefinition._cs_regex,
            value,
            re.RegexFlag.M,
        )
        is not None,
        "Hex": pyvalidator.is_hexadecimal,
        "Base64": pyvalidator.is_base64,
        "MD5": pyvalidator.is_md5,
        "SHA": lambda value: (
            pyvalidator.is_hash(value, "sha1")
            or pyvalidator.is_hash(value, "sha256")
            or pyvalidator.is_hash(value, "sha384")
            or pyvalidator.is_hash(value, "sha512")
        ),
        "Currency": pyvalidator.is_currency,
    }
    PROPS = list(Cfgu.__annotations__.keys())


class ConfigSchema(IConfigSchema):
    """
    A Python representation of the schema stored in a .cfgu.json file.
    """

    CFGU = ConfigSchemaDefinition

    TYPES = {f".{schema_type.value}": schema_type for schema_type in ConfigSchemaType}
    EXT = " | ".join(["".join(ext) for ext in zip(cycle(CFGU.EXT), TYPES.keys())])

    def __init__(self, path: str) -> None:
        """
        Creates a new ConfigSchema
        :param path: path to the schema file (.cfgu.json)
        """
        error_location = [self.__class__.__name__, self.__init__.__name__]
        if re.match(rf".*({ConfigSchema.EXT})", path) is None:
            raise ValueError(
                error_message(
                    f"invalid path {path}",
                    error_location,
                    f"file extension must be {ConfigSchema.EXT}",
                )
            )
        super().__init__(path=path, type=ConfigSchema.TYPES[Path(path).suffix])

    def read(self) -> str:
        """
        Reads the config schema file
        :return: contents of the config schema
        """
        with open(self.path, mode="r", encoding="utf-8") as schema_file:
            file_content = schema_file.read()
        return file_content

    @classmethod
    def parse(cls, scheme: "ConfigSchema") -> Dict[str, Cfgu]:
        """
        Parses the given ConfigSchema
        :param scheme: The ConfigSchema to parse
        :return: A dictionary of configurations.
        """
        error_location = [cls.__name__, "parse"]
        schema_content = scheme.read()
        if scheme.type == ConfigSchemaType.JSON:
            schema_content = json.loads(schema_content)
            assert isinstance(schema_content, dict)
            schema_content = {k: Cfgu.from_dict(v) for (k, v) in schema_content.items()}

        # validate parsed
        for key, cfgu in schema_content.items():
            if not is_valid_name(key):
                raise ValueError(
                    error_message(
                        f"invalid key {key}",
                        error_location + [key],
                        f"path nodes mustn't contain reserved words '${key}'",
                    )
                )
            if cfgu.type == CfguType.REG_EX and cfgu.pattern is None:
                raise ValueError(
                    error_message(
                        "invalid type property",
                        error_location + [key, cfgu.type.value],
                    ),
                    f"type '{cfgu.type.value}' must come with a pattern property",
                )
            if cfgu.default is not None:
                if cfgu.required is not None or cfgu.template is not None:
                    raise ValueError(
                        error_message(
                            "invalid default property",
                            error_location + [key, "default"],
                        ),
                        "default mustn't set together with required "
                        "or template properties",
                    )
                else:
                    type_test = ConfigSchema.CFGU.VALIDATORS.get(
                        cfgu.type.value, lambda: False
                    )
                    test_values = (
                        (cfgu.default, cfgu.pattern)
                        if cfgu.type == CfguType.REG_EX
                        else (cfgu.default,)
                    )
                    if not type_test(*test_values):
                        raise ValueError(
                            error_message(
                                "invalid default property",
                                error_location + [key, "default"],
                            ),
                            f"{cfgu.default} must be of type {cfgu.type.value}"
                            f" or match Regex",
                        )

            if cfgu.depends is not None and (
                not len(cfgu.depends)
                or any([not is_valid_name(dependency) for dependency in cfgu.depends])
            ):
                raise ValueError(
                    error_message(
                        "invalid depends property",
                        error_location + [key, "depends"],
                    ),
                    "depends is empty or contain reserved words",
                )

        return schema_content
