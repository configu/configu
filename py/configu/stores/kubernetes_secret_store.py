from kubernetes import client, config
import base64
import json
from .key_value_store import KeyValueConfigStore


class KubernetesSecretConfigStore(KeyValueConfigStore):
    """A `ConfigStore` persisted in Kubernetes Secrets"""

    _client: client.CoreV1Api
    _namespace: str

    def __init__(self, namespace: str, kubeconfig=None) -> None:
        """
        :param namespace: The namespace of your secrets
        :param kubeconfig: (Optional) Path to your kube-config file.
        """
        config.load_kube_config(kubeconfig)
        self._client = client.CoreV1Api()
        self._namespace = namespace
        super().__init__(type="kubernetes-secret")

    def get_by_key(self, key: str) -> str:
        response = self._client.read_namespaced_secret(key, self._namespace)
        response_dict = response.data
        response_dict = {
            k: base64.b64decode(v.encode("utf-8")).decode("utf-8")
            for k, v in response_dict.items()
        }
        return json.dumps(response_dict)

    def upsert(self, key: str, value: str):
        value_dict = json.loads(value)
        value_dict = {
            k: base64.b64encode(v.encode("utf-8")).decode("utf-8")
            for k, v in value_dict.items()
        }
        try:
            self._client.create_namespaced_secret(
                self._namespace,
                {
                    "metadata": {"name": key},
                    "data": value_dict,
                },
            )
        except (Exception,):
            self._client.patch_namespaced_secret(
                key,
                self._namespace,
                {
                    "data": value_dict,
                },
            )

    def delete(self, key: str):
        self._client.delete_namespaced_secret(key, self._namespace)
