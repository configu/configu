import { ConfiguInterface } from '@configu/common';
import { buildServer } from './server';
import { config } from './config';

async function listen() {
  const server = buildServer();

  try {
    await ConfiguInterface.init({
      input: config.CONFIGU_CONFIG_FILE,
    });
    await server.listen({
      host: config.CONFIGU_HTTP_ADDR,
      port: config.CONFIGU_HTTP_PORT,
    });

    // Mark graceful server as ready
    server.gracefulServer.setReady();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

(async () => {
  await listen();
})();
