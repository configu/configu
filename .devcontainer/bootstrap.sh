#!/bin/bash

echo "Bootstrapping Configu Repo ... 🚀"

# Run npm install in the root directory
npm install

# Run the other commands in parallel
(cd ts && npm install && npm run build) &
(cd py && poetry env use $(pyenv which python) && poetry install && poetry build) &
(cd go && go install) &

# Wait for all parallel tasks to complete
wait

# Update configu cli
if [ -x "$(command -v configu)" ]; then
  configu update
fi

echo "Successfully bootstrapped Configu Repo! 🎉"
