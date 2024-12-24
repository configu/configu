# @configu/aws-secrets-manager

Integrates the Configu Orchestrator with [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager).

- Name: AWS Secrets Manager
- Category: Secret manager

## Configuration

Configu needs to be authorized to access your AWS Secrets Manager account. By default, Configu uses the standard authentication methods that the AWS SDKs use, if you have the right IAM access credentials, there's no special action to take. Otherwise, you need to supply [SecretsManagerClient Configuration](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/secrets-manager/).

## Limitations

- A secret scheduled for deletion cannot be changed by the Configu Orchestrator. You will need to manually cancel the secret deletion.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: aws-secrets-manager
    configuration:
      credentials:
        accessKeyId: <access-key-id>
        secretAccessKey: <secret-access-key>
      region: us-east-1
```

### CLI examples

#### Upsert command

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hey" \
    -c "SUBJECT=configu node.js sdk"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Examples

Secrets list after upsert:
![image](https://raw.githubusercontent.com/configu/configu/refs/heads/main/docs/images/store-examples/aws-secrets-manger/secrets-list.png)

Values upserted to the `test` config set:
![image](https://raw.githubusercontent.com/configu/configu/refs/heads/main/docs/images/store-examples/aws-secrets-manger/upsert-result.png)

## References

- Integration documentation: https://docs.aws.amazon.com/secretsmanager
