import axios from 'axios';
import _ from 'lodash';
import { EvaluatedConfigs } from '@configu/ts';
import { CONFIG_SYNCHRONIZER_LABEL } from '@configu/lib';

const label = CONFIG_SYNCHRONIZER_LABEL.Vercel;
// * `target` and `type` are mandatory for the "Create one or more environment variables" Vercel endpoint.
// * Endpoint doc: https://vercel.com/docs/rest-api#endpoints/projects/create-one-or-more-environment-variables
const DEFAULT_TARGETS = ['development', 'preview', 'production'];
const DEFAULT_TYPE = 'encrypted';

export type VercelConfiguration = {
  // * Vercel docs: https://devcenter.heroku.com/articles/platform-api-reference#config-vars
  token: string;
  appUid: string;
};
type VercelEnvVar = { key: string; id: string; [otherKeys: string]: unknown };

// TODO - Decide between syncVercelConfigs (previous name) and syncVercelEnvVars
export const syncVercelEnvVars = async ({
  configuration,
  configs,
}: {
  configuration: Partial<VercelConfiguration>;
  configs: EvaluatedConfigs;
}) => {
  const { token, appUid } = configuration;
  if (!token || !appUid) {
    throw new Error(`${label} credentials are missing`);
  }

  const client = axios.create({
    baseURL: `https://api.vercel.com/v8/projects/${appUid}/env`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    responseType: 'json',
  });

  const { data } = await client.get('/');
  const vercelEnvVarsDict = _.keyBy<VercelEnvVar>(data.envs, 'key');
  const syncPromises = Object.entries(configs).map(([key, value]) => {
    // * Existing Vercel env vars need to be updated explicitly via id
    const vercelEnvVarId = vercelEnvVarsDict[key]?.id;
    if (vercelEnvVarId) {
      return client.patch(`/${vercelEnvVarId}`, { value });
    }
    return client.post('/', {
      key,
      value,
      target: DEFAULT_TARGETS,
      type: DEFAULT_TYPE,
    });
  });

  await Promise.all(syncPromises);
};
