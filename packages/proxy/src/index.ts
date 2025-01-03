import Fastify, { FastifyInstance } from 'fastify';
import GracefulServer from '@gquittet/graceful-server';
import Helmet from '@fastify/helmet';
import Cors, { FastifyCorsOptions } from '@fastify/cors';
import BearerAuth from '@fastify/bearer-auth';
import Swagger, { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import SwaggerUI from '@scalar/fastify-api-reference';

import { ConfiguInterface } from '@configu/common';
import { config } from './config';
import { routes } from './routes';

const server: FastifyInstance = Fastify({
  https: config.HTTPS_CONFIG,
  trustProxy: config.CONFIGU_HTTP_TRUST_PROXY,
  logger: config.CONFIGU_LOG_ENABLED,
});
const gracefulServer = GracefulServer(server.server);

server.register(Helmet);

const CORS_OPTIONS: FastifyCorsOptions = {
  origin: config.CONFIGU_HTTP_ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Content-Encoding'],
  exposedHeaders: ['Content-Type', 'Content-Disposition'],
  credentials: true,
  maxAge: 86400,
};
server.register(Cors, CORS_OPTIONS);

const OPENAPI_OPTIONS: FastifyDynamicSwaggerOptions['openapi'] = {
  openapi: '3.1.0',
  info: {
    title: config.CONFIGU_PKG.name,
    description:
      'This site hosts documentation generated from the [Configu](https://github.com/configu/configu) Proxy API OpenAPI specification. Visit our complete [Proxy API docs](https://docs.configu.com/interfaces/proxy) for how to get started, more information about each endpoint, parameter descriptions, and examples.',
    contact: config.CONFIGU_PKG.author,
    license: { name: config.CONFIGU_PKG.license, identifier: config.CONFIGU_PKG.license },
    version: config.CONFIGU_PKG.version,
  },
  externalDocs: {
    url: 'https://docs.configu.com/interfaces/proxy',
  },
  servers: [
    {
      url: config.CONFIGU_PUBLIC_URL,
    },
  ],
};
if (config.CONFIGU_AUTH_ENABLED) {
  const AUTH_NAME = 'Preshared Key';
  OPENAPI_OPTIONS.components = {
    securitySchemes: {
      [AUTH_NAME]: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: AUTH_NAME,
      },
    },
  };
  OPENAPI_OPTIONS.security = [{ [AUTH_NAME]: [] }];
}
server.register(Swagger, { openapi: OPENAPI_OPTIONS });

server.register(async (instance) => {
  if (config.CONFIGU_AUTH_ENABLED) {
    instance.register(BearerAuth, { keys: config.CONFIGU_AUTH_PRESHARED_KEYS });
  }
  instance.register(routes);
});

if (config.CONFIGU_DOCS_ENABLED) {
  server.register(SwaggerUI, {
    routePrefix: '/docs',
    configuration: {
      theme: 'default',
      customCss: `.darklight { padding: 18px 24px !important; } .darklight-reference-promo { display: none !important; }`,
      metaData: {
        title: config.CONFIGU_PKG.name,
        description: config.CONFIGU_PKG.description,
        ogTitle: config.CONFIGU_PKG.name,
        ogDescription: config.CONFIGU_PKG.description,
      },
    },
  });
}

export async function listen() {
  try {
    await ConfiguInterface.init({
      input: config.CONFIGU_CONFIG_FILE,
    });
    await server.listen({
      host: config.CONFIGU_HTTP_ADDR,
      port: config.CONFIGU_HTTP_PORT,
    });
    gracefulServer.setReady();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

(async () => {
  await listen();
})();
