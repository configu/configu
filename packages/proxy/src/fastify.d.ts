import 'fastify';
import GracefulServer from '@gquittet/graceful-server';

/**
 * Extend the built-in FastifyInstance interface
 * so it also recognizes `gracefulServer`.
 */
declare module 'fastify' {
  interface FastifyInstance {
    gracefulServer: ReturnType<typeof GracefulServer>;
  }
}
