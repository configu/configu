import configu

if __name__ == "__main__":
    store = configu.InMemoryStore()
    schema = configu.ConfigSchema("get-started.cfgu.json")
    config_set = configu.ConfigSet("development")
    greeting = configu.Config("GREETING", config_set.path, "hello")
    subject = configu.Config("SUBJECT", config_set.path, "world")
    store.set([greeting, subject])
    result = configu.EvalCommand(
        {
            "from": [
                {"store": store, "set": config_set, "schema": schema},
            ]
        }
    ).run()
    print(result.result.get("MESSAGE"))
