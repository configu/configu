import _ from 'lodash';
import { CfguSchema } from './Cfgu';
import { ConfigKey } from './ConfigKey';
import { JSONSchema, JSONSchemaObject, FromSchema } from './expressions/JSONSchema';
import { ConfigValue } from './ConfigValue';
import { ConfigExpression } from './ConfigExpression';

// export type ConfigSchemaKeys = { [ConfigKey: string]: Cfgu };

const LEGACY_CFGU_VALUE_TYPE_VALIDATORS: Record<string, string> = {
  Boolean: 'validator.isBoolean($.storedValue, { loose: true })',
  Number: 'validator.isNumeric($.storedValue)',
  String: 'true',
  RegEx: 'expect($.cfgu.pattern).to.exist',
  UUID: 'validator.isUUID($.storedValue)',
  SemVer: 'validator.isSemVer($.storedValue)',
  Email: 'validator.isEmail($.storedValue)',
  MobilePhone: 'validator.isMobilePhone($.storedValue)',
  Locale: 'validator.isLocale($.storedValue)',
  LatLong: 'validator.isLatLong($.storedValue)',
  Color: 'validator.isHexColor($.storedValue) || validator.isHSL($.storedValue) || validator.isRgbColor($.storedValue)',
  IPv4: 'validator.isIP($.storedValue, 4)',
  IPv6: 'validator.isIP($.storedValue, 6)',
  Domain: 'validator.isFQDN($.storedValue)',
  URL: 'validator.isURL($.storedValue)',
  Hex: 'validator.isHexadecimal($.storedValue)',
  Base64: 'validator.isBase64($.storedValue)',
  MD5: 'validator.isHash($.storedValue, "md5")',
  SHA: 'validator.isHash($.storedValue, "sha1") || validator.isHash($.storedValue, "sha256") || validator.isHash($.storedValue, "sha384") || validator.isHash($.storedValue, "sha512")',
  Country: 'validator.isISO31661Alpha2($.storedValue) || validator.isISO31661Alpha3($.storedValue)',
  Currency: 'validator.isISO4217($.storedValue)',
  DockerImage:
    '/^((?:[a-z0-9]([-a-z0-9]*[a-z0-9])?.)+[a-z]{2,6}(?::d{1,5})?/)?[a-z0-9]+(?:[._-/:][a-z0-9]+)*$/gm.test($.storedValue)',
  ARN: '/^arn:([^:\n]+):([^:\n]+):(?:[^:\n]*):(?:([^:\n]*)):([^:/\n]+)(?:(:[^\n]+)|(/[^:\n]+))?$/gm.test($.storedValue)',
  MACAddress: 'validator.isMACAddress($.storedValue)',
  MIMEType: 'validator.isMimeType($.storedValue)',
  MongoId: 'validator.isMongoId($.storedValue)',
  AWSRegion:
    'new Set(["af-south-1","ap-east-1","ap-northeast-1","ap-northeast-2","ap-northeast-3","ap-south-1","ap-southeast-1","ap-southeast-2","ca-central-1","cn-north-1","cn-northwest-1","eu-central-1","eu-north-1","eu-south-1","eu-west-1","eu-west-2","eu-west-3","me-south-1","sa-east-1","us-east-1","us-east-2","us-gov-east-1","us-gov-west-1","us-west-1","us-west-2"]).has($.storedValue)',
  AZRegion:
    'new Set(["eastus","eastus2","centralus","northcentralus","southcentralus","westcentralus","westus","westus2","canadacentral","canadaeast","brazilsouth","brazilsoutheast","northeurope","westeurope","uksouth","ukwest","francecentral","francesouth","switzerlandnorth","switzerlandwest","germanywestcentral","norwayeast","norwaywest","eastasia","southeastasia","australiaeast","australiasoutheast","australiacentral","australiacentral2","japaneast","japanwest","koreacentral","koreasouth","southafricanorth","southafricawest","uaenorth","uaecentral","usgovarizona","usgovtexas","usdodeast","usdodcentral","usgovvirginia","usgoviowa","usgovcalifornia","ussecwest","usseceast"]).has($.storedValue)',
  GCPRegion:
    'new Set(["us-east1","us-east4","us-west1","us-west2","us-west3","us-central1","northamerica-northeast1","southamerica-east1","europe-north1","europe-west1","europe-west2","europe-west3","europe-west4","europe-west6","asia-east1","asia-east2","asia-northeast1","asia-northeast2","asia-northeast3","asia-south1","asia-southeast1","australia-southeast1","australia-southeast2","southasia-east1","northamerica-northeast2","europe-central2","asia-southeast2","asia-east3","europe-west7","us-west4","europe-west8","asia-northeast4","asia-southeast3","us-west5","us-central2","us-east5","us-north1","northamerica-northeast3","us-west6"]).has($.storedValue)',
  OracleRegion:
    'new Set(["us-ashburn-1","us-phoenix-1","ca-toronto-1","sa-saopaulo-1","uk-london-1","uk-gov-london-1","eu-frankfurt-1","eu-zurich-1","eu-amsterdam-1","me-jeddah-1","ap-mumbai-1","ap-osaka-1","ap-seoul-1","ap-sydney-1","ap-tokyo-1","ap-chuncheon-1","ap-melbourne-1","ap-hyderabad-1","ca-montreal-1","us-sanjose-1","us-luke-1","me-dubai-1","us-gov-ashburn-1","us-gov-chicago-1","us-gov-phoenix-1","us-gov-orlando-1","us-gov-sanjose-1","us-gov-ashburn-2"]).has($.storedValue)',
  IBMRegion:
    'new Set(["us-south","us-east","us-north","us-west","eu-gb","eu-de","eu-nl","eu-fr","eu-it","ap-north","ap-south","ap-east","ap-jp","ap-au","ca-toronto","ca-central","sa-saopaulo","sa-mexico","sa-buenosaires","sa-lima","sa-santiago","af-za","af-eg","af-dz","af-ma"]).has($.storedValue)',
  AlibabaRegion:
    'new Set(["cn-hangzhou","cn-shanghai","cn-beijing","cn-shenzhen","cn-zhangjiakou","cn-huhehaote","cn-wulanchabu","ap-southeast-1","ap-southeast-2","ap-southeast-3","ap-southeast-5","ap-northeast-1","ap-south-1","ap-south-2","us-west-1","us-east-1","eu-west-1","eu-central-1","me-east-1","ap-southwest-1"]).has($.storedValue)',
  Language: 'validator.isISO6391($.storedValue)',
  DateTime:
    'validator.isDate($.storedValue) || validator.isTime($.storedValue) || !Number.isNaN(new Date($.storedValue).getTime())',
  JSONSchema: 'expect($.cfgu.schema).to.exist',
};

