import { Convert } from './generated';

describe(`types`, () => {
  describe(`ConfigSchemaContents`, () => {
    const errored = { test: { type: 'Test' } };
    it(`throw from Convert.toConfigSchemaContents`, async () => {
      const res = () => {
        Convert.toConfigSchemaContents(JSON.stringify(errored));
      };
      expect(res).toThrow();
    });
    it(`throw from Convert.configSchemaContentsToJson`, async () => {
      const res = () => {
        Convert.configSchemaContentsToJson(errored as any);
      };
      expect(res).toThrow();
    });
  });

  describe(`ConfigStoreContents`, () => {
    const errored = [{ key: 'TEST', schema: 'test', set: 'test' }];
    it(`throw from Convert.ConfigStoreContents`, async () => {
      const res = () => {
        Convert.toConfigStoreContents(JSON.stringify(errored));
      };
      expect(res).toThrow();
    });
    it(`throw from Convert.configStoreContentsToJson`, async () => {
      const res = () => {
        Convert.configStoreContentsToJson(errored as any);
      };
      expect(res).toThrow();
    });
  });

  describe(`ConfigStoreQuery`, () => {
    const errored = { key: 'TEST', schema: 'test' };
    it(`throw from Convert.toConfigStoreQuery`, async () => {
      const res = () => {
        Convert.toConfigStoreQuery(JSON.stringify(errored));
      };
      expect(res).toThrow();
    });
    it(`throw from Convert.configStoreQueryToJson`, async () => {
      const res = () => {
        Convert.configStoreQueryToJson(errored as any);
      };
      expect(res).toThrow();
    });
  });

  describe(`Config`, () => {
    const errored = { key: 'TEST', schema: 'test', set: 'test' };
    it(`throw from Convert.toConfig`, async () => {
      const res = () => {
        Convert.toConfig(JSON.stringify(errored));
      };
      expect(res).toThrow();
    });
    it(`throw from Convert.configToJson`, async () => {
      const res = () => {
        Convert.configToJson(errored as any);
      };
      expect(res).toThrow();
    });
  });
});
