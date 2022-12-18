export enum CfguType {
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

/**
 * A generic declaration of a Config, aka Cfgu that specifies information about its type and other characteristics
 */
export interface Cfgu {
  type: CfguType;
  pattern?: string;
  default?: string;
  required?: boolean;
  depends?: string[];
  template?: string;
  description?: string;
}
