import { InMemoryStore, ConfigSet, ConfigSchema, UpsertCommand, EvalCommand } from '..';

describe(`commands`, () => {
  const mainStore = new InMemoryStore();
  const secondaryStore = new InMemoryStore();

  const set = new ConfigSet('test');

  const s1 = new ConfigSchema('s1.cfgu.json');
  s1.contents = JSON.stringify({
    S11: {
      type: 'Number',
    },
    S12: {
      type: 'String',
      default: 'test',
      depends: ['S11'],
    },
    S13: {
      type: 'String',
      template: '{{S11}}-{{S12}}@{{S21}}',
    },
  });
  const s2 = new ConfigSchema('s2.cfgu.json');
  s2.contents = JSON.stringify({
    S21: {
      type: 'RegEx',
      pattern: '^(foo|bar|baz)$',
    },
  });

  describe(`UpsertCommand`, () => {
    it(`throw invalid type`, async () => {
      const resPromise = new UpsertCommand({
        store: mainStore,
        set,
        schema: s1,
        configs: [{ key: 'S11', value: 'ran' }],
      }).run();
      await expect(resPromise).rejects.toThrow();
    });
  });

  describe(`EvalCommand`, () => {
    it(`with reference`, async () => {
      await new UpsertCommand({
        store: secondaryStore,
        set,
        schema: s1,
        configs: [{ key: 'S11', value: '4' }],
      }).run();
      await new UpsertCommand({
        store: mainStore,
        set,
        schema: s1,
        configs: [{ key: 'S11', value: '{{ store=in-memory;query=test/s1.S11 }}' }],
      }).run();
      await new UpsertCommand({
        store: mainStore,
        set,
        schema: s2,
        configs: [{ key: 'S21', value: 'baz' }],
      }).run();

      const { data } = await new EvalCommand({
        store: [mainStore, secondaryStore],
        set,
        schema: [s1, s2],
      }).run();

      expect(data).toHaveProperty('S11', '4');
      expect(data).toHaveProperty('S21', 'baz');
    });
  });
});
