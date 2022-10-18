import axios from 'axios';
import { EvaluatedConfigs } from '@configu/ts';
import { CONFIG_SYNCHRONIZER_LABEL } from '@configu/lib';

const label = CONFIG_SYNCHRONIZER_LABEL.Netlify;

export type NetlifyConfiguration = {
  // * Netlify docs: https://docs.netlify.com/configure-builds/environment-variables/
  token: string;
  siteId: string;
};

export const syncNetlifyEnvironmentVariables = async ({
  configuration,
  configs,
}: {
  configuration: Partial<NetlifyConfiguration>;
  configs: EvaluatedConfigs;
}) => {
  const { token, siteId } = configuration;
  if (!token || !siteId) {
    throw new Error(`${label} credentials are missing`);
  }

  const client = axios.create({
    baseURL: `https://api.netlify.com/api/v1/sites/${siteId}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    responseType: 'json',
  });

  await client.patch('/', { build_settings: { env: configs } });
};
