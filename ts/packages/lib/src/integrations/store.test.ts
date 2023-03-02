import { getStoreConnectionStringPlaceholder } from '..';

describe(`lib stores`, () => {
  describe(`getStoreConnectionStringPlaceholder`, () => {
    it(`return configu store cs placeholder`, () => {
      const placeholder = getStoreConnectionStringPlaceholder('configu');
      expect(placeholder.startsWith('store=configu')).toBe(true);
    });
  });
});
