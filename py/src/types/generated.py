from enum import Enum
from typing import Optional, List, Any, Dict, TypeVar, Callable, Type, cast


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


def to_enum(c: Type[EnumT], x: Any) -> EnumT:
    assert isinstance(x, c)
    return x.value


def to_class(c: Type[T], x: Any) -> dict:
    assert isinstance(x, c)
    return cast(Any, x).to_dict()


def from_dict(f: Callable[[Any], T], x: Any) -> Dict[str, T]:
    assert isinstance(x, dict)
    return { k: f(v) for (k, v) in x.items() }


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

    def __init__(self, default: Optional[str], depends: Optional[List[str]], description: Optional[str], pattern: Optional[str], required: Optional[bool], template: Optional[str], type: CfguType) -> None:
        self.default = default
        self.depends = depends
        self.description = description
        self.pattern = pattern
        self.required = required
        self.template = template
        self.type = type

    @staticmethod
    def from_dict(obj: Any) -> 'Cfgu':
        assert isinstance(obj, dict)
        default = from_union([from_str, from_none], obj.get("default"))
        depends = from_union([lambda x: from_list(from_str, x), from_none], obj.get("depends"))
        description = from_union([from_str, from_none], obj.get("description"))
        pattern = from_union([from_str, from_none], obj.get("pattern"))
        required = from_union([from_bool, from_none], obj.get("required"))
        template = from_union([from_str, from_none], obj.get("template"))
        type = CfguType(obj.get("type"))
        return Cfgu(default, depends, description, pattern, required, template, type)

    def to_dict(self) -> dict:
        result: dict = {}
        if self.default is not None:
            result["default"] = from_union([from_str, from_none], self.default)
        if self.depends is not None:
            result["depends"] = from_union([lambda x: from_list(from_str, x), from_none], self.depends)
        if self.description is not None:
            result["description"] = from_union([from_str, from_none], self.description)
        if self.pattern is not None:
            result["pattern"] = from_union([from_str, from_none], self.pattern)
        if self.required is not None:
            result["required"] = from_union([from_bool, from_none], self.required)
        if self.template is not None:
            result["template"] = from_union([from_str, from_none], self.template)
        result["type"] = to_enum(CfguType, self.type)
        return result


class Config:
    """A generic representation of a software configuration, aka Config"""
    key: str
    set: str
    value: str

    def __init__(self, key: str, set: str, value: str) -> None:
        self.key = key
        self.set = set
        self.value = value

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


class ConfigSchemaType(Enum):
    JSON = "json"


class ConfigSchema:
    """An interface of a <file>.cfgu.json, aka ConfigSchema
    that contains binding records between a unique Config.<key> and its Cfgu declaration
    """
    path: str
    type: ConfigSchemaType

    def __init__(self, path: str, type: ConfigSchemaType) -> None:
        self.path = path
        self.type = type

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigSchema':
        assert isinstance(obj, dict)
        path = from_str(obj.get("path"))
        type = ConfigSchemaType(obj.get("type"))
        return ConfigSchema(path, type)

    def to_dict(self) -> dict:
        result: dict = {}
        result["path"] = from_str(self.path)
        result["type"] = to_enum(ConfigSchemaType, self.type)
        return result


class ConfigSchemaContentsValue:
    default: Optional[str]
    depends: Optional[List[str]]
    description: Optional[str]
    pattern: Optional[str]
    required: Optional[bool]
    template: Optional[str]
    type: CfguType

    def __init__(self, default: Optional[str], depends: Optional[List[str]], description: Optional[str], pattern: Optional[str], required: Optional[bool], template: Optional[str], type: CfguType) -> None:
        self.default = default
        self.depends = depends
        self.description = description
        self.pattern = pattern
        self.required = required
        self.template = template
        self.type = type

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigSchemaContentsValue':
        assert isinstance(obj, dict)
        default = from_union([from_str, from_none], obj.get("default"))
        depends = from_union([lambda x: from_list(from_str, x), from_none], obj.get("depends"))
        description = from_union([from_str, from_none], obj.get("description"))
        pattern = from_union([from_str, from_none], obj.get("pattern"))
        required = from_union([from_bool, from_none], obj.get("required"))
        template = from_union([from_str, from_none], obj.get("template"))
        type = CfguType(obj.get("type"))
        return ConfigSchemaContentsValue(default, depends, description, pattern, required, template, type)

    def to_dict(self) -> dict:
        result: dict = {}
        if self.default is not None:
            result["default"] = from_union([from_str, from_none], self.default)
        if self.depends is not None:
            result["depends"] = from_union([lambda x: from_list(from_str, x), from_none], self.depends)
        if self.description is not None:
            result["description"] = from_union([from_str, from_none], self.description)
        if self.pattern is not None:
            result["pattern"] = from_union([from_str, from_none], self.pattern)
        if self.required is not None:
            result["required"] = from_union([from_bool, from_none], self.required)
        if self.template is not None:
            result["template"] = from_union([from_str, from_none], self.template)
        result["type"] = to_enum(CfguType, self.type)
        return result


