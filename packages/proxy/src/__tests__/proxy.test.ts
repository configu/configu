import assert from 'assert';
import { test, before, after } from 'node:test';
import { buildServer } from '../server';

let server: ReturnType<typeof buildServer>;

before(async () => {
  server = buildServer();
  await server.ready();
});

after(async () => {
  await server.close();
});

test('should respond with 200 on GET /docs (if enabled)', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/docs',
  });

  assert.strictEqual(response.statusCode, 200, 'Expected status code 200');
  assert.match(response.body, /html/, 'Expected response to include "html"');
});

test('should handle POST /export successfully', async () => {
  const mockBody = [
    {
      store: 'testStore',
      set: 'testSet',
      schema: { keys: { SOME_KEY: 'string' } },
      configs: { SOME_KEY: 'some value' },
    },
  ];

  const response = await server.inject({
    method: 'POST',
    url: '/export',
    payload: mockBody,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  assert.strictEqual(response.statusCode, 200, 'Expected status code 200');
  assert.strictEqual(typeof JSON.parse(response.body), 'object', 'Expected response body to be an object');
});

test('should return SSE headers if we pass a valid cron param', async () => {
  const mockBody = [
    {
      store: 'testStore',
      set: 'testSet',
      schema: { keys: { SOME_KEY: 'string' } },
      configs: { SOME_KEY: 'some value' },
    },
  ];

  const response = await server.inject({
    method: 'POST',
    url: '/export?cron=* * * * *',
    payload: mockBody,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  assert(response.headers['content-type'], 'Content-Type header is missing');
  assert.match(
    response.headers['content-type'],
    /text\/event-stream/i,
    'Expected content-type to be text/event-stream',
  );
  assert.strictEqual(response.statusCode, 200, 'Expected status code 200');
});
