import _ from 'lodash';
import validator from 'validator';
import { ERR, JTD, TMPL } from './utils';
import { ICfgu, CfguType, CfguContents, ConfigSchemaType, ConfigSchema, CfguContentsJTDSchema } from './types';

const { parse } = JTD<CfguContents>(CfguContentsJTDSchema);

export type CfguPath = `${string}.cfgu.${CfguType}`;

export class Cfgu implements ICfgu {
  public readonly type: CfguType;
  public readonly name: string;
  public contents: string;
  constructor(public readonly path: string) {
    const splittedPath = path.split('.');

    const fileExt = splittedPath.pop();
    if (!fileExt || !Cfgu.TYPES.includes(fileExt)) {
      throw new Error(ERR(`invalid file extension`, [path], `extension must be [${Cfgu.TYPES.join('|')}]`));
    }
    this.type = fileExt as CfguType;

    const cfguExt = splittedPath.pop();
    if (cfguExt !== Cfgu.NAME) {
      throw new Error(ERR(`invalid file extension`, [path], `extension must be ${Cfgu.EXT}.[${Cfgu.TYPES.join('|')}]`));
    }

    const cfguName = splittedPath.pop()?.split('/')?.pop();
    if (!cfguName || !Cfgu.validateNaming(cfguName)) {
      throw new Error(
        ERR(`invalid file name`, [path], `name must be <path>/<name>.${Cfgu.EXT}.[${Cfgu.TYPES.join('|')}]`),
      );
    }
    this.name = cfguName;
  }

  static NAME = 'cfgu' as const;
  static EXT = `.${Cfgu.NAME}` as const;
  static TYPES = _.values<string>(CfguType);
  static PROPS = ['type', 'note', 'deprecated', 'default', 'pattern', 'template', 'required', 'depends'] as const;
  static EXAMPLE: CfguContents = {
    FOO: { type: ConfigSchemaType.String, default: 'foo', description: 'example variable' },
    BAR: { type: ConfigSchemaType.RegEx, pattern: 'bar|baz' },
    BAZ: { type: ConfigSchemaType.String, template: '{{FOO}}&{{BAR}}', description: 'template example variable' },
  };

  static NAMING_RULES = {
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
  };

  static validateNaming = (name: string) => {
    return RegExp(Cfgu.NAMING_RULES.PATTERN).test(name) && !Cfgu.NAMING_RULES.RESERVED.includes(name);
  };

  static TYPE_VALIDATORS: Record<
    ConfigSchemaType,
    (parameters: Omit<ConfigSchema, 'type'> & { value: string }) => boolean
  > = {
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
  };

  static validateValueType = (parameters: ConfigSchema & { value?: string }) => {
    if (!parameters.value) {
      return true;
    }
    return Cfgu.TYPE_VALIDATORS[parameters.type]?.(parameters as ConfigSchema & { value: string });
  };

  async read() {}

  static async parse(cfgu: Cfgu) {
    await cfgu.read();
    const { path, contents } = cfgu;
    const cfguContents = parse(contents);

    _(cfguContents)
      .entries()
      .forEach(([key, schema]) => {
        const { type } = schema;

        if (!Cfgu.validateNaming(key)) {
          throw new Error(ERR(`invalid schema key"`, [key, path]));
        }

        if (type === 'RegEx' && !schema.pattern) {
          throw new Error(
            ERR(`invalid type property`, [key, path], `type "${type}" must come with a pattern property`),
          );
        }

        if (schema.default && (schema.required || schema.template)) {
          throw new Error(
            ERR(
              `invalid default property`,
              [key, path],
              `default property must'nt set together with required or template properties`,
            ),
          );
        }

        // ! default don't support templates of other store like regular values
        if (!Cfgu.validateValueType({ ...schema, value: schema.default })) {
          throw new Error(ERR(`invalid default property`, [key, path], `"${schema.default}" must be a "${type}"`));
        }

        if (
          schema.depends &&
          (_.isEmpty(schema.depends) || schema.depends.some((depend) => !Cfgu.validateNaming(depend)))
        ) {
          throw new Error(ERR(`invalid depends property`, [key, path]));
        }

        if (
          schema.template &&
          TMPL.parse(schema.template).some((exp) => exp.type === 'name' && !Cfgu.validateNaming(exp.key))
        ) {
          throw new Error(ERR(`invalid template property`, [key, path]));
        }
      });

    return cfguContents;
  }
}
