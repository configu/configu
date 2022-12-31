import json
from typing import List

from configu.types.generated import Config, ConfigStoreQuery
from .config_store import ConfigStore
from configu.utils import unique_by


class JsonFileStore(ConfigStore):
    def __init__(self, path: str):
        super(JsonFileStore, self).__init__("json-file")
        self.path = path

    def read(self) -> List[Config]:
        with open(self.path) as f:
            raw_content = f.read()
        return self.parse(raw_content)

    def write(self, next_configs: List[Config]):
        to_write = [c.to_dict() for c in next_configs]
        with open(self.path, "w") as f:
            json.dump(to_write, f, indent=2)

    def get(self, queries: List[ConfigStoreQuery]) -> List[Config]:
        stored_configs = self.read()

        def is_match_at_least_one_query(c: Config) -> bool:
            """
            :param c:
            :return: Checks if at least one query matches
            """
            return any(
                (
                    all(
                        [
                            (c.set == "*" or q.set == c.set),
                            (c.schema == "*" or q.schema == c.schema),
                            (c.key == "*" or q.key == c.key),
                        ]
                    )
                    for q in queries
                )
            )

        return [c for c in stored_configs if is_match_at_least_one_query(c)]

    def set(self, configs: List[Config]):
        stored_configs = self.read()

        all_configs: List[Config] = [*configs, *stored_configs]

        next_configs = unique_by(all_configs, lambda c: c.key)
        next_configs = [config for config in next_configs if config.value]

        self.write(next_configs)
