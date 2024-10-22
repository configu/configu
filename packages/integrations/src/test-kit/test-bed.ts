import test, { Mock } from 'node:test';
import { Config, ConfigSchemaKeys, ConfigStore } from '@configu/sdk';
import { MockStore } from './mock-store';

export interface TestModule {
  stores?: ConfigStore[];
  schema?: ConfigSchemaKeys;
  set?: string;
  expressions?: Array<{ key: string; value: any; mock?: Mock<(s: string) => any> }>;

  test: (expression: string) => Record<string, Config> | Promise<Record<string, Config>>;
  eval: (expression: string) => string | Promise<string>;
  upsert: (configs: Record<string, string>) => Promise<void>;
}

export interface Expression {
  key: string;
  value: unknown;
  mock?: Mock<(s: string) => unknown>;
}

export class TestBed {
  static async createTestModule({
    stores,
    expressions,
    set,
    schema,
  }: {
    stores?: ConfigStore[];
    schema?: ConfigSchemaKeys;
    set?: string;
    expressions?: Expression[];
  }): Promise<TestModule> {
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

  static createMockExpressions(keys: string[], defaultReturnValue?: string): Expression[] {
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
