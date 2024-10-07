// import validator from 'validator';

// export const isInt = () => validator.isInt('2');

export const Dotenv = (configs, opts) => {
  return configs.map(({ key, value }) => `${key}="${value}"`).join('\n');
};

export class AWSParameterStoreConfigStore {
  type = 'aws-parameter';
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class AzureKeyVaultConfigStore {
  type = 'azure-key-vault';

  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class CsvFileConfigStore {
  type = 'csv-file';
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class MSSQLConfigStore {
  type = 'mssql';
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}

export class SQLiteConfigStore {
  type = 'sqlite';
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}
