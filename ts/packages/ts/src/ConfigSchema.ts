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
          /^(?:(([a-z0-9]|[a-z0-9][a-z0-9\\-]*[a-z0-9])\.)+([a-z0-9]|[a-z0-9][a-z0-9\\-]*[a-z0-9])(:[0-9]+\/)?(?:[0-9a-z-]+[/@])(?:([0-9a-z-]+))[/@]?(?:([0-9a-z-]+))?(?::[a-z0-9\\.-]+)?|([^:\/?#\s]+):\/\/(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*)$/gm.test(
            value,
          ),
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
