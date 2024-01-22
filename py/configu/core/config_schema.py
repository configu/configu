import re
from typing import Callable, Dict, List, Tuple, Union

import pyvalidator

from .generated import (
    Cfgu,
    CfguType,
    ConfigSchema as IConfigSchema,
    cfgu_to_dict,
)
from ..utils import (
    ConfigError,
    is_valid_json_schema,
    is_valid_name,
    parse_template,
)

CFGU_NAME = "cfgu"
CFGU_PROP = tuple(Cfgu.__annotations__.keys())

AlibabaRegions = {
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
}
AWSRegions = {
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
}
AZRegions = {
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
}
GCPRegions = {
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
}
OracleRegions = {
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
}
IBMRegions = {
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
}
CFGU_VALUE_TYPE_VALIDATORS: Dict[str, Callable[[str, ...], bool]] = {
    "Boolean": pyvalidator.is_boolean,
    "Number": pyvalidator.is_number,
    "String": lambda value: isinstance(value, str),
    "RegEx": lambda *args: re.fullmatch(*args) is not None,
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
        r"^(?:([^:/?#\s]+):/{2})?(?:([^@/?#\s]+)@)?([^/?#\s]+)?(?:/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$",  # noqa: E501
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
    "AlibabaRegion": lambda value: value in AlibabaRegions,
    "AWSRegion": lambda value: value in AWSRegions,
    "AZRegion": lambda value: value in AZRegions,
    "GCPRegion": lambda value: value in GCPRegions,
    "OracleRegion": lambda value: value in OracleRegions,
    "IBMRegion": lambda value: value in IBMRegions,
    "DockerImage": lambda value: re.fullmatch(
        r"^((?:[a-z0-9]([-a-z0-9]*[a-z0-9])?\.)+[a-z]{2,6}(?::\d{1,5})?\/)?[a-z0-9]+(?:[._\-\/:][a-z0-9]+)*$",  # noqa: E501
        value,
        re.RegexFlag.M,
    )
    is not None,
    "ARN": lambda value: re.fullmatch(
        r"^arn:([^:\n]+):([^:\n]+):(?:[^:\n]*):(?:([^:\n]*)):([^:\/\n]+)(?:(:[^\n]+)|(\/[^:\n]+))?$",  # noqa: E501
        value,
        re.RegexFlag.M,
    )
    is not None,
    "Language": pyvalidator.is_iso6391,
    "MACAddress": pyvalidator.is_mac_address,
    "MIMEType": pyvalidator.is_mime_type,
    "MongoId": pyvalidator.is_mongo_id,
    "JSONSchema": lambda *args: is_valid_json_schema(*args),
}


def cfgu_value_type_validator(cfgu: Cfgu, value: str):
    cfgu_type = cfgu.type.value
    try:
        validate = CFGU_VALUE_TYPE_VALIDATORS[cfgu_type]
    except KeyError as e:
        raise ConfigError(
            reason="invalid type property",
            hint=f"type '{cfgu_type}' is not yet supported in this SDK. For the time being, "  # noqa: E501
            f"please utilize the 'String' type. We'd greatly appreciate it if you could open an issue "  # noqa: E501
            f"regarding this at https://github.com/configu/configu/issues/new/choose "  # noqa: E501
            f"so we can address it in future updates.",
        ) from e

    if cfgu.type == CfguType.REG_EX:
        validate_values = (cfgu.pattern, value)
    elif cfgu.type == CfguType.JSON_SCHEMA:
        validate_values = (cfgu.schema, value)
    else:
        validate_values = (value,)

    is_valid = validate(*validate_values)
    if is_valid:
        return

    hint = f"value '{value}' must be of type {cfgu_type}"
    if cfgu_type == "RegEx":
        hint = f"value '{value}' must match the pattern '{cfgu.pattern}'"
    elif cfgu_type == "JSONSchema":
        hint = f"value '{value}' must match the schema '{cfgu.schema}'"

    raise ConfigError(reason="invalid config value", hint=hint)


def cfgu_value_options_validator(cfgu: Cfgu, value: str):
    if not cfgu.options:
        return

    if value not in cfgu.options:
        raise ConfigError(
            reason="invalid config value",
            hint=f"value '{value}' must be one of {', '.join(cfgu.options)}",
        )


