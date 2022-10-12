import _ from 'lodash';
import Ajv, { SchemaObject } from 'ajv/dist/jtd';
import Mustache from 'mustache';

export const ERR = (message: string, location: string[] = [], suggestion = '') => {
  return `${message}${_(location)
    .map((loc) => ` at ${loc}`)
    .join('')}${suggestion ? `, ${suggestion}` : ''}`;
};

// * Use single Avj instance https://ajv.js.org/guide/managing-schemas.html#compiling-during-initialization
const ajv = new Ajv({ allErrors: true });
// * properties used in the 'metadata' schema member need to be defined as keywords https://ajv.js.org/json-type-definition.html#metadata-schema-member
ajv.addKeyword('description');

export const JTD = <T>(schema: SchemaObject) => {
  const parse = ajv.compileParser<T>(schema);
  const serialize = ajv.compileSerializer<T>(schema);
  const validate = ajv.compile<T>(schema);

  return {
    parse: (json: string) => {
      const data = parse(json);
      if (data === undefined) {
        throw new Error(`${parse.message} at :${parse.position}`);
      }
      return data;
    },
    serialize,
    validate: (object: Record<string, unknown>) => {
      const isValid = validate(object);
      if (validate.errors) {
        const { message, instancePath } = validate.errors[0];
        throw new Error(`${message}${instancePath && ` at :${instancePath}`}`);
      }
      return isValid;
    },
  };
};

export const TMPL = {
  parse: (template: string) => {
    return Mustache.parse(template).map(([type, key, start, end]) => {
      if (!['name', 'text'].includes(type)) {
        throw new Error('invalid template');
      }
      return {
        type: type as 'name' | 'text',
        key,
        start,
        end,
      };
    });
  },
  render: (template: string, context: any) => Mustache.render(template, context),
};
