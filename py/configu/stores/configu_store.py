from dataclasses import dataclass
from typing import Dict, List

import pyvalidator
import requests
from requests.auth import AuthBase

from ..core import Config, ConfigStore, ConfigStoreQuery


@dataclass
class ConfiguStoreCredentials:
    org: str
    token: str


class BearerAuth(AuthBase):
    def __init__(self, token):
        self.token = token

    def __call__(self, r):
        r.headers["authorization"] = "Bearer " + self.token
        return r


class TokenAuth(AuthBase):
    def __init__(self, token):
        self.token = token

    def __call__(self, r):
        r.headers["token"] = self.token
        return r


class ConfiguConfigStore(ConfigStore):
    """A `ConfigStore` persisted by Configu (https://app.configu.com)"""

    _headers: Dict[str, str]
    _auth: AuthBase
    _url: str

    def __init__(
        self,
        credentials: ConfiguStoreCredentials,
        *,
        endpoint: str = "https://api.configu.com",
        source: str = "sdk",
    ) -> None:
        super().__init__(type="configu")
        self._headers = {
            "Org": credentials.org,
            "Source": source,
        }
        token = credentials.token
        self._auth = (
            BearerAuth(token) if pyvalidator.is_jwt(token) else TokenAuth(token)
        )
        self._url = f"{endpoint}/config"

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        queries_json = {"queries": [query.to_dict() for query in queries]}
        response = requests.post(
            url=self._url,
            headers=self._headers,
            auth=self._auth,
            json=queries_json,
        )
        response.raise_for_status()
        return [Config(**args) for args in response.json()]

    def set(self, configs: List[Config]) -> None:
        configs_json = {"configs": [config.to_dict() for config in configs]}
        response = requests.put(
            url=self._url,
            headers=self._headers,
            auth=self._auth,
            json=configs_json,
        )
        response.raise_for_status()
