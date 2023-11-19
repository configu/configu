import path from 'path';
import { type Config } from '@configu/ts';
import { promises as fs } from 'fs';
import { TomlFileConfigStore } from './TomlFile';

const expectedConfigs: Config[] = [
  { set: '', key: 'RootSetKey', value: '1' },
  { set: 'SET1', key: 'SET1SetKey', value: '2' },
  { set: 'SET1.SET2', key: 'SET1SET2Key', value: '3' },
];

let store: TomlFileConfigStore;
let testTomlFilePath: string;

beforeAll(async () => {
  testTomlFilePath = path.join(__dirname, 'example.toml');
  await fs.writeFile(
    testTomlFilePath,
    `
  RootSetKey = 1
  [SET1]
    SET1SetKey = 2
  [SET1.SET2]
    SET1SET2Key = 3
  `,
  );
  store = new TomlFileConfigStore({ path: testTomlFilePath });
});

afterAll(() => {
  fs.unlink(testTomlFilePath);
});

test('should parse toml file', async () => {
  const configs = await store.get(expectedConfigs);
  expect(configs).toEqual(expectedConfigs);
});

test('should write new file', async () => {
  expectedConfigs.push({ set: 'SET3', key: 'SET3Key', value: '4' });
  await store.set(expectedConfigs);
  const readedConfigs = await store.get(expectedConfigs);
  expect(readedConfigs).toEqual(expectedConfigs);
});
