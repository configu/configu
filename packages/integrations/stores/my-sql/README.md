
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

## Performance Optimization

### Connection Pooling Configuration
- Use TypeORM's built-in connection pool to manage multiple connections efficiently.
- Example:
  ```typescript
  const dataSource = new DataSource({
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "root",
      password: "password",
      database: "config_store",
      extra: {
          connectionLimit: 10,  // Set connection limit for pooling
      },
  });
  ```

### Query Optimization
- Use indexed columns for frequently queried keys in the config store to improve query performance.
- Example:
  ```sql
  CREATE INDEX idx_config_key ON config_store(config_key);
  ```

### Caching Strategies
- Implement a caching layer (e.g., Redis) to reduce database load for frequently accessed configurations.

## Migrations

### Handling Schema Changes
- Use TypeORM migrations to handle schema changes over time. Define your migrations and ensure they are applied when deploying your application.

### Version Control for Configurations
- Store configuration versions in your config store by adding a `version` column. This allows you to roll back to previous configurations if necessary.

### Database Migration Scripts
- Use `typeorm` CLI to generate and run migration scripts:
  ```bash
  typeorm migration:generate -n ConfigStoreMigration
  typeorm migration:run
  ```

## Monitoring and Maintenance

### Health Checks
- Implement regular health checks to ensure that the MySQL connection is alive. You can periodically run a simple query like `SELECT 1` to verify connectivity.

### Logging Strategies
- Enable query logging for troubleshooting purposes. TypeORM allows for logging of all executed queries:
  ```typescript
  const dataSource = new DataSource({
      logging: ["query", "error"],
  });
  ```

### Backup Procedures
- Regularly back up the MySQL database using tools like `mysqldump` to prevent data loss.
  ```bash
  mysqldump -u root -p config_store > backup.sql
  ```

### Monitoring Queries and Performance
- Use MySQL monitoring tools like `Percona Monitoring and Management` or `MySQL Workbench` to keep track of slow queries, resource usage, and performance bottlenecks.

---
### References
For further reference, consult:
- [MySQL Integration Docs](https://dev.mysql.com/doc)
- [TypeORM Data Source Options](https://typeorm.io/data-source-options#mysql--mariadb-data-source-optionsurl)
