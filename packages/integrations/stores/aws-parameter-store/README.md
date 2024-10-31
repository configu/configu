# @configu-integrations/aws-parameter-store

Integrates the Configu Orchestrator with [AWS Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html).

- Name: AWS Parameter Store
- Category: Key-value store

## Configuration

Configu needs to be authorized to access your AWS Secrets Manager account. By default, Configu uses the standard authentication methods that the AWS SDKs use, if you have the right IAM access credentials, there's no special action to take. Otherwise, you need to supply [SSMClientConfig](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-ssm/Interface/SSMClientConfig/).

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: aws-parameter-store
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
    -c "GREETING=hello" \
    -c "SUBJECT=configu"
````

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
 ```

## References

- Integration documentation: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html
- Integration SDK documentation: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm
