import { Cfgu } from "./Cfgu";

export enum ConfigSchemaType {
  Json = "json",
  Yaml = "yaml",
}

/**
 * An interface of a <uid>.cfgu.[json|yaml] file, aka ConfigSchema
 * that contains binding records between a unique Config <key> and its Cfgu declaration
 */
export interface ConfigSchema {
  path: string;
  type: ConfigSchemaType;
  uid: string;
  contents: string;
}


// export interface ConfigSchemaContentsValue extends Cfgu {};
export interface ConfigSchemaContents {
  contents: {[key: string]: Cfgu}
};
