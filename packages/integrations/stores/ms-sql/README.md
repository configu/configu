# **@configu-integrations/mssql-config-store**

Integrates the Configu Orchestrator with [Microsoft SQL Server](https://learn.microsoft.com/en-us/sql/sql-server).  

- **Name**: Microsoft SQL Server  
- **Category**: Database  

---

## **Configuration**  

Configu utilizes [TypeORM](https://typeorm.io) under the hood to establish a connection with Microsoft SQL Server. You need to supply [MSSQL data source options](https://typeorm.io/data-source-options#mssql-data-source-options) to define the connection parameters such as host, port, username, password, and database name.

### **`.configu` Store Declaration**  

```yaml
stores:
  my-mssql-store:
    type: mssql
    configuration:
      host: localhost
      port: 1433
      username: admin
      password: adminpass
      database: config_db
      encrypt: true
```

---

### **CLI Examples**  

#### **Upsert Command**

```bash
configu upsert --store "my-mssql-store" --set "test" --schema "./start.cfgu.json" \
    -c "API_URL=https://example.com" \
    -c "RETRY_LIMIT=5"
```

#### **Eval and Export Commands**  

```bash
configu eval --store "my-mssql-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

---

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

