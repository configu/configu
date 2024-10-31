# @configu-integrations/xml-file

Integrates the Configu Orchestrator with [XML files](https://www.w3.org/XML/).

- Name: XML File
- Category: File

## Configuration

Configu needs to be directed to your desired file by providing a file path via the `path` parameter.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: xml-file
    configuration:
      path: path/to/file.xml
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

## Common errors and solutions

1. File permission issues
   - Solution: Ensure that the application has read and write permissions for the specified XML file path. Check the file system permissions and adjust them if necessary.

2. Invalid XML format
   - Solution: Verify that the XML file follows the correct structure. Use an XML validator to check for syntax errors if you manually edit the file.

3. File path not found
   - Solution: Make sure the specified path exists and is accessible. Create any necessary parent directories before initializing the store.

4. Encoding issues
   - Solution: Ensure the XML file is saved with UTF-8 encoding to support all characters properly. If you encounter encoding problems, check the file's encoding and convert it if necessary.

## References
- Integration documentation: https://www.w3.org/XML
