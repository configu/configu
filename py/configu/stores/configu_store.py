from typing import List, Union, Dict

import pyvalidator
import requests
from pydantic import BaseModel
from requests.auth import AuthBase

from ..core import ConfigStore, ConfigStoreQuery, Config


class ConfiguStoreCredentialsConfiguration(BaseModel):
    org: str
    token: str


class ConfiguStoreConfiguration(BaseModel):
    credentials: ConfiguStoreCredentialsConfiguration
    endpoint: str = "https://api.configu.com"
    source: str = "sdk"


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


class ConfiguStore(ConfigStore):
    _headers: Dict
    _auth: AuthBase
    _url: str

    def __init__(
        self, store_config: Union[ConfiguStoreConfiguration, dict]
    ) -> None:
        super().__init__(type="configu")
        if isinstance(store_config, dict):
            store_config = ConfiguStoreConfiguration.parse_obj(store_config)
            print(store_config)
        self._headers = {
            "Org": store_config.credentials.org,
            "Source": store_config.source,
        }
        token = store_config.credentials.token
        self._auth = (
            BearerAuth(token)
            if pyvalidator.is_jwt(token)
            else TokenAuth(token)
        )
        self._url = f"{store_config.endpoint}/config"

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        queries_json = {"queries": [query.to_dict() for query in queries]}
        response = requests.post(
            url=self._url,
            headers=self._headers,
            auth=self._auth,
            json=queries_json,
        )
        response.raise_for_status()
        print([Config(**args) for args in response.json()])
        return [Config(**args) for args in response.json()]

    def set(self, configs: List[Union[Config, dict]]) -> None:
        configs = [
            Config(**config) if isinstance(config, dict) else config
            for config in configs
        ]
        configs_json = {"configs": [config.to_dict() for config in configs]}
        response = requests.put(
            url=self._url,
            headers=self._headers,
            auth=self._auth,
            json=configs_json,
        )
        response.raise_for_status()
