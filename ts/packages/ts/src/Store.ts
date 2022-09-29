import { JTD, TMPL } from './utils';
import { IStore, StoreConfiguration, StoreQuery, StoreContents, StoreContentsJTDSchema } from './types';

const { parse, serialize } = JTD<StoreContents>(StoreContentsJTDSchema);

export abstract class Store implements IStore {
  constructor(public protocol: string, public configuration: StoreConfiguration) {}
  abstract get(query: StoreQuery): Promise<StoreContents>;
  abstract set(configs: StoreContents): Promise<void>;

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
    const expressions = TMPL.parse(value);
    const isReference =
      expressions.length === 1 && expressions[0].type === 'name' && expressions[0].end === value.length;
    if (!isReference) {
      return null;
    }

    return expressions[0].key;
  }

  static parseReferenceValue(value: string) {
    const [protocol, path] = value.split('://');
    const splittedPath = path.split('/');
    const isReferenceProperlyConstructed = protocol && splittedPath.length >= 2;
    if (!isReferenceProperlyConstructed) {
      return null;
    }

    return {
      store: protocol,
      key: splittedPath.pop(),
      schema: splittedPath.pop(),
      set: splittedPath.join('/'),
    };
  }
}

export type StoreCtor = { new (protocol: string): Store };
export type StoreDerived = StoreCtor & typeof Store;
