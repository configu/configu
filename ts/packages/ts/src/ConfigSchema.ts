import _ from 'lodash';
import validator from 'validator';
import { type IConfigSchema, type Cfgu, type CfguType, Convert } from './types';
import { ConfigError, JSON_SCHEMA, NAME, REGEX, TMPL } from './utils';

const CFGU_NAME = 'cfgu';
const CFGU_PROP: (keyof Cfgu)[] = [
  'type',
  'pattern',
  'schema',
  'options',
  'default',
  'required',
  'depends',
  'template',
  'description',
];
const CFGU_VALUE_TYPE_VALIDATORS: Record<CfguType, (parameters: Cfgu & { value: string }) => boolean> = {
  Boolean: ({ value }) => validator.isBoolean(value, { loose: true }),
  Number: ({ value }) => validator.isNumeric(value),
  String: () => true,
  RegEx: ({ value, pattern }) => {
    try {
      if (!pattern) {
        return false;
      }
      return REGEX(pattern, value);
    } catch (e) {
      return false;
    }
  },
  UUID: ({ value }) => validator.isUUID(value),
  SemVer: ({ value }) => validator.isSemVer(value),
  Email: ({ value }) => validator.isEmail(value),
  MobilePhone: ({ value }) => validator.isMobilePhone(value),
  Locale: ({ value }) => validator.isLocale(value),
  LatLong: ({ value }) => validator.isLatLong(value),
  Color: ({ value }) => validator.isHexColor(value) || validator.isHSL(value) || validator.isRgbColor(value),
  IPv4: ({ value }) => validator.isIP(value, 4),
  IPv6: ({ value }) => validator.isIP(value, 6),
  Domain: ({ value }) => validator.isFQDN(value),
  URL: ({ value }) => validator.isURL(value),
  ConnectionString: ({ value }) =>
    // eslint-disable-next-line no-useless-escape
    /^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/gm.test(value),
  Hex: ({ value }) => validator.isHexadecimal(value),
  Base64: ({ value }) => validator.isBase64(value),
  MD5: ({ value }) => validator.isHash(value, 'md5'),
  SHA: ({ value }) =>
    validator.isHash(value, 'sha1') ||
    validator.isHash(value, 'sha256') ||
    validator.isHash(value, 'sha384') ||
    validator.isHash(value, 'sha512'),
  Country: ({ value }) => validator.isISO31661Alpha2(value) || validator.isISO31661Alpha3(value),
  Currency: ({ value }) => validator.isISO4217(value),
  DockerImage: ({ value }) =>
    // eslint-disable-next-line no-useless-escape
    /^((?:[a-z0-9]([-a-z0-9]*[a-z0-9])?\.)+[a-z]{2,6}(?::\d{1,5})?\/)?[a-z0-9]+(?:[._\-\/:][a-z0-9]+)*$/gm.test(value),
  ARN: ({ value }) =>
    // eslint-disable-next-line no-useless-escape
    /^arn:([^:\n]+):([^:\n]+):(?:[^:\n]*):(?:([^:\n]*)):([^:\/\n]+)(?:(:[^\n]+)|(\/[^:\n]+))?$/gm.test(value),
  MACAddress: ({ value }) => validator.isMACAddress(value),
  MIMEType: ({ value }) => validator.isMimeType(value),
  MongoId: ({ value }) => validator.isMongoId(value),
  AWSRegion: ({ value }) =>
    new Set([
      'af-south-1',
      'ap-east-1',
      'ap-northeast-1',
      'ap-northeast-2',
      'ap-northeast-3',
      'ap-south-1',
      'ap-southeast-1',
      'ap-southeast-2',
      'ca-central-1',
      'cn-north-1',
      'cn-northwest-1',
      'eu-central-1',
      'eu-north-1',
      'eu-south-1',
      'eu-west-1',
      'eu-west-2',
      'eu-west-3',
      'me-south-1',
      'sa-east-1',
      'us-east-1',
      'us-east-2',
      'us-gov-east-1',
      'us-gov-west-1',
      'us-west-1',
      'us-west-2',
    ]).has(value),
  AZRegion: ({ value }) =>
    new Set([
      'eastus',
      'eastus2',
      'centralus',
      'northcentralus',
      'southcentralus',
      'westcentralus',
      'westus',
      'westus2',
      'canadacentral',
      'canadaeast',
      'brazilsouth',
      'brazilsoutheast',
      'northeurope',
      'westeurope',
      'uksouth',
      'ukwest',
      'francecentral',
      'francesouth',
      'switzerlandnorth',
      'switzerlandwest',
      'germanywestcentral',
      'norwayeast',
      'norwaywest',
      'eastasia',
      'southeastasia',
      'australiaeast',
      'australiasoutheast',
      'australiacentral',
      'australiacentral2',
      'japaneast',
      'japanwest',
      'koreacentral',
      'koreasouth',
      'southafricanorth',
      'southafricawest',
      'uaenorth',
      'uaecentral',
      'usgovarizona',
      'usgovtexas',
      'usdodeast',
      'usdodcentral',
      'usgovvirginia',
      'usgoviowa',
      'usgovcalifornia',
      'ussecwest',
      'usseceast',
    ]).has(value),
  GCPRegion: ({ value }) =>
    new Set([
      'us-east1',
      'us-east4',
      'us-west1',
      'us-west2',
      'us-west3',
      'us-central1',
      'northamerica-northeast1',
      'southamerica-east1',
      'europe-north1',
      'europe-west1',
      'europe-west2',
      'europe-west3',
      'europe-west4',
      'europe-west6',
      'asia-east1',
      'asia-east2',
      'asia-northeast1',
      'asia-northeast2',
      'asia-northeast3',
      'asia-south1',
      'asia-southeast1',
      'australia-southeast1',
      'australia-southeast2',
      'southasia-east1',
      'northamerica-northeast2',
      'europe-central2',
      'asia-southeast2',
      'asia-east3',
      'europe-west7',
      'us-west4',
      'europe-west8',
      'asia-northeast4',
      'asia-southeast3',
      'us-west5',
      'us-central2',
      'us-east5',
      'us-north1',
      'northamerica-northeast3',
      'us-west6',
    ]).has(value),
  OracleRegion: ({ value }) =>
    new Set([
      'us-ashburn-1',
      'us-phoenix-1',
      'ca-toronto-1',
      'sa-saopaulo-1',
      'uk-london-1',
      'uk-gov-london-1',
      'eu-frankfurt-1',
      'eu-zurich-1',
      'eu-amsterdam-1',
      'me-jeddah-1',
      'ap-mumbai-1',
      'ap-osaka-1',
      'ap-seoul-1',
      'ap-sydney-1',
      'ap-tokyo-1',
      'ap-chuncheon-1',
      'ap-melbourne-1',
      'ap-hyderabad-1',
      'ca-montreal-1',
      'us-sanjose-1',
      'us-luke-1',
      'me-dubai-1',
      'us-gov-ashburn-1',
      'us-gov-chicago-1',
      'us-gov-phoenix-1',
      'us-gov-orlando-1',
      'us-gov-sanjose-1',
      'us-gov-ashburn-2',
    ]).has(value),
  IBMRegion: ({ value }) =>
    new Set([
      'us-south',
      'us-east',
      'us-north',
      'us-west',
      'eu-gb',
      'eu-de',
      'eu-nl',
      'eu-fr',
      'eu-it',
      'ap-north',
      'ap-south',
      'ap-east',
      'ap-jp',
      'ap-au',
      'ca-toronto',
      'ca-central',
      'sa-saopaulo',
      'sa-mexico',
      'sa-buenosaires',
      'sa-lima',
      'sa-santiago',
      'af-za',
      'af-eg',
      'af-dz',
      'af-ma',
    ]).has(value),
  AlibabaRegion: ({ value }) =>
    new Set([
      'cn-hangzhou',
      'cn-shanghai',
      'cn-beijing',
      'cn-shenzhen',
      'cn-zhangjiakou',
      'cn-huhehaote',
      'cn-wulanchabu',
      'ap-southeast-1',
      'ap-southeast-2',
      'ap-southeast-3',
      'ap-southeast-5',
      'ap-northeast-1',
      'ap-south-1',
      'ap-south-2',
      'us-west-1',
      'us-east-1',
      'eu-west-1',
      'eu-central-1',
      'me-east-1',
      'ap-southwest-1',
    ]).has(value),
  Language: ({ value }) => validator.isISO6391(value),
  DateTime: ({ value }) =>
    validator.isDate(value) || validator.isTime(value) || !Number.isNaN(new Date(value).getTime()),
  JSONSchema: ({ value, schema }) => {
    if (!schema) {
      return false;
    }
    try {
      const jsonValue = JSON.parse(value);
      return JSON_SCHEMA(schema, jsonValue);
    } catch (e) {
      return JSON_SCHEMA(schema, value);
    }
  },
};