class ConfigSet:
    """An interface of a path in an hierarchy, aka ConfigSet
    that uniquely groups Config.<key> with their Config.<value>.
    """
    hierarchy: List[str]
    path: str

    def __init__(self, hierarchy: List[str], path: str) -> None:
        self.hierarchy = hierarchy
        self.path = path

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


class ConfigStoreFeatures:
    inheritance: bool
    readonly: bool

    def __init__(self, inheritance: bool, readonly: bool) -> None:
        self.inheritance = inheritance
        self.readonly = readonly

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigStoreFeatures':
        assert isinstance(obj, dict)
        inheritance = from_bool(obj.get("inheritance"))
        readonly = from_bool(obj.get("readonly"))
        return ConfigStoreFeatures(inheritance, readonly)

    def to_dict(self) -> dict:
        result: dict = {}
        result["inheritance"] = from_bool(self.inheritance)
        result["readonly"] = from_bool(self.readonly)
        return result


class Features:
    inheritance: bool
    readonly: bool

    def __init__(self, inheritance: bool, readonly: bool) -> None:
        self.inheritance = inheritance
        self.readonly = readonly

    @staticmethod
    def from_dict(obj: Any) -> 'Features':
        assert isinstance(obj, dict)
        inheritance = from_bool(obj.get("inheritance"))
        readonly = from_bool(obj.get("readonly"))
        return Features(inheritance, readonly)

    def to_dict(self) -> dict:
        result: dict = {}
        result["inheritance"] = from_bool(self.inheritance)
        result["readonly"] = from_bool(self.readonly)
        return result


class ConfigStore:
    """An interface of a storage, aka ConfigStore
    that I/Os Config records (Config[])
    """
    features: Features
    type: str

    def __init__(self, features: Features, type: str) -> None:
        self.features = features
        self.type = type

    @staticmethod
    def from_dict(obj: Any) -> 'ConfigStore':
        assert isinstance(obj, dict)
        features = Features.from_dict(obj.get("features"))
        type = from_str(obj.get("type"))
        return ConfigStore(features, type)

    def to_dict(self) -> dict:
        result: dict = {}
        result["features"] = to_class(Features, self.features)
        result["type"] = from_str(self.type)
        return result


class ConfigStoreQuery:
    key: str
    set: str

    def __init__(self, key: str, set: str) -> None:
        self.key = key
        self.set = set

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


class ConfigStoreContentsElement:
    key: str
    set: str
    value: str

    def __init__(self, key: str, set: str, value: str) -> None:
        self.key = key
        self.set = set
        self.value = value

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


def config_schema_contents_value_from_dict(s: Any) -> ConfigSchemaContentsValue:
    return ConfigSchemaContentsValue.from_dict(s)


def config_schema_contents_value_to_dict(x: ConfigSchemaContentsValue) -> Any:
    return to_class(ConfigSchemaContentsValue, x)


def config_schema_contents_from_dict(s: Any) -> Dict[str, ConfigSchemaContentsValue]:
    return from_dict(ConfigSchemaContentsValue.from_dict, s)


def config_schema_contents_to_dict(x: Dict[str, ConfigSchemaContentsValue]) -> Any:
    return from_dict(lambda x: to_class(ConfigSchemaContentsValue, x), x)


def config_set_from_dict(s: Any) -> ConfigSet:
    return ConfigSet.from_dict(s)


def config_set_to_dict(x: ConfigSet) -> Any:
    return to_class(ConfigSet, x)


def config_store_features_from_dict(s: Any) -> ConfigStoreFeatures:
    return ConfigStoreFeatures.from_dict(s)


def config_store_features_to_dict(x: ConfigStoreFeatures) -> Any:
    return to_class(ConfigStoreFeatures, x)


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
