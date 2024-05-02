import { ConfigError, TMPL } from './utils';

describe(`utils`, () => {
  describe(`ConfigError`, () => {
    const message = 'some-error';
    const hint = 'try to to reach 100% coverage';
    const scope: [string, string][] = [['test', 'ConfigError']];
    it(`return message`, async () => {
      const res = new ConfigError(message);
      expect(res.message).toEqual(message);
    });
    it(`return message and location`, async () => {
      const res = new ConfigError(message, undefined, scope);
      expect(res.message).toContain(`${message} at`);
    });
    it(`return message and suggestion`, async () => {
      const res = new ConfigError(message, hint);
      expect(res.message).toBe(`${message}, ${hint}`);
    });
    it(`return decorated message`, async () => {
      const res = new ConfigError(message, hint, scope);
      expect(res.message).toContain(`at`);
      expect(res.message).toContain(`,`);
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
