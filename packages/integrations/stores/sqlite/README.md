@configu-integrations/sqlite

Integrates the Configu Orchestrator with [sqlite](https://www.sqlite.org/docs.html).

- Name: SQLite
- Category: Database

## Configuration

Configu needs to be authorized to access your SQLite database. Configu utilizes [TypeORM](https://typeorm.io) under the hood to establish a connection with the database using [data source options](https://typeorm.io/data-source-options#better-sqlite3-data-source-options) you need to supply.

## Usage

### `.configu` Store Declaration

```yaml
stores:
  my-store:
    type: sqlite
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
configu upsert --store "sqlite" --set "test" --schema "./start.cfgu.json" \
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

1. **database is locked**
   - **Solution**: Ensure that only one thread is writing to the database at a time. Use transactions to control access. Set the `PRAGMA busy_timeout` to make SQLite wait before throwing the error, e.g.
    ```sql
    PRAGMA busy_timeout = 3000;
    ```

2. **disk I/O error**
   - **Solution**: Ensure the disk isn’t full. Make sure SQLite has permission to read and write to the database file. Verify that the path to the database file is correct.

3. **database disk image is malformed**
   - **Solution**: Create a backup of the corrupted database file. Use the SQLite `.dump` command to export and re-import data
    ```sql
    sqlite3 corrupted.db ".dump" > backup.sql
    sqlite3 new.db < backup.sql
    ```

4. **no such table: table_name**
   - **Solution**: Check if the table exists in the database by running `.tables` in the SQLite CLI. Verify the correct database file is being accessed. Ensure the SQL code or migrations to create the table have been executed before trying to access it.

## References
- Integration documentation: https://www.sqlite.org/docs.html
