# @configu-integrations/cockroachdb

Integrates the Configu Orchestrator with [CockroachDB](https://www.cockroachlabs.com/).

- Name: CockroachDB
- Category: Database

## Introduction

The **CockroachDBConfigStore** allows users to store and retrieve configuration data from a [CockroachDB database](https://www.cockroachlabs.com/). This integration is a part of the ConfigStore framework and provides a scalable, distributed configuration solution for applications that use CockroachDB.

## Configuration

To use `CockroachDBConfigStore`, define the connection configuration options necessary for connecting to your CockroachDB instance. The configuration options align with the requirements of the CockroachDB client library.

### CockroachDB Connection Configuration Parameters

| Parameter      | Description                                                                    | Default       |
|----------------|--------------------------------------------------------------------------------|---------------|
| `url`          | Connection URL for the CockroachDB server. Overrides other options.            | None          |
| `host`         | Database host.                                                                 | `localhost`   |
| `port`         | Database port.                                                                 | `26257`       |
| `username`     | Username for database authentication.                                          | None          |
| `password`     | Password for database authentication.                                          | None          |
| `database`     | Name of the database to connect to.                                            | None          |
| `schema`       | Schema name.                                                                   | public        |
| `ssl`          | Object with SSL parameters. Required for secure connections.                   | None          |
| `maxTransactionRetries`     | Password for database authentication.                             | 5             |
| `connectionTimeoutMS`       | Connection timeout in milliseconds.                               | undefinded    |

For additional configuration parameters, refer to the [CockroachDB documentation](https://www.cockroachlabs.com/docs/).

## Usage

### `.configu` store declaration

To use the `CockroachDBConfigStore` with Configu, declare it in the `.configu` file as shown below:

```yaml
stores:
  my-store:
    type: cockroachdb
    configuration:
      url: postgresql://<username>:<password>@<host>:<port>/<database>?sslmode=verify-full
      ssl:
        ca: <path-to-ca.crt>
        key: <path-to-client.key>
        cert: <path-to-client.crt>
```

### CLI Examples

#### Upsert command

To upsert configuration data into the CockroachDBConfigStore, use the following CLI command:

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hello" \
    -c "SUBJECT=configu cockroachdb store"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Error Handling

### Common Errors and Solutions

1. **Connection Timeout Troubleshooting**
   - **Solution:** Increase the `connectTimeout` or `acquireTimeout` in the configuration options to handle long-running connection setups. Ensure the database is accessible.

2. **Authentication Failures**
   - **Solution:** Verify the provided `username` and `password`, and confirm the user has access to the specified database. Use a CockroachDB client to check credentials.

3. **SSL Certificate Issues**
   - **Solution:** Ensure the correct SSL certificate paths are provided if `ssl` is enabled. Verify that the certificates match the CockroachDB server configuration.

4. **Database Permissions Issues**
   - **Solution:** Make sure the database user has `READ` and `WRITE` permissions for the specified table. Use the following SQL command to grant permissions:
   ```sql
   GRANT ALL ON TABLE config_store TO <username>;
   ```

## Example
Here's an example of how you can use the CockroachDBConfigStore with a Node.js application:

```javascript
const { CockroachDBConfigStore } = require('@configu-integrations/cockroachdb');

const store = new CockroachDBConfigStore({
  url: 'postgresql://username:password@localhost:26257/database?sslmode=verify-full',
  ssl: {
    ca: './ca.crt',
    key: './client.key',
    cert: './client.crt',
  },
  maxTransactionRetries: 5
});

const upsertConfig = async () => {
  try {
    await store.upsert('test', {
      GREETING: 'hey',
      SUBJECT: 'configu cockroachdb store'
    });
    console.log('Configuration data upserted successfully');
  } catch (error) {
    console.error('Error upserting configuration data:', error);
  }
};

upsertConfig();
```

## References
- Integration documentation: [CockroachDB Documentation](https://www.cockroachlabs.com/docs/)
- [TypeORM Connection Options](https://typeorm.io/#/connection-options)
