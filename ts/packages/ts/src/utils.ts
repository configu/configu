import _, { Dictionary } from 'lodash';
import Mustache from 'mustache';

export const ERR = (
  message: string,
  { location = [], suggestion = '' }: { location?: string[]; suggestion?: string } = {},
) => {
  return `${message}${!_.isEmpty(location) ? ` at ${location.join(' > ')}` : ''}${
    suggestion ? `, try ${suggestion}` : ''
  }`;
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
  render: (template: string, context: any) => Mustache.render(template, context, {}, { escape: (value) => value }),
};

export const CS = {
  parse: (cs: string): Dictionary<string | undefined> => {
    return _(_.trim(cs, '; '))
      .split(';')
      .map((q) => _.split(q, '='))
      .fromPairs()
      .value();
  },
  serialize: (dict: Dictionary<string | undefined>): string => {
    return _(dict)
      .toPairs()
      .map(([key, value]) => `${key}${_.isNil(value) ? '' : `=${value}`}`)
      .join(';');
  },
};
