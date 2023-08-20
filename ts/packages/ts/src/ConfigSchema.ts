import _ from 'lodash';
import validator from 'validator';
import { IConfigSchema, ConfigSchemaType, Cfgu, CfguType, Convert } from './types';
import { ERR, NAME, TMPL } from './utils';

type CfguPath = `${string}.cfgu.${ConfigSchemaType}`;

export abstract class ConfigSchema implements IConfigSchema {
  static CFGU: {
    NAME: string;
    EXT: string;
    PROPS: (keyof Cfgu)[];
    TESTS: { VAL_TYPE: Record<CfguType, (parameters: Cfgu & { value: string }) => boolean> };
  } = {
    NAME: 'cfgu',
    EXT: `.cfgu`,
    PROPS: ['type', 'pattern', 'default', 'required', 'depends', 'template', 'description'],
    TESTS: {
      VAL_TYPE: {
        Boolean: ({ value }) => validator.isBoolean(value, { loose: true }),
        Number: ({ value }) => validator.isNumeric(value),
        String: () => true,
        RegEx: ({ value, pattern }) => {
          try {
            if (!pattern) {
              return false;
            }
            return RegExp(pattern).test(value);
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
          /^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/gm.test(
            value,
          ),
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
          /^((?:[a-z0-9]([-a-z0-9]*[a-z0-9])?\.)+[a-z]{2,6}(?::\d{1,5})?\/)?[a-z0-9]+(?:[._\-\/:][a-z0-9]+)*$/gm.test(
            value,
          ),
        MACAddress: ({ value }) => validator.isMACAddress(value),
        MIMEType: ({ value }) => validator.isMimeType(value),
        AwsRegion: ({ value }) =>
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
      },
    },
  };

  static TYPES = ['json'];
  static EXT = ConfigSchema.TYPES.map((type) => `${ConfigSchema.CFGU.EXT}.${type}`);

  public readonly type: ConfigSchemaType;

  constructor(public readonly path: string) {
    const scopeLocation = [`ConfigSchema`, `constructor`];
    const splittedPath = path.split('.');

    const fileExt = splittedPath.pop();
    if (!fileExt || !ConfigSchema.TYPES.includes(fileExt)) {
      throw new Error(
        ERR(`invalid path "${path}"`, {
          location: scopeLocation,
          suggestion: `path extension must be ${ConfigSchema.EXT.join('|')}`,
        }),
      );
    }
    this.type = fileExt as ConfigSchemaType;

    const cfguExt = splittedPath.pop();
    if (cfguExt !== ConfigSchema.CFGU.NAME) {
      throw new Error(
        ERR(`invalid path "${path}"`, {
          location: scopeLocation,
          suggestion: `path extension must be ${ConfigSchema.EXT.join('|')}`,
        }),
      );
    }
  }

  abstract read(): Promise<string>;

  static async parse(schema: ConfigSchema) {
    const scopeLocation = [`ConfigSchema`, 'parse', schema.path];
    const contents = await schema.read();

    const schemaContents = Convert.toConfigSchemaContents(contents);
    _(schemaContents)
      .entries()
      .forEach(([key, cfgu]) => {
        const { type } = cfgu;

        if (!NAME(key)) {
          throw new Error(
            ERR(`invalid key "${key}"`, {
              location: [...scopeLocation, key],
              suggestion: `path nodes mustn't contain reserved words "${key}"`,
            }),
          );
        }

        if (type === 'RegEx' && !cfgu.pattern) {
          throw new Error(
            ERR(`invalid type property`, {
              location: [...scopeLocation, key, 'type'],
              suggestion: `type "${type}" must come with a pattern property`,
            }),
          );
        }

        if (cfgu.default && (cfgu.required || cfgu.template)) {
          throw new Error(
            ERR(`invalid default property`, {
              location: [...scopeLocation, key, 'default'],
              suggestion: `default mustn't set together with required or template properties`,
            }),
          );
        }

        if (cfgu.default && !ConfigSchema.CFGU.TESTS.VAL_TYPE[type]?.({ ...cfgu, value: cfgu.default })) {
          throw new Error(
            ERR(`invalid default property`, {
              location: [...scopeLocation, key, 'default'],
              suggestion: `"${cfgu.default}" must be a "${type}"`,
            }),
          );
        }

        const isInvalidDepends =
          cfgu.depends && (_.isEmpty(cfgu.depends) || cfgu.depends.some((depend) => !NAME(depend)));
        if (isInvalidDepends) {
          throw new Error(
            ERR(`invalid depends property`, {
              location: [...scopeLocation, key, 'depends'],
              suggestion: `depends is empty or contain reserved words`,
            }),
          );
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
      });

    return schemaContents;
  }
}

export class InMemoryConfigSchema extends ConfigSchema {
  constructor(public contents: { [key: string]: Cfgu }, public name: string = '') {
    super(`${name}.cfgu.json`);
  }

  async read(): Promise<string> {
    return Convert.configSchemaContentsToJson(this.contents);
  }
}
