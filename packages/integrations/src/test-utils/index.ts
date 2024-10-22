import test, { describe, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import type { Config } from '@configu/sdk';
import { TestBed, TestModule } from './test-bed';

describe('example', () => {
  let module: TestModule;
  const mockStore = TestBed.createMockStore();

  const myExpression = test.mock.fn((str: string) => {
    return str.includes('foo');
  });

  const DotEnv = test.mock.fn((data: Record<string, Config>) => {
    return Object.keys(data)
      .map((key) => `${key}=${(data[key] as any)?.value}`)
      .join('\n');
  });

  beforeEach(async () => {
    module = await TestBed.createTestModule({
      schema: TestBed.createMockSchema(['FOO', 'BAR']),
      set: 'default',
      stores: [mockStore],
      expressions: [
        ...TestBed.createMockExpressions(['foo', 'bar']),
        { key: 'myExpression', value: myExpression },
        { key: 'MyDotEnv', value: DotEnv },
      ],
    });
  });

  test('test', async () => {
    assert.equal(mockStore.getMock.callCount(), 0);
    assert.equal(myExpression.mock.callCount(), 0);

    mockStore.getMock.mockImplementation(async () => {
      return [
        { key: 'FOO', value: 'foo', set: 'default' },
        { key: 'BAR', value: 'bar', set: 'default' },
      ];
    });
    assert.deepEqual(await module.test('myExpression()'), {
      FOO: { key: 'FOO', value: 'true', set: 'default' },
      BAR: { key: 'BAR', value: 'false', set: 'default' },
    });
    assert.equal(mockStore.getMock.callCount(), 1);
    assert.equal(myExpression.mock.callCount(), 2); // run for each key

    mockStore.getMock.mockImplementation(async () => {
      return [
        { key: 'FOO', value: 'baz', set: 'default' },
        { key: 'BAR', value: 'foo', set: 'default' },
      ];
    });
    assert.deepEqual(await module.test('myExpression()'), {
      FOO: { key: 'FOO', value: 'false', set: 'default' },
      BAR: { key: 'BAR', value: 'true', set: 'default' },
    });
    assert.equal(mockStore.getMock.callCount(), 2);
    assert.equal(myExpression.mock.callCount(), 4);
  });

  test('eval test', async () => {
    assert.equal(DotEnv.mock.callCount(), 0);
    assert.equal(mockStore.getMock.callCount(), 2);

    assert.equal(await module.eval('MyDotEnv()'), `FOO=foo\nBAR=bar`);
    assert.equal(mockStore.getMock.callCount(), 3);
    assert.equal(DotEnv.mock.callCount(), 1);
  });

  test('upsert test', async () => {
    assert.equal(mockStore.setMock.callCount(), 0);
    await module.upsert({
      FOO: 'foo',
      BAR: 'bar',
    });
    assert.equal(mockStore.setMock.callCount(), 1);
  });
});
