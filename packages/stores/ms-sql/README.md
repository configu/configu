# @configu-integrations/ms-sql

Integrates the Configu Orchestrator with [Microsoft SQL Server](https://learn.microsoft.com/en-us/sql/sql-server).

- Name: Microsoft SQL Server
- Category: Database

## Configuration

Configu needs to be authorized to access your Microsoft SQL Server database. Configu utilizes [TypeORM](https://typeorm.io) under the hood to establish a connection with the database using [data source options](https://typeorm.io/data-source-options#mssql-data-source-options) you need to supply.

### `.configu` Store Declaration

```yaml
stores:
  my-store:
    type: ms-sql
    configuration:
      host: localhost
      username: test
      password: test
      database: test
```

### CLI Examples

### **CLI Examples**

#### **Upsert Command**

```bash
configu upsert --store "my-mssql-store" --set "test" --schema "./start.cfgu.json" \
    -c "API_URL=https://example.com" \
    -c "RETRY_LIMIT=5"
```

#### **Eval and Export Commands**

#### Upsert Command

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hey" \
    -c "SUBJECT=configu"
```

#### Eval and Export Commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common Errors and Solutions

## **Common Errors and Solutions**

1. **Connection Timeout Issues**
   - **Solution**: Verify that the host, port, and network configurations are correct. Increase `connectTimeout` in the configuration if needed.

2. **Authentication Failures**
   - **Solution**: Ensure the provided `username` and `password` are correct, and the user has access to the specified database. Use a SQL client to verify credentials.

3. **Encryption Errors**
   - **Solution**: If your SQL Server instance enforces encryption, ensure the `encrypt` option is set to `true`. If not, set it to `false`.

4. **Permission Issues**
   - **Solution**: Verify that the user has `READ` and `WRITE` access to the required database. Use the following SQL command to grant permissions:
     ```sql
     GRANT ALL PRIVILEGES ON DATABASE config_db TO [admin];
     ```

---

## **References**

- Integration documentation: [Microsoft SQL Server](https://learn.microsoft.com/en-us/sql/sql-server)
- TypeORM documentation: [MSSQL Data Source Options](https://typeorm.io/data-source-options#mssql-data-source-options)

---

1. Connection Issues
   - Solution: Verify that the host, port, and encryption settings are correct. Make sure the database server is reachable from your application.

2. Authentication Failures
   - Solution: Confirm the correctness of the provided `username` and `password`. Ensure the user has appropriate access to the specified database. You can verify credentials by logging in using an SQL client tool.

3. Encryption Configuration Problems
   - Solution: Check if the `encrypt` option is set correctly for your database setup. If SQL Server requires encrypted connections, ensure that encryption is enabled in the configuration.

4. Database Permissions Issues
   - Solution: Ensure the user has `READ` and `WRITE` access to the required table. Use the following SQL command to grant permissions:

   ```sql
   GRANT ALL ON config_store TO [your_user];
   ```

## References

- Integration documentation: https://learn.microsoft.com/en-us/sql/sql-server
- TypeORM documentation: https://typeorm.io
