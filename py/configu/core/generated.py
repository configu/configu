from enum import Enum
from dataclasses import dataclass
from typing import Optional, List, Dict, Any, TypeVar, Callable, Type, cast


T = TypeVar("T")
EnumT = TypeVar("EnumT", bound=Enum)


def from_str(x: Any) -> str:
    assert isinstance(x, str)
    return x


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


def from_dict(f: Callable[[Any], T], x: Any) -> Dict[str, T]:
    assert isinstance(x, dict)
    return { k: f(v) for (k, v) in x.items() }


def to_enum(c: Type[EnumT], x: Any) -> EnumT:
    assert isinstance(x, c)
    return x.value


def to_class(c: Type[T], x: Any) -> dict:
    assert isinstance(x, c)
    return cast(Any, x).to_dict()


class CfguType(Enum):
    ALIBABA_REGION = "AlibabaRegion"
    ARN = "ARN"
    AWS_REGION = "AWSRegion"
    AZ_REGION = "AZRegion"
    BASE64 = "Base64"
    BOOLEAN = "Boolean"
    COLOR = "Color"
    CONNECTION_STRING = "ConnectionString"
    COUNTRY = "Country"
    CURRENCY = "Currency"
    DATE_TIME = "DateTime"
    DOCKER_IMAGE = "DockerImage"
    DOMAIN = "Domain"
    EMAIL = "Email"
    GCP_REGION = "GCPRegion"
    HEX = "Hex"
    IBM_REGION = "IBMRegion"
    I_PV4 = "IPv4"
    I_PV6 = "IPv6"
    JSON_SCHEMA = "JSONSchema"
    LANGUAGE = "Language"
    LAT_LONG = "LatLong"
    LOCALE = "Locale"
    MAC_ADDRESS = "MACAddress"
    MD5 = "MD5"
    MIME_TYPE = "MIMEType"
    MOBILE_PHONE = "MobilePhone"
    MONGO_ID = "MongoId"
    NUMBER = "Number"
    ORACLE_REGION = "OracleRegion"
    REG_EX = "RegEx"
    SEM_VER = "SemVer"
    SHA = "SHA"
    STRING = "String"
    URL = "URL"
    UUID = "UUID"


@dataclass
class Cfgu:
    """A generic declaration of a `Config`, using properties like type, description and
    constraints.
    https://configu.com/docs/cfgu/
    """
    type: CfguType
    default: Optional[str] = None
    depends: Optional[List[str]] = None
    description: Optional[str] = None
    options: Optional[List[str]] = None
    pattern: Optional[str] = None
    required: Optional[bool] = None
    schema: Optional[Dict[str, Any]] = None
    template: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'Cfgu':
        assert isinstance(obj, dict)
        type = CfguType(obj.get("type"))
        default = from_union([from_str, from_none], obj.get("default"))
        depends = from_union([lambda x: from_list(from_str, x), from_none], obj.get("depends"))
        description = from_union([from_str, from_none], obj.get("description"))
        options = from_union([lambda x: from_list(from_str, x), from_none], obj.get("options"))
        pattern = from_union([from_str, from_none], obj.get("pattern"))
        required = from_union([from_bool, from_none], obj.get("required"))
        schema = from_union([lambda x: from_dict(lambda x: x, x), from_none], obj.get("schema"))
        template = from_union([from_str, from_none], obj.get("template"))
        return Cfgu(type, default, depends, description, options, pattern, required, schema, template)

    def to_dict(self) -> dict:
        result: dict = {}
        result["type"] = to_enum(CfguType, self.type)
        if self.default is not None:
            result["default"] = from_union([from_str, from_none], self.default)
        if self.depends is not None:
            result["depends"] = from_union([lambda x: from_list(from_str, x), from_none], self.depends)
        if self.description is not None:
            result["description"] = from_union([from_str, from_none], self.description)
        if self.options is not None:
            result["options"] = from_union([lambda x: from_list(from_str, x), from_none], self.options)
        if self.pattern is not None:
            result["pattern"] = from_union([from_str, from_none], self.pattern)
        if self.required is not None:
            result["required"] = from_union([from_bool, from_none], self.required)
        if self.schema is not None:
            result["schema"] = from_union([lambda x: from_dict(lambda x: x, x), from_none], self.schema)
        if self.template is not None:
            result["template"] = from_union([from_str, from_none], self.template)
        return result


@dataclass
class Config:
    """A generic representation of `application configuration` using three properties: `key`,
    `value`, `set`.
    https://configu.com/docs/terminology/#config
    """
    key: str
    set: str
    value: str

    @staticmethod
    def from_dict(obj: Any) -> 'Config':
        assert isinstance(obj, dict)
        key = from_str(obj.get("key"))
        set = from_str(obj.get("set"))
        value = from_str(obj.get("value"))
        return Config(key, set, value)

    def to_dict(self) -> dict:
        result: dict = {}
        result["key"] = from_str(self.key)
        result["set"] = from_str(self.set)
        result["value"] = from_str(self.value)
        return result


