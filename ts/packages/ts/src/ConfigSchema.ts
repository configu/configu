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
          /^(?:(?=[^:\/]{1,253})(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*(?::[0-9]{1,5})?\/)?((?![._-])(?:[a-z0-9._-]*)(?<![._-])(?:\/(?![._-])[a-z0-9._-]*(?<![._-]))*)(?::(?![.-])[a-zA-Z0-9_.-]{1,128})?$/gm.test(
            value
          ),
        AwsRegion: ({ value }) => 
          value === "af-south-1" ||
          value === "ap-east-1" ||
          value === "ap-northeast-1" ||
          value === "ap-northeast-2" ||
          value === "ap-northeast-3" ||
          value === "ap-south-1" ||
          value === "ap-southeast-1" ||
          value === "ap-southeast-2" ||
          value === "ca-central-1" ||
          value === "cn-north-1" ||
          value === "cn-northwest-1" ||
          value === "eu-central-1" ||
          value === "eu-north-1" ||
          value === "eu-south-1" ||
          value === "eu-west-1" ||
          value === "eu-west-2" ||
          value === "eu-west-3" ||
          value === "me-south-1" ||
          value === "sa-east-1" ||
          value === "us-east-1" ||
          value === "us-east-2" ||
          value === "us-gov-east-1" ||
          value === "us-gov-west-1" ||
          value === "us-west-1" ||
          value === "us-west-2",
        AZRegion: ({ value }) => 
          value === "eastus" ||
          value === "eastus2" ||
          value === "centralus" ||
          value === "northcentralus" ||
          value === "southcentralus" ||
          value === "westcentralus" ||
          value === "westus" ||
          value === "westus2" ||
          value === "canadacentral" ||
          value === "canadaeast" ||
          value === "brazilsouth" ||
          value === "brazilsoutheast" ||
          value === "northeurope" ||
          value === "westeurope" ||
          value === "uksouth" ||
          value === "ukwest" ||
          value === "francecentral" ||
          value === "francesouth" ||
          value === "switzerlandnorth" ||
          value === "switzerlandwest" ||
          value === "germanywestcentral" ||
          value === "norwayeast" ||
          value === "norwaywest" ||
          value === "eastasia" ||
          value === "southeastasia" ||
          value === "australiaeast" ||
          value === "australiasoutheast" ||
          value === "australiacentral" ||
          value === "australiacentral2" ||
          value === "japaneast" ||
          value === "japanwest" ||
          value === "koreacentral" ||
          value === "koreasouth" ||
          value === "southafricanorth" ||
          value === "southafricawest" ||
          value === "uaenorth" ||
          value === "uaecentral" ||
          value === "usgovarizona" ||
          value === "usgovtexas" ||
          value === "usdodeast" ||
          value === "usdodcentral" ||
          value === "usgovvirginia" ||
          value === "usgoviowa" ||
          value === "usgovcalifornia" ||
          value === "ussecwest" ||
          value === "usseceast",
        GCPRegion: ({ value }) => 
          value === "us-east1" ||
          value === "us-east4" ||
          value === "us-west1" ||
          value === "us-west2" ||
          value === "us-west3" ||
          value === "us-central1" ||
          value === "northamerica-northeast1" ||
          value === "southamerica-east1" ||
          value === "europe-north1" ||
          value === "europe-west1" ||
          value === "europe-west2" ||
          value === "europe-west3" ||
          value === "europe-west4" ||
          value === "europe-west6" ||
          value === "asia-east1" ||
          value === "asia-east2" ||
          value === "asia-northeast1" ||
          value === "asia-northeast2" ||
          value === "asia-northeast3" ||
          value === "asia-south1" ||
          value === "asia-southeast1" ||
          value === "australia-southeast1" ||
          value === "australia-southeast2" ||
          value === "southasia-east1" ||
          value === "northamerica-northeast2" ||
          value === "europe-central2" ||
          value === "asia-southeast2" ||
          value === "asia-east3" ||
          value === "europe-west7" ||
          value === "us-west4" ||
          value === "europe-west8" ||
          value === "asia-northeast4" ||
          value === "asia-southeast3" ||
          value === "us-west5" ||
          value === "us-central2" ||
          value === "us-east5" ||
          value === "us-north1" ||
          value === "northamerica-northeast3" ||
          value === "us-west6",
        OracleRegion: ({ value }) => 
          value === "us-ashburn-1" ||
          value === "us-phoenix-1" ||
          value === "ca-toronto-1" ||
          value === "sa-saopaulo-1" ||
          value === "uk-london-1" ||
          value === "uk-gov-london-1" ||
          value === "eu-frankfurt-1" ||
          value === "eu-zurich-1" ||
          value === "eu-amsterdam-1" ||
          value === "me-jeddah-1" ||
          value === "ap-mumbai-1" ||
          value === "ap-osaka-1" ||
          value === "ap-seoul-1" ||
          value === "ap-sydney-1" ||
          value === "ap-tokyo-1" ||
          value === "ap-chuncheon-1" ||
          value === "ap-melbourne-1" ||
          value === "ap-hyderabad-1" ||
          value === "ca-montreal-1" ||
          value === "us-sanjose-1" ||
          value === "us-luke-1" ||
          value === "me-dubai-1" ||
          value === "us-gov-ashburn-1" ||
          value === "us-gov-chicago-1" ||
          value === "us-gov-phoenix-1" ||
          value === "us-gov-orlando-1" ||
          value === "us-gov-sanjose-1" ||
          value === "us-gov-ashburn-2",
        IBMRegion: ({ value }) => 
          value === "us-south" ||
          value === "us-east" ||
          value === "us-north" ||
          value === "us-west" ||
          value === "eu-gb" ||
          value === "eu-de" ||
          value === "eu-nl" ||
          value === "eu-fr" ||
          value === "eu-it" ||
          value === "ap-north" ||
          value === "ap-south" ||
          value === "ap-east" ||
          value === "ap-jp" ||
          value === "ap-au" ||
          value === "ca-toronto" ||
          value === "ca-central" ||
          value === "sa-saopaulo" ||
          value === "sa-mexico" ||
          value === "sa-buenosaires" ||
          value === "sa-lima" ||
          value === "sa-santiago" ||
          value === "af-za" ||
          value === "af-eg" ||
          value === "af-dz" ||
          value === "af-ma",
        AlibabaRegion: ({ value }) => 
          value === "cn-hangzhou" ||
          value === "cn-shanghai" ||
          value === "cn-beijing" ||
          value === "cn-shenzhen" ||
          value === "cn-zhangjiakou" ||
          value === "cn-huhehaote" ||
          value === "cn-wulanchabu" ||
          value === "ap-southeast-1" ||
          value === "ap-southeast-2" ||
          value === "ap-southeast-3" ||
          value === "ap-southeast-5" ||
          value === "ap-northeast-1" ||
          value === "ap-south-1" ||
          value === "ap-south-2" ||
          value === "us-west-1" ||
          value === "us-east-1" ||
          value === "eu-west-1" ||
          value === "eu-central-1" ||
          value === "me-east-1" ||
          value === "ap-southwest-1",
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
