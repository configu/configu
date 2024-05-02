import { ConfigSchema } from './ConfigSchema';
import { ConfigError } from './utils';

describe(`ConfigSchema`, () => {
  describe('cfguStructureValidator', () => {
    test('Empty SchemaContents', () => {
      expect(() => new ConfigSchema('empty', {})).toThrow(ConfigError);
    });
    describe('Tests for lazy configs', () => {
      test('parse ConfigSchema with `lazy=true` and `default=any`', () => {
        expect(
          () =>
            new ConfigSchema('lazy', {
              K1: {
                type: 'String',
                lazy: true,
                default: '1',
              },
            }),
        ).toThrow(ConfigError);
      });
      test('parse ConfigSchema with `lazy=true` and `template=any`', () => {
        expect(
          () =>
            new ConfigSchema('lazy', {
              T1: {
                type: 'String',
                default: 'Template',
              },
              K1: {
                type: 'String',
                lazy: true,
                template: '{{ T1 }}',
              },
            }),
        ).toThrow(ConfigError);
      });
    });
  });
});
