# @configu-integrations/cloud-bees-config-store  

Integrates the Configu Orchestrator with [CloudBees](https://www.cloudbees.com/), offering secure and centralized configuration management for continuous integration (CI) and continuous delivery (CD) workflows.  

- Name: CloudBees Config Store  
- Category: CI/CD Configuration  

## Configuration  

The integration with CloudBees requires a secure connection to the CloudBees instance. Ensure that your application has the appropriate API tokens or access credentials to retrieve configurations from the CloudBees environment.  

## Usage

### `.configu` store declaration  

```yaml
stores:
  my-cloudbees-store:
    type: cloud-bees
    configuration:
      url: https://cloudbees-instance.com
      apiToken: <your-api-token>
      project: config-project
      environment: production
```

### CLI Examples  

#### Upsert Command  

```bash
configu upsert --store "my-cloudbees-store" --set "production" --schema "./config.cfgu.json" \
    -c "DATABASE_URL=postgres://user:password@host/db" \
    -c "API_KEY=xyz1234"
```

#### Eval and Export Commands  

```bash
configu eval --store "my-cloudbees-store" --set "production" --schema "./config.cfgu.json" \
 | configu export
```

## Common Errors and Solutions  

1. Invalid API Token  
   - Solution: Verify that the provided `apiToken` is valid and has access to the necessary resources. Regenerate the token if needed via the CloudBees dashboard.

2. Connection Timeout  
   - Solution: Check the `url` and ensure the CloudBees instance is accessible. Make sure there are no firewall or network restrictions blocking access.

3. Unauthorized Access  
   - Solution: Ensure that the API token or credentials have the necessary permissions for the specified project and environment. Update the permissions via the CloudBees admin console.

4. Configuration Not Found  
   - Solution: Verify that the correct `project` and `environment` names are provided in the store configuration. Check if the configuration exists in the CloudBees instance.

## References  

- CloudBees Documentation: https://www.cloudbees.com/documentation 
- CloudBees API Guide: https://docs.cloudbees.com/docs/cloudbees-cd/latest/rest-api 
