import { Store } from './Store';

describe(`Store`, () => {
  describe(`extractReferenceValue`, () => {
    it(`empty value - returns null`, async () => {
      const res = Store.extractReferenceValue();
      expect(res).toBeNull();
    });
    it(`non reference indicator - returns null`, async () => {
      const res = Store.extractReferenceValue('abc');
      expect(res).toBeNull();
    });
    it(`not only reference indicator - returns null`, async () => {
      const res = Store.extractReferenceValue('{{ abc }} abc');
      expect(res).toBeNull();
    });
    it(`not complete reference indicator - returns null`, async () => {
      const res = Store.extractReferenceValue('{{ abc');
      expect(res).toBeNull();
    });
    it(`valid reference value - returns value`, async () => {
      const res = Store.extractReferenceValue('{{ abc }}');
      expect(res).toBe('abc');
    });
  });

  describe(`parseReferenceValue`, () => {
    it(`valid reference value - returns store and query`, async () => {
      const res = Store.parseReferenceValue('store=configu;query=prod/srv.NODE_ENV');
      expect(res).toEqual({ store: 'configu', query: { set: 'prod', schema: 'srv', key: 'NODE_ENV' } });
    });
  });
});
