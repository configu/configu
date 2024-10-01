import { describe, test } from 'node:test';
import { equal } from 'node:assert/strict';
import { ConfigSchema, EvalCommand, InMemoryConfigStore, ConfigSet, ExportCommand } from '@configu/ts';
import { formatConfigs } from '.';

describe('Formatters', () => {
  const getEvalResult = async () =>
    new EvalCommand({
      store: new InMemoryConfigStore(),
      set: new ConfigSet('test'),
      schema: new ConfigSchema('mutate', {
        KEY0: {
          type: 'String',
        },
        KEY1: {
          type: 'String',
        },
      }),
      configs: {
        KEY0: 'KEY0',
        KEY1: 'KEY1',
      },
    }).run();

  const getExport = async () => {
    const evalResult = await getEvalResult();
    return new ExportCommand({ pipe: evalResult }).run();
  };

  test('should export to dotenv format', async () => {
    const exportResult = await getExport();
    const formatted = formatConfigs({ json: exportResult, format: 'Dotenv', label: 'test' });
    equal(formatted, `KEY0=KEY0\nKEY1=KEY1`);
  });

  test('should export to ini format', async () => {
    const exportResult = await getExport();
    const formatted = formatConfigs({ json: exportResult, format: 'INI', label: 'test' });
    equal(formatted, `KEY0=KEY0\nKEY1=KEY1\n`);
  });

  test('should export to yaml format', async () => {
    const exportResult = await getExport();
    const formatted = formatConfigs({ json: exportResult, format: 'YAML', label: 'test' });
    equal(formatted, 'KEY0: KEY0\nKEY1: KEY1\n');
  });

  test('should export to json format', async () => {
    const exportResult = await getExport();
    const formatted = formatConfigs({ json: exportResult, format: 'JSON', label: 'test' });
    equal(formatted, '{\n  "KEY0": "KEY0",\n  "KEY1": "KEY1"\n}');
  });
});