const cfguValueOptionsValidator = (cfgu: Cfgu, value: string) => {
  if (!cfgu.options) {
    return;
  }

  if (!cfgu.options.some((option) => option === value)) {
    throw new ConfigError(
      'invalid config value',
      `value "${value}" must be one of ${_.map(cfgu.options, (option) => `"${option}"`).join(',')}`,
    );
  }
};
const cfguValueTypeValidator = (cfgu: Cfgu, value: string) => {
  const { type } = cfgu;

  const validate = CFGU_VALUE_TYPE_VALIDATORS[type];
  if (!validate) {
    throw new ConfigError(
      'invalid type property',
      `type "${type}" is not yet supported in this SDK. For the time being, please utilize the "String" type. We'd greatly appreciate it if you could open an issue regarding this at https://github.com/configu/configu/issues/new/choose so we can address it in future updates.`,
    );
  }

  const isValid = validate({ ...cfgu, value });
  if (isValid) {
    return;
  }

  let hint = `value "${value}" must be of type "${type}"`;
  if (type === 'RegEx') {
    hint = `value "${value}" must match the pattern "${cfgu.pattern}"`;
  } else if (type === 'JSONSchema') {
    hint = `value "${value}" must match the schema "${cfgu.schema}"`;
  }

  throw new ConfigError('invalid config value', hint);
};
const cfguStructureValidator = (cfgu: Cfgu) => {
  try {
    Convert.cfguToJson(cfgu);
  } catch (error) {
    throw new ConfigError('invalid cfgu structure', error.message);
  }

  if (cfgu.type === 'RegEx' && !cfgu.pattern) {
    throw new ConfigError('invalid type property', `type "${cfgu.type}" must come with a pattern property`);
  }

  if (cfgu.type === 'JSONSchema' && !cfgu.schema) {
    throw new ConfigError('invalid type property', `type "${cfgu.type}" must come with a schema property`);
  }

  if (cfgu.options) {
    const reason = 'invalid options property';
    if (_.isEmpty(cfgu.options)) {
      throw new ConfigError(reason, `options mustn't be empty if set`);
    }
    if (cfgu.template) {
      throw new ConfigError(reason, `options mustn't set together with template properties`);
    }
    cfgu.options.forEach((option, idx) => {
      // https://github.com/configu/configu/pull/255#discussion_r1332296098
      if (option === '') {
        throw new ConfigError(reason, `options mustn't contain an empty string`);
      }
      try {
        cfguValueTypeValidator(cfgu, option);
      } catch (error) {
        throw error?.setReason?.(reason) ?? error;
      }
    });
  }

  if (cfgu.default) {
    const reason = 'invalid default property';
    if (cfgu.required || cfgu.template) {
      throw new ConfigError(reason, `default mustn't set together with required or template properties`);
    }
    if (cfgu.options && !cfgu.options.some((option) => option === cfgu.default)) {
      throw new ConfigError(
        reason,
        `value "${cfgu.default}" must be one of ${_.map(cfgu.options, (option) => `'${option}'`).join(',')}`,
      );
    }
    try {
      cfguValueTypeValidator(cfgu, cfgu.default);
    } catch (error) {
      throw error?.setReason?.(reason) ?? error;
    }
  }

  if (cfgu.depends) {
    if (_.isEmpty(cfgu.depends)) {
      throw new ConfigError('invalid depends property', `depends mustn't be empty if set`);
    }
    if (cfgu.depends.some((depend) => !NAME(depend))) {
      throw new ConfigError('invalid depends property', `depends mustn't contain reserved words`);
    }
  }

  if (cfgu.template) {
    try {
      TMPL.parse(cfgu.template);
    } catch (error) {
      throw new ConfigError('invalid template property', error.message);
    }
    // todo: this is a "weak" validation and NAME() util collides with CONFIGU_SET.[prop]
    // const isInvalidTemplate =
    //   cfgu.template && TMPL.parse(cfgu.template).some((exp) => exp.type === 'name' && !NAME(exp.key));
    // if (isInvalidTemplate) {
    //   throw new Error(
    //     ERR(`invalid template property`, {
    //       location: [...scopeLocation, key, 'template'],
    //       suggestion: `template is invalid or contain reserved words`,
    //     }),
    //   );
    // }
  }
};

