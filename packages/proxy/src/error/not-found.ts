import { FastifyError } from 'fastify';

export class NotFoundError implements FastifyError {
  code: string = 'FST_ERR_NOT_FOUND';
  name: string = 'NotFoundError';
  message: string;
  statusCode: number = 404;

  constructor(message: string = 'Item not found') {
    this.message = message;
  }
}
