// To parse this data:
//
//   import { Convert, CfguType, Cfgu, Config, ConfigSchemaContentsValue, ConfigSchema, ConfigSet, ConfigStoreQuery, ConfigStoreContentsElement, ConfigStore } from "./file";
//
//   const cfguType = Convert.toCfguType(json);
//   const cfgu = Convert.toCfgu(json);
//   const config = Convert.toConfig(json);
//   const configSchemaContentsValue = Convert.toConfigSchemaContentsValue(json);
//   const configSchemaContents = Convert.toConfigSchemaContents(json);
//   const configSchema = Convert.toConfigSchema(json);
//   const configSet = Convert.toConfigSet(json);
//   const configStoreQuery = Convert.toConfigStoreQuery(json);
//   const configStoreContentsElement = Convert.toConfigStoreContentsElement(json);
//   const configStoreContents = Convert.toConfigStoreContents(json);
//   const configStore = Convert.toConfigStore(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * A generic declaration of a `Config`, using properties like type, description and
 * constraints.
 * https://configu.com/docs/cfgu/
 */
export interface Cfgu {
    default?:     string;
    depends?:     string[];
    description?: string;
    options?:     string[];
    pattern?:     string;
    required?:    boolean;
    schema?:      { [key: string]: any };
    template?:    string;
    type:         CfguType;
}

export type CfguType = "ARN" | "AWSRegion" | "AZRegion" | "AlibabaRegion" | "Base64" | "Boolean" | "Color" | "ConnectionString" | "Country" | "Currency" | "DateTime" | "DockerImage" | "Domain" | "Email" | "GCPRegion" | "Hex" | "IBMRegion" | "IPv4" | "IPv6" | "JSONSchema" | "Language" | "LatLong" | "Locale" | "MACAddress" | "MD5" | "MIMEType" | "MobilePhone" | "MongoId" | "Number" | "OracleRegion" | "RegEx" | "SHA" | "SemVer" | "String" | "URL" | "UUID";

/**
 * A generic representation of `application configuration` using three properties: `key`,
 * `value`, `set`.
 * https://configu.com/docs/terminology/#config
 */
export interface Config {
    key:   string;
    set:   string;
    value: string;
}

/**
 * A file containing binding records linking each unique `ConfigKey` to its corresponding
 * `Cfgu` declaration.
 * https://configu.com/docs/config-schema/
 */
export interface ConfigSchema {
    contents: { [key: string]: ConfigSchemaContents };
    name:     string;
}

export interface ConfigSchemaContents {
    default?:     string;
    depends?:     string[];
    description?: string;
    options?:     string[];
    pattern?:     string;
    required?:    boolean;
    schema?:      { [key: string]: any };
    template?:    string;
    type:         CfguType;
}

/**
 * A unique, case-sensitive path within a tree-like data structure that groups `Config`s
 * contextually.
 * https://configu.com/docs/config-set/
 */
export interface ConfigSet {
    hierarchy: string[];
    path:      string;
}

export interface ConfigStoreQuery {
    key: string;
    set: string;
}

export interface ConfigStoreContents {
    key:   string;
    set:   string;
    value: string;
}

/**
 * A storage engine interface for `Config`s records.
 * https://configu.com/docs/config-store/
 */
export interface ConfigStore {
    type: string;
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

    public static toConfig(json: string): Config {
        return cast(JSON.parse(json), r("Config"));
    }

    public static configToJson(value: Config): string {
        return JSON.stringify(uncast(value, r("Config")), null, 2);
    }

    public static toConfigSchemaContentsValue(json: string): ConfigSchemaContents {
        return cast(JSON.parse(json), r("ConfigSchemaContents"));
    }

    public static configSchemaContentsValueToJson(value: ConfigSchemaContents): string {
        return JSON.stringify(uncast(value, r("ConfigSchemaContents")), null, 2);
    }

    public static toConfigSchemaContents(json: string): { [key: string]: ConfigSchemaContents } {
        return cast(JSON.parse(json), m(r("ConfigSchemaContents")));
    }

    public static configSchemaContentsToJson(value: { [key: string]: ConfigSchemaContents }): string {
        return JSON.stringify(uncast(value, m(r("ConfigSchemaContents"))), null, 2);
    }

    public static toConfigSchema(json: string): ConfigSchema {
        return cast(JSON.parse(json), r("ConfigSchema"));
    }

    public static configSchemaToJson(value: ConfigSchema): string {
        return JSON.stringify(uncast(value, r("ConfigSchema")), null, 2);
    }

