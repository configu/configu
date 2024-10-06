import { ConfigStore } from '@configu/sdk';
// import validator from 'validator';

// export const isInt = () => validator.isInt('2');

export const Dotenv = (configs, opts) => {
  return configs.map(({ key, value }) => `${key}="${value}"`).join('\n');
};

export class AWSParameterStoreConfigStore extends ConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class AzureKeyVaultConfigStore extends ConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class CsvFileConfigStore extends ConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class MSSQLConfigStore extends ConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class SQLiteConfigStore extends ConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}
