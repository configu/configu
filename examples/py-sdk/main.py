import configu

if __name__ == "__main__":
    store = configu.InMemoryConfigStore()
    schema = configu.ConfigSchema("get-started.cfgu.json")
    config_set = configu.ConfigSet("development")
    configu.UpsertCommand(
        {
            "store": store,
            "set": config_set,
            "schema": schema,
            "configs": {"GREETING": "hello", "SUBJECT": "world"},
        }
    ).run()
    result = configu.EvalCommand(
        {
            "store": store,
            "set": config_set,
            "schema": schema,
        }
    ).run()
    print(result)
