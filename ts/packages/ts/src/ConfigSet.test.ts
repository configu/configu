import { ConfigSet } from './ConfigSet';

describe(`ConfigSet`, () => {
  describe(`constructor`, () => {
    it(`treats ROOT_LABEL as ROOT`, async () => {
      const set = new ConfigSet(ConfigSet.ROOT_LABEL);
      expect(set.path).toBe(ConfigSet.ROOT);
      expect(set.hierarchy).toEqual([ConfigSet.ROOT]);
    });
  });
});
