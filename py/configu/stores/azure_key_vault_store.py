from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential
from azure.core.credentials import TokenCredential
from .key_value_store import KeyValueConfigStore


class AzureKeyVaultConfigStore(KeyValueConfigStore):
    """A `ConfigStore` persisted in Azure Key Vault"""

    _client: SecretClient

    def __init__(
        self,
        vault_url: str,
        credentials: TokenCredential = DefaultAzureCredential(),
        **client_kwargs,
    ) -> None:
        """
        :param vault_url: URL of the vault
        :param credentials: A class capable of providing oauth credentials
          (defaults to DefaultAzureCredentials)
        :param kwargs: additional options passed directly to the Azure
          secrets client (see
          https://learn.microsoft.com/en-us/python/api/azure-keyvault-secrets/azure.keyvault.secrets.secretclient?view=azure-python)
        """
        super().__init__(type="azure-key-vault")
        self._client = SecretClient(vault_url, credentials, **client_kwargs)

    def get_by_key(self, key: str) -> str:
        return self._client.get_secret(key).value or ""

    def upsert(self, key: str, value: str):
        self._client.set_secret(key, value)

    def delete(self, key: str):
        self._client.begin_delete_secret(key)
