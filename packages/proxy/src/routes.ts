import { FastifyPluginAsync } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { ConfigSchema, ConfigSet, EvalCommand, UpsertCommand, ExportCommand } from '@configu/node';
import { CfguSchema, ConfigSchemaContents, EvalCommandReturn, EvaluatedConfigOrigin, NamingPattern } from '@configu/ts';
import _ from 'lodash';
import { getConfiguFile } from './utils';
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
        required: ['name', 'contents'],
        additionalProperties: false,
        properties: {
          name: {
            type: 'string',
            minLength: 1,
          },
          // openapi and fastify plugins don't support the full JSON schema spec so the actual deep validations for the schema contents will be done by the ConfigSchema constructor
          contents: {
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
      const configuFile = await getConfiguFile();
      const evalResToExport = await request.body.reduce<Promise<EvalCommandReturn>>(
        async (previousResult, { store, set, schema: { name, contents }, configs }) => {
          const pipe = await previousResult;

          const storeInstance = await configuFile.getStoreInstance({
            storeName: store,
            cacheDir: config.CONFIGU_STORES_CACHE_DIR,
            configuration: configuFile.contents.stores?.[store]?.configuration,
            // TODO: get version from configu file somehow
            // version: configuFile.contents.stores?.[store]?.version,
          });
          const setInstance = new ConfigSet(set);
          const schemaInstance = new ConfigSchema(name, contents as unknown as ConfigSchemaContents);

          const evalCmd = new EvalCommand({
            store: storeInstance,
            set: setInstance,
            schema: schemaInstance,
            configs,
            pipe,
          });
          const evalRes = await evalCmd.run();

          const backupStoreInstance = await configuFile.getBackupStoreInstance({
            storeName: store,
            cacheDir: config.CONFIGU_STORES_CACHE_DIR,
            configuration: configuFile.contents.stores?.[store]?.configuration,
            // TODO: get version from configu file somehow
            // version: configuFile.contents.stores?.[store]?.version,
          });
          if (backupStoreInstance) {
            const backupConfigs = _(evalRes)
              .pickBy((entry) => entry.result.origin === EvaluatedConfigOrigin.StoreSet)
              .mapValues((entry) => entry.result.value)
              .value();
            await new UpsertCommand({
              store: backupStoreInstance,
              set: setInstance,
              schema: schemaInstance,
              configs: backupConfigs,
            }).run();
          }

          return evalRes;
        },
        Promise.resolve({}),
      );

      const exportCmd = new ExportCommand({ pipe: evalResToExport });
      const exportRes = await exportCmd.run();
      return exportRes;
    },
  );
};
