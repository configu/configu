import Fastify, { FastifyInstance } from 'fastify';
// import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@scalar/fastify-api-reference';
import { config } from './config';
import { routes } from './routes';

const server: FastifyInstance = Fastify({
  https: config.HTTPS_CONFIG,
  trustProxy: config.CONFIGU_HTTP_TRUST_PROXY,
  logger: config.CONFIGU_LOG_ENABLED,
});

// server.register(helmet, {});
server.register(cors, {
  origin: config.CONFIGU_HTTP_ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Content-Encoding'],
  exposedHeaders: ['Content-Type', 'Content-Disposition'],
  credentials: true,
  maxAge: 86400,
});
server.register(swagger, {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: config.CONFIGU_PKG.name,
      // summary: config.CONFIGU_PKG.description,
      // description: config.CONFIGU_PKG.description,
      description:
        'This site hosts documentation generated from the [Configu](https://github.com/configu/configu) Proxy API OpenAPI specification. Visit our complete [Proxy API docs](https://docs.configu.com/interfaces/proxy) for how to get started, more information about each endpoint, parameter descriptions, and examples.',
      contact: {
        name: config.CONFIGU_PKG.author,
        ...config.CONFIGU_PKG.bugs,
      },
      license: { name: config.CONFIGU_PKG.license, identifier: config.CONFIGU_PKG.license },
      version: config.CONFIGU_PKG.version,
    },
    externalDocs: {
      url: 'https://docs.configu.com/interfaces/proxy',
    },
    servers: [
      {
        url: `${config.HTTPS_CONFIG ? 'https' : 'http'}://${config.CONFIGU_HTTP_ADDR}:${config.CONFIGU_HTTP_PORT}`,
      },
    ],
    // tags: [
    //   { name: 'user', description: 'User related end-points' },
    //   { name: 'code', description: 'Code related end-points' },
    // ],
    // components: {
    //   securitySchemes: {
    //     bearerAuth: {
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'PresharedKey',
    //     },
    //   },
    // },
    // security: [{ key: [], id: [] }, { id: [] }],
  },
});

server.register(routes);

// Serve an OpenAPI file
// server.get('/openapi.json', async (request, reply) => {
//   return server.swagger();
// });

server.register(swaggerUI, {
  routePrefix: '/docs',
  configuration: {
    // isEditable: true,
    theme: 'default',
    // layout: 'modern',
    customCss: `.darklight { padding: 18px 24px !important; } .darklight-reference-promo { display: none !important; }`,
    metaData: {
      title: config.CONFIGU_PKG.name,
      // description: 'My page page',
      // ogDescription: 'Still about my my page',
      ogTitle: config.CONFIGU_PKG.name,
      // ogImage: 'https://example.com/image.png',
      // twitterCard: 'summary_large_image',
      // Add more...
    },
  },
});

(async () => {
  try {
    await server.listen({
      host: config.CONFIGU_HTTP_ADDR,
      port: config.CONFIGU_HTTP_PORT,
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();
