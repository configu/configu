module.exports = {
  '**/*.py?(x)': (filenames) => [
    'black configu',
    'flake8 configu',
    'pytest'
  ],
};
