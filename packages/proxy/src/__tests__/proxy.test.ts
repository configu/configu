// import assert from 'assert';
// import { test, before, after } from 'node:test';
// import http from 'http';
// import { buildServer } from '../server';

// let server: ReturnType<typeof buildServer>;

// before(async () => {
//   server = buildServer();
//   await server.ready();
// });

// after(async () => {
//   await server.close();
// });

// test('should respond with 200 on GET /docs (if enabled)', async () => {
//   const address = server.server.address();
//   if(!address)
//     throw new Error('No address');

//   const options = {
//     hostname: 'localhost',
//     port: address.port,
//     path: '/docs',
//     method: 'GET',
//   };

//   const response = await new Promise((resolve, reject) => {
//     const req = http.request(options, (res) => {
//       let data = '';
//       res.on('data', (chunk) => (data += chunk));
//       res.on('end', () => resolve({ status: res.statusCode, text: data }));
//     });
//     req.on('error', reject);
//     req.end();
//   });

//   assert.strictEqual(response.status, 200, 'Expected status code 200');
//   assert.match(response.text, /html/, 'Expected response to include "html"');
// });

// test('should handle POST /export successfully', async () => {
//   const mockBody = JSON.stringify([
//     {
//       store: 'testStore',
//       set: 'testSet',
//       schema: { keys: { SOME_KEY: 'string' } },
//       configs: { SOME_KEY: 'some value' },
//     },
//   ]);

//   const options = {
//     hostname: 'localhost',
//     port: server.server.address().port,
//     path: '/export',
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Content-Length': Buffer.byteLength(mockBody),
//     },
//   };

//   const response = await new Promise((resolve, reject) => {
//     const req = http.request(options, (res) => {
//       let data = '';
//       res.on('data', (chunk) => (data += chunk));
//       res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
//     });
//     req.on('error', reject);
//     req.write(mockBody);
//     req.end();
//   });

//   assert.strictEqual(response.status, 200, 'Expected status code 200');
//   assert.strictEqual(typeof response.body, 'object', 'Expected response body to be an object');
// });

// test('should return SSE headers if we pass a valid cron param', async () => {
//   const mockBody = JSON.stringify([
//     {
//       store: 'testStore',
//       set: 'testSet',
//       schema: { keys: { SOME_KEY: 'string' } },
//       configs: { SOME_KEY: 'some value' },
//     },
//   ]);

//   const options = {
//     hostname: 'localhost',
//     port: server.server.address().port,
//     path: '/export?cron=* * * * *',
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Content-Length': Buffer.byteLength(mockBody),
//     },
//   };

//   const response = await new Promise((resolve, reject) => {
//     const req = http.request(options, (res) => {
//       let data = '';
//       res.on('data', (chunk) => (data += chunk));
//       res.on('end', () => resolve({
//         status: res.statusCode,
//         headers: res.headers,
//         body: data,
//       }));
//     });
//     req.on('error', reject);
//     req.write(mockBody);
//     req.end();
//   });

//   assert(response.headers['content-type'], 'Content-Type header is missing');
//   assert.match(
//     response.headers['content-type'],
//     /text\/event-stream/i,
//     'Expected content-type to be text/event-stream'
//   );
//   assert.strictEqual(response.status, 200, 'Expected status code 200');
// });
