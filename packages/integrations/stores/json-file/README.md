# @configu-integrations/json-file

Integrates the Configu Orchestrator with [JSON files](https://en.wikipedia.org/wiki/Comma-separated_values).

- Name: JSON File
- Category: File

## Configuration

Configu needs to be directed to your desired file by providing a file path via the `path` parameter.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: json-file
    configuration:
      path: path/to/file.json
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

## Common Errors and Solutions for JSON Files

1. **File Permission Issues**
   - **Solution**: Ensure that the application has read and write permissions for the specified JSON file path. Check the file system permissions and adjust them if necessary.

2. **Invalid JSON Format**
   - **Solution**: Verify that the JSON file follows the correct syntax. Use a JSON validator or parser to check for errors if you manually edit the file.

3. **File Path Not Found**
   - **Solution**: Make sure the specified path exists and is accessible. Create any necessary parent directories before attempting to read or write the JSON file.

4. **Encoding Issues**
   - **Solution**: Ensure the JSON file is saved with UTF-8 encoding to support all characters properly. If you encounter encoding problems, check the file's encoding and convert it if necessary.


## References
- Integration documentation: https://www.json.org/json-en.html
