import { describe, test } from 'node:test';
import { equal } from 'node:assert/strict';
import { formatConfigs } from '.';

describe('Formatters', () => {
  const json = {
    KEY0: 'KEY0',
    KEY1: 'KEY1',
  };

  test('should export to dotenv format', () => {
    const formatted = formatConfigs({ json, format: 'Dotenv', label: 'test' });
    equal(formatted, `KEY0=KEY0\nKEY1=KEY1`);
  });

  test('should export to ini format', () => {
    const formatted = formatConfigs({ json, format: 'INI', label: 'test' });
    equal(formatted, `KEY0=KEY0\nKEY1=KEY1\n`);
  });

  test('should export to yaml format', () => {
    const formatted = formatConfigs({ json, format: 'YAML', label: 'test' });
    equal(formatted, 'KEY0: KEY0\nKEY1: KEY1\n');
  });

  test('should export to json format', () => {
    const formatted = formatConfigs({ json, format: 'JSON', label: 'test', pretty: true });
    equal(formatted, '{\n  "KEY0": "KEY0",\n  "KEY1": "KEY1"\n}');
  });
});
