import { InMemoryProvider, type EvaluationContext } from '@openfeature/server-sdk';
import { ConfigSet, ConfigSchema, EvalCommand } from '@configu/ts';
import { OpenFeatureConfigStore } from './OpenFeature';
import { ExportCommand } from '../commands/ExportCommand';

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
          contextEvaluator: (context) => {
            if (context.set === 'Development') {
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
          contextEvaluator: (context) => {
            if (context.set === 'Development') {
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
          contextEvaluator: (context) => {
            if (context.set === 'Development') {
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
    const set = new ConfigSet('');
    const schema = new ConfigSchema('featureFlagSchema', {
      MyBoolFeatureFlag: { type: 'Boolean' },
      MyNumberFeatureFlag: { type: 'Number' },
      MyStringFeatureFlag: { type: 'String' },
    });
    await store.init();
    const evalResult = await new EvalCommand({
      store,
      set,
      schema,
    }).run();
    const exportResult = await new ExportCommand({ data: evalResult }).run();
    const { MyBoolFeatureFlag, MyNumberFeatureFlag, MyStringFeatureFlag } = exportResult;
    expect(MyBoolFeatureFlag).toBe('true');
    expect(MyNumberFeatureFlag).toBe('1');
    expect(MyStringFeatureFlag).toBe('on');
  });

  test('Get values from context', async () => {
    const store = new OpenFeatureTestConfigStore({});
    const set = new ConfigSet('Development');
    const schema = new ConfigSchema('featureFlagSchema', {
      MyBoolFeatureFlag: { type: 'Boolean' },
      MyNumberFeatureFlag: { type: 'Number' },
      MyStringFeatureFlag: { type: 'String' },
    });
    await store.init();
    const evalResult = await new EvalCommand({
      store,
      set,
      schema,
    }).run();
    const exportResult = await new ExportCommand({ data: evalResult }).run();
    const { MyBoolFeatureFlag, MyNumberFeatureFlag, MyStringFeatureFlag } = exportResult;
    expect(MyBoolFeatureFlag).toBe('false');
    expect(MyNumberFeatureFlag).toBe('0');
    expect(MyStringFeatureFlag).toBe('off');
  });
});
