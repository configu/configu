import assert from 'node:assert';
import { test, before, after } from 'node:test';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfiguInterface } from '@configu/common';
import { config } from '../config';
import { buildServer } from '../server';

let server: ReturnType<typeof buildServer>;
interface SSEResponse {
  statusCode: number;
  headers: Headers;
  body: string;
}

before(async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  server = buildServer();
  try {
    await ConfiguInterface.init({
      input: path.resolve(__dirname, '.configu'),
    });

    await server.listen({
      host: config.CONFIGU_HTTP_ADDR,
      port: config.CONFIGU_HTTP_PORT,
    });

    await server.ready();
    server.gracefulServer.setReady();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
});

after(async () => {
  await server.close();
  process.exit(0);
});

test('should respond with 200 on GET /docs ', async () => {
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
      set: 'dev',
      schema: {
        keys: {
          GREETING: {
            pattern: '^(hello|hey|welcome|hola|salute|bonjour|shalom)$',
            default: 'hello',
          },
          SUBJECT: {
            default: 'world',
          },
          MESSAGE: {
            description: 'Generates a full greeting message',
          },
        },
      },
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

async function readSSE(fullUrl: URL, mockBody: string): Promise<SSEResponse> {
  const controller = new AbortController(); // Create an AbortController instance
  const { signal } = controller; // Extract the signal for the fetch request

  const responseSSE = await fetch(fullUrl, {
    method: 'POST',
    body: mockBody,
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  });

  assert(responseSSE.body, 'Body should return for SSE EP.');
  const reader = responseSSE.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let data = '';
  try {
    while (!data.includes('data')) {
      const result = Promise.resolve();
      // eslint-disable-next-line no-await-in-loop
      const { value, done } = await reader.read();
      if (done) break;
      data += decoder.decode(value, { stream: true });
      if (data.includes('data')) {
        // In SSE  the ReadableStream often doesn't end naturally because the connection remains open for streaming data.
        assert.ok(true, 'Stream stopped after receiving desired data');
        break;
      }
    }
  } finally {
    controller.abort();
  }

  const response: SSEResponse = {
    statusCode: responseSSE.status || 0,
    headers: responseSSE.headers,
    body: data,
  };

  return response;
}

test('should handle SSE stream and close connection', async () => {
  const mockBody = [
    {
      store: 'testStore',
      set: 'dev',
      schema: {
        keys: {
          GREETING: {
            pattern: '^(hello|hey|welcome|hola|salute|bonjour|shalom)$',
            default: 'hello',
          },
          SUBJECT: {
            default: 'world',
          },
          MESSAGE: {
            description: 'Generates a full greeting message',
          },
        },
      },
    },
  ];

  const requestBody = JSON.stringify(mockBody);
  const fullUrl = new URL('/export', `http://${config.CONFIGU_HTTP_ADDR}:${config.CONFIGU_HTTP_PORT}`);
  fullUrl.searchParams.append('cron', '* * * * *');
  const contentType = 'text/event-stream';

  const response = await readSSE(fullUrl, requestBody);
  assert.strictEqual(response.statusCode, 200, 'Expected status code 200');
  assert.strictEqual(
    response.headers.get('content-type'),
    contentType,
    `Content type should be as expected for sse data: ${contentType}`,
  );
  const bodyJson = response.body.replace(/^data:\s*/, ''); // SSE response excpected to start with 'data:'
  assert(
    Object.prototype.hasOwnProperty.call(JSON.parse(bodyJson), 'data'),
    'Expected a data property in the response',
  );
});
