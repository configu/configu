import _ from 'lodash';
import validator from 'validator';
import { ERR, TMPL } from './utils';
import { IConfigSchema, ConfigSchemaType, Cfgu, CfguType, Convert } from './types';

export type CfguPath = `${string}.cfgu.${ConfigSchemaType}`;

export class ConfigSchema implements IConfigSchema {
  static CFGU: { NAME: string; PROPS: (keyof Cfgu)[] } = {
    NAME: 'cfgu' as const,
    PROPS: ['type', 'pattern', 'default', 'required', 'depends', 'template', 'description'],
  };

  static EXT = `.${ConfigSchema.CFGU.NAME}` as const;
  static TYPES = _.values<string>(ConfigSchemaType);
  static EXAMPLE: { [key: string]: Cfgu } = {
    FOO: { type: CfguType.String, default: 'foo', description: 'string example variable' },
    BAR: { type: CfguType.RegEx, pattern: '^(foo|bar|baz)$', description: 'regex example variable' },
    BAZ: { type: CfguType.String, template: '{{FOO}} - {{BAR}}', description: 'template example variable' },
  };

  static VALIDATIONS: {
    NAMES: { PATTERN: RegExp; RESERVED: string[] };
    TYPES: Record<CfguType, (parameters: Cfgu & { value: string }) => boolean>;
  } = {
    NAMES: {
      PATTERN: /^[A-Za-z0-9_-]+$/,
      RESERVED: [
        'config',
        'store',
        'query',
        'q',
        'set',
        'schema',
        'cfgu',

        '_',
        '-',
        'this',
        'current',
        'cur',
        'root',
        'default',

        'admin',
        'general',
        'local',
      ],
    },
    TYPES: {
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
    },
  };

  static validateNaming = (name: string) => {
    return (
      RegExp(ConfigSchema.VALIDATIONS.NAMES.PATTERN).test(name) &&
      !ConfigSchema.VALIDATIONS.NAMES.RESERVED.includes(name)
    );
  };

  static validateValueType = (parameters: Cfgu & { value?: string }) => {
    if (!parameters.value) {
      return true;
    }
    return ConfigSchema.VALIDATIONS.TYPES[parameters.type]?.(parameters as Cfgu & { value: string });
  };

  public readonly type: ConfigSchemaType;
  public readonly uid: string;
  public contents: string;

  constructor(public readonly path: string) {
    const splittedPath = path.split('.');

    const fileExt = splittedPath.pop();
    if (!fileExt || !ConfigSchema.TYPES.includes(fileExt)) {
      throw new Error(
        ERR(`invalid file extension`, {
          location: [path],
          suggestion: `extension must be [${ConfigSchema.TYPES.join('|')}]`,
        }),
      );
    }
    this.type = fileExt as ConfigSchemaType;

    const cfguExt = splittedPath.pop();
    if (cfguExt !== ConfigSchema.CFGU.NAME) {
      throw new Error(
        ERR(`invalid file extension`, {
          location: [path],
          suggestion: `extension must be ${ConfigSchema.EXT}.[${ConfigSchema.TYPES.join('|')}]`,
        }),
      );
    }

    const schemaUid = splittedPath.pop()?.split('/')?.pop();
    if (!schemaUid || !ConfigSchema.validateNaming(schemaUid)) {
      throw new Error(
        ERR(`invalid file name`, {
          location: [path],
          suggestion: `name must be <path>/<uid>.${ConfigSchema.EXT}.[${ConfigSchema.TYPES.join('|')}]`,
        }),
      );
    }
    this.uid = schemaUid;
  }

  async read() {}

  static async parse(schema: ConfigSchema) {
    await schema.read();
    const { path, contents } = schema;

    const schemaContents = Convert.toConfigSchemaContents(contents);
    _(schemaContents)
      .entries()
      .forEach(([key, cfgu]) => {
        const { type } = cfgu;

        if (!ConfigSchema.validateNaming(key)) {
          throw new Error(ERR(`invalid schema key"`, { location: [key, path] }));
        }

        if (type === 'RegEx' && !cfgu.pattern) {
          throw new Error(
            ERR(`invalid type property`, {
              location: [key, path],
              suggestion: `type "${type}" must come with a pattern property`,
            }),
          );
        }

        if (cfgu.default && (cfgu.required || cfgu.template)) {
          throw new Error(
            ERR(`invalid default property`, {
              location: [key, path],
              suggestion: `default property must'nt set together with required or template properties`,
            }),
          );
        }
        // ! default don't support templates of other store like regular values
        if (!ConfigSchema.validateValueType({ ...cfgu, value: cfgu.default })) {
          throw new Error(
            ERR(`invalid default property`, {
              location: [key, path],
              suggestion: `"${cfgu.default}" must be a "${type}"`,
            }),
          );
        }

        const isInvalidDepends =
          cfgu.depends &&
          (_.isEmpty(cfgu.depends) || cfgu.depends.some((depend) => !ConfigSchema.validateNaming(depend)));
        if (isInvalidDepends) {
          throw new Error(ERR(`invalid depends property`, { location: [key, path] }));
        }

        const isInvalidTemplate =
          cfgu.template &&
          TMPL.parse(cfgu.template).some((exp) => exp.type === 'name' && !ConfigSchema.validateNaming(exp.key));
        if (isInvalidTemplate) {
          throw new Error(ERR(`invalid template property`, { location: [key, path] }));
        }
      });

    return schemaContents;
  }
}