    public static toConfigSet(json: string): ConfigSet {
        return cast(JSON.parse(json), r("ConfigSet"));
    }

    public static configSetToJson(value: ConfigSet): string {
        return JSON.stringify(uncast(value, r("ConfigSet")), null, 2);
    }

    public static toConfigStoreQuery(json: string): ConfigStoreQuery {
        return cast(JSON.parse(json), r("ConfigStoreQuery"));
    }

    public static configStoreQueryToJson(value: ConfigStoreQuery): string {
        return JSON.stringify(uncast(value, r("ConfigStoreQuery")), null, 2);
    }

    public static toConfigStoreContentsElement(json: string): ConfigStoreContents {
        return cast(JSON.parse(json), r("ConfigStoreContents"));
    }

    public static configStoreContentsElementToJson(value: ConfigStoreContents): string {
        return JSON.stringify(uncast(value, r("ConfigStoreContents")), null, 2);
    }

    public static toConfigStoreContents(json: string): ConfigStoreContents[] {
        return cast(JSON.parse(json), a(r("ConfigStoreContents")));
    }

    public static configStoreContentsToJson(value: ConfigStoreContents[]): string {
        return JSON.stringify(uncast(value, a(r("ConfigStoreContents"))), null, 2);
    }

    public static toConfigStore(json: string): ConfigStore {
        return cast(JSON.parse(json), r("ConfigStore"));
    }

    public static configStoreToJson(value: ConfigStore): string {
        return JSON.stringify(uncast(value, r("ConfigStore")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
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

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
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
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
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

function l(typ: any) {
    return { literal: typ };
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
        { json: "default", js: "default", typ: u(undefined, "") },
        { json: "depends", js: "depends", typ: u(undefined, a("")) },
        { json: "description", js: "description", typ: u(undefined, "") },
        { json: "options", js: "options", typ: u(undefined, a("")) },
        { json: "pattern", js: "pattern", typ: u(undefined, "") },
        { json: "required", js: "required", typ: u(undefined, true) },
        { json: "schema", js: "schema", typ: u(undefined, m("any")) },
        { json: "template", js: "template", typ: u(undefined, "") },
        { json: "type", js: "type", typ: r("CfguType") },
    ], false),
    "Config": o([
        { json: "key", js: "key", typ: "" },
        { json: "set", js: "set", typ: "" },
        { json: "value", js: "value", typ: "" },
    ], false),
    "ConfigSchema": o([
        { json: "contents", js: "contents", typ: m(r("ConfigSchemaContents")) },
        { json: "name", js: "name", typ: "" },
    ], false),
    "ConfigSchemaContents": o([
        { json: "default", js: "default", typ: u(undefined, "") },
        { json: "depends", js: "depends", typ: u(undefined, a("")) },
        { json: "description", js: "description", typ: u(undefined, "") },
        { json: "options", js: "options", typ: u(undefined, a("")) },
        { json: "pattern", js: "pattern", typ: u(undefined, "") },
        { json: "required", js: "required", typ: u(undefined, true) },
        { json: "schema", js: "schema", typ: u(undefined, m("any")) },
        { json: "template", js: "template", typ: u(undefined, "") },
        { json: "type", js: "type", typ: r("CfguType") },
    ], false),
    "ConfigSet": o([
        { json: "hierarchy", js: "hierarchy", typ: a("") },
        { json: "path", js: "path", typ: "" },
    ], false),
    "ConfigStoreQuery": o([
        { json: "key", js: "key", typ: "" },
        { json: "set", js: "set", typ: "" },
    ], false),
    "ConfigStoreContents": o([
        { json: "key", js: "key", typ: "" },
        { json: "set", js: "set", typ: "" },
        { json: "value", js: "value", typ: "" },
    ], false),
    "ConfigStore": o([
        { json: "type", js: "type", typ: "" },
    ], false),
    "CfguType": [
        "AWSRegion",
        "AZRegion",
        "AlibabaRegion",
        "ARN",
        "Base64",
        "Boolean",
        "Color",
        "ConnectionString",
        "Country",
        "Currency",
        "DateTime",
        "DockerImage",
        "Domain",
        "Email",
        "GCPRegion",
        "Hex",
        "IBMRegion",
        "IPv4",
        "IPv6",
        "JSONSchema",
        "Language",
        "LatLong",
        "Locale",
        "MACAddress",
        "MIMEType",
        "MD5",
        "MobilePhone",
        "MongoId",
        "Number",
        "OracleRegion",
        "RegEx",
        "SHA",
        "SemVer",
        "String",
        "URL",
        "UUID",
    ],
};
