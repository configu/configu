import { ERR, TMPL } from './utils';

describe(`utils`, () => {
  describe(`ERR`, () => {
    const message = 'some-error';
    const location = ['tests', 'utils', 'ERR'];
    const suggestion = 'try to to reach 100% coverage';
    it(`return message`, async () => {
      const res = ERR(message);
      expect(res).toEqual(message);
    });
    it(`return message and location`, async () => {
      const res = ERR(message, { location });
      expect(res).toBe(`${message} at ${location.join('.')}`);
    });
    it(`return message and suggestion`, async () => {
      const res = ERR(message, { suggestion });
      expect(res).toBe(`${message}, ${suggestion}`);
    });
    it(`return decorated message`, async () => {
      const res = ERR(message, { location, suggestion });
      expect(res).toBe(`${message} at ${location.join('.')}, ${suggestion}`);
    });
  });

  describe(`TMPL`, () => {
    const template = '{{ test }} TMPL';
    describe(`parse`, () => {
      it(`throw from Mustache.parse`, async () => {
        const res = () => {
          TMPL.parse('{{ test }');
        };
        expect(res).toThrow();
      });
      it(`throw invalid template`, async () => {
        const res = () => {
          TMPL.parse('{{# test }}');
        };
        expect(res).toThrow();
      });
      it(`return parsed template`, async () => {
        const res = TMPL.parse(template);
        expect(res).toHaveLength(2);
        expect(res).toContainEqual(
          expect.objectContaining({
            type: 'name',
          }),
        );
        expect(res).toContainEqual(
          expect.objectContaining({
            type: 'text',
          }),
        );
      });
    });
    describe(`render`, () => {
      it(`return rendered template`, async () => {
        const res = TMPL.render(template, { test: 'render' });
        expect(res).toBe('render TMPL');
      });
      it(`return partially rendered - missing name node in context`, async () => {
        const res = TMPL.render(template, { notTest: 'render' });
        expect(res).toBe(' TMPL');
      });
    });
  });
});
