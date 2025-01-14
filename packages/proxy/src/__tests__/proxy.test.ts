import assert from 'assert';
import { test, before, after } from 'node:test';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { ConfiguInterface } from '@configu/common';
import http, { IncomingMessage } from 'http';
import querystring from 'querystring';
import { config } from '../config';
import { buildServer } from '../server';

let server: ReturnType<typeof buildServer>;

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

test('should handle SSE stream and close connection', async () => {
  const query = querystring.stringify({ cron: '* * * * *' });
  const urlPath = `/export?${query}`;
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
  const httpOptions = {
    hostname: config.CONFIGU_HTTP_ADDR,
    port: config.CONFIGU_HTTP_PORT,
    path: urlPath,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'Content-Length': Buffer.byteLength(requestBody),
    },
  };

  const makeRequest = async (options: http.RequestOptions, body: string) => {
    return new Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }>((resolve) => {
      const req = http.request(options, (res: IncomingMessage) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk.toString();

          if (data.includes('data')) {
            resolve({
              statusCode: res.statusCode || 0,
              headers: res.headers,
              body: data,
            });

            res.destroy();
            req.destroy();
            assert.ok(true, 'Stream stopped after receiving desired data');
          }
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body: data,
          });
        });
      });

      req.on('error', (err: string) => {
        throw new Error(err);
      });
      req.write(body);
      req.end();
    });
  };

  // Make the request and await the response
  const response = await makeRequest(httpOptions, requestBody);
  assert.strictEqual(response.statusCode, 200, 'Expected status code 200');
  assert(
    Object.prototype.hasOwnProperty.call(JSON.parse(response.body), 'data'),
    'Expected a data property in the response',
  );
});
