# @configu-integrations/mariadb

Integrates the Configu Orchestrator with a [MariaDB database](https://mariadb.org/).

- Name: MariaDB
- Category: Database

## Configuration
Configu needs to be authorized to access your MariaDB database. Configu utilizes [TypeORM](https://typeorm.io) under the hood to establish a connection with the database using [data source options](https://typeorm.io/data-source-options#mysql--mariadb-data-source-options) you need to supply.

## Usage
### `.configu` store declaration
```yaml
stores:
  my-store:
    type: mariadb
    configuration:
      host: localhost
      username: test
      password: test
      database: test
```

### CLI examples
#### Upsert command
```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hey" \
    -c "SUBJECT=configu"
```

#### Eval and export commands
```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common errors and solutions

1. Connection timeout troubleshooting
   - Solution: Increase the `connectTimeout` or `acquireTimeout` in the configuration options to handle long-running connection setups. Make sure the database is reachable from your application.

2. Authentication failures
   - Solution: Verify that the provided `username` and `password` are correct, and that the user has the necessary permissions to access the specified database. Use a MariaDB client to manually confirm the credentials.

3. SSL Certificate issues
   - Solution: Ensure the correct paths for SSL certificates are provided if `ssl` is enabled. Verify that the certificates match the MariaDB server's configuration.

4. Database permissions problems
   - Solution: Ensure that the database user has the required `READ` and `WRITE` permissions for the `config_store` table. Use the following SQL command to grant permissions:
   ```sql
   GRANT ALL PRIVILEGES ON config_store.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

## References
- Integration documentation: https://mariadb.org/documentation
- TypeORM documentation: https://typeorm.io
