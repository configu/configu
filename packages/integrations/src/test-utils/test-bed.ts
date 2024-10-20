import test, { Mock } from 'node:test';
import { Config, ConfigSchemaKeys, ConfigStore } from '@configu/sdk';
import { MockStore } from './mock-store';

export interface TestBed {
  stores?: ConfigStore[];
  schema?: ConfigSchemaKeys;
  set?: string;
  expressions?: Array<{ key: string; value: any; mock?: Mock<(s: string) => any> }>;

  test: (expression: string) => Record<string, Config> | Promise<Record<string, Config>>;
  eval: (expression: string) => string | Promise<string>;
  upsert: (configs: Record<string, string>) => Promise<void>;
}

export interface IExpression {
  key: string;
  value: any;
  mock?: Mock<(s: string) => any>;
}

export class Test {
  static async createTestingBed({
    stores,
    expressions,
    set,
    schema,
  }: {
    stores?: ConfigStore[];
    schema?: ConfigSchemaKeys;
    set?: string;
    expressions?: IExpression[];
  }): Promise<TestBed> {
    return {
      stores,
      expressions,
      schema,
      set,
      test: (expression: string) => {
        throw new Error('Not implemented');
        return {};
      },
      eval(expression: string): string | Promise<string> {
        throw new Error('Not implemented');
        return '';
      },
      upsert: async (configs: Record<string, string>) => {
        throw new Error('Not implemented');
      },
    };
  }

  static createMockStore(): typeof ConfigStore {
    return new MockStore();
  }

  static createMockSchema(keys: string[]): ConfigSchemaKeys {
    return keys.reduce((acc, key) => {
      acc[key] = {};
      return acc;
    }, {} as ConfigSchemaKeys);
  }

  static createMockExpressions(keys: string[], defaultReturnValue?: string): IExpression[] {
    return keys.map((key) => {
      const mock = test.mock.fn((str) => defaultReturnValue || `${key}:${str}`);
      return {
        key,
        mock,
        value: mock,
      };
    });
  }
}
