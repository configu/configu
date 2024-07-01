# @configu/proxy

Configu Proxy Service.

## Overview

The `@configu/proxy` interface is designed as a multi-channel, stateless server solution, adept at managing configurations from a ConfigStore across various channels.

See [interfaces/proxy](https://docs.configu.com/interfaces/proxy/overview).

## Usage

```bash
docker run --rm -it \
  -v /Users/ran/dev/configu/packages/proxy/.configu:/config/.configu \
  -e CONFIGU_CONFIG_FILE=/config/.configu \
  -p 8080:8080 \
  configu/proxy
```

## Configuration

- **CONFIGU_HTTP_ADDR**: The host address to serve the HTTP server on.
- **CONFIGU_HTTP_PORT**: The host port to serve the HTTP server on.
- **CONFIGU_HTTP_TLS_ENABLED**: Enables or disables transport layer security (TLS).
- **CONFIGU_HTTP_TLS_CERT**: The (absolute) file path of the certificate to use for the TLS connection.
- **CONFIGU_HTTP_TLS_KEY**: The (absolute) file path of the TLS key that should be used for the TLS connection.
- **CONFIGU_HTTP_ALLOWED_ORIGINS**: Comma-separated list of origins that are allowed to make requests to the server.
- **CONFIGU_HTTP_TRUST_PROXY**: Enables or disables the trust proxy setting.
- **CONFIGU_LOG_ENABLED**: Enables or disables request logging.
- **CONFIGU_CONFIG_FILE**: The (absolute) file path of the .configu configuration file.