export class ConfigSchema implements IConfigSchema {
  static CFGU = {
    NAME: CFGU_NAME,
    PROPS: CFGU_PROP,
    VALIDATORS: {
      TYPE: CFGU_VALUE_TYPE_VALIDATORS,
      valueType: cfguValueTypeValidator,
      valueOptions: cfguValueOptionsValidator,
      structure: cfguStructureValidator,
    },
  };

  constructor(
    public readonly name: string,
    public readonly contents: { [key: string]: Cfgu },
  ) {
    if (!this.name) {
      throw new ConfigError('invalid config schema', `name mustn't be empty`);
    }
    if (!NAME(this.name)) {
      throw new ConfigError('invalid config schema', `name "${this.name}" mustn't contain reserved words`);
    }

    if (!this.contents || _.isEmpty(this.contents)) {
      throw new ConfigError('invalid config schema', `contents mustn't be empty`);
    }

    _(this.contents)
      .entries()
      .forEach(([key, cfgu]) => {
        const errorScope: [string, string][] = [
          ['ConfigSchema', this.name],
          ['ConfigKey', key],
        ];

        if (!NAME(key)) {
          throw new ConfigError('invalid config key', `key "${key}" mustn't contain reserved words`, errorScope);
        }

        try {
          ConfigSchema.CFGU.VALIDATORS.structure(cfgu);
        } catch (error) {
          throw error?.appendScope?.(errorScope) ?? error;
        }
      });
  }
}
