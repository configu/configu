export type CfguType =
  | "Boolean"
  | "Number"
  | "String"
  | "RegEx"
  | "UUID"
  | "SemVer"
  | "IPv4"
  | "IPv6"
  | "Domain"
  | "URL"
  | "ConnectionString"
  | "Hex"
  | "Base64"
  | "MD5"
  | "SHA"
  | "Color"
  | "Email"
  | "MobilePhone"
  | "Locale"
  | "LatLong"
  | "Country"
  | "Currency"
  | "DockerImage"
  | "Binary";

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
