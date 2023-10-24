# Set base image
FROM ubuntu:latest

# Maintainer
LABEL maintainer="dev@configu.com"

# Set environment variables for non-interactive apt installs
ENV DEBIAN_FRONTEND=non-interactive
ENV HOME /root
ENV PATH $HOME/.local/bin:$PATH

# Arguments for versions
ARG NODE_VERSION
ARG PYTHON_VERSION
ARG GO_VERSION

# Validate ARGS
RUN if [ -z "$NODE_VERSION" ]; then echo "NODE_VERSION argument is required" && exit 1; fi && \
  if [ -z "$PYTHON_VERSION" ]; then echo "PYTHON_VERSION argument is required" && exit 1; fi && \
  if [ -z "$GO_VERSION" ]; then echo "GO_VERSION argument is required" && exit 1; fi

# Install basic dev tools
RUN apt-get update && apt-get install -y \
  git curl build-essential libssl-dev zlib1g-dev libbz2-dev \
  libreadline-dev libsqlite3-dev wget llvm libncurses5-dev libncursesw5-dev \
  xz-utils tk-dev libffi-dev liblzma-dev python3-openssl && \
  rm -rf /var/lib/apt/lists/*

# Install nvm and then install Node.js and npm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && \
  . $HOME/.nvm/nvm.sh && nvm install $NODE_VERSION

# Install pyenv and Python
RUN curl https://pyenv.run | bash
ENV PATH $HOME/.pyenv/shims:$HOME/.pyenv/bin:$PATH
RUN pyenv install $PYTHON_VERSION && pyenv global $PYTHON_VERSION

# Install poetry globally
RUN curl -sSL https://install.python-poetry.org | python3 -

# Install goenv and Go
RUN git clone https://github.com/syndbg/goenv.git ~/.goenv && \
  echo 'export GOENV_ROOT="$HOME/.goenv"' >> ~/.bashrc && \
  echo 'export PATH="$GOENV_ROOT/bin:$PATH"' >> ~/.bashrc && \
  echo 'eval "$(goenv init -)"' >> ~/.bashrc && \
  . ~/.bashrc && \
  goenv install $GO_VERSION && \
  goenv global $GO_VERSION && \
  go install golang.org/x/tools/gopls@latest

# Install configu CLI
RUN curl https://cli.configu.com/install.sh | sh

# Cleanup
RUN apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Default command
CMD ["/bin/bash"]
