# @configu/gcp-secret-manager

Integrates the Configu Orchestrator with [Google Cloud Secret Manager](https://cloud.google.com/secret-manager).

- Name: GCP Secret Manager
- Category: Secret manager

## Configuration

Configu needs to be authorized to access your GCP Secret manager account. By default, Configu uses the [standard authentication methods](https://cloud.google.com/docs/authentication/application-default-credentials) that the GCP SDKs use, if you have the right IAM access credentials, you only need to provide the `projectId` parameter.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: gcp-secret-manager
    configuration:
      projectId: my-gcp-project
      keyFile: path/to/service-account.json
```

### CLI examples

#### Upsert command

```bash
configu upsert --store "my-store" --set "test" --schema "./config.cfgu.json" \
    -c "GREETING=hey" \
    -c "SUBJECT=configu"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./config.cfgu.json" \
 | configu export
```

## Common errors and solutions

1. Authentication error

   - Solution: Ensure the `credentials` file points to a valid service account JSON key, or verify that your environment is authenticated with GCP using:
     ```bash
     gcloud auth application-default login
     ```

2. Insufficient permissions

   - Solution: Grant the necessary permissions to the service account by assigning the `Secret Manager Admin` role:
     ```bash
     gcloud projects add-iam-policy-binding my-gcp-project \
         --member="serviceAccount:my-service-account@my-gcp-project.iam.gserviceaccount.com" \
         --role="roles/secretmanager.admin"
     ```

3. Secret not found

   - Solution: Ensure the secret exists in the GCP Secret Manager and that the correct `projectId` is provided in the configuration.

4. Quota limit exceeded
   - Solution: Check your GCP quotas and upgrade if necessary. Manage the number of secrets to stay within allowed limits.

## References

- Integration Documentation: https://cloud.google.com/secret-manager/docs
