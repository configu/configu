# To use this code, make sure you
#
#     import json
#
# and then, to convert JSON from a string, do
#
#     result = cfgu_type_from_dict(json.loads(json_string))
#     result = cfgu_from_dict(json.loads(json_string))
#     result = config_schema_type_from_dict(json.loads(json_string))
#     result = config_schema_from_dict(json.loads(json_string))
#     result = cfgu_contents_from_dict(json.loads(json_string))
#     result = set_from_dict(json.loads(json_string))
#     result = store_from_dict(json.loads(json_string))
#     result = store_query_element_from_dict(json.loads(json_string))
#     result = store_query_from_dict(json.loads(json_string))
#     result = config_from_dict(json.loads(json_string))
#     result = store_contents_from_dict(json.loads(json_string))
#     result = convert_from_dict(json.loads(json_string))

from enum import Enum
from typing import Any, Optional, List, Dict, TypeVar, Type, Callable, cast


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
    return { k: f(v) for (k, v) in x.items() }


class CfguType(Enum):
    JSON = "json"
    YAML = "yaml"


class Cfgu:
    """A generic representation of a <schema>.cfgu.[json|yaml] file that contains ConfigSchema
    records ([<key>: string]: ConfigSchema)
    """
    contents: str
    name: str
    path: str
    type: CfguType

    def __init__(self, contents: str, name: str, path: str, type: CfguType) -> None:
        self.contents = contents
        self.name = name
        self.path = path
        self.type = type

    @staticmethod
    def from_dict(obj: Any) -> 'Cfgu':
        assert isinstance(obj, dict)
        contents = from_str(obj.get("contents"))
        name = from_str(obj.get("name"))
        path = from_str(obj.get("path"))
        type = CfguType(obj.get("type"))
        return Cfgu(contents, name, path, type)

    def to_dict(self) -> dict:
        result: dict = {}
        result["contents"] = from_str(self.contents)
        result["name"] = from_str(self.name)
        result["path"] = from_str(self.path)
        result["type"] = to_enum(CfguType, self.type)
        return result


class ConfigSchemaType(Enum):
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


class ConfigSchema:
    default: Optional[str]
    depends: Optional[List[str]]
    description: Optional[str]
    pattern: Optional[str]
    required: Optional[bool]
    template: Optional[str]
    type: ConfigSchemaType

    def __init__(self, default: Optional[str], depends: Optional[List[str]], description: Optional[str], pattern: Optional[str], required: Optional[bool], template: Optional[str], type: ConfigSchemaType) -> None:
        self.default = default
        self.depends = depends
        self.description = description
        self.pattern = pattern
        self.required = required
        self.template = template
        self.type = type

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigSchema':
        assert isinstance(obj, dict)
        default = from_union([from_str, from_none], obj.get("default"))
        depends = from_union([lambda x: from_list(from_str, x), from_none], obj.get("depends"))
        description = from_union([from_str, from_none], obj.get("description"))
        pattern = from_union([from_str, from_none], obj.get("pattern"))
        required = from_union([from_bool, from_none], obj.get("required"))
        template = from_union([from_str, from_none], obj.get("template"))
        type = ConfigSchemaType(obj.get("type"))
        return ConfigSchema(default, depends, description, pattern, required, template, type)

    def to_dict(self) -> dict:
        result: dict = {}
        result["default"] = from_union([from_str, from_none], self.default)
        result["depends"] = from_union([lambda x: from_list(from_str, x), from_none], self.depends)
        result["description"] = from_union([from_str, from_none], self.description)
        result["pattern"] = from_union([from_str, from_none], self.pattern)
        result["required"] = from_union([from_bool, from_none], self.required)
        result["template"] = from_union([from_str, from_none], self.template)
        result["type"] = to_enum(ConfigSchemaType, self.type)
        return result


class Set:
    """A generic representation of a ConfigSet that contains a path hierarchy to differentiate
    Config values and enable inheritance
    """
    hierarchy: List[str]
    path: str

    def __init__(self, hierarchy: List[str], path: str) -> None:
        self.hierarchy = hierarchy
        self.path = path

    @staticmethod
    def from_dict(obj: Any) -> 'Set':
        assert isinstance(obj, dict)
        hierarchy = from_list(from_str, obj.get("hierarchy"))
        path = from_str(obj.get("path"))
        return Set(hierarchy, path)

    def to_dict(self) -> dict:
        result: dict = {}
        result["hierarchy"] = from_list(from_str, self.hierarchy)
        result["path"] = from_str(self.path)
        return result


