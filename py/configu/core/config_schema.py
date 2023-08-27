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
    _docker_regex = r"^((?:[a-z0-9]([-a-z0-9]*[a-z0-9])?\.)+[a-z]{2,6}(?::\d{1,5})?\/)?[a-z0-9]+(?:[._\-\/:][a-z0-9]+)*$"  # noqa: E501
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
        "AlibabaRegion": lambda value: value
        in {
            "cn-hangzhou",
            "cn-shanghai",
            "cn-beijing",
            "cn-shenzhen",
            "cn-zhangjiakou",
            "cn-huhehaote",
            "cn-wulanchabu",
            "ap-southeast-1",
            "ap-southeast-2",
            "ap-southeast-3",
            "ap-southeast-5",
            "ap-northeast-1",
            "ap-south-1",
            "ap-south-2",
            "us-west-1",
            "us-east-1",
            "eu-west-1",
            "eu-central-1",
            "me-east-1",
            "ap-southwest-1",
        },
        "AwsRegion": lambda value: value
        in {
            "af-south-1",
            "ap-east-1",
            "ap-northeast-1",
            "ap-northeast-2",
            "ap-northeast-3",
            "ap-south-1",
            "ap-southeast-1",
            "ap-southeast-2",
            "ca-central-1",
            "cn-north-1",
            "cn-northwest-1",
            "eu-central-1",
            "eu-north-1",
            "eu-south-1",
            "eu-west-1",
            "eu-west-2",
            "eu-west-3",
            "me-south-1",
            "sa-east-1",
            "us-east-1",
            "us-east-2",
            "us-gov-east-1",
            "us-gov-west-1",
            "us-west-1",
            "us-west-2",
        },
        "AZRegion": lambda value: value
        in {
            "eastus",
            "eastus2",
            "centralus",
            "northcentralus",
            "southcentralus",
            "westcentralus",
            "westus",
            "westus2",
            "canadacentral",
            "canadaeast",
            "brazilsouth",
            "brazilsoutheast",
            "northeurope",
            "westeurope",
            "uksouth",
            "ukwest",
            "francecentral",
            "francesouth",
            "switzerlandnorth",
            "switzerlandwest",
            "germanywestcentral",
            "norwayeast",
            "norwaywest",
            "eastasia",
            "southeastasia",
            "australiaeast",
            "australiasoutheast",
            "australiacentral",
            "australiacentral2",
            "japaneast",
            "japanwest",
            "koreacentral",
            "koreasouth",
            "southafricanorth",
            "southafricawest",
            "uaenorth",
            "uaecentral",
            "usgovarizona",
            "usgovtexas",
            "usdodeast",
            "usdodcentral",
            "usgovvirginia",
            "usgoviowa",
            "usgovcalifornia",
            "ussecwest",
            "usseceast",
        },
        "GCPRegion": lambda value: value
        in {
            "us-east1",
            "us-east4",
            "us-west1",
            "us-west2",
            "us-west3",
            "us-central1",
            "northamerica-northeast1",
            "southamerica-east1",
            "europe-north1",
            "europe-west1",
            "europe-west2",
            "europe-west3",
            "europe-west4",
            "europe-west6",
            "asia-east1",
            "asia-east2",
            "asia-northeast1",
            "asia-northeast2",
            "asia-northeast3",
            "asia-south1",
            "asia-southeast1",
            "australia-southeast1",
            "australia-southeast2",
            "southasia-east1",
            "northamerica-northeast2",
            "europe-central2",
            "asia-southeast2",
            "asia-east3",
            "europe-west7",
            "us-west4",
            "europe-west8",
            "asia-northeast4",
            "asia-southeast3",
            "us-west5",
            "us-central2",
            "us-east5",
            "us-north1",
            "northamerica-northeast3",
            "us-west6",
        },
        "OracleRegion": lambda value: value
        in {
            "us-ashburn-1",
            "us-phoenix-1",
            "ca-toronto-1",
            "sa-saopaulo-1",
            "uk-london-1",
            "uk-gov-london-1",
            "eu-frankfurt-1",
            "eu-zurich-1",
            "eu-amsterdam-1",
            "me-jeddah-1",
            "ap-mumbai-1",
            "ap-osaka-1",
            "ap-seoul-1",
            "ap-sydney-1",
            "ap-tokyo-1",
            "ap-chuncheon-1",
            "ap-melbourne-1",
            "ap-hyderabad-1",
            "ca-montreal-1",
            "us-sanjose-1",
            "us-luke-1",
            "me-dubai-1",
            "us-gov-ashburn-1",
            "us-gov-chicago-1",
            "us-gov-phoenix-1",
            "us-gov-orlando-1",
            "us-gov-sanjose-1",
            "us-gov-ashburn-2",
        },
        "IBMRegion": lambda value: value
        in {
            "us-south",
            "us-east",
            "us-north",
            "us-west",
            "eu-gb",
            "eu-de",
            "eu-nl",
            "eu-fr",
            "eu-it",
            "ap-north",
            "ap-south",
            "ap-east",
            "ap-jp",
            "ap-au",
            "ca-toronto",
            "ca-central",
            "sa-saopaulo",
            "sa-mexico",
            "sa-buenosaires",
            "sa-lima",
            "sa-santiago",
            "af-za",
            "af-eg",
            "af-dz",
            "af-ma",
        },
        "DockerImage": lambda value: re.fullmatch(
            ConfigSchemaDefinition._docker_regex,
            value,
            re.RegexFlag.M,
        )
        is not None,
        "Language": pyvalidator.is_iso6391,
        "MACAddress": pyvalidator.is_mac_address,
        "MIMEType": pyvalidator.is_mime_type,
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
        error_scope = [cls.__name__, "parse"]
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
                        error_scope + [key],
                        f"path nodes mustn't contain reserved words '${key}'",
                    )
                )
            if cfgu.type == CfguType.REG_EX and cfgu.pattern is None:
                raise ValueError(
                    error_message(
                        "invalid type property",
                        error_scope + [key, cfgu.type.value],
                    ),
                    f"type '{cfgu.type.value}' must come with a pattern property",
                )
            if cfgu.default is not None:
                if cfgu.required is not None or cfgu.template is not None:
                    raise ValueError(
                        error_message(
                            "invalid default property",
                            error_scope + [key, "default"],
                        ),
                        "default mustn't set together with required "
                        "or template properties",
                    )
                else:
                    try:
                        type_test = ConfigSchema.CFGU.VALIDATORS[cfgu.type.value]
                    except KeyError as e:
                        raise KeyError(
                            error_message(
                                "invalid type property", error_scope + [key, "type"]
                            ),
                            f"type '{cfgu.type.value}' is not yet "
                            "supported in this SDK. For the time being, "
                            "please utilize the String type. "
                            "We'd greatly appreciate it if you could open an issue "
                            "regarding this at "
                            "https://github.com/configu/configu/issues/new/choose "
                            "so we can address it in future updates.",
                        ) from e
                    test_values = (
                        (cfgu.default, cfgu.pattern)
                        if cfgu.type == CfguType.REG_EX
                        else (cfgu.default,)
                    )
                    if not type_test(*test_values):
                        raise ValueError(
                            error_message(
                                "invalid default property",
                                error_scope + [key, "default"],
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
                        error_scope + [key, "depends"],
                    ),
                    "depends is empty or contain reserved words",
                )

        return schema_content
