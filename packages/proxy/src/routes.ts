import { FastifyPluginAsync } from 'fastify';
import { ConfigSchema, ConfigSet, EvalCommand, EvalCommandOutput, ExportCommand, FromSchema } from '@configu/sdk';
import { CfguFile, ConfiguInterface } from '@configu/common';

const body = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['store', 'schema'],
    additionalProperties: false,
    properties: {
      store: {
        type: 'string',
        minLength: 1,
      },
      set: {
        type: 'string',
      },
      schema: {
        type: ['string', 'object'],
        oneOf: [
          {
            type: 'string',
            minLength: 1,
          },
          CfguFile.schema,
        ],
      },
      override: {
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
      },
    },
  },
} as const;

const ok = {
  type: 'object',
  additionalProperties: true,
} as const;

export const routes: FastifyPluginAsync = async (server, opts): Promise<void> => {
  server.post<{ Body: FromSchema<typeof body>; Reply: FromSchema<typeof ok> }>(
    '/export',
    {
      schema: {
        body,
        response: {
          200: ok,
        },
      },
    },
    async (request, reply) => {
      const evalResToExport = await request.body.reduce<Promise<EvalCommandOutput>>(async (previousResult, input) => {
        const store = await ConfiguInterface.getStoreInstance(input.store);
        const set = new ConfigSet(input.set);
        const schema =
          typeof input.schema === 'string'
            ? await ConfiguInterface.getSchemaInstance(input.schema)
            : new ConfigSchema(input.schema.keys);
        const configs = input.override;
        const pipe = await previousResult;

        const evalCommand = new EvalCommand({ store, set, schema, configs, pipe });
        const { result } = await evalCommand.run();
        await ConfiguInterface.backupEvalOutput({ storeName: input.store, set, schema, evalOutput: result });

        return result;
      }, Promise.resolve({}));

      const exportCommand = new ExportCommand({ pipe: evalResToExport });
      const { result } = await exportCommand.run();

      return reply.send(result);
    },
  );
};