class Store:
    """A generic representation of a ConfigStore that contains Config records (Config[])"""
    scheme: str
    uid: str

    def __init__(self, scheme: str, uid: str) -> None:
        self.scheme = scheme
        self.uid = uid

    @staticmethod
    def from_dict(obj: Any) -> 'Store':
        assert isinstance(obj, dict)
        scheme = from_str(obj.get("scheme"))
        uid = from_str(obj.get("uid"))
        return Store(scheme, uid)

    def to_dict(self) -> dict:
        result: dict = {}
        result["scheme"] = from_str(self.scheme)
        result["uid"] = from_str(self.uid)
        return result


class StoreQueryElement:
    key: str
    schema: str
    set: str

    def __init__(self, key: str, schema: str, set: str) -> None:
        self.key = key
        self.schema = schema
        self.set = set

    @staticmethod
    def from_dict(obj: Any) -> 'StoreQueryElement':
        assert isinstance(obj, dict)
        key = from_str(obj.get("key"))
        schema = from_str(obj.get("schema"))
        set = from_str(obj.get("set"))
        return StoreQueryElement(key, schema, set)

    def to_dict(self) -> dict:
        result: dict = {}
        result["key"] = from_str(self.key)
        result["schema"] = from_str(self.schema)
        result["set"] = from_str(self.set)
        return result


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
    def from_dict(obj: Any) -> 'Config':
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


def cfgu_type_from_dict(s: Any) -> CfguType:
    return CfguType(s)


def cfgu_type_to_dict(x: CfguType) -> Any:
    return to_enum(CfguType, x)


def cfgu_from_dict(s: Any) -> Cfgu:
    return Cfgu.from_dict(s)


def cfgu_to_dict(x: Cfgu) -> Any:
    return to_class(Cfgu, x)


def config_schema_type_from_dict(s: Any) -> ConfigSchemaType:
    return ConfigSchemaType(s)


def config_schema_type_to_dict(x: ConfigSchemaType) -> Any:
    return to_enum(ConfigSchemaType, x)


def config_schema_from_dict(s: Any) -> ConfigSchema:
    return ConfigSchema.from_dict(s)


def config_schema_to_dict(x: ConfigSchema) -> Any:
    return to_class(ConfigSchema, x)


def cfgu_contents_from_dict(s: Any) -> Dict[str, ConfigSchema]:
    return from_dict(ConfigSchema.from_dict, s)


def cfgu_contents_to_dict(x: Dict[str, ConfigSchema]) -> Any:
    return from_dict(lambda x: to_class(ConfigSchema, x), x)


def set_from_dict(s: Any) -> Set:
    return Set.from_dict(s)


def set_to_dict(x: Set) -> Any:
    return to_class(Set, x)


def store_from_dict(s: Any) -> Store:
    return Store.from_dict(s)


def store_to_dict(x: Store) -> Any:
    return to_class(Store, x)


def store_query_element_from_dict(s: Any) -> StoreQueryElement:
    return StoreQueryElement.from_dict(s)


def store_query_element_to_dict(x: StoreQueryElement) -> Any:
    return to_class(StoreQueryElement, x)


def store_query_from_dict(s: Any) -> List[StoreQueryElement]:
    return from_list(StoreQueryElement.from_dict, s)


def store_query_to_dict(x: List[StoreQueryElement]) -> Any:
    return from_list(lambda x: to_class(StoreQueryElement, x), x)


def config_from_dict(s: Any) -> Config:
    return Config.from_dict(s)


def config_to_dict(x: Config) -> Any:
    return to_class(Config, x)


def store_contents_from_dict(s: Any) -> List[Config]:
    return from_list(Config.from_dict, s)


def store_contents_to_dict(x: List[Config]) -> Any:
    return from_list(lambda x: to_class(Config, x), x)


def convert_from_dict(s: Any) -> Dict[str, Any]:
    return from_dict(lambda x: x, s)


def convert_to_dict(x: Dict[str, Any]) -> Any:
    return from_dict(lambda x: x, x)
