module.exports = {
  '**/*.py?(x)': (filenames) => filenames.flatMap(filename => [`black ${filename}`, `flake8 ${filename}`]).concat(['pytest']),
};
