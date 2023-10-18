# Set base image
FROM ubuntu:latest

# Maintainer
LABEL maintainer="dev@configu.com"

# Set environment variables to non-interactive (this ensures apt-get won't ask questions)
ENV DEBIAN_FRONTEND=non-interactive

# Arguments for versions
ARG NODE_VERSION="18.15.0"
ARG PYTHON_VERSION="3.9.16"
ARG GO_VERSION="go1.21.3"

# Install basic dev tools
RUN apt-get update && \
  apt-get install -y git curl build-essential libssl-dev zlib1g-dev libbz2-dev \
  libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
  xz-utils tk-dev libffi-dev liblzma-dev python3-openssl git ca-certificates && \
  apt-get clean

# Install nvm with node and npm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && \
  . $HOME/.nvm/nvm.sh && \
  nvm install $NODE_VERSION && \
  nvm use $NODE_VERSION

# Install pyenv
RUN curl https://pyenv.run | bash

# Adjust PATH for pyenv
ENV HOME /root
ENV PATH $HOME/.pyenv/shims:$HOME/.pyenv/bin:$PATH

# Install Python with pyenv
RUN pyenv install $PYTHON_VERSION && \
  pyenv global $PYTHON_VERSION

# Install poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
RUN poetry env use $HOME/.pyenv/shims/python

# Install gvm to manage Go versions
RUN bash -c 'bash < <(curl -s -S -L https://raw.githubusercontent.com/moovweb/gvm/master/binscripts/gvm-installer)'

# Install Go using gvm
RUN /bin/bash -c "source $HOME/.gvm/scripts/gvm && gvm install $GO_VERSION --default"

# Cleanup
RUN apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Define the default command
CMD ["/bin/bash"]
