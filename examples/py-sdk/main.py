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
    eval_result = configu.EvalCommand(
        {
            "store": store,
            "set": config_set,
            "schema": schema,
        }
    ).run()
    export_result = configu.ExportCommand({"data": eval_result}).run()
    print(export_result)
    """"{'GREETING': 'hello', 'SUBJECT': 'larry', 'MESSAGE': 'hello, world!'}"""
