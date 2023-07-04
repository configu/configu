(async () => {
  // require('dotenv').config();

  const path = require('path');
  const { JsonFileConfigStore, ConfigSet, ConfigSchema, ExportCommand } = require('@configu/node')

  const store = new JsonFileConfigStore(path.resolve(__dirname, './store.json'));
  const set = new ConfigSet(process.env.NODE_ENV);
  const schema = new ConfigSchema(path.resolve(__dirname, './get-started.cfgu.json'));

  await new ExportCommand({
    store,
    set,
    schema,
  }).run()
  
  console.log('=== js ===');
  console.log(process.env.MESSAGE);
})();