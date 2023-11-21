module.exports = {
  '**/*.py?(x)': (filenames) => [
    'poetry run black configu',
    'poetry run flake8 configu',
    'poetry run mypy configu',
    'poetry run pytest',
  ]
};
