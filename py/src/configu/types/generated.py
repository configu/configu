# To use this code, make sure you
#
#     import json
#
# and then, to convert JSON from a string, do
#
#     result = cfgu_type_from_dict(json.loads(json_string))
#     result = cfgu_from_dict(json.loads(json_string))
#     result = config_from_dict(json.loads(json_string))
#     result = config_schema_type_from_dict(json.loads(json_string))
#     result = config_schema_from_dict(json.loads(json_string))
#     result = config_schema_contents_from_dict(json.loads(json_string))
#     result = config_set_from_dict(json.loads(json_string))
#     result = config_store_from_dict(json.loads(json_string))
#     result = config_store_query_from_dict(json.loads(json_string))
#     result = config_store_contents_element_from_dict(json.loads(json_string))
#     result = config_store_contents_from_dict(json.loads(json_string))

from typing import Any, Optional, List, Dict, TypeVar, Type, Callable, cast
from enum import Enum


T = TypeVar("T")
EnumT = TypeVar("EnumT", bound=Enum)


def from_str(x: Any) -> str:
    assert isinstance(x, str)
    return x


def to_enum(c: Type[EnumT], x: Any) -> EnumT:
    assert isinstance(x, c)
    return x.value


def from_none(x: Any) -> Any:
    assert x is None
    return x


def from_union(fs, x):
    for f in fs:
        try:
            return f(x)
        except:
            pass
    assert False


def from_list(f: Callable[[Any], T], x: Any) -> List[T]:
    assert isinstance(x, list)
    return [f(y) for y in x]


def from_bool(x: Any) -> bool:
    assert isinstance(x, bool)
    return x


def to_class(c: Type[T], x: Any) -> dict:
    assert isinstance(x, c)
    return cast(Any, x).to_dict()


def from_dict(f: Callable[[Any], T], x: Any) -> Dict[str, T]:
    assert isinstance(x, dict)
    return {k: f(v) for (k, v) in x.items()}


class Config:
    """A generic representation of a software configuration, aka Config"""

    key: str
    schema: str
    set: str
    value: str

    def __init__(self, key: str, schema: str, set: str, value: str) -> None:
        self.key = key
        self.schema = schema
        self.set = set
        self.value = value

    @staticmethod
    def from_dict(obj: Any) -> "Config":
        assert isinstance(obj, dict)
        key = from_str(obj.get("key"))
        schema = from_str(obj.get("schema"))
        set = from_str(obj.get("set"))
        value = from_str(obj.get("value"))
        return Config(key, schema, set, value)

    def to_dict(self) -> dict:
        result: dict = {}
        result["key"] = from_str(self.key)
        result["schema"] = from_str(self.schema)
        result["set"] = from_str(self.set)
        result["value"] = from_str(self.value)
        return result


class ConfigSchemaType(Enum):
    JSON = "json"
    YAML = "yaml"


class ConfigSchema:
    """An interface of a <uid>.cfgu.[json|yaml] file, aka ConfigSchema
    that contains binding records between a unique Config <key> and its Cfgu declaration
    """

    contents: str
    path: str
    type: ConfigSchemaType
    uid: str

    def __init__(
        self, contents: str, path: str, type: ConfigSchemaType, uid: str
    ) -> None:
        self.contents = contents
        self.path = path
        self.type = type
        self.uid = uid

    @staticmethod
    def from_dict(obj: Any) -> "ConfigSchema":
        assert isinstance(obj, dict)
        contents = from_str(obj.get("contents"))
        path = from_str(obj.get("path"))
        type = ConfigSchemaType(obj.get("type"))
        uid = from_str(obj.get("uid"))
        return ConfigSchema(contents, path, type, uid)

    def to_dict(self) -> dict:
        result: dict = {}
        result["contents"] = from_str(self.contents)
        result["path"] = from_str(self.path)
        result["type"] = to_enum(ConfigSchemaType, self.type)
        result["uid"] = from_str(self.uid)
        return result


