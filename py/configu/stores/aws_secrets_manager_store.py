import boto3
from mypy_boto3_secretsmanager import SecretsManagerClient
from .key_value_store import KeyValueConfigStore


class AWSSecretsManagerConfigStore(KeyValueConfigStore):
    """A `ConfigStore` persisted in AWS Secrets Manager"""

    _client: SecretsManagerClient

    def __init__(self, **client_kwargs) -> None:
        super().__init__(type="aws-secrets-manager")
        self._client = boto3.client("secretsmanager", **client_kwargs)

    def get_by_key(self, key: str) -> str:
        return self._client.get_secret_value(SecretId=key).get("SecretString", "")

    def upsert(self, key: str, value: str):
        try:
            self._client.update_secret(SecretId=key, SecretString=value)
        except (Exception,):
            self._client.create_secret(Name=key, SecretString=value)

    def delete(self, key: str):
        self._client.delete_secret(SecretId=key)
