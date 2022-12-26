import json
import re
import string
from typing import Dict, List, Union, Callable, Optional

import pyvalidator as validator

from .types.generated import (
    ConfigSchema as IConfigSchema,
    ConfigSchemaType,
    Cfgu,
    config_schema_contents_from_dict,
    ConfigSchemaContents
)
from .utils import pretty_error

CFGU_PATH = f"{string}.cfgu.{ConfigSchemaType}"


class ConfigSchema(IConfigSchema):
    CFGU = {
        "NAME": "cfgu",
        "EXT": ".cfgu",
        "PROPS": [
            "type",
            "pattern",
            "default",
            "required",
            "depends",
            "template",
            "description",
        ],
    }

    TYPES: List[str] = list(ConfigSchemaType.values())
    EXT: str = f".<{'|'.join(TYPES)}>"

    VALIDATIONS: Dict[str, Union[dict, Dict[str, Callable[[Cfgu], bool]]]] = {
        "NAMES": {
            "PATTERN": re.compile(r"^[A-Za-z0-9_-]+$"),
            "RESERVED": [
                "config",
                "store",
                "query",
                "q",
                "set",
                "schema",
                "cfgu",
                "_",
                "-",
                "this",
                "current",
                "cur",
                "root",
                "default",
                "admin",
                "general",
                "local",
            ],
        },
        "TYPES": {
            "Boolean": lambda params: validator.is_boolean(params["value"]),
            "Number": lambda params: validator.is_number(params["value"]),
            "String": lambda _: True,
            "RegEx": lambda params: (
                True
                if not params["pattern"]
                else bool(re.compile(params["pattern"]).fullmatch(params["value"]))
            ),
            "UUID": lambda params: validator.is_uuid(params["value"]),
            "SemVer": lambda params: validator.is_semantic_version(params["value"]),
            "Email": lambda params: validator.is_email(params["value"]),
            "MobilePhone": lambda params: validator.is_mobile_number(params["value"]),
            "LatLong": lambda params: validator.is_lat_long(params["value"]),
            "Color": lambda params: (
                validator.is_hexadecimal(params["value"])
                or validator.is_hsl(params["value"])
                or validator.is_rgb_color(params["value"])
            ),
            "IPv4": lambda params: validator.is_ip(params["value"], 4),
            "IPv6": lambda params: validator.is_ip(params["value"], 6),
            "Domain": lambda params: validator.is_fqdn(params["value"]),
            "URL": lambda params: validator.is_url(params["value"]),
            "ConnectionString": lambda params: (
                re.compile(
                    r"^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$",
                    re.MULTILINE,
                ).fullmatch(params["value"])
                is not None
            ),
            "Hex": lambda params: validator.is_hexadecimal(params["value"]),
            "Base64": lambda params: validator.is_base64(params["value"]),
            "MD5": lambda params: validator.is_hash(params["value"], "md5"),
            "SHA": lambda params: (
                validator.is_hash(params["value"], "sha1")
                or validator.is_hash(params["value"], "sha256")
                or validator.is_hash(params["value"], "sha384")
                or validator.is_hash(params["value"], "sha512")
            ),
            "Currency": lambda params: validator.is_currency(params["value"]),
        },
    }

    @staticmethod
    def validate_naming(name: str) -> bool:
        return (
            re.fullmatch(ConfigSchema.VALIDATIONS["NAMES"]["PATTERN"], name) is not None
            and name not in ConfigSchema.VALIDATIONS["NAMES"]["RESERVED"]
        )

    @staticmethod
    def validate_value_type(parameters: Cfgu, value: Optional[str] = None) -> bool:
        if not value:
            return True
        return ConfigSchema.VALIDATIONS["TYPES"][parameters.type.value](parameters)

    def __init__(self, path: str):
        splitted_path = path.split(".")
        if len(splitted_path) <= 2:
            raise ValueError(
                f'invalid path "{path}" - path extension must be {ConfigSchema.EXT}'
            )

        file_ext = splitted_path.pop()
        if file_ext is None or file_ext not in ConfigSchema.TYPES:
            raise ValueError(
                f'invalid path "{path}" - path extension must be {ConfigSchema.EXT}'
            )

        cfgu_ext = splitted_path.pop()
        if cfgu_ext != ConfigSchema.CFGU["NAME"]:
            raise ValueError(
                f'invalid path "{path}" - path extension must be {ConfigSchema.CFGU["EXT"]}{ConfigSchema.EXT}'
            )

        schema_uid = splitted_path.pop()
        if schema_uid is not None:
            schema_uid = schema_uid.split("/").pop()
        if schema_uid is None or not ConfigSchema.validate_naming(schema_uid):
            raise ValueError(
                f'invalid path "{path}" - path must be formed as <path>/<schema.uid>{ConfigSchema.CFGU["EXT"]}{ConfigSchema.EXT}, and schema.uid must not contain reserved words'
            )
        super().__init__(
            contents="", path=path, type=ConfigSchemaType(file_ext), uid=schema_uid
        )

    def read(self):
        with open(self.path) as f:
            self.contents = f.read()

    @staticmethod
    def parse(schema: "ConfigSchema") -> ConfigSchemaContents:
        schema.read()
        uid = schema.uid

        schema_contents = config_schema_contents_from_dict(dict(
            contents=json.loads(schema.contents))
        )
        for key, cfgu in schema_contents.contents.items():
            type = cfgu.type

            if not ConfigSchema.validate_naming(key):
                raise ValueError(
                    pretty_error(
                        f"invalid key {key}",
                        {
                            "location": ["ConfigSchema", "parse", uid, key],
                            "suggestion": f"path nodes mustn't contain reserved words {key}",
                        },
                    )
                )

            if type == "RegEx" and not cfgu.pattern:
                raise ValueError(
                    pretty_error(
                        "invalid type property",
                        {
                            "location": ["ConfigSchema", "parse", uid, key, "type"],
                            "suggestion": f'type "{type}" must come with a pattern property',
                        },
                    )
                )

            if cfgu.default and (cfgu.required or cfgu.template):
                raise ValueError(
                    pretty_error(
                        "invalid default property",
                        {
                            "location": ["ConfigSchema", "parse", uid, key, "default"],
                            "suggestion": "default must'nt set together with required or template properties",
                        },
                    )
                )

            # ! default don't support templates of other store like regular values
            if not ConfigSchema.validate_value_type(
                parameters=cfgu, value=cfgu.default
            ):
                raise ValueError(
                    pretty_error(
                        "invalid default property",
                        {
                            "location": ["ConfigSchema", "parse", uid, key, "default"],
                            "suggestion": f'"{cfgu.default}" must be a "{type}"',
                        },
                    )
                )

            invalid_depends = cfgu.depends and (
                not cfgu.depends
                or any(
                    not ConfigSchema.validate_naming(depend) for depend in cfgu.depends
                )
            )
            if invalid_depends:
                raise ValueError(
                    pretty_error(
                        "invalid depends property",
                        {
                            "location": ["ConfigSchema", "parse", uid, key, "depends"],
                            "suggestion": "depends is empty or contain reserved words",
                        },
                    )
                )

        return schema_contents
