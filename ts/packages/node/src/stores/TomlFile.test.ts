import path from 'path';
import { Config } from '@configu/ts';
import { promises as fs } from 'fs';
import { TomlFileConfigStore } from './TomlFile';

const expectedConfigs: Config[] = [
  { set: '', key: 'RootSetKey', value: '1' },
  { set: 'SET1', key: 'SET1SetKey', value: '2' },
  { set: 'SET1.SET2', key: 'SET1SET2Key', value: '3' },
];

let store: TomlFileConfigStore;
let testTomlFilePath: string;

beforeAll(() => {
  testTomlFilePath = path.join(__dirname, 'example.toml');
  store = new TomlFileConfigStore({ path: testTomlFilePath });
  store.write(expectedConfigs);
});

afterAll(() => {
  fs.unlink(testTomlFilePath);
});

test('should parse toml file', async () => {
  const configs = await store.read();
  expect(configs).toEqual(expectedConfigs);
});

test('should write new file', async () => {
  expectedConfigs.push({ set: 'SET3', key: 'SET3Key', value: '4' });

  await store.set(expectedConfigs);
  const readedConfigs = await store.read();
  expect(readedConfigs).toEqual(expectedConfigs);
});
