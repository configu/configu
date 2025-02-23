import { ServerOptions } from 'node:https';
import { readFileSync } from 'node:fs';

import Fastify, { FastifyInstance } from 'fastify';
import GracefulServer from '@gquittet/graceful-server';
import Helmet from '@fastify/helmet';
import Cors, { FastifyCorsOptions } from '@fastify/cors';
import BearerAuth from '@fastify/bearer-auth';
import Swagger, { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import SwaggerUI from '@scalar/fastify-api-reference';

import { JSONSchema } from '@configu/sdk';
import { ConfiguInterface, ConfiguFileInterfaceConfig, configuFilesApi } from '@configu/common';

import packageJson from '../package.json' with { type: 'json' };
import { routes } from './routes';

export async function listen(config: ConfiguFileInterfaceConfig) {
  let https: ServerOptions | null = null;
  if (config.proxy?.tls?.enabled ?? false) {
    if (!config.proxy?.tls?.cert || !config.proxy?.tls?.key) {
      throw new Error('TLS cert and key must be set when TLS is enabled');
    }
    https = {
      cert: readFileSync(config.proxy.tls.cert),
      key: readFileSync(config.proxy.tls.key),
    };
  }

  const server: FastifyInstance = Fastify({
    logger: {
      enabled: config.debug ?? false,
      stream: process.stderr,
    },
    https,
    // trustProxy: config.CONFIGU_HTTP_TRUST_PROXY,
    ajv: {
      customOptions: JSONSchema.ajvOptions,
    },
  });
  const gracefulServer = GracefulServer(server.server);

  server.register(Helmet);

  const origin = `${https ? 'https' : 'http'}://${config.proxy?.domain ?? 'localhost'}`;
  const CORS_OPTIONS: FastifyCorsOptions = {
    origin,
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
      title: packageJson.name,
      description:
        'This site hosts documentation generated from the [Configu](https://github.com/configu/configu) Proxy API OpenAPI specification. Visit our complete [Proxy API docs](https://docs.configu.com/interfaces/proxy) for how to get started, more information about each endpoint, parameter descriptions, and examples.',
      contact: packageJson.author,
      license: { name: packageJson.license, identifier: packageJson.license },
      version: packageJson.version,
    },
    externalDocs: {
      url: 'https://docs.configu.com/interfaces/proxy',
    },
    servers: [
      {
        url: `${origin}:${config.proxy?.http?.port ?? 8080}`,
      },
    ],
  };
  server.register(Swagger, { openapi: OPENAPI_OPTIONS });

  const isAuthEnabled = config.proxy?.auth?.bearer ?? false;
  if (isAuthEnabled) {
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
  server.register(async (instance) => {
    if (isAuthEnabled) {
      instance.register(BearerAuth, { keys: config.proxy?.auth?.bearer?.keys as string[] });
    }
    instance.register(routes);
  });

  // if (config.CONFIGU_DOCS_ENABLED) {
  server.register(SwaggerUI, {
    routePrefix: '/docs',
    configuration: {
      theme: 'default',
      customCss: `.darklight { padding: 18px 24px !important; } .darklight-reference-promo { display: none !important; }`,
      metaData: {
        title: packageJson.name,
        description: packageJson.description,
        ogTitle: packageJson.name,
        ogDescription: packageJson.description,
      },
    },
  });
  // }

  if (config.proxy?.http?.enabled ?? true) {
    await server.listen({
      host: config.proxy?.host ?? '0.0.0.0',
      port: config.proxy?.http?.port ?? 8080,
    });
    gracefulServer.setReady();
  }
}

export const checkForUpdates = async (config: ConfiguFileInterfaceConfig) => {
  // todo: implement update check using packageJson and configuFilesApi
};

(async () => {
  try {
    // Initiating Proxy interface
    await ConfiguInterface.initEnvironment();
    await ConfiguInterface.initConfig();

    if (ConfiguInterface.context.isGlobal) {
      await checkForUpdates(ConfiguInterface.context.interface);
    }

    await listen(ConfiguInterface.context.interface);
  } catch (error) {
    process.stderr.write(error.message);
    process.exitCode = 1;
  }
})();
