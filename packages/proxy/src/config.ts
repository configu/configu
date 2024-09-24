import { readFileSync } from 'node:fs';
import { ServerOptions } from 'node:https';
import CONFIGU_PKG from '../package.json';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isProd = NODE_ENV === 'production';

// The host address to serve the HTTP server on.
const CONFIGU_HTTP_ADDR = process.env.CONFIGU_HTTP_ADDR ?? '0.0.0.0';
// The host port to serve the HTTP server on.
const CONFIGU_HTTP_PORT = Number(process.env.CONFIGU_HTTP_PORT ?? 8080);
// Enables or disables transport layer security (TLS).
const CONFIGU_HTTP_TLS_ENABLED = (process.env.CONFIGU_HTTP_TLS_ENABLED ?? 'false') === 'true';
// The (absolute) file path of the certificate to use for the TLS connection.
const CONFIGU_HTTP_TLS_CERT = CONFIGU_HTTP_TLS_ENABLED ? process.env.CONFIGU_HTTP_TLS_CERT : undefined;
// The (absolute) file path of the TLS key that should be used for the TLS connection.
const CONFIGU_HTTP_TLS_KEY = CONFIGU_HTTP_TLS_ENABLED ? process.env.CONFIGU_HTTP_TLS_KEY : undefined;
// Enables or disables the authentication mechanism.
const CONFIGU_AUTH_ENABLED = (process.env.CONFIGU_AUTH_ENABLED ?? 'false') === 'true';
// Comma-separated list of preshared tokens that are allowed to access the server.
const CONFIGU_AUTH_PRESHARED_KEYS = process.env.CONFIGU_AUTH_PRESHARED_KEYS?.split(',') ?? [];
// The public URL of the server.
const CONFIGU_PUBLIC_URL =
  process.env.CONFIGU_PUBLIC_URL ?? `${CONFIGU_HTTP_TLS_ENABLED ? 'https' : 'http'}://localhost:${CONFIGU_HTTP_PORT}`;
// Comma-separated list of origins that are allowed to make requests to the server.
const CONFIGU_HTTP_ALLOWED_ORIGINS = (process.env.CONFIGU_HTTP_CORS ?? '*').split(',');
// Enables or disables the trust proxy setting.
const CONFIGU_HTTP_TRUST_PROXY = (process.env.CONFIGU_HTTP_TRUST_PROXY ?? 'false') === 'true';
// Enables or disables request logging.
const CONFIGU_LOG_ENABLED = (process.env.CONFIGU_LOG_ENABLED ?? 'true') === 'true';
// Enables or disables the api reference documentation.
const CONFIGU_DOCS_ENABLED = (process.env.CONFIGU_DOCS_ENABLED ?? 'true') === 'true';
// The (absolute) file path of the .configu configuration file.
const CONFIGU_CONFIG_FILE = process.env.CONFIGU_CONFIG_FILE ?? '.configu';
// TODO: decide naming
const CONFIGU_STORES_CACHE_DIR = process.env.CONFIGU_STORES_CACHE_DIR ?? 'cache/stores';

let HTTPS_CONFIG: ServerOptions | null = null;
if (CONFIGU_HTTP_TLS_ENABLED) {
  if (!CONFIGU_HTTP_TLS_CERT || !CONFIGU_HTTP_TLS_KEY) {
    throw new Error('CONFIGU_HTTP_TLS_CERT and CONFIGU_HTTP_TLS_KEY must be set when CONFIGU_HTTP_TLS_ENABLED is true');
  }
  HTTPS_CONFIG = {
    cert: readFileSync(CONFIGU_HTTP_TLS_CERT),
    key: readFileSync(CONFIGU_HTTP_TLS_KEY),
  };
}

if (CONFIGU_AUTH_ENABLED && CONFIGU_AUTH_PRESHARED_KEYS.length === 0) {
  throw new Error('CONFIGU_AUTH_PRESHARED_KEYS must be set when CONFIGU_AUTH_ENABLED is true');
}

export const config = {
  NODE_ENV,
  isProd,
  CONFIGU_PKG,
  CONFIGU_HTTP_ADDR,
  CONFIGU_HTTP_PORT,
  HTTPS_CONFIG,
  CONFIGU_AUTH_ENABLED,
  CONFIGU_AUTH_PRESHARED_KEYS,
  CONFIGU_PUBLIC_URL,
  CONFIGU_HTTP_ALLOWED_ORIGINS,
  CONFIGU_HTTP_TRUST_PROXY,
  CONFIGU_LOG_ENABLED,
  CONFIGU_DOCS_ENABLED,
  CONFIGU_CONFIG_FILE,
  CONFIGU_STORES_CACHE_DIR,
};
