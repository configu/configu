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
  Ipv4 = "IPv4",
  Ipv6 = "IPv6",
  LatLong = "LatLong",
  Locale = "Locale",
  Md5 = "MD5",
  MobilePhone = "MobilePhone",
  Number = "Number",
  RegEx = "RegEx",
  Sha = "SHA",
  SemVer = "SemVer",
  String = "String",
  Url = "URL",
  Uuid = "UUID",
}

export interface ConfigSchema {
  type: ConfigSchemaType;
  default?: string;
  depends?: string[];
  description?: string;
  pattern?: string;
  required?: boolean;
  template?: string;
}

export type CfguContents = { [key: string]: ConfigSchema };
