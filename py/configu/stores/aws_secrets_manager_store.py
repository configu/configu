import boto3
from mypy_boto3_secretsmanager import SecretsManagerClient
from .key_value_store import KeyValueConfigStore


class AWSSecretsManagerConfigStore(KeyValueConfigStore):
    """A `ConfigStore` persisted in AWS Secrets Manager"""

    client: SecretsManagerClient

    def __init__(self) -> None:
        self.client = boto3.client("secretsmanager")
        super().__init__(type="aws-secrets-manager")

    def get_by_key(self, key: str) -> str:
        return self.client.get_secret_value(SecretId=key).get(
            "SecretString", ""
        )

    def upsert(self, key: str, value: str):
        try:
            self.client.update_secret(SecretId=key, SecretString=value)
        except Exception:
            self.client.create_secret(Name=key, SecretString=value)

    def delete(self, key: str):
        self.client.delete_secret(SecretId=key)
