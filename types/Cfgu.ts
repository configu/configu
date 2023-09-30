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
 * A generic declaration of a Config, aka Cfgu that specifies information about its type and other characteristics
 */
export interface Cfgu {
  type: CfguType;
  pattern?: string;
  schema?: { [key: string]: any };
  default?: string;
  required?: boolean;
  depends?: string[];
  template?: string;
  description?: string;
  options?: string[];
}
/** 
  CreditCard in a ConfigSchema should enforce a valid Credit Card number (amex, visa, mastercard, etc..) as a config value at upsert or eval **/

 {
  "types": {
    "CreditCard": {
      "validator": "validateCreditCard"
    }
  },
  "validators": {
    "validateCreditCard": {
      "type": "function",
      "function": "function(value) { 
        // Regular expression for validating credit card numbers
        var regex = /^(?:(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9][0-9])[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35\d{3})\d{11}))$/;
        return regex.test(value);
      }"
    }
  },
  "schemas": {
    "exampleSchema": {
      "fields": {
        "creditCardNumber": {
          "type": "CreditCard"
        }
      }
    }
  }
}
