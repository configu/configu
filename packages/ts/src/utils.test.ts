import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigError, TMPL } from './utils';

describe(`utils`, () => {
  describe(`ConfigError`, () => {
    const message = 'some-error';
    const hint = 'try to to reach 100% coverage';
    const scope: [string, string][] = [['test', 'ConfigError']];
    test(`return message`, () => {
      const res = new ConfigError(message);
      assert.strictEqual(res.message, message);
    });
    test(`return message and location`, () => {
      const res = new ConfigError(message, undefined, scope);
      assert(res.message.includes(`${message} at`));
    });
    test(`return message and suggestion`, () => {
      const res = new ConfigError(message, hint);
      assert.strictEqual(res.message, `${message}, ${hint}`);
    });
    test(`return decorated message`, () => {
      const res = new ConfigError(message, hint, scope);
      assert(res.message.includes(`at`));
      assert(res.message.includes(`,`));
    });
  });

  describe(`TMPL`, () => {
    const template = '{{ test }} TMPL';
    describe(`parse`, () => {
      test(`throw from Mustache.parse`, () => {
        assert.throws(() => {
          TMPL.parse('{{ test }');
        });
      });
      test(`throw invalid template`, () => {
        assert.throws(() => {
          TMPL.parse('{{# test }}');
        });
      });
      test(`return parsed template`, () => {
        const res = TMPL.parse(template);
        assert.strictEqual(res.length, 2);
        assert(res.some((node) => node.type === 'name'));
        assert(res.some((node) => node.type === 'text'));
      });
    });

    describe(`render`, () => {
      test(`return rendered template`, () => {
        const res = TMPL.render(template, { test: 'render' });
        assert.strictEqual(res, 'render TMPL');
      });
      test(`return partially rendered - missing name node in context`, () => {
        const res = TMPL.render(template, { notTest: 'render' });
        assert.strictEqual(res, ' TMPL');
      });
    });
  });
});
