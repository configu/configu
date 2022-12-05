export enum CfguType {
  Json = "json",
  Yaml = "yaml",
}

/**
 * A generic representation of a <schema>.cfgu.[json|yaml] file that contains ConfigSchema records ([<key>: string]: ConfigSchema)
 */
export interface Cfgu {
  path: string;
  type: CfguType;
  name: string;
  contents: string;
}
