import test, { describe, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { Test, TestBed } from './test-bed';

describe('example', () => {
  let module: TestBed;
  const mockStore = Test.createMockStore();

  function myExpression(str: string) {
    return str.includes('foo');
  }

  beforeEach(async () => {
    module = await Test.createTestingBed({
      schema: Test.createMockSchema(['FOO', 'BAR']),
      set: 'default',
      stores: [mockStore],
      expressions: [...Test.createMockExpressions(['foo', 'bar']), { key: 'myExpression', value: myExpression }],
    });
  });

  test('test', async () => {
    assert.equal(mockStore.getMock.callCount(), 0);

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
  });

  test('eval test', async () => {
    assert.equal(mockStore.getMock.callCount(), 2);

    assert.equal(await module.eval('Dotenv()'), `FOO=foo\nBAR=bar`);
    assert.equal(mockStore.getMock.callCount(), 3);
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
