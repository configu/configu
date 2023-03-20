module.exports = {
  '**/*.py?(x)': (filenames) => [
    `echo ${filenames}`,
  ],
};
