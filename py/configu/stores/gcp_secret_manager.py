from .key_value_store import KeyValueConfigStore
from google.cloud.secretmanager import SecretManagerServiceClient


class GCPSecretManagerConfigStore(KeyValueConfigStore):
    """A `ConfigStore` persisted in GCP Secret Manager"""

    _client: SecretManagerServiceClient
    _project_id: str

    def __init__(self, project_id: str) -> None:
        self._client = SecretManagerServiceClient()
        self._project_id = project_id
        super().__init__(type="gcp-secret-manager")

    def _format_key(self, key: str) -> str:
        return f"projects/{self._project_id}/secrets/{key}"

    def get_by_key(self, key: str) -> str:
        response = self._client.access_secret_version(
            name=f"{self._format_key(key)}/versions/latest"
        )
        return response.payload.data.decode("utf-8")

    def _add_secret_version(self, secret_id: str, secret_data: str):
        self._client.add_secret_version(
            parent=secret_id,
            payload={
                "data": secret_data.encode("utf-8"),
            },
        )

    def upsert(self, key: str, value: str):
        formatted_key = self._format_key(key)
        self._client.create_secret(
            parent=f"projects/{self._project_id}",
            secret_id=key,
            secret={
                "replication": {
                    "automatic": {},
                },
            },
        )
        self._add_secret_version(formatted_key, value)

    def delete(self, key: str):
        self._client.delete_secret(name=self._format_key(key))
