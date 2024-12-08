import { FastifyPluginAsync } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { ConfigSchema, ConfigSet } from '@configu/sdk';
import {
  EvalCommand,
  EvalCommandOutput,
  EvaluatedConfigOrigin,
  UpsertCommand,
  ExportCommand,
} from '@configu/sdk/commands';
import _ from 'lodash';
import { ConfiguInterface } from '@configu/common';
import { config } from './config';

const body = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['store', 'set', 'schema'],
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
        type: 'object',
        properties: {
          keys: {
            type: 'object',
          },
        },
      },
      configs: {
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
      // // TODO: get the ConfiguFile instance from a shared location
      // const configuFile = await ConfiguFile.load(config.CONFIGU_CONFIG_FILE);

      const evalResToExport = await request.body.reduce<Promise<EvalCommandOutput>>(
        async (previousResult, { store, set, schema: { keys }, configs }) => {
          const pipe = await previousResult;

          const storeInstance = await ConfiguInterface.getStoreInstance(store);
          if (!storeInstance) {
            throw new Error(`store "${store}" not found`);
          }
          const setInstance = new ConfigSet(set);
          // todo: fix this any
          const schemaInstance = new ConfigSchema(keys as any);

          const evalCmd = new EvalCommand({
            store: storeInstance,
            set: setInstance,
            schema: schemaInstance,
            configs,
            pipe,
          });
          const { result } = await evalCmd.run();
          await ConfiguInterface.backupEvalOutput({
            storeName: store,
            set: setInstance,
            schema: schemaInstance,
            evalOutput: result,
          });

          // // TODO: move backup logic to common
          // const backupStoreInstance = await configuFile.getBackupStoreInstance(store);
          // if (backupStoreInstance) {
          //   const backupConfigs = _(evalRes.result)
          //     .pickBy((entry) => entry.origin === EvaluatedConfigOrigin.Store)
          //     .mapValues((entry) => entry.value)
          //     .value();
          //   await new UpsertCommand({
          //     store: backupStoreInstance,
          //     set: setInstance,
          //     schema: schemaInstance,
          //     configs: backupConfigs,
          //   }).run();
          // }

          return result;
        },
        Promise.resolve({}),
      );

      const exportCmd = new ExportCommand({ pipe: evalResToExport });
      const exportRes = await exportCmd.run();
      // TODO: consider if this is the right way to parse the result
      // const parsedExportRes = JSON.parse(exportRes.result);
      return reply.send(exportRes);
    },
  );
};
