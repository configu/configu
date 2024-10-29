# @configu-integrations/xml-file
Integrates the Configu Orchestrator with XML file storage capabilities.
- Name: XML File
- Category: File System

## Configuration
The XmlFileConfigStore allows you to store your configuration in XML format. The store requires a file path where the XML configuration file will be stored and managed.

## Usage
### `.configu` store declaration
To use the `XmlFileConfigStore` with Configu, declare it in the `.configu` file as shown below:
```yaml
stores:
  my-store:
    type: xml-file
    configuration:
      path: "./config.xml"
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

### XML File Structure
The configuration is stored in an XML file with the following structure:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configurations>
    <config>
        <key>GREETING</key>
        <value>hello</value>
        <set>test</set>
    </config>
    <config>
        <key>SUBJECT</key>
        <value>configu</value>
        <set>test</set>
    </config>
</configurations>
```

## Common Errors and Solutions
1. **File Permission Issues**
   - **Solution:** Ensure that the application has read and write permissions for the specified XML file path. Check the file system permissions and adjust them if necessary.

2. **Invalid XML Format**
   - **Solution:** Verify that the XML file follows the correct structure. Use an XML validator to check for syntax errors if you manually edit the file.

3. **File Path Not Found**
   - **Solution:** Make sure the specified path exists and is accessible. Create any necessary parent directories before initializing the store.

4. **Encoding Issues**
   - **Solution:** Ensure the XML file is saved with UTF-8 encoding to support all characters properly. If you encounter encoding problems, check the file's encoding and convert it if necessary.

## Best Practices
1. **Backup Management**
   - Regularly backup your XML configuration file
   - Consider using version control for tracking changes

2. **File Organization**
   - Keep XML configuration files in a dedicated directory
   - Use meaningful file names that reflect the configuration purpose

3. **Access Control**
   - Implement appropriate file system permissions
   - Consider encrypting sensitive configuration values

## References
- XML specification: [W3C XML Documentation](https://www.w3.org/XML/)
- Configu documentation: [Configu Docs](https://configu.com/docs)
