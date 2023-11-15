import { InMemoryProvider, type EvaluationContext } from '@openfeature/server-sdk';
import { OpenFeatureConfigStore } from './OpenFeature';

class OpenFeatureTestConfigStore extends OpenFeatureConfigStore {
  constructor(context: EvaluationContext) {
    super('OpenFeatureTestConfigStore', {
      provider: new InMemoryProvider({
        MyBoolFeatureFlag: {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'on',
          contextEvaluator: (ctx) => {
            if (ctx.set === 'Development') {
              return 'off';
            }
            return 'on';
          },
        },
        MyNumberFeatureFlag: {
          variants: {
            on: 1,
            off: 0,
          },
          disabled: false,
          defaultVariant: 'on',
          contextEvaluator: (ctx) => {
            if (ctx.set === 'Development') {
              return 'off';
            }
            return 'on';
          },
        },
        MyStringFeatureFlag: {
          variants: {
            on: 'on',
            off: 'off',
          },
          disabled: false,
          defaultVariant: 'on',
          contextEvaluator: (ctx) => {
            if (ctx.set === 'Development') {
              return 'off';
            }
            return 'on';
          },
        },
      }),
      context,
    });
  }
}

describe('OpenFeatureConfigStore', () => {
  test('Get on values without context', async () => {
    const store = new OpenFeatureTestConfigStore({});
    await store.init();
    const configs = await store.get([
      { set: '', key: 'MyBoolFeatureFlag' },
      { set: '', key: 'MyNumberFeatureFlag' },
      {
        set: '',
        key: 'MyStringFeatureFlag',
      },
    ]);
    const configsMap: { [key: string]: any } = configs.reduce((acc, config) => ({ ...acc, [config.key]: config }), {});
    const { MyBoolFeatureFlag, MyNumberFeatureFlag, MyStringFeatureFlag } = configsMap;
    expect(MyBoolFeatureFlag.value).toBe('true');
    expect(MyNumberFeatureFlag.value).toBe('1');
    expect(MyStringFeatureFlag.value).toBe('on');
  });

  test('Get values from context', async () => {
    const store = new OpenFeatureTestConfigStore({});
    await store.init();
    const configs = await store.get([
      { set: 'Development', key: 'MyBoolFeatureFlag' },
      { set: 'Development', key: 'MyNumberFeatureFlag' },
      {
        set: 'Development',
        key: 'MyStringFeatureFlag',
      },
    ]);
    const configsMap: { [key: string]: any } = configs.reduce((acc, config) => ({ ...acc, [config.key]: config }), {});
    const { MyBoolFeatureFlag, MyNumberFeatureFlag, MyStringFeatureFlag } = configsMap;
    expect(MyBoolFeatureFlag.value).toBe('false');
    expect(MyNumberFeatureFlag.value).toBe('0');
    expect(MyStringFeatureFlag.value).toBe('off');
  });
});
