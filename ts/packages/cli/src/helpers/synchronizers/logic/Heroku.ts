import axios from 'axios';
import _ from 'lodash';
import { EvaluatedConfigs } from '@configu/ts';
import { CONFIG_SYNCHRONIZER_LABEL } from '@configu/lib';

const label = CONFIG_SYNCHRONIZER_LABEL.Heroku;

export type HerokuConfiguration = {
  // * Heroku docs: https://devcenter.heroku.com/articles/platform-api-reference#config-vars
  token: string;
  appUid: string;
};

export const syncHerokuConfigVars = async ({
  configuration,
  configs,
}: {
  configuration: Partial<HerokuConfiguration>;
  configs: EvaluatedConfigs;
}) => {
  const { token, appUid } = configuration;
  if (!token || !appUid) {
    throw new Error(`${label} credentials are missing`);
  }

  const client = axios.create({
    baseURL: `https://api.heroku.com/apps/${appUid}`,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.heroku+json; version=3',
      'Content-Type': 'application/json',
    },
    responseType: 'json',
  });

  const { data } = await client.get('/config-vars');
  const configVarsObject = { ..._.mapValues(data, 'null'), ...configs };
  const configVarsString = JSON.stringify(configVarsObject);
  await client.patch('/config-vars', configVarsString);
};
