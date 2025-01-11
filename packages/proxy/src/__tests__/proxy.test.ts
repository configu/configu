import { expect } from 'chai';
import request from 'supertest';
import { buildServer } from '../server';

describe('Server (Mocha + Chai)', function () {
  let server: ReturnType<typeof buildServer>;

  // Mocha's "before" hook runs once before all tests in this suite
  before(async function () {
    server = buildServer();
    await server.ready(); // If your server needs to be "ready"
  });

  // Mocha's "after" hook runs once after all tests in this suite
  after(async function () {
    await server.close(); // Clean up resources
  });

  it('should respond with 200 on GET /docs (if enabled)', async function () {
    const response = await request(server.server).get('/docs');
    expect(response.status).to.equal(200);
    expect(response.text).to.include('html');
  });

  it('should return 404 for unknown routes', async function () {
    const response = await request(server.server).get('/foobar');
    expect(response.status).to.equal(404);
  });

  it('should handle POST /export successfully', async function () {
    const mockBody = [
      // todo get actuall mock body to search
      {
        store: 'testStore',
        set: 'testSet',
        schema: { keys: { SOME_KEY: 'string' } },
        configs: { SOME_KEY: 'some value' },
      },
    ];

    const response = await request(server.server)
      .post('/export')
      .send(mockBody)
      .set('Content-Type', 'application/json');

    expect(response.status).to.equal(200);
    expect(response.body).to.be.an('object'); // todo get actuall result to compare
  });

  it('should return SSE headers if we pass a valid cron param', async () => {
    const mockBody = [
      {
        store: 'testStore',
        set: 'testSet',
        schema: { keys: { SOME_KEY: 'string' } },
        configs: { SOME_KEY: 'some value' },
      },
    ];
    const response = await request(server.server)
      .post('/export?cron=* * * * *')
      .send(mockBody)
      .set('Content-Type', 'application/json')
      .timeout({ deadline: 3000, response: 3000 }) // so test won't hang forever
      .catch((err) => err); // supertest might error if server never ends the response

    expect(response.response.headers['content-type']).match(/text\/event-stream/i);
    expect(response.status).be('200');
  });
});
