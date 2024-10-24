
# @configu-integrations/my-sql

Integrates the Configu MySQLConfigStore with [MySQL](https://www.mysql.com).

- Name: MySQL
- Category: Database

## Introduction

The **MySQLConfigStore** is a storage integration that allows users to store and retrieve configuration data from a [MySQL database](https://www.mysql.com). It is part of the broader ConfigStore framework, designed to provide a centralized and consistent way to manage configurations for your applications.

This documentation provides a detailed guide on how to integrate and use the MySQLConfigStore with usage examples, connection options, and a breakdown of relevant parameters.


## Configuration

To use MySQLConfigStore, several configuration options must be defined. The connection options to the MySQL database are managed through TypeORM’s Data Source options.

### MySQL Connection Configuration Parameters

| Parameter        | Description                                                                                     | Default             |
|------------------|-------------------------------------------------------------------------------------------------|---------------------|
| `url`            | Connection URL for the MySQL server. Overrides other options.                                    | None                |
| `host`           | Database host.                                                                                  | `localhost`         |
| `port`           | Database port.                                                                                  | `3306`              |
| `username`       | Username for database authentication.                                                           | None                |
| `password`       | Password for database authentication.                                                           | None                |
| `database`       | Name of the database to connect to.                                                             | None                |

For additional parameters, refer to the [TypeORM documentation](https://typeorm.io/#/connection-options). 

## Usage

### `.configu` store declaration

To use the MySQLConfigStore with Configu, declare it in the `.configu` file as shown below:

```yaml
stores:
  my-store:
    type: my-sql
    configuration:
      url: mysql://<username>:<password>@<host>:<port>/<database>
      ssl:
        ca: <path-to-server-cert.pem>
        key: <path-to-client-key.pem>
        cert: <path-to-client-cert.pem>
```

### CLI examples

#### Upsert command

To upsert configuration data into the MySQLConfigStore, use the following CLI command:

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hey" \
    -c "SUBJECT=configu mysql store"
``` 

## Error Handling

### Common Errors and Solutions

1. **Connection Timeout Troubleshooting**
   - **Solution:** Increase the `connectTimeout` or `acquireTimeout` in the configuration options to handle long-running connection setups. Make sure the database is reachable from your application.

2. **Authentication Failures**
   - **Solution:** Verify that the provided `username` and `password` are correct, and that the user has the necessary permissions to access the specified database. Use a MySQL client to manually confirm the credentials.

3. **SSL Certificate Issues**
   - **Solution:** Ensure the correct paths for SSL certificates are provided if `ssl` is enabled. Verify that the certificates match the MySQL server's configuration.

4. **Database Permissions Problems**
   - **Solution:** Ensure that the database user has the required `READ` and `WRITE` permissions for the `config_store` table. Use the following SQL command to grant permissions:
   ```sql
   GRANT ALL PRIVILEGES ON config_store.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
## Example
Here's an example of how you can use the MySQLConfigStore with a Node.js application:

```javascript
const { MySQLConfigStore } = require('@configu-integrations/my-sql');

const store = new MySQLConfigStore({
  url: 'mysql://username:password@localhost:3306/database',
  ssl: {
    ca: './server-cert.pem',
    key: './client-key.pem',
    cert: './client-cert.pem',
  },
});

const upsertConfig = async () => {
  try {
    await store.upsert('test', {
      GREETING: 'hey',
      SUBJECT: 'configu mysql store',
    });
    console.log('Configuration data upserted successfully');
  } catch (error) {
    console.error('Error upserting configuration data:', error);
  }
};

upsertConfig();
```

## References
For further reference, consult:
- [MySQL Integration Docs](https://dev.mysql.com/doc)
- [TypeORM Data Source Options](https://typeorm.io/data-source-options#mysql--mariadb-data-source-optionsurl)
