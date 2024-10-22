# MySQLConfigStore

## Introduction

The **MySQLConfigStore** is a storage integration that allows users to store and retrieve configuration data from a MySQL database. It is part of the broader ConfigStore framework, designed to provide a centralized and consistent way to manage configurations for your applications.

This documentation provides a detailed guide on how to integrate and use the MySQLConfigStore with usage examples, connection options, and a breakdown of relevant parameters.

## Prerequisites

Before setting up the MySQLConfigStore, ensure that:
- You have a running MySQL instance.
- The `mysql` and `typeorm` packages are installed in your project for easy interaction with the MySQL database.
- You have set up your MySQL database credentials.

## Installation

You can install the required MySQL integration libraries by running:

```bash
npm install mysql2
npm install typeorm
```

## Configuration Options

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
| `charset`        | Charset used for the connection (default collation: `UTF8_GENERAL_CI`).                          | `utf8_general_ci`   |
| `timezone`       | Timezone used for typecasting server date/time values to JavaScript Date objects.                | `local`             |
| `connectTimeout` | Time (in ms) before connection timeout.                                                         | `10000`             |
| `acquireTimeout` | Time (in ms) before TCP connection timeout.                                                     | `10000`             |
| `insecureAuth`   | Allow the use of old, insecure authentication methods.                                           | `false`             |
| `supportBigNumbers` | Enable support for big numbers (BIGINT, DECIMAL) in the database.                             | `true`              |
| `bigNumberStrings`  | Return big numbers as JavaScript String objects.                                              | `true`              |
| `dateStrings`       | Return date types as strings instead of JavaScript Date objects.                              | `false`             |
| `debug`            | Enable protocol debugging. Can be `true/false` or an array of packet type names.               | `false`             |
| `trace`            | Enable stack trace generation on error for better debugging.                                   | `true`              |
| `multipleStatements`| Allow multiple MySQL statements per query (use with caution).                                | `false`             |
| `legacySpatialSupport` | Use legacy spatial functions like `GeomFromText` and `AsText` (removed in MySQL 8).         | `true`              |
| `flags`            | List of connection flags to use, or blacklist default ones.                                    | None                |
| `ssl`              | Object with SSL parameters or string containing SSL profile name.                              | None                |

## Usage

### Setting Up the MySQLConfigStore

To set up the MySQLConfigStore, define the connection parameters and integrate them with your application using the TypeORM configuration.

Example setup:

```typescript
import { DataSource } from "typeorm";

// MySQL Data Source Configuration
const dataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "password",
    database: "config_store",
    charset: "utf8_general_ci",
    timezone: "local",
    connectTimeout: 10000,
    acquireTimeout: 10000,
    insecureAuth: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    debug: false,
    trace: true,
    multipleStatements: false,
    legacySpatialSupport: true,
    flags: ["CLIENT_SSL"],
    ssl: {
        ca: "path/to/server-cert.pem",
        key: "path/to/client-key.pem",
        cert: "path/to/client-cert.pem"
    }
});
```

### Storing Configuration Data

To store configuration data in the ***MySQLConfigStore***, define the schema of your configuration table and use TypeORM to insert data.

Example schema:

```sql
CREATE TABLE IF NOT EXISTS config_store (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL,
    config_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

To insert data using ***TypeORM***:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
class ConfigStore {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    config_key: string;

    @Column()
    config_value: string;
}

// Example usage to store a configuration
const configRepo = dataSource.getRepository(ConfigStore);
await configRepo.save({ config_key: "api_url", config_value: "https://example.com/api" });
```

### Retrieving Configuration Data

Retrieve configuration data from the MySQLConfigStore by querying the table.

Example:

```typescript
const config = await configRepo.findOneBy({ config_key: "api_url" });
console.log(config.config_value); // Output: https://example.com/api
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
