from configu import ConfigSet
import pytest


@pytest.mark.parametrize("path", (
  None,
  "",
  "foo",
  "foo/bar",
  "foo-bar",
  "foo_bar",
  "/foo",
))
def test_valid_paths(path):
  ConfigSet(path)

@pytest.mark.parametrize("path", (
  "foo/",
  "foo/bar/",
  "foo.bar",
  "foo$bar",
  "this",
  "cfgu",
  "-",
  "_",
))
def test_invalid_paths(path):
  with pytest.raises(ValueError):
    ConfigSet(path)

@pytest.mark.parametrize("path, hierarchy", (
  (None, [""]),
  ("", [""]),
  ("foo", ["", "foo"]),
  ("foo/bar/baz", ["", "foo", "foo/bar", "foo/bar/baz"]),
))
def test_hierarchy_parsed_correctly(path, hierarchy):
    config_set = ConfigSet(path)
    assert hierarchy == config_set.hierarchy