@dataclass
class ConfigSchemaContentsValue:
    type: CfguType
    default: Optional[str] = None
    depends: Optional[List[str]] = None
    description: Optional[str] = None
    options: Optional[List[str]] = None
    pattern: Optional[str] = None
    required: Optional[bool] = None
    schema: Optional[Dict[str, Any]] = None
    template: Optional[str] = None

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigSchemaContentsValue':
        assert isinstance(obj, dict)
        type = CfguType(obj.get("type"))
        default = from_union([from_str, from_none], obj.get("default"))
        depends = from_union([lambda x: from_list(from_str, x), from_none], obj.get("depends"))
        description = from_union([from_str, from_none], obj.get("description"))
        options = from_union([lambda x: from_list(from_str, x), from_none], obj.get("options"))
        pattern = from_union([from_str, from_none], obj.get("pattern"))
        required = from_union([from_bool, from_none], obj.get("required"))
        schema = from_union([lambda x: from_dict(lambda x: x, x), from_none], obj.get("schema"))
        template = from_union([from_str, from_none], obj.get("template"))
        return ConfigSchemaContentsValue(type, default, depends, description, options, pattern, required, schema, template)

    def to_dict(self) -> dict:
        result: dict = {}
        result["type"] = to_enum(CfguType, self.type)
        if self.default is not None:
            result["default"] = from_union([from_str, from_none], self.default)
        if self.depends is not None:
            result["depends"] = from_union([lambda x: from_list(from_str, x), from_none], self.depends)
        if self.description is not None:
            result["description"] = from_union([from_str, from_none], self.description)
        if self.options is not None:
            result["options"] = from_union([lambda x: from_list(from_str, x), from_none], self.options)
        if self.pattern is not None:
            result["pattern"] = from_union([from_str, from_none], self.pattern)
        if self.required is not None:
            result["required"] = from_union([from_bool, from_none], self.required)
        if self.schema is not None:
            result["schema"] = from_union([lambda x: from_dict(lambda x: x, x), from_none], self.schema)
        if self.template is not None:
            result["template"] = from_union([from_str, from_none], self.template)
        return result


@dataclass
class ConfigSchema:
    """A file containing binding records linking each unique `ConfigKey` to its corresponding
    `Cfgu` declaration.
    https://configu.com/docs/config-schema/
    """
    contents: Dict[str, ConfigSchemaContentsValue]
    name: str

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigSchema':
        assert isinstance(obj, dict)
        contents = from_dict(ConfigSchemaContentsValue.from_dict, obj.get("contents"))
        name = from_str(obj.get("name"))
        return ConfigSchema(contents, name)

    def to_dict(self) -> dict:
        result: dict = {}
        result["contents"] = from_dict(lambda x: to_class(ConfigSchemaContentsValue, x), self.contents)
        result["name"] = from_str(self.name)
        return result


@dataclass
class ConfigSet:
    """A unique, case-sensitive path within a tree-like data structure that groups `Config`s
    contextually.
    https://configu.com/docs/config-set/
    """
    hierarchy: List[str]
    path: str

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigSet':
        assert isinstance(obj, dict)
        hierarchy = from_list(from_str, obj.get("hierarchy"))
        path = from_str(obj.get("path"))
        return ConfigSet(hierarchy, path)

    def to_dict(self) -> dict:
        result: dict = {}
        result["hierarchy"] = from_list(from_str, self.hierarchy)
        result["path"] = from_str(self.path)
        return result


@dataclass
class ConfigStoreQuery:
    key: str
    set: str

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigStoreQuery':
        assert isinstance(obj, dict)
        key = from_str(obj.get("key"))
        set = from_str(obj.get("set"))
        return ConfigStoreQuery(key, set)

    def to_dict(self) -> dict:
        result: dict = {}
        result["key"] = from_str(self.key)
        result["set"] = from_str(self.set)
        return result


@dataclass
class ConfigStoreContentsElement:
    key: str
    set: str
    value: str

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigStoreContentsElement':
        assert isinstance(obj, dict)
        key = from_str(obj.get("key"))
        set = from_str(obj.get("set"))
        value = from_str(obj.get("value"))
        return ConfigStoreContentsElement(key, set, value)

    def to_dict(self) -> dict:
        result: dict = {}
        result["key"] = from_str(self.key)
        result["set"] = from_str(self.set)
        result["value"] = from_str(self.value)
        return result


@dataclass
class ConfigStore:
    """A storage engine interface for `Config`s records.
    https://configu.com/docs/config-store/
    """
    type: str

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigStore':
        assert isinstance(obj, dict)
        type = from_str(obj.get("type"))
        return ConfigStore(type)

    def to_dict(self) -> dict:
        result: dict = {}
        result["type"] = from_str(self.type)
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


def config_schema_contents_value_from_dict(s: Any) -> ConfigSchemaContentsValue:
    return ConfigSchemaContentsValue.from_dict(s)


def config_schema_contents_value_to_dict(x: ConfigSchemaContentsValue) -> Any:
    return to_class(ConfigSchemaContentsValue, x)


def config_schema_contents_from_dict(s: Any) -> Dict[str, ConfigSchemaContentsValue]:
    return from_dict(ConfigSchemaContentsValue.from_dict, s)


def config_schema_contents_to_dict(x: Dict[str, ConfigSchemaContentsValue]) -> Any:
    return from_dict(lambda x: to_class(ConfigSchemaContentsValue, x), x)


def config_schema_from_dict(s: Any) -> ConfigSchema:
    return ConfigSchema.from_dict(s)


def config_schema_to_dict(x: ConfigSchema) -> Any:
    return to_class(ConfigSchema, x)


def config_set_from_dict(s: Any) -> ConfigSet:
    return ConfigSet.from_dict(s)


def config_set_to_dict(x: ConfigSet) -> Any:
    return to_class(ConfigSet, x)


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


def config_store_from_dict(s: Any) -> ConfigStore:
    return ConfigStore.from_dict(s)


def config_store_to_dict(x: ConfigStore) -> Any:
    return to_class(ConfigStore, x)
