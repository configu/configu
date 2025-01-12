import { ConfiguInterface } from '@configu/common';
import { fileURLToPath } from 'url';
import { buildServer } from './server';
import { config } from './config';

export async function listen() {
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

// Only run listen() if this file is the entry point (e.g. run via "node index.js")
const modulePath = fileURLToPath(import.meta.url);
if (modulePath === process.argv[1]) {
  (async () => {
    await listen();
  })();
}
