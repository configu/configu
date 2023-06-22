import configu

if __name__ == "__main__":
    config_store = configu.InMemoryConfigStore()
    test_set = configu.ConfigSet("test")
    schema = configu.ConfigSchema("get-started.cfgu.json")

    configu.UpsertCommand(
        {
            "store": config_store,
            "set": test_set,
            "schema": schema,
            "configs": {"GREETING": "hey", "SUBJECT": "configu python sdk"},
        }
    ).run()

    data = configu.EvalCommand(
        {
            "store": config_store,
            "set": test_set,
            "schema": schema,
        }
    ).run()

    configuration_data = configu.ExportCommand(
        {
            "data": data,
        }
    ).run()

    print(configuration_data)
    # {'GREETING': 'hey', 'SUBJECT': 'configu python sdk', 'MESSAGE': 'hey, configu python sdk!'}
