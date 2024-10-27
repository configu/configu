# **@configu-integrations/cloudbees-config-store**

Integrates the Configu Orchestrator with [CloudBees Configuration Management](https://www.cloudbees.com/).  

- **Name**: CloudBees Configuration Store  
- **Category**: Configuration Management  

---

## **Configuration**

Configu interacts with the CloudBees API to fetch and manage configuration values. You must provide the necessary authentication credentials and specify the CloudBees server details. API tokens or service accounts are typically used for secure access.

### **`.configu` Store Declaration**

```yaml
stores:
  my-cloudbees-store:
    type: cloudbees
    configuration:
      serverUrl: https://cloudbees.example.com
      apiToken: <your-api-token>
      project: my-project
```

---

### **CLI Examples**

#### **Upsert Command**

```bash
configu upsert --store "my-cloudbees-store" --set "test" --schema "./start.cfgu.json" \
    -c "DATABASE_URL=jdbc:mysql://localhost:3306/mydb" \
    -c "LOG_LEVEL=debug"
```

#### **Eval and Export Commands**

```bash
configu eval --store "my-cloudbees-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

---

## **Common Errors and Solutions**

1. **Invalid API Token**  
   - **Solution**: Ensure the `apiToken` is valid and has sufficient permissions. Regenerate the token if necessary from the CloudBees dashboard.

2. **Unauthorized Access**  
   - **Solution**: Verify that the provided token or service account has access to the specified project and required resources.

3. **Server Connectivity Issues**  
   - **Solution**: Check if the `serverUrl` is correct and reachable from your environment. Use:
     ```bash
     curl -I https://cloudbees.example.com
     ```

4. **Project Not Found**  
   - **Solution**: Make sure the `project` specified exists. Use the CloudBees UI or API to confirm the project name.

---

## **References**

- Integration documentation: [CloudBees Configuration Management](https://www.cloudbees.com/)  
- API documentation: [CloudBees API Reference](https://docs.cloudbees.com/)  

---
