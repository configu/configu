# **@configu-integrations/mssql-config-store**

Integrates the Configu Orchestrator with [Microsoft SQL Server](https://learn.microsoft.com/en-us/sql/sql-server).  

- **Name**: Microsoft SQL Server  
- **Category**: Database  

---

## **Configuration**

Configu needs to be connected to your Microsoft SQL Server instance. It utilizes [TypeORM](https://typeorm.io) to manage connections and operations. Use the [MSSQL data source options](https://typeorm.io/data-source-options#mssql-data-source-options) to configure your store.

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
    -c "MAX_RETRIES=3"
```

#### **Eval and Export Commands**

```bash
configu eval --store "my-mssql-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

---

## **Common Errors and Solutions**

1. **Connection Issues**  
   - **Solution**: Verify that the host, port, and encryption settings are correct. Make sure the database server is reachable from your application.

2. **Authentication Failures**  
   - **Solution**: Confirm the correctness of the provided `username` and `password`. Ensure the user has appropriate access to the specified database. You can verify credentials by logging in using an SQL client tool.

3. **Encryption Configuration Problems**  
   - **Solution**: Check if the `encrypt` option is set correctly for your database setup. If SQL Server requires encrypted connections, ensure that encryption is enabled in the configuration.

4. **Database Permissions Issues**  
   - **Solution**: Ensure the user has `READ` and `WRITE` access to the required table. Use the following SQL command to grant permissions:
   
   ```sql
   GRANT ALL ON config_store TO [your_user];
   ```

---

## **References**

- Integration documentation: [Microsoft SQL Server](https://learn.microsoft.com/en-us/sql/sql-server)  
- TypeORM documentation: [MSSQL Data Source Options](https://typeorm.io/data-source-options#mssql-data-source-options)  

---