import _ from 'lodash';
import { JTD, TMPL, CS } from './utils';
import { Set } from './Set';
import { IStore, StoreQuery, StoreContents, StoreContentsJTDSchema } from './types';

const { parse, serialize } = JTD<StoreContents>(StoreContentsJTDSchema);

export abstract class Store implements IStore {
  constructor(public readonly type: string) {}

  abstract get(query: StoreQuery[]): Promise<StoreContents>;
  abstract set(configs: StoreContents): Promise<void>;

  async init() {}

  static parse(rawConfigs: string) {
    return parse(rawConfigs);
  }

  static serialize(configs: StoreContents) {
    return serialize(configs);
  }

  static extractReferenceValue(value?: string) {
    if (!value) {
      return null;
    }

    try {
      const expressions = TMPL.parse(value);
      const isReference =
        expressions.length === 1 && expressions[0].type === 'name' && expressions[0].end === value.length;
      if (!isReference) {
        return null;
      }
      return expressions[0].key;
    } catch {
      return null;
    }
  }

  static parseReferenceValue(qs: string) {
    // * ReferenceValue structure: store=<store.type>&query=[set/]<schema>[.key]
    // ! ReferenceValue uses only the Set specified in its query, it doesn't support Set hierarchy.
    try {
      const { store, ...rest } = CS.parse(qs);
      const query = rest.query ?? rest.q;

      const isValidReference = typeof store === 'string' && typeof query === 'string';
      if (!isValidReference) {
        return null;
      }
      const [setAndSchema, ...keyPath] = query.split('.');
      if (!setAndSchema) {
        return null;
      }
      const splittedSetAndSchema = setAndSchema.split('/');
      const schema = splittedSetAndSchema.pop();
      if (!schema) {
        return null;
      }
      const set = new Set(splittedSetAndSchema.join('/')).path;

      return {
        store,
        query: {
          key: keyPath.join('.'),
          schema,
          set,
        },
      };
    } catch {
      return null;
    }
  }

  // static parseReferenceValue(uri: string) {
  //   // * ReferenceValue structure: <scheme>://[userinfo@][set/]<schema>[.key][?key=[key]]
  //   // ! ReferenceValue uses only the Set specified in its URI, it doesn't support Set hierarchy.

  //   const { scheme, userinfo, host, path, query } = URI.parse(uri);
  //   if (!scheme || !host) {
  //     return null;
  //   }
  //   const [setAndSchema, ...keyPath] = `${host}${path}`.split('.');
  //   if (!setAndSchema) {
  //     return null;
  //   }
  //   const splittedSetAndSchema = setAndSchema.split('/');
  //   const schema = splittedSetAndSchema.pop();
  //   if (!schema) {
  //     return null;
  //   }
  //   let set = '';
  //   try {
  //     set = new Set(splittedSetAndSchema.join('/')).path;
  //   } catch (error) {
  //     return null;
  //   }

  //   const queryDict = _(query)
  //     .split('&')
  //     .map((q) => q.split('='))
  //     .fromPairs()
  //     .value();

  //   return {
  //     schema,
  //     userinfo,
  //     uid: URI.serialize({ scheme, userinfo }),
  //     query: [
  //       {
  //         key: keyPath.join('.'),
  //         schema,
  //         set,
  //         ...queryDict,
  //       },
  //     ],
  //   };
  // }
}
