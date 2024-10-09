import { FastifyPluginAsync } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import {
  ConfigSchema,
  ConfigSet,
  EvalCommand,
  EvalCommandOutput,
  EvaluatedConfigOrigin,
  UpsertCommand,
  ExportCommand,
} from '@configu/sdk';
import _ from 'lodash';
import { ConfiguFile } from '@configu/common';
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
        required: ['keys'],
        additionalProperties: false,
        properties: {
          name: {
            type: 'string',
            minLength: 1,
          },
          // openapi and fastify plugins don't support the full JSON schema spec so the actual deep validations for the schema contents will be done by the ConfigSchema constructor
          keys: {
            description: 'https://docs.configu.com/interfaces/.cfgu',
            type: 'object',
            minProperties: 1,
            additionalProperties: {
              type: 'object',
              minProperties: 1,
            },
          },
          // contents: ConfigSchemaContents,
          // contents: {
          //   description: 'https://docs.configu.com/interfaces/.cfgu',
          //   type: 'object',
          //   minProperties: 1,
          //   additionalProperties: CfguSchema,
          // },
          // contents: ConfigSchemaContents,
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
  additionalProperties: {
    type: 'string',
  },
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
      // TODO: get the ConfiguFile instance from a shared location
      const configuFile = await ConfiguFile.load(config.CONFIGU_CONFIG_FILE);

      const evalResToExport = await request.body.reduce<Promise<EvalCommandOutput>>(
        async (previousResult, { store, set, schema: { keys }, configs }) => {
          const pipe = await previousResult;

          const storeInstance = configuFile.getStoreInstance(store);
          if (!storeInstance) {
            throw new Error(`store "${store}" not found`);
          }
          const setInstance = new ConfigSet(set);
          const schemaInstance = new ConfigSchema(keys);

          const evalCmd = new EvalCommand({
            store: storeInstance,
            set: setInstance,
            schema: schemaInstance,
            configs,
            pipe,
          });
          const evalRes = await evalCmd.run();

          // TODO: move backup logic to common
          const backupStoreInstance = configuFile.getBackupStoreInstance(store);
          if (backupStoreInstance) {
            const backupConfigs = _(evalRes.result)
              .pickBy((entry) => entry.origin === EvaluatedConfigOrigin.Store)
              .mapValues((entry) => entry.value)
              .value();
            await new UpsertCommand({
              store: backupStoreInstance,
              set: setInstance,
              schema: schemaInstance,
              configs: backupConfigs,
            }).run();
          }

          return evalRes.result;
        },
        Promise.resolve({}),
      );

      const exportCmd = new ExportCommand({ pipe: evalResToExport });
      const exportRes = await exportCmd.run();
      // TODO: consider if this is the right way to parse the result
      const parsedExportRes = JSON.parse(exportRes.result);
      return reply.send(parsedExportRes);
    },
  );
};
