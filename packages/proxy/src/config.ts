import { readFileSync } from 'node:fs';
import CONFIGU_PKG from '../package.json';

// The host address to serve the HTTP server on.
const CONFIGU_HTTP_ADDR = process.env.CONFIGU_HTTP_ADDR ?? '0.0.0.0';
// The host port to serve the HTTP server on.
const CONFIGU_HTTP_PORT = Number(process.env.CONFIGU_HTTP_PORT ?? 3000);
// Enables or disables transport layer security (TLS).
const CONFIGU_HTTP_TLS_ENABLED = (process.env.CONFIGU_HTTP_TLS_ENABLED ?? 'false') === 'true';
// The (absolute) file path of the certificate to use for the TLS connection.
const CONFIGU_HTTP_TLS_CERT = CONFIGU_HTTP_TLS_ENABLED ? process.env.CONFIGU_HTTP_TLS_CERT : undefined;
// The (absolute) file path of the TLS key that should be used for the TLS connection.
const CONFIGU_HTTP_TLS_KEY = CONFIGU_HTTP_TLS_ENABLED ? process.env.CONFIGU_HTTP_TLS_KEY : undefined;
// Comma-separated list of origins that are allowed to make requests to the server.
const CONFIGU_HTTP_ALLOWED_ORIGINS = (process.env.CONFIGU_HTTP_CORS ?? '*').split(',');
// Enables or disables the trust proxy setting.
const CONFIGU_HTTP_TRUST_PROXY = (process.env.CONFIGU_HTTP_TRUST_PROXY ?? 'false') === 'true';
// Enables or disables request logging.
const CONFIGU_LOG_ENABLED = (process.env.CONFIGU_LOG_ENABLED ?? 'true') === 'true';
// The (absolute) file path of the .configu configuration file.
const CONFIGU_CONFIG_FILE = process.env.CONFIGU_CONFIG_FILE ?? '.configu';

let HTTPS_CONFIG: { cert?: Buffer; key?: Buffer } | null = null;
if (CONFIGU_HTTP_TLS_ENABLED) {
  if (!CONFIGU_HTTP_TLS_CERT || !CONFIGU_HTTP_TLS_KEY) {
    throw new Error('CONFIGU_HTTP_TLS_CERT and CONFIGU_HTTP_TLS_KEY must be set when CONFIGU_HTTP_TLS_ENABLED is true');
  }
  HTTPS_CONFIG = {
    cert: readFileSync(CONFIGU_HTTP_TLS_CERT),
    key: readFileSync(CONFIGU_HTTP_TLS_KEY),
  };
}

export const config = {
  CONFIGU_PKG,
  CONFIGU_HTTP_ADDR,
  CONFIGU_HTTP_PORT,
  CONFIGU_HTTP_ALLOWED_ORIGINS,
  CONFIGU_HTTP_TRUST_PROXY,
  CONFIGU_LOG_ENABLED,
  CONFIGU_CONFIG_FILE,
  HTTPS_CONFIG,
};
