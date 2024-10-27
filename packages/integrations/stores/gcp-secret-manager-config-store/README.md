# @configu-integrations/gcp-secret-manager-config-store

Integrates the Configu Orchestrator with [Google Cloud Secret Manager](https://cloud.google.com/secret-manager), enabling secure management and access to sensitive configurations.

- Name: GCP Secret Manager  
- Category: Secret Manager  

## Configuration

Configu uses Google Cloud Secret Manager to securely manage configuration secrets. The integration requires appropriate access to your GCP project with the necessary permissions to read, write, and manage secrets.

Ensure that your application is authenticated using [GCP's standard authentication methods](https://cloud.google.com/docs/authentication), such as a service account JSON key or a workload identity.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-gcp-secret-store:
    type: gcp-secret-manager
    configuration:
      projectId: my-gcp-project
      credentials: ./gcp-service-account.json # Optional: Path to service account key file
```

### CLI Examples

#### Upsert Command

```bash
configu upsert --store "my-gcp-secret-store" --set "production" --schema "./config.cfgu.json" \
    -c "DATABASE_URL=postgres://user:password@host/db" \
    -c "API_KEY=abcd1234"
```

#### Eval and Export Commands

```bash
configu eval --store "my-gcp-secret-store" --set "production" --schema "./config.cfgu.json" \
 | configu export
```

## Common Errors and Solutions

1. Authentication Error  
   - Solution: Ensure the `credentials` file points to a valid service account JSON key, or verify that your environment is authenticated with GCP using:
     ```bash
     gcloud auth application-default login
     ```

2. Insufficient Permissions  
   - Solution: Grant the necessary permissions to the service account by assigning the `Secret Manager Admin` role:
     ```bash
     gcloud projects add-iam-policy-binding my-gcp-project \
         --member="serviceAccount:my-service-account@my-gcp-project.iam.gserviceaccount.com" \
         --role="roles/secretmanager.admin"
     ```

3. Secret Not Found  
   - Solution: Ensure the secret exists in the GCP Secret Manager and that the correct `projectId` is provided in the configuration.

4. Quota Limit Exceeded  
   - Solution: Check your GCP quotas and upgrade if necessary. Manage the number of secrets to stay within allowed limits.

## References

- GCP Secret Manager Documentation: https://cloud.google.com/secret-manager/docs
- GCP Authentication Guide: https://cloud.google.com/docs/authentication
