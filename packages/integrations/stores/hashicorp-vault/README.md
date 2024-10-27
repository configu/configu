# @configu-integrations/hashi-corp-vault-config-store

Integrates the Configu Orchestrator with [HashiCorp Vault](https://www.vaultproject.io/), a secrets management tool for securely storing and accessing sensitive data.

- Name: HashiCorp Vault Config Store  
- Category: Secret Manager  

## Configuration

Configu connects to your HashiCorp Vault instance to manage secrets. You need to provide the Vault's address, authentication token, and optionally, specify the path to the secrets engine. Ensure that the token has the necessary read and write permissions.  

## Usage 

### `.configu` store declaration

```yaml
stores:
  my-vault-store:
    type: hashi-corp-vault
    configuration:
      address: http://127.0.0.1:8200
      token: <your-auth-token>
      path: secret/config # Optional, defaults to 'secret/'
      timeout: 5000 # Timeout in milliseconds
```

### CLI Examples

#### Upsert Command

```bash
configu upsert --store "my-vault-store" --set "test" --schema "./start.cfgu.json" \
    -c "DB_PASSWORD=securepassword" \
    -c "API_KEY=supersecretkey"
```

#### Eval and Export Commands

```bash
configu eval --store "my-vault-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common Errors and Solutions

1. Authentication Failure  
   - Solution: Ensure the provided `token` is valid and has sufficient permissions. Verify the token with:
     ```bash
     vault token lookup
     ```

2. Timeout Issues  
   - Solution: Increase the `timeout` value in the configuration if the Vault server takes longer to respond.

3. Path Not Found  
   - Solution: Ensure the provided `path` exists and the token has access to it. Use:
     ```bash
     vault list secret/
     ```

4. Certificate Errors in HTTPS Connections  
   - Solution: If using HTTPS, ensure that the correct CA certificates are configured. Use the `VAULT_CACERT` environment variable to specify the certificate path:
     ```bash
     export VAULT_CACERT=/path/to/ca.pem
     ```

## References

- Integration documentation: https://www.vaultproject.io/docs 
- CLI tool: https://developer.hashicorp.com/vault/docs/commands
