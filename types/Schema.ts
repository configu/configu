export enum SchemaType {
  Json = "json",
  Yaml = "yaml",
}

/**
 * A generic representation of a <schema.uid>.cfgu.[json|yaml] file that contains ConfigSchema records ([<key>: string]: ConfigSchema)
 */
export interface Schema {
  path: string;
  type: SchemaType;
  uid: string;
  contents: string;
}
