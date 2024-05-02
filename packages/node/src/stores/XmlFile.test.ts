import { promises as fs } from 'fs';
import path from 'path';
import { XmlFileConfigStore } from './XmlFile';

describe('XmlFileConfigStore', () => {
  const testXmlFilePath = path.join(__dirname, 'test.xml');

  beforeEach(async () => {
    await fs.writeFile(
      testXmlFilePath,
      `
<?xml version="1.1" encoding="UTF-8"?>
<root>
  <config>
    <set>dev</set>
    <key>GREETING</key>
    <value>hey</value>
  </config>
  <config>
    <set>prod</set>
    <key>SUBJECT</key>
    <value>world</value>
  </config>
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
      { set: 'dev', key: 'GREETING' },
      { set: 'prod', key: 'SUBJECT' },
    ]);

    expect(configs).toEqual([
      { set: 'dev', key: 'GREETING', value: 'hey' },
      { set: 'prod', key: 'SUBJECT', value: 'world' },
    ]);
  });

  const writeConfigs = async (store: XmlFileConfigStore) => {
    const configsToWrite = [
      { set: 'dev', key: 'GREETING', value: 'hey' },
      { set: 'prod', key: 'SUBJECT', value: 'world' },
    ];
    await store.set(configsToWrite);

    // * Read the file again to verify the write operation
    const newConfigs = await store.get([
      { set: 'dev', key: 'GREETING' },
      { set: 'prod', key: 'SUBJECT' },
    ]);
    expect(newConfigs).toEqual(configsToWrite);
  };

  test('should write configurations to new XML file', async () => {
    await fs.unlink(testXmlFilePath);
    const store = new XmlFileConfigStore({ path: testXmlFilePath });
    await store.init();
    await writeConfigs(store);
  });

  test('should write configurations to an existing XML file', async () => {
    const store = new XmlFileConfigStore({ path: testXmlFilePath });
    await writeConfigs(store);
  });

  test('should query new XML file dev configurations', async () => {
    await fs.unlink(testXmlFilePath);
    const store = new XmlFileConfigStore({ path: testXmlFilePath });
    await store.init();
    const queries = [{ set: 'dev', key: 'GREETING' }];
    const results = await store.get(queries);
    expect(results).toEqual([]);
  });

  test('should query global configurations', async () => {
    const store = new XmlFileConfigStore({ path: testXmlFilePath });
    const queries = [{ set: 'dev', key: 'GREETING' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: 'dev', key: 'GREETING', value: 'hey' }]);
  });

  test('should query configurations', async () => {
    const store = new XmlFileConfigStore({ path: testXmlFilePath });
    const queries = [{ set: 'prod', key: 'SUBJECT' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: 'prod', key: 'SUBJECT', value: 'world' }]);
  });
});
