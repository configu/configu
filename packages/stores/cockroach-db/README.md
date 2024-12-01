# @configu/cockroach-db

Integrates the Configu Orchestrator with [CockroachDB](https://www.cockroachlabs.com/).

- Name: CockroachDB
- Category: Database

## Configuration

Configu needs to be authorized to access your CockroachDB database. Configu utilizes [TypeORM](https://typeorm.io) under the hood to establish a connection with the database using [data source options](https://typeorm.io/data-source-options#postgres--cockroachdb-data-source-options) you need to supply.

## Usage

### `.configu` store declaration

To use the `CockroachDBConfigStore` with Configu, declare it in the `.configu` file as shown below:

```yaml
stores:
  my-store:
    type: cockroach-db
    configuration:
      host: localhost
      username: test
      password: test
      database: test
```

### CLI Examples

#### Upsert command

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hello" \
    -c "SUBJECT=configu"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common Errors and Solutions

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

## References

- Integration documentation: [CockroachDB Documentation](https://www.cockroachlabs.com/docs/)
- TypeORM documentation: https://typeorm.io
