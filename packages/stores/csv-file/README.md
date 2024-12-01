# @configu/csv-file

Integrates the Configu Orchestrator with [CSV files](https://en.wikipedia.org/wiki/Comma-separated_values).

- Name: CSV File
- Category: File

## Configuration

Configu needs to be directed to your desired file by providing a file path via the `path` parameter.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: csv-file
    configuration:
      path: path/to/file.csv
```

### CLI examples

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

## References

- Integration documentation: https://en.wikipedia.org/wiki/Comma-separated_values
