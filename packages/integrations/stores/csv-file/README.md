@configu-integrations/csv-file

Integrates the Configu Orchestrator with [csv-file](https://en.wikipedia.org/wiki/Comma-separated_values).

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

## **Common Errors and Solutions for CSV Files**

1. **Incorrect Delimiter**
   - **Solution**: Verify that the delimiter in the CSV file matches the one expected by the software reading it. For example, some CSV files use commas, while others might use semicolons. Specify the delimiter in your code if necessary, e.g., in Python:
     ```python
     import csv
     with open('file.csv', newline='') as csvfile:
         reader = csv.reader(csvfile, delimiter=',')  # Change ',' to ';' if needed
     ```

2. **Malformed CSV (e.g., uneven columns)**
   - **Solution**: Check if every row in the CSV file has the same number of columns. Manually inspect the file or use a tool to fix any uneven rows. In Python, you can handle uneven rows by using the `csv.reader` with error handling:
     ```python
     import csv
     with open('file.csv', newline='') as csvfile:
         reader = csv.reader(csvfile)
         for row in reader:
             try:
                 # Process row
                 print(row)
             except csv.Error as e:
                 print(f'Error processing row: {e}')
     ```

3. **Encoding Issues (e.g., UnicodeDecodeError)**
   - **Solution**: Specify the correct encoding when opening the file. If unsure, try using `utf-8` or `ISO-8859-1`:
     ```python
     with open('file.csv', encoding='utf-8') as csvfile:
         reader = csv.reader(csvfile)
     ```

4. **Large File Size (Memory Issues)**
   - **Solution**: Use a streaming approach to read the CSV file in chunks instead of loading it all at once. For instance, in Python, use `pandas` with `chunksize`:
     ```python
     import pandas as pd
     for chunk in pd.read_csv('file.csv', chunksize=1000):
         # Process chunk
         print(chunk)
     ```

5. **Extra or Missing Quotation Marks**
   - **Solution**: Open the CSV in a text editor or spreadsheet program to identify and correct mismatched quotes. When reading with code, handle quoting issues by specifying the `quotechar` and `escapechar`:
     ```python
     import csv
     with open('file.csv', newline='') as csvfile:
         reader = csv.reader(csvfile, quotechar='"', escapechar='\\')
     ```

6. **File Not Found**
   - **Solution**: Ensure the file path is correct. If the file is in a different directory, provide the full path or change the working directory. For example:
     ```python
     with open('/path/to/file.csv') as csvfile:
         reader = csv.reader(csvfile)
     ```

7. **Empty Rows or Extra Whitespace**
   - **Solution**: Skip empty rows and strip whitespace from fields when reading the CSV file. For example:
     ```python
     import csv
     with open('file.csv', newline='') as csvfile:
         reader = csv.reader(csvfile)
         for row in reader:
             row = [field.strip() for field in row if field]  # Remove empty fields
     ```

## References
- Integration documentation: https://docs.python.org/3/library/csv.html
- Other references: https://docs.fileformat.com/spreadsheet/csv/
