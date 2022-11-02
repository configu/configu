import axios, { Axios } from 'axios';
import _ from 'lodash';
import { Store, StoreQuery, StoreContents } from '@configu/ts';

type HashiCorpVaultConfiguration = { address: string; token: string };

// ! supports K/V2 engine only
export class HashiCorpVaultStore extends Store {
  static readonly protocol = 'hashicorp-vault';
  private client: Axios;
  constructor({ address, token }: HashiCorpVaultConfiguration) {
    super(HashiCorpVaultStore.protocol, {
      supportsGlobQuery: false,
      enforceRootSet: true,
      slashDisallowedOnKey: false,
    });

    this.client = axios.create({
      baseURL: `${address}/v1`,
      headers: {
        'X-Vault-Token': token,
      },
      responseType: 'json',
    });
  }

  // * K/V2 Read Secret Version - https://www.vaultproject.io/api-docs/secret/kv/kv-v2#read-secret-version
  private getSecretPath({ set, schema }: StoreQuery[number]) {
    // * set first element used as vault engine
    if (!set) {
      throw new Error(`invalid secret path is at ${this.constructor.name}`);
    }
    const splittedSet = set.split('/');
    const engine = splittedSet.shift();
    const path = _.isEmpty(splittedSet) ? schema : `${splittedSet.join('/')}/${schema}`;
    return `${engine}/data/${path}`;
  }

  async get(query: StoreQuery): Promise<StoreContents> {
    const secretsPaths = _(query)
      .map((q) => this.getSecretPath(q))
      .uniq()
      .value();

    const secretsPromises = secretsPaths.map(async (secretPath) => {
      try {
        const { data } = await this.client.get(secretPath);
        const secretData = data?.data?.data;
        if (secretData) {
          throw new Error(`secret ${secretPath} has no value at ${this.constructor.name}`);
        }
        return { secretPath, data: secretData };
      } catch (error) {
        return { secretPath, data: {} };
      }
    });
    const secretsArray = await Promise.all(secretsPromises);
    const secrets = _(secretsArray).keyBy('secretPath').mapValues('data').value();

    const storedConfigs = _(query)
      .map((q) => {
        const { set, schema, key } = q;
        const secretPath = this.getSecretPath(q);
        const secretData = secrets[secretPath];

        if (key === '*') {
          return Object.entries(secretData).map((data) => {
            return {
              set,
              schema,
              key: data[0],
              value: data[1] as any,
            };
          });
        }

        return {
          set,
          schema,
          key,
          value: secretData[key],
        };
      })
      .flatten()
      .filter('value')
      .value();

    return storedConfigs;
  }

  async set(configs: StoreContents): Promise<void> {
    const secrets: Record<string, Record<string, string>> = {};
    configs.forEach((config) => {
      const secretPath = this.getSecretPath(config);
      if (!secrets[secretPath]) {
        secrets[secretPath] = {};
      }
      if (!config.value) {
        return;
      }
      secrets[secretPath] = { ...secrets[secretPath], [config.key]: config.value };
    });

    const setConfigsPromises = Object.entries(secrets).map(async ([secretPath, secretData]) => {
      if (_.isEmpty(secretData)) {
        await this.client.delete(secretPath.replace('data', 'metadata'));
        return;
      }

      await this.client.post(secretPath, { data: secretData });
    });

    await Promise.all(setConfigsPromises);
  }
}