class CfguType(Enum):
    BASE64 = "Base64"
    BOOLEAN = "Boolean"
    COLOR = "Color"
    CONNECTION_STRING = "ConnectionString"
    COUNTRY = "Country"
    CURRENCY = "Currency"
    DOMAIN = "Domain"
    EMAIL = "Email"
    HEX = "Hex"
    I_PV4 = "IPv4"
    I_PV6 = "IPv6"
    LAT_LONG = "LatLong"
    LOCALE = "Locale"
    MD5 = "MD5"
    MOBILE_PHONE = "MobilePhone"
    NUMBER = "Number"
    REG_EX = "RegEx"
    SEM_VER = "SemVer"
    SHA = "SHA"
    STRING = "String"
    URL = "URL"
    UUID = "UUID"


class Cfgu:
    """A generic declaration of a Config, aka Cfgu that specifies information about its type and
    other characteristics
    """

    default: Optional[str]
    depends: Optional[List[str]]
    description: Optional[str]
    pattern: Optional[str]
    required: Optional[bool]
    template: Optional[str]
    type: CfguType

    def __init__(
        self,
        default: Optional[str],
        depends: Optional[List[str]],
        description: Optional[str],
        pattern: Optional[str],
        required: Optional[bool],
        template: Optional[str],
        type: CfguType,
    ) -> None:
        self.default = default
        self.depends = depends
        self.description = description
        self.pattern = pattern
        self.required = required
        self.template = template
        self.type = type

    @staticmethod
    def from_dict(obj: Any) -> "Cfgu":
        assert isinstance(obj, dict)
        default = from_union([from_str, from_none], obj.get("default"))
        depends = from_union(
            [lambda x: from_list(from_str, x), from_none], obj.get("depends")
        )
        description = from_union([from_str, from_none], obj.get("description"))
        pattern = from_union([from_str, from_none], obj.get("pattern"))
        required = from_union([from_bool, from_none], obj.get("required"))
        template = from_union([from_str, from_none], obj.get("template"))
        type = CfguType(obj.get("type"))
        return Cfgu(default, depends, description, pattern, required, template, type)

    def to_dict(self) -> dict:
        result: dict = {}
        result["default"] = from_union([from_str, from_none], self.default)
        result["depends"] = from_union(
            [lambda x: from_list(from_str, x), from_none], self.depends
        )
        result["description"] = from_union([from_str, from_none], self.description)
        result["pattern"] = from_union([from_str, from_none], self.pattern)
        result["required"] = from_union([from_bool, from_none], self.required)
        result["template"] = from_union([from_str, from_none], self.template)
        result["type"] = to_enum(CfguType, self.type)
        return result


class ConfigSet:
    """An interface of a path in an hierarchy, aka ConfigSet
    that contains Config <value> permutation
    """

    hierarchy: List[str]
    path: str

    def __init__(self, hierarchy: List[str], path: str) -> None:
        self.hierarchy = hierarchy
        self.path = path

    @staticmethod
    def from_dict(obj: Any) -> "ConfigSet":
        assert isinstance(obj, dict)
        hierarchy = from_list(from_str, obj.get("hierarchy"))
        path = from_str(obj.get("path"))
        return ConfigSet(hierarchy, path)

    def to_dict(self) -> dict:
        result: dict = {}
        result["hierarchy"] = from_list(from_str, self.hierarchy)
        result["path"] = from_str(self.path)
        return result


class ConfigStore:
    """An interface of a storage, aka ConfigStore
    that contains Config records (Config[])
    """

    type: str

    def __init__(self, type: str) -> None:
        self.type = type

    @staticmethod
    def from_dict(obj: Any) -> "ConfigStore":
        assert isinstance(obj, dict)
        type = from_str(obj.get("type"))
        return ConfigStore(type)

    def to_dict(self) -> dict:
        result: dict = {}
        result["type"] = from_str(self.type)
        return result