export const ConfigSchemaKeysSchema = {
  type: 'object',
  required: [],
  minProperties: 1,
  // todo: patternProperties is not supported by OpenAPI and has limited error resolution support. Thats why we currently use additionalProperties and check key Naming separately.
  // additionalProperties: false,
  // patternProperties: {
  //   [Naming.pattern]: CfguSchema,
  // },
  additionalProperties: CfguSchema,
} as const satisfies JSONSchemaObject;

export type ConfigSchemaKeys = FromSchema<typeof ConfigSchemaKeysSchema>;

export type V0ConfigSchemaKeys = { [x: string]: any };

/**
 * A file containing binding records linking each unique `ConfigKey` to its corresponding `Cfgu` declaration.
 * https://configu.com/docs/config-schema/
 */
export class ConfigSchema {
  constructor(public readonly keys: ConfigSchemaKeys = {}) {
    if (_.isEmpty(this.keys)) {
      throw new Error('ConfigSchema.keys is required');
    }

    _.chain(this.keys)
      .entries()
      .forEach(([key, cfgu]) => {
        ConfigKey.validate({ key, errorPrefix: 'ConfigSchema.keys' });
        // if (!JsonSchema.validate({ schema: CfguSchema, data: cfgu })) {
        //   throw new Error(`ConfigSchema.keys "${key}" is invalid\n${JsonSchema.getLastValidationError()}`);
        // }
      });

    try {
      JSONSchema.validate(ConfigSchemaKeysSchema, this.keys);
    } catch (error) {
      throw new Error(`ConfigSchema.keys are invalid\n${error.message}`);
    }
  }

  static fromLegacyConfigSchema(contents: V0ConfigSchemaKeys) {
    const migratedContents: ConfigSchemaKeys = _(contents)
      .mapValues((value, key) => {
        const { type, options, depends, labels, template, ...restCfguProps } = value;
        const migratedCfgu = { ...restCfguProps, test: [] };
        if (type) {
          migratedCfgu.test.push(LEGACY_CFGU_VALUE_TYPE_VALIDATORS[type]);
        }
        if (options) {
          migratedCfgu.enum = options.map((option: string) => ConfigValue.parse(option));
        }
        if (labels) {
          migratedCfgu.label = labels;
        }
        if (depends) {
          depends.forEach((dependencyKey: string) => {
            migratedCfgu.test.push(
              `expect($.configs.${dependencyKey}.storedValue, 'Dependency ${dependencyKey} is missing for ${key}').to.not.be.empty`,
            );
          });
        }
        if (template) {
          migratedCfgu.const = template.replace(ConfigExpression.pattern, (match: string, group: string) => {
            if (contents[group]) {
              return `{{$.configs.${group}.storedValue}}`;
            }
            if (group === 'CONFIGU_STORE.type') {
              return `{{$.input.store.type}}`;
            }
            if (group === 'CONFIGU_SET.path') {
              return `{{$.input.set.path}}`;
            }
            if (group === 'CONFIGU_SET.hierarchy') {
              return `{{$.input.set.hierarchy}}`;
            }
            if (group === 'CONFIGU_SET.first') {
              return `{{_.first($.input.set.hierarchy)}}`;
            }
            if (group === 'CONFIGU_SET.last') {
              return `{{_.last($.input.set.hierarchy)}}`;
            }
            return match;
          });
        }
        return migratedCfgu;
      })
      .value();

    return new ConfigSchema(migratedContents);
  }
}
