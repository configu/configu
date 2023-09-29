import os
import json
import requests
from .key_value_store import KeyValueConfigStore


class HashicorpVaultConfigStore(KeyValueConfigStore):
    """A `ConfigStore` persisted in Hashicorp Vault"""

    def __init__(
        self,
        engine,
        address=os.environ.get("VAULT_ADDR"),
        token=os.environ.get("VAULT_TOKEN"),
    ):
        """
        :param engine: The secrets engine to use
        :param address: The vault address (defaults to VAULT_ADDR environment
            variable)
        :param token: The vault token (defaults to VAULT_TOKEN environment
            variable)
        """
        self.engine = engine
        self.address = address
        self.token = token
        super().__init__(type="hashicorp-vault")

    def _format_key(self, key: str) -> str:
        return f"{self.engine}/data/{key}"

    def get_by_key(self, key: str) -> str:
        return requests.get(
            f"{self.address}/v1/{self._format_key(key)}",
            headers={
                "X-Vault-Token": self.token,
            },
        ).json()

    def delete(self, key: str):
        metadata_key = self._format_key(key).replace("data", "metadata", 1)
        requests.delete(
            f"{self.address}/v1/{metadata_key}",
            headers={
                "X-Vault-Token": self.token,
            },
        )

    def upsert(self, key: str, value):
        # Ensure the key is a string
        if not isinstance(key, str):
            raise ValueError("Key must be a string")
        
        # Check if the value is a string, and if so, store it as an object
        if isinstance(value, str):
            value = {"data": value}
        elif not isinstance(value, dict):
            raise ValueError("Value must be a string or a dictionary")

        requests.post(
            f"{self.address}/v1/{self._format_key(key)}",
            headers={
                "X-Vault-Token": self.token,
            },
            json=value, # Use data instead of json parameter
        )



