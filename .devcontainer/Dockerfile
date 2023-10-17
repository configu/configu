# Use the latest Ubuntu base image
FROM ubuntu:latest

# Avoid prompts with apt
ENV DEBIAN_FRONTEND=noninteractive

# Update and install common tools
RUN apt-get update && apt-get install -y \
  curl \
  git \
  git-lfs \
  build-essential \
  libssl-dev \
  zlib1g-dev \
  libbz2-dev \
  libreadline-dev \
  libsqlite3-dev \
  wget \
  llvm \
  libncurses5-dev \
  xz-utils \
  tk-dev \
  libxml2-dev \
  libxmlsec1-dev \
  libffi-dev \
  liblzma-dev \
  sudo

# Copy version files
COPY ["../.nvmrc", "../py/.python-version", "/"]

# Install Node.js and npm using NVM
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
  && . ~/.nvm/nvm.sh \
  && nvm install \
  && nvm alias default $(cat /.nvmrc) \
  && nvm use default

# Install pyenv and Python
RUN curl https://pyenv.run | bash \
  && echo 'export PATH="$HOME/.pyenv/bin:$PATH"' >> ~/.bashrc \
  && echo 'eval "$(pyenv init --path)"' >> ~/.bashrc \
  && echo 'eval "$(pyenv virtualenv-init -)"' >> ~/.bashrc \
  && . ~/.bashrc \
  && pyenv install \
  && pyenv global $(cat .python-version)

# Install Poetry for Python
RUN curl -sSL https://install.python-poetry.org | bash \
  && poetry env use $(pyenv which python)

# Install gvm and the latest Go version
RUN apt-get install -y bison
RUN bash < <(curl -s -S -L https://raw.githubusercontent.com/moovweb/gvm/master/binscripts/gvm-installer) \
  gvm install go1.21.3 && \
  gvm use go1.21.3 --default

# Clean up
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set default shell to bash (vs sh)
SHELL ["/bin/bash", "-c"]