class ConfigStoreQuery:
    key: str
    schema: str
    set: str

    def __init__(self, key: str, schema: str, set: str) -> None:
        self.key = key
        self.schema = schema
        self.set = set

    @staticmethod
    def from_dict(obj: Any) -> "ConfigStoreQuery":
        assert isinstance(obj, dict)
        key = from_str(obj.get("key"))
        schema = from_str(obj.get("schema"))
        set = from_str(obj.get("set"))
        return ConfigStoreQuery(key, schema, set)

    def to_dict(self) -> dict:
        result: dict = {}
        result["key"] = from_str(self.key)
        result["schema"] = from_str(self.schema)
        result["set"] = from_str(self.set)
        return result


class ConfigStoreContentsElement:
    key: str
    schema: str
    set: str
    value: str

    def __init__(self, key: str, schema: str, set: str, value: str) -> None:
        self.key = key
        self.schema = schema
        self.set = set
        self.value = value

    @staticmethod
    def from_dict(obj: Any) -> "ConfigStoreContentsElement":
        assert isinstance(obj, dict)
        key = from_str(obj.get("key"))
        schema = from_str(obj.get("schema"))
        set = from_str(obj.get("set"))
        value = from_str(obj.get("value"))
        return ConfigStoreContentsElement(key, schema, set, value)

    def to_dict(self) -> dict:
        result: dict = {}
        result["key"] = from_str(self.key)
        result["schema"] = from_str(self.schema)
        result["set"] = from_str(self.set)
        result["value"] = from_str(self.value)
        return result


def cfgu_type_from_dict(s: Any) -> CfguType:
    return CfguType(s)


def cfgu_type_to_dict(x: CfguType) -> Any:
    return to_enum(CfguType, x)


def cfgu_from_dict(s: Any) -> Cfgu:
    return Cfgu.from_dict(s)


def cfgu_to_dict(x: Cfgu) -> Any:
    return to_class(Cfgu, x)


def config_from_dict(s: Any) -> Config:
    return Config.from_dict(s)


def config_to_dict(x: Config) -> Any:
    return to_class(Config, x)


def config_schema_type_from_dict(s: Any) -> ConfigSchemaType:
    return ConfigSchemaType(s)


def config_schema_type_to_dict(x: ConfigSchemaType) -> Any:
    return to_enum(ConfigSchemaType, x)


def config_schema_from_dict(s: Any) -> ConfigSchema:
    return ConfigSchema.from_dict(s)


def config_schema_to_dict(x: ConfigSchema) -> Any:
    return to_class(ConfigSchema, x)


def config_schema_contents_from_dict(s: Any) -> Dict[str, Cfgu]:
    return from_dict(Cfgu.from_dict, s)


def config_schema_contents_to_dict(x: Dict[str, Cfgu]) -> Any:
    return from_dict(lambda x: to_class(Cfgu, x), x)


def config_set_from_dict(s: Any) -> ConfigSet:
    return ConfigSet.from_dict(s)


def config_set_to_dict(x: ConfigSet) -> Any:
    return to_class(ConfigSet, x)


def config_store_from_dict(s: Any) -> ConfigStore:
    return ConfigStore.from_dict(s)


def config_store_to_dict(x: ConfigStore) -> Any:
    return to_class(ConfigStore, x)


def config_store_query_from_dict(s: Any) -> ConfigStoreQuery:
    return ConfigStoreQuery.from_dict(s)


def config_store_query_to_dict(x: ConfigStoreQuery) -> Any:
    return to_class(ConfigStoreQuery, x)


def config_store_contents_element_from_dict(s: Any) -> ConfigStoreContentsElement:
    return ConfigStoreContentsElement.from_dict(s)


def config_store_contents_element_to_dict(x: ConfigStoreContentsElement) -> Any:
    return to_class(ConfigStoreContentsElement, x)


def config_store_contents_from_dict(s: Any) -> List[ConfigStoreContentsElement]:
    return from_list(ConfigStoreContentsElement.from_dict, s)


def config_store_contents_to_dict(x: List[ConfigStoreContentsElement]) -> Any:
    return from_list(lambda x: to_class(ConfigStoreContentsElement, x), x)
