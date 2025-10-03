# @configu-integrations/sqlite

Integrates the Configu Orchestrator with [SQLite](https://www.sqlite.org/docs.html).

- Name: SQLite
- Category: Database

## Configuration

Configu needs to be authorized to access your SQLite database. Configu utilizes [TypeORM](https://typeorm.io) under the hood to establish a connection with the database using [data source options](https://typeorm.io/data-source-options#better-sqlite3-data-source-options) you need to supply.

## Usage

### `.configu` store declaration

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

1. Database is locked
   - Solution: Ensure that only one thread is writing to the database at a time. Use transactions to control access. Set the `PRAGMA busy_timeout` to make SQLite wait before throwing the error, e.g.

   ```sql
   PRAGMA busy_timeout = 3000;
   ```

2. Disk I/O error
   - Solution: Ensure the disk isn’t full. Make sure SQLite has permission to read and write to the database file. Verify that the path to the database file is correct.

3. Database disk image is malformed
   - Solution: Create a backup of the corrupted database file. Use the SQLite `.dump` command to export and re-import data

   ```sql
   sqlite3 corrupted.db ".dump" > backup.sql
   sqlite3 new.db < backup.sql
   ```

4. No such table: table_name
   - Solution: Check if the table exists in the database by running `.tables` in the SQLite CLI. Verify the correct database file is being accessed. Ensure the SQL code or migrations to create the table have been executed before trying to access it.

## References

- Integration documentation: https://www.sqlite.org/docs.html
- TypeORM documentation: https://typeorm.io
