import _, { Dictionary } from 'lodash';
import inquirer from 'inquirer';
import fuzzy from 'fuzzy';
import { CS, ConfigStore } from '@configu/ts';
import { StoreType, STORE_CONFIGURATION, STORE_LABEL } from '@configu/lib';
import {
  NoopStore,
  InMemoryStore,
  ConfiguStore,
  AwsSecretsManagerStore,
  AzureKeyVaultStore,
  CockroachDBStore,
  GcpSecretManagerStore,
  HashiCorpVaultStore,
  JsonFileStore,
  KubernetesSecretStore,
  MariaDBStore,
  MSSQLStore,
  MySQLStore,
  PostgreSQLStore,
  SQLiteStore,
} from '@configu/node';
import { defaultInteractiveSession } from './default';
import { configuInteractiveSession } from './Configu';

const TYPE_TO_STORE: Record<StoreType, (configuration: Dictionary<string>) => ConfigStore> = {
  noop: () => new NoopStore(),
  'in-memory': () => new InMemoryStore(),
  configu: ({ org, token, type, endpoint }) => {
    if (type !== 'Token' && type !== 'Bearer') {
      throw new Error(`invalid type, can be either "Token" or "Bearer"`);
    }
    return new ConfiguStore({
      credentials: { org, token, type },
      source: 'cli',
      endpoint,
    });
  },
  'json-file': ({ path }) => new JsonFileStore(path),
  'hashicorp-vault': ({ token, address }) => new HashiCorpVaultStore({ token, address, engine: '' }),
  'aws-secrets-manager': ({ accessKeyId, secretAccessKey, region, endpoint }) =>
    new AwsSecretsManagerStore({
      credentials: { accessKeyId, secretAccessKey },
      region,
      endpoint,
    }),
  'azure-key-vault': ({ clientId, clientSecret, tenantId, vaultUrl }) =>
    new AzureKeyVaultStore({ credentials: { clientId, clientSecret, tenantId }, vaultUrl }),
  'gcp-secret-manager': ({ keyFile, projectId }) => new GcpSecretManagerStore({ keyFile, projectId }),
  'kubernetes-secret': ({ kubeconfig, namespace }) =>
    new KubernetesSecretStore({ kubeconfigFilePath: kubeconfig, namespace }),
  sqlite: ({ database }) => new SQLiteStore({ database }),
  mysql: ({ url }) => new MySQLStore({ url }),
  mariadb: ({ url }) => new MariaDBStore({ url }),
  postgres: ({ url }) => new PostgreSQLStore({ url }),
  cockroachdb: ({ url }) => new CockroachDBStore({ url }),
  mssql: ({ url }) => new MSSQLStore({ url }),
};

const TYPE_TO_INTERACTIVE: Record<StoreType, () => Promise<Dictionary<string>>> = {
  noop: () => defaultInteractiveSession('noop'),
  'in-memory': () => defaultInteractiveSession('in-memory'),
  configu: () => configuInteractiveSession(),
  'json-file': () => defaultInteractiveSession('json-file'),
  'hashicorp-vault': () => defaultInteractiveSession('hashicorp-vault'),
  'aws-secrets-manager': () => defaultInteractiveSession('aws-secrets-manager'),
  'azure-key-vault': () => defaultInteractiveSession('azure-key-vault'),
  'gcp-secret-manager': () => defaultInteractiveSession('gcp-secret-manager'),
  'kubernetes-secret': () => defaultInteractiveSession('kubernetes-secret'),
  sqlite: () => defaultInteractiveSession('sqlite'),
  mysql: () => defaultInteractiveSession('mysql'),
  mariadb: () => defaultInteractiveSession('mariadb'),
  postgres: () => defaultInteractiveSession('postgres'),
  cockroachdb: () => defaultInteractiveSession('cockroachdb'),
  mssql: () => defaultInteractiveSession('mssql'),
};

type ConstructStoreReturnType = {
  type: StoreType;
  connectionString: string;
  store: ConfigStore;
};

export const constructStoreFromConnectionString = (storeConnectionString: string): ConstructStoreReturnType => {
  const parsedCS = CS.parse(storeConnectionString);
  const { store, ...restConfiguration } = parsedCS;

  if (typeof store !== 'string') {
    throw new Error('invalid store connection string');
  }

  const storeConfigurationDefinition = STORE_CONFIGURATION[store];
  const constructStoreFunction = TYPE_TO_STORE[store];
  if (!storeConfigurationDefinition || !constructStoreFunction) {
    throw new Error(`unknown store type ${store}`);
  }

  const storeConfiguration = _(storeConfigurationDefinition)
    .mapValues((settings, key) => {
      const valueFromEnv = settings.env ? process.env[settings.env] : undefined;
      const valueFromCS = restConfiguration?.[key];
      const value = valueFromCS ?? valueFromEnv;
      if (settings.required && !value) {
        throw new Error(`${key} is missing for ${store} store`);
      }
      return value;
    })
    .omitBy(_.isNil)
    .value() as Dictionary<string>;

  return {
    type: store,
    connectionString: CS.serialize({ store, ...storeConfiguration }),
    store: constructStoreFunction(storeConfiguration),
  };
};

const storeChoices = _(STORE_LABEL).omit(['noop', 'in-memory']).values().value();
export const constructStoreFromInteractiveSession = async (): Promise<ConstructStoreReturnType> => {
  const { storeLabel } = await inquirer.prompt<{ storeLabel: string }>([
    {
      type: 'autocomplete',
      name: 'storeLabel',
      message: 'Select store type',
      // * source: https://github.com/mokkabonna/inquirer-autocomplete-prompt/blob/master/example.js#L87
      source: (answers: never, input = '') => fuzzy.filter(input, storeChoices).map((res) => res.original),
    },
  ]);

  const store = _(STORE_LABEL).invert().get(storeLabel);
  const storeConfigurationDefinition = STORE_CONFIGURATION[store];
  const constructStoreFunction = TYPE_TO_STORE[store];
  const interactiveSessionFunction = TYPE_TO_INTERACTIVE[store];
  if (!storeConfigurationDefinition || !constructStoreFunction || !interactiveSessionFunction) {
    throw new Error(`unknown store type ${store}`);
  }

  const storeConfiguration = await interactiveSessionFunction();
  // console.log(storeConfiguration);

  return {
    type: store,
    connectionString: CS.serialize({ store, ...storeConfiguration }),
    store: constructStoreFunction(storeConfiguration),
  };
};
