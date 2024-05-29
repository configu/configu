FROM node

LABEL maintainer="dev@configu.com"

COPY [".nvmrc", "package.json", "pnpm-lock.yaml", "./"]

# Install nvm and then install Node.js version specified in .nvmrc
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && \
  nvm install

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN su node -c "corepack enable"

RUN su node -c "pnpm fetch"

# Install configu CLI
RUN su node -c "curl https://cli.configu.com/install.sh | sh"

# Default command
CMD ["/bin/bash"]
