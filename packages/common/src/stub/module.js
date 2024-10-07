// import validator from 'validator';

// export const isInt = () => validator.isInt('2');

export const Dotenv = (configs, opts) => {
  return configs.map(({ key, value }) => `${key}="${value}"`).join('\n');
};

export class AWSParameterStoreConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class AzureKeyVaultConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class CsvFileConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class MSSQLConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class SQLiteConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}
