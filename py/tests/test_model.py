from configu import Config


def test_some_test():
    c = Config("g", "g", "b")
    c2 = Config("g", "g", "b")
    assert c == c2