def cfgu_structure_validator(cfgu: Cfgu):
    try:
        cfgu_to_dict(cfgu)
    except (Exception,) as e:
        raise ConfigError(reason="invalid cfgu structure", hint=str(e)) from e

    if cfgu.type == CfguType.REG_EX and cfgu.pattern is None:
        raise ConfigError(
            reason="invalid type property",
            hint=f"type '{cfgu.type.value}' must come with a pattern property",
        )

    if cfgu.type == CfguType.JSON_SCHEMA and cfgu.schema is None:
        raise ConfigError(
            reason="invalid type property",
            hint=f"type '{cfgu.type.value}' must come with a schema property",
        )

    if cfgu.options is not None:
        reason = "invalid options property"
        if not cfgu.options:
            raise ConfigError(
                reason=reason,
                hint="options mustn't be empty if set",
            )
        if cfgu.template is not None:
            raise ConfigError(
                reason=reason,
                hint="options mustn't set together with template properties",
            )
        for option in cfgu.options:
            if option == "":
                raise ConfigError(
                    reason=reason,
                    hint="options mustn't contain an empty string",
                )
            try:
                cfgu_value_type_validator(cfgu, option)
            except (Exception,) as e:
                if isinstance(e, ConfigError):
                    raise e.set_reason(reason)
                raise e

    if cfgu.default is not None:
        reason = "invalid default property"
        if cfgu.required is not None or cfgu.template is not None:
            raise ConfigError(
                reason=reason,
                hint="default mustn't set together with required or template properties",  # noqa: E501
            )
        if cfgu.options is not None and cfgu.default not in cfgu.options:
            raise ConfigError(
                reason=reason,
                hint=f"value '{cfgu.default}' must be one of {', '.join(cfgu.options)}",
            )
        try:
            cfgu_value_type_validator(cfgu, cfgu.default)
        except (Exception,) as e:
            if isinstance(e, ConfigError):
                raise e.set_reason(reason)
            raise e

    if cfgu.depends is not None:
        reason = "invalid depends property"
        if not cfgu.depends:
            raise ConfigError(
                reason=reason,
                hint="depends mustn't be empty if set",
            )
        if any([not is_valid_name(dependency) for dependency in cfgu.depends]):
            raise ConfigError(
                reason=reason,
                hint="depends mustn't contain reserved words",
            )

    if cfgu.template is not None:
        try:
            parse_template(cfgu.template)
        except (Exception,) as e:
            raise ConfigError(
                reason="invalid template property",
                hint=str(e),
            ) from e


class ConfigSchema(IConfigSchema):
    """
    A Python representation of the schema stored in a .cfgu.json file.
    """

    # Nothing here make sense.
    # Why would everything be global but specific?!
    # What is the point of TYPE under VALIDATORS?! it's not even used!
    CFGU = {
        "NAME": CFGU_NAME,
        "PROPS": CFGU_PROP,
        "VALIDATORS": {
            "TYPE": CFGU_VALUE_TYPE_VALIDATORS,
            "valueType": cfgu_value_type_validator,
            "valueOptions": cfgu_value_options_validator,
            "structure": cfgu_structure_validator,
        },
    }
    contents: Dict[str, Cfgu]

    def __init__(self, name: str, contents: Dict[str, Union[Cfgu, dict]]) -> None:
        # This check and the next one are identical. This should be removed
        if name == "":
            raise ConfigError(
                reason="invalid config schema",
                hint="name mustn't be empty",
            )
        if not is_valid_name(name):
            raise ConfigError(
                reason="invalid config schema",
                # This hint is far from hinting at the problem. This should be changed
                hint=f"name '{name}' mustn't contain reserved words",
            )
        if not contents:
            raise ConfigError(
                reason="invalid config schema",
                hint="contents mustn't be empty",
            )
        for key, cfgu in contents.items():
            if isinstance(cfgu, dict):
                contents[key] = cfgu = Cfgu.from_dict(cfgu)
            error_scope: List[Tuple[str, str]] = [
                ("ConfigSchema", name),
                ("ConfigKey", key),
            ]
            if not is_valid_name(key):
                raise ConfigError(
                    reason="invalid config key",
                    # This hint is far from hinting at the problem.
                    hint=f"key '{key}' mustn't contain reserved words",
                    scope=error_scope,
                )
            try:
                ConfigSchema.CFGU["VALIDATORS"]["structure"](cfgu)
            except (Exception,) as e:
                if isinstance(e, ConfigError):
                    raise e.append_scope(error_scope)
                raise e
        super().__init__(name=name, contents=contents)
