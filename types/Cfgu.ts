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
  | "MACAddress"
  | "MIMEType"
  | "MongoId"
  | "AWSRegion"
  | "AZRegion"
  | "GCPRegion"
  | "OracleRegion"
  | "IBMRegion"
  | "AlibabaRegion"
  | "Language"
  | "DateTime"
  | "ARN"
  | "JSONSchema";

/**
 * A generic declaration of a `Config`, using properties like type, description and constraints.
 * https://configu.com/docs/cfgu/
 */
export interface Cfgu {
  description?: string;
  type: CfguType;
  pattern?: string;
  schema?: { [key: string]: any };
  default?: string;
  required?: boolean;
  depends?: string[];
  template?: string;
  options?: string[];
}
