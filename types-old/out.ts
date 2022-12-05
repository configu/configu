// To parse this data:
//
//   import { Convert, CfguType, Cfgu, ConfigSchemaType, ConfigSchema, Set, Store, StoreQueryElement, Config } from "./file";
//
//   const cfguType = Convert.toCfguType(json);
//   const cfgu = Convert.toCfgu(json);
//   const configSchemaType = Convert.toConfigSchemaType(json);
//   const configSchema = Convert.toConfigSchema(json);
//   const cfguContents = Convert.toCfguContents(json);
//   const set = Convert.toSet(json);
//   const store = Convert.toStore(json);
//   const storeQueryElement = Convert.toStoreQueryElement(json);
//   const storeQuery = Convert.toStoreQuery(json);
//   const config = Convert.toConfig(json);
//   const storeContents = Convert.toStoreContents(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * A generic representation of a <schema>.cfgu.[json|yaml] file that contains ConfigSchema
 * records ([<key>: string]: ConfigSchema)
 */
export interface Cfgu {
    contents: string;
    name:     string;
    path:     string;
    type:     CfguType;
}

export enum CfguType {
    JSON = "json",
    YAML = "yaml",
}

export interface CfguContents {
    default?:     string;
    depends?:     string[];
    description?: string;
    pattern?:     string;
    required?:    boolean;
    template?:    string;
    type:         ConfigSchemaType;
}

export enum ConfigSchemaType {
    Base64 = "Base64",
    Boolean = "Boolean",
    Color = "Color",
    ConnectionString = "ConnectionString",
    Country = "Country",
    Currency = "Currency",
    Domain = "Domain",
    Email = "Email",
    Hex = "Hex",
    IPv4 = "IPv4",
    IPv6 = "IPv6",
    LatLong = "LatLong",
    Locale = "Locale",
    Md5 = "MD5",
    MobilePhone = "MobilePhone",
    Number = "Number",
    RegEx = "RegEx",
    SHA = "SHA",
    SemVer = "SemVer",
    String = "String",
    URL = "URL",
    UUID = "UUID",
}

/**
 * A generic representation of a ConfigSet that contains a path hierarchy to differentiate
 * Config values and enable inheritance
 */
export interface Set {
    hierarchy: string[];
    path:      string;
}

/**
 * A generic representation of a ConfigStore that contains Config records (Config[])
 */
export interface Store {
    scheme: string;
    uid:    string;
}

export interface StoreQuery {
    key:    string;
    schema: string;
    set:    string;
}

/**
 * A generic representation of a software configuration, aka Config
 */
export interface StoreContents {
    key:    string;
    schema: string;
    set:    string;
    value:  string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toCfguType(json: string): CfguType {
        return cast(JSON.parse(json), r("CfguType"));
    }

    public static cfguTypeToJson(value: CfguType): string {
        return JSON.stringify(uncast(value, r("CfguType")), null, 2);
    }

    public static toCfgu(json: string): Cfgu {
        return cast(JSON.parse(json), r("Cfgu"));
    }

    public static cfguToJson(value: Cfgu): string {
        return JSON.stringify(uncast(value, r("Cfgu")), null, 2);
    }

    public static toConfigSchemaType(json: string): ConfigSchemaType {
        return cast(JSON.parse(json), r("ConfigSchemaType"));
    }

    public static configSchemaTypeToJson(value: ConfigSchemaType): string {
        return JSON.stringify(uncast(value, r("ConfigSchemaType")), null, 2);
    }

    public static toConfigSchema(json: string): CfguContents {
        return cast(JSON.parse(json), r("CfguContents"));
    }

    public static configSchemaToJson(value: CfguContents): string {
        return JSON.stringify(uncast(value, r("CfguContents")), null, 2);
    }

    public static toCfguContents(json: string): { [key: string]: CfguContents } {
        return cast(JSON.parse(json), m(r("CfguContents")));
    }

    public static cfguContentsToJson(value: { [key: string]: CfguContents }): string {
        return JSON.stringify(uncast(value, m(r("CfguContents"))), null, 2);
    }

    public static toSet(json: string): Set {
        return cast(JSON.parse(json), r("Set"));
    }

    public static setToJson(value: Set): string {
        return JSON.stringify(uncast(value, r("Set")), null, 2);
    }

    public static toStore(json: string): Store {
        return cast(JSON.parse(json), r("Store"));
    }

    public static storeToJson(value: Store): string {
        return JSON.stringify(uncast(value, r("Store")), null, 2);
    }

    public static toStoreQueryElement(json: string): StoreQuery {
        return cast(JSON.parse(json), r("StoreQuery"));
    }

    public static storeQueryElementToJson(value: StoreQuery): string {
        return JSON.stringify(uncast(value, r("StoreQuery")), null, 2);
    }

    public static toStoreQuery(json: string): StoreQuery[] {
        return cast(JSON.parse(json), a(r("StoreQuery")));
    }

    public static storeQueryToJson(value: StoreQuery[]): string {
        return JSON.stringify(uncast(value, a(r("StoreQuery"))), null, 2);
    }

    public static toConfig(json: string): StoreContents {
        return cast(JSON.parse(json), r("StoreContents"));
    }

    public static configToJson(value: StoreContents): string {
        return JSON.stringify(uncast(value, r("StoreContents")), null, 2);
    }

    public static toStoreContents(json: string): StoreContents[] {
        return cast(JSON.parse(json), a(r("StoreContents")));
    }

    public static storeContentsToJson(value: StoreContents[]): string {
        return JSON.stringify(uncast(value, a(r("StoreContents"))), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Cfgu": o([
        { json: "contents", js: "contents", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "path", js: "path", typ: "" },
        { json: "type", js: "type", typ: r("CfguType") },
    ], "any"),
    "CfguContents": o([
        { json: "default", js: "default", typ: u(undefined, "") },
        { json: "depends", js: "depends", typ: u(undefined, a("")) },
        { json: "description", js: "description", typ: u(undefined, "") },
        { json: "pattern", js: "pattern", typ: u(undefined, "") },
        { json: "required", js: "required", typ: u(undefined, true) },
        { json: "template", js: "template", typ: u(undefined, "") },
        { json: "type", js: "type", typ: r("ConfigSchemaType") },
    ], "any"),
    "Set": o([
        { json: "hierarchy", js: "hierarchy", typ: a("") },
        { json: "path", js: "path", typ: "" },
    ], "any"),
    "Store": o([
        { json: "scheme", js: "scheme", typ: "" },
        { json: "uid", js: "uid", typ: "" },
    ], "any"),
    "StoreQuery": o([
        { json: "key", js: "key", typ: "" },
        { json: "schema", js: "schema", typ: "" },
        { json: "set", js: "set", typ: "" },
    ], "any"),
    "StoreContents": o([
        { json: "key", js: "key", typ: "" },
        { json: "schema", js: "schema", typ: "" },
        { json: "set", js: "set", typ: "" },
        { json: "value", js: "value", typ: "" },
    ], "any"),
    "CfguType": [
        "json",
        "yaml",
    ],
    "ConfigSchemaType": [
        "Base64",
        "Boolean",
        "Color",
        "ConnectionString",
        "Country",
        "Currency",
        "Domain",
        "Email",
        "Hex",
        "IPv4",
        "IPv6",
        "LatLong",
        "Locale",
        "MD5",
        "MobilePhone",
        "Number",
        "RegEx",
        "SHA",
        "SemVer",
        "String",
        "URL",
        "UUID",
    ],
};
