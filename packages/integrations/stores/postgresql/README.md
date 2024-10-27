# @configu-integrations/postgresql

Integrates the Configu Orchestrator with [PostgreSQL](https://www.postgresql.org).

- Name: PostgreSQL
- Category: Database

## Configuration

Configu needs to be authorized to access your PostgreSQL database. Configu utilizes [TypeORM](https://typeorm.io) under the hood to establish a connection with the database using [data source options](https://typeorm.io/data-source-options#postgres--cockroachdb-data-source-options) you need to supply.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: postgresql
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
    -c "SUBJECT=configu node.js sdk"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## References

- Integration documentation: https://www.postgresql.org/docs/current/tutorial-start.html
- TypeORM documentation: https://typeorm.io
