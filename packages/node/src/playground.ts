import { EtcdConfigStore, ConfigSet, ConfigSchema, UpsertCommand, EvalCommand, ExportCommand } from '.';

(async () => {
  const store = new EtcdConfigStore({
    hosts: ['127.0.0.1:2379'],
    auth: { username: 'root', password: 'Password1' },
  });

  const set = new ConfigSet('test');

  const schema = new ConfigSchema('test', {
    K11: {
      type: 'Number',
    },
    K12: {
      type: 'String',
    },
  });

  await new UpsertCommand({
    store,
    set,
    schema,
    configs: {
      K11: '10',
      K12: 'ran',
    },
  }).run();
  const data = await new EvalCommand({ store, set, schema }).run();
  const resp = await new ExportCommand({ pipe: data }).run();
  console.log(resp);
})();
