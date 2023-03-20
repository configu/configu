module.exports = {
  '**/*.py?(x)': (filenames) => [
    `black ${filenames}`,
  ],
};
