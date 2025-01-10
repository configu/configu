import { FastifyPluginAsync } from 'fastify';
import cron from 'node-cron';
import { ConfigSchema, ConfigSet } from '@configu/sdk';
import { EvalCommand, EvalCommandOutput, ExportCommand } from '@configu/sdk/commands';
import { FromSchema } from '@configu/sdk/expressions';
import _ from 'lodash';
import { ConfiguInterface } from '@configu/common';

const body = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['store', 'set', 'schema'],
    additionalProperties: false,
    properties: {
      store: { type: 'string', minLength: 1 },
      set: { type: 'string' },
      schema: {
        type: 'object',
        properties: {
          keys: { type: 'object' },
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

// Optional querystring interface with cron
interface ExportQuerystring {
  cron?: string;
}

export async function runExportAndGetResult(requestBody: FromSchema<typeof body>) {
  const evalResToExport = await requestBody.reduce<Promise<EvalCommandOutput>>(
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

  return exportRes;
}

export const routes: FastifyPluginAsync = async (server, opts): Promise<void> => {
  server.post<{
    Body: FromSchema<typeof body>;
    Reply: FromSchema<typeof ok>;
    Querystring: ExportQuerystring;
  }>(
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

      // If there's no cron in the query, do the one-time export and return JSON
      if (!request.query.cron) {
        const exportRes = await runExportAndGetResult(request.body);

        // Return one-time result
        // TODO: consider if this is the right way to parse the result
        // const parsedExportRes = JSON.parse(exportRes.result);
        return reply.send(exportRes);
      }

      // Otherwise, we are in SSE mode, triggered by the presence of a "cron" query parameter
      if (!cron.validate(request.query.cron)) {
        throw new Error(`Invalid cron expression: "${request.query.cron}"`);
      }

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

      // Ensures headers are immediately sent
      reply.raw.flushHeaders();

      let eventId = 0; // for SSE id field

      // Helper to run existing logic and write to SSE
      const runExportAndWriteSSE = async () => {
        try {
          const exportRes = await runExportAndGetResult(request.body);

          // SSE event
          eventId += 1;
          const data = JSON.stringify(exportRes);
          reply.raw.write(`id: ${eventId}\n`);
          reply.raw.write(`event: export\n`);
          reply.raw.write(`data: ${data}\n\n`);
        } catch (error: any) {
          // SSE error event
          const errMsg = error?.message || 'Unknown error';
          reply.raw.write(`event: error\n`);
          reply.raw.write(`data: ${errMsg}\n\n`);
        }
      };

      // Use node-cron to schedule
      const task = cron.schedule(request.query.cron, async () => {
        await runExportAndWriteSSE();
      });

      // Run export once immediately before the cron schedule ticks
      await runExportAndWriteSSE();

      // Clean up if the client disconnects
      request.raw.on('close', () => {
        task.stop();
      });
      request.raw.on('end', () => {
        task.stop();
      });
      request.raw.on('aborted', () => {
        task.stop();
      });

      // Because we’re streaming, never call reply.send(),
      // just keep the connection open until client disconnects or an error occurs and return the reply
      return reply;
    },
  );
};
