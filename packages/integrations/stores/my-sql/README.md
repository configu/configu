
# @configu-integrations/my-sql

Integrates the Configu MySQLConfigStore with [MySQL](https://www.mysql.com).

- Name: MySQL
- Category: Database

## Configuration

Configu needs to be authorized to access your MySQL database. Configu utilizes [TypeORM](https://typeorm.io) under the hood to establish a connection with the database using [data source options](https://typeorm.io/data-source-options#mysql--mariadb-data-source-options) you need to supply.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: my-sql
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

## Common Errors and Solutions

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

## References
- Integration documentation: https://dev.mysql.com/doc
- TypeORM documentation: https://typeorm.io
