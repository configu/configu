import { ERR } from './utils';

describe(`utils`, () => {
  describe(`ERR`, () => {
    const message = 'some-error';
    it(`return message`, async () => {
      const res = ERR(message);
      expect(res).toEqual(message);
    });
  });
});
