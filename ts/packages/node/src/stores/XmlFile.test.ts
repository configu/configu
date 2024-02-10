import { promises as fs } from 'fs';
import path from 'path';
import { XmlFileConfigStore } from './XmlFile';

describe('XmlFileConfigStore', () => {
  const testXmlFilePath = path.join(__dirname, 'test.xml');

  beforeEach(async () => {
    await fs.writeFile(
      testXmlFilePath,
      `
<?xml version="1.0" encoding="UTF-8"?>
<root>
      <set></set>
      <key>rootkey</key>
      <value>rootvalue</value>
      <set>section</set>
      <key>key</key>
      <value>value</value>
</root>
      `,
    );
  });

  afterEach(async () => {
    await fs.unlink(testXmlFilePath);
  });

  test('should read configurations from XML file', async () => {
    const store = new XmlFileConfigStore({ path: testXmlFilePath });
    const configs = await store.get([
      { set: '', key: 'rootkey' },
      { set: 'section', key: 'key' },
    ]);
    expect(configs).toEqual([
      { set: '', key: 'rootkey', value: 'rootvalue' },
      { set: 'section', key: 'key', value: 'value' },
    ]);
  });

  test('should write configurations to XML file', async () => {
    const store = new XmlFileConfigStore({ path: testXmlFilePath });
    const configsToWrite = [
      { set: '', key: 'global_key', value: 'global_value' },
      { set: 'section', key: 'section_key', value: 'section_value' },
    ];
    await store.set(configsToWrite);

    // * Read the file again to verify the write operation
    const newConfigs = await store.get([
      { set: '', key: 'global_key' },
      { set: 'section', key: 'section_key' },
    ]);
    expect(newConfigs).toEqual(configsToWrite);
  });

  test('should query global configurations', async () => {
    const store = new XmlFileConfigStore({ path: testXmlFilePath });
    const queries = [{ set: '', key: 'rootkey' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: '', key: 'rootkey', value: 'rootvalue' }]);
  });

  test('should query configurations', async () => {
    const store = new XmlFileConfigStore({ path: testXmlFilePath });
    const queries = [{ set: 'section', key: 'key' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: 'section', key: 'key', value: 'value' }]);
  });
});
