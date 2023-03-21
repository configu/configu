from configu import Config


def test_config():
    obj = {k: k for k in ['key', 'set', 'value', '_id']}
    try:
        Config(*obj)
    except Exception as e:
        assert isinstance(e, TypeError) and "__init__() takes 4 positional arguments but" in str(e)

    try:
        Config(**obj)
    except Exception as e:
        assert isinstance(e, TypeError) and "__init__() got an unexpected keyword argument" in str(e)


def test_config_store_contents():
    obj = [{k: k for k in ['key', 'set']}]
